import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AgentRun, TaskAssignment, RunLogEntry, Employee } from '../types'
import {
  MockAgentRunRepository,
  MockRunResultRepository,
  MockReviewRepository,
  MockEmployeeRepository
} from '../repositories'
import { RuntimeFactory } from '../runtime/RuntimeFactory'
import type { AgentRunInput, RuntimeEvent, RuntimeMode, ApprovalRequest } from '../runtime/types'
import { useActivityStore } from './activity'
import { useNotificationStore } from './notification'

export const useAgentRunStore = defineStore('agentRun', () => {
  const runRepo = new MockAgentRunRepository()
  const resultRepo = new MockRunResultRepository()
  const reviewRepo = new MockReviewRepository()
  const employeeRepo = new MockEmployeeRepository()

  const runs = ref<AgentRun[]>([])
  const currentRun = ref<AgentRun | null>(null)
  const loading = ref<boolean>(false)
  const runtimeMode = ref<RuntimeMode>(RuntimeFactory.getDefaultMode())
  const pendingApprovals = ref<Record<string, ApprovalRequest>>({})
  const resolvingApprovals = ref<Record<string, boolean>>({})

  const activeRuns = computed(() =>
    runs.value.filter(
      (r) =>
        r.status === 'Running' ||
        r.status === 'Starting' ||
        r.status === 'Queued' ||
        r.status === 'Verifying'
    )
  )

  const completedRuns = computed(() => runs.value.filter((r) => r.status === 'Completed'))

  const failedRuns = computed(() => runs.value.filter((r) => r.status === 'Failed'))

  const waitingRuns = computed(() => runs.value.filter((r) => r.status === 'Waiting'))

  function setRuntimeMode(mode: RuntimeMode) {
    runtimeMode.value = mode
    RuntimeFactory.setDefaultMode(mode)
  }

  function getPendingApproval(runId: string): ApprovalRequest | undefined {
    return pendingApprovals.value[runId]
  }

  async function fetchRuns() {
    loading.value = true
    try {
      runs.value = await runRepo.getAll()
    } finally {
      loading.value = false
    }
  }

  async function fetchRunById(id: string) {
    loading.value = true
    try {
      const run = await runRepo.getById(id)
      currentRun.value = run || null
      return run
    } finally {
      loading.value = false
    }
  }

  async function fetchRunsByEmployee(employeeId: string) {
    return await runRepo.getByEmployeeId(employeeId)
  }

  async function fetchRunsByTask(taskId: string) {
    return await runRepo.getByTaskId(taskId)
  }

  async function createRun(assignment: TaskAssignment, attempt: number = 1): Promise<AgentRun> {
    const initialLog: RunLogEntry = {
      id: `log-${Date.now()}-init`,
      timestamp: new Date().toLocaleTimeString(),
      step: 'Initializing',
      message: `Starting execution run (Attempt #${attempt}) for task "${assignment.taskTitle}".`,
      level: 'info'
    }

    const newRun = await runRepo.create({
      assignmentId: assignment.id,
      taskId: assignment.taskId,
      taskTitle: assignment.taskTitle,
      employeeId: assignment.employeeId,
      employeeName: assignment.employeeName,
      employeeAvatar: assignment.employeeAvatar,
      employeeRole: assignment.employeeRole,
      status: 'Running',
      attempt,
      currentStep: 'Initializing',
      progress: 5,
      logs: [initialLog],
      startedAt: new Date().toISOString()
    })

    runs.value.unshift(newRun)
    return newRun
  }

  async function startLiveRunner(runId: string) {
    const targetRun = runs.value.find((r) => r.id === runId)
    if (!targetRun) return

    const employee =
      (await employeeRepo.getById(targetRun.employeeId)) ||
      ({
        id: targetRun.employeeId,
        name: targetRun.employeeName,
        avatar: targetRun.employeeAvatar,
        roleName: targetRun.employeeRole,
        departmentName: 'Coding',
        description: 'Digital workforce employee'
      } as Employee)

    const assignment: TaskAssignment = {
      id: targetRun.assignmentId,
      taskId: targetRun.taskId,
      taskTitle: targetRun.taskTitle,
      employeeId: targetRun.employeeId,
      employeeName: targetRun.employeeName,
      employeeAvatar: targetRun.employeeAvatar,
      employeeRole: targetRun.employeeRole,
      assignedBy: 'Lead Developer',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: targetRun.startedAt,
      updatedAt: targetRun.startedAt
    }

    const input: AgentRunInput = {
      runId,
      assignment,
      employee,
      skills: [],
      tools: [],
      workspacePath: 'C:/Projects/AI AGENTIC UI',
      taskPrompt: targetRun.taskTitle,
      acceptanceCriteria: ['Pass all automated verification checks.']
    }

    const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
    const activityStore = useActivityStore()
    const notificationStore = useNotificationStore()

    await runtime.start(input, async (event: RuntimeEvent) => {
      if (event.type === 'telemetry:updated') {
        if (event.telemetry) {
          targetRun.telemetry = event.telemetry
          await runRepo.update(runId, { telemetry: event.telemetry })
        }
      } else if (event.type === 'progress:updated') {
        if (event.progress !== undefined) targetRun.progress = event.progress
        if (event.step) targetRun.currentStep = event.step
        if (event.log) targetRun.logs.push(event.log)
        if (event.telemetry) targetRun.telemetry = event.telemetry
        await runRepo.update(runId, {
          progress: targetRun.progress,
          currentStep: targetRun.currentStep,
          telemetry: targetRun.telemetry
        })
      } else if (event.type === 'approval:required') {
        targetRun.status = 'Waiting'
        if (event.approvalRequest) {
          pendingApprovals.value[runId] = event.approvalRequest
          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Approval Required',
            message: `${targetRun.employeeName} requires human approval for ${event.approvalRequest.toolCall.toolName}.`,
            priority: 'important',
            category: 'Tasks',
            link: `/runs/${runId}`,
            read: false
          })
          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: targetRun.employeeName,
            action: 'updated',
            targetType: 'task',
            targetTitle: `Approval required for action: ${event.approvalRequest.toolCall.toolName}`
          })
        }
        if (event.log) targetRun.logs.push(event.log)
        if (event.telemetry) targetRun.telemetry = event.telemetry
        await runRepo.update(runId, { status: 'Waiting', telemetry: targetRun.telemetry })
      } else if (event.type === 'run:completed') {
        targetRun.status = 'Completed'
        targetRun.progress = 100
        targetRun.currentStep = 'Completing'
        targetRun.completedAt = new Date().toISOString()
        targetRun.durationSeconds = Math.max(
          1,
          Math.floor(
            (new Date(targetRun.completedAt).getTime() - new Date(targetRun.startedAt).getTime()) /
              1000
          )
        )
        if (event.telemetry) {
          targetRun.telemetry = event.telemetry
        }
        targetRun.outputSummary = `Pekerjaan "${targetRun.taskTitle}" telah selesai dijalankan oleh ${targetRun.employeeName} dengan hasil verifikasi optimal.`

        await runRepo.update(runId, {
          status: 'Completed',
          progress: 100,
          currentStep: 'Completing',
          completedAt: targetRun.completedAt,
          durationSeconds: targetRun.durationSeconds,
          outputSummary: targetRun.outputSummary,
          telemetry: targetRun.telemetry
        })

        // Auto-generate run result & review item for review workflow
        await resultRepo.create({
          runId: targetRun.id,
          taskId: targetRun.taskId,
          assignmentId: targetRun.assignmentId,
          summary: targetRun.outputSummary,
          output: `### Deliverable Output — ${targetRun.taskTitle}\n- **Author:** ${targetRun.employeeName} (${targetRun.employeeRole})\n- **Status:** Execution successful\n- **Verification:** All acceptance assertions passed.\n- **Artifacts:** Code component & layout generated.`,
          status: 'success',
          artifactIds: ['art-result-' + targetRun.id],
          verificationStatus: 'Passed',
          verificationNotes:
            'Automated verification check passed with zero linting/logic warnings.'
        })

        await reviewRepo.create({
          runId: targetRun.id,
          taskId: targetRun.taskId,
          taskTitle: targetRun.taskTitle,
          assignmentId: targetRun.assignmentId,
          employeeId: targetRun.employeeId,
          employeeName: targetRun.employeeName,
          reviewer: 'Satria Lead / Planner',
          status: 'Pending',
          checklist: [
            { item: 'Acceptance criteria verification', completed: true },
            { item: 'Responsive & visual design compliance', completed: true },
            { item: 'Code standards and typing correctness', completed: true }
          ]
        })
      } else if (event.type === 'run:cancelled') {
        targetRun.status = 'Cancelled'
        delete pendingApprovals.value[runId]
        await runRepo.update(runId, { status: 'Cancelled' })
      } else if (event.type === 'run:failed') {
        targetRun.status = 'Failed'
        targetRun.error = event.error || 'Execution failed.'
        delete pendingApprovals.value[runId]
        await runRepo.update(runId, { status: 'Failed', error: targetRun.error })
      } else if (event.type === 'run:paused') {
        targetRun.status = 'Waiting'
        await runRepo.update(runId, { status: 'Waiting' })
      }
    })
  }

  async function startRunFromAssignment(assignment: TaskAssignment) {
    const run = await createRun(assignment, 1)
    await startLiveRunner(run.id)
    return run
  }

  function pauseRun(runId: string) {
    const run = runs.value.find((r) => r.id === runId)
    if (run) {
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      runtime.pause(runId)
      run.status = 'Waiting'
      runRepo.update(runId, { status: 'Waiting' })
    }
  }

  function resumeRun(runId: string) {
    const run = runs.value.find((r) => r.id === runId)
    if (run) {
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      runtime.resume(runId)
      run.status = 'Running'
      runRepo.update(runId, { status: 'Running' })
    }
  }

  function cancelRun(runId: string) {
    const run = runs.value.find((r) => r.id === runId)
    if (run) {
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      runtime.cancel(runId)
      run.status = 'Cancelled'
      delete pendingApprovals.value[runId]
      runRepo.update(runId, { status: 'Cancelled' })
    }
  }

  async function retryRun(runId: string) {
    const previousRun = runs.value.find((r) => r.id === runId)
    if (!previousRun) return null

    const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
    await runtime.cancel(runId)

    const nextAttempt = Math.min(3, previousRun.attempt + 1)

    previousRun.attempt = nextAttempt
    previousRun.progress = 0
    previousRun.status = 'Running'
    previousRun.currentStep = 'Initializing'
    previousRun.error = undefined
    previousRun.startedAt = new Date().toISOString()
    previousRun.completedAt = undefined
    delete pendingApprovals.value[runId]

    previousRun.logs.push({
      id: `log-${Date.now()}-retry`,
      timestamp: new Date().toLocaleTimeString(),
      step: 'Initializing',
      message: `Retrying execution run (Attempt #${nextAttempt}).`,
      level: 'info'
    })

    await runRepo.update(runId, {
      attempt: nextAttempt,
      progress: 0,
      status: 'Running',
      currentStep: 'Initializing',
      error: undefined,
      startedAt: previousRun.startedAt,
      completedAt: undefined
    })

    await startLiveRunner(runId)
    return previousRun
  }

  async function respondApproval(
    runId: string,
    approvalId: string,
    approved: boolean,
    feedback?: string
  ): Promise<boolean> {
    // Idempotency / Duplicate click protection
    if (resolvingApprovals.value[approvalId]) {
      return false
    }

    resolvingApprovals.value[approvalId] = true

    try {
      const targetRun = runs.value.find((r) => r.id === runId)
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      const activityStore = useActivityStore()
      const notificationStore = useNotificationStore()

      delete pendingApprovals.value[runId]
      await runtime.respondApproval(runId, approvalId, approved, feedback)

      if (targetRun) {
        if (approved) {
          targetRun.status = 'Running'
          await runRepo.update(runId, { status: 'Running' })

          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Approval Granted',
            message: `Run #${runId} resumed after user confirmed action.`,
            priority: 'normal',
            category: 'Tasks',
            link: `/runs/${runId}`,
            read: false
          })

          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: 'Lead Developer',
            action: 'updated',
            targetType: 'task',
            targetTitle: `Approved action for Run #${runId}`
          })
        } else {
          targetRun.status = 'Cancelled'
          await runRepo.update(runId, { status: 'Cancelled' })

          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Approval Rejected',
            message: `Action for Run #${runId} was rejected: ${feedback || 'No feedback'}`,
            priority: 'important',
            category: 'Tasks',
            link: `/runs/${runId}`,
            read: false
          })

          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: 'Lead Developer',
            action: 'updated',
            targetType: 'task',
            targetTitle: `Rejected action for Run #${runId}`
          })
        }
      }

      return true
    } finally {
      delete resolvingApprovals.value[approvalId]
    }
  }

  function getRunTelemetry(runId: string) {
    const target = runs.value.find((r) => r.id === runId) || (currentRun.value?.id === runId ? currentRun.value : null)
    return target?.telemetry
  }

  function getRunCost(runId: string): number | null | undefined {
    return getRunTelemetry(runId)?.estimatedCostUsd
  }

  function getRunDuration(runId: string): number {
    const target = runs.value.find((r) => r.id === runId) || (currentRun.value?.id === runId ? currentRun.value : null)
    if (!target) return 0
    if (target.durationSeconds) return target.durationSeconds
    if (target.telemetry?.durationMs) return Math.round(target.telemetry.durationMs / 1000)
    if (target.startedAt) {
      const end = target.completedAt ? new Date(target.completedAt).getTime() : Date.now()
      return Math.max(0, Math.floor((end - new Date(target.startedAt).getTime()) / 1000))
    }
    return 0
  }

  function getRunTokenUsage(runId: string): { total: number; prompt: number; completion: number; cached: number } | undefined {
    const telemetry = getRunTelemetry(runId)
    if (!telemetry) return undefined
    return {
      total: telemetry.totalTokens,
      prompt: telemetry.promptTokens,
      completion: telemetry.completionTokens,
      cached: telemetry.cachedTokens
    }
  }

  const totalTokensAllRuns = computed(() => {
    return runs.value.reduce((acc, r) => acc + (r.telemetry?.totalTokens || 0), 0)
  })

  const totalEstimatedCost = computed(() => {
    return runs.value.reduce((acc, r) => acc + (r.telemetry?.estimatedCostUsd || 0), 0)
  })

  const averageDurationSeconds = computed(() => {
    const completed = runs.value.filter((r) => r.status === 'Completed' && r.durationSeconds)
    if (completed.length === 0) return 0
    const totalSecs = completed.reduce((acc, r) => acc + (r.durationSeconds || 0), 0)
    return Math.round(totalSecs / completed.length)
  })

  return {
    runs,
    currentRun,
    loading,
    runtimeMode,
    pendingApprovals,
    activeRuns,
    completedRuns,
    failedRuns,
    waitingRuns,
    totalTokensAllRuns,
    totalEstimatedCost,
    averageDurationSeconds,
    setRuntimeMode,
    getPendingApproval,
    getRunTelemetry,
    getRunCost,
    getRunDuration,
    getRunTokenUsage,
    fetchRuns,
    fetchRunById,
    fetchRunsByEmployee,
    fetchRunsByTask,
    createRun,
    startRunFromAssignment,
    startLiveRunner,
    pauseRun,
    resumeRun,
    cancelRun,
    retryRun,
    respondApproval
  }
})
