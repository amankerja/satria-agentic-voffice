<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm" @click.self="closeOnOverlay && $emit('close')">
        <div class="w-full max-w-lg bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl p-6 space-y-4 text-on-surface relative animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between border-b border-outline-variant pb-3">
            <h3 class="text-lg font-semibold text-on-surface">{{ title }}</h3>
            <button
              @click="$emit('close')"
              aria-label="Close modal dialog"
              class="text-muted hover:text-on-surface transition p-1 rounded-lg hover:bg-surface-container-high"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
          <div>
            <slot />
          </div>
          <div v-if="$slots.footer" class="border-t border-outline-variant pt-3 flex justify-end gap-2">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'

withDefaults(
  defineProps<{
    open: boolean
    title?: string
    closeOnOverlay?: boolean
  }>(),
  {
    open: false,
    title: '',
    closeOnOverlay: true
  }
)

defineEmits(['close'])
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
