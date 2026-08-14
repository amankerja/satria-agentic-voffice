<template>
  <aside
    :class="[
      'fixed top-0 left-0 bottom-0 z-30 bg-surface border-r border-outline-variant transition-all duration-200 flex-col justify-between hidden md:flex',
      collapsed ? 'w-17' : 'w-62.5'
    ]"
  >
    <!-- Top Area: Brand & Workspace Switcher -->
    <div class="p-3 space-y-4">
      <!-- Brand Logo -->
      <div class="flex items-center justify-between px-2 pt-1">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <div class="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center font-bold text-on-primary text-sm shrink-0">
            S
          </div>
          <div v-if="!collapsed" class="flex flex-col">
            <span class="font-bold text-on-surface tracking-wide text-sm">SATRIA</span>
            <span class="text-[9px] font-mono text-primary tracking-wider uppercase -mt-0.5">AI WORKFORCE</span>
          </div>
        </div>
        <button
          @click="toggleCollapse"
          aria-label="Toggle sidebar collapse state"
          class="text-muted hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low transition"
          title="Toggle Sidebar"
        >
          <PanelLeftClose v-if="!collapsed" class="w-4 h-4" />
          <PanelLeft v-else class="w-4 h-4" />
        </button>
      </div>

      <!-- Workspace Switcher -->
      <div v-if="!collapsed">
        <WorkspaceSwitcher />
      </div>

      <!-- Navigation Menu -->
      <nav class="space-y-6 pt-2">
        <div v-for="section in menuSections" :key="section.title" class="space-y-1">
          <div v-if="!collapsed" class="px-2 text-[10px] font-mono text-muted uppercase tracking-wider">
            {{ section.title }}
          </div>
          <div class="space-y-0.5">
            <router-link
              v-for="item in section.items"
              :key="item.path"
              :to="item.path"
              :aria-label="item.label"
              :class="[
                'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition group relative',
                isActive(item.path)
                  ? 'bg-surface-container text-primary border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              ]"
            >
              <div class="flex items-center gap-3 truncate">
                <component :is="item.icon" class="w-4 h-4 shrink-0" />
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </div>

              <!-- Unread Badge if notifications -->
              <span
                v-if="item.path === '/notifications' && notificationStore.unreadCount > 0 && !collapsed"
                class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-tertiary-container text-on-tertiary"
              >
                {{ notificationStore.unreadCount }}
              </span>

              <!-- Tooltip if collapsed -->
              <div
                v-if="collapsed"
                class="absolute left-full ml-2 px-2 py-1 bg-surface-container-low border border-outline text-on-surface text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 flex items-center gap-1.5"
              >
                <span>{{ item.label }}</span>
                <span
                  v-if="item.path === '/notifications' && notificationStore.unreadCount > 0"
                  class="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-tertiary-container text-on-tertiary"
                >
                  {{ notificationStore.unreadCount }}
                </span>
              </div>
            </router-link>
          </div>
        </div>
      </nav>
    </div>

    <!-- Bottom Profile Footer -->
    <router-link to="/settings" aria-label="View user profile and settings" class="p-3 border-t border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition block">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-full bg-primary-container/20 border border-primary-container flex items-center justify-center text-xs font-bold text-primary shrink-0">
          SU
        </div>
        <div v-if="!collapsed" class="truncate flex-1">
          <div class="text-xs font-semibold text-on-surface truncate">Satria Utama</div>
          <div class="text-[10px] text-primary flex items-center gap-1 font-mono">
            <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span>Online</span>
          </div>
        </div>
      </div>
    </router-link>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Folder,
  FolderOpen,
  Calendar,
  Activity,
  BarChart3,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Palette,
  Users,
  Building2,
  UserCheck,
  Sparkles,
  Wrench,
  PlayCircle,
  ClipboardCheck
} from '@lucide/vue'
import WorkspaceSwitcher from './WorkspaceSwitcher.vue'
import { useNotificationStore } from '../../stores/notification'
import { useAgentRunStore } from '../../stores/agentRun'
import { useReviewStore } from '../../stores/review'

const route = useRoute()
const notificationStore = useNotificationStore()
const agentRunStore = useAgentRunStore()
const reviewStore = useReviewStore()
const collapsed = ref(false)

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
  localStorage.setItem('satria_sidebar_collapsed', String(collapsed.value))
}

onMounted(() => {
  const saved = localStorage.getItem('satria_sidebar_collapsed')
  if (saved !== null) {
    collapsed.value = saved === 'true'
  }
  agentRunStore.fetchRuns()
  reviewStore.fetchReviews()
})

const isActive = (path: string) => {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path === path) return true
  if (path === '/workforce' && route.path === '/workforce') return true
  if (path !== '/' && path !== '/workforce' && route.path.startsWith(path)) return true
  return false
}

const menuSections = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Home Overview', path: '/', icon: LayoutDashboard },
      { label: 'Design Tokens', path: '/design-system', icon: Palette }
    ]
  },
  {
    title: 'WORKFORCE',
    items: [
      { label: 'Workforce Hub', path: '/workforce', icon: Users },
      { label: 'Employees', path: '/workforce/employees', icon: UserCheck },
      { label: 'Departments', path: '/workforce/departments', icon: Building2 },
      { label: 'Skill Registry', path: '/workforce/skills', icon: Sparkles },
      { label: 'Tool Registry', path: '/workforce/tools', icon: Wrench }
    ]
  },
  {
    title: 'EXECUTION & RUNTIME',
    items: [
      { label: 'Agent Runs', path: '/runs', icon: PlayCircle },
      { label: 'Task Reviews', path: '/reviews', icon: ClipboardCheck }
    ]
  },
  {
    title: 'WORK',
    items: [
      { label: 'Workspace', path: '/workspace', icon: Briefcase },
      { label: 'Tasks', path: '/tasks', icon: CheckSquare },
      { label: 'Projects', path: '/projects', icon: Folder },
      { label: 'Files', path: '/files', icon: FolderOpen },
      { label: 'Calendar', path: '/calendar', icon: Calendar }
    ]
  },
  {
    title: 'INSIGHTS & SYSTEM',
    items: [
      { label: 'Activity', path: '/activity', icon: Activity },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
      { label: 'Notifications', path: '/notifications', icon: Bell },
      { label: 'Settings', path: '/settings', icon: Settings }
    ]
  }
]
</script>
