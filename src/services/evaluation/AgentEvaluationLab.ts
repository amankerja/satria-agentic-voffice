import type {
  Employee,
  BenchmarkSuiteType,
  AgentBenchmarkResult,
  AgentEvaluationLeaderboardItem
} from '../../types'

export class AgentEvaluationLab {
  /**
   * Runs an empirical benchmark simulation test suite for a digital worker
   */
  static runBenchmark(
    employee: Employee,
    suiteType: BenchmarkSuiteType
  ): AgentBenchmarkResult {
    const role = (employee.roleName || '').toLowerCase()
    const isEng = role.includes('backend') || role.includes('full-stack') || role.includes('developer') || role.includes('qa') || role.includes('engineer')
    const isFrontend = role.includes('frontend') || role.includes('ui') || role.includes('designer')
    const isDataOrHustle = role.includes('analyst') || role.includes('marketing') || role.includes('sales') || role.includes('operations')

    let score = 80
    let accuracyRate = 0.85
    let tokensConsumed = 450
    let latencyMs = 850
    let costUsd = 0.003
    let details = ''

    switch (suiteType) {
      case 'CODING':
        if (isEng) {
          score = 96
          accuracyRate = 0.98
          tokensConsumed = 620
          latencyMs = 950
          costUsd = 0.0055
          details = 'Syntactic AST valid, 12/12 Vitest unit test assertions passed, zero typecheck errors.'
        } else if (isFrontend) {
          score = 88
          accuracyRate = 0.90
          tokensConsumed = 580
          latencyMs = 820
          costUsd = 0.004
          details = 'Vue 3 SFC template valid, WCAG accessibility aria attributes passed, 1 minor lint warning.'
        } else {
          score = 65
          accuracyRate = 0.70
          tokensConsumed = 400
          latencyMs = 700
          costUsd = 0.0025
          details = 'Basic script syntax correct, but failed complex edge-case assertions.'
        }
        break

      case 'REASONING':
        if (role.includes('lead') || role.includes('planner') || isEng) {
          score = 94
          accuracyRate = 0.96
          tokensConsumed = 850
          latencyMs = 1200
          costUsd = 0.0075
          details = 'Multi-step dependency resolution succeeded without circular locks or deadlocks.'
        } else {
          score = 82
          accuracyRate = 0.85
          tokensConsumed = 600
          latencyMs = 900
          costUsd = 0.0045
          details = 'Linear step plan executed successfully, sub-goal optimization partially completed.'
        }
        break

      case 'EXTRACTION':
        if (isDataOrHustle) {
          score = 97
          accuracyRate = 0.99
          tokensConsumed = 350
          latencyMs = 450
          costUsd = 0.0015
          details = 'Extracted 15 transaction rows from noisy email, 100% field precision on amount, date, and sender.'
        } else if (isEng) {
          score = 90
          accuracyRate = 0.92
          tokensConsumed = 420
          latencyMs = 520
          costUsd = 0.002
          details = 'JSON schema valid, regex pattern matching succeeded on all standard fields.'
        } else {
          score = 78
          accuracyRate = 0.80
          tokensConsumed = 380
          latencyMs = 480
          costUsd = 0.0018
          details = 'Extracted primary values, but missed 2 nested optional transaction metadata fields.'
        }
        break

      case 'LATENCY':
        if (isFrontend || role.includes('hustle')) {
          score = 95
          latencyMs = 280
          accuracyRate = 0.95
          tokensConsumed = 290
          costUsd = 0.001
          details = 'Sub-300ms SLA achieved. Instantaneous token stream with early return pattern.'
        } else {
          score = 86
          latencyMs = 650
          accuracyRate = 0.92
          tokensConsumed = 480
          costUsd = 0.003
          details = 'Moderate latency within standard 1-second timeout envelope.'
        }
        break

      case 'COST':
        if (role.includes('hustle') || isDataOrHustle) {
          score = 98
          costUsd = 0.0008
          tokensConsumed = 210
          latencyMs = 320
          accuracyRate = 0.96
          details = 'Ultra-efficient prompt token density, 92% prompt cache hit rate via compact system prompts.'
        } else {
          score = 84
          costUsd = 0.004
          tokensConsumed = 520
          latencyMs = 750
          accuracyRate = 0.93
          details = 'Standard token usage within budgeted limits for complex coding instructions.'
        }
        break
    }

    return {
      id: `bmk-${employee.id}-${suiteType.toLowerCase()}-${Date.now()}`,
      workspaceId: 'ws-dev',
      employeeId: employee.id,
      employeeName: employee.name,
      employeeRole: employee.roleName || 'Digital Worker',
      suiteType,
      score,
      accuracyRate,
      tokensConsumed,
      latencyMs,
      costUsd,
      details,
      runAt: new Date().toISOString()
    }
  }

  /**
   * Computes Leaderboard rankings across all 5 benchmark pillars
   */
  static generateLeaderboard(
    employees: Employee[],
    benchmarkHistory: AgentBenchmarkResult[] = []
  ): AgentEvaluationLeaderboardItem[] {
    const activeEmployees = employees.filter((e) => e.status !== 'Archived')

    const items: AgentEvaluationLeaderboardItem[] = activeEmployees.map((emp) => {
      const empBenchmarks = benchmarkHistory.filter((b) => b.employeeId === emp.id)

      const getLatestScore = (type: BenchmarkSuiteType, defaultScore: number) => {
        const matches = empBenchmarks.filter((b) => b.suiteType === type)
        if (matches.length > 0) {
          return matches[matches.length - 1].score
        }
        return defaultScore
      }

      // Default baseline scores per employee profile if not tested yet
      const role = (emp.roleName || '').toLowerCase()
      const isEng = role.includes('backend') || role.includes('engineer') || role.includes('developer')
      const isQa = role.includes('qa') || role.includes('security')
      const isFrontend = role.includes('frontend') || role.includes('ui')
      const isHustle = role.includes('marketing') || role.includes('sales') || role.includes('operations')

      const codingScore = getLatestScore('CODING', isEng ? 96 : isQa ? 92 : isFrontend ? 88 : 70)
      const reasoningScore = getLatestScore('REASONING', isEng ? 94 : isQa ? 91 : isFrontend ? 84 : 88)
      const extractionScore = getLatestScore('EXTRACTION', isHustle ? 98 : isEng ? 90 : 82)
      const latencyScore = getLatestScore('LATENCY', isFrontend ? 95 : isHustle ? 94 : 86)
      const costScore = getLatestScore('COST', isHustle ? 98 : isFrontend ? 92 : 85)

      // 5-Pillar Weighted Composite Formula:
      // Composite = Coding(30%) + Reasoning(25%) + Extraction(20%) + Latency(15%) + Cost(10%)
      const compositeScore = Math.round(
        codingScore * 0.3 +
        reasoningScore * 0.25 +
        extractionScore * 0.2 +
        latencyScore * 0.15 +
        costScore * 0.1
      )

      let tierBadge: 'S' | 'A' | 'B' | 'C'
      if (compositeScore >= 92) tierBadge = 'S'
      else if (compositeScore >= 80) tierBadge = 'A'
      else if (compositeScore >= 65) tierBadge = 'B'
      else tierBadge = 'C'

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        employeeRole: emp.roleName || 'Digital Worker',
        employeeAvatar: emp.avatar,
        departmentName: emp.departmentName || 'General',
        compositeScore,
        codingScore,
        reasoningScore,
        extractionScore,
        latencyScore,
        costScore,
        tierBadge,
        rank: 1,
        benchmarkCount: empBenchmarks.length,
        lastEvaluatedAt: empBenchmarks[empBenchmarks.length - 1]?.runAt || new Date().toISOString()
      }
    })

    // Sort descending by compositeScore and assign rank
    items.sort((a, b) => b.compositeScore - a.compositeScore)
    items.forEach((item, index) => {
      item.rank = index + 1
    })

    return items
  }
}
