export type RuntimeErrorCategory =
  | 'AUTHENTICATION_ERROR'
  | 'AUTHENTICATION_FAILURE'
  | 'AUTHORIZATION_FAILURE'
  | 'SANDBOX_VIOLATION'
  | 'TOOL_EXECUTION_ERROR'
  | 'APPROVAL_TIMEOUT'
  | 'APPROVAL_ERROR'
  | 'CONTEXT_LIMIT_EXCEEDED'
  | 'NETWORK_FAILURE'
  | 'RATE_LIMITED'
  | 'EXECUTION_TIMEOUT'
  | 'TIMEOUT'
  | 'VALIDATION_FAILURE'
  | 'HERMES_API_ERROR'
  | 'SESSION_NOT_FOUND'
  | 'STREAM_FAILURE'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

export class AgentRuntimeError extends Error {
  constructor(
    public readonly category: RuntimeErrorCategory,
    message: string,
    public readonly runId?: string,
    public readonly isTransient: boolean = false,
    public readonly rawError?: any
  ) {
    super(`[${category}] ${message}`)
    this.name = 'AgentRuntimeError'
  }
}
