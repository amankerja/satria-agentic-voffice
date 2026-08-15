import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../stores/task'
import { useProjectStore } from '../stores/project'
import { useAgentRunStore } from '../stores/agentRun'
import { useScheduleStore } from '../stores/schedule'
import { useActiveWorkStore } from '../stores/activeWork'
import { useEmployeeStore } from '../stores/employee'
import { dbClient } from '../database/DatabaseClient'

describe('SATRIA AI WORKFORCE — Business Logic & UI Refinement Suite (§86)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const agentRunStore = useAgentRunStore()
    agentRunStore.setRuntimeMode('mock')
    // Reset database to initial seed
    await dbClient.resetToDefaults()
  })

  it('Scenario 1: Task creation without run creates Todo task with no activeRunId', async () => {
    const taskStore = useTaskStore()
    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-crm',
      projectName: 'CRM Backend Engine',
      title: 'Design Webhook Ingestion Schema',
      description: 'Define JSON payload structure for events',
      type: 'project',
      status: 'Todo',
      priority: 'High',
      assigneeName: 'Bima',
      assigneeId: 'emp-bima',
      workerId: 'emp-bima',
      workerName: 'Bima',
      pathOverride: 'C:/Projects/crm-backend',
      dueDate: '2026-08-30',
      tags: ['Schema', 'Backend']
    })

    expect(task.id).toBeDefined()
    expect(task.status).toBe('Todo')
    expect(task.activeRunId).toBeUndefined()
    expect(task.type).toBe('project')
    expect(task.workerName).toBe('Bima')
    expect(task.pathOverride).toBe('C:/Projects/crm-backend')
  })

  it('Scenario 2: Project creation requires mandatory folder path', async () => {
    const projectStore = useProjectStore()

    // Empty path should throw
    await expect(
      projectStore.createProject({
        workspaceId: 'ws-dev',
        name: 'Invalid Project',
        description: 'No path provided',
        path: '',
        status: 'Active',
        contributorsCount: 1
      })
    ).rejects.toThrow('Project folder path is required')

    // Valid path creates successfully
    const valid = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'Valid Project',
      description: 'With workspace path',
      path: 'C:/Projects/valid-app',
      status: 'Active',
      contributorsCount: 1
    })

    expect(valid.id).toBeDefined()
    expect(valid.path).toBe('C:/Projects/valid-app')
  })

  it('Scenario 3: Task execution dispatch starts run with attempt 1 and sets activeRunId', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Build Active Work View',
      description: 'Build dedicated active work monitoring screen',
      status: 'Todo',
      priority: 'High',
      assigneeName: 'Maya',
      assigneeId: 'emp-maya',
      workerId: 'emp-maya',
      workerName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['Frontend']
    })

    const run = await agentRunStore.createRun({
      id: `asg-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-maya',
      employeeName: 'Maya',
      employeeAvatar: '',
      employeeRole: 'UI/UX Designer & Frontend',
      assignedBy: 'Lead Developer',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    expect(run.id).toBeDefined()
    expect(run.attempt).toBe(1)
    expect(run.status).toBe('Running')

    const updatedTask = await taskStore.getTaskById(task.id)
    expect(updatedTask?.activeRunId).toBe(run.id)
    expect(updatedTask?.latestRunId).toBe(run.id)
  })

  it('Scenario 4: Owner can change worker mid-run, cancelling Run #1 and starting Run #2', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()
    const employeeStore = useEmployeeStore()

    await employeeStore.fetchEmployeesByWorkspace('ws-dev')

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Refactor Runtime Loop',
      description: 'Streamline execution runtime loop',
      status: 'In Progress',
      priority: 'High',
      assigneeName: 'Maya',
      assigneeId: 'emp-maya',
      workerId: 'emp-maya',
      workerName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['Refactor']
    })

    const run1 = await agentRunStore.createRun({
      id: `asg-run1-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-maya',
      employeeName: 'Maya',
      employeeAvatar: '',
      employeeRole: 'UI/UX Designer',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Change worker mid-run to Bima (Backend specialist)
    const run2 = await agentRunStore.changeWorkerMidRun(run1.id, 'emp-bima', true)

    expect(run2).toBeDefined()
    expect(run2?.employeeName).toBe('Bima')
    expect(run2?.parentRunId).toBe(run1.id)
    expect(run2?.status).toBe('Running')

    // Run 1 must be Cancelled
    const oldRun = await agentRunStore.fetchRunById(run1.id)
    expect(oldRun?.status).toBe('Cancelled')
    expect(oldRun?.cancelledBy).toBe('Owner')

    // Task assignee must be updated to Bima
    const updatedTask = await taskStore.getTaskById(task.id)
    expect(updatedTask?.workerId).toBe('emp-bima')
  })

  it('Scenario 5: Owner can inject directive mid-run into agent execution context', async () => {
    const agentRunStore = useAgentRunStore()

    const run = await agentRunStore.createRun({
      id: `asg-instr-${Date.now()}`,
      taskId: 'tsk-001',
      taskTitle: 'API Authentication',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend Engineer',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    const success = await agentRunStore.addInstructionMidRun(
      run.id,
      'Ensure tokens expire after 15 minutes and use RS256 algorithm.'
    )

    expect(success).toBe(true)
    const lastLog = run.logs[run.logs.length - 1]
    expect(lastLog.message).toContain('Ensure tokens expire after 15 minutes')
  })

  it('Scenario 6: Owner stop run cancels execution and resets task to Todo', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Long Running Batch Job',
      description: 'Execute batch job across nodes',
      status: 'In Progress',
      priority: 'Medium',
      assigneeName: 'Raka',
      dueDate: '2026-08-30',
      tags: ['Batch']
    })

    const run = await agentRunStore.createRun({
      id: `asg-stop-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-raka',
      employeeName: 'Raka',
      employeeAvatar: '',
      employeeRole: 'Planner',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'Medium',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    await agentRunStore.stopRun(run.id, 'Resource limit reached')

    const updatedRun = await agentRunStore.fetchRunById(run.id)
    expect(updatedRun?.status).toBe('Cancelled')
    expect(updatedRun?.cancelReason).toBe('Resource limit reached')

    const updatedTask = await taskStore.getTaskById(task.id)
    expect(updatedTask?.status).toBe('Todo')
    expect(updatedTask?.activeRunId).toBeUndefined()
  })

  it('Scenario 7: Cancel task cascades cancellation to active run and does NOT set deletedAt', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Obsolete Feature',
      description: 'Deprecated UI element',
      status: 'In Progress',
      priority: 'Low',
      assigneeName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['Deprecated']
    })

    const run = await agentRunStore.createRun({
      id: `asg-casc-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-maya',
      employeeName: 'Maya',
      employeeAvatar: '',
      employeeRole: 'Designer',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'Low',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    await taskStore.cancelTask(task.id, 'Feature scope removed')

    const cancelledTask = await taskStore.getTaskById(task.id)
    expect(cancelledTask?.status).toBe('Cancelled')
    expect(cancelledTask?.cancelReason).toBe('Feature scope removed')
    expect(cancelledTask?.deletedAt).toBeUndefined()

    const cancelledRun = await agentRunStore.fetchRunById(run.id)
    expect(cancelledRun?.status).toBe('Cancelled')
    expect(cancelledRun?.deletedAt).toBeUndefined()
  })

  it('Scenario 8: Cancel project cascades cancellation to all tasks, runs, and schedules without setting deletedAt', async () => {
    const projectStore = useProjectStore()
    const taskStore = useTaskStore()
    const scheduleStore = useScheduleStore()
    const agentRunStore = useAgentRunStore()

    const prj = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'Decommissioned Project',
      description: 'Project to be cancelled',
      path: 'C:/Projects/decommissioned',
      status: 'Active',
      contributorsCount: 1
    })

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: prj.id,
      projectName: prj.name,
      title: 'Child Task',
      description: 'Child task description',
      status: 'In Progress',
      priority: 'Medium',
      assigneeName: 'Bima',
      dueDate: '2026-08-30',
      tags: ['Child']
    })

    const run = await agentRunStore.createRun({
      id: `asg-prj-casc-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'Medium',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    const sch = await scheduleStore.createSchedule({
      workspaceId: 'ws-dev',
      projectId: prj.id,
      projectName: prj.name,
      name: 'Project Daily Job',
      recurrence: 'daily',
      time: '09:00',
      timezone: 'Asia/Jakarta (GMT+7)',
      enabled: true,
      taskTemplate: {
        title: 'Daily Auto Check',
        description: 'Auto check routine',
        workerId: 'emp-bima',
        priority: 'Low'
      }
    })

    // Cancel project
    await projectStore.cancelProject(prj.id, 'Client ended contract')

    const cancelledPrj = await projectStore.getProjectById(prj.id)
    expect(cancelledPrj?.status).toBe('Cancelled')
    expect(cancelledPrj?.deletedAt).toBeUndefined()

    const cancelledTask = await taskStore.getTaskById(task.id)
    expect(cancelledTask?.status).toBe('Cancelled')
    expect(cancelledTask?.deletedAt).toBeUndefined()

    const cancelledRun = await agentRunStore.fetchRunById(run.id)
    expect(cancelledRun?.status).toBe('Cancelled')

    const disabledSch = await scheduleStore.updateSchedule(sch.id, {})
    expect(disabledSch?.enabled).toBe(false)
  })

  it('Scenario 9: Recurring schedule trigger creates Task instance with type recurring_instance and updates lastRunAt', async () => {
    const scheduleStore = useScheduleStore()

    const sch = await scheduleStore.createSchedule({
      workspaceId: 'ws-dev',
      projectId: 'prj-crm',
      projectName: 'CRM Backend Engine',
      name: 'Hourly Queue Health Check',
      recurrence: 'daily',
      time: '12:00',
      timezone: 'Asia/Jakarta (GMT+7)',
      enabled: true,
      taskTemplate: {
        title: 'Check Redis Queue Latency',
        description: 'Verify background worker health',
        workerId: 'emp-bima',
        workerName: 'Bima',
        priority: 'High',
        pathOverride: 'C:/Projects/crm-backend'
      }
    })

    const generatedTask = await scheduleStore.triggerScheduleInstance(sch.id)

    expect(generatedTask).toBeDefined()
    expect(generatedTask?.type).toBe('recurring_instance')
    expect(generatedTask?.scheduleId).toBe(sch.id)
    expect(generatedTask?.title).toBe('Check Redis Queue Latency')
    expect(generatedTask?.workerName).toBe('Bima')

    const updatedSch = scheduleStore.schedules.find((s) => s.id === sch.id)
    expect(updatedSch?.lastRunAt).toBeDefined()
  })

  it('Scenario 10: Schedule toggle enables and disables schedule', async () => {
    const scheduleStore = useScheduleStore()

    const sch = await scheduleStore.createSchedule({
      workspaceId: 'ws-dev',
      name: 'Toggle Test Schedule',
      recurrence: 'weekly',
      time: '10:00',
      timezone: 'Asia/Jakarta (GMT+7)',
      enabled: true,
      taskTemplate: {
        title: 'Weekly Task',
        description: 'Weekly task description',
        priority: 'Medium'
      }
    })

    expect(sch.enabled).toBe(true)

    const toggledOff = await scheduleStore.toggleSchedule(sch.id)
    expect(toggledOff?.enabled).toBe(false)

    const toggledOn = await scheduleStore.toggleSchedule(sch.id)
    expect(toggledOn?.enabled).toBe(true)
  })

  it('Scenario 11: Soft delete marks deletedAt and excludes from default queries', async () => {
    const taskStore = useTaskStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Temporary Test Task',
      description: 'Test task for deletion',
      status: 'Todo',
      priority: 'Low',
      assigneeName: 'Satria Utama',
      dueDate: '2026-08-30',
      tags: ['Test']
    })

    await taskStore.deleteTask(task.id, true, 'Test clean up')

    // Task must be removed from active state
    expect(taskStore.tasks.find((t) => t.id === task.id)).toBeUndefined()

    // Default query excludes deleted items
    await taskStore.fetchTasksByWorkspace('ws-dev', false)
    expect(taskStore.tasks.find((t) => t.id === task.id)).toBeUndefined()

    // IncludeDeleted returns it
    await taskStore.fetchTasksByWorkspace('ws-dev', true)
    const softDeleted = taskStore.tasks.find((t) => t.id === task.id)
    expect(softDeleted?.deletedAt).toBeDefined()
    expect(softDeleted?.deleteReason).toBe('Test clean up')
  })

  it('Scenario 12: ActiveWork read model synthesizes worker, task, run, progress, and folder path', async () => {
    const taskStore = useTaskStore()
    const projectStore = useProjectStore()
    const employeeStore = useEmployeeStore()
    const agentRunStore = useAgentRunStore()
    const activeWorkStore = useActiveWorkStore()

    await Promise.all([
      taskStore.fetchTasksByWorkspace('ws-dev'),
      projectStore.fetchProjectsByWorkspace('ws-dev'),
      employeeStore.fetchEmployeesByWorkspace('ws-dev'),
      agentRunStore.fetchRuns()
    ])

    const items = activeWorkStore.activeWorkItems
    expect(items.length).toBeGreaterThan(0)

    const item = items[0]
    expect(item.taskId).toBeDefined()
    expect(item.taskTitle).toBeDefined()
    expect(item.workerName).toBeDefined()
    expect(item.progress).toBeGreaterThanOrEqual(0)
    expect(item.runtime).toBeDefined()

    // Worker spotlight has 4 key profiles
    const spotlights = activeWorkStore.workerSpotlight
    expect(spotlights.length).toBe(4)
    const raka = spotlights.find((s) => s.id === 'emp-raka')
    expect(raka?.name).toBe('Raka')
  })

  it('Scenario 13: Trash & Safe Restore Lifecycle unsets soft-deletion metadata', async () => {
    const taskStore = useTaskStore()
    const projectStore = useProjectStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Restorable Task',
      description: 'Task to be restored',
      status: 'Todo',
      priority: 'Low',
      assigneeName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['Restore']
    })

    await taskStore.deleteTask(task.id, true, 'Accidentally deleted')
    const restored = await taskStore.restoreTask(task.id)

    expect(restored?.status).toBe('Todo')
    expect(restored?.deletedAt).toBeUndefined()
    expect(restored?.deleteReason).toBeUndefined()

    const prj = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'Restorable Project',
      description: 'Project to be restored',
      path: 'C:/Projects/restorable',
      status: 'Active',
      contributorsCount: 1
    })

    await projectStore.deleteProject(prj.id, true, 'Accidental project delete')
    const restoredPrj = await projectStore.restoreProject(prj.id)

    expect(restoredPrj?.status).toBe('Active')
    expect(restoredPrj?.deletedAt).toBeUndefined()
  })

  it('Scenario 14: ActiveWork query excludes untouched Todo tasks that do not have active runs', async () => {
    const taskStore = useTaskStore()
    const activeWorkStore = useActiveWorkStore()

    const idleTask = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Untouched Todo Task',
      description: 'This task is waiting in todo',
      status: 'Todo',
      priority: 'Low',
      assigneeName: 'Raka',
      dueDate: '2026-08-30',
      tags: ['Backlog']
    })

    const foundInActive = activeWorkStore.activeWorkItems.find((w) => w.taskId === idleTask.id)
    expect(foundInActive).toBeUndefined()
  })

  it('Scenario 15: Missing workspace folder path throws clear error during execution start', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()

    // Create a task without project or path override in an empty workspace
    const unpathedTask = await taskStore.createTask({
      workspaceId: 'ws-empty',
      projectId: 'prj-nonexistent',
      projectName: 'No Project',
      title: 'Unpathed Task',
      description: 'Task with missing project and path',
      status: 'Todo',
      priority: 'High',
      assigneeName: 'Bima',
      assigneeId: 'emp-bima',
      workerId: 'emp-bima',
      workerName: 'Bima',
      dueDate: '2026-08-30',
      tags: ['NoPath']
    })

    const run = await agentRunStore.createRun({
      id: `asg-unpath-${Date.now()}`,
      taskId: unpathedTask.id,
      taskTitle: unpathedTask.title,
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Starting live runner without path should throw
    await expect(agentRunStore.startLiveRunner(run.id)).rejects.toThrow(
      'Workspace folder path is not configured'
    )
  })

  it('Scenario 16: Retry strictly creates a new Run record preserving parentRunId and incrementing attempt', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Database Optimization',
      description: 'Optimize queries for workforce performance',
      status: 'Todo',
      priority: 'High',
      assigneeName: 'Bima',
      dueDate: '2026-08-30',
      tags: ['Backend']
    })

    const run1 = await agentRunStore.createRun({
      id: `asg-orig-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend Engineer',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'High',
      status: 'Failed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, 1)

    const run2 = await agentRunStore.retryRun(run1.id, 'Use indexed queries and Redis caching')
    expect(run2).toBeDefined()
    expect(run2?.id).not.toBe(run1.id)
    expect(run2?.parentRunId).toBe(run1.id)
    expect(run2?.attempt).toBe(2)
    expect(run2?.status).toBe('Running')

    // Task must be updated with activeRunId pointing to run2
    const updatedTask = await taskStore.getTaskById(task.id)
    expect(updatedTask?.activeRunId).toBe(run2?.id)
    expect(updatedTask?.latestRunId).toBe(run2?.id)
    expect(updatedTask?.status).toBe('In Progress')
  })

  it('Scenario 17: Full Scheduler Orchestration Pipeline (Schedule -> Task -> Worker -> Path -> Run -> Runtime)', async () => {
    const scheduleStore = useScheduleStore()
    const taskStore = useTaskStore()

    const schedule = await scheduleStore.createSchedule({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      name: 'Daily Security Audit',
      description: 'Scan vulnerabilities daily',
      recurrence: 'daily',
      time: '08:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      timezone: 'Asia/Jakarta',
      enabled: true,
      taskTemplate: {
        title: 'Run Automated Security Scan',
        description: 'Execute npm audit and snyk security scans',
        priority: 'High',
        workerId: 'emp-dimas',
        workerName: 'Dimas',
        pathOverride: 'C:/Projects/AI AGENTIC UI',
        instructions: 'Scan for high severity vulnerabilities.'
      }
    })

    const result = await scheduleStore.triggerAndDispatchSchedule(schedule.id, true)
    expect(result).toBeDefined()
    expect(result?.task).toBeDefined()
    expect(result?.task.type).toBe('recurring_instance')
    expect(result?.task.scheduleId).toBe(schedule.id)
    expect(result?.task.workerId).toBe('emp-dimas')

    // Execution run was created and dispatched
    expect(result?.run).toBeDefined()
    expect(result?.run?.taskId).toBe(result?.task.id)
    expect(result?.run?.employeeId).toBe('emp-dimas')

    // Verify task status is In Progress with active run
    const persistedTask = await taskStore.getTaskById(result!.task.id)
    expect(persistedTask?.status).toBe('In Progress')
    expect(persistedTask?.activeRunId).toBe(result?.run?.id)
  })

  it('Scenario 18: Archiving Task and Project consistently sets status = Archived and archivedAt timestamp', async () => {
    const taskStore = useTaskStore()
    const projectStore = useProjectStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Archivable Task',
      description: 'Task to be archived',
      status: 'Todo',
      priority: 'Low',
      assigneeName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['Archive']
    })

    const archivedTask = await taskStore.archiveTask(task.id)
    expect(archivedTask?.status).toBe('Archived')
    expect(archivedTask?.archivedAt).toBeDefined()
    expect(archivedTask?.deletedAt).toBeUndefined()
    expect(archivedTask?.cancelledAt).toBeUndefined()

    const prj = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'Archivable Project',
      description: 'Project to be archived',
      path: 'C:/Projects/archivable',
      status: 'Active',
      contributorsCount: 1
    })

    const archivedPrj = await projectStore.archiveProject(prj.id)
    expect(archivedPrj?.status).toBe('Archived')
    expect(archivedPrj?.archivedAt).toBeDefined()
    expect(archivedPrj?.deletedAt).toBeUndefined()
    expect(archivedPrj?.cancelledAt).toBeUndefined()
  })

  it('Scenario 19: Strict Worker Resolution throws error when no worker is configured on Schedule or Project', async () => {
    const scheduleStore = useScheduleStore()

    const unassignedSchedule = await scheduleStore.createSchedule({
      workspaceId: 'ws-dev',
      name: 'Unassigned Recurring Schedule',
      recurrence: 'daily',
      timezone: 'Asia/Jakarta',
      enabled: true,
      taskTemplate: {
        title: 'Task with no worker',
        description: 'No worker specified anywhere',
        priority: 'Medium'
      }
    })

    // Must throw error when attempting to dispatch without worker
    await expect(
      scheduleStore.triggerAndDispatchSchedule(unassignedSchedule.id, true)
    ).rejects.toThrow('No worker configured for this scheduled task.')
  })

  it('Scenario 20: Scheduler Idempotency guarantees 1 Task Instance and 1 initial Run per scheduled occurrence (executionKey)', async () => {
    const scheduleStore = useScheduleStore()
    const taskStore = useTaskStore()

    const schedule = await scheduleStore.createSchedule({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      name: 'Marketing Social Digest',
      recurrence: 'daily',
      timezone: 'Asia/Jakarta',
      enabled: true,
      taskTemplate: {
        title: 'Generate Marketing Digest',
        description: 'Collect social engagement and summarize',
        priority: 'Medium',
        workerId: 'emp-maya',
        workerName: 'Maya',
        pathOverride: 'C:/Projects/AI AGENTIC UI'
      }
    })

    const fixedScheduledFor = '2026-08-17T08:00:00+08:00'
    const expectedKey = `schedule:${schedule.id}:${fixedScheduledFor}`

    // 1st Trigger
    const firstDispatch = await scheduleStore.triggerAndDispatchSchedule(
      schedule.id,
      true,
      fixedScheduledFor
    )
    expect(firstDispatch).toBeDefined()
    expect(firstDispatch?.task.executionKey).toBe(expectedKey)
    expect(firstDispatch?.run).toBeDefined()

    // 2nd Trigger with the EXACT SAME scheduled occurrence timestamp
    const secondDispatch = await scheduleStore.triggerAndDispatchSchedule(
      schedule.id,
      true,
      fixedScheduledFor
    )
    expect(secondDispatch).toBeDefined()

    // Must return the SAME Task instance without creating a duplicate task
    expect(secondDispatch?.task.id).toBe(firstDispatch?.task.id)
    expect(secondDispatch?.task.executionKey).toBe(expectedKey)
    expect(secondDispatch?.run?.id).toBe(firstDispatch?.run?.id)

    // Verify in Task repository that only 1 task with this key exists
    await taskStore.fetchTasksByWorkspace('ws-dev')
    const matchingTasks = taskStore.tasks.filter((t) => t.executionKey === expectedKey)
    expect(matchingTasks.length).toBe(1)
  })

  it('Scenario 21: Duplicate Run Protection on Task Level (Rapid double-click 100ms apart yields single Run #1)', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'High Concurrency Task',
      description: 'Test duplicate click protection',
      status: 'Todo',
      priority: 'High',
      assigneeName: 'Bima',
      workerId: 'emp-bima',
      workerName: 'Bima',
      pathOverride: 'C:/Projects/AI AGENTIC UI',
      dueDate: '2026-08-30',
      tags: ['Concurrency', 'Protection']
    })

    const assignmentData = {
      id: `asg-double-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend Engineer',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'High' as const,
      status: 'In Progress' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Click 1
    const run1 = await agentRunStore.createRun(assignmentData, 1)
    expect(run1).toBeDefined()
    expect(run1.status).toBe('Running')

    // Click 2 (e.g. 100ms later while run1 is active)
    const run2 = await agentRunStore.createRun({
      ...assignmentData,
      id: `asg-double-${Date.now() + 100}`
    }, 1)

    // Must return run1, NOT creating a duplicate run2
    expect(run2.id).toBe(run1.id)

    // Verify in store that only 1 run was created for this task
    const runsForTask = await agentRunStore.fetchRunsByTask(task.id)
    expect(runsForTask.length).toBe(1)
  })

  it('Scenario 22: Strict 3-way Contract Separation (Cancel vs Archive vs Delete)', async () => {
    const taskStore = useTaskStore()
    const projectStore = useProjectStore()

    // 1. CANCEL: status = 'Cancelled', cancelledAt set, deletedAt = undefined, archivedAt = undefined
    const taskToCancel = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Contract Test Task - Cancel',
      description: 'Test Cancel contract',
      status: 'Todo',
      priority: 'Low',
      assigneeName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['Contract']
    })

    const cancelled = await taskStore.cancelTask(taskToCancel.id, 'Test cancel reason')
    expect(cancelled?.status).toBe('Cancelled')
    expect(cancelled?.cancelledAt).toBeDefined()
    expect(cancelled?.deletedAt).toBeUndefined()
    expect(cancelled?.archivedAt).toBeUndefined()

    // 2. ARCHIVE: status = 'Archived', archivedAt set, deletedAt = undefined, cancelledAt = undefined
    const taskToArchive = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Contract Test Task - Archive',
      description: 'Test Archive contract',
      status: 'Todo',
      priority: 'Low',
      assigneeName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['Contract']
    })

    const archived = await taskStore.archiveTask(taskToArchive.id)
    expect(archived?.status).toBe('Archived')
    expect(archived?.archivedAt).toBeDefined()
    expect(archived?.deletedAt).toBeUndefined()
    expect(archived?.cancelledAt).toBeUndefined()

    // 3. DELETE (Soft): deletedAt set, deletedBy set, archivedAt = undefined, cancelledAt = undefined
    const taskToDelete = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Contract Test Task - Delete',
      description: 'Test Delete contract',
      status: 'Todo',
      priority: 'Low',
      assigneeName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['Contract']
    })

    await taskStore.deleteTask(taskToDelete.id, true, 'Test delete reason')
    const inStore = taskStore.tasks.find((t) => t.id === taskToDelete.id)
    expect(inStore).toBeUndefined() // Excluded from active in-memory list

    const rawRecord = await (new (await import('../repositories')).MockTaskRepository()).getById(taskToDelete.id)
    expect(rawRecord?.deletedAt).toBeDefined()
    expect(rawRecord?.deletedBy).toBe('Owner')
    expect(rawRecord?.deleteReason).toBe('Test delete reason')
    expect(rawRecord?.archivedAt).toBeUndefined()
    expect(rawRecord?.cancelledAt).toBeUndefined()

    // Project Contract Validation
    const prj = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'Contract Test Project',
      description: 'Test project contracts',
      path: 'C:/Projects/contracts',
      status: 'Active',
      contributorsCount: 1
    })

    const cancelledPrj = await projectStore.cancelProject(prj.id, 'Contract project cancel')
    expect(cancelledPrj?.status).toBe('Cancelled')
    expect(cancelledPrj?.cancelledAt).toBeDefined()
    expect(cancelledPrj?.deletedAt).toBeUndefined()
    expect(cancelledPrj?.archivedAt).toBeUndefined()
  })
})
