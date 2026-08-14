<template>
  <div
    class="animate-pulse bg-[#242c27] rounded-lg"
    :class="[width, height]"
  ></div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
  }>(),
  {
    width: 'w-full',
    height: 'h-4'
  }
)
</script>
