import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HermesClient } from '../runtime/hermes/HermesClient'

describe('HermesClient Hardening & Resilience', () => {
  const originalFetch = global.fetch
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch
    vi.useFakeTimers()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('healthCheck', () => {
    it('returns ok: true and latency on 200 OK', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', version: '2.1.0' })
      })

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      const res = await client.healthCheck()

      expect(res.ok).toBe(true)
      expect(res.version).toBe('2.1.0')
      expect(typeof res.latencyMs).toBe('number')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/health',
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('returns ok: false on HTTP 500 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      const res = await client.healthCheck()

      expect(res.ok).toBe(false)
      expect(res.error).toBe('HTTP 500')
    })

    it('handles network failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network disconnected'))

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      const res = await client.healthCheck()

      expect(res.ok).toBe(false)
      expect(res.error).toBe('Network disconnected')
    })
  })

  describe('initiateRun', () => {
    it('returns valid run_id on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ run_id: 'run_abc_123', status: 'started' })
      })

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      const res = await client.initiateRun({ input: 'Test agent run' })

      expect(res.run_id).toBe('run_abc_123')
      expect(res.status).toBe('started')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/runs',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ input: 'Test agent run' })
        })
      )
    })

    it('throws when run_id is missing in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'started' }) // Missing run_id
      })

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      await expect(client.initiateRun({})).rejects.toThrow('Invalid Hermes run response: run_id is missing')
    })

    it('throws on HTTP 400 error with message body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Payload missing agent persona'
      })

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      await expect(client.initiateRun({})).rejects.toThrow('Hermes API error (400): Payload missing agent persona')
    })
  })

  describe('getRunStatus', () => {
    it('fetches run status from /v1/runs/{run_id}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ run_id: 'run_100', status: 'completed', output: 'Done' })
      })

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      const status = await client.getRunStatus('run_100')

      expect(status.run_id).toBe('run_100')
      expect(status.status).toBe('completed')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/runs/run_100',
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('stopRun & respondApproval', () => {
    it('stops run via POST /v1/runs/{run_id}/stop', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK'
      })

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      await client.stopRun('run_100')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/runs/run_100/stop',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('submits approval response via POST /v1/runs/{run_id}/approval', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'OK'
      })

      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      await client.respondApproval('run_100', { choice: 'once' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/v1/runs/run_100/approval',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ choice: 'once' })
        })
      )
    })
  })

  describe('connectEventStream & Reconnect Resilience', () => {
    let mockEventSources: any[] = []

    class MockEventSource {
      url: string
      onopen: (() => void) | null = null
      onmessage: ((event: { data: string }) => void) | null = null
      onerror: ((err: any) => void) | null = null
      closed = false

      constructor(url: string) {
        this.url = url
        mockEventSources.push(this)
      }

      close() {
        this.closed = true
      }
    }

    beforeEach(() => {
      mockEventSources = []
      ;(global as any).EventSource = MockEventSource
    })

    afterEach(() => {
      delete (global as any).EventSource
    })

    it('receives message from /v1/runs/{run_id}/events and parses JSON correctly', () => {
      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      const onMessage = vi.fn()
      const onError = vi.fn()

      const cleanup = client.connectEventStream('run_abc_123', onMessage, onError)

      expect(mockEventSources.length).toBe(1)
      const es = mockEventSources[0]
      expect(es.url).toBe('http://localhost:8080/v1/runs/run_abc_123/events')

      es.onmessage({ data: JSON.stringify({ event: 'progress', percent: 50 }) })

      expect(onMessage).toHaveBeenCalledWith({ event: 'progress', percent: 50 })
      expect(onError).not.toHaveBeenCalled()

      cleanup()
      expect(es.closed).toBe(true)
    })

    it('handles malformed SSE JSON payload gracefully', () => {
      const client = new HermesClient({ baseUrl: 'http://localhost:8080' })
      const onMessage = vi.fn()
      const onError = vi.fn()

      const cleanup = client.connectEventStream('run_abc_123', onMessage, onError)
      const es = mockEventSources[0]

      es.onmessage({ data: 'NOT_VALID_JSON' })

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onMessage).not.toHaveBeenCalled()
      cleanup()
    })

    it('reconnects with exponential backoff on stream drop', () => {
      const client = new HermesClient({
        baseUrl: 'http://localhost:8080',
        maxReconnectAttempts: 3,
        initialBackoffMs: 1000
      })
      const onMessage = vi.fn()
      const onError = vi.fn()
      const stateChanges: string[] = []

      const cleanup = client.connectEventStream('run_abc_123', onMessage, onError, {
        onConnectionChange: (state) => stateChanges.push(state)
      })

      expect(mockEventSources.length).toBe(1)
      // Simulate error
      mockEventSources[0].onerror(new Error('Connection lost'))

      expect(stateChanges).toContain('reconnecting')
      expect(mockEventSources.length).toBe(1)

      // Fast-forward backoff timer 1000ms
      vi.advanceTimersByTime(1000)
      expect(mockEventSources.length).toBe(2) // Second connection attempt

      cleanup()
    })

    it('cleans up and stops reconnection when explicit cleanup is called', () => {
      const client = new HermesClient({
        baseUrl: 'http://localhost:8080',
        maxReconnectAttempts: 3,
        initialBackoffMs: 1000
      })
      const onMessage = vi.fn()
      const onError = vi.fn()

      const cleanup = client.connectEventStream('run_abc_123', onMessage, onError)
      const firstEs = mockEventSources[0]

      // Trigger error to schedule reconnect
      firstEs.onerror(new Error('Connection dropped'))

      // Call cleanup before timer expires
      cleanup()

      vi.advanceTimersByTime(5000)
      // No new EventSources created after cleanup
      expect(mockEventSources.length).toBe(1)
      expect(firstEs.closed).toBe(true)
    })
  })
})
