import type {
  AgentRuntime,
  RuntimeMode,
  AgentRunInput,
  RuntimeEvent
} from '../types'
import { HermesClient } from './HermesClient'
import { HermesMapper } from './HermesMapper'
import { AgentRuntimeError } from '../RuntimeError'

export class HermesRuntimeAdapter implements AgentRuntime {
  public readonly mode: RuntimeMode = 'hermes'
  private client: HermesClient
  private activeStreams = new Map<string, () => void>()
  private sessionMap = new Map<string, string>() // runId -> sessionId
  private runInputs = new Map<string, AgentRunInput>()
  private listeners = new Map<string, (event: RuntimeEvent) => void>()

  constructor(client?: HermesClient) {
    this.client = client || new HermesClient()
  }

  async start(input: AgentRunInput, onEvent: (event: RuntimeEvent) => void): Promise<void> {
    const { runId } = input
    this.runInputs.set(runId, input)
    this.listeners.set(runId, onEvent)

    onEvent({
      type: 'run:started',
      runId,
      timestamp: new Date().toISOString(),
      step: 'Initializing',
      progress: 5,
      log: {
        id: `log-${Date.now()}-hermes-init`,
        timestamp: new Date().toLocaleTimeString(),
        step: 'Initializing',
        message: `Connecting to Hermes Agent Runtime for ${input.employee.name} (${input.employee.roleName})...`,
        level: 'info'
      }
    })

    try {
      const payload = HermesMapper.toHermesPayload(input)
      const { sessionId } = await this.client.initiateRun(payload)
      this.sessionMap.set(runId, sessionId)

      const closeStream = this.client.connectEventStream(
        sessionId,
        (rawEvent) => {
          const event = HermesMapper.fromHermesEvent(rawEvent, runId)
          onEvent(event)
        },
        (err) => {
          onEvent({
            type: 'run:failed',
            runId,
            timestamp: new Date().toISOString(),
            error: `Hermes streaming connection interrupted: ${err?.message || 'Network error'}`
          })
        }
      )

      this.activeStreams.set(runId, closeStream)
    } catch (e: any) {
      const errorMsg = `Hermes execution failed: ${e.message || 'Unable to connect to Hermes daemon'}`
      onEvent({
        type: 'run:failed',
        runId,
        timestamp: new Date().toISOString(),
        error: errorMsg,
        log: {
          id: `log-${Date.now()}-hermes-err`,
          timestamp: new Date().toLocaleTimeString(),
          step: 'Initializing',
          message: errorMsg,
          level: 'error'
        }
      })
      throw new AgentRuntimeError('NETWORK_FAILURE', errorMsg, runId, true, e)
    }
  }

  async pause(runId: string): Promise<void> {
    const sessionId = this.sessionMap.get(runId)
    if (sessionId) {
      await this.client.sendSignal(sessionId, 'pause')
    }
    const listener = this.listeners.get(runId)
    if (listener) {
      listener({
        type: 'run:paused',
        runId,
        timestamp: new Date().toISOString()
      })
    }
  }

  async resume(runId: string): Promise<void> {
    const sessionId = this.sessionMap.get(runId)
    if (sessionId) {
      await this.client.sendSignal(sessionId, 'resume')
    }
  }

  private stopExecutionStreams(runId: string) {
    const closeStream = this.activeStreams.get(runId)
    if (closeStream) {
      closeStream()
      this.activeStreams.delete(runId)
    }
  }

  async cancel(runId: string): Promise<void> {
    const sessionId = this.sessionMap.get(runId)
    if (sessionId) {
      try {
        await this.client.sendSignal(sessionId, 'cancel')
      } catch {
        // Ignore network cancel errors on termination
      }
    }
    this.stopExecutionStreams(runId)
    this.sessionMap.delete(runId)
  }

  async retry(runId: string, attempt: number): Promise<void> {
    if (attempt > 3) {
      const listener = this.listeners.get(runId)
      if (listener) {
        listener({
          type: 'run:failed',
          runId,
          timestamp: new Date().toISOString(),
          error: `Maximum retry limit of 3 attempts exceeded for run ${runId}.`
        })
      }
      return
    }

    const input = this.runInputs.get(runId)
    const listener = this.listeners.get(runId)
    
    // Stop prior execution streams cleanly
    await this.cancel(runId)

    if (input && listener) {
      await this.start(input, listener)
    } else {
      throw new AgentRuntimeError('INTERNAL_ERROR', `Cannot retry run ${runId}: execution input not found.`, runId)
    }
  }

  async respondApproval(runId: string, approvalId: string, approved: boolean, feedback?: string): Promise<void> {
    const sessionId = this.sessionMap.get(runId)
    if (sessionId) {
      await this.client.sendSignal(sessionId, 'approval', {
        approvalId,
        approved,
        feedback
      })
    }
    const listener = this.listeners.get(runId)
    if (listener) {
      listener({
        type: 'approval:resolved',
        runId,
        timestamp: new Date().toISOString(),
        log: {
          id: `log-${Date.now()}-hermes-apprv`,
          timestamp: new Date().toLocaleTimeString(),
          step: 'Working',
          message: approved
            ? `[Hermes Approval Granted] User approved action ${approvalId}. Resuming execution.`
            : `[Hermes Approval Rejected] Action ${approvalId} rejected: ${feedback || 'No feedback'}`,
          level: approved ? 'info' : 'warn'
        }
      })
    }

    if (!approved) {
      this.stopExecutionStreams(runId)
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    const res = await this.client.healthCheck()
    return {
      healthy: res.ok,
      latencyMs: res.latencyMs,
      message: res.ok
        ? `Hermes Agent Runtime is ONLINE (v${res.version || '1.0.0'}, Latency: ${res.latencyMs}ms).`
        : `Hermes Agent Runtime is OFFLINE (${res.error || 'Connection refused'}).`
    }
  }
}
