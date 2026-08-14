import type {
  RunStep,
  RunLogEntry,
  TaskAssignment,
  Employee,
  Skill,
  WorkforceTool,
  RuntimeTelemetry
} from '../types'

export type { RuntimeTelemetry }

export type RuntimeMode = 'mock' | 'hermes'

export interface AgentRunInput {
  runId: string
  assignment: TaskAssignment
  employee: Employee
  skills: Skill[]
  tools: WorkforceTool[]
  workspacePath: string
  projectContext?: {
    projectId: string
    projectName: string
    repositoryUrl?: string
    branch?: string
  }
  taskPrompt: string
  acceptanceCriteria?: string[]
  instructions?: string
}

export interface ToolCallRequest {
  id: string
  toolName: string
  parameters: Record<string, any>
  isHighRisk: boolean
  requestedAt: string
}

export interface ToolCallResult {
  toolCallId: string
  toolName: string
  success: boolean
  output?: string
  diff?: string
  error?: string
  executionTimeMs: number
}

export interface ApprovalRequest {
  id: string
  runId: string
  toolCall: ToolCallRequest
  reason: string
  previewContent?: string
  diffContent?: string
  requestedAt: string
}

export type RuntimeEventType =
  | 'run:started'
  | 'step:changed'
  | 'log:emitted'
  | 'progress:updated'
  | 'telemetry:updated'
  | 'tool:requested'
  | 'tool:executed'
  | 'approval:required'
  | 'approval:resolved'
  | 'run:completed'
  | 'run:failed'
  | 'run:cancelled'
  | 'run:paused'

export interface RuntimeEvent {
  type: RuntimeEventType
  runId: string
  timestamp: string
  step?: RunStep
  progress?: number
  log?: RunLogEntry
  telemetry?: RuntimeTelemetry
  toolCall?: ToolCallRequest
  toolResult?: ToolCallResult
  approvalRequest?: ApprovalRequest
  result?: AgentRuntimeResult
  error?: string
}

export interface AgentRuntimeResult {
  runId: string
  status: 'Completed' | 'Failed' | 'Cancelled'
  summary: string
  output: string
  artifactIds: string[]
  diffs?: {
    filePath: string
    changeType: 'created' | 'modified' | 'deleted'
    additions: number
    deletions: number
    diffContent?: string
  }[]
  verificationNotes?: string
  telemetry?: RuntimeTelemetry
  error?: string
}

export interface AgentRuntime {
  readonly mode: RuntimeMode
  start(input: AgentRunInput, onEvent: (event: RuntimeEvent) => void): Promise<void>
  pause(runId: string): Promise<void>
  resume(runId: string): Promise<void>
  cancel(runId: string): Promise<void>
  retry(runId: string, attempt: number): Promise<void>
  respondApproval(runId: string, approvalId: string, approved: boolean, feedback?: string): Promise<void>
  checkHealth(): Promise<{ healthy: boolean; latencyMs: number; message: string }>
}
