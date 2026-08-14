export const HERMES_ENDPOINTS = {
  health: '/health',
  run: '/v1/runs',
  runStatus: (runId: string) => `/v1/runs/${runId}`,
  stream: (runId: string) => `/v1/runs/${runId}/events`,
  approval: (runId: string) => `/v1/runs/${runId}/approval`,
  stop: (runId: string) => `/v1/runs/${runId}/stop`,
} as const

export interface HermesRunResponse {
  run_id: string
  status?: string
}

export interface HermesRunStatusResponse {
  run_id: string
  status: string
  session_id?: string
  output?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    cached_tokens?: number
    cost?: number
  }
  last_event?: string
  created_at?: number
  updated_at?: number
}

export interface HermesExecution {
  satriaRunId: string
  hermesRunId: string
  sessionId?: string
  attempt: number
}

export interface HermesHealthResponse {
  ok?: boolean
  status?: string
  version?: string
}

export interface HermesSignalPayload {
  signal: 'pause' | 'resume' | 'cancel' | 'approval'
  data?: any
}
