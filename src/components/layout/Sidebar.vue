<template>
  <aside
    :class="[
      'fixed top-0 left-0 bottom-0 z-30 bg-surface border-r border-outline-variant transition-all duration-200 flex flex-col justify-between hidden md:flex',
      collapsed ? 'w-17' : 'w-62.5'
    ]"
  >
    <!-- Top Area: Brand & Workspace Switcher -->
    <div class="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
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
      <nav class="space-y-4 pt-1">
        <!-- Main Core Menu -->
        <div class="space-y-0.5">
          <router-link
            v-for="item in primaryMenu"
            :key="item.path"
            :to="item.path"
            :aria-label="item.label"
            :class="[
              'flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition group relative',
              isActive(item.path)
                ? 'bg-surface-container text-primary border-l-2 border-primary font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
            ]"
          >
            <div class="flex items-center gap-3 truncate">
              <component :is="item.icon" class="w-4 h-4 shrink-0" />
              <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
            </div>

            <!-- Active Runs or Unread Badge -->
            <span
              v-if="item.path === '/work' && agentRunStore.activeRuns.length > 0 && !collapsed"
              class="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-primary/20 text-primary animate-pulse"
            >
              {{ agentRunStore.activeRuns.length }}
            </span>

            <!-- Tooltip if collapsed -->
            <div
              v-if="collapsed"
              class="absolute left-full ml-2 px-2 py-1 bg-surface-container-low border border-outline text-on-surface text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50 flex items-center gap-1.5"
            >
              <span>{{ item.label }}</span>
              <span
                v-if="item.path === '/work' && agentRunStore.activeRuns.length > 0"
                class="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-primary/20 text-primary"
              >
                {{ agentRunStore.activeRuns.length }}
              </span>
            </div>
          </router-link>
        </div>

        <!-- Collapsible Advanced Section -->
        <div class="pt-2 border-t border-outline-variant/60">
          <button
            v-if="!collapsed"
            @click="showAdvanced = !showAdvanced"
            class="w-full flex items-center justify-between px-2 py-1 text-[10px] font-mono text-muted uppercase tracking-wider hover:text-on-surface transition"
          >
            <span>ADVANCED & RUNTIME</span>
            <ChevronDown :class="['w-3.5 h-3.5 transition-transform duration-200', showAdvanced ? 'rotate-180' : '']" />
          </button>

          <div v-if="showAdvanced || collapsed" class="space-y-0.5 mt-1">
            <router-link
              v-for="item in advancedMenu"
              :key="item.path"
              :to="item.path"
              :aria-label="item.label"
              :class="[
                'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition group relative',
                isActive(item.path)
                  ? 'bg-surface-container text-primary border-l-2 border-primary'
                  : 'text-muted hover:bg-surface-container-low hover:text-on-surface'
              ]"
            >
              <div class="flex items-center gap-3 truncate">
                <component :is="item.icon" class="w-3.5 h-3.5 shrink-0" />
                <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
              </div>

              <!-- Tooltip if collapsed -->
              <div
                v-if="collapsed"
                class="absolute left-full ml-2 px-2 py-1 bg-surface-container-low border border-outline text-on-surface text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50"
              >
                <span>{{ item.label }}</span>
              </div>
            </router-link>
          </div>
        </div>
      </nav>
    </div>

    <!-- Bottom Profile & Status Footer -->
    <router-link to="/settings" aria-label="View user profile and settings" class="p-3 border-t border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition block shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-full bg-primary-container/20 border border-primary-container flex items-center justify-center text-xs font-bold text-primary shrink-0">
          SU
        </div>
        <div v-if="!collapsed" class="truncate flex-1">
          <div class="text-xs font-semibold text-on-surface truncate">Satria Utama</div>
          <div class="text-[10px] text-primary flex items-center gap-1 font-mono">
            <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span>Hermes Active</span>
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
  Zap,
  CheckSquare,
  Folder,
  Share2,
  Boxes,
  Users,
  BarChart3,
  Activity,
  Calendar,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Terminal,
  Clock,
  FolderOpen,
  ClipboardCheck,
  ShieldCheck,
  Sparkles,
  Wrench,
  Palette
} from '@lucide/vue'
import WorkspaceSwitcher from './WorkspaceSwitcher.vue'
import { useAgentRunStore } from '../../stores/agentRun'
import { useReviewStore } from '../../stores/review'

const route = useRoute()
const agentRunStore = useAgentRunStore()
const reviewStore = useReviewStore()
const collapsed = ref(false)
const showAdvanced = ref(false)

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
  if (path === '/work' && route.path === '/work') return true
  if (path === '/workforce/employees' && route.path.startsWith('/workforce/employees')) return true
  if (path !== '/' && path !== '/work' && path !== '/workforce/employees' && route.path.startsWith(path)) return true
  return false
}

const primaryMenu = [
  { label: 'Home', path: '/', icon: LayoutDashboard },
  { label: 'Active Work', path: '/work', icon: Zap },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Projects', path: '/projects', icon: Folder },
  { label: 'Content Hub', path: '/content', icon: Share2 },
  { label: 'Integrations', path: '/integrations', icon: Boxes },
  { label: 'Workers', path: '/workforce/employees', icon: Users },
  { label: 'Calendar', path: '/calendar', icon: Calendar },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings }
]

const advancedMenu = [
  { label: 'Agent Runs', path: '/runs', icon: Terminal },
  { label: 'Schedules', path: '/schedules', icon: Clock },
  { label: 'Files', path: '/files', icon: FolderOpen },
  { label: 'Reviews & Quality', path: '/reviews', icon: ClipboardCheck },
  { label: 'Cost & Governance', path: '/governance', icon: ShieldCheck },
  { label: 'Activity Log', path: '/activity', icon: Activity },
  { label: 'Skill Registry', path: '/workforce/skills', icon: Sparkles },
  { label: 'Tool Registry', path: '/workforce/tools', icon: Wrench },
  { label: 'Design Tokens', path: '/design-system', icon: Palette }
]
</script>

