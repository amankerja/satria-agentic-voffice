import type {
  Employee,
  AgentAclPolicy,
  DelegatedSubTask
} from '../../types'

export interface AclValidationResult {
  allowed: boolean
  reason: string
  subTask?: DelegatedSubTask
}

export class AgentAclEngine {
  /**
   * Default ACL policy generator based on employee role/level
   */
  static getDefaultPolicy(employee: Employee): AgentAclPolicy {
    const role = (employee.roleName || '').toLowerCase()
    const isSupervisor = role.includes('lead') || role.includes('planner') || role.includes('manager') || role.includes('director')
    const isSpecialist = role.includes('senior') || role.includes('engineer') || role.includes('developer') || role.includes('qa')

    if (isSupervisor) {
      return {
        employeeId: employee.id,
        roleLevel: 'SUPERVISOR',
        canDelegate: true,
        maxDelegationDepth: 2,
        allowedDelegateeRoleIds: ['role-backend', 'role-frontend', 'role-qa', 'role-marketing', 'role-data'],
        maxSubTaskBudgetUsd: 0.25,
        inheritedToolWhiteList: ['tool-filesystem', 'tool-bash', 'tool-github', 'tool-gmail', 'tool-memory']
      }
    }

    if (isSpecialist) {
      return {
        employeeId: employee.id,
        roleLevel: 'SPECIALIST',
        canDelegate: false,
        maxDelegationDepth: 1,
        allowedDelegateeRoleIds: ['role-qa'],
        maxSubTaskBudgetUsd: 0.10,
        inheritedToolWhiteList: ['tool-filesystem', 'tool-bash', 'tool-memory']
      }
    }

    return {
      employeeId: employee.id,
      roleLevel: 'WORKER',
      canDelegate: false,
      maxDelegationDepth: 0,
      allowedDelegateeRoleIds: [],
      maxSubTaskBudgetUsd: 0.05,
      inheritedToolWhiteList: ['tool-filesystem']
    }
  }

  /**
   * Validates a delegation attempt against the delegator's ACL policy and system safety boundaries
   */
  static validateDelegation(
    delegator: Employee,
    delegatee: Employee,
    delegatorPolicy: AgentAclPolicy,
    currentDepth: number,
    subTaskBudgetUsd: number
  ): AclValidationResult {
    // 1. Can Delegate Check
    if (!delegatorPolicy.canDelegate) {
      return {
        allowed: false,
        reason: `[ACL_DENIED] Digital Worker ${delegator.name} (${delegatorPolicy.roleLevel}) tidak memiliki izin untuk mendelegasikan tugas.`
      }
    }

    // 2. Max Depth Check
    if (currentDepth >= delegatorPolicy.maxDelegationDepth) {
      return {
        allowed: false,
        reason: `[ACL_DEPTH_EXCEEDED] Kedalaman delegasi (${currentDepth}) telah mencapai batas maksimum (${delegatorPolicy.maxDelegationDepth}) untuk mencegah rekursi tak terbatas.`
      }
    }

    // 3. Allowed Delegatee Role Check
    if (delegatorPolicy.allowedDelegateeRoleIds.length > 0 && delegatee.roleId) {
      const isRoleAllowed = delegatorPolicy.allowedDelegateeRoleIds.includes(delegatee.roleId) ||
        delegatorPolicy.allowedDelegateeRoleIds.some((r) => (delegatee.roleName || '').toLowerCase().includes(r.replace('role-', '')))

      if (!isRoleAllowed) {
        return {
          allowed: false,
          reason: `[ACL_ROLE_NOT_PERMITTED] Role ${delegatee.roleName} tidak terdapat dalam whitelist delegasi yang diizinkan untuk ${delegator.name}.`
        }
      }
    }

    // 4. Budget Cap Check
    if (subTaskBudgetUsd > delegatorPolicy.maxSubTaskBudgetUsd) {
      return {
        allowed: false,
        reason: `[ACL_BUDGET_CAP_EXCEEDED] Alokasi anggaran sub-task ($${subTaskBudgetUsd.toFixed(2)}) melebihi pagu maksimum per sub-task ($${delegatorPolicy.maxSubTaskBudgetUsd.toFixed(2)}).`
      }
    }

    return {
      allowed: true,
      reason: `Delegasi ke ${delegatee.name} tervalidasi dan diizinkan oleh Agent ACL Policy.`
    }
  }
}
