import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { WebhookGatewayService } from '../services/webhooks/WebhookGatewayService'
import { useWebhookStore } from '../stores/webhook'
import type { WebhookEndpointConfig } from '../types'

describe('SATRIA AI Workforce — Live Webhook Gateway & Inbound Event Stream (Phase 7)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    WebhookGatewayService.clearDeliveryCache()
  })

  const mockGithubEndpoint: WebhookEndpointConfig = {
    id: 'ep-gh-test',
    name: 'GitHub Webhook Test',
    source: 'GITHUB',
    urlPath: 'https://satria.ai/api/webhooks/github',
    secretKey: 'gh_secret_12345',
    enabled: true,
    targetWorkflowId: 'wf-eng-pipeline',
    totalEventsReceived: 0
  }

  const mockGmailEndpoint: WebhookEndpointConfig = {
    id: 'ep-gm-test',
    name: 'Gmail Webhook Test',
    source: 'GMAIL',
    urlPath: 'https://satria.ai/api/webhooks/gmail',
    secretKey: 'gmail_sec_token_88',
    enabled: true,
    targetWorkflowId: 'wf-finance-recap',
    totalEventsReceived: 0
  }

  describe('1. WebhookGatewayService Security & Normalization', () => {
    it('accepts and verifies valid GitHub webhook payload with HMAC header', () => {
      const payload = {
        action: 'opened',
        issue: { title: 'Fix JWT race condition', number: 101 },
        repository: { full_name: 'org/repo' }
      }
      const headers = {
        'x-github-event': 'issues',
        'x-hub-signature-256': 'sha256=abcdef1234567890abcdef',
        'x-delivery-id': 'del-test-01'
      }

      const event = WebhookGatewayService.processInboundWebhook(
        mockGithubEndpoint,
        payload,
        headers
      )

      expect(event.signatureVerified).toBe(true)
      expect(event.status).toBe('ROUTED')
      expect(event.eventType).toBe('github.issues.opened')
      expect(event.payload.title).toBe('Fix JWT race condition')
      expect(event.payload.repository).toBe('org/repo')
    })

    it('rejects inbound webhook when signature header is missing or invalid', () => {
      const payload = { test: true }
      const headers = {
        'x-github-event': 'push'
        // Missing x-hub-signature-256
      }

      const event = WebhookGatewayService.processInboundWebhook(
        mockGithubEndpoint,
        payload,
        headers
      )

      expect(event.signatureVerified).toBe(false)
      expect(event.status).toBe('REJECTED')
      expect(event.error).toContain('SIGNATURE_INVALID')
    })

    it('enforces idempotency and rejects duplicate delivery IDs (Replay Attack Defense)', () => {
      const payload = { action: 'push' }
      const headers = {
        'x-github-event': 'push',
        'x-hub-signature-256': 'sha256=abcdef1234567890',
        'x-delivery-id': 'del-duplicate-key-99'
      }

      const firstEvent = WebhookGatewayService.processInboundWebhook(
        mockGithubEndpoint,
        payload,
        headers
      )
      expect(firstEvent.status).toBe('ROUTED')

      // Immediate re-delivery of the exact same event delivery ID
      const secondEvent = WebhookGatewayService.processInboundWebhook(
        mockGithubEndpoint,
        payload,
        headers
      )
      expect(secondEvent.status).toBe('DUPLICATE')
      expect(secondEvent.error).toContain('IDEMPOTENCY_REJECTED')
    })

    it('normalizes inbound Gmail mailbox notifications into structured transaction payload', () => {
      const payload = {
        from: 'finance@client.com',
        subject: 'Pembayaran Invoice Rp5.000.000',
        snippet: 'Terlampir bukti transfer bank.',
        type: 'invoice'
      }
      const headers = {
        authorization: 'Bearer gmail_sec_token_88',
        'x-delivery-id': 'del-gm-01'
      }

      const event = WebhookGatewayService.processInboundWebhook(
        mockGmailEndpoint,
        payload,
        headers
      )

      expect(event.signatureVerified).toBe(true)
      expect(event.eventType).toBe('gmail.invoice.detected')
      expect(event.payload.from).toBe('finance@client.com')
      expect(event.payload.subject).toContain('Invoice')
    })
  })

  describe('2. Pinia useWebhookStore Actions', () => {
    it('simulates inbound push events and routes to workflow automatically', async () => {
      const store = useWebhookStore()
      expect(store.endpoints.length).toBeGreaterThan(0)

      const event = await store.simulateInboundPush('GITHUB', 'github.issues.opened')

      expect(event.source).toBe('GITHUB')
      expect(event.signatureVerified).toBe(true)
      expect(store.eventStream.length).toBe(1)
    })
  })
})
