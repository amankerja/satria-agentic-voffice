<template>
  <div class="space-y-6">
    <!-- Header Greeting & Date -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-5">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-on-surface">Good morning, Satria</h1>
        <p class="text-xs sm:text-sm text-muted font-mono mt-1">
          {{ currentDateFormatted }} &bull; {{ workspaceStore.currentWorkspace?.name || 'Main Workspace' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UiButton size="sm" variant="primary" :icon="Plus" aria-label="Create new task" @click="showCreateTask = true">
          New Task
        </UiButton>
        <UiButton size="sm" variant="secondary" :icon="FolderPlus" aria-label="Create new project" @click="showCreateProject = true">
          New Project
        </UiButton>
      </div>
    </div>

    <!-- Observability Status Bar -->
    <div class="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant text-xs">
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant font-mono">
        <span
          class="w-2 h-2 rounded-full"
          :class="obsStore.runtimeHealth === 'healthy' || obsStore.runtimeHealth === 'mock' ? 'bg-primary' : 'bg-red-400'"
        ></span>
        <span class="text-on-surface font-medium">{{ obsStore.runtimeHealth === 'mock' ? 'Mock Runtime' : 'Hermes Healthy' }}</span>
      </div>

      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant font-mono">
        <span
          class="w-2 h-2 rounded-full"
          :class="obsStore.schedulerHealth === 'healthy' ? 'bg-primary' : 'bg-amber-400'"
        ></span>
        <span class="text-on-surface font-medium">Scheduler {{ obsStore.schedulerHealth === 'healthy' ? 'Healthy' : 'Standby' }}</span>
      </div>

      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant font-mono">
        <Activity class="w-3.5 h-3.5 text-primary" />
        <span class="text-on-surface font-medium">{{ obsStore.activeRunsCount }} Active Runs</span>
      </div>

      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant font-mono">
        <ShieldCheck class="w-3.5 h-3.5" :class="obsStore.orphanRunsCount > 0 ? 'text-amber-400' : 'text-primary'" />
        <span :class="obsStore.orphanRunsCount > 0 ? 'text-amber-400 font-bold' : 'text-on-surface font-medium'">
          {{ obsStore.orphanRunsCount }} Orphan Runs
        </span>
      </div>

      <div v-if="obsStore.activeWorkspaceLocksCount > 0" class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant font-mono ml-auto">
        <Lock class="w-3.5 h-3.5 text-secondary" />
        <span class="text-secondary font-medium">{{ obsStore.activeWorkspaceLocksCount }} Locked Path</span>
      </div>
    </div>

    <!-- 1. TOP PRIORITY: LIVE ACTIVE WORK IN PROGRESS & NEEDS ATTENTION -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left 2 Cols: Live Active Work -->
      <div class="lg:col-span-2 space-y-6">
        <UiCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="font-semibold text-sm text-on-surface flex items-center gap-2">
                <Zap class="w-4 h-4 text-primary" />
                <span>Active Work in Progress</span>
                <span class="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
                  {{ activeWorkStore.activeWorkItems.length }} active
                </span>
              </span>
              <router-link to="/work" class="text-xs text-primary hover:underline font-medium">
                Active Work Center &rarr;
              </router-link>
            </div>
          </template>

          <div v-if="activeWorkStore.activeWorkItems.length > 0" class="space-y-3">
            <div
              v-for="item in activeWorkStore.activeWorkItems.slice(0, 4)"
              :key="item.taskId"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface-container-lowest border border-outline-variant hover:border-outline rounded-xl transition shadow-sm"
            >
              <div class="flex items-start gap-3 truncate">
                <div class="w-9 h-9 rounded-xl bg-primary-container/20 border border-primary text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {{ item.workerName.substring(0, 2).toUpperCase() }}
                </div>
                <div class="truncate">
                  <router-link :to="`/tasks/${item.taskId}`" class="text-xs font-bold text-on-surface hover:text-primary transition truncate block">
                    {{ item.taskTitle }}
                  </router-link>
                  <div class="text-[10px] text-muted font-mono mt-1 flex flex-wrap items-center gap-2">
                    <span class="text-on-surface font-semibold">{{ item.workerName }}</span>
                    <span>&bull;</span>
                    <span>{{ item.projectName }}</span>
                    <span>&bull;</span>
                    <span class="text-primary font-bold">{{ item.currentStep }} ({{ item.progress }}%)</span>
                    <span v-if="item.path" class="text-muted truncate max-w-40">&bull; {{ item.path }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                <router-link
                  v-if="item.runId"
                  :to="`/runs/${item.runId}`"
                  class="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-mono text-primary transition flex items-center gap-1 border border-outline-variant"
                >
                  <span>Inspect</span>
                  <ExternalLink class="w-3 h-3" />
                </router-link>
              </div>
            </div>
          </div>
          <UiEmptyState v-else title="No Active Runs" description="Semua digital worker sedang idle. Buat tugas baru atau jalankan jadwal untuk memulai." />
        </UiCard>
      </div>

      <!-- Right 1 Col: Needs Attention -->
      <div class="space-y-6">
        <UiCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="font-semibold text-sm text-on-surface flex items-center gap-2">
                <AlertTriangle class="w-4 h-4 text-amber-400" />
                Needs Attention
              </span>
              <span class="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {{ attentionItemsCount }} items
              </span>
            </div>
          </template>

          <div class="space-y-2.5">
            <!-- Pending Approvals -->
            <div
              v-for="run in agentRunStore.waitingRuns"
              :key="run.id"
              class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-amber-400 font-mono text-[10px]">APPROVAL NEEDED</span>
                <router-link :to="`/runs/${run.id}`" class="text-amber-400 underline font-mono text-[10px] font-bold">Review &rarr;</router-link>
              </div>
              <div class="text-on-surface font-medium truncate">{{ run.taskTitle }}</div>
              <div class="text-[10px] text-muted">{{ run.employeeName }} requires human sign-off</div>
            </div>

            <!-- Pending Reviews -->
            <div
              v-for="rv in reviewStore.pendingReviews.slice(0, 3)"
              :key="rv.id"
              class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1 text-xs"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-cyan-400 font-mono text-[10px]">DELIVERABLE REVIEW</span>
                <router-link to="/reviews" class="text-cyan-400 underline font-mono text-[10px] font-bold">Inspect &rarr;</router-link>
              </div>
              <div class="text-on-surface font-medium truncate">{{ rv.taskTitle }}</div>
              <div class="text-[10px] text-muted">Awaiting quality verification approval</div>
            </div>

            <div v-if="attentionItemsCount === 0" class="text-center py-6 text-xs text-muted">
              All systems nominal. No pending approvals or warnings.
            </div>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- 2. WORKFORCE CAPACITY & REAL-TIME STATUS -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-on-surface flex items-center gap-2">
          <Users class="w-4 h-4 text-primary" />
          <span>Workforce Status & Capacity</span>
        </h2>
        <router-link to="/workforce/employees" class="text-xs text-primary hover:underline font-medium">
          Workers Directory ({{ employeeStore.employees.length }}) &rarr;
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          v-for="worker in activeWorkStore.workerSpotlight"
          :key="worker.id"
          class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-2xl p-4 transition space-y-3"
        >
          <!-- Worker Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="relative">
                <img
                  v-if="worker.avatar"
                  :src="worker.avatar"
                  :alt="worker.name"
                  class="w-9 h-9 rounded-xl object-cover border border-outline-variant"
                />
                <div
                  v-else
                  class="w-9 h-9 rounded-xl bg-primary-container/20 border border-primary text-primary flex items-center justify-center font-bold text-xs"
                >
                  {{ worker.name.substring(0, 2).toUpperCase() }}
                </div>
                <span
                  :class="[
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-surface',
                    worker.status === 'Running'
                      ? 'bg-primary animate-pulse'
                      : worker.status === 'Waiting'
                      ? 'bg-amber-400'
                      : worker.status === 'Review'
                      ? 'bg-cyan-400'
                      : 'bg-muted'
                  ]"
                ></span>
              </div>
              <div>
                <div class="text-xs font-bold text-on-surface">{{ worker.name }}</div>
                <div class="text-[10px] text-muted truncate max-w-28">{{ worker.role }}</div>
              </div>
            </div>

            <span
              :class="[
                'text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border',
                worker.status === 'Running'
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : worker.status === 'Waiting'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : worker.status === 'Review'
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-surface-container-high border-outline text-muted'
              ]"
            >
              {{ worker.status }}
            </span>
          </div>

          <!-- Current Work / Idle State -->
          <div class="bg-surface-container-lowest/80 rounded-xl p-2.5 border border-outline-variant/60 space-y-1.5 min-h-16">
            <div v-if="worker.currentTaskTitle" class="space-y-1">
              <div class="text-[11px] font-semibold text-on-surface truncate" :title="worker.currentTaskTitle">
                {{ worker.currentTaskTitle }}
              </div>
              <div class="flex items-center justify-between text-[10px] font-mono text-muted">
                <span class="truncate max-w-24">{{ worker.projectName }}</span>
                <span class="text-primary font-bold">{{ worker.progress }}%</span>
              </div>
              <div class="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full" :style="{ width: `${Math.max(5, worker.progress)}%` }"></div>
              </div>
            </div>
            <div v-else class="text-[11px] text-muted py-2 text-center">
              Available for autonomous task assignment
            </div>
          </div>

          <!-- Quick Action -->
          <div class="flex items-center justify-between text-[10px] font-mono text-muted pt-1 border-t border-outline-variant/40">
            <span class="truncate">{{ worker.runtimeName }}</span>
            <router-link
              :to="worker.currentTaskId ? `/tasks/${worker.currentTaskId}` : `/workforce/employees/${worker.id}`"
              class="text-primary hover:underline font-semibold"
            >
              {{ worker.currentTaskId ? 'Inspect &rarr;' : 'Assign &rarr;' }}
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. TODAY'S FOCUS TASKS & QUICK DISPATCH LAUNCHER -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left 2 Cols: Today Tasks -->
      <div class="lg:col-span-2">
        <UiCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="font-semibold text-sm text-on-surface flex items-center gap-2">
                <Calendar class="w-4 h-4 text-primary" />
                Today Focus Tasks
              </span>
              <router-link to="/tasks" class="text-xs text-primary hover:underline font-medium">All Tasks &rarr;</router-link>
            </div>
          </template>

          <div v-if="taskStore.tasks.length > 0" class="space-y-2.5">
            <div
              v-for="task in todayTasks"
              :key="task.id"
              class="flex items-center justify-between p-3 bg-surface-container-lowest border border-outline-variant hover:border-outline rounded-xl transition"
            >
              <div class="flex items-center gap-3 truncate">
                <input
                  type="checkbox"
                  :checked="task.status === 'Done'"
                  @change="toggleTaskDone(task.id, task.status)"
                  class="w-4 h-4 rounded border-outline bg-surface-container-lowest text-primary focus:ring-0 cursor-pointer"
                />
                <div class="truncate">
                  <router-link
                    :to="`/tasks/${task.id}`"
                    :class="['text-xs font-medium text-on-surface hover:text-primary transition truncate block', task.status === 'Done' ? 'line-through opacity-50' : '']"
                  >
                    {{ task.title }}
                  </router-link>
                  <div class="text-[10px] text-muted font-mono mt-0.5 flex items-center gap-2">
                    <span>{{ task.projectName }}</span>
                    <span>&bull;</span>
                    <span class="text-secondary">{{ task.assigneeName || 'Unassigned' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <UiBadge :variant="getPriorityVariant(task.priority)" size="sm">
                  {{ task.priority }}
                </UiBadge>
                <UiBadge :variant="getStatusVariant(task.status)" size="sm">
                  {{ task.status }}
                </UiBadge>
              </div>
            </div>
          </div>
          <UiEmptyState v-else title="No tasks for today" description="Semua tugas hari ini sudah selesai atau belum ada tugas yang dijadwalkan." />
        </UiCard>
      </div>

      <!-- Right 1 Col: Quick Dispatch Bar -->
      <div>
        <UiCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="font-semibold text-sm text-on-surface flex items-center gap-2">
                <Zap class="w-4 h-4 text-secondary" />
                Quick Dispatch Launcher
              </span>
            </div>
          </template>

          <QuickDispatchBar />
        </UiCard>
      </div>
    </div>

    <!-- Modals -->
    <CreateTaskDrawer
      :open="showCreateTask"
      @close="showCreateTask = false"
      @created="loadWorkspaceData"
    />

    <CreateProjectModal
      :open="showCreateProject"
      @close="showCreateProject = false"
      @created="loadWorkspaceData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  Plus,
  FolderPlus,
  Users,
  Zap,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Activity,
  ShieldCheck,
  Lock
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import QuickDispatchBar from '../../components/workforce/QuickDispatchBar.vue'
import CreateTaskDrawer from '../../components/tasks/CreateTaskDrawer.vue'
import CreateProjectModal from '../../components/projects/CreateProjectModal.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'
import { useTaskStore } from '../../stores/task'
import { useAgentRunStore } from '../../stores/agentRun'
import { useReviewStore } from '../../stores/review'
import { useActiveWorkStore } from '../../stores/activeWork'
import { useEmployeeStore } from '../../stores/employee'
import { useObservabilityStore } from '../../stores/observability'
import type { TaskStatus, TaskPriority } from '../../types'

const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const agentRunStore = useAgentRunStore()
const reviewStore = useReviewStore()
const activeWorkStore = useActiveWorkStore()
const employeeStore = useEmployeeStore()
const obsStore = useObservabilityStore()

const showCreateTask = ref(false)
const showCreateProject = ref(false)

const currentDateFormatted = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())
})

const attentionItemsCount = computed(() => {
  return agentRunStore.waitingRuns.length + reviewStore.pendingReviews.length
})

const loadWorkspaceData = async () => {
  const wsId = workspaceStore.currentWorkspaceId || 'ws-dev'
  await Promise.all([
    projectStore.fetchProjectsByWorkspace(wsId),
    taskStore.fetchTasksByWorkspace(wsId),
    agentRunStore.fetchRuns(),
    reviewStore.fetchReviews(),
    employeeStore.fetchEmployeesByWorkspace(wsId)
  ])
}

onMounted(() => {
  loadWorkspaceData()
})

watch(
  () => workspaceStore.currentWorkspaceId,
  () => {
    loadWorkspaceData()
  }
)

const todayTasks = computed(() => taskStore.tasks.slice(0, 5))

const toggleTaskDone = (id: string, currentStatus: TaskStatus) => {
  const nextStatus: TaskStatus = currentStatus === 'Done' ? 'Todo' : 'Done'
  taskStore.updateTaskStatus(id, nextStatus)
}

const getStatusVariant = (status: TaskStatus) => {
  if (status === 'Done') return 'success'
  if (status === 'In Progress') return 'info'
  if (status === 'Waiting') return 'warning'
  if (status === 'Cancelled') return 'error'
  return 'neutral'
}

const getPriorityVariant = (priority: TaskPriority) => {
  if (priority === 'Urgent') return 'error'
  if (priority === 'High') return 'warning'
  if (priority === 'Medium') return 'info'
  return 'neutral'
}
</script>
