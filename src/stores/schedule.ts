import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Schedule, Task, AgentRun } from '../types'
import {
  ScheduleRepository,
  TaskRepository,
  ProjectRepository
} from '../repositories'
import { useAgentRunStore } from './agentRun'
import { useAuditLogStore } from './auditLog'
import { AuthorizationService } from '../services/AuthorizationService'

export const useScheduleStore = defineStore('schedule', () => {
  const repo = new ScheduleRepository()
  const taskRepo = new TaskRepository()
  const projectRepo = new ProjectRepository()
  const auditLogStore = useAuditLogStore()

  const schedules = ref<Schedule[]>([])
  const loading = ref<boolean>(false)

  async function fetchSchedulesByWorkspace(workspaceId: string, includeDeleted = false) {
    loading.value = true
    try {
      schedules.value = await repo.getByWorkspace(workspaceId, includeDeleted)
    } finally {
      loading.value = false
    }
  }

  async function createSchedule(data: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) {
    AuthorizationService.assertPermission('Owner', 'schedule:create', 'Create Schedule')
    const created = await repo.create(data)
    schedules.value.unshift(created)
    await auditLogStore.logAction({
      actor: 'Owner',
      entity: 'Schedule',
      entityId: created.id,
      action: 'Schedule Created',
      reason: `Created automated schedule: ${created.name}`,
      metadata: { name: created.name, recurrence: created.recurrence }
    })
    return created
  }

  async function updateSchedule(id: string, updates: Partial<Schedule>) {
    AuthorizationService.assertPermission('Owner', 'schedule:create', 'Update Schedule')
    const updated = await repo.update(id, updates)
    if (updated) {
      const idx = schedules.value.findIndex((s) => s.id === id)
      if (idx !== -1) {
        schedules.value[idx] = { ...updated }
      }
    }
    return updated
  }

  async function toggleSchedule(id: string) {
    AuthorizationService.assertPermission('Owner', 'schedule:toggle', 'Toggle Schedule')
    const updated = await repo.toggleEnabled(id)
    if (updated) {
      const idx = schedules.value.findIndex((s) => s.id === id)
      if (idx !== -1) {
        schedules.value[idx] = { ...updated }
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Schedule',
        entityId: id,
        action: updated.enabled ? 'Schedule Enabled' : 'Schedule Disabled',
        reason: `Schedule ${updated.enabled ? 'enabled' : 'disabled'} by Owner`,
        metadata: { enabled: updated.enabled, name: updated.name }
      })
    }
    return updated
  }

  async function deleteSchedule(id: string, soft = true, reason = 'Schedule deleted') {
    AuthorizationService.assertPermission('Owner', 'schedule:delete', 'Delete Schedule')
    if (soft) {
      await repo.softDelete(id, 'Owner', reason)
      schedules.value = schedules.value.filter((s) => s.id !== id)
    } else {
      await repo.delete(id)
      schedules.value = schedules.value.filter((s) => s.id !== id)
    }
    await auditLogStore.logAction({
      actor: 'Owner',
      entity: 'Schedule',
      entityId: id,
      action: 'Schedule Deleted',
      reason,
      metadata: { soft }
    })
    return true
  }

  /**
   * Instantly generate or retrieve a Task instance for a given schedule occurrence.
   * Enforces Idempotency via executionKey (`schedule:${scheduleId}:${scheduledFor}`).
   */
  async function triggerScheduleInstance(scheduleId: string, scheduledFor?: string): Promise<Task | undefined> {
    const schedule = schedules.value.find((s) => s.id === scheduleId) || (await repo.getById(scheduleId))
    if (!schedule) return undefined

    const now = new Date()
    const occurrenceTimestamp = scheduledFor || now.toISOString().slice(0, 16)
    const executionKey = `schedule:${schedule.id}:${occurrenceTimestamp}`

    // 1. Idempotency Check: Reuse existing task instance if executionKey matches
    const allTasks = await taskRepo.getAll()
    const existingTask = allTasks.find(
      (t) => t.executionKey === executionKey || (t.scheduleId === schedule.id && t.executionKey === executionKey)
    )

    if (existingTask) {
      return existingTask
    }

    const template = schedule.taskTemplate
    const dueDateStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const project = schedule.projectId ? await projectRepo.getById(schedule.projectId) : undefined

    const workerId = template.workerId || project?.defaultWorkerId
    const workerName = template.workerName || project?.defaultWorkerName || 'Assigned Worker'

    const newTask = await taskRepo.create({
      workspaceId: schedule.workspaceId,
      projectId: schedule.projectId || 'prj-general',
      projectName: schedule.projectName || 'Scheduled Tasks',
      title: template.title,
      description: template.description,
      type: 'recurring_instance',
      status: 'Todo',
      priority: template.priority || 'Medium',
      assigneeName: workerName,
      assigneeId: workerId,
      workerId: workerId,
      workerName: workerName,
      pathOverride: template.pathOverride,
      scheduleId: schedule.id,
      executionKey,
      instructions: template.instructions,
      acceptanceCriteria: template.acceptanceCriteria || [],
      dueDate: dueDateStr,
      tags: ['Scheduled', 'Automated', schedule.recurrence, `key:${executionKey}`]
    })

    // Update schedule's lastRunAt
    await repo.update(scheduleId, {
      lastRunAt: now.toISOString(),
      updatedAt: now.toISOString()
    })
    const idx = schedules.value.findIndex((s) => s.id === scheduleId)
    if (idx !== -1) {
      schedules.value[idx].lastRunAt = now.toISOString()
    }

    return newTask
  }

  /**
   * Full Scheduler Orchestration Pipeline:
   * Schedule Due / Manual Trigger
   *  ↓ Check ExecutionKey Idempotency (Reuse existing Task/Run if present)
   *  ↓ Create Task Instance
   *  ↓ Delegate to agentRunStore.startRunWithWorker() (single execution orchestrator)
   *    ↓ Strict Worker Resolution
   *    ↓ Task Lock + Duplicate Run Protection
   *    ↓ Authorization
   *    ↓ Path Resolution & Workspace Lock
   *    ↓ Create AgentRun
   *    ↓ Heartbeat & Runtime Dispatch
   *
   * ALL run creation flows through one path — no divergent execution policies.
   */
  async function triggerAndDispatchSchedule(
    scheduleId: string,
    autoRun = true,
    scheduledFor?: string
  ): Promise<{ task: Task; run?: AgentRun } | undefined> {
    const schedule = schedules.value.find((s) => s.id === scheduleId) || (await repo.getById(scheduleId))
    if (!schedule) return undefined

    // 1. Get or Create Task instance (Idempotent via executionKey)
    const task = await triggerScheduleInstance(scheduleId, scheduledFor)
    if (!task) return undefined

    // Idempotency: If task already has an active run, return existing execution
    if (task.activeRunId) {
      const agentRunStore = useAgentRunStore()
      const existingRun = await agentRunStore.fetchRunById(task.activeRunId)
      return { task, run: existingRun || undefined }
    }

    if (!autoRun) {
      return { task }
    }

    // 2. Strict Worker Resolution (NO hardcoded fallback IDs)
    const template = schedule.taskTemplate
    const project = schedule.projectId ? await projectRepo.getById(schedule.projectId) : undefined

    const workerId = template.workerId || project?.defaultWorkerId
    if (!workerId) {
      throw new Error('No worker configured for this scheduled task.')
    }

    // 3. Delegate ALL execution to the single orchestration path
    //    agentRunStore.startRunWithWorker() handles:
    //    - Duplicate Run Protection (task.activeRunId mutex)
    //    - In-memory task lock (rapid double-click guard)
    //    - Authorization (Owner permission check)
    //    - Assignment creation
    //    - Run creation & task locking
    //    - Path resolution (Task.pathOverride → Project.path → FAIL)
    //    - Workspace lock acquisition
    //    - Heartbeat setup
    //    - Runtime dispatch + sanitization boundary
    const agentRunStore = useAgentRunStore()
    try {
      const run = await agentRunStore.startRunWithWorker({
        taskId: task.id,
        employeeId: workerId,
        taskPromptOverride: template.instructions
      })
      return { task, run }
    } catch (err: any) {
      // If execution fails (e.g., missing path, workspace locked), leave task in Todo
      // so it can be retried or configured manually.
      if (err?.message?.includes('Workspace folder path is not configured') ||
          err?.message?.includes('WORKSPACE LOCKED')) {
        await taskRepo.update(task.id, {
          status: 'Todo',
          instructions: `${task.instructions || ''}\n[PREFLIGHT NOTICE]: ${err.message}`.trim()
        })
        return { task }
      }
      throw err
    }
  }

  return {
    schedules,
    loading,
    fetchSchedulesByWorkspace,
    createSchedule,
    updateSchedule,
    toggleSchedule,
    deleteSchedule,
    triggerScheduleInstance,
    triggerAndDispatchSchedule
  }
})
