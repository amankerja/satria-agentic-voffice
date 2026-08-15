import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '../stores/task'
import { useProjectStore } from '../stores/project'
import { useScheduleStore } from '../stores/schedule'
import { useAgentRunStore } from '../stores/agentRun'
import { useCostLedgerStore } from '../stores/costLedger'
import { useAuditLogStore } from '../stores/auditLog'
import { globalWorkspaceLock } from '../services/WorkspaceLockService'
import { AuthorizationService, AuthorizationError } from '../services/AuthorizationService'
import { globalBackupService } from '../services/BackupService'
import { MockAgentRunRepository } from '../repositories'

describe('SATRIA AI WORKFORCE — Enterprise Systems Suite (§WorkspaceLock, §CostLedger, §AuditLog, §RBAC, §BackupRestore)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    globalWorkspaceLock.clearAllLocks()
    const agentRunStore = useAgentRunStore()
    agentRunStore.setRuntimeMode('mock')
  })

  it('Scenario 1: Workspace Lock — Rejects concurrent execution on the same folder path under default "wait" policy', async () => {
    const workspacePath = 'C:/Projects/company-api'

    // Mock active run in database for run-10
    const runRepo = new MockAgentRunRepository()
    const run10 = await runRepo.create({
      assignmentId: 'asg-10',
      taskId: 'tsk-10',
      taskTitle: 'Company API Feature',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend Specialist',
      status: 'Running',
      currentStep: 'Working',
      progress: 25,
      attempt: 1,
      logs: [],
      startedAt: new Date().toISOString()
    })

    // 1. Run #10 acquires lock on /projects/company-api
    const lock1 = await globalWorkspaceLock.acquireLock(workspacePath, {
      workspacePath,
      activeRunId: run10.id,
      taskId: 'tsk-10',
      taskTitle: 'Company API Feature',
      workerName: 'Bima',
      lockedAt: new Date().toISOString()
    })
    expect(lock1.acquired).toBe(true)

    // Verify workspace is locked
    const check = globalWorkspaceLock.isLocked(workspacePath)
    expect(check.locked).toBe(true)
    expect(check.activeLock?.activeRunId).toBe(run10.id)

    // 2. Run #11 tries to acquire lock on the same path with default policy ('wait')
    const lock2 = await globalWorkspaceLock.acquireLock(
      workspacePath,
      {
        workspacePath,
        activeRunId: 'run-11',
        taskId: 'tsk-11',
        taskTitle: 'Refactor Auth Routes',
        workerName: 'Raka',
        lockedAt: new Date().toISOString()
      },
      'wait'
    )

    expect(lock2.acquired).toBe(false)
    expect(lock2.conflictAction).toBe('locked_wait')
    expect(lock2.currentLock?.activeRunId).toBe(run10.id)
  })

  it('Scenario 2: Workspace Lock Policies — allow_concurrent and stop_existing work as specified', async () => {
    const workspacePath = 'C:/Projects/company-api'

    const runRepo = new MockAgentRunRepository()
    const run10 = await runRepo.create({
      assignmentId: 'asg-10',
      taskId: 'tsk-10',
      taskTitle: 'Company API Feature',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend Specialist',
      status: 'Running',
      currentStep: 'Working',
      progress: 25,
      attempt: 1,
      logs: [],
      startedAt: new Date().toISOString()
    })

    // Run #10 locks path
    await globalWorkspaceLock.acquireLock(workspacePath, {
      workspacePath,
      activeRunId: run10.id,
      taskId: 'tsk-10',
      taskTitle: 'Company API Feature',
      workerName: 'Bima',
      lockedAt: new Date().toISOString()
    })

    // allow_concurrent policy permits execution
    const concurrentLock = await globalWorkspaceLock.acquireLock(
      workspacePath,
      {
        workspacePath,
        activeRunId: 'run-12',
        taskId: 'tsk-12',
        taskTitle: 'Telemetry Audit',
        workerName: 'Dimas',
        lockedAt: new Date().toISOString()
      },
      'allow_concurrent'
    )
    expect(concurrentLock.acquired).toBe(true)
    expect(concurrentLock.conflictAction).toBe('allowed_concurrent')

    // stop_existing preempts previous lock
    const preemptLock = await globalWorkspaceLock.acquireLock(
      workspacePath,
      {
        workspacePath,
        activeRunId: 'run-13',
        taskId: 'tsk-13',
        taskTitle: 'Emergency Hotfix',
        workerName: 'Raka',
        lockedAt: new Date().toISOString()
      },
      'stop_existing'
    )
    expect(preemptLock.acquired).toBe(true)
    expect(preemptLock.conflictAction).toBe('preempted_existing')
    expect(preemptLock.currentLock?.activeRunId).toBe('run-13')
  })

  it('Scenario 3: Workspace Lock Release — Cleanly frees lock on run termination', async () => {
    const workspacePath = 'C:/Projects/company-api'
    await globalWorkspaceLock.acquireLock(workspacePath, {
      workspacePath,
      activeRunId: 'run-20',
      taskId: 'tsk-20',
      taskTitle: 'Database Migration',
      workerName: 'Bima',
      lockedAt: new Date().toISOString()
    })

    expect(globalWorkspaceLock.isLocked(workspacePath).locked).toBe(true)

    // Release lock
    const released = globalWorkspaceLock.releaseLock(workspacePath, 'run-20')
    expect(released).toBe(true)
    expect(globalWorkspaceLock.isLocked(workspacePath).locked).toBe(false)
  })

  it('Scenario 4: Cost Ledger — Records immutable CostEntry ledger records with tokens & costUsd', async () => {
    const costStore = useCostLedgerStore()

    const entry1 = await costStore.recordCost({
      workspaceId: 'ws-dev',
      runId: 'run-101',
      taskId: 'tsk-101',
      projectId: 'prj-company-api',
      workerId: 'emp-bima',
      provider: 'Anthropic',
      model: 'claude-3-5-sonnet',
      tokens: 4200,
      inputTokens: 3000,
      outputTokens: 1200,
      cachedTokens: 800,
      costUsd: 0.027
    })

    const entry2 = await costStore.recordCost({
      workspaceId: 'ws-dev',
      runId: 'run-102',
      taskId: 'tsk-102',
      projectId: 'prj-company-api',
      workerId: 'emp-maya',
      provider: 'OpenAI',
      model: 'gpt-4o',
      tokens: 2500,
      inputTokens: 1500,
      outputTokens: 1000,
      costUsd: 0.0175
    })

    expect(entry1.id).toBeDefined()
    expect(entry2.id).toBeDefined()
    expect(entry1.costUsd).toBe(0.027)
    expect(costStore.totalCostUsd).toBeCloseTo(0.0445, 4)
    expect(costStore.totalTokens).toBe(6700)
    expect(costStore.costByProject['prj-company-api']).toBeCloseTo(0.0445, 4)
    expect(costStore.costByModel['claude-3-5-sonnet']).toBe(0.027)
  })

  it('Scenario 5: Audit Log Integrity — All Owner mutations generate immutable structured audit entries', async () => {
    const taskStore = useTaskStore()
    const projectStore = useProjectStore()
    const scheduleStore = useScheduleStore()
    const auditStore = useAuditLogStore()

    // 1. Task Lifecycle Audit
    const task = await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'Satria UI',
      title: 'Audited Task',
      description: 'Testing audit trail capture',
      status: 'Todo',
      priority: 'High',
      assigneeName: 'Bima',
      dueDate: '2026-08-30',
      tags: ['Audit']
    })

    await taskStore.cancelTask(task.id, 'No longer needed')
    await taskStore.archiveTask(task.id)
    await taskStore.deleteTask(task.id, true, 'Cleaned up by Owner')

    // 2. Project Lifecycle Audit
    const project = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'Audited Project',
      description: 'Audit tracking',
      status: 'Active',
      path: 'C:/Projects/audited-project',
      health: 'Healthy',
      contributorsCount: 1
    })
    await projectStore.cancelProject(project.id, 'Project deprioritized')

    // 3. Schedule Lifecycle Audit
    const schedule = await scheduleStore.createSchedule({
      workspaceId: 'ws-dev',
      name: 'Audited Schedule',
      cronExpression: '0 8 * * *',
      timezone: 'Asia/Jakarta',
      recurrence: 'daily',
      enabled: true,
      taskTemplate: {
        title: 'Daily Task',
        description: 'Auto task',
        priority: 'Medium'
      }
    })
    await scheduleStore.toggleSchedule(schedule.id)

    // Verify Audit Entries in store
    await auditStore.fetchLogs()
    const allActions = auditStore.logs.map((l) => l.action)

    expect(allActions).toContain('Task Created')
    expect(allActions).toContain('Task Cancelled')
    expect(allActions).toContain('Task Archived')
    expect(allActions).toContain('Task Deleted')
    expect(allActions).toContain('Project Created')
    expect(allActions).toContain('Project Cancelled')
    expect(allActions).toContain('Schedule Created')
    expect(allActions).toContain('Schedule Disabled')

    // Check entry properties
    const taskCancelLog = auditStore.logs.find((l) => l.action === 'Task Cancelled' && l.entityId === task.id)
    expect(taskCancelLog).toBeDefined()
    expect(taskCancelLog?.actor).toBe('Owner')
    expect(taskCancelLog?.reason).toBe('No longer needed')
  })

  it('Scenario 6: Service-Level RBAC Authorization — Asserts permissions and prevents worker privilege escalation', () => {
    // Owner is authorized for everything
    expect(AuthorizationService.can('Owner', 'project:create')).toBe(true)
    expect(AuthorizationService.can('Owner', 'task:cancel')).toBe(true)
    expect(AuthorizationService.can('Owner', 'run:delete')).toBe(true)
    expect(AuthorizationService.can('Owner', 'task:change_worker')).toBe(true)

    // Worker has execution/view rights only
    expect(AuthorizationService.can('Worker', 'task:view')).toBe(true)
    expect(AuthorizationService.can('Worker', 'run:execute')).toBe(true)
    expect(AuthorizationService.can('Worker', 'project:create')).toBe(false)
    expect(AuthorizationService.can('Worker', 'task:cancel')).toBe(false)
    expect(AuthorizationService.can('Worker', 'run:delete')).toBe(false)

    // Assert permission throws AuthorizationError when unauthorized
    expect(() => {
      AuthorizationService.assertPermission('Worker', 'project:create', 'Create Project')
    }).toThrowError(AuthorizationError)

    expect(() => {
      AuthorizationService.assertPermission('Worker', 'task:cancel', 'Cancel Task')
    }).toThrowError(AuthorizationError)
  })

  it('Scenario 7: Backup & Restore Subsystem — Full bundle export, validation, and multi-entity database restoration', async () => {
    const taskStore = useTaskStore()
    const projectStore = useProjectStore()

    // 1. Create entities to backup
    const prj = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: 'Backup Target Project',
      description: 'Ensuring backup serialization',
      status: 'Active',
      path: 'C:/Projects/backup-target',
      health: 'Healthy',
      contributorsCount: 1
    })

    await taskStore.createTask({
      workspaceId: 'ws-dev',
      projectId: prj.id,
      projectName: prj.name,
      title: 'Backup Target Task',
      description: 'Testing task persistence in backup',
      status: 'Todo',
      priority: 'High',
      assigneeName: 'Bima',
      dueDate: '2026-08-30',
      tags: ['Backup']
    })

    // 2. Export Backup Bundle
    const bundle = await globalBackupService.exportBackup('ws-dev', 'Owner')
    expect(bundle.version).toBe('1.0')
    expect(bundle.workspaceId).toBe('ws-dev')
    expect(bundle.data.projects.length).toBeGreaterThan(0)
    expect(bundle.data.tasks.length).toBeGreaterThan(0)
    expect(bundle.data.workspacePathReferences.length).toBeGreaterThan(0)

    // Verify workspace path reference
    const prjRef = bundle.data.workspacePathReferences.find((r) => r.projectId === prj.id)
    expect(prjRef?.path).toBe('C:/Projects/backup-target')

    // 3. Validation: Rejects invalid payloads
    const invalidValidation = globalBackupService.validateBackupBundle({ invalid: true })
    expect(invalidValidation.valid).toBe(false)

    const validValidation = globalBackupService.validateBackupBundle(bundle)
    expect(validValidation.valid).toBe(true)

    // 4. Restore Backup
    const restoreResult = await globalBackupService.restoreBackup(bundle, 'Owner')
    expect(restoreResult.success).toBe(true)
    expect(restoreResult.stats.projects).toBeGreaterThan(0)
    expect(restoreResult.stats.tasks).toBeGreaterThan(0)
  })
})
