<template>
  <div
    role="alert"
    aria-live="assertive"
    class="flex flex-col items-center justify-center p-8 text-center bg-surface-container-low border border-error-container/40 rounded-xl space-y-3"
  >
    <div class="w-12 h-12 rounded-full bg-error-container/20 border border-error/30 flex items-center justify-center text-error">
      <AlertOctagon class="w-6 h-6" />
    </div>
    <div class="space-y-1 max-w-sm">
      <h3 class="text-sm font-semibold text-on-surface">{{ title }}</h3>
      <p class="text-xs text-on-surface-variant">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="pt-2">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertOctagon } from '@lucide/vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: 'An error occurred',
    description: 'Tidak dapat memuat data. Periksa koneksi jaringan atau coba beberapa saat lagi.'
  }
)
</script>
