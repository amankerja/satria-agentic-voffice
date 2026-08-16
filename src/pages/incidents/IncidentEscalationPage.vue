<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-16">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/80 pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-surface-on font-mono tracking-tight">Enterprise SLA & Automated Incident Hub</h1>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            Phase 9 Incident Auto-Escalation
          </span>
        </div>
        <p class="text-xs text-surface-muted mt-1">
          Pemantauan SLA real-time per task priority (P0/P1/P2), deteksi stalled worker, mitigasi otomatis circuit breaker, dan eskalasi ke human supervisor.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="simulateIncident"
          class="px-3.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-sm"
        >
          <Flame class="w-3.5 h-3.5" />
          <span>Simulate SEV-1 Incident</span>
        </button>
      </div>
    </div>

    <!-- 4 High-Level Summary KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Open Incidents</span>
          <AlertCircle class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-xl font-bold font-mono" :class="incidentStore.openIncidents.length > 0 ? 'text-amber-400' : 'text-emerald-400'">
          {{ incidentStore.openIncidents.length }} Active
        </div>
        <p class="text-[10px] text-surface-muted font-mono">Requires investigation</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Critical SEV-1</span>
          <AlertOctagon class="w-4 h-4 text-red-400" />
        </div>
        <div class="text-xl font-bold font-mono text-red-400">{{ incidentStore.criticalCount }}</div>
        <p class="text-[10px] text-surface-muted font-mono">P0 SLA breached incidents</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">SLA Compliance Rate</span>
          <ShieldCheck class="w-4 h-4 text-primary" />
        </div>
        <div class="text-xl font-bold font-mono text-primary">{{ incidentStore.slaComplianceRate }}%</div>
        <p class="text-[10px] text-surface-muted font-mono">Within SLA timeout threshold</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Circuit Breaker</span>
          <Cpu class="w-4 h-4 text-cyan-400" />
        </div>
        <div class="text-xl font-bold font-mono text-cyan-400">Armed (Auto)</div>
        <p class="text-[10px] text-surface-muted font-mono">Stops run after 3 failed retries</p>
      </div>
    </div>

    <!-- SLA Policies Matrix -->
    <div class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold text-surface-on font-mono flex items-center gap-2">
          <Clock class="w-4 h-4 text-primary" />
          Task Priority SLA Policy Configuration
        </h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-mono">
          <thead>
            <tr class="border-b border-surface-container-high text-surface-muted text-[10px] uppercase">
              <th class="pb-2 pl-2">Priority Tier</th>
              <th class="pb-2">Max Execution Time</th>
              <th class="pb-2">Max Retry Attempts</th>
              <th class="pb-2">Escalation Timeout</th>
              <th class="pb-2">Recipients / Notifications</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-high/60">
            <tr v-for="(policy, pKey) in incidentStore.slaPolicies" :key="pKey" class="hover:bg-surface-container transition">
              <td class="py-2.5 pl-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="priorityBadgeClass(pKey)">
                  {{ pKey }} — {{ pKey === 'P0' ? 'Critical' : pKey === 'P1' ? 'High' : 'Normal' }}
                </span>
              </td>
              <td class="py-2.5 font-bold text-surface-on">{{ policy.maxExecutionTimeSeconds }}s</td>
              <td class="py-2.5">{{ policy.maxAttempts }} attempts</td>
              <td class="py-2.5 text-amber-400 font-bold">{{ policy.escalationTimeoutSeconds }}s</td>
              <td class="py-2.5 text-[11px] text-surface-muted">
                {{ policy.escalationRecipients.length > 0 ? policy.escalationRecipients.join(', ') : 'In-App Toast Only' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Active Incidents Ledger -->
    <div class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-surface-on font-mono flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 text-red-400" />
          Incident & Escalation Log ({{ incidentStore.incidents.length }} Records)
        </h3>
      </div>

      <div class="space-y-3">
        <div
          v-for="inc in incidentStore.incidents"
          :key="inc.id"
          class="p-4 rounded-xl border bg-surface-container-lowest transition space-y-2.5 text-xs font-mono"
          :class="[
            inc.status === 'OPEN' ? 'border-red-500/40 bg-red-500/5' :
            inc.status === 'MITIGATED' ? 'border-amber-500/40 bg-amber-500/5' :
            'border-surface-container-high'
          ]"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="severityBadgeClass(inc.severity)">
                {{ inc.severity }}
              </span>
              <span class="font-bold text-surface-on font-sans text-xs">{{ inc.title }}</span>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-[10px] text-surface-muted">{{ inc.createdAt }}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold" :class="incidentStatusBadge(inc.status)">
                {{ inc.status }}
              </span>
            </div>
          </div>

          <p class="text-xs text-surface-muted font-sans">{{ inc.summary }}</p>

          <div v-if="inc.status !== 'RESOLVED'" class="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-high/60">
            <button
              v-if="inc.status === 'OPEN'"
              @click="mitigate(inc.id)"
              class="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold transition"
            >
              Trip Circuit Breaker (Mitigate)
            </button>
            <button
              @click="resolve(inc.id)"
              class="px-2.5 py-1 rounded bg-primary text-surface-base hover:bg-primary/90 text-[11px] font-bold transition"
            >
              Tandai Selesai (Resolve)
            </button>
          </div>
          <div v-else class="text-[10px] text-emerald-400 pt-1">
            &check; Resolved by {{ inc.resolvedBy || 'Owner' }} at {{ inc.resolvedAt }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  Flame,
  AlertCircle,
  AlertOctagon,
  ShieldCheck,
  Cpu,
  Clock
} from '@lucide/vue'
import { useIncidentStore } from '../../stores/incident'
import { useToast } from '../../composables/useToast'
import type { IncidentSeverity, IncidentStatus } from '../../types'

const incidentStore = useIncidentStore()
const toast = useToast()

function priorityBadgeClass(priority: string | number) {
  switch (priority) {
    case 'P0': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'P1': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    default: return 'bg-primary/20 text-primary border border-primary/30'
  }
}

function severityBadgeClass(sev: IncidentSeverity) {
  switch (sev) {
    case 'SEV-1_CRITICAL': return 'bg-red-500/20 text-red-400 border border-red-500/30 font-bold'
    case 'SEV-2_HIGH': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    default: return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
  }
}

function incidentStatusBadge(status: IncidentStatus) {
  switch (status) {
    case 'OPEN': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'MITIGATED': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    case 'RESOLVED': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    default: return 'bg-surface-container-high text-surface-muted'
  }
}

function simulateIncident() {
  const inc = incidentStore.triggerSimulatedIncident()
  toast.show('Incident Triggered', `${inc.title} berhasil dilaporkan dan dieskalasikan ke Owner.`, 'error')
}

function mitigate(id: string) {
  incidentStore.mitigateIncident(id)
  toast.show('Incident Mitigated', 'Circuit breaker berhasil diaktifkan untuk mengamankan runtime.', 'warning')
}

function resolve(id: string) {
  incidentStore.resolveIncident(id, 'Faqih (Owner)')
  toast.show('Incident Resolved', 'Insiden SLA telah ditandai selesai.', 'success')
}
</script>
