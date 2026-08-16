import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { DepartmentBudgetGuard } from '../runtime/governance/DepartmentBudgetGuard'
import { AgentEvaluationLab } from '../services/evaluation/AgentEvaluationLab'
import { useEvaluationStore } from '../stores/evaluation'
import type { Employee, AgentRun } from '../types'

describe('SATRIA AI Workforce — Budget Guard & Agent Evaluation Lab (Phase 4.4 & 4.5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockEmployeeEng: Employee = {
    id: 'emp-bima',
    name: 'Bima Wicaksono',
    roleId: 'role-backend',
    roleName: 'Senior Backend Engineer',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    avatar: '',
    status: 'Active',
    description: 'Backend specialist',
    skills: [],
    toolIds: [],
    permissions: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01'
  }

  const mockEmployeeHustle: Employee = {
    id: 'emp-maya',
    name: 'Maya Salsabila',
    roleId: 'role-marketing',
    roleName: 'Growth & Social Operations',
    departmentId: 'dept-side-hustle',
    departmentName: 'Side Hustle Operations',
    avatar: '',
    status: 'Active',
    description: 'Growth specialist',
    skills: [],
    toolIds: [],
    permissions: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01'
  }

  describe('1. DepartmentBudgetGuard (Phase 4.4)', () => {
    const currentMonth = new Date().toISOString().substring(0, 7)

    it('returns ALLOW when department spending is well below cap', () => {
      const runs: AgentRun[] = [
        {
          id: 'run-01',
          assignmentId: 'asg-01',
          currentStep: 'Completing',
          progress: 100,
          taskId: 'tsk-01',
          taskTitle: 'Quick fix',
          employeeId: 'emp-bima',
          employeeName: 'Bima Wicaksono',
          employeeAvatar: '',
          employeeRole: 'Senior Backend Engineer',
          status: 'Completed',
          attempt: 1,
          startedAt: `${currentMonth}-05T10:00:00Z`,
          createdAt: `${currentMonth}-05T10:00:00Z`,
          updatedAt: `${currentMonth}-05T10:00:00Z`,
          telemetry: {
            promptTokens: 1000,
            completionTokens: 200,
            totalTokens: 1200,
            cachedTokens: 0,
            estimatedCostUsd: 0.05,
            durationMs: 1200,
            model: 'claude-3-5-sonnet-20241022',
            provider: 'Anthropic'
          },
          logs: []
        }
      ]

      const check = DepartmentBudgetGuard.verifyQuota(
        mockEmployeeEng,
        { 'dept-eng': 30.0 },
        runs,
        true
      )

      expect(check.allowed).toBe(true)
      expect(check.action).toBe('ALLOW')
      expect(check.burnPercentage).toBeLessThan(10)
    })

    it('returns WARNING when department spending reaches 85% threshold', () => {
      const runs: AgentRun[] = [
        {
          id: 'run-02',
          assignmentId: 'asg-02',
          currentStep: 'Completing',
          progress: 100,
          taskId: 'tsk-02',
          taskTitle: 'Heavy load test',
          employeeId: 'emp-bima',
          employeeName: 'Bima Wicaksono',
          employeeAvatar: '',
          employeeRole: 'Senior Backend Engineer',
          status: 'Completed',
          attempt: 1,
          startedAt: `${currentMonth}-10T10:00:00Z`,
          createdAt: `${currentMonth}-10T10:00:00Z`,
          updatedAt: `${currentMonth}-10T10:00:00Z`,
          telemetry: {
            promptTokens: 500000,
            completionTokens: 200000,
            totalTokens: 700000,
            cachedTokens: 0,
            estimatedCostUsd: 26.50, // 26.50 / 30 = 88.3%
            durationMs: 45000,
            model: 'claude-3-5-sonnet-20241022',
            provider: 'Anthropic'
          },
          logs: []
        }
      ]

      const check = DepartmentBudgetGuard.verifyQuota(
        mockEmployeeEng,
        { 'dept-eng': 30.0 },
        runs,
        true
      )

      expect(check.allowed).toBe(true)
      expect(check.action).toBe('WARNING')
      expect(check.burnPercentage).toBeGreaterThanOrEqual(85)
      expect(check.message).toContain('BUDGET_WARNING')
    })

    it('returns BLOCK when spending exceeds cap and hardCapEnabled is active', () => {
      const runs: AgentRun[] = [
        {
          id: 'run-03',
          assignmentId: 'asg-03',
          currentStep: 'Completing',
          progress: 100,
          taskId: 'tsk-03',
          taskTitle: 'Massive batch processing',
          employeeId: 'emp-bima',
          employeeName: 'Bima Wicaksono',
          employeeAvatar: '',
          employeeRole: 'Senior Backend Engineer',
          status: 'Completed',
          attempt: 1,
          startedAt: `${currentMonth}-12T10:00:00Z`,
          createdAt: `${currentMonth}-12T10:00:00Z`,
          updatedAt: `${currentMonth}-12T10:00:00Z`,
          telemetry: {
            promptTokens: 1000000,
            completionTokens: 500000,
            totalTokens: 1500000,
            cachedTokens: 0,
            estimatedCostUsd: 31.20, // > $30.00
            durationMs: 90000,
            model: 'claude-3-5-sonnet-20241022',
            provider: 'Anthropic'
          },
          logs: []
        }
      ]

      const check = DepartmentBudgetGuard.verifyQuota(
        mockEmployeeEng,
        { 'dept-eng': 30.0 },
        runs,
        true
      )

      expect(check.allowed).toBe(false)
      expect(check.action).toBe('BLOCK')
      expect(check.message).toContain('BUDGET_CAP_EXCEEDED')
    })
  })

  describe('2. AgentEvaluationLab & Benchmark Hub (Phase 4.5)', () => {
    it('executes individual benchmark suites with role-calibrated scoring', () => {
      const codingResult = AgentEvaluationLab.runBenchmark(mockEmployeeEng, 'CODING')
      expect(codingResult.score).toBeGreaterThanOrEqual(90)
      expect(codingResult.accuracyRate).toBeGreaterThanOrEqual(0.95)
      expect(codingResult.details).toContain('Vitest')

      const extractionResult = AgentEvaluationLab.runBenchmark(mockEmployeeHustle, 'EXTRACTION')
      expect(extractionResult.score).toBeGreaterThanOrEqual(95)
      expect(extractionResult.details).toContain('transaction')
    })

    it('generates multi-pillar leaderboard with composite scores and tier badges', () => {
      const leaderboard = AgentEvaluationLab.generateLeaderboard(
        [mockEmployeeEng, mockEmployeeHustle],
        []
      )

      expect(leaderboard.length).toBe(2)
      expect(leaderboard[0].rank).toBe(1)
      expect(leaderboard[1].rank).toBe(2)
      expect(['S', 'A', 'B']).toContain(leaderboard[0].tierBadge)
      expect(leaderboard[0].compositeScore).toBeGreaterThan(60)
    })

    it('runs benchmark actions seamlessly through useEvaluationStore', async () => {
      const store = useEvaluationStore()
      const result = await store.runBenchmarkForEmployee(mockEmployeeEng, 'REASONING')

      expect(result.suiteType).toBe('REASONING')
      expect(store.benchmarkHistory.length).toBe(1)
      expect(store.filteredHistory.length).toBe(1)
    })
  })
})
