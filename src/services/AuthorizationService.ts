import type { UserRole, PermissionType } from '../types'

export class AuthorizationError extends Error {
  public readonly code = 'FORBIDDEN'
  public readonly role: UserRole
  public readonly permission: PermissionType

  constructor(role: UserRole, permission: PermissionType, message?: string) {
    super(
      message ||
        `Access Denied: Role '${role}' is not authorized to execute permission '${permission}'.`
    )
    this.name = 'AuthorizationError'
    this.role = role
    this.permission = permission
  }
}

export class AuthorizationService {
  private static permissionsMap: Record<UserRole, Set<PermissionType>> = {
    Owner: new Set<PermissionType>([
      'project:create',
      'project:edit',
      'project:cancel',
      'project:archive',
      'project:delete',
      'task:create',
      'task:edit',
      'task:cancel',
      'task:archive',
      'task:delete',
      'task:change_worker',
      'task:view',
      'run:start',
      'run:stop',
      'run:cancel',
      'run:retry',
      'run:delete',
      'run:add_instruction',
      'run:execute',
      'run:update_result',
      'schedule:create',
      'schedule:toggle',
      'schedule:delete',
      'schedule:trigger',
      'memory:manage',
      'backup:export',
      'backup:restore'
    ]),
    Worker: new Set<PermissionType>([
      'task:view',
      'run:execute',
      'run:update_result'
    ]),
    Viewer: new Set<PermissionType>([
      'task:view'
    ])
  }

  public static can(role: UserRole, permission: PermissionType): boolean {
    const allowed = this.permissionsMap[role]
    return allowed ? allowed.has(permission) : false
  }

  public static assertPermission(role: UserRole, permission: PermissionType, actionDescription?: string): void {
    if (!this.can(role, permission)) {
      throw new AuthorizationError(
        role,
        permission,
        `Authorization Failed: Action "${actionDescription || permission}" is restricted to Owner/Authorized roles. (Current: ${role})`
      )
    }
  }
}
