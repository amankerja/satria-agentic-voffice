<template>
  <UiDrawer
    :open="open"
    :title="artifact ? `Artifact: ${artifact.name}` : 'Artifact Preview'"
    @close="$emit('close')"
  >
    <div v-if="artifact" class="space-y-5">
      <!-- Artifact Header Info Card -->
      <div class="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono text-muted uppercase">Metadata</span>
          <UiBadge variant="neutral" size="sm" class="font-mono uppercase">
            {{ artifact.type }}
          </UiBadge>
        </div>

        <div class="text-sm font-bold text-on-surface truncate">{{ artifact.name }}</div>

        <div class="flex flex-wrap items-center gap-3 text-xs text-muted font-mono">
          <span v-if="artifact.id">ID: <strong class="text-on-surface">#{{ artifact.id }}</strong></span>
          <span v-if="artifact.path" class="truncate">&bull; Path: <code class="text-secondary">{{ artifact.path }}</code></span>
          <span v-if="artifact.sizeBytes">&bull; Size: {{ formatSize(artifact.sizeBytes) }}</span>
        </div>
      </div>

      <!-- Artifact Content Display -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-on-surface flex items-center gap-1.5">
            <FileCode class="w-4 h-4 text-primary" />
            Artifact Content Preview
          </label>

          <button
            v-if="artifact.content"
            @click="copyContent"
            class="text-[10px] font-mono text-primary hover:underline flex items-center gap-1"
          >
            <Copy class="w-3 h-3" />
            {{ copied ? 'Copied!' : 'Copy Content' }}
          </button>
        </div>

        <!-- Code/Text Box -->
        <div
          v-if="artifact.content"
          class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-xs max-h-96 overflow-y-auto leading-relaxed text-on-surface-variant whitespace-pre-wrap scrollbar-thin"
        >{{ artifact.content }}</div>

        <div
          v-else
          class="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl text-center space-y-2"
        >
          <div class="text-xs text-on-surface font-semibold">Binary or External File</div>
          <p class="text-[11px] text-muted font-mono">
            Direct inline content preview is not stored for this artifact. Path: {{ artifact.path || 'N/A' }}
          </p>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="pt-4 border-t border-outline-variant flex items-center justify-end">
        <UiButton size="sm" variant="ghost" @click="$emit('close')">
          Close Preview
        </UiButton>
      </div>
    </div>
  </UiDrawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FileCode, Copy } from '@lucide/vue'
import UiDrawer from '../ui/UiDrawer.vue'
import UiBadge from '../ui/UiBadge.vue'
import UiButton from '../ui/UiButton.vue'
import type { ArtifactDisplayItem } from './ArtifactList.vue'

const props = defineProps<{
  open: boolean
  artifact: ArtifactDisplayItem | null
}>()

defineEmits<{
  (e: 'close'): void
}>()

const copied = ref<boolean>(false)

async function copyContent() {
  if (!props.artifact?.content) return
  try {
    await navigator.clipboard.writeText(props.artifact.content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback or ignore
  }
}

function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>
