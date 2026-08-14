<template>
  <div class="w-full space-y-1">
    <div v-if="showValue || label" class="flex justify-between items-center text-xs">
      <span class="text-[#bbcabf] font-medium">{{ label }}</span>
      <span class="text-[#dde4dd] font-mono font-medium">{{ value }}%</span>
    </div>
    <div class="w-full bg-[#09100c] h-2 rounded-full overflow-hidden border border-[#242c27]">
      <div
        class="h-full bg-[#4edea3] transition-all duration-300 rounded-full"
        :style="{ width: `${Math.min(100, Math.max(0, value))}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number
    label?: string
    showValue?: boolean
  }>(),
  {
    value: 0,
    showValue: true
  }
)
</script>
