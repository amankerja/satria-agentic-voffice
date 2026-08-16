<template>
  <div class="space-y-6">
    <!-- Header & Filter -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-base font-bold text-surface-on">Katalog Tool Terintegrasi (GitHub & Email)</h3>
        <p class="text-xs text-surface-muted">Daftar tool resmi yang dapat dipanggil oleh Digital Employee beserta skema parameter dan level risiko.</p>
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="providerFilter"
          class="rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-1.5 text-xs text-surface-on"
        >
          <option value="all">Semua Provider</option>
          <option value="github">GitHub Tools</option>
          <option value="gmail">Gmail / Email Tools</option>
        </select>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Cari tool..."
          class="rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-1.5 text-xs text-surface-on w-48"
        />
      </div>
    </div>

    <!-- Tool Grid Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="tool in filteredTools"
        :key="tool.id"
        class="rounded-2xl border border-surface-container-high/70 bg-surface-container-low p-5 space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
      >
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div
                class="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs"
                :class="tool.provider === 'github' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30'"
              >
                {{ tool.provider === 'github' ? 'GH' : 'GM' }}
              </div>
              <div>
                <h4 class="text-xs font-bold text-surface-on">{{ tool.displayName }}</h4>
                <p class="text-[11px] font-mono text-primary font-bold">{{ tool.name }}</p>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold"
                :class="getRiskBadgeClass(tool.riskLevel)"
              >
                {{ tool.riskLevel }}
              </span>
              <span
                v-if="tool.defaultApprovalRequired"
                class="rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold font-mono"
              >
                APPROVAL
              </span>
            </div>
          </div>

          <p class="text-xs text-surface-muted leading-relaxed">
            {{ tool.description }}
          </p>

          <!-- Parameter Schema Preview -->
          <div class="space-y-1.5 pt-2 border-t border-surface-container-high/50">
            <span class="text-[10px] font-bold font-mono uppercase tracking-wider text-surface-muted">
              Parameter Skema:
            </span>
            <div class="space-y-1">
              <div
                v-for="param in tool.parameters"
                :key="param.name"
                class="rounded-lg bg-surface-container-lowest border border-surface-container-high/40 p-2 text-[11px] flex items-center justify-between font-mono"
              >
                <div>
                  <span class="font-bold text-surface-on">{{ param.name }}</span>
                  <span class="text-surface-muted ml-1">({{ param.type }})</span>
                  <span v-if="param.required" class="text-rose-400 ml-1 font-bold">*wajib</span>
                </div>
                <span class="text-[10px] text-surface-muted truncate max-w-xs">{{ param.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-surface-container-high/40 flex items-center justify-between text-[11px] text-surface-muted font-mono">
          <span>Timeout: {{ tool.timeoutMs / 1000 }}s</span>
          <span>Aksi: <strong class="uppercase text-surface-on">{{ tool.action }}</strong></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ToolCatalog } from '../../services/integrations/ToolCatalog'

const searchQuery = ref('')
const providerFilter = ref('all')

const allTools = ToolCatalog.getAllTools()

const filteredTools = computed(() => {
  return allTools.filter((t) => {
    const matchProvider = providerFilter.value === 'all' || t.provider === providerFilter.value
    const matchSearch =
      !searchQuery.value ||
      t.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.displayName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchProvider && matchSearch
  })
})

function getRiskBadgeClass(risk: string): string {
  switch (risk) {
    case 'LOW':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'MEDIUM':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'HIGH':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'CRITICAL':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    default:
      return 'bg-surface-container-high text-surface-muted'
  }
}
</script>
