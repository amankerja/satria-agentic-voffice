export type RuntimeErrorCategory =
  | 'AUTHENTICATION_ERROR'
  | 'SANDBOX_VIOLATION'
  | 'TOOL_EXECUTION_ERROR'
  | 'APPROVAL_TIMEOUT'
  | 'CONTEXT_LIMIT_EXCEEDED'
  | 'NETWORK_FAILURE'
  | 'RATE_LIMITED'
  | 'EXECUTION_TIMEOUT'
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
