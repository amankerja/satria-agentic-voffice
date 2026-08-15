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
      'backup:restore',
      'content:create',
      'content:edit',
      'content:approve',
      'content:publish',
      'content:delete',
      'datareview:create',
      'datareview:analyze',
      'social:connect',
      'social:disconnect'
    ]),
    Worker: new Set<PermissionType>([
      'task:view',
      'run:execute',
      'run:update_result',
      'content:create',
      'content:edit',
      'datareview:create',
      'datareview:analyze'
    ]),
    Viewer: new Set<PermissionType>([
      'task:view'
    ])
  }

  public static can(role: UserRole, permission: PermissionType): boolean {
    const allowed = this.permissionsMap[role]
    return allowed ? allowed.has(permission) : false
  }

  public static assertPermission(permissionOrRole: PermissionType | UserRole, permissionOrAction?: PermissionType | string, actionDescription?: string): void {
    let role: UserRole = 'Owner'
    let permission: PermissionType

    if (permissionOrRole === 'Owner' || permissionOrRole === 'Worker' || permissionOrRole === 'Viewer') {
      role = permissionOrRole as UserRole
      permission = permissionOrAction as PermissionType
    } else {
      permission = permissionOrRole as PermissionType
      if (typeof permissionOrAction === 'string' && (permissionOrAction === 'Owner' || permissionOrAction === 'Worker' || permissionOrAction === 'Viewer')) {
        role = permissionOrAction as UserRole
      }
    }

    if (!this.can(role, permission)) {
      throw new AuthorizationError(
        role,
        permission,
        `Authorization Failed: Action "${actionDescription || permission}" is restricted to Owner/Authorized roles. (Current: ${role})`
      )
    }
  }
}
