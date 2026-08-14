import type { AgentRunInput, RuntimeEvent } from '../types'
import { ContextBuilder } from '../context/ContextBuilder'
import { CostCalculator } from '../telemetry/CostCalculator'

export class HermesMapper {
  static toHermesPayload(input: AgentRunInput) {
    const context = ContextBuilder.build(input)

    return {
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
        model: 'hermes-3-llama-3.1-70b',
        maxTokens: 4096,
        temperature: 0.2
      }
    }
  }

  static fromHermesEvent(raw: any, runId: string): RuntimeEvent {
    const timestamp = raw.timestamp || new Date().toISOString()
    const model = raw.model || 'hermes-3-llama-3.1-70b'
    const promptTokens = raw.promptTokens || 0
    const completionTokens = raw.completionTokens || 0
    const cachedTokens = raw.cachedTokens || 0
    const durationMs = raw.durationMs || 0

    const telemetry = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cachedTokens,
      model,
      provider: raw.provider || 'hermes-cloud',
      durationMs,
      estimatedCostUsd: CostCalculator.calculate(model, promptTokens, completionTokens, cachedTokens)
    }

    if (raw.type === 'tool:requested') {
      return {
        type: 'tool:requested',
        runId,
        timestamp,
        toolCall: {
          id: raw.toolCallId || `tc-${Date.now()}`,
          toolName: raw.toolName,
          parameters: raw.parameters || {},
          isHighRisk: raw.isHighRisk ?? (raw.toolName === 'filesystem.write' || raw.toolName === 'deploy'),
          requestedAt: timestamp
        }
      }
    }

    if (raw.type === 'approval:required') {
      return {
        type: 'approval:required',
        runId,
        timestamp,
        approvalRequest: {
          id: raw.approvalId || `apprv-${Date.now()}`,
          runId,
          toolCall: {
            id: raw.toolCallId || `tc-${Date.now()}`,
            toolName: raw.toolName,
            parameters: raw.parameters || {},
            isHighRisk: true,
            requestedAt: timestamp
          },
          reason: raw.reason || 'High-risk action requires human confirmation.',
          previewContent: raw.previewContent,
          diffContent: raw.diffContent,
          requestedAt: timestamp
        }
      }
    }

    if (raw.type === 'run:completed') {
      return {
        type: 'run:completed',
        runId,
        timestamp,
        step: 'Completing',
        progress: 100,
        telemetry
      }
    }

    if (raw.type === 'run:failed') {
      return {
        type: 'run:failed',
        runId,
        timestamp,
        error: raw.error || 'Hermes execution failed.'
      }
    }

    // Default progress / log event
    return {
      type: 'progress:updated',
      runId,
      timestamp,
      progress: raw.progress ?? 50,
      step: raw.step ?? 'Working',
      log: raw.message
        ? {
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: new Date().toLocaleTimeString(),
            step: raw.step ?? 'Working',
            message: raw.message,
            level: raw.level ?? 'info'
          }
        : undefined,
      telemetry
    }
  }
}
