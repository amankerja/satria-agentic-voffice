<template>
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border bg-[#1a211d] shadow-2xl text-sm transition-all duration-200 animate-bounce-short"
    :class="borderClasses[variant]"
  >
    <component :is="icons[variant]" class="w-5 h-5" :class="iconClasses[variant]" />
    <div class="flex flex-col">
      <span class="font-medium text-[#dde4dd]">{{ message }}</span>
      <span v-if="description" class="text-xs text-[#bbcabf]">{{ description }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, AlertTriangle, XCircle, Info } from '@lucide/vue'

type Variant = 'success' | 'warning' | 'error' | 'info'

withDefaults(
  defineProps<{
    message: string
    description?: string
    variant?: Variant
  }>(),
  {
    variant: 'success'
  }
)

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info
}

const borderClasses: Record<Variant, string> = {
  success: 'border-[#10b981]',
  warning: 'border-[#fc7c78]',
  error: 'border-[#ffb4ab]',
  info: 'border-[#03b5d3]'
}

const iconClasses: Record<Variant, string> = {
  success: 'text-[#4edea3]',
  warning: 'text-[#ffb3af]',
  error: 'text-[#ffb4ab]',
  info: 'text-[#4cd7f6]'
}
</script>
