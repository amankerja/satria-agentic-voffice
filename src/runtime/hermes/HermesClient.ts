import {
  HERMES_ENDPOINTS,
  type HermesRunResponse,
  type HermesRunStatusResponse
} from './hermesContract'

export interface HermesClientConfig {
  baseUrl: string
  apiKey?: string
  timeoutMs: number
  maxReconnectAttempts?: number
  initialBackoffMs?: number
  maxBackoffMs?: number
}

export interface ConnectStreamOptions {
  maxReconnectAttempts?: number
  initialBackoffMs?: number
  maxBackoffMs?: number
  onConnectionChange?: (state: 'connecting' | 'connected' | 'reconnecting' | 'closed') => void
}

export class HermesClient {
  private config: HermesClientConfig

  constructor(config?: Partial<HermesClientConfig>) {
    const meta = import.meta as any
    this.config = {
      baseUrl:
        config?.baseUrl ||
        (meta?.env?.VITE_HERMES_URL as string) ||
        'http://127.0.0.1:8642',
      apiKey:
        config?.apiKey ||
        (meta?.env?.VITE_HERMES_API_KEY as string) ||
        '',
      timeoutMs: config?.timeoutMs ?? 120000,
      maxReconnectAttempts: config?.maxReconnectAttempts ?? 5,
      initialBackoffMs: config?.initialBackoffMs ?? 1000,
      maxBackoffMs: config?.maxBackoffMs ?? 30000
    }
  }

  public async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = this.config.timeoutMs
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  async healthCheck(timeoutMs = 5000): Promise<{ ok: boolean; version?: string; latencyMs: number; error?: string }> {
    const start = performance.now()
    const url = `${this.config.baseUrl}${HERMES_ENDPOINTS.health}`

    try {
      const res = await this.fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: this.getHeaders()
        },
        timeoutMs
      )
      const latencyMs = Math.round(performance.now() - start)
      if (res.ok) {
        const data = await res.json()
        return { ok: true, version: data?.version || '1.0.0', latencyMs }
      }
      return { ok: false, latencyMs, error: `HTTP ${res.status}` }
    } catch (e: any) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        error: e?.message || 'Connection failed'
      }
    }
  }

  async initiateRun(payload: unknown, timeoutMs = this.config.timeoutMs): Promise<HermesRunResponse> {
    const url = `${this.config.baseUrl}${HERMES_ENDPOINTS.run}`
    const res = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      },
      timeoutMs
    )

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`Hermes API error (${res.status}): ${err || res.statusText}`)
    }

    const data = await res.json()
    // Accept either native run_id or fallback sessionId
    const run_id = data?.run_id || data?.sessionId
    if (!data || typeof data !== 'object' || typeof run_id !== 'string' || !run_id.trim()) {
      throw new Error('Invalid Hermes run response: run_id is missing')
    }

    return { run_id, status: data.status || 'started' }
  }

  async getRunStatus(hermesRunId: string, timeoutMs = this.config.timeoutMs): Promise<HermesRunStatusResponse> {
    if (!hermesRunId || typeof hermesRunId !== 'string') {
      throw new Error('Hermes getRunStatus error: hermesRunId is required')
    }

    const url = `${this.config.baseUrl}${HERMES_ENDPOINTS.runStatus(hermesRunId)}`
    const res = await this.fetchWithTimeout(
      url,
      {
        method: 'GET',
        headers: this.getHeaders()
      },
      timeoutMs
    )

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`Hermes getRunStatus error (${res.status}): ${err || res.statusText}`)
    }

    return await res.json()
  }

  async stopRun(hermesRunId: string, timeoutMs = this.config.timeoutMs): Promise<void> {
    if (!hermesRunId || typeof hermesRunId !== 'string') {
      throw new Error('Hermes stopRun error: hermesRunId is required')
    }

    const url = `${this.config.baseUrl}${HERMES_ENDPOINTS.stop(hermesRunId)}`
    const res = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({})
      },
      timeoutMs
    )

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`Hermes stopRun error (${res.status}): ${err || res.statusText}`)
    }
  }

  async respondApproval(hermesRunId: string, payload: unknown, timeoutMs = this.config.timeoutMs): Promise<void> {
    if (!hermesRunId || typeof hermesRunId !== 'string') {
      throw new Error('Hermes respondApproval error: hermesRunId is required')
    }

    const url = `${this.config.baseUrl}${HERMES_ENDPOINTS.approval(hermesRunId)}`
    const res = await this.fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      },
      timeoutMs
    )

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`Hermes respondApproval error (${res.status}): ${err || res.statusText}`)
    }
  }

  async sendSignal(
    hermesRunId: string,
    signal: 'pause' | 'resume' | 'cancel' | 'approval',
    data?: unknown,
    timeoutMs = this.config.timeoutMs
  ): Promise<void> {
    if (!hermesRunId || typeof hermesRunId !== 'string') {
      throw new Error('Hermes signal error: hermesRunId is required')
    }

    if (signal === 'cancel' || signal === 'pause') {
      await this.stopRun(hermesRunId, timeoutMs)
    } else if (signal === 'approval') {
      await this.respondApproval(hermesRunId, data, timeoutMs)
    } else {
      // Fallback for custom signals / resume
      const url = `${this.config.baseUrl}${HERMES_ENDPOINTS.runStatus(hermesRunId)}`
      await this.fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: this.getHeaders()
        },
        timeoutMs
      )
    }
  }

  connectEventStream(
    hermesRunId: string,
    onMessage: (msg: unknown) => void,
    onError: (err: unknown) => void,
    options?: ConnectStreamOptions
  ): () => void {
    if (typeof EventSource === 'undefined') {
      onError(new Error('EventSource is not supported in this environment.'))
      return () => {}
    }

    if (!hermesRunId || typeof hermesRunId !== 'string') {
      onError(new Error('Hermes stream error: hermesRunId is required'))
      return () => {}
    }

    const maxAttempts = options?.maxReconnectAttempts ?? this.config.maxReconnectAttempts ?? 5
    const initialBackoff = options?.initialBackoffMs ?? this.config.initialBackoffMs ?? 1000
    const maxBackoff = options?.maxBackoffMs ?? this.config.maxBackoffMs ?? 30000

    let currentEventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let reconnectAttempts = 0
    let isClosedExplicitly = false

    const notifyConnection = (state: 'connecting' | 'connected' | 'reconnecting' | 'closed') => {
      if (options?.onConnectionChange) {
        options.onConnectionChange(state)
      }
    }

    const cleanup = () => {
      isClosedExplicitly = true
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      if (currentEventSource) {
        currentEventSource.onmessage = null
        currentEventSource.onerror = null
        currentEventSource.onopen = null
        currentEventSource.close()
        currentEventSource = null
      }
      notifyConnection('closed')
    }

    const connect = () => {
      if (isClosedExplicitly) return

      notifyConnection(reconnectAttempts === 0 ? 'connecting' : 'reconnecting')
      const streamUrl = `${this.config.baseUrl}${HERMES_ENDPOINTS.stream(hermesRunId)}`
      
      try {
        const es = new EventSource(streamUrl)
        currentEventSource = es

        es.onopen = () => {
          reconnectAttempts = 0
          notifyConnection('connected')
        }

        es.onmessage = (event) => {
          if (isClosedExplicitly) return
          try {
            const parsed = JSON.parse(event.data)
            onMessage(parsed)
          } catch (parseErr) {
            onError(new Error(`Failed to parse SSE JSON payload: ${parseErr}`))
          }
        }

        es.onerror = (_err) => {
          if (isClosedExplicitly) return

          // Close active EventSource before scheduling reconnection
          if (currentEventSource) {
            currentEventSource.close()
            currentEventSource = null
          }

          if (reconnectAttempts < maxAttempts) {
            reconnectAttempts++
            const delay = Math.min(initialBackoff * Math.pow(2, reconnectAttempts - 1), maxBackoff)
            notifyConnection('reconnecting')
            reconnectTimer = setTimeout(() => {
              if (!isClosedExplicitly) {
                connect()
              }
            }, delay)
          } else {
            notifyConnection('closed')
            onError(new Error(`EventSource failed after ${maxAttempts} reconnection attempts.`))
          }
        }
      } catch (err) {
        onError(err)
      }
    }

    connect()

    return cleanup
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }
    return headers
  }
}
