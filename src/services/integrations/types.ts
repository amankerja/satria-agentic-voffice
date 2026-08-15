import type {
  IntegrationProviderType,
  ToolEvidence,
  IntegrationConnection,
  IntegrationConnectionStatus
} from '../../types'

export interface HealthResult {
  healthy: boolean
  status: IntegrationConnectionStatus
  message?: string
  latencyMs?: number
  validatedAt: string
}

export interface ToolResult {
  success: boolean
  provider: IntegrationProviderType
  toolName: string
  action: string
  data?: unknown
  evidence?: ToolEvidence[]
  error?: {
    code: string
    message: string
    retryable: boolean
    details?: unknown
  }
}

export interface IIntegrationAdapter {
  readonly providerId: IntegrationProviderType

  validateConnection(connection: IntegrationConnection): Promise<HealthResult>

  execute(
    connection: IntegrationConnection,
    toolName: string,
    action: string,
    args: Record<string, any>
  ): Promise<ToolResult>
}

// GitHub Types
export interface GitHubRepository {
  id: string
  name: string
  fullName: string
  owner: string
  isPrivate: boolean
  defaultBranch: string
  description?: string
  openIssuesCount: number
  updatedAt: string
}

export interface GitHubIssue {
  id: string
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  author: string
  labels: string[]
  createdAt: string
  url: string
}

export interface GitHubPullRequest {
  id: string
  number: number
  title: string
  body: string
  state: 'open' | 'closed' | 'merged'
  branch: string
  baseBranch: string
  author: string
  filesChanged: number
  diffUrl?: string
  url: string
  createdAt: string
}

// Email Types
export interface EmailMessage {
  id: string
  threadId: string
  from: string
  to: string[]
  cc?: string[]
  subject: string
  body: string
  snippet: string
  date: string
  isUnread: boolean
  labels: string[]
  attachments?: {
    id: string
    filename: string
    mimeType: string
    sizeBytes: number
  }[]
}

export interface EmailDraft {
  id: string
  threadId?: string
  to: string[]
  subject: string
  body: string
  createdAt: string
  updatedAt: string
}
