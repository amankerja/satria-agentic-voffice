<template>
  <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-3 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <FileText class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-bold text-on-surface">Agent Deliverable Output</h3>
      </div>
      <UiBadge v-if="status" :variant="statusVariant" size="sm" class="font-mono">
        {{ status }}
      </UiBadge>
    </div>

    <!-- Summary Line -->
    <div v-if="summary" class="text-xs text-on-surface-variant leading-relaxed">
      {{ summary }}
    </div>

    <!-- Output Content -->
    <div
      v-if="output && output.trim().length > 0"
      class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-xs max-h-80 overflow-y-auto leading-relaxed text-on-surface-variant whitespace-pre-wrap scrollbar-thin"
    >{{ output }}</div>

    <div
      v-else
      class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-center text-xs text-muted font-mono"
    >
      No deliverable output produced by this run.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FileText } from '@lucide/vue'
import UiBadge from '../ui/UiBadge.vue'

const props = defineProps<{
  output?: string
  summary?: string
  status?: 'success' | 'failure' | 'partial'
}>()

const statusVariant = computed(() => {
  switch (props.status) {
    case 'success': return 'success'
    case 'failure': return 'error'
    case 'partial': return 'warning'
    default: return 'neutral'
  }
})
</script>
