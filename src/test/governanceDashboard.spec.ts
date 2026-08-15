import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { GovernanceAggregator } from '../runtime/governance/GovernanceAggregator'
import {
  initialAgentRuns,
  initialRunResults,
  initialTaskReviews,
  initialEmployees,
  initialDepartments
} from '../database/initialSeed'
import type { AgentRun } from '../types'
import { useGovernanceStore } from '../stores/governance'

describe('Cost & Governance Dashboard & Analytics Engine Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('aggregates financial metrics correctly from seed runs', () => {
    const summary = GovernanceAggregator.aggregate({
      runs: initialAgentRuns,
      results: initialRunResults,
      reviews: initialTaskReviews,
      employees: initialEmployees,
      departments: initialDepartments,
      budgetCapUsd: 50.0
    })

    expect(summary.financials.totalEstimatedCostUsd).toBeGreaterThan(0)
    expect(summary.financials.totalTokens).toBeGreaterThan(100_000)
    expect(summary.financials.totalPromptTokens).toBeGreaterThan(0)
    expect(summary.financials.totalCompletionTokens).toBeGreaterThan(0)
    expect(summary.financials.budgetCapUsd).toBe(50.0)
    expect(summary.financials.budgetStatus).toBe('healthy')
    expect(summary.financials.budgetUsedPercentage).toBeLessThan(50)
  })

  it('aggregates verification pass rate and quality gate assertions', () => {
    const summary = GovernanceAggregator.aggregate({
      runs: initialAgentRuns,
      results: initialRunResults,
      reviews: initialTaskReviews,
      employees: initialEmployees,
      departments: initialDepartments
    })

    expect(summary.verification.totalEvaluatedRuns).toBeGreaterThan(0)
    expect(summary.verification.passedCount).toBeGreaterThan(0)
    expect(summary.verification.passRate).toBeGreaterThanOrEqual(75)
    expect(summary.verification.qualityScoreAvg).toBeGreaterThanOrEqual(80)

    // Evidence categories
    expect(summary.verification.evidencePassRates.testSuite.rate).toBe(100)
    expect(summary.verification.evidencePassRates.typecheck.rate).toBe(100)
    expect(summary.verification.evidencePassRates.securitySandbox.rate).toBe(100)
  })

  it('aggregates retry rates, self-healing recovery, and multi-attempt distribution', () => {
    const summary = GovernanceAggregator.aggregate({
      runs: initialAgentRuns,
      results: initialRunResults,
      reviews: initialTaskReviews,
      employees: initialEmployees,
      departments: initialDepartments
    })

    expect(summary.reliability.totalRuns).toBe(initialAgentRuns.length)
    expect(summary.reliability.attempt1Count).toBeGreaterThan(0)
    expect(summary.reliability.retryCount).toBeGreaterThanOrEqual(1) // run-103-02 is attempt #2
    expect(summary.reliability.selfHealingSuccessRate).toBe(100)
    expect(summary.reliability.unrecoverableFailureRate).toBeLessThanOrEqual(25)
  })

  it('aggregates security compliance and human approval reviews', () => {
    const summary = GovernanceAggregator.aggregate({
      runs: initialAgentRuns,
      results: initialRunResults,
      reviews: initialTaskReviews,
      employees: initialEmployees,
      departments: initialDepartments
    })

    expect(summary.security.securityViolationsCount).toBe(0)
    expect(summary.security.securityComplianceRate).toBe(100)
    expect(summary.security.totalApprovalsRequested).toBeGreaterThan(0)
    expect(summary.security.approvedCount).toBeGreaterThan(0)
    expect(summary.compositeComplianceScore).toBeGreaterThanOrEqual(85)
  })

  it('filters governance metrics by department and model', () => {
    // Filter Coding department only
    const codingSummary = GovernanceAggregator.aggregate({
      runs: initialAgentRuns,
      results: initialRunResults,
      reviews: initialTaskReviews,
      employees: initialEmployees,
      departments: initialDepartments,
      filter: {
        range: 'All Time',
        departmentId: 'dept-coding'
      }
    })

    expect(codingSummary.employeeSummaries.every((e) => e.departmentName === 'Coding')).toBe(true)

    // Filter Claude model only
    const claudeSummary = GovernanceAggregator.aggregate({
      runs: initialAgentRuns,
      results: initialRunResults,
      reviews: initialTaskReviews,
      employees: initialEmployees,
      departments: initialDepartments,
      filter: {
        range: 'All Time',
        model: 'claude-3-5-sonnet-20241022'
      }
    })

    expect(claudeSummary.reliability.totalRuns).toBe(1)
    expect(claudeSummary.modelEconomics.length).toBe(1)
    expect(claudeSummary.modelEconomics[0].model).toBe('claude-3-5-sonnet-20241022')
  })

  it('calculates employee ROI ledger and model economics ledger correctly', () => {
    const summary = GovernanceAggregator.aggregate({
      runs: initialAgentRuns,
      results: initialRunResults,
      reviews: initialTaskReviews,
      employees: initialEmployees,
      departments: initialDepartments
    })

    // Employee summaries
    expect(summary.employeeSummaries.length).toBeGreaterThan(0)
    const mayaSummary = summary.employeeSummaries.find((e) => e.employeeId === 'emp-maya')
    expect(mayaSummary).toBeDefined()
    expect(mayaSummary?.totalCostUsd).toBeGreaterThan(0)
    expect(mayaSummary?.passRate).toBe(100)

    // Model economics
    expect(summary.modelEconomics.length).toBeGreaterThan(0)
    const gpt4o = summary.modelEconomics.find((m) => m.model === 'gpt-4o')
    expect(gpt4o).toBeDefined()
    expect(gpt4o?.promptCostPer1M).toBe(2.5)
    expect(gpt4o?.completionCostPer1M).toBe(10.0)
  })

  it('handles empty / zero runs gracefully without throwing or NaN', () => {
    const emptySummary = GovernanceAggregator.aggregate({
      runs: [],
      results: [],
      reviews: [],
      employees: initialEmployees,
      departments: initialDepartments,
      budgetCapUsd: 100.0
    })

    expect(emptySummary.financials.totalEstimatedCostUsd).toBe(0)
    expect(emptySummary.financials.totalTokens).toBe(0)
    expect(emptySummary.financials.budgetUsedPercentage).toBe(0)
    expect(emptySummary.verification.passRate).toBe(100)
    expect(emptySummary.reliability.retryRate).toBe(0)
    expect(emptySummary.reliability.selfHealingSuccessRate).toBe(100)
    expect(emptySummary.security.securityComplianceRate).toBe(100)
    expect(emptySummary.compositeComplianceScore).toBeGreaterThanOrEqual(80)
  })

  it('evaluates budget cap changes and warning / critical thresholds in Pinia store', () => {
    const store = useGovernanceStore()

    expect(store.budgetCapUsd).toBe(50.0)
    store.setBudgetCap(10.0)
    expect(store.budgetCapUsd).toBe(10.0)

    // Simulate high spend run
    const highCostRun: AgentRun = {
      id: 'run-high-cost',
      assignmentId: 'asg-test',
      taskId: 'tsk-test',
      taskTitle: 'Massive dataset synthesis',
      employeeId: 'emp-raka',
      employeeName: 'Raka',
      employeeAvatar: '',
      employeeRole: 'Planner',
      status: 'Completed',
      attempt: 1,
      currentStep: 'Completing',
      progress: 100,
      logs: [],
      telemetry: {
        model: 'gpt-4o',
        provider: 'OpenAI',
        promptTokens: 2_000_000,
        completionTokens: 500_000,
        cachedTokens: 0,
        totalTokens: 2_500_000,
        estimatedCostUsd: 10.0, // exactly $10 spend
        durationMs: 60000
      },
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const highCostSummary = GovernanceAggregator.aggregate({
      runs: [highCostRun],
      budgetCapUsd: 10.0
    })

    expect(highCostSummary.financials.budgetUsedPercentage).toBe(100)
    expect(highCostSummary.financials.budgetStatus).toBe('critical')
  })
})
