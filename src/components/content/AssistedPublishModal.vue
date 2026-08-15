<template>
  <div
    v-if="isOpen && payload"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-lg rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-2xl overflow-hidden">
      <div class="flex items-center justify-between border-b border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <div class="flex items-center gap-2">
          <span class="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">Assisted Mode</span>
          <h3 class="text-sm font-bold text-surface-on">Publikasi Komunitas / Grup</h3>
        </div>
        <button @click="$emit('close')" class="text-surface-muted hover:text-surface-on">
          ✕
        </button>
      </div>

      <div class="p-6 space-y-4 text-xs">
        <p class="text-surface-on-variant leading-relaxed">
          Untuk menjaga keamanan akun komunitas dan mematuhi kebijakan anti-bot Meta, publikasi ke <strong>{{ payload.targetName }}</strong> menggunakan mode pendampingan (Assisted).
        </p>

        <!-- Copy Box -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-bold text-surface-muted uppercase text-[10px]">Teks Siap Salin</span>
            <button
              @click="copyToClipboard"
              class="text-primary hover:underline font-bold flex items-center gap-1"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{{ isCopied ? 'Tersalin!' : 'Salin Teks' }}</span>
            </button>
          </div>
          <div class="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 max-h-48 overflow-y-auto whitespace-pre-line text-surface-on font-mono leading-relaxed">
            {{ payload.copyText }}
          </div>
        </div>

        <!-- Target Link -->
        <div class="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between gap-3">
          <div>
            <p class="font-bold text-surface-on">{{ payload.targetName }}</p>
            <p class="text-surface-muted text-[11px] truncate max-w-xs">{{ payload.targetUrl }}</p>
          </div>
          <a
            :href="payload.targetUrl"
            target="_blank"
            class="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 flex items-center gap-1 shrink-0"
          >
            <span>Buka Grup</span>
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <button @click="$emit('close')" class="text-xs text-surface-muted hover:text-surface-on">
          Tutup
        </button>
        <button
          @click="$emit('mark-done')"
          class="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-surface-container-lowest hover:bg-emerald-400"
        >
          ✓ Tandai Sudah Diposting
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  payload?: {
    copyText: string
    mediaUrls: string[]
    targetUrl: string
    targetName: string
  } | null
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'mark-done'): void
}>()

const isCopied = ref(false)

async function copyToClipboard() {
  if (!props.payload?.copyText) return
  await navigator.clipboard.writeText(props.payload.copyText)
  isCopied.value = true
  setTimeout(() => (isCopied.value = false), 2500)
}
</script>
