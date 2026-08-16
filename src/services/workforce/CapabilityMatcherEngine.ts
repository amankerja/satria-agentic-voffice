import type {
  Employee,
  Task,
  AgentRun,
  TaskAssignment,
  CandidateAgentRanking,
  CapabilityMatchReport,
  EmployeeWorkState
} from '../../types'

export class CapabilityMatcherEngine {
  /**
   * Evaluates all digital employees against task requirements and ranks them using Capability Formula 2.0:
   * Score = SkillMatch(40%) + Performance(25%) + Availability(15%) + CostEfficiency(10%) - RiskPenalty(10%)
   */
  static evaluateCandidates(
    task: Partial<Task>,
    employees: Employee[],
    historicalRuns: AgentRun[] = [],
    activeAssignments: TaskAssignment[] = []
  ): CapabilityMatchReport {
    const requiredSkillIds = task.requiredSkillIds || []
    const optionalSkillIds = task.optionalSkillIds || []

    const rankings: CandidateAgentRanking[] = employees
      .filter((emp) => emp.status !== 'Archived')
      .map((emp) => {
        // 1. Skill Match (40% Weight)
        const empSkillIds = (emp.skills || []).map((s) => s.skillId)
        const matchedRequired = requiredSkillIds.filter((id) => empSkillIds.includes(id))
        const missingRequired = requiredSkillIds.filter((id) => !empSkillIds.includes(id))
        const matchedOptional = optionalSkillIds.filter((id) => empSkillIds.includes(id))

        let skillMatchPercentage = 100
        if (requiredSkillIds.length > 0) {
          const reqRatio = matchedRequired.length / requiredSkillIds.length
          const optBonus = optionalSkillIds.length > 0 ? (matchedOptional.length / optionalSkillIds.length) * 0.15 : 0
          skillMatchPercentage = Math.min(100, Math.round(reqRatio * 85 + optBonus * 100))
        }

        // 2. Performance Track Record (25% Weight)
        const empRuns = historicalRuns.filter((r) => r.employeeId === emp.id)
        let performanceScore = 88 // Baseline for new agents
        if (empRuns.length > 0) {
          const successfulRuns = empRuns.filter((r) => r.status === 'Completed').length
          const successRatio = successfulRuns / empRuns.length
          performanceScore = Math.round(successRatio * 100)
        }

        // 3. Live Availability & Workload (15% Weight)
        const activeCount = activeAssignments.filter(
          (a) => a.employeeId === emp.id && (a.status === 'In Progress' || a.status === 'Assigned')
        ).length

        let workState: EmployeeWorkState
        let availabilityScore: number

        if (emp.status === 'Inactive') {
          workState = 'Waiting'
          availabilityScore = 0
        } else if (activeCount >= 3) {
          workState = 'Running'
          availabilityScore = 20
        } else if (activeCount >= 1) {
          workState = 'Assigned'
          availabilityScore = 65
        } else {
          workState = emp.workState || 'Idle'
          availabilityScore = 100
        }

        // 4. Cost Efficiency Score (10% Weight)
        let costEfficiencyScore = 90
        if (empRuns.length > 0) {
          const totalCost = empRuns.reduce((sum, r) => sum + (r.telemetry?.estimatedCostUsd || 0.005), 0)
          const avgCost = totalCost / empRuns.length
          if (avgCost < 0.01) costEfficiencyScore = 98
          else if (avgCost < 0.03) costEfficiencyScore = 90
          else costEfficiencyScore = 75
        }

        // 5. Risk Penalty (-10% Max)
        let riskPenalty = 0
        if (missingRequired.length > 0) {
          riskPenalty += missingRequired.length * 15
        }
        const recentFails = empRuns.slice(-3).filter((r) => r.status === 'Failed').length
        if (recentFails > 0) {
          riskPenalty += recentFails * 10
        }
        riskPenalty = Math.min(40, riskPenalty)

        // 6. Compute Final Weighted Capability Score (0 - 100)
        const rawScore =
          skillMatchPercentage * 0.4 +
          performanceScore * 0.25 +
          availabilityScore * 0.15 +
          costEfficiencyScore * 0.1 -
          riskPenalty

        const capabilityScore = Math.max(5, Math.min(100, Math.round(rawScore)))

        // 7. Reason synthesis
        let recommendedReason: string
        if (missingRequired.length > 0) {
          recommendedReason = `Kurang ${missingRequired.length} skill wajib. Risiko penolakan task tinggi.`
        } else if (workState === 'Idle' && skillMatchPercentage >= 90) {
          recommendedReason = `Kandidat Ideal: Skill match ${skillMatchPercentage}%, performa ${performanceScore}%, sedang Idle.`
        } else if (activeCount > 0) {
          recommendedReason = `Skill match ${skillMatchPercentage}%, namun sedang menangani ${activeCount} task aktif.`
        } else {
          recommendedReason = `Kecocokan ${capabilityScore}%. Sesuai dengan spesifikasi task.`
        }

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          employeeRole: emp.roleName || 'Digital Worker',
          employeeAvatar: emp.avatar,
          departmentName: emp.departmentName || 'General',
          capabilityScore,
          skillMatchPercentage,
          performanceScore,
          availabilityScore,
          costEfficiencyScore,
          riskPenalty,
          matchedSkills: matchedRequired,
          missingSkills: missingRequired,
          workState,
          recommendedReason,
          isBestMatch: false
        }
      })

    // Sort descending by capabilityScore
    rankings.sort((a, b) => b.capabilityScore - a.capabilityScore)

    if (rankings.length > 0 && rankings[0].capabilityScore >= 50) {
      rankings[0].isBestMatch = true
    }

    return {
      taskId: task.id || 'tsk-unassigned',
      taskTitle: task.title || 'Untitled Task',
      requiredSkillIds,
      bestCandidate: rankings.find((r) => r.isBestMatch) || rankings[0],
      rankings,
      evaluatedAt: new Date().toISOString()
    }
  }
}
