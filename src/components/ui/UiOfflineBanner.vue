<template>
  <Transition name="fade">
    <div
      v-if="!isOnline && !isOfflineWarningDismissed"
      class="bg-[#241a09] border-b border-[#f59e0b]/30 px-4 py-2 text-xs text-[#fef3c7] flex items-center justify-between shadow-lg sticky top-0 z-30 font-mono"
    >
      <div class="flex items-center gap-2.5">
        <WifiOff class="w-4 h-4 text-[#f59e0b] shrink-0 animate-pulse" />
        <div>
          <span class="font-bold text-[#f59e0b]">You're offline.</span>
          <span class="text-[#fef3c7]/80 ml-1 hidden sm:inline">Showing the latest saved workspace. Changes are preserved locally.</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-[10px] px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 uppercase font-bold">
          Local Storage
        </span>
        <button
          @click="dismissWarning"
          class="p-1 hover:bg-[#f59e0b]/20 rounded text-[#fef3c7] transition"
          aria-label="Dismiss offline banner"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { WifiOff, X } from '@lucide/vue'
import { useNetwork } from '../../composables/useNetwork'

const { isOnline, isOfflineWarningDismissed, dismissWarning } = useNetwork()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
