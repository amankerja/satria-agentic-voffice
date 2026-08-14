import type {
  AgentRuntime,
  RuntimeMode,
  AgentRunInput,
  RuntimeEvent,
  RuntimeTelemetry
} from '../types'
import type { RunStep, RunLogEntry, AgentRunStatus } from '../../types'
import { globalMockRunner } from '../../services/mockAgentRunner'

export class MockRuntimeAdapter implements AgentRuntime {
  public readonly mode: RuntimeMode = 'mock'
  private runInputs = new Map<string, AgentRunInput>()
  private listeners = new Map<string, (event: RuntimeEvent) => void>()
  private startTimestamps = new Map<string, number>()

  async start(input: AgentRunInput, onEvent: (event: RuntimeEvent) => void): Promise<void> {
    const { runId } = input
    this.runInputs.set(runId, input)
    this.listeners.set(runId, onEvent)
    this.startTimestamps.set(runId, performance.now())

    onEvent({
      type: 'run:started',
      runId,
      timestamp: new Date().toISOString(),
      step: 'Initializing',
      progress: 5,
      log: {
        id: `log-${Date.now()}-adapter-init`,
        timestamp: new Date().toLocaleTimeString(),
        step: 'Initializing',
        message: `[Mock Runtime] Initialized environment for ${input.employee.name} (${input.employee.roleName}).`,
        level: 'info'
      }
    })

    globalMockRunner.start(
      runId,
      5,
      {
        onProgress: (progress: number, step: RunStep, log: RunLogEntry) => {
          onEvent({
            type: 'progress:updated',
            runId,
            timestamp: new Date().toISOString(),
            progress,
            step,
            log
          })
        },
        onStatusChange: (status: AgentRunStatus) => {
          const startTime = this.startTimestamps.get(runId) || performance.now()
          const durationMs = Math.round(performance.now() - startTime)

          const telemetry: RuntimeTelemetry = {
            promptTokens: 420,
            completionTokens: 850,
            totalTokens: 1270,
            cachedTokens: 128,
            model: 'mock-agent-simulation-v1',
            provider: 'satria-in-memory',
            durationMs,
            estimatedCostUsd: 0.0
          }

          if (status === 'Completed') {
            onEvent({
              type: 'run:completed',
              runId,
              timestamp: new Date().toISOString(),
              step: 'Completing',
              progress: 100,
              telemetry
            })
          } else if (status === 'Cancelled') {
            onEvent({
              type: 'run:cancelled',
              runId,
              timestamp: new Date().toISOString()
            })
          } else if (status === 'Failed') {
            onEvent({
              type: 'run:failed',
              runId,
              timestamp: new Date().toISOString(),
              error: 'Execution terminated unexpectedly.'
            })
          } else if (status === 'Waiting') {
            onEvent({
              type: 'run:paused',
              runId,
              timestamp: new Date().toISOString()
            })
          }
        }
      }
    )
  }

  async pause(runId: string): Promise<void> {
    globalMockRunner.pause(runId)
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
    globalMockRunner.resume(runId)
  }

  async cancel(runId: string): Promise<void> {
    globalMockRunner.cancel(runId)
    this.runInputs.delete(runId)
    this.listeners.delete(runId)
    this.startTimestamps.delete(runId)
  }

  async retry(runId: string, _attempt: number): Promise<void> {
    globalMockRunner.stop(runId)
    const input = this.runInputs.get(runId)
    const listener = this.listeners.get(runId)
    if (input && listener) {
      await this.start(input, listener)
    }
  }

  async respondApproval(runId: string, approvalId: string, approved: boolean, feedback?: string): Promise<void> {
    const listener = this.listeners.get(runId)
    if (listener) {
      listener({
        type: 'approval:resolved',
        runId,
        timestamp: new Date().toISOString(),
        log: {
          id: `log-${Date.now()}-apprv`,
          timestamp: new Date().toLocaleTimeString(),
          step: 'Working',
          message: approved
            ? `[Approval Granted] User confirmed action ${approvalId}. Resuming execution.`
            : `[Approval Rejected] Action ${approvalId} denied by user: ${feedback || 'No feedback specified'}.`,
          level: approved ? 'info' : 'warn'
        }
      })
      if (approved) {
        globalMockRunner.resume(runId)
      } else {
        globalMockRunner.cancel(runId)
      }
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; latencyMs: number; message: string }> {
    return {
      healthy: true,
      latencyMs: 1,
      message: 'Mock Runtime is active and healthy (In-Memory Engine).'
    }
  }
}
