<template>
  <header class="h-16 border-b border-outline-variant bg-surface/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
    <!-- Left: Breadcrumb & Title -->
    <div class="flex items-center gap-3">
      <div class="text-xs text-muted font-medium hidden sm:flex items-center gap-1.5">
        <span>SATRIA</span>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-on-surface font-semibold capitalize">{{ currentPathTitle }}</span>
      </div>
    </div>

    <!-- Center: Global Search Bar Trigger -->
    <button
      @click="$emit('openSearch')"
      aria-label="Open search command palette (Ctrl+K)"
      class="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant text-muted text-xs px-3 py-1.5 rounded-lg w-48 sm:w-80 transition justify-between"
    >
      <div class="flex items-center gap-2 truncate">
        <Search class="w-3.5 h-3.5 text-primary" />
        <span class="truncate">Search workspace...</span>
      </div>
      <kbd class="hidden sm:inline-block font-mono text-[10px] bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded border border-outline">
        Ctrl + K
      </kbd>
    </button>

    <!-- Right: Gateway Health, Connection Status & Actions -->
    <div class="flex items-center gap-2.5 sm:gap-3">
      <!-- PWA Install Action Button if available -->
      <button
        v-if="canInstall"
        @click="promptInstall"
        aria-label="Install SATRIA AI Workforce as standalone application"
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container border border-primary/40 text-[11px] font-mono text-primary transition"
        title="Install SATRIA as standalone PWA app"
      >
        <Download class="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      <!-- Persistent Hermes Runtime Gateway Health Indicator -->
      <button
        @click="hermesHealth.checkHealth"
        :title="gatewayTooltip"
        role="status"
        aria-live="polite"
        :class="[
          'hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition cursor-pointer hover:bg-surface-container',
          hermesHealth.status.value === 'healthy'
            ? 'bg-primary/5 border-primary/30 text-primary'
            : hermesHealth.status.value === 'degraded'
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
            : hermesHealth.status.value === 'mock'
            ? 'bg-secondary/5 border-secondary/30 text-secondary'
            : 'bg-error/10 border-error/40 text-error'
        ]"
      >
        <span
          :class="[
            'w-2 h-2 rounded-full',
            hermesHealth.status.value === 'healthy'
              ? 'bg-primary'
              : hermesHealth.status.value === 'degraded'
              ? 'bg-amber-400'
              : hermesHealth.status.value === 'mock'
              ? 'bg-secondary'
              : 'bg-error'
          ]"
        ></span>
        <span class="truncate max-w-32.5 sm:max-w-none">{{ gatewayLabel }}</span>
      </button>

      <!-- Browser Connection Status Indicator -->
      <div
        role="status"
        aria-live="polite"
        :class="[
          'hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition',
          isOnline
            ? 'bg-surface-container-low border-outline-variant text-on-surface-variant'
            : 'bg-[#241a09] border-[#f59e0b]/40 text-[#f59e0b]'
        ]"
      >
        <span
          :class="[
            'w-1.5 h-1.5 rounded-full',
            isOnline ? 'bg-primary' : 'bg-[#f59e0b]'
          ]"
        ></span>
        <span>{{ isOnline ? 'Web Online' : 'Offline' }}</span>
      </div>

      <!-- Quick New Button -->
      <UiButton
        size="sm"
        variant="primary"
        :icon="Plus"
        aria-label="Create new task or project"
        @click="$emit('openQuickCreate')"
      >
        <span class="hidden sm:inline">New</span>
      </UiButton>

      <!-- Notifications Icon -->
      <router-link
        to="/notifications"
        aria-label="View notifications"
        class="relative text-muted hover:text-on-surface p-2 rounded-lg hover:bg-surface-container-low transition"
        title="Notifications"
      >
        <Bell class="w-4 h-4" />
        <span
          v-if="notificationStore.unreadCount > 0"
          class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container ring-2 ring-surface"
        ></span>
      </router-link>

      <!-- User Profile -->
      <router-link
        to="/settings"
        aria-label="View user profile and system settings"
        class="w-8 h-8 rounded-full bg-primary-container/20 border border-primary-container flex items-center justify-center font-bold text-xs text-primary hover:scale-105 transition"
        title="Settings & Profile"
      >
        SU
      </router-link>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Bell, ChevronRight, Plus, Download } from '@lucide/vue'
import UiButton from '../ui/UiButton.vue'
import { useNotificationStore } from '../../stores/notification'
import { useNetwork } from '../../composables/useNetwork'
import { usePwaInstall } from '../../composables/usePwaInstall'
import { useHermesHealth } from '../../composables/useHermesHealth'

defineEmits(['openSearch', 'openQuickCreate'])

const route = useRoute()
const notificationStore = useNotificationStore()
const { isOnline } = useNetwork()
const { canInstall, promptInstall } = usePwaInstall()
const hermesHealth = useHermesHealth()

onMounted(() => {
  hermesHealth.startPolling(30000)
})

onUnmounted(() => {
  hermesHealth.stopPolling()
})

const currentPathTitle = computed(() => {
  const path = route.path
  if (path === '/') return 'Overview'
  const segment = path.split('/')[1] || 'Dashboard'
  return segment.replace('-', ' ')
})

const gatewayLabel = computed(() => {
  if (hermesHealth.status.value === 'mock') {
    return 'Runtime: Mock'
  }
  if (hermesHealth.status.value === 'healthy') {
    return `Hermes: ${hermesHealth.latencyMs.value}ms`
  }
  if (hermesHealth.status.value === 'degraded') {
    return `Hermes: Degraded (${hermesHealth.latencyMs.value}ms)`
  }
  if (hermesHealth.status.value === 'checking') {
    return 'Hermes: Checking...'
  }
  return 'Hermes: Offline'
})

const gatewayTooltip = computed(() => {
  if (hermesHealth.status.value === 'mock') {
    return 'Local simulation runner mode active. Click to probe runtime.'
  }
  if (hermesHealth.status.value === 'healthy') {
    return `Hermes Gateway v${hermesHealth.gatewayVersion.value} connected (${hermesHealth.latencyMs.value}ms latency). Click to probe.`
  }
  if (hermesHealth.status.value === 'offline') {
    return `Hermes Gateway disconnected: ${hermesHealth.errorMessage.value || 'Check backend status'}. Click to probe.`
  }
  return 'Click to test Hermes gateway connectivity'
})
</script>
