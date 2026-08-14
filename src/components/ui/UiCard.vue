<template>
  <div
    :class="[
      'bg-[#161d19] border border-[#242c27] rounded-xl transition-all duration-150',
      hoverable ? 'hover:border-[#3c4a42] hover:bg-[#1a211d] cursor-pointer' : '',
      paddingClasses[padding]
    ]"
  >
    <div v-if="$slots.header" class="mb-3 pb-3 border-b border-[#242c27] flex items-center justify-between">
      <slot name="header" />
    </div>
    <slot />
    <div v-if="$slots.footer" class="mt-4 pt-3 border-t border-[#242c27]">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
type Padding = 'none' | 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    hoverable?: boolean
    padding?: Padding
  }>(),
  {
    hoverable: false,
    padding: 'md'
  }
)

const paddingClasses: Record<Padding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6'
}
</script>
