import type {
  ToolPermission,
  RiskLevel
} from '../../types'

export interface PermissionEvaluationResult {
  allowed: boolean
  approvalRequired: boolean
  riskLevel: RiskLevel
  reason?: string
}

export class PermissionEngine {
  private static defaultPermissions: ToolPermission[] = [
    // Bima (Backend) Permissions
    {
      id: 'tp-bima-gh-read',
      workspaceId: 'ws-dev',
      agentId: 'emp-bima',
      connectionId: '*',
      toolName: 'github.*',
      action: 'read',
      effect: 'ALLOW',
      riskLevel: 'LOW',
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tp-bima-gh-write',
      workspaceId: 'ws-dev',
      agentId: 'emp-bima',
      connectionId: '*',
      toolName: 'github.update_file',
      action: 'write',
      effect: 'ALLOW',
      riskLevel: 'MEDIUM',
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tp-bima-gh-branch',
      workspaceId: 'ws-dev',
      agentId: 'emp-bima',
      connectionId: '*',
      toolName: 'github.create_branch',
      action: 'write',
      effect: 'ALLOW',
      riskLevel: 'LOW',
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tp-bima-gh-pr',
      workspaceId: 'ws-dev',
      agentId: 'emp-bima',
      connectionId: '*',
      toolName: 'github.create_pull_request',
      action: 'write',
      effect: 'APPROVAL_REQUIRED',
      riskLevel: 'HIGH',
      approvalRequired: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    // Raka (Planner / Business) Permissions
    {
      id: 'tp-raka-email-read',
      workspaceId: 'ws-dev',
      agentId: 'emp-raka',
      connectionId: '*',
      toolName: 'email.*',
      action: 'read',
      effect: 'ALLOW',
      riskLevel: 'LOW',
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tp-raka-email-draft',
      workspaceId: 'ws-dev',
      agentId: 'emp-raka',
      connectionId: '*',
      toolName: 'email.create_draft',
      action: 'write',
      effect: 'ALLOW',
      riskLevel: 'LOW',
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tp-raka-email-send',
      workspaceId: 'ws-dev',
      agentId: 'emp-raka',
      connectionId: '*',
      toolName: 'email.send',
      action: 'write',
      effect: 'APPROVAL_REQUIRED',
      riskLevel: 'HIGH',
      approvalRequired: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  public static evaluate(
    agentId: string,
    toolName: string,
    action: string,
    customPermissions?: ToolPermission[]
  ): PermissionEvaluationResult {
    const list = customPermissions && customPermissions.length > 0 ? customPermissions : this.defaultPermissions

    // Match wildcard or specific tool
    const match = list.find((p) => {
      const agentMatch = p.agentId === '*' || p.agentId === agentId
      const toolMatch = p.toolName === '*' || p.toolName === toolName || (p.toolName.endsWith('.*') && toolName.startsWith(p.toolName.replace('.*', '')))
      const actionMatch = p.action === '*' || p.action === action
      return agentMatch && toolMatch && actionMatch
    })

    if (!match) {
      // Default policy based on action and tool risk
      if (toolName === 'github.create_pull_request' || toolName === 'email.send') {
        return {
          allowed: true,
          approvalRequired: true,
          riskLevel: 'HIGH',
          reason: 'Operasi High-Risk memerlukan persetujuan (Approval Gate)'
        }
      }

      if (action === 'read') {
        return {
          allowed: true,
          approvalRequired: false,
          riskLevel: 'LOW'
        }
      }

      return {
        allowed: false,
        approvalRequired: false,
        riskLevel: 'HIGH',
        reason: `Akses ditolak: Tidak ada permission rule untuk agent ${agentId} pada tool ${toolName}`
      }
    }

    if (match.effect === 'DENY') {
      return {
        allowed: false,
        approvalRequired: false,
        riskLevel: match.riskLevel,
        reason: `Akses ditolak secara eksplisit oleh kebijakan keamanan untuk ${toolName}`
      }
    }

    return {
      allowed: true,
      approvalRequired: match.effect === 'APPROVAL_REQUIRED' || match.approvalRequired,
      riskLevel: match.riskLevel
    }
  }
}
