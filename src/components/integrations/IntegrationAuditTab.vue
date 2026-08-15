<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-base font-bold text-surface-on">Audit Trail Eksekusi Tool & Keamanan</h3>
        <p class="text-xs text-surface-muted">Catatan permanen (immutable audit log) dari setiap interaksi tool eksternal dan keputusan izin.</p>
      </div>
      <span class="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full font-bold">
        {{ auditEvents.length }} Audit Events
      </span>
    </div>

    <!-- Audit Event Log Table -->
    <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-container-lowest border-b border-surface-container-high text-surface-muted uppercase font-mono text-[10px] tracking-wider">
            <tr>
              <th class="py-3.5 px-4 font-bold">Timestamp</th>
              <th class="py-3.5 px-4 font-bold">Actor (Agent)</th>
              <th class="py-3.5 px-4 font-bold">Provider</th>
              <th class="py-3.5 px-4 font-bold">Tool & Aksi</th>
              <th class="py-3.5 px-4 font-bold">Status</th>
              <th class="py-3.5 px-4 font-bold">Risiko</th>
              <th class="py-3.5 px-4 font-bold">Evidence / Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-high/60 text-surface-on">
            <tr
              v-for="event in auditEvents"
              :key="event.id"
              class="hover:bg-surface-container-lowest/80 transition-colors font-mono"
            >
              <td class="py-3 px-4 text-surface-muted text-[11px] whitespace-nowrap">
                {{ formatTime(event.timestamp) }}
              </td>
              <td class="py-3 px-4 font-bold text-xs text-surface-on">
                {{ event.actorName }}
              </td>
              <td class="py-3 px-4 uppercase text-primary font-bold text-[11px]">
                {{ event.provider }}
              </td>
              <td class="py-3 px-4">
                <span class="font-bold text-surface-on">{{ event.toolName }}</span>
                <span class="text-surface-muted ml-1 text-[10px]">({{ event.action }})</span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="rounded px-2 py-0.5 text-[10px] font-bold"
                  :class="getStatusBadge(event.status)"
                >
                  {{ event.status }}
                </span>
              </td>
              <td class="py-3 px-4">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  :class="getRiskBadge(event.riskLevel)"
                >
                  {{ event.riskLevel }}
                </span>
              </td>
              <td class="py-3 px-4 text-[11px] text-surface-muted truncate max-w-xs">
                {{ getEvidenceSummary(event) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IntegrationAuditEvent } from '../../types'

defineProps<{
  auditEvents: IntegrationAuditEvent[]
}>()

function formatTime(isoStr: string): string {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getStatusBadge(st: string): string {
  switch (st) {
    case 'SUCCESS':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'APPROVED':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'DENIED':
    case 'REJECTED':
    case 'FAILURE':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    default:
      return 'bg-surface-container-high text-surface-muted'
  }
}

function getRiskBadge(risk: string): string {
  switch (risk) {
    case 'LOW':
      return 'bg-emerald-500/10 text-emerald-400'
    case 'MEDIUM':
      return 'bg-blue-500/10 text-blue-400'
    case 'HIGH':
      return 'bg-amber-500/10 text-amber-400'
    case 'CRITICAL':
      return 'bg-rose-500/10 text-rose-400'
    default:
      return 'bg-surface-container-high text-surface-muted'
  }
}

function getEvidenceSummary(event: IntegrationAuditEvent): string {
  if (event.evidence && event.evidence.length > 0) {
    return event.evidence.map((e) => e.summary || e.label).join('; ')
  }
  if (event.details) {
    return JSON.stringify(event.details)
  }
  return 'Operasi selesai tervalidasi'
}
</script>
