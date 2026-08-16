<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-16">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/80 pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Radio class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-surface-on font-mono tracking-tight">Live Webhook Gateway & Event Stream</h1>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            Phase 7 Push Inbound
          </span>
        </div>
        <p class="text-xs text-surface-muted mt-1">
          Gateway penerima sinyal webhook eksternal real-time dengan verifikasi HMAC-SHA256, proteksi replay attack, dan router workflow otomatis.
        </p>
      </div>

      <!-- Quick Test Simulators -->
      <div class="flex items-center gap-2">
        <button
          @click="triggerSimulation('GITHUB')"
          :disabled="webhookStore.isSimulating"
          class="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <GitPullRequest class="w-3.5 h-3.5" />
          <span>Simulate GitHub Issue</span>
        </button>

        <button
          @click="triggerSimulation('GMAIL')"
          :disabled="webhookStore.isSimulating"
          class="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <Mail class="w-3.5 h-3.5" />
          <span>Simulate Gmail Push</span>
        </button>
      </div>
    </div>

    <!-- 4 High-Level Summary KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Active Listeners</span>
          <Radio class="w-4 h-4 text-primary" />
        </div>
        <div class="text-xl font-bold font-mono text-primary">{{ webhookStore.activeEndpointsCount }} Online</div>
        <p class="text-[10px] text-surface-muted font-mono">Listening on port /api/webhooks/*</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Total Inbound Events</span>
          <Activity class="w-4 h-4 text-cyan-400" />
        </div>
        <div class="text-xl font-bold font-mono text-cyan-400">{{ webhookStore.totalEventsCount }}</div>
        <p class="text-[10px] text-surface-muted font-mono">Push events processed</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">HMAC Signature Status</span>
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-xl font-bold font-mono text-emerald-400">100% Verified</div>
        <p class="text-[10px] text-surface-muted font-mono">SHA-256 Auth & Idempotency</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Pipeline Auto-Route</span>
          <GitBranch class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-xl font-bold font-mono text-amber-400">Active</div>
        <p class="text-[10px] text-surface-muted font-mono">Auto-dispatches to DAG workflows</p>
      </div>
    </div>

    <!-- Configured Webhook Endpoints -->
    <div class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-surface-on font-mono flex items-center gap-2">
          <Globe class="w-4 h-4 text-primary" />
          Registered Inbound Webhook Endpoints
        </h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-mono">
          <thead>
            <tr class="border-b border-surface-container-high text-surface-muted text-[10px] uppercase">
              <th class="pb-3 pl-2">Endpoint Name</th>
              <th class="pb-3">Source</th>
              <th class="pb-3">Inbound URL</th>
              <th class="pb-3">Target Workflow</th>
              <th class="pb-3 text-center">Events Received</th>
              <th class="pb-3 text-right pr-2">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-high/60">
            <tr
              v-for="ep in webhookStore.endpoints"
              :key="ep.id"
              class="hover:bg-surface-container transition"
            >
              <td class="py-3 pl-2">
                <div class="font-bold text-surface-on font-sans text-xs">{{ ep.name }}</div>
                <div class="text-[10px] text-surface-muted">{{ ep.id }}</div>
              </td>
              <td class="py-3">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                  :class="sourceBadgeClass(ep.source)"
                >
                  {{ ep.source }}
                </span>
              </td>
              <td class="py-3">
                <div class="flex items-center gap-2">
                  <code class="text-[11px] text-surface-on bg-surface-container-lowest px-2 py-0.5 rounded border border-surface-container-high">
                    {{ ep.urlPath }}
                  </code>
                  <button
                    @click="copyUrl(ep.urlPath)"
                    class="p-1 rounded hover:bg-surface-container-high text-surface-muted hover:text-surface-on transition"
                    title="Copy URL"
                  >
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
              <td class="py-3 text-cyan-400 font-bold">
                {{ ep.targetWorkflowId || 'Manual Processing' }}
              </td>
              <td class="py-3 text-center font-bold text-surface-on">
                {{ ep.totalEventsReceived }}
              </td>
              <td class="py-3 text-right pr-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  ONLINE
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Live Inbound Event Stream Terminal -->
    <div class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-surface-on font-mono flex items-center gap-2">
          <Terminal class="w-4 h-4 text-emerald-400" />
          Live Event Ingestion Stream ({{ webhookStore.eventStream.length }} Inbound Logs)
        </h3>
        <span class="flex items-center gap-1.5 text-[10px] font-mono text-primary animate-pulse">
          <span class="w-2 h-2 rounded-full bg-primary" />
          Listening for live push events...
        </span>
      </div>

      <div v-if="webhookStore.eventStream.length > 0" class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        <div
          v-for="evt in webhookStore.eventStream"
          :key="evt.id"
          class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high space-y-2 font-mono text-xs"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-surface-on">{{ evt.id }}</span>
              <span class="px-2 py-0.2 rounded text-[9px] font-bold uppercase" :class="sourceBadgeClass(evt.source)">
                {{ evt.source }}
              </span>
              <span class="text-xs text-primary font-bold">{{ evt.eventType }}</span>
            </div>

            <div class="flex items-center gap-3 text-[10px] text-surface-muted">
              <span>Delivery: {{ evt.deliveryId }}</span>
              <span class="px-2 py-0.5 rounded font-bold" :class="eventStatusClass(evt.status)">
                {{ evt.status }}
              </span>
            </div>
          </div>

          <pre class="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-[11px] text-emerald-400 overflow-x-auto max-h-36">{{ JSON.stringify(evt.payload, null, 2) }}</pre>
        </div>
      </div>

      <div v-else class="text-center py-10 text-surface-muted font-mono text-xs">
        Belum ada webhook masuk. Klik tombol <strong>"Simulate GitHub Issue"</strong> atau <strong>"Simulate Gmail Push"</strong> di kanan atas untuk menguji pipeline.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Radio,
  Activity,
  ShieldCheck,
  GitBranch,
  Globe,
  Copy,
  Terminal,
  GitPullRequest,
  Mail
} from '@lucide/vue'
import { useWebhookStore } from '../../stores/webhook'
import { useToast } from '../../composables/useToast'
import type { WebhookSource, InboundEventStatus } from '../../types'

const webhookStore = useWebhookStore()
const toast = useToast()

function sourceBadgeClass(source: WebhookSource) {
  switch (source) {
    case 'GITHUB': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    case 'GMAIL': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'STRIPE': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    default: return 'bg-surface-container-high text-surface-muted'
  }
}

function eventStatusClass(status: InboundEventStatus) {
  switch (status) {
    case 'ROUTED':
    case 'VERIFIED':
    case 'PROCESSED':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    case 'DUPLICATE':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    case 'REJECTED':
      return 'bg-red-500/20 text-red-400 border border-red-500/30'
    default:
      return 'bg-primary/20 text-primary border border-primary/30'
  }
}

async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url)
  toast.show('URL Copied', 'Endpoint webhook URL berhasil disalin ke clipboard.', 'info')
}

async function triggerSimulation(source: WebhookSource) {
  const event = await webhookStore.simulateInboundPush(source)
  toast.show('Webhook Ingested', `Event ${event.eventType} (${event.source}) berhasil diterima dan diverifikasi HMAC.`, 'success')
}
</script>
