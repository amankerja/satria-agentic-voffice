<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-base font-bold text-surface-on">Matriks Izin & Batasan Tool (Least Privilege)</h3>
        <p class="text-xs text-surface-muted">Atur izin akses tool external, level risiko keamanan, dan kebijakan approval gate per Digital Employee.</p>
      </div>
      <span class="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full font-bold">
        {{ permissions.length }} Kebijakan Aktif
      </span>
    </div>

    <!-- Permissions Table -->
    <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-container-lowest border-b border-surface-container-high text-surface-muted uppercase font-mono text-[10px] tracking-wider">
            <tr>
              <th class="py-3.5 px-4 font-bold">Digital Employee</th>
              <th class="py-3.5 px-4 font-bold">Tool System</th>
              <th class="py-3.5 px-4 font-bold">Aksi / Operasi</th>
              <th class="py-3.5 px-4 font-bold">Level Risiko</th>
              <th class="py-3.5 px-4 font-bold">Efek Izin</th>
              <th class="py-3.5 px-4 font-bold text-center">Wajib Approval</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-high/60 text-surface-on">
            <tr
              v-for="perm in permissions"
              :key="perm.id"
              class="hover:bg-surface-container-lowest/80 transition-colors"
            >
              <!-- Employee -->
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                    {{ getEmployeeInitial(perm.agentId) }}
                  </div>
                  <div>
                    <span class="font-bold text-xs">{{ getEmployeeName(perm.agentId) }}</span>
                    <p class="text-[10px] text-surface-muted font-mono">{{ perm.agentId }}</p>
                  </div>
                </div>
              </td>

              <!-- Tool Name -->
              <td class="py-3 px-4 font-mono font-bold text-primary">
                {{ perm.toolName }}
              </td>

              <!-- Action -->
              <td class="py-3 px-4">
                <span
                  class="rounded px-2 py-0.5 text-[10px] font-mono font-semibold"
                  :class="perm.action === 'read' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'"
                >
                  {{ perm.action.toUpperCase() }}
                </span>
              </td>

              <!-- Risk Level -->
              <td class="py-3 px-4">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold font-mono"
                  :class="getRiskBadgeClass(perm.riskLevel)"
                >
                  {{ perm.riskLevel }}
                </span>
              </td>

              <!-- Effect -->
              <td class="py-3 px-4">
                <select
                  :value="perm.effect"
                  @change="handleEffectChange(perm, ($event.target as HTMLSelectElement).value)"
                  class="rounded-lg bg-surface-container-lowest border border-surface-container-high px-2 py-1 text-xs text-surface-on cursor-pointer"
                >
                  <option value="ALLOW">ALLOW (Diizinkan)</option>
                  <option value="APPROVAL_REQUIRED">APPROVAL (Butuh Persetujuan)</option>
                  <option value="DENY">DENY (Blokir)</option>
                </select>
              </td>

              <!-- Approval Required Toggle -->
              <td class="py-3 px-4 text-center">
                <input
                  type="checkbox"
                  :checked="perm.approvalRequired || perm.effect === 'APPROVAL_REQUIRED'"
                  @change="handleApprovalToggle(perm, ($event.target as HTMLInputElement).checked)"
                  class="h-4 w-4 rounded border-surface-container-high text-primary focus:ring-0 cursor-pointer"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToolPermission, ToolEffect } from '../../types'
import { useIntegrationStore } from '../../stores/integration'

defineProps<{
  permissions: ToolPermission[]
}>()

const integrationStore = useIntegrationStore()

function getEmployeeInitial(agentId: string): string {
  if (agentId === 'emp-bima') return 'BM'
  if (agentId === 'emp-raka') return 'RK'
  if (agentId === 'emp-dimas') return 'DM'
  if (agentId === 'emp-maya') return 'MY'
  return 'AI'
}

function getEmployeeName(agentId: string): string {
  if (agentId === 'emp-bima') return 'Bima (Backend Engineer)'
  if (agentId === 'emp-raka') return 'Raka (Planner & Operations)'
  if (agentId === 'emp-dimas') return 'Dimas (QA & Security)'
  if (agentId === 'emp-maya') return 'Maya (Creative & Frontend)'
  return 'Semua Digital Employee (*)'
}

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
      return 'bg-surface-container-high text-surface-on'
  }
}

async function handleEffectChange(perm: ToolPermission, newEffect: string) {
  const effect = newEffect as ToolEffect
  await integrationStore.updatePermission(perm.id, {
    effect,
    approvalRequired: effect === 'APPROVAL_REQUIRED'
  })
}

async function handleApprovalToggle(perm: ToolPermission, checked: boolean) {
  await integrationStore.updatePermission(perm.id, {
    approvalRequired: checked,
    effect: checked ? 'APPROVAL_REQUIRED' : 'ALLOW'
  })
}
</script>
