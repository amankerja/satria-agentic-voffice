import type {
  IntegrationConnection,
  ToolRequest,
  ToolExecution,
  IntegrationApprovalRequest,
  IntegrationAuditEvent,
  Task
} from '../../types'
import type { IIntegrationAdapter, ToolResult } from './types'
import { GitHubAdapter } from './GitHubAdapter'
import { GmailAdapter } from './GmailAdapter'
import { PermissionEngine } from './PermissionEngine'
import { TaskBoundaryGuard } from './TaskBoundaryGuard'

export class UniversalToolRouter {
  private static adapters: Map<string, IIntegrationAdapter> = new Map<string, IIntegrationAdapter>([
    ['github', new GitHubAdapter()],
    ['gmail', new GmailAdapter()]
  ])

  public static getAdapter(providerId: string): IIntegrationAdapter {
    const adapter = this.adapters.get(providerId)
    if (!adapter) {
      throw new Error(`Integration adapter untuk provider "${providerId}" belum terdaftar.`)
    }
    return adapter
  }

  public static async executeTool(
    request: ToolRequest,
    connection: IntegrationConnection,
    options?: {
      taskContext?: Partial<Task>
      onApprovalRequired?: (approval: IntegrationApprovalRequest) => Promise<boolean>
      bypassApproval?: boolean
    }
  ): Promise<{
    execution: ToolExecution
    result: ToolResult
    approval?: IntegrationApprovalRequest
    auditEvent: IntegrationAuditEvent
  }> {
    const startedAt = new Date().toISOString()
    const inputHash = `hash_${Math.random().toString(36).substr(2, 9)}`

    // 0. Task Boundary & Explicit Workflow Mode Guard
    if (options?.taskContext) {
      const boundaryCheck = TaskBoundaryGuard.assertToolAccess(
        options.taskContext,
        connection.providerId,
        request.toolName
      )

      if (!boundaryCheck.allowed) {
        const execFail: ToolExecution = {
          id: `exec-${Date.now()}`,
          runId: request.runId,
          taskId: request.taskId,
          agentId: request.agentId,
          agentName: request.agentName,
          connectionId: connection.id,
          toolName: request.toolName,
          action: request.action,
          inputHash,
          status: 'FAILED',
          errorCode: 'BOUNDARY_VIOLATION',
          errorMessage: boundaryCheck.reason,
          startedAt,
          completedAt: new Date().toISOString()
        }

        const auditDenied: IntegrationAuditEvent = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actorId: request.agentId,
          actorName: request.agentName || request.agentId,
          connectionId: connection.id,
          provider: connection.providerId,
          toolName: request.toolName,
          action: request.action,
          status: 'DENIED',
          riskLevel: 'HIGH',
          details: { reason: boundaryCheck.reason }
        }

        return {
          execution: execFail,
          result: {
            success: false,
            provider: connection.providerId,
            toolName: request.toolName,
            action: request.action,
            error: {
              code: 'BOUNDARY_VIOLATION',
              message: boundaryCheck.reason,
              retryable: false
            }
          },
          auditEvent: auditDenied
        }
      }
    }

    // 1. Permission Evaluation Check
    const permEval = PermissionEngine.evaluate(request.agentId, request.toolName, request.action)

    if (!permEval.allowed) {
      const execFail: ToolExecution = {
        id: `exec-${Date.now()}`,
        runId: request.runId,
        taskId: request.taskId,
        agentId: request.agentId,
        agentName: request.agentName,
        connectionId: connection.id,
        toolName: request.toolName,
        action: request.action,
        inputHash,
        status: 'FAILED',
        errorCode: 'PERMISSION_DENIED',
        errorMessage: permEval.reason || 'Akses ditolak oleh Permission Engine',
        startedAt,
        completedAt: new Date().toISOString()
      }

      const auditDenied: IntegrationAuditEvent = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: request.agentId,
        actorName: request.agentName || request.agentId,
        connectionId: connection.id,
        provider: connection.providerId,
        toolName: request.toolName,
        action: request.action,
        status: 'DENIED',
        riskLevel: permEval.riskLevel,
        details: { reason: execFail.errorMessage }
      }

      return {
        execution: execFail,
        result: {
          success: false,
          provider: connection.providerId,
          toolName: request.toolName,
          action: request.action,
          error: {
            code: 'PERMISSION_DENIED',
            message: execFail.errorMessage || 'Akses ditolak oleh Permission Engine',
            retryable: false
          }
        },
        auditEvent: auditDenied
      }
    }

    // 2. Approval Gate for High Risk Actions
    let approvalObj: IntegrationApprovalRequest | undefined
    if (permEval.approvalRequired && !options?.bypassApproval) {
      approvalObj = {
        id: `appr-${Date.now()}`,
        runId: request.runId,
        taskId: request.taskId,
        toolRequestId: request.id,
        agentId: request.agentId,
        agentName: request.agentName || 'Digital Employee',
        connectionId: connection.id,
        provider: connection.providerId,
        requestedAction: `${request.toolName} (${request.action})`,
        toolName: request.toolName,
        reason: permEval.reason || `Tindakan ${request.toolName} berisiko tinggi (${permEval.riskLevel}) dan memerlukan otorisasi Manager/Owner.`,
        riskLevel: permEval.riskLevel,
        details: request.arguments,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      }

      if (options?.onApprovalRequired) {
        const approved = await options.onApprovalRequired(approvalObj)
        if (!approved) {
          approvalObj.status = 'REJECTED'
          approvalObj.resolvedAt = new Date().toISOString()

          const execRejected: ToolExecution = {
            id: `exec-${Date.now()}`,
            runId: request.runId,
            taskId: request.taskId,
            agentId: request.agentId,
            agentName: request.agentName,
            connectionId: connection.id,
            toolName: request.toolName,
            action: request.action,
            inputHash,
            status: 'REJECTED',
            errorCode: 'APPROVAL_REJECTED',
            errorMessage: 'Persetujuan eksekusi tool ditolak oleh reviewer.',
            startedAt,
            completedAt: new Date().toISOString()
          }

          const auditRejected: IntegrationAuditEvent = {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorId: request.agentId,
            actorName: request.agentName || request.agentId,
            connectionId: connection.id,
            provider: connection.providerId,
            toolName: request.toolName,
            action: request.action,
            status: 'REJECTED',
            riskLevel: permEval.riskLevel,
            details: { reason: 'Persetujuan ditolak' }
          }

          return {
            execution: execRejected,
            result: {
              success: false,
              provider: connection.providerId,
              toolName: request.toolName,
              action: request.action,
              error: {
                code: 'APPROVAL_REJECTED',
                message: 'Eksekusi dibatalkan karena approval ditolak.',
                retryable: false
              }
            },
            approval: approvalObj,
            auditEvent: auditRejected
          }
        }
        approvalObj.status = 'APPROVED'
        approvalObj.resolvedAt = new Date().toISOString()
      }
    }

    // 3. Dispatch to Provider Adapter
    const adapter = this.getAdapter(connection.providerId)
    const result = await adapter.execute(connection, request.toolName, request.action, request.arguments)

    const completedAt = new Date().toISOString()
    const execution: ToolExecution = {
      id: `exec-${Date.now()}`,
      runId: request.runId,
      taskId: request.taskId,
      agentId: request.agentId,
      agentName: request.agentName,
      connectionId: connection.id,
      toolName: request.toolName,
      action: request.action,
      inputHash,
      status: result.success ? 'COMPLETED' : 'FAILED',
      arguments: request.arguments,
      startedAt,
      completedAt,
      errorCode: result.error?.code,
      errorMessage: result.error?.message,
      evidence: result.evidence
    }

    const auditEvent: IntegrationAuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: completedAt,
      actorId: request.agentId,
      actorName: request.agentName || request.agentId,
      connectionId: connection.id,
      provider: connection.providerId,
      toolName: request.toolName,
      action: request.action,
      status: result.success ? 'SUCCESS' : 'FAILURE',
      riskLevel: permEval.riskLevel,
      details: { arguments: request.arguments, data: result.data },
      evidence: result.evidence
    }

    return {
      execution,
      result,
      approval: approvalObj,
      auditEvent
    }
  }
}
