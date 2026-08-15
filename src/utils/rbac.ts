/**
 * Role-Based Access Control (RBAC) Governance Utility for SATRIA AI Workforce
 * Defines operational permissions across Executive, Management, and Engineering tiers.
 */

export type SatriaRole = 'Owner' | 'Director' | 'Lead' | 'Developer' | 'Viewer'

export interface UserPermissionProfile {
  role: SatriaRole
  canApproveHighRiskAction: boolean
  canModifyBudget: boolean
  canArchiveEmployee: boolean
  canReviewDeliverable: boolean
  canDispatchAutonomousTask: boolean
  canConfigureRuntimeApi: boolean
  canManageOrganizationMemory: boolean
}

const ROLE_PERMISSIONS: Record<SatriaRole, Omit<UserPermissionProfile, 'role'>> = {
  Owner: {
    canApproveHighRiskAction: true,
    canModifyBudget: true,
    canArchiveEmployee: true,
    canReviewDeliverable: true,
    canDispatchAutonomousTask: true,
    canConfigureRuntimeApi: true,
    canManageOrganizationMemory: true
  },
  Director: {
    canApproveHighRiskAction: true,
    canModifyBudget: true,
    canArchiveEmployee: true,
    canReviewDeliverable: true,
    canDispatchAutonomousTask: true,
    canConfigureRuntimeApi: false,
    canManageOrganizationMemory: true
  },
  Lead: {
    canApproveHighRiskAction: true,
    canModifyBudget: false,
    canArchiveEmployee: true,
    canReviewDeliverable: true,
    canDispatchAutonomousTask: true,
    canConfigureRuntimeApi: false,
    canManageOrganizationMemory: true
  },
  Developer: {
    canApproveHighRiskAction: false,
    canModifyBudget: false,
    canArchiveEmployee: false,
    canReviewDeliverable: false,
    canDispatchAutonomousTask: true,
    canConfigureRuntimeApi: false,
    canManageOrganizationMemory: false
  },
  Viewer: {
    canApproveHighRiskAction: false,
    canModifyBudget: false,
    canArchiveEmployee: false,
    canReviewDeliverable: false,
    canDispatchAutonomousTask: false,
    canConfigureRuntimeApi: false,
    canManageOrganizationMemory: false
  }
}

/**
 * Get permission profile for a given role (defaults to 'Lead')
 */
export function getPermissionsForRole(role: SatriaRole = 'Lead'): UserPermissionProfile {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.Lead
  return {
    role,
    ...perms
  }
}

/**
 * Fast helper to check whether a role has authorization to approve high-risk agent operations
 */
export function canApproveHighRiskAction(role: SatriaRole = 'Lead'): boolean {
  return getPermissionsForRole(role).canApproveHighRiskAction
}

/**
 * Fast helper to check whether a role can alter workspace budget limits
 */
export function canModifyBudget(role: SatriaRole = 'Lead'): boolean {
  return getPermissionsForRole(role).canModifyBudget
}

/**
 * Fast helper to check whether a role can manage / curate organizational and agent memory
 */
export function canManageOrganizationMemory(role: SatriaRole = 'Lead'): boolean {
  return getPermissionsForRole(role).canManageOrganizationMemory
}
