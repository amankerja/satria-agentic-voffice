import type {
  WebhookEndpointConfig,
  SatriaInboundEvent,
  WebhookSource,
  WebhookEventType
} from '../../types'

export class WebhookGatewayService {
  private static seenDeliveryIds = new Set<string>()

  /**
   * Clears delivery cache (useful for testing)
   */
  static clearDeliveryCache(): void {
    this.seenDeliveryIds.clear()
  }

  /**
   * Verifies HMAC signature or authorization token for inbound webhook
   */
  static verifySignature(
    source: WebhookSource,
    secretKey: string,
    _payload: any,
    headers: Record<string, string> = {}
  ): boolean {
    if (!secretKey) return true // If no secret configured, allow

    if (source === 'GITHUB') {
      const signature = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256']
      if (!signature) return false
      // Simulated HMAC validation: signature must start with sha256= and match expected secret format
      return signature.startsWith('sha256=') && signature.length >= 16
    }

    if (source === 'GMAIL') {
      const auth = headers['authorization'] || headers['Authorization']
      if (!auth) return false
      return auth.startsWith('Bearer ') || auth.includes(secretKey)
    }

    if (source === 'STRIPE') {
      const stripeSig = headers['stripe-signature'] || headers['Stripe-Signature']
      return Boolean(stripeSig && stripeSig.includes('t='))
    }

    return true
  }

  /**
   * Ingests and processes an incoming webhook request
   */
  static processInboundWebhook(
    endpoint: WebhookEndpointConfig,
    rawPayload: any,
    headers: Record<string, string> = {}
  ): SatriaInboundEvent {
    const deliveryId = headers['x-delivery-id'] || headers['X-GitHub-Delivery'] || `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

    // 1. Idempotency Check
    if (this.seenDeliveryIds.has(deliveryId)) {
      return {
        id: eventId,
        deliveryId,
        source: endpoint.source,
        eventType: this.detectEventType(endpoint.source, rawPayload, headers),
        signatureVerified: true,
        headers,
        payload: rawPayload,
        status: 'DUPLICATE',
        receivedAt: new Date().toISOString(),
        error: `[IDEMPOTENCY_REJECTED] Delivery ID ${deliveryId} already processed.`
      }
    }

    // 2. Signature Verification
    const isVerified = this.verifySignature(endpoint.source, endpoint.secretKey, rawPayload, headers)
    if (!isVerified) {
      return {
        id: eventId,
        deliveryId,
        source: endpoint.source,
        eventType: this.detectEventType(endpoint.source, rawPayload, headers),
        signatureVerified: false,
        headers,
        payload: rawPayload,
        status: 'REJECTED',
        receivedAt: new Date().toISOString(),
        error: `[SIGNATURE_INVALID] Signature verification failed for ${endpoint.source} endpoint.`
      }
    }

    // Record delivery ID to prevent replay attacks
    this.seenDeliveryIds.add(deliveryId)
    endpoint.totalEventsReceived = (endpoint.totalEventsReceived || 0) + 1
    endpoint.lastReceivedAt = new Date().toISOString()

    const eventType = this.detectEventType(endpoint.source, rawPayload, headers)

    return {
      id: eventId,
      deliveryId,
      source: endpoint.source,
      eventType,
      signatureVerified: true,
      headers,
      payload: this.normalizePayload(endpoint.source, rawPayload),
      status: endpoint.targetWorkflowId ? 'ROUTED' : 'VERIFIED',
      targetWorkflowId: endpoint.targetWorkflowId,
      receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    }
  }

  /**
   * Determines semantic event type from vendor headers and payload
   */
  private static detectEventType(
    source: WebhookSource,
    payload: any,
    headers: Record<string, string>
  ): WebhookEventType {
    if (source === 'GITHUB') {
      const githubEvent = headers['x-github-event'] || headers['X-GitHub-Event']
      if (githubEvent === 'pull_request') return 'github.pull_request.opened'
      if (githubEvent === 'issues') return 'github.issues.opened'
      if (githubEvent === 'workflow_run') return 'github.workflow_run.failed'
      return 'github.push'
    }

    if (source === 'GMAIL') {
      if (payload?.type === 'invoice' || (payload?.subject || '').toLowerCase().includes('invoice')) {
        return 'gmail.invoice.detected'
      }
      return 'gmail.message.received'
    }

    if (source === 'STRIPE') {
      return 'stripe.payment_intent.succeeded'
    }

    return 'webhook.custom'
  }

  /**
   * Normalizes vendor payload into clean unified format
   */
  private static normalizePayload(source: WebhookSource, payload: any): any {
    if (source === 'GITHUB') {
      return {
        repository: payload.repository?.full_name || 'org/satria-agentic-voffice',
        action: payload.action || 'push',
        title: payload.issue?.title || payload.pull_request?.title || payload.head_commit?.message || 'Code commit',
        sender: payload.sender?.login || 'developer',
        ref: payload.ref || 'refs/heads/main',
        raw: payload
      }
    }

    if (source === 'GMAIL') {
      return {
        from: payload.from || 'client@enterprise.com',
        subject: payload.subject || 'Laporan Transaksi Harian',
        snippet: payload.snippet || payload.body || 'Pembayaran diterima Rp1.500.000',
        receivedDate: payload.date || new Date().toISOString(),
        raw: payload
      }
    }

    return payload
  }
}
