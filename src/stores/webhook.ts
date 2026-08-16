import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { WebhookGatewayService } from '../services/webhooks/WebhookGatewayService'
import { useWorkflowStore } from './workflow'
import type {
  WebhookEndpointConfig,
  SatriaInboundEvent,
  WebhookSource,
  WebhookEventType
} from '../types'

const SEED_ENDPOINTS: WebhookEndpointConfig[] = [
  {
    id: 'ep-github-01',
    name: 'GitHub Repository Events Gateway',
    source: 'GITHUB',
    urlPath: 'https://satria.ai/api/webhooks/github',
    secretKey: 'gh_webhook_sec_satria_2026',
    enabled: true,
    targetWorkflowId: 'wf-eng-pipeline',
    totalEventsReceived: 14,
    lastReceivedAt: '2026-08-16T09:30:00Z'
  },
  {
    id: 'ep-gmail-01',
    name: 'Google Workspace Gmail Push Inbound',
    source: 'GMAIL',
    urlPath: 'https://satria.ai/api/webhooks/gmail',
    secretKey: 'gmail_push_sec_token_99',
    enabled: true,
    targetWorkflowId: 'wf-finance-recap',
    totalEventsReceived: 28,
    lastReceivedAt: '2026-08-16T10:00:00Z'
  },
  {
    id: 'ep-stripe-01',
    name: 'Payment & Invoice Gateway Webhook',
    source: 'STRIPE',
    urlPath: 'https://satria.ai/api/webhooks/stripe',
    secretKey: 'whsec_stripe_live_key',
    enabled: true,
    totalEventsReceived: 7,
    lastReceivedAt: '2026-08-16T08:15:00Z'
  }
]

export const useWebhookStore = defineStore('webhook', () => {
  const workflowStore = useWorkflowStore()

  const endpoints = ref<WebhookEndpointConfig[]>(SEED_ENDPOINTS)
  const eventStream = ref<SatriaInboundEvent[]>([])
  const isSimulating = ref<boolean>(false)

  const activeEndpointsCount = computed(() => {
    return endpoints.value.filter((e) => e.enabled).length
  })

  const totalEventsCount = computed(() => {
    return endpoints.value.reduce((sum, e) => sum + (e.totalEventsReceived || 0), 0) + eventStream.value.length
  })

  async function receiveWebhook(
    endpointId: string,
    rawPayload: any,
    headers: Record<string, string> = {}
  ): Promise<SatriaInboundEvent> {
    const endpoint = endpoints.value.find((e) => e.id === endpointId)
    if (!endpoint) throw new Error(`Endpoint not found: ${endpointId}`)

    const event = WebhookGatewayService.processInboundWebhook(endpoint, rawPayload, headers)
    eventStream.value.unshift(event)

    // Auto-trigger target workflow if routed successfully
    if (event.status === 'ROUTED' && event.targetWorkflowId) {
      workflowStore.executeWorkflow(event.targetWorkflowId, {
        source: event.source,
        eventType: event.eventType,
        title: event.payload?.title || event.payload?.subject || 'Inbound Webhook Event',
        body: event.payload?.snippet || event.payload?.title || 'Triggered from webhook gateway'
      })
    }

    return event
  }

  async function simulateInboundPush(
    source: WebhookSource,
    _eventType: WebhookEventType = 'github.issues.opened'
  ): Promise<SatriaInboundEvent> {
    isSimulating.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))

      const targetEp = endpoints.value.find((e) => e.source === source) || endpoints.value[0]

      let dummyPayload: any = {}
      let headers: Record<string, string> = {}

      if (source === 'GITHUB') {
        headers = {
          'x-github-event': 'issues',
          'x-hub-signature-256': 'sha256=a1b2c3d4e5f6789012345678',
          'x-delivery-id': `del-gh-${Date.now()}`
        }
        dummyPayload = {
          action: 'opened',
          issue: {
            title: 'Fix race condition deadlock in token refresh middleware',
            number: 108
          },
          repository: {
            full_name: 'amankerja/satria-agentic-voffice'
          },
          sender: { login: 'octocat' }
        }
      } else if (source === 'GMAIL') {
        headers = {
          authorization: `Bearer ${targetEp.secretKey}`,
          'x-delivery-id': `del-gm-${Date.now()}`
        }
        dummyPayload = {
          from: 'billing@client-corp.id',
          subject: 'Bukti Pembayaran Invoice #INV-2026-889 Rp2.500.000',
          snippet: 'Halo Admin SATRIA, terlampir bukti transfer pembayaran invoice.',
          date: new Date().toISOString()
        }
      } else {
        headers = {
          'stripe-signature': 't=1600000000,v1=abcde12345',
          'x-delivery-id': `del-st-${Date.now()}`
        }
        dummyPayload = {
          type: 'payment_intent.succeeded',
          amount: 2500000,
          currency: 'idr'
        }
      }

      return await receiveWebhook(targetEp.id, dummyPayload, headers)
    } finally {
      isSimulating.value = false
    }
  }

  return {
    endpoints,
    eventStream,
    isSimulating,
    activeEndpointsCount,
    totalEventsCount,
    receiveWebhook,
    simulateInboundPush
  }
})
