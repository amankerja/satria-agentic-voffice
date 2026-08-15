<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-disabled="disabled || loading ? 'true' : undefined"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 rounded-lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none',
      sizeClasses[size],
      variantClasses[variant]
    ]"
  >
    <component :is="icon" v-if="icon && !loading" :class="iconSizes[size]" aria-hidden="true" />
    <span v-if="loading" class="animate-spin rounded-full border-2 border-current border-t-transparent" :class="spinnerSizes[size]" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    icon?: Component
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false
  }
)

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base'
}

const iconSizes: Record<Size, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
}

const spinnerSizes: Record<Size, string> = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[#10b981] hover:bg-[#4edea3] text-[#003824] font-semibold active:scale-[0.98]',
  secondary: 'bg-[#1a211d] hover:bg-[#242c27] text-[#dde4dd] border border-[#242c27] active:scale-[0.98]',
  ghost: 'bg-transparent hover:bg-[#1a211d] text-[#bbcabf] hover:text-[#dde4dd]',
  danger: 'bg-[#93000a] hover:bg-[#ffb4ab] text-[#ffdad6] hover:text-[#690005] font-semibold active:scale-[0.98]'
}
</script>
