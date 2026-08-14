import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HermesRuntimeAdapter } from '../runtime/hermes/HermesRuntimeAdapter'
import { HermesClient } from '../runtime/hermes/HermesClient'
import type { AgentRunInput, RuntimeEvent } from '../runtime/types'
import { AgentRuntimeError } from '../runtime/RuntimeError'

describe('HermesRuntimeAdapter Hardening & State Machine', () => {
  let mockClient: HermesClient
  let adapter: HermesRuntimeAdapter

  const mockInput: AgentRunInput = {
    runId: 'run-state-test-01',
    assignment: {
      id: 'asg-state-01',
      taskId: 'tsk-state-01',
      taskTitle: 'Refactor Runtime State Machine',
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
    },
    employee: {
      id: 'emp-bima',
      name: 'Bima',
      avatar: '',
      departmentId: 'dept-coding',
      roleId: 'role-backend-api',
      roleName: 'Backend API Engineer',
      departmentName: 'Coding & Engineering',
      description: 'Backend API Engineer',
      status: 'Active',
      supervisorId: 'emp-satria',
      skills: [],
      toolIds: [],
      permissions: [],
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    },
    skills: [],
    tools: [],
    workspacePath: 'c:/Projects/AI AGENTIC UI',
    taskPrompt: 'Harden runtime adapter state management.',
    acceptanceCriteria: ['All tests pass']
  }

  beforeEach(() => {
    mockClient = new HermesClient({ baseUrl: 'http://localhost:8080' })
    vi.spyOn(mockClient, 'initiateRun').mockResolvedValue({ run_id: 'run_state_999' })
    vi.spyOn(mockClient, 'connectEventStream').mockImplementation((_runId, onMessage) => {
      onMessage({
        type: 'step_progress',
        session_id: 'sess_101',
        data: { step: 'Working', progress: 50, log: 'Executing state check' }
      })
      return () => {}
    })
    vi.spyOn(mockClient, 'stopRun').mockResolvedValue(undefined)
    vi.spyOn(mockClient, 'respondApproval').mockResolvedValue(undefined)
    vi.spyOn(mockClient, 'sendSignal').mockResolvedValue(undefined)
    adapter = new HermesRuntimeAdapter(mockClient)
  })

  it('1. starts run and tracks state as running with separated IDs', async () => {
    const events: RuntimeEvent[] = []
    await adapter.start(mockInput, (e) => events.push(e))

    const state = adapter.getRunState('run-state-test-01')
    expect(state).toBeDefined()
    expect(state?.status).toBe('running')
    expect(state?.hermesRunId).toBe('run_state_999')
    expect(state?.execution?.satriaRunId).toBe('run-state-test-01')
    expect(state?.execution?.hermesRunId).toBe('run_state_999')
    expect(state?.execution?.sessionId).toBe('sess_101')
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].type).toBe('run:started')
  })

  it('2. prevents duplicate start calls on active run', async () => {
    await adapter.start(mockInput, () => {})

    await expect(adapter.start(mockInput, () => {})).rejects.toThrowError(AgentRuntimeError)
    await expect(adapter.start(mockInput, () => {})).rejects.toThrow(
      "Run run-state-test-01 is already active with status 'running'."
    )
  })

  it('3. pauses and resumes run with stop/signal', async () => {
    const events: RuntimeEvent[] = []
    await adapter.start(mockInput, (e) => events.push(e))

    await adapter.pause('run-state-test-01')
    expect(mockClient.stopRun).toHaveBeenCalledWith('run_state_999')
    expect(adapter.getRunState('run-state-test-01')?.status).toBe('paused')

    await adapter.resume('run-state-test-01')
    expect(mockClient.sendSignal).toHaveBeenCalledWith('run_state_999', 'resume')
    expect(adapter.getRunState('run-state-test-01')?.status).toBe('running')
  })

  it('4. throws SESSION_NOT_FOUND when pausing nonexistent run', async () => {
    await expect(adapter.pause('nonexistent-run')).rejects.toThrow('active Hermes session not found')
  })

  it('5. cancels active run and tears down event stream', async () => {
    let closed = false
    vi.spyOn(mockClient, 'connectEventStream').mockImplementation(() => {
      return () => {
        closed = true
      }
    })

    await adapter.start(mockInput, () => {})
    await adapter.cancel('run-state-test-01')

    expect(mockClient.stopRun).toHaveBeenCalledWith('run_state_999')
    expect(closed).toBe(true)
    expect(adapter.getRunState('run-state-test-01')?.status).toBe('cancelled')
  })

  it('6. handles rejection in approval flow and marks run cancelled', async () => {
    let streamClosed = false
    vi.spyOn(mockClient, 'connectEventStream').mockImplementation(() => {
      return () => {
        streamClosed = true
      }
    })

    const events: RuntimeEvent[] = []
    await adapter.start(mockInput, (e) => events.push(e))

    await adapter.respondApproval('run-state-test-01', 'apprv-100', false, 'Security violation')

    expect(mockClient.respondApproval).toHaveBeenCalledWith('run_state_999', {
      approval_id: 'apprv-100',
      choice: 'deny',
      message: 'Security violation',
      approved: false,
      feedback: 'Security violation'
    })
    expect(streamClosed).toBe(true)
    expect(adapter.getRunState('run-state-test-01')?.status).toBe('cancelled')
  })
})
