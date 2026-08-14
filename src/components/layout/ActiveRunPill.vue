<template>
  <div
    v-if="activeRun"
    class="fixed bottom-6 right-6 z-40 max-w-sm w-full bg-surface-container-low/95 backdrop-blur-md border border-primary/40 rounded-2xl shadow-2xl p-3.5 space-y-2.5 animate-in slide-in-from-bottom-5 duration-300"
  >
    <!-- Top Row: Status & Title -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2.5 truncate">
        <div class="relative">
          <img
            v-if="activeRun.employeeAvatar"
            :src="activeRun.employeeAvatar"
            :alt="activeRun.employeeName"
            class="w-7 h-7 rounded-full object-cover border border-primary/50"
          />
          <div v-else class="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
            {{ activeRun.employeeName.charAt(0) }}
          </div>
          <span
            :class="[
              'w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 ring-2 ring-surface',
              activeRun.status === 'Waiting' ? 'bg-amber-400 animate-ping' : 'bg-primary animate-pulse'
            ]"
          ></span>
        </div>

        <div class="truncate">
          <div class="text-xs font-bold text-on-surface truncate">{{ activeRun.taskTitle }}</div>
          <div class="text-[10px] text-muted font-mono flex items-center gap-1.5">
            <span>{{ activeRun.employeeName }}</span>
            <span>&bull;</span>
            <span class="text-primary font-semibold">{{ activeRun.currentStep || activeRun.status }}</span>
          </div>
        </div>
      </div>

      <button
        @click="isMinimized = !isMinimized"
        class="text-muted hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition"
        title="Toggle details"
      >
        <ChevronUp v-if="isMinimized" class="w-4 h-4" />
        <ChevronDown v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Expanded Body -->
    <div v-if="!isMinimized" class="space-y-2.5 pt-1 border-t border-outline-variant/60">
      <!-- Progress Bar -->
      <UiProgress :value="activeRun.progress || 15" :showValue="false" />

      <!-- Stats & Quick Actions -->
      <div class="flex items-center justify-between text-[11px] font-mono">
        <div class="flex items-center gap-2 text-muted">
          <span>Tokens: <strong class="text-primary">{{ activeRun.telemetry?.totalTokens || 0 }}</strong></span>
          <span>&bull;</span>
          <span>Cost: <strong class="text-primary">{{ activeRun.telemetry?.estimatedCostUsd ? `$${activeRun.telemetry.estimatedCostUsd.toFixed(4)}` : '$0.00' }}</strong></span>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            v-if="activeRun.status === 'Waiting'"
            @click="$router.push(`/runs/${activeRun.id}`)"
            class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold hover:bg-amber-500/30 transition text-[10px]"
          >
            Review Approval &rarr;
          </button>
          <router-link
            v-else
            :to="`/runs/${activeRun.id}`"
            class="text-primary hover:underline font-sans text-xs font-semibold"
          >
            Inspect &rarr;
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronUp, ChevronDown } from '@lucide/vue'
import UiProgress from '../ui/UiProgress.vue'
import { useAgentRunStore } from '../../stores/agentRun'

const agentRunStore = useAgentRunStore()
const isMinimized = ref(false)

const activeRun = computed(() => {
  // First priority: run waiting for approval
  if (agentRunStore.waitingRuns.length > 0) {
    return agentRunStore.waitingRuns[0]
  }
  // Second priority: active running run
  if (agentRunStore.activeRuns.length > 0) {
    return agentRunStore.activeRuns[0]
  }
  return null
})
</script>
