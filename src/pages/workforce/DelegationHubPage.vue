<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-16">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/80 pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Network class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-surface-on font-mono tracking-tight">Multi-Agent Delegation & ACL Subsystem</h1>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            Phase 6 Hierarchical Swarm
          </span>
        </div>
        <p class="text-xs text-surface-muted mt-1">
          Pendelegasian sub-task berjenjang dari Lead Planner/Supervisor ke Specialist Agents dengan boundary ACL dan agregasi deliverable.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="createNewPlanModal = true"
          class="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-mono font-bold flex items-center gap-1.5 transition"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Buat Plan Delegasi Baru</span>
        </button>

        <button
          @click="runExecution"
          :disabled="delegationStore.isExecuting || !delegationStore.activePlan"
          class="px-3.5 py-1.5 rounded-lg bg-primary text-surface-base hover:bg-primary/90 text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
        >
          <Play class="w-3.5 h-3.5" />
          <span>{{ delegationStore.isExecuting ? 'Mengeksekusi Swarm...' : 'Eksekusi Multi-Agent' }}</span>
        </button>
      </div>
    </div>

    <!-- 4 High-Level KPI Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Active Plans</span>
          <GitFork class="w-4 h-4 text-primary" />
        </div>
        <div class="text-xl font-bold font-mono text-primary">{{ delegationStore.plans.length }}</div>
        <p class="text-[10px] text-surface-muted font-mono">Hierarchical decomposed plans</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Sub-Tasks Dispatched</span>
          <ListTree class="w-4 h-4 text-cyan-400" />
        </div>
        <div class="text-xl font-bold font-mono text-cyan-400">
          {{ delegationStore.activePlan?.subTasks.length || 3 }}
        </div>
        <p class="text-[10px] text-surface-muted font-mono">Specialist workers assigned</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">ACL Security Guard</span>
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="text-xl font-bold font-mono text-emerald-400">Enforced</div>
        <p class="text-[10px] text-surface-muted font-mono">Depth & budget boundary active</p>
      </div>

      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Plan Status</span>
          <Zap class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-xl font-bold font-mono text-amber-400">
          {{ delegationStore.activePlan?.overallStatus || 'Ready' }}
        </div>
        <p class="text-[10px] text-surface-muted font-mono">All ACL gates passed</p>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-surface-container-high">
      <button
        @click="activeTab = 'tree'"
        class="px-4 py-2.5 text-xs font-mono font-bold transition border-b-2 flex items-center gap-2"
        :class="activeTab === 'tree' ? 'border-primary text-primary' : 'border-transparent text-surface-muted hover:text-surface-on'"
      >
        <ListTree class="w-4 h-4" />
        <span>Delegation Tree & Live Swarm Visualizer</span>
      </button>
      <button
        @click="activeTab = 'acl'"
        class="px-4 py-2.5 text-xs font-mono font-bold transition border-b-2 flex items-center gap-2"
        :class="activeTab === 'acl' ? 'border-primary text-primary' : 'border-transparent text-surface-muted hover:text-surface-on'"
      >
        <ShieldCheck class="w-4 h-4" />
        <span>Agent ACL Policy Matrix</span>
      </button>
    </div>

    <!-- Tab 1: Delegation Tree & Execution -->
    <div v-if="activeTab === 'tree'" class="space-y-6">
      <div v-if="delegationStore.activePlan" class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-6">
        <!-- Root Supervisor Card -->
        <div class="p-4 rounded-xl border border-primary/40 bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-mono font-bold">
              L1
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-surface-on font-mono text-sm">{{ delegationStore.activePlan.supervisorName }}</span>
                <span class="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  Supervisor / Lead Planner
                </span>
              </div>
              <p class="text-xs text-surface-muted mt-0.5 font-sans">
                Goal: <strong class="text-surface-on">{{ delegationStore.activePlan.goal }}</strong>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 text-xs font-mono text-surface-muted">
            <span>Sub-Tasks: {{ delegationStore.activePlan.subTasks.length }}</span>
            <span class="px-2.5 py-1 rounded font-bold" :class="planStatusClass(delegationStore.activePlan.overallStatus)">
              {{ delegationStore.activePlan.overallStatus }}
            </span>
          </div>
        </div>

        <!-- Delegated Sub-Agent Branches Grid -->
        <div class="space-y-3 pl-4 border-l-2 border-primary/30 ml-5">
          <div
            v-for="(sub, sIdx) in delegationStore.activePlan.subTasks"
            :key="sub.id"
            class="p-4 rounded-xl border bg-surface-container-lowest transition space-y-2 relative"
            :class="[
              sub.status === 'Completed' ? 'border-emerald-500/40 bg-surface-container-lowest' :
              sub.status === 'In Progress' ? 'border-primary animate-pulse' :
              sub.status === 'Rejected_By_Acl' ? 'border-red-500/40 bg-red-500/5' :
              'border-surface-container-high'
            ]"
          >
            <!-- Branch Badge & Title -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-[10px] font-mono font-bold text-surface-muted">
                  #{{ sIdx + 1 }}
                </span>
                <span class="font-bold text-xs text-surface-on font-mono">{{ sub.title }}</span>
                <span class="px-2 py-0.2 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {{ sub.delegateeRole }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono text-surface-muted">Budget: ${{ sub.budgetUsd.toFixed(2) }}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold" :class="subStatusClass(sub.status)">
                  {{ sub.status }}
                </span>
              </div>
            </div>

            <p class="text-xs text-surface-muted font-sans">{{ sub.instructions }}</p>

            <div v-if="sub.resultPayload" class="mt-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high text-xs font-mono text-emerald-400">
              &check; {{ sub.resultPayload.deliverable }}
            </div>
            <div v-else-if="sub.error" class="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400">
              &cross; {{ sub.error }}
            </div>
          </div>
        </div>

        <!-- Consolidated Deliverable Synthesis -->
        <div v-if="delegationStore.activePlan.aggregatedResult" class="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 space-y-2">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <h4 class="text-xs font-bold font-mono text-emerald-400">Consolidated Deliverable Synthesized by Supervisor</h4>
          </div>
          <pre class="text-xs font-mono text-surface-on whitespace-pre-wrap leading-relaxed">{{ delegationStore.activePlan.aggregatedResult }}</pre>
        </div>
      </div>

      <div v-else class="text-center py-12 text-surface-muted font-mono text-xs">
        Belum ada plan delegasi aktif. Klik tombol "Buat Plan Delegasi Baru" di atas.
      </div>
    </div>

    <!-- Tab 2: Agent ACL Matrix -->
    <div v-if="activeTab === 'acl'" class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-4">
      <div>
        <h3 class="text-sm font-bold text-surface-on font-mono flex items-center gap-2">
          <ShieldCheck class="w-4 h-4 text-primary" />
          Agent Access Control List (ACL) & Delegation Guardrails
        </h3>
        <p class="text-xs text-surface-muted mt-0.5 font-mono">
          Batasan hierarki peran, kedalaman rekursi maksimum, pagu anggaran per sub-task, dan pewarisan whitelist tool.
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-mono">
          <thead>
            <tr class="border-b border-surface-container-high text-surface-muted text-[10px] uppercase">
              <th class="pb-3 pl-2">Digital Worker</th>
              <th class="pb-3">Role Level</th>
              <th class="pb-3 text-center">Can Delegate?</th>
              <th class="pb-3 text-center">Max Depth</th>
              <th class="pb-3 text-center">Max Sub-Budget</th>
              <th class="pb-3">Inherited Tool Whitelist</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-high/60">
            <tr
              v-for="emp in employeeStore.employees"
              :key="emp.id"
              class="hover:bg-surface-container transition"
            >
              <td class="py-3 pl-2">
                <div class="font-bold text-surface-on font-sans text-xs">{{ emp.name }}</div>
                <div class="text-[10px] text-surface-muted">{{ emp.roleName }}</div>
              </td>
              <td class="py-3">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="roleLevelBadge(delegationStore.getEmployeePolicy(emp.id).roleLevel)"
                >
                  {{ delegationStore.getEmployeePolicy(emp.id).roleLevel }}
                </span>
              </td>
              <td class="py-3 text-center">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="delegationStore.getEmployeePolicy(emp.id).canDelegate ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-surface-muted'"
                >
                  {{ delegationStore.getEmployeePolicy(emp.id).canDelegate ? 'YES (Allowed)' : 'NO (Disabled)' }}
                </span>
              </td>
              <td class="py-3 text-center font-bold text-surface-on">
                {{ delegationStore.getEmployeePolicy(emp.id).maxDelegationDepth }}
              </td>
              <td class="py-3 text-center text-primary font-bold">
                ${{ delegationStore.getEmployeePolicy(emp.id).maxSubTaskBudgetUsd.toFixed(2) }}
              </td>
              <td class="py-3 text-surface-muted text-[11px]">
                {{ delegationStore.getEmployeePolicy(emp.id).inheritedToolWhiteList.join(', ') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create New Plan Modal -->
    <UiModal
      :open="createNewPlanModal"
      title="Create Multi-Agent Delegation Plan"
      @close="createNewPlanModal = false"
    >
      <div class="space-y-3.5 py-2 text-xs font-mono">
        <div>
          <label class="block text-[10px] text-surface-muted uppercase mb-1">Project Goal / Requirement</label>
          <input
            v-model="newPlanGoal"
            type="text"
            placeholder="e.g. Implement Full-Stack JWT Concurrency Mutex & Security Audit"
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="createNewPlanModal = false">Batal</UiButton>
          <UiButton variant="primary" size="sm" @click="submitNewPlan">
            Generate Plan & Sub-Tasks
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Network,
  GitFork,
  ListTree,
  ShieldCheck,
  Zap,
  Plus,
  Play,
  CheckCircle2
} from '@lucide/vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiButton from '../../components/ui/UiButton.vue'
import { useDelegationStore } from '../../stores/delegation'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'
import type { AgentRoleLevel, DelegatedSubTaskStatus, DelegationPlanStatus } from '../../types'

const delegationStore = useDelegationStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const activeTab = ref<'tree' | 'acl'>('tree')
const createNewPlanModal = ref(false)
const newPlanGoal = ref('Implement Full-Stack JWT Concurrency Mutex & Security Audit')

onMounted(async () => {
  await employeeStore.fetchEmployees()
  if (delegationStore.plans.length === 0) {
    delegationStore.createPlan('tsk-parent-01', newPlanGoal.value)
  }
})

function roleLevelBadge(level: AgentRoleLevel) {
  switch (level) {
    case 'SUPERVISOR': return 'bg-primary/20 text-primary border border-primary/30'
    case 'SPECIALIST': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
    default: return 'bg-surface-container-high text-surface-muted'
  }
}

function planStatusClass(status: DelegationPlanStatus) {
  switch (status) {
    case 'Completed': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    case 'Executing': return 'bg-primary/20 text-primary border border-primary/30 animate-pulse'
    case 'Aggregating': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    case 'Failed': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    default: return 'bg-surface-container-high text-surface-muted'
  }
}

function subStatusClass(status: DelegatedSubTaskStatus) {
  switch (status) {
    case 'Completed': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    case 'In Progress': return 'bg-primary/20 text-primary border border-primary/30 animate-pulse'
    case 'Rejected_By_Acl': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    default: return 'bg-surface-container-high text-surface-muted'
  }
}

function submitNewPlan() {
  if (!newPlanGoal.value) return
  createNewPlanModal.value = false
  delegationStore.createPlan(`tsk-${Date.now()}`, newPlanGoal.value)
  toast.show('Delegation Plan Created', 'Plan delegasi multi-agent berhasil dibuat dan divalidasi oleh Agent ACL.', 'success')
}

async function runExecution() {
  const completed = await delegationStore.executeActivePlan()
  if (completed) {
    toast.show('Swarm Execution Completed', 'Seluruh sub-task selesai dijalankan dan deliverable berhasil diagregasikan.', 'success')
  }
}
</script>
