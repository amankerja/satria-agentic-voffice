<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/80 pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FlaskConical class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-surface-on font-mono tracking-tight">Agent Evaluation Lab & Benchmark Hub</h1>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            5-Pillar Empirical Hub
          </span>
        </div>
        <p class="text-xs text-surface-muted mt-1">
          Pengujian akurasi empiris digital worker: <span class="text-emerald-400 font-mono">Coding Precision</span> &bull; <span class="text-purple-400 font-mono">Multi-Step Reasoning</span> &bull; <span class="text-cyan-400 font-mono">Data Extraction</span> &bull; <span class="text-amber-400 font-mono">Latency</span> &bull; <span class="text-blue-400 font-mono">Cost Efficiency</span>.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="triggerFullSuite"
          :disabled="evalStore.isRunningBenchmark"
          class="px-3.5 py-1.5 rounded-lg bg-primary text-surface-base hover:bg-primary/90 text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ evalStore.isRunningBenchmark ? 'Menjalankan Lab Suite...' : 'Jalankan Full Benchmark' }}</span>
        </button>
      </div>
    </div>

    <!-- 4 High-Level Top Champions KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <!-- 1. Overall Leader -->
      <div class="p-3.5 rounded-xl border border-primary/30 bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Overall #1 Champion</span>
          <Trophy class="w-4 h-4 text-primary" />
        </div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-xl font-bold font-mono text-primary">{{ evalStore.topPerformer?.employeeName || 'Bima' }}</span>
          <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-primary/20 text-primary">
            Tier {{ evalStore.topPerformer?.tierBadge || 'S' }}
          </span>
        </div>
        <p class="text-[10px] text-surface-muted font-mono">Score: {{ evalStore.topPerformer?.compositeScore || 94 }}% Composite</p>
      </div>

      <!-- 2. Coding Precision -->
      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Coding Precision</span>
          <Code2 class="w-4 h-4 text-emerald-400" />
        </div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-xl font-bold font-mono text-emerald-400">96%</span>
          <span class="text-[10px] text-surface-muted">Bima & Dimas</span>
        </div>
        <p class="text-[10px] text-surface-muted font-mono">12/12 Vitest assertions passed</p>
      </div>

      <!-- 3. Extraction Precision -->
      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Extraction Accuracy</span>
          <Database class="w-4 h-4 text-cyan-400" />
        </div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-xl font-bold font-mono text-cyan-400">98%</span>
          <span class="text-[10px] text-surface-muted">Maya Salsabila</span>
        </div>
        <p class="text-[10px] text-surface-muted font-mono">100% field precision on amounts</p>
      </div>

      <!-- 4. Token & Latency Efficiency -->
      <div class="p-3.5 rounded-xl border border-surface-container-high bg-surface-container-low space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase text-muted font-bold">Latency SLA</span>
          <Zap class="w-4 h-4 text-amber-400" />
        </div>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-xl font-bold font-mono text-amber-400">280ms</span>
          <span class="text-[10px] text-surface-muted">Sub-300ms SLA</span>
        </div>
        <p class="text-[10px] text-surface-muted font-mono">92% prompt cache hit rate</p>
      </div>
    </div>

    <!-- Leaderboard Table -->
    <div class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-surface-on font-mono flex items-center gap-2">
            <BarChart2 class="w-4 h-4 text-primary" />
            Digital Workforce 5-Pillar Capability Leaderboard
          </h3>
          <p class="text-xs text-surface-muted mt-0.5 font-mono">
            Evaluasi berkala terhadap kemampuan teknis, stabilitas sintaks, dan efisiensi biaya tiap agent.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="openRunModal = true"
            class="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <Play class="w-3.5 h-3.5" />
            <span>Test Single Agent</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-mono">
          <thead>
            <tr class="border-b border-surface-container-high text-surface-muted text-[10px] uppercase">
              <th class="pb-3 pl-2">Rank & Agent</th>
              <th class="pb-3">Department & Role</th>
              <th class="pb-3 text-center">Tier</th>
              <th class="pb-3 text-center">Composite Score</th>
              <th class="pb-3 text-center">Coding (30%)</th>
              <th class="pb-3 text-center">Reasoning (25%)</th>
              <th class="pb-3 text-center">Extraction (20%)</th>
              <th class="pb-3 text-center">Latency (15%)</th>
              <th class="pb-3 text-center">Cost (10%)</th>
              <th class="pb-3 text-right pr-2">Quick Test</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-high/60">
            <tr
              v-for="item in evalStore.leaderboard"
              :key="item.employeeId"
              class="hover:bg-surface-container transition"
            >
              <td class="py-3 pl-2">
                <div class="flex items-center gap-3">
                  <span
                    class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    :class="item.rank === 1 ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container-high text-surface-muted'"
                  >
                    {{ item.rank }}
                  </span>
                  <div>
                    <div class="font-bold text-surface-on font-sans text-xs">{{ item.employeeName }}</div>
                    <div class="text-[10px] text-surface-muted">{{ item.employeeId }}</div>
                  </div>
                </div>
              </td>
              <td class="py-3">
                <div class="text-surface-on font-sans text-xs">{{ item.employeeRole }}</div>
                <div class="text-[10px] text-surface-muted">{{ item.departmentName }}</div>
              </td>
              <td class="py-3 text-center">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="[
                    item.tierBadge === 'S' ? 'bg-primary/20 text-primary border border-primary/30' :
                    item.tierBadge === 'A' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  ]"
                >
                  {{ item.tierBadge }}-Tier
                </span>
              </td>
              <td class="py-3 text-center font-bold text-primary text-sm">
                {{ item.compositeScore }}%
              </td>
              <td class="py-3 text-center text-emerald-400">
                {{ item.codingScore }}%
              </td>
              <td class="py-3 text-center text-purple-400">
                {{ item.reasoningScore }}%
              </td>
              <td class="py-3 text-center text-cyan-400">
                {{ item.extractionScore }}%
              </td>
              <td class="py-3 text-center text-amber-400">
                {{ item.latencyScore }}%
              </td>
              <td class="py-3 text-center text-blue-400">
                {{ item.costScore }}%
              </td>
              <td class="py-3 text-right pr-2">
                <button
                  @click="runTestForAgent(item.employeeId)"
                  class="px-2 py-1 rounded bg-surface-container-high hover:bg-primary/20 hover:text-primary text-[10px] transition"
                >
                  Benchmark &rarr;
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent Benchmark Test Logs -->
    <div v-if="evalStore.benchmarkHistory.length > 0" class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-surface-on font-mono flex items-center gap-2">
          <Clock class="w-4 h-4 text-secondary" />
          Empirical Benchmark Run Logs ({{ evalStore.benchmarkHistory.length }} Records)
        </h3>
      </div>

      <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
        <div
          v-for="b in evalStore.benchmarkHistory"
          :key="b.id"
          class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-surface-on">{{ b.employeeName }}</span>
              <span class="px-2 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                {{ b.suiteType }}
              </span>
              <span class="text-emerald-400 font-bold">Score: {{ b.score }}%</span>
            </div>
            <p class="text-[11px] text-surface-muted font-sans">{{ b.details }}</p>
          </div>

          <div class="flex items-center gap-4 text-[10px] text-surface-muted shrink-0">
            <span>Latency: {{ b.latencyMs }}ms</span>
            <span>Tokens: {{ b.tokensConsumed }}</span>
            <span class="text-primary font-bold">${{ b.costUsd.toFixed(4) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Single Agent Benchmark Modal -->
    <UiModal
      :open="openRunModal"
      title="Run Empirical Agent Benchmark Test"
      @close="openRunModal = false"
    >
      <div class="space-y-3.5 py-2">
        <div>
          <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Pilih Digital Worker</label>
          <select
            v-model="targetEmpId"
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
          >
            <option
              v-for="emp in employeeStore.activeEmployees"
              :key="emp.id"
              :value="emp.id"
            >
              {{ emp.name }} ({{ emp.roleName }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Pilar Benchmark Suite</label>
          <select
            v-model="targetSuite"
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
          >
            <option value="CODING">CODING — Syntax AST & Vitest Unit Test Assertions</option>
            <option value="REASONING">REASONING — Multi-Step Dependency Decomposition</option>
            <option value="EXTRACTION">EXTRACTION — Schema Adherence & Regex Accuracy</option>
            <option value="LATENCY">LATENCY — Response SLA & Sub-300ms Early Return</option>
            <option value="COST">COST — Token Density & Prompt Caching Efficiency</option>
          </select>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <UiButton variant="ghost" size="sm" @click="openRunModal = false">Batal</UiButton>
          <UiButton variant="primary" size="sm" @click="executeBenchmarkModal">
            Jalankan Test Sekarang
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  FlaskConical,
  Trophy,
  Code2,
  Database,
  Zap,
  Sparkles,
  BarChart2,
  Play,
  Clock
} from '@lucide/vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiButton from '../../components/ui/UiButton.vue'
import { useEvaluationStore } from '../../stores/evaluation'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'
import type { BenchmarkSuiteType } from '../../types'

const evalStore = useEvaluationStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const openRunModal = ref(false)
const targetEmpId = ref('emp-bima')
const targetSuite = ref<BenchmarkSuiteType>('CODING')

onMounted(async () => {
  await employeeStore.fetchEmployees()
})

async function triggerFullSuite() {
  await evalStore.runFullLabSuite()
  toast.show('Benchmark Suite Completed', 'Full 5-pillar evaluation suite selesai dijalankan untuk seluruh digital workforce.', 'success')
}

function runTestForAgent(empId: string) {
  targetEmpId.value = empId
  openRunModal.value = true
}

async function executeBenchmarkModal() {
  const emp = employeeStore.employees.find((e) => e.id === targetEmpId.value)
  if (!emp) return

  openRunModal.value = false
  const res = await evalStore.runBenchmarkForEmployee(emp, targetSuite.value)
  toast.show('Benchmark Completed', `${emp.name} mendapatkan skor ${res.score}% pada suite ${res.suiteType}.`, 'success')
}
</script>
