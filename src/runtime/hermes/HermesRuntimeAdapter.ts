import type {
  AgentRuntime,
  RuntimeMode,
  AgentRunInput,
  RuntimeEvent
} from '../types'
import { HermesClient } from './HermesClient'
import { HermesMapper } from './HermesMapper'
import { AgentRuntimeError } from '../RuntimeError'
import { globalResultIngestor } from '../results/ResultIngestor'
import type { HermesExecution } from './hermesContract'

export interface HermesRunState {
  runId: string // Satria Logical Run ID
  execution?: HermesExecution
  hermesRunId?: string
  sessionId?: string
  status:
    | 'starting'
    | 'running'
    | 'paused'
    | 'waiting_approval'
    | 'completed'
    | 'failed'
    | 'cancelled'
  input: AgentRunInput
  listener: (event: RuntimeEvent) => void
  closeStream?: () => void
  retryCount: number
}

export class HermesRuntimeAdapter implements AgentRuntime {
  public readonly mode: RuntimeMode = 'hermes'
  private client: HermesClient
  private runs = new Map<string, HermesRunState>()

  constructor(client?: HermesClient) {
    this.client = client || new HermesClient()
  }

  public getRunState(runId: string): HermesRunState | undefined {
    return this.runs.get(runId)
  }

  async start(input: AgentRunInput, onEvent: (event: RuntimeEvent) => void): Promise<void> {
    const satriaRunId = input.runId

    // Check for active duplicate runs
    const existing = this.runs.get(satriaRunId)
    if (
      existing &&
      (existing.status === 'running' ||
        existing.status === 'starting' ||
        existing.status === 'paused' ||
        existing.status === 'waiting_approval')
    ) {
      throw new AgentRuntimeError(
        'CONFLICT',
        `Run ${satriaRunId} is already active with status '${existing.status}'.`,
        satriaRunId
      )
    }

    const state: HermesRunState = {
      runId: satriaRunId,
      status: 'starting',
      input,
      listener: onEvent,
      retryCount: existing?.retryCount ?? 0
    }
    this.runs.set(satriaRunId, state)

    onEvent({
      type: 'run:started',
      runId: satriaRunId,
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
      const { run_id: hermesRunId } = await this.client.initiateRun(payload)
      
      const currentRun = this.runs.get(satriaRunId)
      if (!currentRun || currentRun.status === 'cancelled') {
        // Run was cancelled while initiateRun was in flight
        return
      }

      currentRun.hermesRunId = hermesRunId
      currentRun.execution = {
        satriaRunId,
        hermesRunId,
        attempt: (currentRun.retryCount || 0) + 1
      }
      currentRun.status = 'running'

      const closeStream = this.client.connectEventStream(
        hermesRunId,
        (rawEvent: any) => {
          const runState = this.runs.get(satriaRunId)
          if (!runState) return

          if (rawEvent?.session_id || rawEvent?.sessionId) {
            const sid = rawEvent.session_id || rawEvent.sessionId
            runState.sessionId = sid
            if (runState.execution) {
              runState.execution.sessionId = sid
            }
          }

          const event = HermesMapper.fromHermesEvent(rawEvent, satriaRunId)

          // Ingest streaming deltas and outputs
          if (rawEvent?.delta || rawEvent?.content) {
            globalResultIngestor.appendOutputDelta(satriaRunId, rawEvent.delta || rawEvent.content)
          }
          if (rawEvent?.output) {
            globalResultIngestor.setFullOutput(satriaRunId, rawEvent.output)
          }
          if (event.toolResult) {
            globalResultIngestor.recordToolExecution(
              satriaRunId,
              event.toolResult.toolName,
              event.toolResult.output,
              event.toolResult.diff,
              event.toolResult.success
            )
          }
          if (event.telemetry) {
            globalResultIngestor.setTelemetry(satriaRunId, event.telemetry)
          }

          if (event.type === 'run:completed') {
            runState.status = 'completed'
            event.result = globalResultIngestor.buildRuntimeResult(satriaRunId, 'Completed', event.log?.message)
            this.cleanupRun(satriaRunId)
          } else if (event.type === 'run:failed') {
            runState.status = 'failed'
            event.result = globalResultIngestor.buildRuntimeResult(satriaRunId, 'Failed', event.error)
            this.cleanupRun(satriaRunId)
          } else if (event.type === 'run:cancelled') {
            runState.status = 'cancelled'
            event.result = globalResultIngestor.buildRuntimeResult(satriaRunId, 'Cancelled')
            this.cleanupRun(satriaRunId)
          } else if (event.type === 'approval:required') {
            runState.status = 'waiting_approval'
          }

          onEvent(event)
        },
        (err: any) => {
          const runState = this.runs.get(satriaRunId)
          if (!runState) return
          runState.status = 'failed'
          this.cleanupRun(satriaRunId)
          onEvent({
            type: 'run:failed',
            runId: satriaRunId,
            timestamp: new Date().toISOString(),
            error: `Hermes streaming connection interrupted: ${err?.message || 'Network error'}`
          })
        }
      )

      currentRun.closeStream = closeStream
    } catch (e: any) {
      const errorMsg = `Hermes execution failed: ${e.message || 'Unable to connect to Hermes daemon'}`
      const currentRun = this.runs.get(satriaRunId)
      if (currentRun) {
        currentRun.status = 'failed'
        this.cleanupRun(satriaRunId)
      }

      onEvent({
        type: 'run:failed',
        runId: satriaRunId,
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
      throw new AgentRuntimeError('NETWORK_FAILURE', errorMsg, satriaRunId, true, e)
    }
  }

  private cleanupRun(runId: string): void {
    const run = this.runs.get(runId)
    if (run && run.closeStream) {
      run.closeStream()
      run.closeStream = undefined
    }
  }

  async pause(runId: string): Promise<void> {
    const run = this.runs.get(runId)
    const targetId = run?.hermesRunId || run?.sessionId
    if (!run || !targetId) {
      throw new AgentRuntimeError(
        'SESSION_NOT_FOUND',
        `Cannot pause run ${runId}: active Hermes session not found.`,
        runId
      )
    }

    await this.client.stopRun(targetId)
    run.status = 'paused'
    run.listener({
      type: 'run:paused',
      runId,
      timestamp: new Date().toISOString()
    })
  }

  async resume(runId: string): Promise<void> {
    const run = this.runs.get(runId)
    const targetId = run?.hermesRunId || run?.sessionId
    if (!run || !targetId) {
      throw new AgentRuntimeError(
        'SESSION_NOT_FOUND',
        `Cannot resume run ${runId}: active Hermes session not found.`,
        runId
      )
    }

    await this.client.sendSignal(targetId, 'resume')
    run.status = 'running'
  }

  async cancel(runId: string): Promise<void> {
    const run = this.runs.get(runId)
    const targetId = run?.hermesRunId || run?.sessionId
    if (run && targetId) {
      try {
        await this.client.stopRun(targetId)
      } catch {
        // Ignore network cancel errors on termination
      }
    }
    if (run) {
      run.status = 'cancelled'
      this.cleanupRun(runId)
      run.hermesRunId = undefined
      run.sessionId = undefined
    }
  }

  async retry(runId: string, attempt: number): Promise<void> {
    const run = this.runs.get(runId)
    const listener = run?.listener

    if (attempt > 3) {
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

    if (!run || !listener) {
      throw new AgentRuntimeError(
        'INTERNAL_ERROR',
        `Cannot retry run ${runId}: execution input not found.`,
        runId
      )
    }

    const savedInput = run.input
    // Stop prior execution streams cleanly
    await this.cancel(runId)

    // Reset status to allow re-start
    run.status = 'starting'
    run.retryCount = attempt
    this.runs.delete(runId)

    await this.start(savedInput, listener)
  }

  async respondApproval(
    runId: string,
    approvalId: string,
    approved: boolean,
    feedback?: string
  ): Promise<void> {
    const run = this.runs.get(runId)
    const targetId = run?.hermesRunId || run?.sessionId
    if (run && targetId) {
      await this.client.respondApproval(targetId, {
        approval_id: approvalId,
        choice: approved ? 'once' : 'deny',
        message: feedback,
        approved,
        feedback
      })
    }

    if (run) {
      run.listener({
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

      if (!approved) {
        run.status = 'cancelled'
        this.cleanupRun(runId)
      } else {
        run.status = 'running'
      }
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
