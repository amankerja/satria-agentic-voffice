<template>
  <div class="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-mono font-bold text-primary uppercase">
            Phase 7 Enterprise Integration
          </span>
          <h1 class="text-2xl font-black tracking-tight text-surface-on">
            Integrations & Tool Control Command Center
          </h1>
        </div>
        <p class="mt-1 text-sm text-surface-muted">
          Manajemen koneksi resmi GitHub & Gmail, kontrol izin Least Privilege, gerbang approval tindakan berisiko, dan eksekusi lintas sistem.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="showConnectModal = true"
          class="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Hubungkan Layanan Baru</span>
        </button>
      </div>
    </div>

    <!-- 4 Pillar KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="rounded-2xl border border-surface-container-high/60 bg-surface-container-low p-4 space-y-1">
        <p class="text-[11px] font-medium text-surface-muted uppercase tracking-wider">Layanan Terhubung</p>
        <p class="text-2xl font-black text-surface-on font-mono">{{ integrationStore.connectedCount }}</p>
      </div>

      <div class="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Total Eksekusi Tool</p>
        <p class="text-2xl font-black text-blue-400 font-mono">{{ integrationStore.executions.length }}</p>
      </div>

      <div class="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Menunggu Approval</p>
        <p class="text-2xl font-black text-amber-400 font-mono">{{ integrationStore.pendingApprovalsCount }}</p>
      </div>

      <div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Audit Security Log</p>
        <p class="text-2xl font-black text-emerald-400 font-mono">{{ integrationStore.auditEvents.length }}</p>
      </div>
    </div>

    <!-- Tab Bar Switcher -->
    <div class="flex items-center gap-1.5 border-b border-surface-container-high/60 pb-px overflow-x-auto">
      <button
        v-for="tab in tabOptions"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap"
        :class="
          activeTab === tab.id
            ? 'border-primary text-primary'
            : 'border-transparent text-surface-muted hover:text-surface-on hover:border-surface-container-high'
        "
      >
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.badge"
          class="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold"
          :class="activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-surface-muted'"
        >
          {{ tab.badge }}
        </span>
      </button>
    </div>

    <!-- TAB 1: OVERVIEW & CONNECTED SERVICES -->
    <div v-if="activeTab === 'services'" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="conn in integrationStore.connections"
          :key="conn.id"
          class="rounded-2xl border border-surface-container-high/60 bg-surface-container-low p-5 space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div
                  class="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm"
                  :class="conn.providerId === 'github' ? 'bg-purple-600 text-white' : conn.providerId === 'gmail' ? 'bg-blue-600 text-white' : 'bg-surface-container-high text-surface-on'"
                >
                  {{ conn.providerId === 'github' ? 'GH' : conn.providerId === 'gmail' ? 'GM' : 'SLK' }}
                </div>
                <div>
                  <h4 class="text-xs font-bold text-surface-on">{{ conn.displayName }}</h4>
                  <p class="text-[10px] text-surface-muted font-mono">{{ conn.accountLabel }}</p>
                </div>
              </div>

              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                :class="conn.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
              >
                {{ conn.status }}
              </span>
            </div>

            <!-- Scopes & Repositories list -->
            <div class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/40 text-xs space-y-1.5 font-mono">
              <div v-if="conn.metadata?.repositories" class="text-[11px] text-surface-on">
                <span class="text-surface-muted">Repositories:</span> {{ conn.metadata.repositories.join(', ') }}
              </div>
              <div v-if="conn.metadata?.allowedRecipientDomains" class="text-[11px] text-surface-on">
                <span class="text-surface-muted">Allowed Domains:</span> {{ conn.metadata.allowedRecipientDomains.join(', ') }}
              </div>
              <div class="text-[10px] text-surface-muted pt-1 border-t border-surface-container-high/40">
                Terverifikasi: {{ formatDate(conn.lastValidatedAt) }}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 border-t border-surface-container-high/40 flex items-center gap-2">
            <button
              @click="handleTestPing(conn.id)"
              :disabled="integrationStore.isTesting"
              class="flex-1 rounded-xl bg-surface-container-high px-3 py-2 text-xs font-bold text-surface-on hover:bg-surface-container-highest transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>⚡ Tes Koneksi</span>
            </button>
            <button
              @click="handleDisconnect(conn.id)"
              class="rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              Putus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: CROSS-SYSTEM AGENTIC STUDIO -->
    <div v-else-if="activeTab === 'cross_system'">
      <CrossSystemStudioTab />
    </div>

    <!-- TAB 3: TOOL PERMISSION MATRIX -->
    <div v-else-if="activeTab === 'permissions'">
      <ToolPermissionMatrixTab :permissions="integrationStore.permissions" />
    </div>

    <!-- TAB 4: APPROVAL GATE CENTER -->
    <div v-else-if="activeTab === 'approvals'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-bold text-surface-on">Daftar Otorisasi Tindakan Berisiko (Approval Gate)</h3>
          <p class="text-xs text-surface-muted">Seluruh tindakan high-risk (seperti penerbitan Pull Request & pengiriman email ke klien) membutuhkan persetujuan Owner/Manager.</p>
        </div>
      </div>

      <div v-if="integrationStore.approvals.length > 0" class="space-y-3">
        <div
          v-for="appr in integrationStore.approvals"
          :key="appr.id"
          class="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          :class="appr.status === 'PENDING' ? 'border-amber-500/40 bg-amber-500/5' : 'border-surface-container-high/60 bg-surface-container-low'"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-bold font-mono"
                :class="appr.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : appr.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'"
              >
                {{ appr.status }}
              </span>
              <h4 class="text-xs font-bold text-surface-on">{{ appr.requestedAction }}</h4>
            </div>
            <p class="text-xs text-surface-muted">{{ appr.reason }}</p>
            <p class="text-[10px] text-surface-muted font-mono">
              Pemohon: <span class="text-surface-on font-bold">{{ appr.agentName }}</span> &bull; Waktu: {{ formatDate(appr.createdAt) }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="openInspectApproval(appr)"
              class="rounded-xl border border-surface-container-high bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-surface-on hover:bg-surface-container-high"
            >
              Inspeksi Payload
            </button>
            <div v-if="appr.status === 'PENDING'" class="flex items-center gap-1.5">
              <button
                @click="integrationStore.rejectRequest(appr.id)"
                class="rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10"
              >
                Tolak
              </button>
              <button
                @click="integrationStore.approveRequest(appr.id)"
                class="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-surface-container-lowest hover:bg-primary/90"
              >
                Setujui
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center p-8 rounded-2xl bg-surface-container-low border border-surface-container-high text-xs text-surface-muted">
        Tidak ada permintaan approval aktif saat ini.
      </div>
    </div>

    <!-- TAB 5: SECURITY AUDIT & TELEMETRY -->
    <div v-else-if="activeTab === 'audit'">
      <IntegrationAuditTab :audit-events="integrationStore.auditEvents" />
    </div>

    <!-- Modals -->
    <ConnectIntegrationModal
      :is-open="showConnectModal"
      @close="showConnectModal = false"
      @created="integrationStore.loadAll"
    />

    <ToolApprovalModal
      :is-open="showApprovalModal"
      :approval="selectedApproval"
      @close="showApprovalModal = false"
      @resolved="integrationStore.loadAll"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { IntegrationApprovalRequest } from '../../types'
import { useIntegrationStore } from '../../stores/integration'

import ConnectIntegrationModal from '../../components/integrations/ConnectIntegrationModal.vue'
import ToolApprovalModal from '../../components/integrations/ToolApprovalModal.vue'
import CrossSystemStudioTab from '../../components/integrations/CrossSystemStudioTab.vue'
import ToolPermissionMatrixTab from '../../components/integrations/ToolPermissionMatrixTab.vue'
import IntegrationAuditTab from '../../components/integrations/IntegrationAuditTab.vue'

const integrationStore = useIntegrationStore()

const activeTab = ref<'services' | 'cross_system' | 'permissions' | 'approvals' | 'audit'>('services')
const showConnectModal = ref(false)
const showApprovalModal = ref(false)
const selectedApproval = ref<IntegrationApprovalRequest | null>(null)

const tabOptions = computed(() => [
  { id: 'services' as const, label: 'Layanan Terhubung', badge: integrationStore.connectedCount.toString() },
  { id: 'cross_system' as const, label: 'Cross-System Studio' },
  { id: 'permissions' as const, label: 'Matriks Izin Tool', badge: integrationStore.permissions.length.toString() },
  { id: 'approvals' as const, label: 'Approval Gate Center', badge: integrationStore.pendingApprovalsCount.toString() },
  { id: 'audit' as const, label: 'Audit Trail & Telemetry', badge: integrationStore.auditEvents.length.toString() }
])

onMounted(async () => {
  await integrationStore.loadAll()
})

function formatDate(isoStr?: string): string {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function handleTestPing(connId: string) {
  await integrationStore.testConnectionHealth(connId)
}

async function handleDisconnect(connId: string) {
  if (confirm('Apakah Anda yakin ingin memutuskan koneksi ini?')) {
    await integrationStore.disconnectConnection(connId)
  }
}

function openInspectApproval(appr: IntegrationApprovalRequest) {
  selectedApproval.value = appr
  showApprovalModal.value = true
}
</script>
