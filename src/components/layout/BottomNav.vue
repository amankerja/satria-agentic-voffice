<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-outline-variant px-2 py-1.5 flex items-center justify-around" aria-label="Mobile Navigation">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      :aria-label="item.label"
      :class="[
        'flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition',
        isActive(item.path) ? 'text-primary font-semibold' : 'text-muted hover:text-on-surface'
      ]"
    >
      <component :is="item.icon" class="w-5 h-5" />
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { LayoutDashboard, Users, CheckSquare, Activity, MoreHorizontal } from '@lucide/vue'

const route = useRoute()

const isActive = (path: string) => {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}

const navItems = [
  { label: 'Home', path: '/', icon: LayoutDashboard },
  { label: 'Workforce', path: '/workforce', icon: Users },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Activity', path: '/activity', icon: Activity },
  { label: 'More', path: '/settings', icon: MoreHorizontal }
]
</script>
