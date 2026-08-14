<template>
  <div class="space-y-6">
    <!-- Header & Live Execution Indicator -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Agent Execution Center</h1>
          <UiBadge variant="success" size="sm" class="font-mono flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            {{ agentRunStore.activeRuns.length }} Active Runs
          </UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Monitor real-time digital employee work executions, live progress, and run step logs
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link to="/reviews">
          <UiButton size="sm" variant="secondary" :icon="CheckCircle2">
            Reviews Center
          </UiButton>
        </router-link>
        <router-link to="/tasks">
          <UiButton size="sm" variant="primary" :icon="Plus">
            Assign Task
          </UiButton>
        </router-link>
      </div>
    </div>

    <!-- 6 High-Level Execution & Telemetry KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Total Runs</span>
          <PlayCircle class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-on-surface mt-1.5">
          {{ agentRunStore.runs.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Execution Attempts</div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Running Now</span>
          <Activity class="w-4 h-4 text-primary animate-pulse" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary mt-1.5">
          {{ agentRunStore.activeRuns.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Active Executions</div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Completed</span>
          <CheckCircle2 class="w-4 h-4 text-primary-container" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary-container mt-1.5">
          {{ agentRunStore.completedRuns.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Ready for Review</div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Failed / Retry</span>
          <AlertTriangle class="w-4 h-4 text-error" />
        </div>
        <div class="text-2xl font-bold font-mono text-error mt-1.5">
          {{ agentRunStore.failedRuns.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Needs Attention</div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Total Tokens</span>
          <Cpu class="w-4 h-4 text-secondary" />
        </div>
        <div class="text-2xl font-bold font-mono text-on-surface mt-1.5">
          {{ totalFormattedTokens }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Cumulative Usage</div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Estimated Cost</span>
          <Coins class="w-4 h-4 text-secondary" />
        </div>
        <div class="text-2xl font-bold font-mono text-secondary mt-1.5">
          {{ totalFormattedCost }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Versioned Pricing</div>
      </UiCard>
    </div>

    <!-- Filter Tabs & Search Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="st in ['All', 'Running', 'Waiting', 'Completed', 'Failed', 'Cancelled']"
          :key="st"
          @click="statusFilter = st"
          :class="[
            'px-2.5 py-1 rounded text-xs font-mono transition whitespace-nowrap',
            statusFilter === st
              ? 'bg-surface-container-high text-primary font-bold border border-outline'
              : 'text-muted hover:text-on-surface'
          ]"
        >
          {{ st }}
        </button>
      </div>

      <div class="relative w-full sm:w-64">
        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search task, employee, run ID..."
          class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-2.5 py-1 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
        />
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="agentRunStore.loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiSkeleton v-for="i in 4" :key="i" class="h-44 rounded-xl" />
    </div>

    <!-- Empty State -->
    <UiEmptyState
      v-else-if="filteredRuns.length === 0"
      title="No Execution Runs Found"
      description="Belum ada unit run yang cocok dengan filter atau pencarian Anda."
    >
      <template #action>
        <router-link to="/tasks">
          <UiButton size="sm" variant="primary">Start Run From Tasks</UiButton>
        </router-link>
      </template>
    </UiEmptyState>

    <!-- Run Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="run in filteredRuns"
        :key="run.id"
        class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl p-4.5 space-y-3.5 transition shadow-sm flex flex-col justify-between"
      >
        <div class="space-y-3">
          <!-- Card Header: ID, Attempt, Status -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-primary">#{{ run.id }}</span>
              <span class="px-1.5 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono text-muted">
                Attempt {{ run.attempt }}/3
              </span>
            </div>
            <UiBadge :variant="getStatusBadgeVariant(run.status)" size="sm" class="font-mono">
              {{ run.status }}
            </UiBadge>
          </div>

          <!-- Task Title -->
          <div>
            <h3 class="text-sm font-bold text-on-surface line-clamp-1">{{ run.taskTitle }}</h3>
          </div>

          <!-- Employee Chip -->
          <div class="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <img
              :src="run.employeeAvatar"
              :alt="run.employeeName"
              class="w-7 h-7 rounded-full object-cover border border-outline shrink-0"
            />
            <div class="truncate">
              <div class="text-xs font-bold text-on-surface truncate">{{ run.employeeName }}</div>
              <div class="text-[10px] text-muted truncate">{{ run.employeeRole }}</div>
            </div>
          </div>

          <!-- Live Progress Bar & Step -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-mono">
              <span class="text-muted flex items-center gap-1.5">
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    run.status === 'Running' ? 'bg-primary animate-pulse' : 'bg-muted'
                  ]"
                ></span>
                {{ run.currentStep }}
              </span>
              <span class="font-bold text-on-surface">{{ run.progress }}%</span>
            </div>
            <div class="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-300 rounded-full"
                :style="{ width: `${run.progress}%` }"
              ></div>
            </div>
          </div>

          <!-- Compact Telemetry Summary Row -->
          <div
            v-if="run.telemetry"
            class="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-surface-container-lowest text-[10px] font-mono border border-outline-variant"
          >
            <div class="flex items-center gap-1 text-muted truncate max-w-[48%]" :title="run.telemetry.model">
              <Cpu class="w-3 h-3 text-primary shrink-0" />
              <span class="truncate">{{ formatModelName(run.telemetry.model) }}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-on-surface-variant">{{ formatTokens(run.telemetry.totalTokens) }} toks</span>
              <span class="text-outline">/</span>
              <span class="text-secondary font-bold">{{ formatCost(run.telemetry.estimatedCostUsd) }}</span>
            </div>
          </div>

          <!-- Error Alert if failed -->
          <div v-if="run.error" class="p-2 rounded bg-error/10 border border-error/20 text-[11px] text-error line-clamp-2">
            {{ run.error }}
          </div>
        </div>

        <!-- Card Footer & Quick Actions -->
        <div class="pt-3 border-t border-outline-variant flex items-center justify-between gap-2 text-xs">
          <div class="text-[10px] font-mono text-muted">
            {{ formatDuration(run) }}
          </div>

          <div class="flex items-center gap-2">
            <button
              v-if="run.status === 'Running'"
              @click.stop="agentRunStore.pauseRun(run.id)"
              class="p-1 rounded hover:bg-surface-container-high text-muted hover:text-on-surface transition text-[11px]"
              title="Pause Runner"
            >
              <Pause class="w-3.5 h-3.5" />
            </button>
            <button
              v-else-if="run.status === 'Waiting'"
              @click.stop="agentRunStore.resumeRun(run.id)"
              class="p-1 rounded hover:bg-surface-container-high text-primary transition text-[11px]"
              title="Resume Runner"
            >
              <Play class="w-3.5 h-3.5" />
            </button>
            <button
              v-else-if="run.status === 'Failed' || run.status === 'Cancelled'"
              @click.stop="agentRunStore.retryRun(run.id)"
              class="px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition text-[10px] font-mono flex items-center gap-1"
            >
              <RotateCcw class="w-3 h-3" /> Retry
            </button>

            <router-link
              :to="`/runs/${run.id}`"
              class="font-mono text-primary hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Inspect</span>
              <span>&rarr;</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  PlayCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Cpu,
  Coins
} from '@lucide/vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiSkeleton from '../../components/ui/UiSkeleton.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import { useAgentRunStore } from '../../stores/agentRun'
import { CostCalculator } from '../../runtime'
import type { AgentRun, AgentRunStatus } from '../../types'

const agentRunStore = useAgentRunStore()

const statusFilter = ref<string>('All')
const searchQuery = ref<string>('')

onMounted(() => {
  agentRunStore.fetchRuns()
})

const filteredRuns = computed(() => {
  return agentRunStore.runs.filter((r) => {
    const matchStatus = statusFilter.value === 'All' || r.status === statusFilter.value
    const matchSearch =
      searchQuery.value.trim() === '' ||
      r.taskTitle.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchStatus && matchSearch
  })
})

const totalFormattedTokens = computed(() => CostCalculator.formatTokens(agentRunStore.totalTokensAllRuns))
const totalFormattedCost = computed(() => CostCalculator.formatCost(agentRunStore.totalEstimatedCost))

function formatTokens(tokens?: number | null): string {
  if (tokens === undefined || tokens === null) return '—'
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }
  return String(tokens)
}

function formatCost(cost?: number | null): string {
  if (cost === undefined || cost === null) return '—'
  if (cost === 0) return '$0.00'
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

function formatDuration(run: AgentRun): string {
  if (run.durationSeconds) {
    return CostCalculator.formatDuration(run.durationSeconds)
  }
  if (run.telemetry?.durationMs) {
    return CostCalculator.formatDuration(run.telemetry.durationMs, true)
  }
  return 'In progress'
}

function formatModelName(model?: string): string {
  if (!model) return 'auto'
  if (model.includes('claude-3-5-sonnet')) return 'claude-3.5-sonnet'
  if (model.includes('claude-3-haiku')) return 'claude-3-haiku'
  if (model.includes('gpt-4o-mini')) return 'gpt-4o-mini'
  if (model.includes('gpt-4o')) return 'gpt-4o'
  if (model.includes('hermes-3') && model.includes('70b')) return 'hermes-3-70b'
  if (model.includes('hermes-3') && model.includes('8b')) return 'hermes-3-8b'
  if (model.includes('mock')) return 'mock-runner'
  return model.length > 16 ? `${model.substring(0, 14)}...` : model
}

const getStatusBadgeVariant = (status: AgentRunStatus) => {
  switch (status) {
    case 'Running':
    case 'Starting':
      return 'info'
    case 'Completed':
      return 'success'
    case 'Waiting':
      return 'warning'
    case 'Failed':
      return 'error'
    default:
      return 'neutral'
  }
}
</script>
