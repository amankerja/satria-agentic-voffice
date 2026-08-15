<template>
  <div
    v-if="isOpen && approval"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-xl rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-2xl overflow-hidden my-8">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <div class="flex items-center gap-2.5">
          <span class="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-mono font-bold text-amber-400">
            {{ approval.riskLevel }} RISK
          </span>
          <h3 class="text-sm font-bold text-surface-on">
            Persetujuan Eksekusi: {{ approval.requestedAction }}
          </h3>
        </div>
        <button @click="$emit('close')" class="text-surface-muted hover:text-surface-on">✕</button>
      </div>

      <!-- Content Details -->
      <div class="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
        <div class="rounded-xl bg-surface-container-low p-4 border border-surface-container-high space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-surface-muted font-medium">Pemohon (Agent):</span>
            <span class="font-bold text-surface-on font-mono">{{ approval.agentName }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-surface-muted font-medium">Layanan Target:</span>
            <span class="font-bold text-primary uppercase font-mono">{{ approval.provider }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-surface-muted font-medium">Waktu Request:</span>
            <span class="font-mono text-surface-muted">{{ formatDate(approval.createdAt) }}</span>
          </div>
        </div>

        <!-- Reason -->
        <div class="space-y-1">
          <label class="block font-bold text-surface-on uppercase text-[10px] tracking-wider">Alasan Otorisasi Diperlukan</label>
          <div class="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high text-surface-on leading-relaxed">
            {{ approval.reason }}
          </div>
        </div>

        <!-- Action Specific Details Viewer -->
        <div class="space-y-1">
          <label class="block font-bold text-surface-on uppercase text-[10px] tracking-wider">Detail Payload & Parameter</label>
          <pre class="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high font-mono text-[11px] text-surface-on whitespace-pre-wrap overflow-x-auto">{{ JSON.stringify(approval.details, null, 2) }}</pre>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-between border-t border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-xs font-medium text-surface-muted hover:text-surface-on"
        >
          Tutup
        </button>

        <div v-if="approval.status === 'PENDING'" class="flex items-center gap-2">
          <button
            @click="handleReject"
            class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            Tolak Eksekusi
          </button>
          <button
            @click="handleApprove"
            class="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-colors shadow-sm"
          >
            ✓ Setujui & Jalankan
          </button>
        </div>
        <div v-else class="text-xs font-bold font-mono" :class="approval.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'">
          Status: {{ approval.status }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IntegrationApprovalRequest } from '../../types'
import { useIntegrationStore } from '../../stores/integration'

const props = defineProps<{
  isOpen: boolean
  approval: IntegrationApprovalRequest | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'resolved'): void
}>()

const integrationStore = useIntegrationStore()

function formatDate(isoStr?: string): string {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleString('id-ID')
}

async function handleApprove() {
  if (!props.approval) return
  await integrationStore.approveRequest(props.approval.id)
  emit('resolved')
  emit('close')
}

async function handleReject() {
  if (!props.approval) return
  await integrationStore.rejectRequest(props.approval.id)
  emit('resolved')
  emit('close')
}
</script>
