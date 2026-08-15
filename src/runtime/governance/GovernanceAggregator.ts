import type {
  AgentRun,
  RunResult,
  TaskReview,
  Employee,
  Department
} from '../../types'
import { CostCalculator } from '../telemetry/CostCalculator'

export interface GovernanceTimeFilter {
  range: 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'All Time'
  departmentId?: string
  model?: string
}

export interface FinancialGovernanceMetrics {
  totalEstimatedCostUsd: number
  formattedTotalCost: string
  totalPromptTokens: number
  totalCompletionTokens: number
  totalCachedTokens: number
  totalTokens: number
  formattedTotalTokens: string
  cacheSavingsUsd: number
  formattedCacheSavings: string
  avgCostPerRun: number
  formattedAvgCostPerRun: string
  avgCostPerCompletedTask: number
  formattedAvgCostPerTask: string
  budgetCapUsd: number
  budgetUsedPercentage: number
  budgetBurnRateDailyUsd: number
  projectedMonthEndCostUsd: number
  budgetStatus: 'healthy' | 'warning' | 'critical'
}

export interface VerificationGovernanceMetrics {
  totalEvaluatedRuns: number
  passedCount: number
  warningCount: number
  failedCount: number
  pendingCount: number
  passRate: number // 0 - 100 percentage
  warningRate: number
  failRate: number
  firstTimePassRate: number // passed on attempt 1
  qualityScoreAvg: number // 0 - 100
  evidencePassRates: {
    testSuite: { passed: number; total: number; rate: number }
    typecheck: { passed: number; total: number; rate: number }
    buildBundle: { passed: number; total: number; rate: number }
    acceptanceCriteria: { passed: number; total: number; rate: number }
    securitySandbox: { passed: number; total: number; rate: number }
  }
}

export interface ReliabilityGovernanceMetrics {
  totalRuns: number
  completedRuns: number
  failedRuns: number
  activeRuns: number
  attempt1Count: number
  attempt2Count: number
  attempt3Count: number
  retryCount: number // runs with attempt > 1
  retryRate: number // percentage of total runs
  selfHealingSuccessCount: number // runs with attempt > 1 that completed successfully
  selfHealingSuccessRate: number // percentage of retried runs that resolved successfully
  unrecoverableFailureRate: number
  avgDurationSeconds: number
  formattedAvgDuration: string
}

export interface SecurityApprovalGovernanceMetrics {
  totalApprovalsRequested: number
  approvedCount: number
  rejectedCount: number
  pendingCount: number
  approvalRate: number
  securityViolationsCount: number
  securityComplianceRate: number
  highRiskToolInvocationsCount: number
}

export interface EmployeeGovernanceSummary {
  employeeId: string
  employeeName: string
  employeeAvatar: string
  employeeRole: string
  departmentName: string
  totalRuns: number
  completedRuns: number
  totalTokens: number
  formattedTokens: string
  totalCostUsd: number
  formattedCost: string
  passRate: number
  retryRate: number
  qualityScore: number
  efficiencyScore: number // composite score (0-100)
}

export interface ModelEconomicsSummary {
  model: string
  provider: string
  promptCostPer1M: number
  completionCostPer1M: number
  totalCalls: number
  totalTokens: number
  formattedTokens: string
  promptTokens: number
  completionTokens: number
  cachedTokens: number
  totalCostUsd: number
  formattedCost: string
  avgDurationSeconds: number
  passRate: number
}

export interface DepartmentGovernanceSummary {
  departmentId: string
  departmentName: string
  employeeCount: number
  totalRuns: number
  totalTokens: number
  formattedTokens: string
  totalCostUsd: number
  formattedCost: string
  costPercentage: number
  passRate: number
  retryRate: number
}

export interface DailyGovernanceDataPoint {
  date: string
  label: string
  runsCount: number
  totalTokens: number
  totalCostUsd: number
  passedCount: number
  failedCount: number
  retriedCount: number
}

export interface GovernanceDashboardSummary {
  filter: GovernanceTimeFilter
  financials: FinancialGovernanceMetrics
  verification: VerificationGovernanceMetrics
  reliability: ReliabilityGovernanceMetrics
  security: SecurityApprovalGovernanceMetrics
  compositeComplianceScore: number
  employeeSummaries: EmployeeGovernanceSummary[]
  modelEconomics: ModelEconomicsSummary[]
  departmentSummaries: DepartmentGovernanceSummary[]
  dailyTrend: DailyGovernanceDataPoint[]
}

export class GovernanceAggregator {
  /**
   * Main aggregation pipeline calculating full governance metrics
   */
  static aggregate(params: {
    runs: AgentRun[]
    results?: RunResult[]
    reviews?: TaskReview[]
    employees?: Employee[]
    departments?: Department[]
    filter?: GovernanceTimeFilter
    budgetCapUsd?: number
  }): GovernanceDashboardSummary {
    const filter = params.filter || { range: 'All Time' }
    const budgetCap = params.budgetCapUsd ?? 50.0

    // 1. Filter runs by time range, department, and model
    const filteredRuns = this.filterRuns(params.runs, filter, params.employees)
    const results = params.results || []
    const reviews = params.reviews || []
    const employees = params.employees || []
    const departments = params.departments || []

    // 2. Financial Metrics
    const financials = this.calculateFinancials(filteredRuns, budgetCap)

    // 3. Verification & Quality Gate Metrics
    const verification = this.calculateVerification(filteredRuns, results)

    // 4. Reliability & Retry Governance Metrics
    const reliability = this.calculateReliability(filteredRuns)

    // 5. Security & Human Approval Metrics
    const security = this.calculateSecurity(filteredRuns, reviews, results)

    // 6. Composite Governance Compliance Score (0 - 100)
    // Formula: 40% Verification Pass Rate + 30% Security Compliance + 20% Self Healing / Reliability + 10% Budget Health
    const budgetScore = financials.budgetStatus === 'healthy' ? 100 : financials.budgetStatus === 'warning' ? 70 : 30
    const compositeComplianceScore = Math.round(
      verification.passRate * 0.4 +
      security.securityComplianceRate * 0.3 +
      (100 - reliability.retryRate * 0.5) * 0.2 +
      budgetScore * 0.1
    )

    // 7. Breakdowns
    const employeeSummaries = this.calculateEmployeeSummaries(filteredRuns, results, employees, departments)
    const modelEconomics = this.calculateModelEconomics(filteredRuns, results)
    const departmentSummaries = this.calculateDepartmentSummaries(filteredRuns, employees, departments, financials.totalEstimatedCostUsd)
    const dailyTrend = this.calculateDailyTrend(filteredRuns)

    return {
      filter,
      financials,
      verification,
      reliability,
      security,
      compositeComplianceScore: Math.min(100, Math.max(0, compositeComplianceScore)),
      employeeSummaries,
      modelEconomics,
      departmentSummaries,
      dailyTrend
    }
  }

  /**
   * Filter runs by date range, department, and model
   */
  private static filterRuns(
    runs: AgentRun[],
    filter: GovernanceTimeFilter,
    employees: Employee[] = []
  ): AgentRun[] {
    const now = new Date().getTime()
    const oneDayMs = 24 * 60 * 60 * 1000

    return runs.filter((run) => {
      // Model filter
      if (filter.model && filter.model !== 'all') {
        const runModel = run.telemetry?.model || ''
        if (runModel !== filter.model) return false
      }

      // Department filter
      if (filter.departmentId && filter.departmentId !== 'all') {
        const emp = employees.find((e) => e.id === run.employeeId)
        if (emp && emp.departmentId !== filter.departmentId) return false
      }

      // Time Range filter
      if (!run.createdAt && !run.startedAt) return true
      const runTime = new Date(run.startedAt || run.createdAt).getTime()
      const diffDays = (now - runTime) / oneDayMs

      if (filter.range === 'Today') {
        return diffDays <= 1
      }
      if (filter.range === 'Last 7 Days') {
        return diffDays <= 7
      }
      if (filter.range === 'Last 30 Days' || filter.range === 'This Month') {
        return diffDays <= 30
      }

      return true // 'All Time'
    })
  }

  /**
   * Calculates Financial & Token Economics metrics
   */
  private static calculateFinancials(runs: AgentRun[], budgetCapUsd: number): FinancialGovernanceMetrics {
    let totalEstimatedCostUsd = 0
    let totalPromptTokens = 0
    let totalCompletionTokens = 0
    let totalCachedTokens = 0
    let totalTokens = 0
    let cacheSavingsUsd = 0

    for (const run of runs) {
      if (run.telemetry) {
        const t = run.telemetry
        const prompt = t.promptTokens || 0
        const comp = t.completionTokens || 0
        const cached = t.cachedTokens || 0
        const tot = t.totalTokens || prompt + comp + cached

        totalPromptTokens += prompt
        totalCompletionTokens += comp
        totalCachedTokens += cached
        totalTokens += tot

        // Calculate or accumulate cost
        let cost = t.estimatedCostUsd
        if (cost === null || cost === undefined) {
          cost = CostCalculator.calculate(t.model, prompt, comp, cached)
        }
        if (cost !== null && cost !== undefined) {
          totalEstimatedCostUsd += cost
        }

        // Estimate cache savings (if cached tokens used instead of full prompt pricing)
        const pricing = CostCalculator.getPricing(t.model)
        if (pricing && cached > 0) {
          const regularCost = (cached / 1_000_000) * pricing.promptCostPer1M
          const discountedCost = (cached / 1_000_000) * (pricing.cachedCostPer1M ?? 0)
          cacheSavingsUsd += Math.max(0, regularCost - discountedCost)
        }
      }
    }

    const completedRuns = runs.filter((r) => r.status === 'Completed')
    const completedCount = completedRuns.length
    const totalRunsCount = runs.length

    const avgCostPerRun = totalRunsCount > 0 ? totalEstimatedCostUsd / totalRunsCount : 0
    const avgCostPerCompletedTask = completedCount > 0 ? totalEstimatedCostUsd / completedCount : 0

    const budgetUsedPercentage = budgetCapUsd > 0
      ? Math.min(100, Math.round((totalEstimatedCostUsd / budgetCapUsd) * 1000) / 10)
      : 0

    // Estimate daily burn rate based on runs timeline
    const daysSpan = Math.max(1, Math.min(30, runs.length > 0 ? 7 : 1))
    const budgetBurnRateDailyUsd = totalEstimatedCostUsd / daysSpan
    const projectedMonthEndCostUsd = budgetBurnRateDailyUsd * 30

    let budgetStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (budgetUsedPercentage >= 90) {
      budgetStatus = 'critical'
    } else if (budgetUsedPercentage >= 70) {
      budgetStatus = 'warning'
    }

    return {
      totalEstimatedCostUsd: Math.round(totalEstimatedCostUsd * 100000) / 100000,
      formattedTotalCost: CostCalculator.formatCost(totalEstimatedCostUsd),
      totalPromptTokens,
      totalCompletionTokens,
      totalCachedTokens,
      totalTokens,
      formattedTotalTokens: CostCalculator.formatTokens(totalTokens),
      cacheSavingsUsd: Math.round(cacheSavingsUsd * 100000) / 100000,
      formattedCacheSavings: CostCalculator.formatCost(cacheSavingsUsd),
      avgCostPerRun: Math.round(avgCostPerRun * 100000) / 100000,
      formattedAvgCostPerRun: CostCalculator.formatCost(avgCostPerRun),
      avgCostPerCompletedTask: Math.round(avgCostPerCompletedTask * 100000) / 100000,
      formattedAvgCostPerTask: CostCalculator.formatCost(avgCostPerCompletedTask),
      budgetCapUsd,
      budgetUsedPercentage,
      budgetBurnRateDailyUsd: Math.round(budgetBurnRateDailyUsd * 10000) / 10000,
      projectedMonthEndCostUsd: Math.round(projectedMonthEndCostUsd * 100) / 100,
      budgetStatus
    }
  }

  /**
   * Calculates Verification & Quality Gate metrics
   */
  private static calculateVerification(runs: AgentRun[], results: RunResult[]): VerificationGovernanceMetrics {
    let passedCount = 0
    let warningCount = 0
    let failedCount = 0
    let pendingCount = 0
    let firstTimePassCount = 0

    // Evidence categories
    let testPass = 0, testTot = 0
    let typePass = 0, typeTot = 0
    let buildPass = 0, buildTot = 0
    let critPass = 0, critTot = 0
    let secPass = 0, secTot = 0

    const resultMap = new Map<string, RunResult>()
    for (const res of results) {
      resultMap.set(res.runId, res)
    }

    for (const run of runs) {
      const res = resultMap.get(run.id)
      const vStatus = res?.verificationStatus || (run.status === 'Completed' ? 'Passed' : run.status === 'Failed' ? 'Failed' : 'Pending')

      if (vStatus === 'Passed') {
        passedCount++
        if (run.attempt === 1) {
          firstTimePassCount++
        }
      } else if (vStatus === 'Warning') {
        warningCount++
      } else if (vStatus === 'Failed') {
        failedCount++
      } else {
        pendingCount++
      }

      // Aggregate evidence if available
      if (res?.verificationEvidence && res.verificationEvidence.length > 0) {
        for (const ev of res.verificationEvidence) {
          if (ev.type === 'test') {
            testTot++
            if (ev.passed) testPass++
          } else if (ev.type === 'typecheck') {
            typeTot++
            if (ev.passed) typePass++
          } else if (ev.type === 'build') {
            buildTot++
            if (ev.passed) buildPass++
          } else if (ev.type === 'criteria') {
            critTot++
            if (ev.passed) critPass++
          } else if (ev.type === 'security') {
            secTot++
            if (ev.passed) secPass++
          }
        }
      } else if (run.status === 'Completed') {
        // Baseline assumptions for completed verified runs
        critTot++; critPass++
        secTot++; secPass++
      }
    }

    const totalEvaluatedRuns = passedCount + warningCount + failedCount
    const passRate = totalEvaluatedRuns > 0 ? Math.round((passedCount / totalEvaluatedRuns) * 1000) / 10 : 100
    const warningRate = totalEvaluatedRuns > 0 ? Math.round((warningCount / totalEvaluatedRuns) * 1000) / 10 : 0
    const failRate = totalEvaluatedRuns > 0 ? Math.round((failedCount / totalEvaluatedRuns) * 1000) / 10 : 0
    const firstTimePassRate = runs.length > 0 ? Math.round((firstTimePassCount / runs.length) * 1000) / 10 : 100

    // Average Quality Score (Passed = 100, Warning = 75, Failed = 0)
    const qualityScoreSum = (passedCount * 100) + (warningCount * 75) + (failedCount * 0)
    const qualityScoreAvg = totalEvaluatedRuns > 0 ? Math.round(qualityScoreSum / totalEvaluatedRuns) : 100

    return {
      totalEvaluatedRuns,
      passedCount,
      warningCount,
      failedCount,
      pendingCount,
      passRate,
      warningRate,
      failRate,
      firstTimePassRate,
      qualityScoreAvg,
      evidencePassRates: {
        testSuite: { passed: testPass, total: testTot, rate: testTot > 0 ? Math.round((testPass / testTot) * 100) : 100 },
        typecheck: { passed: typePass, total: typeTot, rate: typeTot > 0 ? Math.round((typePass / typeTot) * 100) : 100 },
        buildBundle: { passed: buildPass, total: buildTot, rate: buildTot > 0 ? Math.round((buildPass / buildTot) * 100) : 100 },
        acceptanceCriteria: { passed: critPass, total: critTot, rate: critTot > 0 ? Math.round((critPass / critTot) * 100) : 100 },
        securitySandbox: { passed: secPass, total: secTot, rate: secTot > 0 ? Math.round((secPass / secTot) * 100) : 100 }
      }
    }
  }

  /**
   * Calculates Reliability & Retry Governance metrics
   */
  private static calculateReliability(runs: AgentRun[]): ReliabilityGovernanceMetrics {
    let completedRuns = 0
    let failedRuns = 0
    let activeRuns = 0
    let attempt1Count = 0
    let attempt2Count = 0
    let attempt3Count = 0
    let retryCount = 0
    let selfHealingSuccessCount = 0
    let totalDurationSeconds = 0
    let measuredDurationCount = 0

    for (const run of runs) {
      if (run.status === 'Completed') {
        completedRuns++
      } else if (run.status === 'Failed') {
        failedRuns++
      } else if (run.status === 'Running' || run.status === 'Starting' || run.status === 'Verifying' || run.status === 'Queued') {
        activeRuns++
      }

      if (run.attempt === 1) {
        attempt1Count++
      } else if (run.attempt === 2) {
        attempt2Count++
        retryCount++
        if (run.status === 'Completed') selfHealingSuccessCount++
      } else if (run.attempt >= 3) {
        attempt3Count++
        retryCount++
        if (run.status === 'Completed') selfHealingSuccessCount++
      }

      if (run.durationSeconds && run.durationSeconds > 0) {
        totalDurationSeconds += run.durationSeconds
        measuredDurationCount++
      } else if (run.telemetry?.durationMs) {
        totalDurationSeconds += Math.round(run.telemetry.durationMs / 1000)
        measuredDurationCount++
      }
    }

    const totalRuns = runs.length
    const retryRate = totalRuns > 0 ? Math.round((retryCount / totalRuns) * 1000) / 10 : 0
    const selfHealingSuccessRate = retryCount > 0
      ? Math.round((selfHealingSuccessCount / retryCount) * 1000) / 10
      : 100
    const unrecoverableFailureRate = totalRuns > 0
      ? Math.round((failedRuns / totalRuns) * 1000) / 10
      : 0
    const avgDurationSeconds = measuredDurationCount > 0 ? Math.round(totalDurationSeconds / measuredDurationCount) : 0

    return {
      totalRuns,
      completedRuns,
      failedRuns,
      activeRuns,
      attempt1Count,
      attempt2Count,
      attempt3Count,
      retryCount,
      retryRate,
      selfHealingSuccessCount,
      selfHealingSuccessRate,
      unrecoverableFailureRate,
      avgDurationSeconds,
      formattedAvgDuration: CostCalculator.formatDuration(avgDurationSeconds, false)
    }
  }

  /**
   * Calculates Security & Human Approval metrics
   */
  private static calculateSecurity(
    runs: AgentRun[],
    reviews: TaskReview[],
    results: RunResult[]
  ): SecurityApprovalGovernanceMetrics {
    let approvedCount = 0
    let rejectedCount = 0
    let pendingCount = 0

    for (const rev of reviews) {
      if (rev.status === 'Approved') approvedCount++
      else if (rev.status === 'Changes Requested' || rev.status === 'Rejected') rejectedCount++
      else pendingCount++
    }

    const totalApprovalsRequested = approvedCount + rejectedCount + pendingCount
    const approvalRate = totalApprovalsRequested > 0
      ? Math.round((approvedCount / totalApprovalsRequested) * 1000) / 10
      : 100

    // Security violation check in results/runs
    let securityViolationsCount = 0
    for (const res of results) {
      if (res.verificationEvidence) {
        const secEvidence = res.verificationEvidence.filter((e) => e.type === 'security')
        for (const se of secEvidence) {
          if (!se.passed) securityViolationsCount++
        }
      }
    }

    const totalSecurityChecks = Math.max(1, runs.length)
    const securityComplianceRate = Math.round(
      Math.max(0, 100 - (securityViolationsCount / totalSecurityChecks) * 100) * 10
    ) / 10

    // High risk tools count (e.g. tools that write or execute shell)
    const highRiskToolInvocationsCount = runs.filter((r) => r.attempt > 1 || r.status === 'Waiting').length

    return {
      totalApprovalsRequested,
      approvedCount,
      rejectedCount,
      pendingCount,
      approvalRate,
      securityViolationsCount,
      securityComplianceRate,
      highRiskToolInvocationsCount
    }
  }

  /**
   * Aggregates employee cost, quality, and reliability ledger
   */
  private static calculateEmployeeSummaries(
    runs: AgentRun[],
    results: RunResult[],
    employees: Employee[],
    departments: Department[]
  ): EmployeeGovernanceSummary[] {
    const empMap = new Map<string, {
      name: string
      avatar: string
      role: string
      dept: string
      runs: AgentRun[]
    }>()

    // Pre-populate with registered employees
    for (const emp of employees) {
      const dept = departments.find((d) => d.id === emp.departmentId)
      empMap.set(emp.id, {
        name: emp.name,
        avatar: emp.avatar,
        role: emp.roleName,
        dept: dept?.name || emp.departmentName || 'Coding',
        runs: []
      })
    }

    // Assign runs
    for (const run of runs) {
      let entry = empMap.get(run.employeeId)
      if (!entry) {
        entry = {
          name: run.employeeName || 'Agent',
          avatar: run.employeeAvatar || '',
          role: run.employeeRole || 'Specialist',
          dept: 'Coding',
          runs: []
        }
        empMap.set(run.employeeId, entry)
      }
      entry.runs.push(run)
    }

    const resultMap = new Map<string, RunResult>()
    for (const res of results) {
      resultMap.set(res.runId, res)
    }

    const summaries: EmployeeGovernanceSummary[] = []

    for (const [empId, data] of empMap.entries()) {
      if (data.runs.length === 0) continue

      let totalTokens = 0
      let totalCostUsd = 0
      let completedRuns = 0
      let passedRuns = 0
      let retriedRuns = 0

      for (const r of data.runs) {
        if (r.status === 'Completed') completedRuns++
        if (r.attempt > 1) retriedRuns++

        if (r.telemetry) {
          totalTokens += r.telemetry.totalTokens || 0
          const cost = r.telemetry.estimatedCostUsd ?? CostCalculator.calculate(
            r.telemetry.model,
            r.telemetry.promptTokens,
            r.telemetry.completionTokens,
            r.telemetry.cachedTokens
          ) ?? 0
          totalCostUsd += cost
        }

        const res = resultMap.get(r.id)
        if (res?.verificationStatus === 'Passed' || (!res && r.status === 'Completed')) {
          passedRuns++
        }
      }

      const runCount = data.runs.length
      const passRate = runCount > 0 ? Math.round((passedRuns / runCount) * 100) : 100
      const retryRate = runCount > 0 ? Math.round((retriedRuns / runCount) * 100) : 0
      const qualityScore = passRate

      // Efficiency score calculation: higher pass rate + lower retry rate + cost control
      const efficiencyScore = Math.max(0, Math.min(100, Math.round(passRate * 0.7 + (100 - retryRate) * 0.3)))

      summaries.push({
        employeeId: empId,
        employeeName: data.name,
        employeeAvatar: data.avatar,
        employeeRole: data.role,
        departmentName: data.dept,
        totalRuns: runCount,
        completedRuns,
        totalTokens,
        formattedTokens: CostCalculator.formatTokens(totalTokens),
        totalCostUsd: Math.round(totalCostUsd * 100000) / 100000,
        formattedCost: CostCalculator.formatCost(totalCostUsd),
        passRate,
        retryRate,
        qualityScore,
        efficiencyScore
      })
    }

    // Sort by total cost desc
    return summaries.sort((a, b) => b.totalCostUsd - a.totalCostUsd)
  }

  /**
   * Aggregates AI model economics, pricing, latency, and tokens
   */
  private static calculateModelEconomics(runs: AgentRun[], results: RunResult[]): ModelEconomicsSummary[] {
    const modelMap = new Map<string, {
      model: string
      provider: string
      calls: number
      promptTokens: number
      completionTokens: number
      cachedTokens: number
      totalTokens: number
      totalCostUsd: number
      durationMsTotal: number
      durationCount: number
      passedCount: number
    }>()

    const resultMap = new Map<string, RunResult>()
    for (const res of results) {
      resultMap.set(res.runId, res)
    }

    for (const run of runs) {
      const model = run.telemetry?.model || 'unknown-model'
      const provider = run.telemetry?.provider || 'LLM Gateway'

      let entry = modelMap.get(model)
      if (!entry) {
        entry = {
          model,
          provider,
          calls: 0,
          promptTokens: 0,
          completionTokens: 0,
          cachedTokens: 0,
          totalTokens: 0,
          totalCostUsd: 0,
          durationMsTotal: 0,
          durationCount: 0,
          passedCount: 0
        }
        modelMap.set(model, entry)
      }

      entry.calls++
      if (run.telemetry) {
        const p = run.telemetry.promptTokens || 0
        const c = run.telemetry.completionTokens || 0
        const k = run.telemetry.cachedTokens || 0
        const tot = run.telemetry.totalTokens || p + c + k

        entry.promptTokens += p
        entry.completionTokens += c
        entry.cachedTokens += k
        entry.totalTokens += tot

        const cost = run.telemetry.estimatedCostUsd ?? CostCalculator.calculate(model, p, c, k) ?? 0
        entry.totalCostUsd += cost

        if (run.telemetry.durationMs) {
          entry.durationMsTotal += run.telemetry.durationMs
          entry.durationCount++
        }
      }

      const res = resultMap.get(run.id)
      if (res?.verificationStatus === 'Passed' || (!res && run.status === 'Completed')) {
        entry.passedCount++
      }
    }

    const summaries: ModelEconomicsSummary[] = []

    for (const [model, data] of modelMap.entries()) {
      const pricing = CostCalculator.getPricing(model)
      const avgDurationSec = data.durationCount > 0
        ? Math.round(data.durationMsTotal / data.durationCount / 1000)
        : 0
      const passRate = data.calls > 0 ? Math.round((data.passedCount / data.calls) * 100) : 100

      summaries.push({
        model,
        provider: pricing?.provider || data.provider,
        promptCostPer1M: pricing?.promptCostPer1M ?? 0,
        completionCostPer1M: pricing?.completionCostPer1M ?? 0,
        totalCalls: data.calls,
        totalTokens: data.totalTokens,
        formattedTokens: CostCalculator.formatTokens(data.totalTokens),
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        cachedTokens: data.cachedTokens,
        totalCostUsd: Math.round(data.totalCostUsd * 100000) / 100000,
        formattedCost: CostCalculator.formatCost(data.totalCostUsd),
        avgDurationSeconds: avgDurationSec,
        passRate
      })
    }

    return summaries.sort((a, b) => b.totalCostUsd - a.totalCostUsd)
  }

  /**
   * Aggregates Department-level spend, tokens, and quality
   */
  private static calculateDepartmentSummaries(
    runs: AgentRun[],
    employees: Employee[],
    departments: Department[],
    totalGlobalCost: number
  ): DepartmentGovernanceSummary[] {
    const deptMap = new Map<string, {
      name: string
      employeeCount: number
      runsCount: number
      tokens: number
      cost: number
      passed: number
      retried: number
    }>()

    // Initialize with all known departments
    for (const d of departments) {
      deptMap.set(d.id, {
        name: d.name,
        employeeCount: d.employeeCount || employees.filter((e) => e.departmentId === d.id).length,
        runsCount: 0,
        tokens: 0,
        cost: 0,
        passed: 0,
        retried: 0
      })
    }

    // Default 'dept-coding' if empty
    if (deptMap.size === 0) {
      deptMap.set('dept-coding', {
        name: 'Coding',
        employeeCount: 4,
        runsCount: 0,
        tokens: 0,
        cost: 0,
        passed: 0,
        retried: 0
      })
    }

    const empDeptMap = new Map<string, string>()
    for (const emp of employees) {
      empDeptMap.set(emp.id, emp.departmentId || 'dept-coding')
    }

    for (const run of runs) {
      const deptId = empDeptMap.get(run.employeeId) || 'dept-coding'
      let entry = deptMap.get(deptId)
      if (!entry) {
        entry = {
          name: 'Coding',
          employeeCount: 1,
          runsCount: 0,
          tokens: 0,
          cost: 0,
          passed: 0,
          retried: 0
        }
        deptMap.set(deptId, entry)
      }

      entry.runsCount++
      if (run.attempt > 1) entry.retried++
      if (run.status === 'Completed') entry.passed++

      if (run.telemetry) {
        entry.tokens += run.telemetry.totalTokens || 0
        const cost = run.telemetry.estimatedCostUsd ?? CostCalculator.calculate(
          run.telemetry.model,
          run.telemetry.promptTokens,
          run.telemetry.completionTokens,
          run.telemetry.cachedTokens
        ) ?? 0
        entry.cost += cost
      }
    }

    const summaries: DepartmentGovernanceSummary[] = []

    for (const [deptId, data] of deptMap.entries()) {
      const costPct = totalGlobalCost > 0 ? Math.round((data.cost / totalGlobalCost) * 1000) / 10 : 0
      const passRate = data.runsCount > 0 ? Math.round((data.passed / data.runsCount) * 100) : 100
      const retryRate = data.runsCount > 0 ? Math.round((data.retried / data.runsCount) * 100) : 0

      summaries.push({
        departmentId: deptId,
        departmentName: data.name,
        employeeCount: data.employeeCount,
        totalRuns: data.runsCount,
        totalTokens: data.tokens,
        formattedTokens: CostCalculator.formatTokens(data.tokens),
        totalCostUsd: Math.round(data.cost * 100000) / 100000,
        formattedCost: CostCalculator.formatCost(data.cost),
        costPercentage: costPct,
        passRate,
        retryRate
      })
    }

    return summaries.sort((a, b) => b.totalCostUsd - a.totalCostUsd)
  }

  /**
   * Generates daily historical trend data points
   */
  private static calculateDailyTrend(runs: AgentRun[]): DailyGovernanceDataPoint[] {
    const daysMap = new Map<string, {
      runs: number
      tokens: number
      cost: number
      passed: number
      failed: number
      retried: number
    }>()

    // 7-day default keys
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      daysMap.set(key, { runs: 0, tokens: 0, cost: 0, passed: 0, failed: 0, retried: 0 })
    }

    for (const run of runs) {
      const dateStr = (run.startedAt || run.createdAt || today.toISOString()).split('T')[0]
      let entry = daysMap.get(dateStr)
      if (!entry) {
        entry = { runs: 0, tokens: 0, cost: 0, passed: 0, failed: 0, retried: 0 }
        daysMap.set(dateStr, entry)
      }

      entry.runs++
      if (run.status === 'Completed') entry.passed++
      if (run.status === 'Failed') entry.failed++
      if (run.attempt > 1) entry.retried++

      if (run.telemetry) {
        entry.tokens += run.telemetry.totalTokens || 0
        const cost = run.telemetry.estimatedCostUsd ?? CostCalculator.calculate(
          run.telemetry.model,
          run.telemetry.promptTokens,
          run.telemetry.completionTokens,
          run.telemetry.cachedTokens
        ) ?? 0
        entry.cost += cost
      }
    }

    const trend: DailyGovernanceDataPoint[] = []
    for (const [date, val] of daysMap.entries()) {
      const dObj = new Date(date)
      const label = isNaN(dObj.getTime())
        ? date
        : dObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })

      trend.push({
        date,
        label,
        runsCount: val.runs,
        totalTokens: val.tokens,
        totalCostUsd: Math.round(val.cost * 10000) / 10000,
        passedCount: val.passed,
        failedCount: val.failed,
        retriedCount: val.retried
      })
    }

    return trend.slice(-7) // Return last 7 days sorted chronologically
  }
}
