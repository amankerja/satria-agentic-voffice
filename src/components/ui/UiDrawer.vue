<template>
  <Teleport to="body">
    <Transition name="slide">
      <div v-if="open" class="fixed inset-0 z-50 flex justify-end bg-surface-container-lowest/80 backdrop-blur-sm" @click.self="$emit('close')">
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="title || 'Workspace Drawer'"
          :class="[
            'w-full h-full bg-surface-container-low border-l border-outline-variant p-6 flex flex-col justify-between shadow-2xl text-on-surface',
            size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-xl' : size === 'xl' ? 'max-w-2xl' : 'max-w-md'
          ]"
        >
          <div class="space-y-4 overflow-y-auto">
            <div class="flex items-start justify-between border-b border-outline-variant pb-3 gap-2">
              <div>
                <h3 class="text-lg font-semibold text-on-surface">{{ title }}</h3>
                <p v-if="description" class="text-xs text-muted mt-0.5">{{ description }}</p>
              </div>
              <button
                @click="$emit('close')"
                aria-label="Close drawer"
                class="text-muted hover:text-on-surface transition p-1 rounded-lg hover:bg-surface-container-high shrink-0"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
            <div>
              <slot />
            </div>
          </div>
          <div v-if="$slots.footer" class="border-t border-outline-variant pt-4 flex justify-end gap-2">
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
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    open: false,
    title: '',
    description: '',
    size: 'md'
  }
)

defineEmits(['close'])
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
