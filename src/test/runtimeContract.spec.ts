import { describe, it, expect, vi } from 'vitest'
import { MockRuntimeAdapter } from '../runtime/mock/MockRuntimeAdapter'
import { HermesRuntimeAdapter } from '../runtime/hermes/HermesRuntimeAdapter'
import { HermesClient } from '../runtime/hermes/HermesClient'
import type { AgentRuntime, AgentRunInput } from '../runtime/types'

describe('AgentRuntime Interface Contract Verification', () => {
  const sampleInput: AgentRunInput = {
    runId: 'run-contract-01',
    assignment: {
      id: 'asg-contract-01',
      taskId: 'tsk-contract-01',
      taskTitle: 'Contract Test Task',
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
    taskPrompt: 'Execute contract test',
    acceptanceCriteria: ['Pass interface assertions']
  }

  const runtimes: { name: string; create: () => AgentRuntime }[] = [
    {
      name: 'MockRuntimeAdapter',
      create: () => new MockRuntimeAdapter()
    },
    {
      name: 'HermesRuntimeAdapter',
      create: () => {
        const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
        vi.spyOn(client, 'healthCheck').mockResolvedValue({ ok: true, version: '1.0.0', latencyMs: 15 })
        vi.spyOn(client, 'initiateRun').mockResolvedValue({ run_id: 'run_contract_101', status: 'started' })
        vi.spyOn(client, 'connectEventStream').mockImplementation((_runId, onMessage) => {
          onMessage({ type: 'progress', progress: 50, step: 'Working' })
          return () => {}
        })
        vi.spyOn(client, 'stopRun').mockResolvedValue(undefined)
        vi.spyOn(client, 'sendSignal').mockResolvedValue(undefined)
        return new HermesRuntimeAdapter(client)
      }
    }
  ]

  runtimes.forEach(({ name, create }) => {
    describe(`Runtime Contract: ${name}`, () => {
      it('implements mode, healthCheck, start, cancel, pause, resume, and respondApproval', async () => {
        const runtime = create()

        expect(['mock', 'hermes']).toContain(runtime.mode)
        expect(typeof runtime.start).toBe('function')
        expect(typeof runtime.cancel).toBe('function')
        expect(typeof runtime.pause).toBe('function')
        expect(typeof runtime.resume).toBe('function')
        expect(typeof runtime.retry).toBe('function')
        expect(typeof runtime.respondApproval).toBe('function')
        expect(typeof runtime.checkHealth).toBe('function')

        const health = await runtime.checkHealth()
        expect(typeof health.healthy).toBe('boolean')
        expect(typeof health.latencyMs).toBe('number')
        expect(typeof health.message).toBe('string')

        let started = false
        await runtime.start(sampleInput, () => {
          started = true
        })
        expect(started).toBe(true)
        await runtime.cancel(sampleInput.runId)
      })
    })
  })
})
