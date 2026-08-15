<template>
  <div
    role="region"
    aria-label="Quality Gate Verification Card"
    class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4 shadow-sm"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Shield class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-bold text-on-surface">Quality Gate</h3>
      </div>
      <UiBadge :variant="gateVariant" size="sm" class="font-mono font-bold">
        {{ status }}
      </UiBadge>
    </div>

    <!-- Score Bar -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between text-xs font-mono">
        <span class="text-muted">Verification Score</span>
        <span :class="['font-bold', scoreColor]">{{ score }}%</span>
      </div>
      <div
        class="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden"
        role="progressbar"
        :aria-valuenow="score"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Verification Score"
      >
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="scoreBarColor"
          :style="{ width: `${score}%` }"
        ></div>
      </div>
    </div>

    <!-- Summary Notes -->
    <div v-if="summaryNotes" class="text-xs text-on-surface-variant font-mono leading-relaxed p-3 bg-surface-container-lowest border border-outline-variant rounded-lg">
      {{ summaryNotes }}
    </div>

    <!-- Checks Quick Summary -->
    <div v-if="checks.length > 0" class="flex items-center gap-3 text-xs font-mono text-muted">
      <div class="flex items-center gap-1">
        <CheckCircle2 class="w-3.5 h-3.5 text-primary-container" />
        <span>{{ passedCount }} passed</span>
      </div>
      <div v-if="failedCount > 0" class="flex items-center gap-1">
        <XCircle class="w-3.5 h-3.5 text-error" />
        <span>{{ failedCount }} failed</span>
      </div>
      <div class="text-outline">|</div>
      <span>{{ checks.length }} total checks</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Shield, CheckCircle2, XCircle } from '@lucide/vue'
import UiBadge from '../ui/UiBadge.vue'
import type { VerificationStatus } from '../../types'

interface VerificationCheck {
  name: string
  passed: boolean
  details: string
}

const props = defineProps<{
  status: VerificationStatus
  score: number
  summaryNotes?: string
  checks: VerificationCheck[]
}>()

const gateVariant = computed(() => {
  switch (props.status) {
    case 'Passed': return 'success'
    case 'Failed': return 'error'
    case 'Warning': return 'warning'
    default: return 'neutral'
  }
})

const scoreColor = computed(() => {
  if (props.score >= 100) return 'text-primary-container'
  if (props.score >= 70) return 'text-amber-400'
  return 'text-error'
})

const scoreBarColor = computed(() => {
  if (props.score >= 100) return 'bg-primary-container'
  if (props.score >= 70) return 'bg-amber-400'
  return 'bg-error'
})

const passedCount = computed(() => props.checks.filter((c) => c.passed).length)
const failedCount = computed(() => props.checks.filter((c) => !c.passed).length)
</script>
