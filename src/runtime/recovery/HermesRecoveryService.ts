import { RuntimeFactory } from '../RuntimeFactory'
import type { AgentRunStatus, Task, AgentRun } from '../../types'
import {
  MockAgentRunRepository,
  MockTaskRepository
} from '../../repositories'

export interface OrphanRunReport {
  runId: string
  taskId: string
  taskTitle: string
  employeeId: string
  employeeName: string
  status: AgentRunStatus
  runtime?: string
  workspacePath?: string
  startedAt?: string
  lastHeartbeatAt?: string
  attempt: number
  parentRunId?: string
  isRuntimeAlive: boolean
  runtimeStatus: string
  timeSinceLastHeartbeatMs: number
  isHeartbeatStale: boolean
  diagnosis: 'DEAD_RUNTIME' | 'DEAD_SESSION' | 'STALE_HEARTBEAT' | 'ALIVE_STREAMABLE' | 'UNKNOWN'
  recommendedAction: 'mark_failed' | 'retry' | 'resume'
  suggestedDirective?: string
}

export class HermesRecoveryService {
  private runRepo: MockAgentRunRepository
  private taskRepo: MockTaskRepository

  constructor(runRepo?: MockAgentRunRepository, taskRepo?: MockTaskRepository) {
    this.runRepo = runRepo || new MockAgentRunRepository()
    this.taskRepo = taskRepo || new MockTaskRepository()
  }

  /**
   * Scans database for orphan runs that were left in active states
   * when Hermes crashed, SATRIA restarted, or when heartbeat exceeded threshold.
   */
  async detectOrphanRuns(
    activeInMemoryRunIds = new Set<string>(),
    heartbeatThresholdMs = 15000
  ): Promise<OrphanRunReport[]> {
    const allRuns = await this.runRepo.getAll()
    const activeStatuses: AgentRunStatus[] = ['Starting', 'Running', 'Verifying', 'Waiting']
    const nowMs = Date.now()

    const orphanCandidates = allRuns.filter((r) => {
      if (!activeStatuses.includes(r.status)) return false
      const heartbeatMs = r.lastHeartbeatAt
        ? new Date(r.lastHeartbeatAt).getTime()
        : (r.startedAt ? new Date(r.startedAt).getTime() : 0)
      const isStale = nowMs - heartbeatMs > heartbeatThresholdMs
      const notInMem = !activeInMemoryRunIds.has(r.id)
      return notInMem || isStale
    })

    if (orphanCandidates.length === 0) {
      return []
    }

    const reports: OrphanRunReport[] = []
    const runtime = RuntimeFactory.getRuntime()
    const health = await runtime.checkHealth().catch(() => ({ healthy: false, latencyMs: 0, message: 'Runtime unreachable' }))

    for (const run of orphanCandidates) {
      const task = await this.taskRepo.getById(run.taskId)
      const probe = runtime.probeRunStatus
        ? await runtime.probeRunStatus(run.id).catch(() => ({ active: false, status: 'error', details: 'Probe failed' }))
        : { active: false, status: 'unknown', details: 'No probe available' }

      const heartbeatMs = run.lastHeartbeatAt
        ? new Date(run.lastHeartbeatAt).getTime()
        : (run.startedAt ? new Date(run.startedAt).getTime() : nowMs)
      const timeSinceLastHeartbeatMs = Math.max(0, nowMs - heartbeatMs)
      const isHeartbeatStale = timeSinceLastHeartbeatMs > heartbeatThresholdMs

      let diagnosis: OrphanRunReport['diagnosis']
      let recommendedAction: OrphanRunReport['recommendedAction']

      if (!health.healthy) {
        diagnosis = 'DEAD_RUNTIME'
        recommendedAction = 'mark_failed'
      } else if (!probe.active) {
        diagnosis = isHeartbeatStale ? 'STALE_HEARTBEAT' : 'DEAD_SESSION'
        recommendedAction = 'retry'
      } else {
        diagnosis = 'ALIVE_STREAMABLE'
        recommendedAction = 'resume'
      }

      reports.push({
        runId: run.id,
        taskId: run.taskId,
        taskTitle: task?.title || run.taskTitle,
        employeeId: run.employeeId,
        employeeName: run.employeeName,
        status: run.status,
        runtime: run.runtime || 'hermes',
        workspacePath: run.workspacePath,
        startedAt: run.startedAt,
        lastHeartbeatAt: run.lastHeartbeatAt,
        attempt: run.attempt || 1,
        parentRunId: run.parentRunId,
        isRuntimeAlive: health.healthy,
        runtimeStatus: probe.status || 'unknown',
        timeSinceLastHeartbeatMs,
        isHeartbeatStale,
        diagnosis,
        recommendedAction,
        suggestedDirective: `Recovered from runtime crash (Previous attempt #${run.attempt || 1} severed). Resume execution safely.`
      })
    }

    return reports
  }

  /**
   * Executes crash recovery on an orphan run.
   * HARD RULE: Ensures the old run is strictly terminated / marked Failed
   * BEFORE any new retry Run is created.
   */
  async recoverOrphan(
    report: OrphanRunReport,
    action: 'mark_failed' | 'retry' | 'resume',
    directive?: string,
    retryRunner?: (oldRunId: string, feedback?: string) => Promise<AgentRun | null>
  ): Promise<{ success: boolean; task?: Task; oldRun?: AgentRun; newRun?: AgentRun; error?: string }> {
    const runtime = RuntimeFactory.getRuntime()

    // 1. Mandatory Step: Ensure old run is severed & cancelled on runtime
    try {
      await runtime.cancel(report.runId)
    } catch {
      // Ignore network errors on cancel
    }

    const now = new Date().toISOString()

    if (action === 'mark_failed') {
      // 2. Mark old run Failed
      const errorMsg = `[HERMES_CRASH_RECOVERY] Execution terminated unexpectedly due to runtime crash / disconnect. Task reset to Waiting.`
      const oldRun = await this.runRepo.update(report.runId, {
        status: 'Failed',
        error: errorMsg,
        completedAt: now
      })

      // 3. Reset task to Waiting (or Todo) and clear activeRunId
      const task = await this.taskRepo.update(report.taskId, {
        status: 'Waiting',
        activeRunId: undefined
      })

      return { success: true, task, oldRun }
    }

    if (action === 'retry') {
      // 2. Ensure old run is marked Failed first
      const errorMsg = `[HERMES_CRASH_RECOVERY] Terminated old orphan run before launching recovery retry.`
      const oldRun = await this.runRepo.update(report.runId, {
        status: 'Failed',
        error: errorMsg,
        completedAt: now
      })

      // 3. Temporarily reset task to Todo to allow clean retry
      await this.taskRepo.update(report.taskId, {
        status: 'Todo',
        activeRunId: undefined
      })

      // 4. Launch clean Retry (Creates a NEW AgentRun with parentRunId)
      let newRun: AgentRun | null = null
      if (retryRunner) {
        newRun = await retryRunner(
          report.runId,
          directive || report.suggestedDirective || 'Auto-recovery after Hermes runtime restart.'
        )
      }

      const updatedTask = await this.taskRepo.getById(report.taskId)
      return { success: true, task: updatedTask, oldRun, newRun: newRun || undefined }
    }

    return { success: false, error: `Action '${action}' not supported or session cannot be resumed.` }
  }
}
