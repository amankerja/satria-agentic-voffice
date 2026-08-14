<template>
  <div class="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-5">
    <div class="w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center text-primary font-mono text-2xl font-bold">
      404
    </div>

    <div class="space-y-1.5 max-w-md">
      <h1 class="text-xl font-bold text-on-surface">Page Not Found</h1>
      <p class="text-xs text-muted leading-relaxed">
        Halaman atau rute yang Anda tuju tidak ditemukan di dalam workspace SATRIA AI Workforce.
      </p>
    </div>

    <div class="flex items-center gap-3 pt-2">
      <UiButton variant="primary" :icon="Home" @click="$router.push('/')">
        Return to Home Overview
      </UiButton>
      <UiButton variant="secondary" @click="$router.back()">
        Go Back
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Home } from '@lucide/vue'
import UiButton from '../components/ui/UiButton.vue'
</script>
