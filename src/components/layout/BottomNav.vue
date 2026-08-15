<template>
  <div>
    <!-- Sticky Mobile Bottom Bar -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-lg border-t border-outline-variant px-2 py-1 flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      <!-- Home -->
      <router-link
        to="/"
        aria-label="Home Overview"
        :class="[
          'flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition',
          isActive('/') ? 'text-primary font-semibold' : 'text-muted hover:text-on-surface'
        ]"
      >
        <LayoutDashboard class="w-5 h-5" />
        <span>Home</span>
      </router-link>

      <!-- Active Work -->
      <router-link
        to="/work"
        aria-label="Active Work"
        :class="[
          'flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition relative',
          isActive('/work') ? 'text-primary font-semibold' : 'text-muted hover:text-on-surface'
        ]"
      >
        <div class="relative">
          <Zap class="w-5 h-5" />
          <span
            v-if="agentRunStore.activeRuns.length > 0"
            class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary ring-2 ring-surface animate-pulse"
          ></span>
        </div>
        <span>Active Work</span>
      </router-link>

      <!-- Tasks -->
      <router-link
        to="/tasks"
        aria-label="Tasks"
        :class="[
          'flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition',
          isActive('/tasks') ? 'text-primary font-semibold' : 'text-muted hover:text-on-surface'
        ]"
      >
        <CheckSquare class="w-5 h-5" />
        <span>Tasks</span>
      </router-link>

      <!-- Projects -->
      <router-link
        to="/projects"
        aria-label="Projects"
        :class="[
          'flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition',
          isActive('/projects') ? 'text-primary font-semibold' : 'text-muted hover:text-on-surface'
        ]"
      >
        <Folder class="w-5 h-5" />
        <span>Projects</span>
      </router-link>

      <!-- More Trigger (Full Navigation Bottom Sheet) -->
      <button
        @click="isMoreSheetOpen = true"
        aria-label="Open full workspace navigation menu"
        :class="[
          'flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition',
          isMoreSheetOpen ? 'text-primary font-semibold' : 'text-muted hover:text-on-surface'
        ]"
      >
        <Menu class="w-5 h-5" />
        <span>More</span>
      </button>
    </nav>

    <!-- Full Mobile Navigation Bottom Sheet Drawer -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isMoreSheetOpen"
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex flex-col justify-end"
          @click.self="isMoreSheetOpen = false"
        >
          <!-- Drawer Sheet -->
          <div
            class="bg-surface-container-low border-t border-outline-variant rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 space-y-5 animate-in slide-in-from-bottom duration-200"
          >
            <!-- Handle & Header -->
            <div class="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-md bg-primary-container flex items-center justify-center font-bold text-on-primary text-xs">
                  S
                </div>
                <div>
                  <div class="text-xs font-bold text-on-surface">SATRIA AI WORKFORCE</div>
                  <div class="text-[10px] font-mono text-muted">All Workspace Sections</div>
                </div>
              </div>
              <button
                @click="isMoreSheetOpen = false"
                class="p-1 rounded-lg hover:bg-surface-container text-muted hover:text-on-surface transition"
                aria-label="Close navigation menu"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Grouped Menu Sections -->
            <div class="space-y-4">
              <div v-for="section in allMenuSections" :key="section.title" class="space-y-1.5">
                <div class="text-[10px] font-mono text-muted uppercase tracking-wider px-1">
                  {{ section.title }}
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <router-link
                    v-for="item in section.items"
                    :key="item.path"
                    :to="item.path"
                    @click="isMoreSheetOpen = false"
                    :class="[
                      'flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium transition border',
                      isActive(item.path)
                        ? 'bg-surface-container text-primary border-primary/40 font-semibold'
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container hover:text-on-surface'
                    ]"
                  >
                    <component :is="item.icon" class="w-4 h-4 shrink-0 text-primary" />
                    <span class="truncate">{{ item.label }}</span>
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Profile & Quick Settings Action -->
            <div class="pt-2 border-t border-outline-variant flex items-center justify-between">
              <router-link
                to="/settings"
                @click="isMoreSheetOpen = false"
                class="flex items-center gap-2 text-xs font-medium text-on-surface hover:text-primary transition"
              >
                <Settings class="w-4 h-4 text-muted" />
                <span>Settings & Profile</span>
              </router-link>

              <button
                @click="isMoreSheetOpen = false"
                class="text-xs font-mono text-muted hover:text-on-surface transition"
              >
                Close &times;
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Zap,
  Users,
  PlayCircle,
  ClipboardCheck,
  Menu,
  X,
  Palette,
  UserCheck,
  Building2,
  Sparkles,
  Wrench,
  Briefcase,
  CheckSquare,
  Folder,
  FolderOpen,
  Calendar,
  Activity,
  BarChart3,
  ShieldCheck,
  Bell,
  Settings
} from '@lucide/vue'
import { useAgentRunStore } from '../../stores/agentRun'

const route = useRoute()
const agentRunStore = useAgentRunStore()
const isMoreSheetOpen = ref(false)

const isActive = (path: string) => {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path === path) return true
  if (path === '/workforce' && route.path === '/workforce') return true
  if (path !== '/' && path !== '/workforce' && route.path.startsWith(path)) return true
  return false
}

const allMenuSections = [
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
      { label: 'Assignments', path: '/workforce/assignments', icon: CheckSquare },
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
    title: 'INSIGHTS & GOVERNANCE',
    items: [
      { label: 'Cost & Governance', path: '/governance', icon: ShieldCheck },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
      { label: 'Activity', path: '/activity', icon: Activity },
      { label: 'Notifications', path: '/notifications', icon: Bell },
      { label: 'Settings', path: '/settings', icon: Settings }
    ]
  }
]
</script>
