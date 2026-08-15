import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useTaskStore } from './task'
import { useAgentRunStore } from './agentRun'
import { useProjectStore } from './project'
import { useEmployeeStore } from './employee'
import type { ActiveWorkItem, AgentRun } from '../types'

export interface WorkerSpotlightItem {
  id: string
  name: string
  role: string
  avatar: string
  status: 'Running' | 'Waiting' | 'Review' | 'Idle' | 'Offline'
  currentTaskTitle?: string
  currentTaskId?: string
  currentRunId?: string
  progress: number
  projectName?: string
  folderPath?: string
  runtimeName: string
  hasApproval: boolean
  lastActive: string
}

export const useActiveWorkStore = defineStore('activeWork', () => {
  const taskStore = useTaskStore()
  const agentRunStore = useAgentRunStore()
  const projectStore = useProjectStore()
  const employeeStore = useEmployeeStore()

  /**
   * Computed list of all currently active work items across the entire workspace.
   * Merges Task, active/latest AgentRun, Project path, and Worker profile into a clean read model.
   * Only includes tasks with status 'In Progress', 'Waiting', 'Review', or an active AgentRun.
   */
  const activeWorkItems = computed<ActiveWorkItem[]>(() => {
    const tasks = taskStore.tasks.filter(
      (t) =>
        !t.deletedAt &&
        t.status !== 'Draft' &&
        t.status !== 'Cancelled' &&
        t.status !== 'Done' &&
        t.status !== 'Archived' &&
        (t.status === 'In Progress' ||
          t.status === 'Waiting' ||
          t.status === 'Review' ||
          (t.activeRunId &&
            agentRunStore.runs.some(
              (r) =>
                r.id === t.activeRunId &&
                r.status !== 'Cancelled' &&
                r.status !== 'Completed' &&
                r.status !== 'Failed'
            )))
    )

    const items: ActiveWorkItem[] = []

    for (const task of tasks) {
      const project = projectStore.projects.find((p) => p.id === task.projectId)
      const run: AgentRun | undefined = task.activeRunId
        ? agentRunStore.runs.find((r) => r.id === task.activeRunId)
        : task.latestRunId
        ? agentRunStore.runs.find((r) => r.id === task.latestRunId)
        : undefined

      const employee = employeeStore.employees.find((e) => e.id === (task.workerId || task.assigneeId || run?.employeeId))

      const workerId = employee?.id || task.workerId || task.assigneeId || ''
      const workerName = employee?.name || task.workerName || task.assigneeName || 'Unassigned'
      const workerAvatar = employee?.avatar || task.assigneeAvatar || ''
      const workerRole = employee?.roleName || 'Specialist'

      const folderPath = task.pathOverride || project?.path || ''
      const runtimeName = run?.telemetry?.provider ? `${run.telemetry.provider} (${run.telemetry.model})` : 'Hermes 3 (Llama 3.1)'

      const hasPendingApproval = run?.id ? Boolean(agentRunStore.pendingApprovals[run.id]) : false

      items.push({
        taskId: task.id,
        taskTitle: task.title,
        taskType: task.type || 'project',
        taskStatus: task.status,
        projectId: task.projectId,
        projectName: task.projectName || project?.name || 'Project',
        workerId,
        workerName,
        workerAvatar,
        workerRole,
        runId: run?.id,
        runStatus: run?.status,
        attempt: run?.attempt || 1,
        progress: run ? run.progress : task.progress,
        currentStep: run?.currentStep || (task.status === 'In Progress' ? 'Working' : 'Initializing'),
        runtime: runtimeName,
        path: folderPath,
        startedAt: run?.startedAt || task.createdAt,
        lastActivityAt: run?.updatedAt || task.updatedAt,
        outputSummary: run?.outputSummary,
        hasPendingApproval,
        error: run?.error
      })
    }

    return items
  })

  /**
   * Dynamic spotlight summary for primary workforce profiles (defaults to 4 primary workers).
   * Resolves workers dynamically from employee store by `isPrimary === true` or fallback top digital employees.
   */
  const workerSpotlight = computed<WorkerSpotlightItem[]>(() => {
    // 1. Find primary digital workers dynamically (purely driven by isPrimary or active roster order)
    let primaryEmployees = employeeStore.employees.filter((e) => e.isPrimary && e.status !== 'Archived')
    if (primaryEmployees.length === 0) {
      primaryEmployees = employeeStore.employees.filter((e) => e.status === 'Active')
    }
    if (primaryEmployees.length === 0) {
      primaryEmployees = employeeStore.employees
    }

    return primaryEmployees.slice(0, 4).map((emp) => {
      const activeWork = activeWorkItems.value.find(
        (w) => w.workerId === emp.id && (w.taskStatus === 'In Progress' || w.runStatus === 'Running' || w.hasPendingApproval)
      ) || activeWorkItems.value.find((w) => w.workerId === emp.id)

      const isRunning = activeWork?.runStatus === 'Running' || activeWork?.taskStatus === 'In Progress'
      const isWaiting = activeWork?.hasPendingApproval || activeWork?.runStatus === 'Waiting' || activeWork?.taskStatus === 'Waiting'
      const isReview = activeWork?.taskStatus === 'Review' || activeWork?.runStatus === 'Verifying'

      let status: 'Running' | 'Waiting' | 'Review' | 'Idle' | 'Offline' = 'Idle'
      if (emp.status === 'Inactive' || emp.status === 'Archived') {
        status = 'Offline'
      } else if (isRunning) {
        status = 'Running'
      } else if (isWaiting) {
        status = 'Waiting'
      } else if (isReview) {
        status = 'Review'
      }

      return {
        id: emp.id,
        name: emp.name,
        role: emp.roleName,
        avatar: emp.avatar,
        status,
        currentTaskTitle: activeWork?.taskTitle,
        currentTaskId: activeWork?.taskId,
        currentRunId: activeWork?.runId,
        progress: activeWork?.progress || 0,
        projectName: activeWork?.projectName,
        folderPath: activeWork?.path,
        runtimeName: activeWork?.runtime || 'Hermes 3',
        hasApproval: activeWork?.hasPendingApproval || false,
        lastActive: activeWork?.lastActivityAt || emp.updatedAt || 'Recently'
      }
    })
  })

  return {
    activeWorkItems,
    workerSpotlight
  }
})
