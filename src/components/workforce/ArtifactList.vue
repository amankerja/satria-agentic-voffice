<template>
  <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-3 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Package class="w-4 h-4 text-primary" />
        <h3 class="text-sm font-bold text-on-surface">Generated Artifacts</h3>
      </div>
      <span class="text-[10px] font-mono text-muted">
        {{ normalizedArtifacts.length }} artifact(s)
      </span>
    </div>

    <!-- Artifacts Grid / List -->
    <div v-if="normalizedArtifacts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <div
        v-for="art in normalizedArtifacts"
        :key="art.id"
        class="p-3 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant hover:border-outline rounded-lg transition flex items-center justify-between gap-3 group"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="p-2 rounded bg-surface-container-high text-primary shrink-0">
            <component :is="getArtifactIcon(art.type)" class="w-4 h-4" />
          </div>

          <div class="min-w-0">
            <div class="text-xs font-bold text-on-surface truncate group-hover:text-primary transition" :title="art.name">
              {{ art.name }}
            </div>
            <div class="flex items-center gap-2 text-[10px] font-mono text-muted truncate">
              <span class="uppercase font-semibold text-secondary">{{ art.type }}</span>
              <span v-if="art.sizeBytes">&bull; {{ formatSize(art.sizeBytes) }}</span>
              <span v-else-if="art.path" class="truncate">&bull; {{ art.path }}</span>
            </div>
          </div>
        </div>

        <button
          @click="$emit('preview', art)"
          aria-label="Preview artifact"
          class="p-1.5 rounded-lg bg-surface-container border border-outline-variant hover:border-primary text-muted hover:text-primary transition shrink-0"
          title="Preview Artifact"
        >
          <Eye class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-center text-xs text-muted font-mono"
    >
      No file artifacts generated for this execution.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Package, FileText, FileCode, FileSpreadsheet, Eye, File } from '@lucide/vue'
import type { CollectedArtifact } from '../../runtime/results/ArtifactCollector'

export interface ArtifactDisplayItem {
  id: string
  name: string
  type: string
  path?: string
  content?: string
  sizeBytes?: number
}

const props = defineProps<{
  artifacts?: (CollectedArtifact | ArtifactDisplayItem)[]
  artifactIds?: string[]
}>()

defineEmits<{
  (e: 'preview', artifact: ArtifactDisplayItem): void
}>()

const normalizedArtifacts = computed<ArtifactDisplayItem[]>(() => {
  if (props.artifacts && props.artifacts.length > 0) {
    return props.artifacts.map((a) => ({
      id: a.id,
      name: a.name || a.id,
      type: a.type || 'file',
      path: a.path,
      content: a.content,
      sizeBytes: a.sizeBytes
    }))
  }

  if (props.artifactIds && props.artifactIds.length > 0) {
    return props.artifactIds.map((id) => ({
      id,
      name: id.replace(/^art-[^-]+-/, ''),
      type: id.includes('patch') || id.includes('diff') ? 'patch' : 'file',
      path: id
    }))
  }

  return []
})

function getArtifactIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'code':
    case 'patch':
      return FileCode
    case 'document':
    case 'report':
      return FileText
    case 'data':
    case 'schema':
      return FileSpreadsheet
    default:
      return File
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
