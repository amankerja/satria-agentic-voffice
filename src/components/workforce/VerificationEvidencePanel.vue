<template>
  <div
    role="region"
    aria-label="Verification Evidence Panel"
    class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-3 shadow-sm"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <ClipboardCheck class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-bold text-on-surface">Verification Evidence</h3>
      </div>
      <span class="text-[10px] font-mono text-muted">
        {{ passedCount }}/{{ evidence.length }} checks passed
      </span>
    </div>

    <!-- Evidence Items -->
    <div class="space-y-2" role="list" aria-label="Evidence checks list">
      <div
        v-for="(ev, idx) in evidence"
        :key="idx"
        :class="[
          'p-3 rounded-lg border text-xs font-mono transition',
          ev.passed
            ? 'bg-primary-container/5 border-primary/20'
            : 'bg-error/5 border-error/20'
        ]"
      >
        <div class="flex items-start gap-2.5">
          <!-- Pass/Fail Icon -->
          <div class="shrink-0 mt-0.5">
            <CheckCircle2 v-if="ev.passed" class="w-4 h-4 text-primary-container" />
            <XCircle v-else class="w-4 h-4 text-error" />
          </div>

          <div class="flex-1 min-w-0 space-y-1">
            <!-- Evidence Header -->
            <div class="flex items-center gap-2 flex-wrap">
              <span :class="['font-bold', ev.passed ? 'text-on-surface' : 'text-error']">
                {{ ev.name }}
              </span>
              <span
                :class="[
                  'px-1.5 py-0.5 rounded-full text-[9px] uppercase font-bold',
                  typeColor(ev.type)
                ]"
              >
                {{ ev.type }}
              </span>
            </div>

            <!-- Evidence Details -->
            <p :class="['text-[11px] leading-relaxed', ev.passed ? 'text-on-surface-variant' : 'text-error/80']">
              {{ ev.details }}
            </p>

            <!-- Command (if present) -->
            <div
              v-if="ev.command"
              class="flex items-center gap-1.5 text-[10px] text-muted"
            >
              <Terminal class="w-3 h-3 shrink-0" />
              <code class="text-secondary">{{ ev.command }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="evidence.length === 0"
      class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-center text-xs text-muted font-mono"
    >
      No verification evidence recorded for this run.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ClipboardCheck, CheckCircle2, XCircle, Terminal } from '@lucide/vue'
import type { VerificationEvidence } from '../../types'

const props = defineProps<{
  evidence: VerificationEvidence[]
}>()

const passedCount = computed(() => props.evidence.filter((e) => e.passed).length)

function typeColor(type: VerificationEvidence['type']): string {
  switch (type) {
    case 'security': return 'bg-error/15 text-error'
    case 'test': return 'bg-secondary/15 text-secondary'
    case 'typecheck': return 'bg-primary/15 text-primary'
    case 'build': return 'bg-primary-container/15 text-primary-container'
    case 'criteria': return 'bg-amber-400/15 text-amber-400'
    case 'artifact': return 'bg-secondary/15 text-secondary'
    case 'diff': return 'bg-on-surface-variant/15 text-on-surface-variant'
    default: return 'bg-surface-container-high text-muted'
  }
}
</script>
