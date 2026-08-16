import type {
  Employee,
  AgentRun,
  BudgetQuotaCheckResult
} from '../../types'

export class DepartmentBudgetGuard {
  /**
   * Verifies if the employee's department has sufficient monthly budget quota.
   * If hardCapEnabled is active and current spend meets or exceeds budget, rejects execution.
   */
  static verifyQuota(
    employee: Employee,
    departmentBudgets: Record<string, number>,
    runs: AgentRun[],
    hardCapEnabled: boolean = true
  ): BudgetQuotaCheckResult {
    const deptId = employee.departmentId || 'dept-eng'
    const deptName = employee.departmentName || 'Engineering'
    const monthlyBudgetUsd = departmentBudgets[deptId] ?? 30.0

    // Filter runs in current month for employees belonging to this department
    const currentMonth = new Date().toISOString().substring(0, 7) // '2026-08'
    const deptRuns = runs.filter((r) => {
      const isThisMonth = (r.startedAt || r.createdAt || '').startsWith(currentMonth)
      return isThisMonth && (r.employeeRole?.includes(deptName) || r.employeeId === employee.id)
    })

    const currentSpendUsd = deptRuns.reduce(
      (sum, r) => sum + (r.telemetry?.estimatedCostUsd || 0.005),
      0
    )

    const burnPercentage = monthlyBudgetUsd > 0
      ? Math.round((currentSpendUsd / monthlyBudgetUsd) * 100)
      : 0

    if (currentSpendUsd >= monthlyBudgetUsd) {
      if (hardCapEnabled) {
        return {
          allowed: false,
          action: 'BLOCK',
          departmentId: deptId,
          departmentName: deptName,
          monthlyBudgetUsd,
          currentSpendUsd,
          burnPercentage,
          message: `[BUDGET_CAP_EXCEEDED] Departemen ${deptName} telah mencapai batas pagu anggaran bulanan ($${currentSpendUsd.toFixed(2)} / $${monthlyBudgetUsd.toFixed(2)} USD). Eksekusi ditolak oleh Hard Cap Enforcer.`
        }
      } else {
        return {
          allowed: true,
          action: 'WARNING',
          departmentId: deptId,
          departmentName: deptName,
          monthlyBudgetUsd,
          currentSpendUsd,
          burnPercentage,
          message: `[BUDGET_OVERAGE_WARNING] Departemen ${deptName} telah melebihi batas anggaran ($${currentSpendUsd.toFixed(2)} / $${monthlyBudgetUsd.toFixed(2)} USD). Eksekusi dilanjutkan (Soft Cap).`
        }
      }
    }

    if (burnPercentage >= 85) {
      return {
        allowed: true,
        action: 'WARNING',
        departmentId: deptId,
        departmentName: deptName,
        monthlyBudgetUsd,
        currentSpendUsd,
        burnPercentage,
        message: `[BUDGET_WARNING] Departemen ${deptName} telah menggunakan ${burnPercentage}% dari batas anggaran ($${currentSpendUsd.toFixed(2)} / $${monthlyBudgetUsd.toFixed(2)} USD).`
      }
    }

    return {
      allowed: true,
      action: 'ALLOW',
      departmentId: deptId,
      departmentName: deptName,
      monthlyBudgetUsd,
      currentSpendUsd,
      burnPercentage,
      message: `Batas kuota anggaran ${deptName} normal (${burnPercentage}% terpakai).`
    }
  }
}
