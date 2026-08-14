import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentRunStore } from '../stores/agentRun'
import { useNotificationStore } from '../stores/notification'
import { useActivityStore } from '../stores/activity'
import { RuntimeFactory } from '../runtime'
import type { RuntimeEvent } from '../runtime/types'

describe('SATRIA AI Workforce — Phase 3.5: Approval Gate & Human-in-the-Loop', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    RuntimeFactory.reset()
  })

  it('receives approval:required, transitions status to Waiting, and stores pending approval', async () => {
    const runStore = useAgentRunStore()
    const notifStore = useNotificationStore()
    const actStore = useActivityStore()

    const run = await runStore.createRun({
      id: 'asg-apprv-01',
      taskId: 'tsk-apprv-01',
      taskTitle: 'Refactor Laravel Auth Controller',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Satria Lead',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    expect(run.status).toBe('Running')

    // Simulate approval required event
    const mockApprovalEvent: RuntimeEvent = {
      type: 'approval:required',
      runId: run.id,
      timestamp: new Date().toISOString(),
      approvalRequest: {
        id: 'apprv-req-901',
        runId: run.id,
        toolCall: {
          id: 'tc-901',
          toolName: 'filesystem.write',
          parameters: { path: 'app/Http/Controllers/AuthController.php' },
          isHighRisk: true,
          requestedAt: new Date().toISOString()
        },
        reason: 'Modifying AuthController.php requires user confirmation.',
        diffContent: '- public function login() {}\n+ public function login(Request $request) {}',
        requestedAt: new Date().toISOString()
      },
      log: {
        id: 'log-apprv-req',
        timestamp: new Date().toLocaleTimeString(),
        step: 'Working',
        message: 'Action [filesystem.write] paused. Waiting for human approval.',
        level: 'warn'
      }
    }

    // Dispatch directly into mock runtime event handler
    runStore.pendingApprovals[run.id] = mockApprovalEvent.approvalRequest!
    run.status = 'Waiting'

    await notifStore.createNotification({
      workspaceId: 'ws-dev',
      title: 'Approval Required',
      message: `${run.employeeName} requires approval for ${mockApprovalEvent.approvalRequest!.toolCall.toolName}`,
      priority: 'important',
      category: 'Tasks',
      link: `/runs/${run.id}`,
      read: false
    })

    await actStore.logActivity({
      workspaceId: 'ws-dev',
      actorName: run.employeeName,
      action: 'updated',
      targetType: 'task',
      targetTitle: `Approval required for action: ${mockApprovalEvent.approvalRequest!.toolCall.toolName}`
    })

    const pending = runStore.getPendingApproval(run.id)
    expect(pending).toBeDefined()
    expect(pending?.id).toBe('apprv-req-901')
    expect(pending?.toolCall.toolName).toBe('filesystem.write')
    expect(run.status).toBe('Waiting')

    expect(notifStore.notifications.length).toBeGreaterThan(0)
    expect(notifStore.notifications[0].title).toBe('Approval Required')
    expect(actStore.activities.length).toBeGreaterThan(0)
  })

  it('resumes execution and logs activity when approval is granted', async () => {
    const runStore = useAgentRunStore()
    const notifStore = useNotificationStore()
    const actStore = useActivityStore()

    const run = await runStore.createRun({
      id: 'asg-apprv-02',
      taskId: 'tsk-apprv-02',
      taskTitle: 'Update Database Migrations',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-req-902',
      runId: run.id,
      toolCall: {
        id: 'tc-902',
        toolName: 'filesystem.write',
        parameters: { path: 'database/migrations/001.php' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Create migration file',
      requestedAt: new Date().toISOString()
    }
    run.status = 'Waiting'

    const resolved = await runStore.respondApproval(run.id, 'apprv-req-902', true)
    expect(resolved).toBe(true)

    // Verify pending approval was cleared and status resumed to Running
    expect(runStore.getPendingApproval(run.id)).toBeUndefined()
    expect(run.status).toBe('Running')

    // Verify notifications & audit
    expect(notifStore.notifications[0].title).toBe('Approval Granted')
    expect(actStore.activities[0].targetTitle).toContain('Approved action')
  })

  it('stops tool execution and logs feedback when approval is rejected', async () => {
    const runStore = useAgentRunStore()
    const notifStore = useNotificationStore()
    const actStore = useActivityStore()

    const run = await runStore.createRun({
      id: 'asg-apprv-03',
      taskId: 'tsk-apprv-03',
      taskTitle: 'Delete Deprecated Routes',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead',
      skillIds: [],
      priority: 'Medium',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-req-903',
      runId: run.id,
      toolCall: {
        id: 'tc-903',
        toolName: 'filesystem.write',
        parameters: { path: 'routes/api_v1.php' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Delete deprecated v1 routes',
      requestedAt: new Date().toISOString()
    }
    run.status = 'Waiting'

    const resolved = await runStore.respondApproval(
      run.id,
      'apprv-req-903',
      false,
      'Routes are still needed for backwards compatibility.'
    )
    expect(resolved).toBe(true)

    expect(runStore.getPendingApproval(run.id)).toBeUndefined()
    expect(run.status).toBe('Cancelled')

    expect(notifStore.notifications[0].title).toBe('Approval Rejected')
    expect(notifStore.notifications[0].message).toContain('backwards compatibility')
    expect(actStore.activities[0].targetTitle).toContain('Rejected action')
  })

  it('protects against duplicate approval resolution clicks', async () => {
    const runStore = useAgentRunStore()

    const run = await runStore.createRun({
      id: 'asg-apprv-04',
      taskId: 'tsk-apprv-04',
      taskTitle: 'Deploy Staging Schema',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-req-904',
      runId: run.id,
      toolCall: {
        id: 'tc-904',
        toolName: 'deploy',
        parameters: { target: 'staging' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Deploy schema',
      requestedAt: new Date().toISOString()
    }

    // Trigger two resolutions concurrently
    const [firstClick, secondClick] = await Promise.all([
      runStore.respondApproval(run.id, 'apprv-req-904', true),
      runStore.respondApproval(run.id, 'apprv-req-904', true)
    ])

    // First click must succeed, second must be safely ignored
    expect(firstClick).toBe(true)
    expect(secondClick).toBe(false)
  })

  it('cancelling a run cleanly purges any pending approval requests', async () => {
    const runStore = useAgentRunStore()

    const run = await runStore.createRun({
      id: 'asg-apprv-05',
      taskId: 'tsk-apprv-05',
      taskTitle: 'Execute SQL Batch',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-req-905',
      runId: run.id,
      toolCall: {
        id: 'tc-905',
        toolName: 'filesystem.write',
        parameters: { path: 'seed.sql' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Write seed sql',
      requestedAt: new Date().toISOString()
    }

    expect(runStore.getPendingApproval(run.id)).toBeDefined()

    runStore.cancelRun(run.id)
    expect(run.status).toBe('Cancelled')
    expect(runStore.getPendingApproval(run.id)).toBeUndefined()
  })

  it('retrying a run purges stale approval requests and restarts attempts', async () => {
    const runStore = useAgentRunStore()

    const run = await runStore.createRun({
      id: 'asg-apprv-06',
      taskId: 'tsk-apprv-06',
      taskTitle: 'Configure CORS Policy',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead',
      skillIds: [],
      priority: 'Medium',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-req-906',
      runId: run.id,
      toolCall: {
        id: 'tc-906',
        toolName: 'filesystem.write',
        parameters: { path: 'config/cors.php' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Modify cors config',
      requestedAt: new Date().toISOString()
    }

    const retried = await runStore.retryRun(run.id)
    expect(retried?.attempt).toBe(2)
    expect(runStore.getPendingApproval(run.id)).toBeUndefined()
  })
})
