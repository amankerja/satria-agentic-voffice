import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../stores/task'
import { useAgentRunStore } from '../stores/agentRun'
import { HermesRecoveryService } from '../runtime/recovery/HermesRecoveryService'
import { MockAgentRunRepository, MockTaskRepository } from '../repositories'

describe('Hermes Crash Recovery System Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const agentRunStore = useAgentRunStore()
    agentRunStore.setRuntimeMode('mock')
  })

  it('Scenario 1: Detects orphan run when Task is In Progress and Hermes died during session', async () => {
    const taskStore = useTaskStore()
    const runRepo = new MockAgentRunRepository()
    const taskRepo = new MockTaskRepository()
    const recoveryService = new HermesRecoveryService(runRepo, taskRepo)

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Crash Susceptible Task',
      description: 'Simulating task running during Hermes disconnect',
      status: 'In Progress',
      priority: 'High',
      assigneeName: 'Bima',
      workerId: 'emp-bima',
      workerName: 'Bima',
      pathOverride: 'C:/Projects/AI AGENTIC UI',
      dueDate: '2026-08-30',
      tags: ['Recovery']
    })

    const orphanRun = await runRepo.create({
      assignmentId: `asg-bima-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend Specialist',
      status: 'Running',
      attempt: 1,
      currentStep: 'Working',
      progress: 50,
      logs: [],
      startedAt: new Date().toISOString()
    })

    await taskStore.updateTask(task.id, { activeRunId: orphanRun.id, status: 'In Progress' })

    // Simulate SATRIA restart (active in-memory runners set is empty)
    const activeInMemoryRunIds = new Set<string>()
    const orphanReports = await recoveryService.detectOrphanRuns(activeInMemoryRunIds)

    expect(orphanReports.length).toBeGreaterThan(0)
    const report = orphanReports.find((r) => r.runId === orphanRun.id)
    expect(report).toBeDefined()
    expect(report?.status).toBe('Running')
    expect(report?.attempt).toBe(1)
    expect(report?.recommendedAction).toBeDefined()
  })

  it('Scenario 2: Safe Recovery Action: mark_failed terminates old run and resets task to Waiting without creating duplicate runs', async () => {
    const taskStore = useTaskStore()
    const runRepo = new MockAgentRunRepository()
    const taskRepo = new MockTaskRepository()
    const recoveryService = new HermesRecoveryService(runRepo, taskRepo)

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Crash Recovery Task - Mark Failed',
      description: 'Test graceful failure mark',
      status: 'In Progress',
      priority: 'High',
      assigneeName: 'Raka',
      dueDate: '2026-08-30',
      tags: ['Recovery']
    })

    const run = await runRepo.create({
      assignmentId: `asg-raka-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-raka',
      employeeName: 'Raka',
      employeeAvatar: '',
      employeeRole: 'Lead Architect',
      status: 'Running',
      attempt: 1,
      currentStep: 'Working',
      progress: 40,
      logs: [],
      startedAt: new Date().toISOString()
    })

    await taskStore.updateTask(task.id, { activeRunId: run.id, status: 'In Progress' })

    const [report] = await recoveryService.detectOrphanRuns(new Set())
    expect(report).toBeDefined()

    const recoveryResult = await recoveryService.recoverOrphan(report, 'mark_failed')
    expect(recoveryResult.success).toBe(true)
    expect(recoveryResult.oldRun?.status).toBe('Failed')
    expect(recoveryResult.oldRun?.error).toContain('HERMES_CRASH_RECOVERY')
    expect(recoveryResult.task?.status).toBe('Waiting')
    expect(recoveryResult.task?.activeRunId).toBeUndefined()
    expect(recoveryResult.newRun).toBeUndefined() // Zero duplicate run created
  })

  it('Scenario 3: Safe Recovery Action: retry guarantees old run is dead before creating a NEW AgentRun with parentRunId', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Crash Recovery Task - Retry',
      description: 'Test retry recovery chain',
      status: 'Todo',
      priority: 'High',
      assigneeName: 'Maya',
      workerId: 'emp-maya',
      workerName: 'Maya',
      pathOverride: 'C:/Projects/AI AGENTIC UI',
      dueDate: '2026-08-30',
      tags: ['Recovery']
    })

    // Start initial run
    const run1 = await agentRunStore.createRun({
      id: `asg-recov-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-maya',
      employeeName: 'Maya',
      employeeAvatar: '',
      employeeRole: 'UI/UX Specialist',
      assignedBy: 'Owner',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    expect(run1.status).toBe('Running')
    expect(run1.attempt).toBe(1)

    // Simulate crash: detect orphan run
    const reports = await agentRunStore.detectOrphanRuns()
    const targetReport = reports.find((r) => r.runId === run1.id)
    expect(targetReport).toBeDefined()

    // Execute retry recovery
    const recoveryResult = await agentRunStore.recoverOrphanRun(
      targetReport!,
      'retry',
      'Restarting after Hermes gateway reboot.'
    )

    expect(recoveryResult.success).toBe(true)

    // Old run must be strictly Failed
    const oldRun = await agentRunStore.fetchRunById(run1.id)
    expect(oldRun?.status).toBe('Failed')
    expect(oldRun?.error).toContain('HERMES_CRASH_RECOVERY')

    // New run must be created with parentRunId and attempt = 2
    expect(recoveryResult.newRun).toBeDefined()
    expect(recoveryResult.newRun?.id).not.toBe(run1.id)
    expect(recoveryResult.newRun?.parentRunId).toBe(run1.id)
    expect(recoveryResult.newRun?.attempt).toBe(2)

    // Task must now point to the new run
    const updatedTask = await taskStore.getTaskById(task.id)
    expect(updatedTask?.activeRunId).toBe(recoveryResult.newRun?.id)
  })

  it('Scenario 4: Boot Recovery automatically cleans up orphan runs on startup without infinite spawn', async () => {
    const taskStore = useTaskStore()
    const agentRunStore = useAgentRunStore()
    const runRepo = new MockAgentRunRepository()

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Boot Orphan Task',
      description: 'Testing startup auto-recovery',
      status: 'In Progress',
      priority: 'Medium',
      assigneeName: 'Dimas',
      dueDate: '2026-08-30',
      tags: ['Boot']
    })

    const orphanRun = await runRepo.create({
      assignmentId: `asg-dimas-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-dimas',
      employeeName: 'Dimas',
      employeeAvatar: '',
      employeeRole: 'QA Specialist',
      status: 'Running',
      attempt: 1,
      currentStep: 'Working',
      progress: 25,
      logs: [],
      startedAt: new Date().toISOString()
    })

    await taskStore.updateTask(task.id, { activeRunId: orphanRun.id, status: 'In Progress' })

    // Execute boot recovery
    const bootResult = await agentRunStore.performBootRecovery()
    expect(bootResult.recoveredCount).toBeGreaterThan(0)

    // Ensure orphan run is marked failed
    const cleanedRun = await agentRunStore.fetchRunById(orphanRun.id)
    expect(cleanedRun?.status).toBe('Failed')

    // Task is safely set to Waiting, activeRunId cleared
    const cleanedTask = await taskStore.getTaskById(task.id)
    expect(cleanedTask?.status).toBe('Waiting')
    expect(cleanedTask?.activeRunId).toBeUndefined()
  })

  it('Scenario 5: Run State Persistence & Heartbeat Timeout Detection (now - lastHeartbeatAt > threshold => STALE_HEARTBEAT)', async () => {
    const taskStore = useTaskStore()
    const runRepo = new MockAgentRunRepository()
    const taskRepo = new MockTaskRepository()
    const recoveryService = new HermesRecoveryService(runRepo, taskRepo)

    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Persistent Run State Task',
      description: 'Verifying database persistence of run state and heartbeat',
      status: 'In Progress',
      priority: 'High',
      assigneeName: 'Bima',
      workerId: 'emp-bima',
      workerName: 'Bima',
      pathOverride: 'C:/Projects/AI AGENTIC UI',
      dueDate: '2026-08-30',
      tags: ['StatePersistence']
    })

    const startedTime = new Date(Date.now() - 120000).toISOString()
    const staleHeartbeatTime = new Date(Date.now() - 60000).toISOString() // 60 seconds ago

    // 1. Persist complete run state in database
    const persistedRun = await runRepo.create({
      assignmentId: `asg-persist-${Date.now()}`,
      taskId: task.id,
      taskTitle: task.title,
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend Specialist',
      status: 'Running',
      runtime: 'hermes',
      workspacePath: 'C:/Projects/AI AGENTIC UI',
      attempt: 1,
      currentStep: 'Working',
      progress: 45,
      logs: [],
      startedAt: startedTime,
      lastHeartbeatAt: staleHeartbeatTime
    })

    await taskStore.updateTask(task.id, { activeRunId: persistedRun.id, status: 'In Progress' })

    // 2. Verify all required fields are persisted in database
    const loadedRun = await runRepo.getById(persistedRun.id)
    expect(loadedRun).toBeDefined()
    expect(loadedRun?.id).toBe(persistedRun.id)
    expect(loadedRun?.taskId).toBe(task.id)
    expect(loadedRun?.status).toBe('Running')
    expect(loadedRun?.runtime).toBe('hermes')
    expect(loadedRun?.workspacePath).toBe('C:/Projects/AI AGENTIC UI')
    expect(loadedRun?.startedAt).toBe(startedTime)
    expect(loadedRun?.lastHeartbeatAt).toBe(staleHeartbeatTime)
    expect(loadedRun?.attempt).toBe(1)

    // 3. Detect stale heartbeat (Threshold = 15,000ms, actual = 60,000ms)
    const reports = await recoveryService.detectOrphanRuns(new Set(), 15000)
    const targetReport = reports.find((r) => r.runId === persistedRun.id)

    expect(targetReport).toBeDefined()
    expect(targetReport?.isHeartbeatStale).toBe(true)
    expect(targetReport?.timeSinceLastHeartbeatMs).toBeGreaterThanOrEqual(50000)
    expect(targetReport?.diagnosis).toBe('STALE_HEARTBEAT')
    expect(targetReport?.runtime).toBe('hermes')
    expect(targetReport?.workspacePath).toBe('C:/Projects/AI AGENTIC UI')

    // 4. Safe recovery execution
    const recoveryResult = await recoveryService.recoverOrphan(targetReport!, 'mark_failed')
    expect(recoveryResult.success).toBe(true)
    expect(recoveryResult.oldRun?.status).toBe('Failed')
    expect(recoveryResult.task?.status).toBe('Waiting')
    expect(recoveryResult.task?.activeRunId).toBeUndefined()
  })
})
