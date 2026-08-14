<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-medium rounded-full px-2.5 py-0.5 text-xs border select-none',
      variantClasses[variant]
    ]"
  >
    <component :is="icon" v-if="icon" class="w-3 h-3" />
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClasses[variant]" v-else-if="dot"></span>
    <slot />
  </span>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

withDefaults(
  defineProps<{
    variant?: Variant
    icon?: Component
    dot?: boolean
  }>(),
  {
    variant: 'neutral',
    dot: false
  }
)

const variantClasses: Record<Variant, string> = {
  success: 'bg-[#003824]/40 text-[#4edea3] border-[#10b981]/40',
  warning: 'bg-[#650911]/40 text-[#ffb3af] border-[#fc7c78]/40',
  error: 'bg-[#93000a]/40 text-[#ffb4ab] border-[#ffb4ab]/40',
  info: 'bg-[#003640]/40 text-[#4cd7f6] border-[#03b5d3]/40',
  neutral: 'bg-[#161d19] text-[#bbcabf] border-[#242c27]'
}

const dotClasses: Record<Variant, string> = {
  success: 'bg-[#4edea3]',
  warning: 'bg-[#ffb3af]',
  error: 'bg-[#ffb4ab]',
  info: 'bg-[#4cd7f6]',
  neutral: 'bg-[#86948a]'
}
</script>
