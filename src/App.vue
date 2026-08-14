<template>
  <AppShell v-if="!isStandalonePage">
    <router-view />
  </AppShell>
  <router-view v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from './layouts/AppShell.vue'

const route = useRoute()

const isStandalonePage = computed(() => {
  return route.path === '/login' || route.path === '/onboarding'
})
</script>
