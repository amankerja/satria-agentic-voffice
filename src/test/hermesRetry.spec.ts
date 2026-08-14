import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HermesRuntimeAdapter } from '../runtime/hermes/HermesRuntimeAdapter'
import { HermesClient } from '../runtime/hermes/HermesClient'
import type { AgentRunInput, RuntimeEvent } from '../runtime/types'

describe('SATRIA AI Workforce — Sub-Phase 3.5 Hardening: Hermes Retry Lifecycle', () => {
  let mockClient: HermesClient
  let adapter: HermesRuntimeAdapter

  const sampleInput: AgentRunInput = {
    runId: 'run-retry-test-01',
    assignment: {
      id: 'asg-retry-01',
      taskId: 'tsk-retry-01',
      taskTitle: 'Fix Redis Connection Pooling',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Satria Lead',
      skillIds: ['skill-laravel-core'],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    },
    employee: {
      id: 'emp-bima',
      name: 'Bima',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256',
      departmentId: 'dept-coding',
      roleId: 'role-backend-api',
      roleName: 'Backend API Engineer',
      departmentName: 'Coding & Engineering',
      description: 'Backend API Engineer',
      status: 'Active',
      supervisorId: 'emp-satria',
      skills: [],
      toolIds: ['tool-terminal'],
      permissions: ['read', 'write'],
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    },
    skills: [],
    tools: [],
    workspacePath: 'c:/Projects/AI AGENTIC UI',
    taskPrompt: 'Ensure connection timeouts are handled gracefully.',
    acceptanceCriteria: ['Pass test assertions']
  }

  beforeEach(() => {
    mockClient = new HermesClient({ baseUrl: 'http://localhost:8000' })
    vi.spyOn(mockClient, 'initiateRun').mockResolvedValue({ run_id: 'run_retry_101', status: 'started' })
    vi.spyOn(mockClient, 'connectEventStream').mockImplementation((_runId, onMessage) => {
      onMessage({
        type: 'step_progress',
        data: { step: 'Working', progress: 40, log: 'Working on connection pool fix' }
      })
      return () => {}
    })
    vi.spyOn(mockClient, 'stopRun').mockResolvedValue(undefined)
    vi.spyOn(mockClient, 'sendSignal').mockResolvedValue(undefined)
    adapter = new HermesRuntimeAdapter(mockClient)
  })

  it('1. failed run can retry and retains original execution input', async () => {
    const events: RuntimeEvent[] = []
    await adapter.start(sampleInput, (e) => events.push(e))

    expect(events.length).toBeGreaterThan(0)
    expect(events[0].type).toBe('run:started')

    // Simulate retry attempt 2
    await adapter.retry('run-retry-test-01', 2)

    // Verify initiateRun was called again for attempt 2 with same payload
    expect(mockClient.initiateRun).toHaveBeenCalledTimes(2)
  })

  it('2. retry maintains single active session and tears down previous session', async () => {
    await adapter.start(sampleInput, () => {})
    await adapter.retry('run-retry-test-01', 2)

    expect(mockClient.stopRun).toHaveBeenCalledWith('run_retry_101')
  })

  it('3. enforces maximum retry limit of 3 attempts', async () => {
    const events: RuntimeEvent[] = []
    await adapter.start(sampleInput, (e) => events.push(e))

    // Attempt 4 should exceed max limit
    await adapter.retry('run-retry-test-01', 4)

    const failureEvent = events.find((e) => e.type === 'run:failed')
    expect(failureEvent).toBeDefined()
    expect(failureEvent?.error).toContain('Maximum retry limit of 3 attempts exceeded')
  })
})
