<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-surface-container-lowest/80 backdrop-blur-sm" @click.self="$emit('close')">
        <div class="w-full max-w-xl bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden text-on-surface animate-in fade-in zoom-in-95 duration-150">
          <!-- Search Header Input -->
          <div class="flex items-center px-4 border-b border-outline-variant">
            <Search class="w-4 h-4 text-primary mr-3 shrink-0" />
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              aria-label="Search workspace, employees, departments, tasks"
              placeholder="Search workspace, employees, departments, tasks..."
              class="w-full bg-transparent h-14 text-sm text-on-surface placeholder-muted outline-none"
              @keydown.esc="$emit('close')"
            />
            <span class="text-[10px] font-mono bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded border border-outline">ESC</span>
          </div>

          <!-- Results List -->
          <div class="max-h-96 overflow-y-auto p-2 space-y-1">
            <div class="px-3 py-1.5 text-[10px] font-mono text-muted uppercase tracking-wider">Navigation & Quick Actions</div>
            <button
              v-for="item in filteredNavigation"
              :key="item.path"
              @click="navigate(item.path)"
              class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container text-xs transition text-left group"
            >
              <div class="flex items-center gap-2.5">
                <component :is="item.icon" class="w-4 h-4 text-primary" />
                <span class="font-medium text-on-surface">{{ item.label }}</span>
              </div>
              <span class="text-[10px] text-muted font-mono group-hover:text-primary">Jump &rarr;</span>
            </button>

            <div class="pt-2 px-3 py-1.5 text-[10px] font-mono text-muted uppercase tracking-wider">Matching Employees, Tasks & Projects</div>
            <div v-if="filteredItems.length === 0" class="p-4 text-center text-xs text-muted">
              Tidak ditemukan hasil untuk "{{ query }}"
            </div>
            <button
              v-for="res in filteredItems"
              :key="res.id"
              @click="selectResult(res)"
              class="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container text-xs transition text-left group"
            >
              <div class="flex items-center gap-2.5 truncate">
                <component :is="res.icon" class="w-4 h-4 text-secondary" />
                <span class="font-medium text-on-surface truncate">{{ res.title }}</span>
              </div>
              <span class="text-[10px] font-mono text-muted bg-surface-container-high px-2 py-0.5 rounded">{{ res.type }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  Folder,
  Calendar,
  Activity,
  BarChart3,
  Settings,
  Users,
  Building2,
  Sparkles,
  UserCheck,
  Wrench,
  PlayCircle,
  ClipboardCheck
} from '@lucide/vue'
import { useTaskStore } from '../../stores/task'
import { useProjectStore } from '../../stores/project'
import { useEmployeeStore } from '../../stores/employee'
import { useAgentRunStore } from '../../stores/agentRun'
import { useReviewStore } from '../../stores/review'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['close'])

const router = useRouter()
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const employeeStore = useEmployeeStore()
const agentRunStore = useAgentRunStore()
const reviewStore = useReviewStore()

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)

watch(() => props.open, (val) => {
  if (val) {
    query.value = ''
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
})

const navigationItems = [
  { label: 'Go to Home Overview', path: '/', icon: LayoutDashboard },
  { label: 'Go to Workforce Hub', path: '/workforce', icon: Users },
  { label: 'Go to Employee Directory', path: '/workforce/employees', icon: UserCheck },
  { label: 'Go to Departments', path: '/workforce/departments', icon: Building2 },
  { label: 'Go to Skill Registry', path: '/workforce/skills', icon: Sparkles },
  { label: 'Go to Tool Registry', path: '/workforce/tools', icon: Wrench },
  { label: 'Go to Agent Runs', path: '/runs', icon: PlayCircle },
  { label: 'Go to Task Reviews', path: '/reviews', icon: ClipboardCheck },
  { label: 'Go to Workspace', path: '/workspace', icon: Briefcase },
  { label: 'Go to Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Go to Projects', path: '/projects', icon: Folder },
  { label: 'Go to Calendar', path: '/calendar', icon: Calendar },
  { label: 'Go to Activity', path: '/activity', icon: Activity },
  { label: 'Go to Reports', path: '/reports', icon: BarChart3 },
  { label: 'Go to Settings', path: '/settings', icon: Settings }
]

const filteredNavigation = computed(() => {
  if (!query.value) return navigationItems
  return navigationItems.filter((i) => i.label.toLowerCase().includes(query.value.toLowerCase()))
})

const filteredItems = computed(() => {
  if (!query.value) return []
  const emps = employeeStore.employees
    .filter((e) => e.name.toLowerCase().includes(query.value.toLowerCase()) || e.roleName.toLowerCase().includes(query.value.toLowerCase()))
    .map((e) => ({ id: e.id, title: `${e.name} (${e.roleName})`, type: 'Employee', path: `/workforce/employees/${e.id}`, icon: UserCheck }))
  const tasks = taskStore.tasks
    .filter((t) => t.title.toLowerCase().includes(query.value.toLowerCase()))
    .map((t) => ({ id: t.id, title: t.title, type: 'Task', path: `/tasks?id=${t.id}`, icon: CheckSquare }))
  const projects = projectStore.projects
    .filter((p) => p.name.toLowerCase().includes(query.value.toLowerCase()))
    .map((p) => ({ id: p.id, title: p.name, type: 'Project', path: `/projects/${p.id}`, icon: Folder }))
  const runs = agentRunStore.runs
    .filter((r) => r.taskTitle.toLowerCase().includes(query.value.toLowerCase()) || r.id.toLowerCase().includes(query.value.toLowerCase()))
    .map((r) => ({ id: r.id, title: `Run #${r.id}: ${r.taskTitle}`, type: 'Agent Run', path: `/runs/${r.id}`, icon: PlayCircle }))
  const reviews = reviewStore.reviews
    .filter((rv) => rv.taskTitle.toLowerCase().includes(query.value.toLowerCase()) || rv.id.toLowerCase().includes(query.value.toLowerCase()))
    .map((rv) => ({ id: rv.id, title: `Review #${rv.id}: ${rv.taskTitle}`, type: 'Task Review', path: `/reviews`, icon: ClipboardCheck }))
  return [...emps, ...tasks, ...projects, ...runs, ...reviews]
})

const navigate = (path: string) => {
  router.push(path)
  emit('close')
}

const selectResult = (res: { path: string }) => {
  router.push(res.path)
  emit('close')
}
</script>


<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
