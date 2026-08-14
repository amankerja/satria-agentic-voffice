import type { AgentRunInput, RuntimeEvent } from '../types'
import { ContextBuilder } from '../context/ContextBuilder'
import { TelemetryMapper } from '../telemetry/TelemetryMapper'

export class HermesMapper {
  static toHermesPayload(input: AgentRunInput) {
    const context = ContextBuilder.build(input)
    const meta = import.meta as any
    const configuredModel =
      (meta?.env?.VITE_HERMES_MODEL as string) || 'hermes-3-llama-3.1-70b'

    return {
      input: context.userPrompt || input.taskPrompt,
      instructions: context.systemPrompt,
      model: configuredModel,
      runId: input.runId,
      agentId: input.employee.id,
      agentName: input.employee.name,
      department: input.employee.departmentName,
      role: input.employee.roleName,
      systemPrompt: context.systemPrompt,
      userPrompt: context.userPrompt,
      tools: input.tools.map((t) => ({
        name: t.name,
        category: t.category,
        permissionLevel: t.permissionLevel
      })),
      workspace: {
        path: input.workspacePath,
        project: input.projectContext?.projectName || 'General Workspace'
      },
      modelConfig: {
        model: configuredModel,
        maxTokens: 4096,
        temperature: 0.2
      }
    }
  }

  static fromHermesEvent(raw: any, runId: string): RuntimeEvent {
    if (!raw || typeof raw !== 'object') {
      return {
        type: 'progress:updated',
        runId,
        timestamp: new Date().toISOString(),
        progress: 50,
        step: 'Working'
      }
    }

    const eventName = raw.event || raw.type || ''
    const timestamp = raw.timestamp
      ? (typeof raw.timestamp === 'number' ? new Date(raw.timestamp * 1000).toISOString() : String(raw.timestamp))
      : new Date().toISOString()
    const meta = import.meta as any
    const defaultModel =
      (meta?.env?.VITE_HERMES_MODEL as string) || 'hermes-3-llama-3.1-70b'

    const rawTelemetry = raw.usage || raw.telemetry || raw
    const telemetry = TelemetryMapper.normalize(
      rawTelemetry,
      raw.provider || 'hermes-cloud',
      raw.model || defaultModel
    )

    if (eventName === 'telemetry:updated' || eventName === 'telemetry.updated') {
      return {
        type: 'telemetry:updated',
        runId,
        timestamp,
        telemetry
      }
    }

    if (eventName === 'tool:requested' || eventName === 'tool.requested' || eventName === 'tool.call') {
      return {
        type: 'tool:requested',
        runId,
        timestamp,
        toolCall: {
          id: raw.toolCallId || raw.tool_call_id || raw.id || `tc-${Date.now()}`,
          toolName: raw.toolName || raw.tool_name || raw.name || 'unknown.tool',
          parameters: raw.parameters || raw.arguments || raw.args || {},
          isHighRisk:
            raw.isHighRisk ??
            (raw.toolName === 'filesystem.write' ||
              raw.toolName === 'deploy' ||
              raw.toolName === 'terminal.execute'),
          requestedAt: timestamp
        }
      }
    }

    if (eventName === 'tool:executed' || eventName === 'tool.executed' || eventName === 'tool.result') {
      return {
        type: 'tool:executed',
        runId,
        timestamp,
        toolResult: {
          toolCallId: raw.toolCallId || raw.tool_call_id || raw.id || `tc-${Date.now()}`,
          toolName: raw.toolName || raw.tool_name || raw.name || 'unknown.tool',
          success: raw.success !== false,
          output: raw.output || raw.result,
          diff: raw.diff,
          error: raw.error,
          executionTimeMs: raw.executionTimeMs || raw.execution_time_ms || 0
        }
      }
    }

    if (eventName === 'approval:required' || eventName === 'approval.required' || eventName === 'approval.request') {
      return {
        type: 'approval:required',
        runId,
        timestamp,
        approvalRequest: {
          id: raw.approvalId || raw.approval_id || raw.id || `apprv-${Date.now()}`,
          runId,
          toolCall: {
            id: raw.toolCallId || raw.tool_call_id || `tc-${Date.now()}`,
            toolName: raw.toolName || raw.tool_name || raw.name || 'unknown.tool',
            parameters: raw.parameters || raw.arguments || raw.args || {},
            isHighRisk: true,
            requestedAt: timestamp
          },
          reason: raw.reason || raw.message || 'High-risk action requires human confirmation.',
          previewContent: raw.previewContent || raw.preview,
          diffContent: raw.diffContent || raw.diff,
          requestedAt: timestamp
        }
      }
    }

    if (eventName === 'approval:resolved' || eventName === 'approval.resolved') {
      return {
        type: 'approval:resolved',
        runId,
        timestamp
      }
    }

    if (eventName === 'run:completed' || eventName === 'run.completed') {
      return {
        type: 'run:completed',
        runId,
        timestamp,
        step: 'Completing',
        progress: 100,
        telemetry
      }
    }

    if (eventName === 'run:failed' || eventName === 'run.failed') {
      return {
        type: 'run:failed',
        runId,
        timestamp,
        error: raw.error || raw.message || 'Hermes execution failed.'
      }
    }

    if (eventName === 'run:cancelled' || eventName === 'run.cancelled') {
      return {
        type: 'run:cancelled',
        runId,
        timestamp
      }
    }

    if (eventName === 'run:paused' || eventName === 'run.paused') {
      return {
        type: 'run:paused',
        runId,
        timestamp
      }
    }

    if (eventName === 'message.delta' || eventName === 'message:delta') {
      return {
        type: 'progress:updated',
        runId,
        timestamp,
        progress: raw.progress ?? 50,
        step: 'Working',
        log: raw.delta
          ? {
              id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              timestamp: new Date().toLocaleTimeString(),
              step: 'Working',
              message: raw.delta,
              level: 'info'
            }
          : undefined,
        telemetry
      }
    }

    // Default progress / log event
    return {
      type: 'progress:updated',
      runId,
      timestamp,
      progress: raw.progress ?? 50,
      step: raw.step ?? 'Working',
      log: (raw.message || raw.delta)
        ? {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString(),
            step: raw.step ?? 'Working',
            message: raw.message || raw.delta,
            level: raw.level ?? 'info'
          }
        : undefined,
      telemetry
    }
  }
}
