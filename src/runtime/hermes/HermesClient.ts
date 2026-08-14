export interface HermesClientConfig {
  baseUrl: string
  apiKey?: string
  timeoutMs: number
}

export class HermesClient {
  private config: HermesClientConfig

  constructor(config?: Partial<HermesClientConfig>) {
    const meta = import.meta as any
    this.config = {
      baseUrl:
        config?.baseUrl ||
        (meta.env && meta.env.VITE_HERMES_URL
          ? (meta.env.VITE_HERMES_URL as string)
          : 'http://localhost:8080'),
      apiKey:
        config?.apiKey ||
        (meta.env && meta.env.VITE_HERMES_API_KEY
          ? (meta.env.VITE_HERMES_API_KEY as string)
          : ''),
      timeoutMs: config?.timeoutMs || 120000
    }
  }

  async healthCheck(): Promise<{ ok: boolean; version?: string; latencyMs: number; error?: string }> {
    const start = performance.now()
    try {
      const res = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
      })
      const latencyMs = Math.round(performance.now() - start)
      if (res.ok) {
        const data = await res.json()
        return { ok: true, version: data.version || '1.0.0', latencyMs }
      }
      return { ok: false, latencyMs, error: `HTTP ${res.status}` }
    } catch (e: any) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: e.message }
    }
  }

  async initiateRun(payload: any): Promise<{ sessionId: string }> {
    const res = await fetch(`${this.config.baseUrl}/v1/agent/run`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Hermes API error (${res.status}): ${err}`)
    }
    return await res.json()
  }

  async sendSignal(sessionId: string, signal: 'pause' | 'resume' | 'cancel' | 'approval', data?: any): Promise<void> {
    const res = await fetch(`${this.config.baseUrl}/v1/agent/signal/${sessionId}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ signal, data })
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Hermes signal error (${res.status}): ${err}`)
    }
  }

  connectEventStream(
    sessionId: string,
    onMessage: (msg: any) => void,
    onError: (err: any) => void
  ): () => void {
    if (typeof EventSource === 'undefined') {
      return () => {}
    }

    const eventSource = new EventSource(`${this.config.baseUrl}/v1/agent/stream/${sessionId}`)
    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        onMessage(parsed)
      } catch (e) {
        onError(e)
      }
    }
    eventSource.onerror = (err) => {
      onError(err)
      eventSource.close()
    }
    return () => eventSource.close()
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }
    return headers
  }
}
