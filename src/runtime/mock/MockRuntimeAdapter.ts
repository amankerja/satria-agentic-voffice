import type {
  AgentRuntime,
  RuntimeMode,
  AgentRunInput,
  RuntimeEvent,
  RuntimeTelemetry
} from '../types'
import type { RunStep, RunLogEntry, AgentRunStatus } from '../../types'
import { globalMockRunner } from '../../services/mockAgentRunner'
import { sanitizeRuntimeEvent } from '../security/RuntimeEventSanitizer'

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

    onEvent(sanitizeRuntimeEvent({
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
    }))

    globalMockRunner.start(
      runId,
      5,
      {
        onProgress: (progress: number, step: RunStep, log: RunLogEntry) => {
          const startTime = this.startTimestamps.get(runId) || performance.now()
          const durationMs = Math.round(performance.now() - startTime)
          const promptTokens = 420 + Math.round(progress * 15)
          const completionTokens = 150 + Math.round(progress * 25)
          const telemetry: RuntimeTelemetry = {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            cachedTokens: 128,
            model: 'mock-agent-simulation-v1',
            provider: 'satria-in-memory',
            durationMs,
            estimatedCostUsd: 0.0
          }

          onEvent(sanitizeRuntimeEvent({
            type: 'progress:updated',
            runId,
            timestamp: new Date().toISOString(),
            progress,
            step,
            log,
            telemetry
          }))
        },
        onStatusChange: (status: AgentRunStatus) => {
          const startTime = this.startTimestamps.get(runId) || performance.now()
          const durationMs = Math.round(performance.now() - startTime)

          const promptTokens = 1920
          const completionTokens = 2650
          const telemetry: RuntimeTelemetry = {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            cachedTokens: 128,
            model: 'mock-agent-simulation-v1',
            provider: 'satria-in-memory',
            durationMs,
            estimatedCostUsd: 0.0
          }

          if (status === 'Completed') {
            onEvent(sanitizeRuntimeEvent({
              type: 'run:completed',
              runId,
              timestamp: new Date().toISOString(),
              step: 'Completing',
              progress: 100,
              telemetry
            }))
          } else if (status === 'Cancelled') {
            onEvent(sanitizeRuntimeEvent({
              type: 'run:cancelled',
              runId,
              timestamp: new Date().toISOString()
            }))
          } else if (status === 'Failed') {
            onEvent(sanitizeRuntimeEvent({
              type: 'run:failed',
              runId,
              timestamp: new Date().toISOString(),
              error: 'Execution terminated unexpectedly.'
            }))
          } else if (status === 'Waiting') {
            onEvent(sanitizeRuntimeEvent({
              type: 'run:paused',
              runId,
              timestamp: new Date().toISOString()
            }))
          }
        }
      }
    )
  }

  async pause(runId: string): Promise<void> {
    globalMockRunner.pause(runId)
    const listener = this.listeners.get(runId)
    if (listener) {
      listener(sanitizeRuntimeEvent({
        type: 'run:paused',
        runId,
        timestamp: new Date().toISOString()
      }))
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
      listener(sanitizeRuntimeEvent({
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
      }))
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

  async probeRunStatus(runId: string): Promise<{ active: boolean; status?: string; details?: string }> {
    const isRunning = globalMockRunner.isRunnerActive(runId)
    return {
      active: isRunning,
      status: isRunning ? 'running' : 'inactive',
      details: isRunning ? 'Mock runner active in memory' : 'No active mock runner process found'
    }
  }
}
