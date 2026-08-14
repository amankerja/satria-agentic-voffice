<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" :for="computedId" class="text-xs font-medium text-on-surface-variant">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>
    <div class="relative flex items-center">
      <component :is="icon" v-if="icon" class="absolute left-3 w-4 h-4 text-muted" />
      <input
        :id="computedId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="label || placeholder || 'Input field'"
        :aria-invalid="!!error"
        :class="[
          'w-full bg-surface-container-lowest text-on-surface placeholder-muted border rounded-lg text-sm transition-all outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          icon ? 'pl-9 pr-3' : 'px-3',
          error ? 'border-error' : 'border-outline-variant',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          sizeClasses[size]
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <span v-if="error" class="text-xs text-error">{{ error }}</span>
    <span v-else-if="hint" class="text-xs text-muted">{{ hint }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    id?: string
    type?: string
    label?: string
    placeholder?: string
    hint?: string
    error?: string
    disabled?: boolean
    required?: boolean
    size?: Size
    icon?: Component
  }>(),
  {
    modelValue: '',
    type: 'text',
    disabled: false,
    required: false,
    size: 'md'
  }
)

defineEmits(['update:modelValue'])

const computedId = computed(() => {
  return props.id || `input-${Math.random().toString(36).substr(2, 6)}`
})

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base'
}
</script>
