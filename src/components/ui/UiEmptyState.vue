<template>
  <div class="flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#242c27] rounded-xl bg-[#09100c]/50 space-y-3">
    <div class="p-3 bg-[#161d19] rounded-full border border-[#242c27] text-[#86948a]">
      <component :is="icon || FolderOpen" class="w-8 h-8" />
    </div>
    <div class="space-y-1">
      <h4 class="text-sm font-semibold text-[#dde4dd]">{{ title }}</h4>
      <p class="text-xs text-[#bbcabf] max-w-xs">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="pt-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { FolderOpen } from '@lucide/vue'

defineProps<{
  title: string
  description?: string
  icon?: Component
}>()
</script>
