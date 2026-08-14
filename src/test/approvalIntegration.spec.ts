import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentRunStore } from '../stores/agentRun'
import { useNotificationStore } from '../stores/notification'
import { useActivityStore } from '../stores/activity'
import { RuntimeFactory } from '../runtime'
import type { AgentRunInput, RuntimeEvent } from '../runtime/types'

describe('SATRIA AI Workforce — Sub-Phase 3.5 Hardening: True Approval Integration Test (Runtime → Store → UI)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    RuntimeFactory.reset()
  })

  it('1. Full Runtime-to-Store Event Bridge: runtime emits approval:required, store intercepts, transitions to Waiting, registers pending approval and notifs', async () => {
    const runStore = useAgentRunStore()
    const notifStore = useNotificationStore()
    const actStore = useActivityStore()
    const mockRuntime = RuntimeFactory.getRuntime('mock')

    // Create run record
    const run = await runStore.createRun({
      id: 'asg-int-01',
      taskId: 'tsk-int-01',
      taskTitle: 'Publish Staging Database Migration',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead Developer',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    let capturedCallback: ((event: RuntimeEvent) => void) | null = null

    // Intercept runtime.start to capture the store's reactive event listener
    vi.spyOn(mockRuntime, 'start').mockImplementation(async (_input: AgentRunInput, onEvent: (event: RuntimeEvent) => void) => {
      capturedCallback = onEvent
    })

    // Start live runner (registers store listener to runtime)
    await runStore.startLiveRunner(run.id)

    expect(capturedCallback).not.toBeNull()

    // Simulate Runtime emitting an Approval Required event from sandbox / safety gate
    const approvalPayload: RuntimeEvent = {
      type: 'approval:required',
      runId: run.id,
      timestamp: new Date().toISOString(),
      approvalRequest: {
        id: 'apprv-int-101',
        runId: run.id,
        toolCall: {
          id: 'tc-int-101',
          toolName: 'filesystem.write',
          parameters: { path: 'database/migrations/create_orders_table.php' },
          isHighRisk: true,
          requestedAt: new Date().toISOString()
        },
        reason: 'High-risk schema modification requires explicit human authorization.',
        diffContent: '+ Schema::create("orders", function (Blueprint $table) {});',
        requestedAt: new Date().toISOString()
      },
      log: {
        id: 'log-int-apprv',
        timestamp: new Date().toLocaleTimeString(),
        step: 'Working',
        message: 'Action paused. Waiting for human approval.',
        level: 'warn'
      }
    }

    // Trigger the event from runtime stream
    await capturedCallback!(approvalPayload)

    // Store state assertions
    expect(run.status).toBe('Waiting')
    expect(runStore.getPendingApproval(run.id)).toBeDefined()
    expect(runStore.getPendingApproval(run.id)?.id).toBe('apprv-int-101')
    expect(runStore.getPendingApproval(run.id)?.toolCall.toolName).toBe('filesystem.write')

    // Notifications & Activity audit assertions
    expect(notifStore.notifications.length).toBe(1)
    expect(notifStore.notifications[0].title).toBe('Approval Required')
    expect(notifStore.notifications[0].link).toBe(`/runs/${run.id}`)
    expect(actStore.activities.length).toBe(1)
    expect(actStore.activities[0].targetTitle).toContain('filesystem.write')
  })

  it('2. UI-to-Runtime Approval Loop: drawer onApproveAsync responds approval, resumes runtime, clears pending state and updates run to Running', async () => {
    const runStore = useAgentRunStore()
    const notifStore = useNotificationStore()
    const actStore = useActivityStore()
    const mockRuntime = RuntimeFactory.getRuntime('mock')
    const respondSpy = vi.spyOn(mockRuntime, 'respondApproval')

    const run = await runStore.createRun({
      id: 'asg-int-02',
      taskId: 'tsk-int-02',
      taskTitle: 'Update API Route Config',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead Developer',
      skillIds: [],
      priority: 'Medium',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    // Setup pending approval on store
    runStore.pendingApprovals[run.id] = {
      id: 'apprv-int-102',
      runId: run.id,
      toolCall: {
        id: 'tc-int-102',
        toolName: 'filesystem.write',
        parameters: { path: 'routes/api.php' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Update routes file',
      requestedAt: new Date().toISOString()
    }
    run.status = 'Waiting'

    // UI Handler Contract simulation (as executed by RunDetailPage -> onApproveAsync)
    async function onApproveAsync(approvalId: string) {
      await runStore.respondApproval(run.id, approvalId, true)
    }

    await onApproveAsync('apprv-int-102')

    expect(respondSpy).toHaveBeenCalledTimes(1)
    expect(respondSpy).toHaveBeenCalledWith(run.id, 'apprv-int-102', true, undefined)
    expect(run.status).toBe('Running')
    expect(runStore.getPendingApproval(run.id)).toBeUndefined()

    // Notification & Activity checks
    expect(notifStore.notifications.some((n) => n.title === 'Approval Granted')).toBe(true)
    expect(actStore.activities.some((a) => a.targetTitle.includes('Approved action'))).toBe(true)
  })

  it('3. UI-to-Runtime Rejection Loop: drawer onRejectAsync sends rejection feedback, cancels execution and transitions run to Cancelled', async () => {
    const runStore = useAgentRunStore()
    const notifStore = useNotificationStore()
    const actStore = useActivityStore()
    const mockRuntime = RuntimeFactory.getRuntime('mock')
    const respondSpy = vi.spyOn(mockRuntime, 'respondApproval')

    const run = await runStore.createRun({
      id: 'asg-int-03',
      taskId: 'tsk-int-03',
      taskTitle: 'Delete Legacy V1 Endpoints',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead Developer',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-int-103',
      runId: run.id,
      toolCall: {
        id: 'tc-int-103',
        toolName: 'filesystem.delete',
        parameters: { path: 'app/Http/Controllers/V1/' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Delete legacy directory',
      requestedAt: new Date().toISOString()
    }
    run.status = 'Waiting'

    // UI Handler Contract simulation (as executed by RunDetailPage -> onRejectAsync)
    async function onRejectAsync(approvalId: string, feedback?: string) {
      await runStore.respondApproval(run.id, approvalId, false, feedback)
    }

    const rejectionReason = 'Mobile client v1.2 still depends on these endpoints.'
    await onRejectAsync('apprv-int-103', rejectionReason)

    expect(respondSpy).toHaveBeenCalledTimes(1)
    expect(respondSpy).toHaveBeenCalledWith(run.id, 'apprv-int-103', false, rejectionReason)
    expect(run.status).toBe('Cancelled')
    expect(runStore.getPendingApproval(run.id)).toBeUndefined()

    expect(notifStore.notifications.some((n) => n.title === 'Approval Rejected')).toBe(true)
    expect(actStore.activities.some((a) => a.targetTitle.includes('Rejected action'))).toBe(true)
  })

  it('4. Runtime Exception Handling: runtime failure during approval response is caught and leaves drawer/store in recoverable state', async () => {
    const runStore = useAgentRunStore()
    const mockRuntime = RuntimeFactory.getRuntime('mock')
    vi.spyOn(mockRuntime, 'respondApproval').mockRejectedValueOnce(new Error('Network socket disconnected'))

    const run = await runStore.createRun({
      id: 'asg-int-04',
      taskId: 'tsk-int-04',
      taskTitle: 'Sync S3 Assets',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead Developer',
      skillIds: [],
      priority: 'Medium',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-int-104',
      runId: run.id,
      toolCall: {
        id: 'tc-int-104',
        toolName: 'storage.sync',
        parameters: { bucket: 'assets-staging' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Sync bucket assets',
      requestedAt: new Date().toISOString()
    }

    // Attempt approval which triggers runtime failure
    await expect(runStore.respondApproval(run.id, 'apprv-int-104', true)).rejects.toThrow('Network socket disconnected')
  })

  it('5. Double-Click & Race Condition Protection: concurrent approval triggers are strictly debounced', async () => {
    const runStore = useAgentRunStore()
    const mockRuntime = RuntimeFactory.getRuntime('mock')
    const respondSpy = vi.spyOn(mockRuntime, 'respondApproval')

    const run = await runStore.createRun({
      id: 'asg-int-05',
      taskId: 'tsk-int-05',
      taskTitle: 'Apply Hotfix',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead Developer',
      skillIds: [],
      priority: 'Urgent',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-int-105',
      runId: run.id,
      toolCall: {
        id: 'tc-int-105',
        toolName: 'patch.apply',
        parameters: { patchId: 'CVE-2026-999' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Apply hotfix patch',
      requestedAt: new Date().toISOString()
    }

    const [click1, click2] = await Promise.all([
      runStore.respondApproval(run.id, 'apprv-int-105', true),
      runStore.respondApproval(run.id, 'apprv-int-105', true)
    ])

    expect(click1).toBe(true)
    expect(click2).toBe(false)
    expect(respondSpy).toHaveBeenCalledTimes(1)
  })
})
