<template>
  <div class="space-y-6">
    <!-- Header Greeting & Date -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-5">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Good morning, Satria</h1>
        <p class="text-xs sm:text-sm text-muted font-mono mt-1">Friday, 14 August 2026 &bull; {{ workspaceStore.currentWorkspace?.name }}</p>
      </div>
      <div class="flex items-center gap-2">
        <UiButton size="sm" variant="primary" :icon="Plus" aria-label="Create new task" @click="openNewTaskModal = true">
          New Task
        </UiButton>
        <UiButton size="sm" variant="secondary" :icon="FolderPlus" aria-label="Create new project" @click="openNewProjectModal = true">
          New Project
        </UiButton>
      </div>
    </div>

    <!-- Quick 1-Click AI Workforce Dispatch Bar -->
    <QuickDispatchBar />

    <!-- Live Agent Execution Banner (Phase 2) -->
    <div
      v-if="agentRunStore.activeRuns.length > 0"
      class="p-4 bg-primary-container/10 border border-primary/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-primary-container/20 border border-primary flex items-center justify-center text-primary shrink-0">
          <Activity class="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div class="text-xs font-bold text-on-surface flex items-center gap-2">
            <span>{{ agentRunStore.activeRuns.length }} Digital Employee Runs Active</span>
            <UiBadge variant="success" size="sm" class="font-mono">Live Telemetry</UiBadge>
          </div>
          <p class="text-[11px] text-muted mt-0.5">
            {{ agentRunStore.activeRuns[0]?.employeeName }} sedang menjalankan "{{ agentRunStore.activeRuns[0]?.taskTitle }}" ({{ agentRunStore.activeRuns[0]?.progress }}%)
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <router-link to="/runs">
          <UiButton size="sm" variant="primary">Inspect All Runs &rarr;</UiButton>
        </router-link>
      </div>
    </div>

    <!-- 4 KPI Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <UiCard padding="sm" class="bg-surface-container-low">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted">Active Tasks</span>
          <CheckSquare class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary mt-2">{{ activeTasksCount }}</div>
      </UiCard>

      <UiCard padding="sm" class="bg-surface-container-low">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted">Due Today</span>
          <Clock class="w-4 h-4 text-tertiary" />
        </div>
        <div class="text-2xl font-bold font-mono text-tertiary mt-2">{{ dueTodayCount }}</div>
      </UiCard>

      <UiCard padding="sm" class="bg-surface-container-low">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted">Projects</span>
          <Folder class="w-4 h-4 text-secondary" />
        </div>
        <div class="text-2xl font-bold font-mono text-secondary mt-2">{{ projectStore.projects.length }}</div>
      </UiCard>

      <UiCard padding="sm" class="bg-surface-container-low">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-muted">Attention Needed</span>
          <AlertTriangle class="w-4 h-4 text-error" />
        </div>
        <div class="text-2xl font-bold font-mono text-error mt-2">{{ blockedTasksCount }}</div>
      </UiCard>
    </div>

    <!-- Main Content Grid: Today & Current Work -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left 2 Cols: Today & Current Work -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Today Section -->
        <UiCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="font-semibold text-sm text-on-surface flex items-center gap-2">
                <Calendar class="w-4 h-4 text-primary" />
                Today Focus Tasks
              </span>
              <router-link to="/tasks" class="text-xs text-primary hover:underline font-medium">View All &rarr;</router-link>
            </div>
          </template>

          <div v-if="taskStore.tasks.length > 0" class="space-y-2.5">
            <div
              v-for="task in todayTasks"
              :key="task.id"
              @click="$router.push(`/tasks?id=${task.id}`)"
              class="p-3 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container transition cursor-pointer flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3 truncate">
                <input
                  type="checkbox"
                  :checked="task.status === 'Done'"
                  @click.stop="toggleTaskDone(task.id, task.status)"
                  class="w-4 h-4 rounded border-outline bg-surface-container-low text-primary focus:ring-0 cursor-pointer"
                />
                <div class="truncate">
                  <div :class="['text-xs font-medium text-on-surface truncate', task.status === 'Done' ? 'line-through opacity-50' : '']">
                    {{ task.title }}
                  </div>
                  <div class="text-[10px] text-muted font-mono">{{ task.projectName }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <UiBadge :variant="getPriorityVariant(task.priority)" size="sm">{{ task.priority }}</UiBadge>
                <UiBadge :variant="getStatusVariant(task.status)" size="sm">{{ task.status }}</UiBadge>
              </div>
            </div>
          </div>
          <UiEmptyState v-else title="Belum ada task hari ini" description="Semua pekerjaan telah selesai." />
        </UiCard>

        <!-- Current Work Progress -->
        <UiCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="font-semibold text-sm text-on-surface">Current Work Progress</span>
              <router-link to="/projects" class="text-xs text-primary hover:underline font-medium">Projects &rarr;</router-link>
            </div>
          </template>

          <div class="space-y-4">
            <div v-for="prj in projectStore.projects" :key="prj.id" class="space-y-1.5">
              <div class="flex justify-between items-center text-xs">
                <router-link :to="`/projects/${prj.id}`" class="font-medium text-on-surface hover:text-primary transition">
                  {{ prj.name }}
                </router-link>
                <span class="font-mono text-muted text-[11px]">{{ prj.progress }}%</span>
              </div>
              <UiProgress :value="prj.progress" :showValue="false" />
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Right 1 Col: Recent Activity Feed -->
      <div class="space-y-6">
        <UiCard>
          <template #header>
            <span class="font-semibold text-sm text-on-surface">Recent Activity</span>
          </template>

          <div class="space-y-4">
            <div v-for="act in activityLogs" :key="act.id" class="flex gap-3 text-xs border-b border-outline-variant pb-3 last:border-0 last:pb-0">
              <div class="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                {{ act.actorName.charAt(0) }}
              </div>
              <div class="space-y-0.5">
                <div class="text-on-surface">
                  <span class="font-semibold">{{ act.actorName }}</span>
                  <span class="text-muted"> {{ act.action }} </span>
                  <span class="font-medium text-primary">{{ act.targetTitle }}</span>
                </div>
                <div class="text-[10px] text-muted font-mono">{{ act.timeAgo }}</div>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Modal Create Task -->
    <UiModal :open="openNewTaskModal" title="Create New Task" @close="openNewTaskModal = false">
      <div class="space-y-3">
        <UiInput v-model="newTaskTitle" label="Task Title" placeholder="e.g. Implement Auth UI" required />
        <UiInput v-model="newTaskProject" label="Project Name" placeholder="e.g. SATRIA AI Workforce UI" />
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openNewTaskModal = false">Cancel</UiButton>
        <UiButton variant="primary" @click="handleCreateTask">Save Task</UiButton>
      </template>
    </UiModal>

    <!-- Modal Create Project -->
    <UiModal :open="openNewProjectModal" title="Create New Project" @close="openNewProjectModal = false">
      <div class="space-y-3">
        <UiInput v-model="newPrjName" label="Project Name" placeholder="e.g. Analytics System" required />
        <UiInput v-model="newPrjDesc" label="Description" placeholder="Ringkasan tujuan proyek..." />
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openNewProjectModal = false">Cancel</UiButton>
        <UiButton variant="primary" @click="handleCreateProject">Save Project</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, FolderPlus, CheckSquare, Clock, Folder, AlertTriangle, Calendar, Activity } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiProgress from '../../components/ui/UiProgress.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiInput from '../../components/ui/UiInput.vue'
import QuickDispatchBar from '../../components/workforce/QuickDispatchBar.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'
import { useTaskStore } from '../../stores/task'
import { useAgentRunStore } from '../../stores/agentRun'
import { mockActivityLogs } from '../../mocks/mockData'
import type { TaskStatus, TaskPriority } from '../../types'

const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const agentRunStore = useAgentRunStore()

const openNewTaskModal = ref(false)
const openNewProjectModal = ref(false)
const newTaskTitle = ref('')
const newTaskProject = ref('')
const newPrjName = ref('')
const newPrjDesc = ref('')

const activityLogs = mockActivityLogs

const loadWorkspaceData = () => {
  const wsId = workspaceStore.currentWorkspaceId
  projectStore.fetchProjectsByWorkspace(wsId)
  taskStore.fetchTasksByWorkspace(wsId)
  agentRunStore.fetchRuns()
}

onMounted(() => {
  loadWorkspaceData()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadWorkspaceData()
})

const todayTasks = computed(() => taskStore.tasks.slice(0, 5))
const activeTasksCount = computed(() => taskStore.tasks.filter((t) => t.status !== 'Done').length)
const dueTodayCount = computed(() => taskStore.tasks.filter((t) => t.dueDate === '2026-08-14').length)
const blockedTasksCount = computed(() => taskStore.tasks.filter((t) => t.status === 'Blocked').length)

const toggleTaskDone = (id: string, currentStatus: TaskStatus) => {
  const nextStatus: TaskStatus = currentStatus === 'Done' ? 'In Progress' : 'Done'
  taskStore.updateTaskStatus(id, nextStatus)
}

const handleCreateTask = async () => {
  if (!newTaskTitle.value.trim()) return
  await taskStore.createTask({
    workspaceId: workspaceStore.currentWorkspaceId,
    projectId: 'prj-satria-ui',
    projectName: newTaskProject.value || 'SATRIA AI Workforce UI',
    title: newTaskTitle.value,
    description: 'Task baru dari Quick Action.',
    status: 'In Progress',
    priority: 'Medium',
    assigneeName: 'Satria Utama',
    dueDate: '2026-08-14',
    tags: ['QuickCreate']
  })
  newTaskTitle.value = ''
  newTaskProject.value = ''
  openNewTaskModal.value = false
}

const handleCreateProject = async () => {
  if (!newPrjName.value.trim()) return
  await projectStore.createProject({
    workspaceId: workspaceStore.currentWorkspaceId,
    name: newPrjName.value,
    description: newPrjDesc.value || 'Proyek baru.',
    status: 'On Track',
    contributorsCount: 1
  })
  newPrjName.value = ''
  newPrjDesc.value = ''
  openNewProjectModal.value = false
}

const getStatusVariant = (status: TaskStatus) => {
  if (status === 'Done') return 'success'
  if (status === 'In Progress') return 'info'
  if (status === 'Blocked') return 'error'
  return 'neutral'
}

const getPriorityVariant = (priority: TaskPriority) => {
  if (priority === 'Urgent' || priority === 'High') return 'warning'
  return 'neutral'
}
</script>
