import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgentRunStore } from '../stores/agentRun'
import { HermesMapper } from '../runtime/hermes/HermesMapper'
import { MockAgentRunRepository } from '../repositories'
import type { TaskAssignment, AgentRun } from '../types'
import { seedTestFixtures } from './testFixtures'

describe('Telemetry & Cost Tracking Integration (Phase 3.6)', () => {
  let runStore: ReturnType<typeof useAgentRunStore>
  let runRepo: MockAgentRunRepository

  beforeEach(async () => {
    setActivePinia(createPinia())
    seedTestFixtures()
    runStore = useAgentRunStore()
    runRepo = new MockAgentRunRepository()
    await runStore.fetchRuns()
  })

  it('updates run telemetry reactively when telemetry events arrive (Test 6)', async () => {
    const assignment: TaskAssignment = {
      id: 'asg-test-tel-01',
      taskId: 'tsk-test-01',
      taskTitle: 'Integrate Live Telemetry Dashboard',
      employeeId: 'emp-maya',
      employeeName: 'Maya',
      employeeAvatar: 'https://example.com/avatar.png',
      employeeRole: 'UI/UX Frontend',
      assignedBy: 'Lead Dev',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const createdRun = await runStore.createRun(assignment, 1)
    expect(createdRun).toBeDefined()
    expect(createdRun.id).toBeDefined()

    // Simulate Hermes emitting telemetry:updated event
    const rawSse = {
      type: 'telemetry:updated',
      model: 'hermes-3-llama-3.1-70b',
      provider: 'NousResearch',
      promptTokens: 8200,
      completionTokens: 2100,
      cachedTokens: 512,
      durationMs: 45000
    }

    const event = HermesMapper.fromHermesEvent(rawSse, createdRun.id)
    expect(event.type).toBe('telemetry:updated')
    expect(event.telemetry).toBeDefined()

    // Apply event through store repository update
    if (event.telemetry) {
      createdRun.telemetry = event.telemetry
      await runRepo.update(createdRun.id, { telemetry: event.telemetry })
    }

    // Check store selectors
    const telemetry = runStore.getRunTelemetry(createdRun.id)
    expect(telemetry).toBeDefined()
    expect(telemetry?.promptTokens).toBe(8200)
    expect(telemetry?.completionTokens).toBe(2100)
    expect(telemetry?.totalTokens).toBe(10300)
    expect(telemetry?.cachedTokens).toBe(512)
    expect(telemetry?.model).toBe('hermes-3-llama-3.1-70b')

    const cost = runStore.getRunCost(createdRun.id)
    expect(cost).toBeCloseTo(0.00834, 4)

    const tokenUsage = runStore.getRunTokenUsage(createdRun.id)
    expect(tokenUsage).toEqual({
      total: 10300,
      prompt: 8200,
      completion: 2100,
      cached: 512
    })
  })

  it('persists telemetry across store fetches and navigation reloads', async () => {
    const allRuns = await runRepo.getAll()
    const runWithTel = allRuns.find((r) => r.id === 'run-103-01')

    expect(runWithTel).toBeDefined()
    expect(runWithTel?.telemetry).toBeDefined()
    expect(runWithTel?.telemetry?.model).toBe('hermes-3-llama-3.1-70b')
    expect(runWithTel?.telemetry?.totalTokens).toBe(32410)

    const fetched = await runStore.fetchRunById('run-103-01')
    expect(fetched?.telemetry?.totalTokens).toBe(32410)
    expect(runStore.getRunCost('run-103-01')).toBeCloseTo(0.02675, 4)
  })

  it('computes cumulative dashboard aggregates for tokens and estimated costs', () => {
    expect(runStore.totalTokensAllRuns).toBeGreaterThan(50000)
    expect(runStore.totalEstimatedCost).toBeGreaterThan(0)
    expect(runStore.averageDurationSeconds).toBeGreaterThan(0)
  })

  it('handles missing telemetry gracefully without throwing in selectors', () => {
    const dummyRun: AgentRun = {
      id: 'run-no-tel-99',
      assignmentId: 'asg-99',
      taskId: 'tsk-99',
      taskTitle: 'Task without telemetry',
      employeeId: 'emp-unknown',
      employeeName: 'Unknown',
      employeeAvatar: '',
      employeeRole: 'Tester',
      status: 'Queued',
      attempt: 1,
      currentStep: 'Initializing',
      progress: 0,
      logs: [],
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    runStore.runs.push(dummyRun)

    expect(runStore.getRunTelemetry('run-no-tel-99')).toBeUndefined()
    expect(runStore.getRunCost('run-no-tel-99')).toBeUndefined()
    expect(runStore.getRunTokenUsage('run-no-tel-99')).toBeUndefined()
    expect(runStore.getRunDuration('run-no-tel-99')).toBeGreaterThanOrEqual(0)
  })
})
