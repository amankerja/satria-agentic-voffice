import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Schedule, Task, AgentRun } from '../types'
import {
  ScheduleRepository,
  TaskRepository,
  ProjectRepository,
  EmployeeRepository,
  AgentRunRepository
} from '../repositories'
import { useAgentRunStore } from './agentRun'

export const useScheduleStore = defineStore('schedule', () => {
  const repo = new ScheduleRepository()
  const taskRepo = new TaskRepository()
  const projectRepo = new ProjectRepository()
  const employeeRepo = new EmployeeRepository()
  const runRepo = new AgentRunRepository()

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
    const created = await repo.create(data)
    schedules.value.unshift(created)
    return created
  }

  async function updateSchedule(id: string, updates: Partial<Schedule>) {
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
    const updated = await repo.toggleEnabled(id)
    if (updated) {
      const idx = schedules.value.findIndex((s) => s.id === id)
      if (idx !== -1) {
        schedules.value[idx] = { ...updated }
      }
    }
    return updated
  }

  async function deleteSchedule(id: string, soft = true, reason = 'Schedule deleted') {
    if (soft) {
      await repo.softDelete(id, 'Owner', reason)
      schedules.value = schedules.value.filter((s) => s.id !== id)
    } else {
      await repo.delete(id)
      schedules.value = schedules.value.filter((s) => s.id !== id)
    }
    return true
  }

  /**
   * Instantly generate a new Task instance from a recurring schedule template.
   */
  async function triggerScheduleInstance(scheduleId: string): Promise<Task | undefined> {
    const schedule = schedules.value.find((s) => s.id === scheduleId) || (await repo.getById(scheduleId))
    if (!schedule) return undefined

    const template = schedule.taskTemplate
    const now = new Date()
    const dueDateStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const newTask = await taskRepo.create({
      workspaceId: schedule.workspaceId,
      projectId: schedule.projectId || 'prj-general',
      projectName: schedule.projectName || 'Scheduled Tasks',
      title: template.title,
      description: template.description,
      type: 'recurring_instance',
      status: 'Todo',
      priority: template.priority || 'Medium',
      assigneeName: template.workerName || 'Auto Worker',
      assigneeId: template.workerId,
      workerId: template.workerId,
      workerName: template.workerName,
      pathOverride: template.pathOverride,
      scheduleId: schedule.id,
      instructions: template.instructions,
      acceptanceCriteria: template.acceptanceCriteria || [],
      dueDate: dueDateStr,
      tags: ['Scheduled', 'Automated', schedule.recurrence]
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
   *  ↓ Create Task Instance
   *  ↓ Worker Resolution
   *  ↓ Path Resolution & Preflight
   *  ↓ Create AgentRun
   *  ↓ Dispatch Execution to Runtime
   */
  async function triggerAndDispatchSchedule(
    scheduleId: string,
    autoRun = true
  ): Promise<{ task: Task; run?: AgentRun } | undefined> {
    const schedule = schedules.value.find((s) => s.id === scheduleId) || (await repo.getById(scheduleId))
    if (!schedule) return undefined

    // 1. Create Task instance from template
    const task = await triggerScheduleInstance(scheduleId)
    if (!task) return undefined

    if (!autoRun) {
      return { task }
    }

    // 2. Worker Resolution
    const template = schedule.taskTemplate
    let worker = template.workerId ? await employeeRepo.getById(template.workerId) : undefined
    if (!worker && schedule.projectId) {
      const project = await projectRepo.getById(schedule.projectId)
      if (project?.defaultWorkerId) {
        worker = await employeeRepo.getById(project.defaultWorkerId)
      }
    }

    const workerId = worker?.id || template.workerId || 'emp-raka'
    const workerName = worker?.name || template.workerName || 'Specialist'
    const workerAvatar = worker?.avatar || ''
    const workerRole = worker?.roleName || 'Autonomous Worker'

    // 3. Path Resolution & Preflight
    const project = schedule.projectId ? await projectRepo.getById(schedule.projectId) : undefined
    const resolvedPath = template.pathOverride || task.pathOverride || project?.path

    if (!resolvedPath || !resolvedPath.trim()) {
      // Preflight fail: leave task in Todo and record preflight note
      await taskRepo.update(task.id, {
        status: 'Todo',
        instructions: `${task.instructions || ''}\n[PREFLIGHT NOTICE]: Missing workspace folder path. Configure path before starting run.`.trim()
      })
      return { task }
    }

    // 4. Create Run record
    const agentRunStore = useAgentRunStore()
    const run = await runRepo.create({
      assignmentId: `asg-sch-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: workerId,
      employeeName: workerName,
      employeeAvatar: workerAvatar,
      employeeRole: workerRole,
      status: 'Running',
      currentStep: 'Initializing',
      progress: 5,
      attempt: 1,
      logs: [
        {
          id: `log-${Date.now()}-sch-init`,
          timestamp: new Date().toLocaleTimeString(),
          step: 'Initializing',
          message: `Scheduled execution triggered by schedule "${schedule.name}" (${schedule.recurrence}).`,
          level: 'info'
        }
      ],
      startedAt: new Date().toISOString()
    })

    // 5. Update Task with active execution reference
    await taskRepo.update(task.id, {
      status: 'In Progress',
      workerId,
      workerName,
      assigneeId: workerId,
      assigneeName: workerName,
      assigneeAvatar: workerAvatar,
      activeRunId: run.id,
      latestRunId: run.id
    })

    // 6. Register into live run store and launch runner
    agentRunStore.runs.unshift(run)
    agentRunStore.currentRun = run
    await agentRunStore.startLiveRunner(run.id)

    return { task, run }
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
