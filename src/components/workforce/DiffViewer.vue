<template>
  <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-3 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <GitCommit class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-bold text-on-surface">File Changes & Diffs</h3>
      </div>
      <span v-if="allDiffs.length > 0" class="text-[10px] font-mono text-muted">
        {{ allDiffs.length }} file(s) modified (+{{ totalAdditions }} / -{{ totalDeletions }})
      </span>
    </div>

    <!-- Multi-file Tabs (if multiple diffs) -->
    <div v-if="allDiffs.length > 1" role="tablist" aria-label="Modified file diffs" class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        v-for="(d, idx) in allDiffs"
        :key="idx"
        role="tab"
        :aria-selected="selectedDiffIndex === idx"
        :aria-label="`Diff for ${d.filePath}`"
        @click="selectedDiffIndex = idx"
        :class="[
          'px-2.5 py-1 rounded text-xs font-mono transition whitespace-nowrap flex items-center gap-1.5 border',
          selectedDiffIndex === idx
            ? 'bg-surface-container-high text-primary font-bold border-outline'
            : 'bg-surface-container-lowest text-muted border-outline-variant hover:text-on-surface'
        ]"
      >
        <span class="truncate max-w-40">{{ d.filePath }}</span>
        <span class="text-[10px] text-primary-container">+{{ d.additions }}</span>
        <span class="text-[10px] text-error">-{{ d.deletions }}</span>
      </button>
    </div>

    <!-- Active Diff Box -->
    <div v-if="activeDiff" role="region" :aria-label="`Diff viewer for ${activeDiff.filePath}`" class="space-y-2">
      <div class="flex items-center justify-between text-xs font-mono text-muted px-1">
        <span class="text-on-surface font-semibold truncate">{{ activeDiff.filePath }}</span>
        <span class="uppercase text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest">
          {{ activeDiff.changeType || 'modified' }}
        </span>
      </div>

      <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed scrollbar-thin">
        <div
          v-for="(line, lIdx) in parsedDiffLines"
          :key="lIdx"
          :class="[
            'px-2 py-0.5 rounded font-mono whitespace-pre',
            line.startsWith('+') && !line.startsWith('+++')
              ? 'bg-primary-container/20 text-primary font-bold'
              : line.startsWith('-') && !line.startsWith('---')
              ? 'bg-error/20 text-error'
              : line.startsWith('@@')
              ? 'bg-secondary/15 text-secondary font-bold'
              : line.startsWith('---') || line.startsWith('+++')
              ? 'text-muted font-bold'
              : 'text-on-surface-variant'
          ]"
        >
          {{ line }}
        </div>
      </div>
    </div>

    <!-- Single Raw Diff String (Fallback) -->
    <div v-else-if="rawDiffContent" class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed scrollbar-thin">
      <div
        v-for="(line, lIdx) in rawDiffLines"
        :key="lIdx"
        :class="[
          'px-2 py-0.5 rounded font-mono whitespace-pre',
          line.startsWith('+') && !line.startsWith('+++')
            ? 'bg-primary-container/20 text-primary font-bold'
            : line.startsWith('-') && !line.startsWith('---')
            ? 'bg-error/20 text-error'
            : line.startsWith('@@')
            ? 'bg-secondary/15 text-secondary font-bold'
            : 'text-on-surface-variant'
        ]"
      >
        {{ line }}
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-center text-xs text-muted font-mono"
    >
      No file diffs recorded. Read-only analysis task.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { GitCommit } from '@lucide/vue'
import type { RunResultDiff } from '../../types'

const props = defineProps<{
  diffs?: RunResultDiff[]
  rawDiffContent?: string
}>()

const selectedDiffIndex = ref<number>(0)

const allDiffs = computed(() => props.diffs || [])

const activeDiff = computed(() => {
  if (allDiffs.value.length === 0) return null
  return allDiffs.value[selectedDiffIndex.value] || allDiffs.value[0]
})

const parsedDiffLines = computed(() => {
  if (!activeDiff.value?.diffContent) return []
  return activeDiff.value.diffContent.split('\n')
})

const rawDiffLines = computed(() => {
  if (!props.rawDiffContent) return []
  return props.rawDiffContent.split('\n')
})

const totalAdditions = computed(() =>
  allDiffs.value.reduce((sum, d) => sum + (d.additions || 0), 0)
)

const totalDeletions = computed(() =>
  allDiffs.value.reduce((sum, d) => sum + (d.deletions || 0), 0)
)
</script>
