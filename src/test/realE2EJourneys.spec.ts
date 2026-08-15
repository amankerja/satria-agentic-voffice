import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectStore } from '../stores/project'
import { useTaskStore } from '../stores/task'
import { useAgentRunStore } from '../stores/agentRun'
import { useReviewStore } from '../stores/review'
import { useScheduleStore } from '../stores/schedule'
import { useEmployeeStore } from '../stores/employee'
import { globalWorkspaceLock } from '../services/WorkspaceLockService'
import { MockReviewRepository } from '../repositories'

describe('SATRIA AI WORKFORCE — Real E2E Journeys Suite (§12)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    globalWorkspaceLock.clearAllLocks()
    const agentRunStore = useAgentRunStore()
    agentRunStore.setRuntimeMode('mock')
  })

  it('Journey 1: Create Project -> Set Folder -> Create Task -> Assign Worker -> Preflight -> Run -> Result -> Verification -> Complete', async () => {
    const projectStore = useProjectStore()
    const taskStore = useTaskStore()
    const employeeStore = useEmployeeStore()
    const agentRunStore = useAgentRunStore()
    const reviewStore = useReviewStore()

    // 1. Create Project with Folder Path
    const project = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'E2E Fleet Engine',
      description: 'Fleet Management System with industrial data density',
      status: 'Active',
      path: 'C:/Projects/e2e-fleet-engine',
      health: 'Healthy',
      defaultWorkerId: 'emp-bima',
      defaultWorkerName: 'Bima',
      contributorsCount: 2
    })
    expect(project.id).toBeDefined()
    expect(project.path).toBe('C:/Projects/e2e-fleet-engine')

    // 2. Fetch Employee Roster to pick specialist
    await employeeStore.fetchEmployeesByWorkspace('ws-dev')
    const bima = employeeStore.employees.find((e) => e.id === 'emp-bima') || employeeStore.employees[0]
    expect(bima).toBeDefined()

    // 3. Create Task under the Project
    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: project.id,
      projectName: project.name,
      title: 'Build Telemetry Ingestion Microservice',
      description: 'Implement SSE streaming parser and validate database insertion performance',
      status: 'Todo',
      priority: 'High',
      assigneeId: bima.id,
      assigneeName: bima.name,
      assigneeAvatar: bima.avatar,
      workerId: bima.id,
      workerName: bima.name,
      dueDate: '2026-08-30',
      tags: ['Backend', 'Telemetry', 'E2E']
    })
    expect(task.id).toBeDefined()
    expect(task.status).toBe('Todo')

    // 4. Preflight & Execution Run
    const run = await agentRunStore.startRunWithWorker({
      taskId: task.id,
      employeeId: bima.id,
      mode: 'mock',
      taskPromptOverride: 'Run telemetry unit tests and deliver benchmark summary'
    })
    expect(run.id).toBeDefined()
    expect(run.taskId).toBe(task.id)
    expect(run.status).toBe('Running')

    // Verify task state transitioned to In Progress and locked to activeRunId
    const updatedTask = taskStore.tasks.find((t) => t.id === task.id)
    expect(updatedTask?.status).toBe('In Progress')
    expect(updatedTask?.activeRunId).toBe(run.id)

    // 5. Complete Run
    run.status = 'Completed'
    run.progress = 100

    // 6. Quality Gate Verification Review
    const reviewRepo = new MockReviewRepository()
    const taskReview = await reviewRepo.create({
      taskId: task.id,
      taskTitle: task.title,
      runId: run.id,
      assignmentId: run.assignmentId,
      employeeId: bima.id,
      employeeName: bima.name,
      reviewer: 'Satria Lead / Planner',
      status: 'Pending',
      checklist: [{ item: 'Acceptance criteria verification', completed: true }]
    })

    expect(taskReview.id).toBeDefined()

    // 7. Approve Review and Complete Task
    await reviewStore.submitDecision(taskReview.id, 'Approved', 'Excellent execution, criteria verified.')
    await taskStore.updateTaskStatus(task.id, 'Done')

    const finalTask = taskStore.tasks.find((t) => t.id === task.id)
    expect(finalTask?.status).toBe('Done')
  })

  it('Journey 2: Run -> Stop -> Retry -> Fresh Run record with parentRunId', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()

    // 1. Create and Start Task
    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'SATRIA Core',
      title: 'Flaky Integration Test',
      description: 'Simulating mid-flight stop and bounded retry',
      status: 'Todo',
      priority: 'Medium',
      assigneeName: 'Maya',
      dueDate: '2026-08-30',
      tags: ['QA']
    })

    const run1 = await agentRunStore.startRunWithWorker({
      taskId: task.id,
      employeeId: 'emp-maya',
      mode: 'mock'
    })
    expect(run1.id).toBeDefined()
    expect(run1.attempt).toBe(1)
    expect(run1.status).toBe('Running')

    // 2. Owner stops execution mid-run
    await agentRunStore.stopRun(run1.id, 'Transient API timeout detected')

    const stoppedRun = agentRunStore.runs.find((r) => r.id === run1.id)
    expect(stoppedRun?.status).toBe('Cancelled')

    const stoppedTask = taskStore.tasks.find((t) => t.id === task.id)
    expect(stoppedTask?.status).toBe('Todo')
    expect(stoppedTask?.activeRunId).toBeUndefined()

    // 3. Retry Execution -> Creates fresh new Run linked to parentRunId
    const run2 = await agentRunStore.retryRun(run1.id, 'Use exponential backoff retry')
    expect(run2).toBeDefined()
    expect(run2!.id).not.toBe(run1.id)
    expect(run2!.parentRunId).toBe(run1.id)
    expect(run2!.attempt).toBe(2)
    expect(run2!.status).toBe('Running')

    // Verify task is now bound to run2
    const retriedTask = taskStore.tasks.find((t) => t.id === task.id)
    expect(retriedTask?.status).toBe('In Progress')
    expect(retriedTask?.activeRunId).toBe(run2!.id)
  })

  it('Journey 3: Schedule -> Trigger -> Task Instance Generator -> Run execution', async () => {
    const projectStore = useProjectStore()
    const scheduleStore = useScheduleStore()
    const agentRunStore = useAgentRunStore()

    const project = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'Security Automation Project',
      description: 'Automated nightly scans',
      status: 'Active',
      path: 'C:/Projects/security-automation',
      health: 'Healthy',
      contributorsCount: 1
    })

    // 1. Create Automated Schedule
    const schedule = await scheduleStore.createSchedule({
      workspaceId: 'ws-dev',
      projectId: project.id,
      projectName: project.name,
      name: 'Nightly Security Vulnerability Scan',
      cronExpression: '0 2 * * *',
      timezone: 'Asia/Jakarta',
      recurrence: 'daily',
      enabled: true,
      taskTemplate: {
        title: 'Run Dependency Audit & OWASP Inspection',
        description: 'Automated nightly dependency and secret scan',
        priority: 'High',
        workerId: 'emp-dimas',
        workerName: 'Dimas'
      }
    })
    expect(schedule.id).toBeDefined()
    expect(schedule.enabled).toBe(true)

    // 2. Trigger Schedule Occurrence (Run Now)
    const taskInstance = await scheduleStore.triggerScheduleInstance(schedule.id)
    expect(taskInstance).toBeDefined()
    expect(taskInstance!.type).toBe('recurring_instance')
    expect(taskInstance!.scheduleId).toBe(schedule.id)
    expect(taskInstance!.status).toBe('Todo')

    // 3. Dispatch Agent Run for the generated task instance
    const run = await agentRunStore.startRunWithWorker({
      taskId: taskInstance!.id,
      employeeId: taskInstance!.assigneeId || 'emp-dimas',
      mode: 'mock'
    })
    expect(run.id).toBeDefined()
    expect(run.taskId).toBe(taskInstance!.id)
    expect(run.status).toBe('Running')
  })
})
