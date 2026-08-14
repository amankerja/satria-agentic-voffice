import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentRunStore } from '../stores/agentRun'
import { useNotificationStore } from '../stores/notification'
import { useActivityStore } from '../stores/activity'
import { RuntimeFactory } from '../runtime'

describe('SATRIA AI Workforce — Sub-Phase 3.5 Hardening: Rejected-Run State', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    RuntimeFactory.reset()
    RuntimeFactory.setDefaultMode('mock')
  })

  it('1. transitions run status to Cancelled and clears pending approval when rejected', async () => {
    const runStore = useAgentRunStore()
    const notifStore = useNotificationStore()
    const actStore = useActivityStore()

    const run = await runStore.createRun({
      id: 'asg-rej-01',
      taskId: 'tsk-rej-01',
      taskTitle: 'Drop Legacy Database Table',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead',
      skillIds: [],
      priority: 'Urgent',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    runStore.pendingApprovals[run.id] = {
      id: 'apprv-req-rej-01',
      runId: run.id,
      toolCall: {
        id: 'tc-rej-01',
        toolName: 'database.dropTable',
        parameters: { table: 'legacy_users' },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      },
      reason: 'Dropping database table legacy_users',
      requestedAt: new Date().toISOString()
    }
    run.status = 'Waiting'

    const resolved = await runStore.respondApproval(
      run.id,
      'apprv-req-rej-01',
      false,
      'Legacy table is still referenced by historical reporting service.'
    )

    expect(resolved).toBe(true)
    expect(runStore.getPendingApproval(run.id)).toBeUndefined()
    expect(run.status).toBe('Cancelled')

    // Verify audit logs
    expect(actStore.activities.length).toBeGreaterThan(0)
    expect(actStore.activities[0].targetTitle).toContain('Rejected action')

    // Verify notifications
    expect(notifStore.notifications.length).toBeGreaterThan(0)
    expect(notifStore.notifications[0].title).toBe('Approval Rejected')
    expect(notifStore.notifications[0].message).toContain('historical reporting service')
  })
})
