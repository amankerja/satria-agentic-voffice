<template>
  <div v-if="loading" class="space-y-4 p-6">
    <div class="h-8 bg-surface-container rounded-xl w-1/3 animate-pulse"></div>
    <div class="h-64 bg-surface-container rounded-2xl animate-pulse"></div>
  </div>

  <div v-else-if="!task" class="p-12 text-center space-y-4">
    <div class="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-muted mx-auto">
      <AlertTriangle class="w-6 h-6 text-amber-400" />
    </div>
    <h2 class="text-base font-bold text-on-surface">Task Not Found</h2>
    <p class="text-xs text-muted">The requested task may have been deleted or does not exist in this workspace.</p>
    <router-link to="/tasks">
      <UiButton variant="primary" size="sm">Back to Tasks</UiButton>
    </router-link>
  </div>

  <div v-else class="space-y-6">
    <!-- Breadcrumb & Top Bar -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-2 text-xs font-mono text-muted">
        <router-link to="/tasks" class="hover:text-primary transition">Tasks</router-link>
        <ChevronRight class="w-3.5 h-3.5" />
        <span class="text-on-surface font-semibold truncate">{{ task.title }}</span>
      </div>

      <!-- Quick Action Controls -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Add Directive Mid-Run if running -->
        <UiButton
          v-if="activeRun && (activeRun.status === 'Running' || activeRun.status === 'Waiting')"
          variant="secondary"
          size="sm"
          :icon="MessageSquarePlus"
          @click="showAddInstructionModal = true"
        >
          Add Directive
        </UiButton>

        <!-- Change Worker -->
        <UiButton
          variant="secondary"
          size="sm"
          :icon="UserCheck"
          @click="showChangeWorkerModal = true"
        >
          Change Worker
        </UiButton>

        <!-- Stop Active Run -->
        <UiButton
          v-if="activeRun && (activeRun.status === 'Running' || activeRun.status === 'Waiting')"
          variant="danger"
          size="sm"
          :icon="Square"
          @click="handleStopRun"
        >
          Stop Run
        </UiButton>

        <!-- Launch Run if idle or completed/retry -->
        <UiButton
          v-else-if="task.status !== 'Cancelled'"
          variant="primary"
          size="sm"
          :icon="Play"
          @click="showPreflightModal = true"
        >
          {{ task.status === 'Done' ? 'Run Again' : 'Launch Execution' }}
        </UiButton>

        <!-- More Menu (Cancel / Archive / Delete) -->
        <div class="relative">
          <UiButton
            variant="ghost"
            size="sm"
            :icon="MoreVertical"
            @click="showActionMenu = !showActionMenu"
          />

          <div
            v-if="showActionMenu"
            class="absolute right-0 mt-1 w-44 bg-surface-container-low border border-outline-variant rounded-xl shadow-xl z-30 p-1 space-y-0.5 text-xs animate-in fade-in zoom-in-95"
            @click="showActionMenu = false"
          >
            <button
              v-if="task.status !== 'Cancelled'"
              @click="handleCancelTask"
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-amber-400 hover:bg-surface-container transition text-left"
            >
              <Ban class="w-3.5 h-3.5" />
              <span>Cancel Task</span>
            </button>

            <button
              v-if="task.status === 'Done'"
              @click="handleArchiveTask"
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-muted hover:bg-surface-container hover:text-on-surface transition text-left"
            >
              <Archive class="w-3.5 h-3.5" />
              <span>Archive Task</span>
            </button>

            <button
              @click="handleDeleteTask"
              class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-error hover:bg-error/10 transition text-left"
            >
              <Trash2 class="w-3.5 h-3.5" />
              <span>Safe Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Header Card -->
    <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-lg sm:text-xl font-bold text-on-surface">{{ task.title }}</h1>
            <span
              :class="[
                'px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border',
                getStatusBadgeClass(task.status)
              ]"
            >
              {{ task.status }}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-container text-muted border border-outline-variant uppercase">
              {{ task.type || 'Project' }}
            </span>
          </div>

          <div class="text-xs text-muted flex items-center gap-3 flex-wrap">
            <span class="text-primary font-mono">{{ task.projectName }}</span>
            <span>&bull;</span>
            <span>Priority: <strong class="text-on-surface">{{ task.priority }}</strong></span>
            <span>&bull;</span>
            <span>Due: <strong class="text-on-surface">{{ task.dueDate || 'No Due Date' }}</strong></span>
          </div>
        </div>

        <!-- Worker Assigned Badge -->
        <div class="flex items-center gap-2.5 bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant shrink-0">
          <div class="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary text-primary flex items-center justify-center font-bold text-xs">
            {{ (task.workerName || task.assigneeName || 'Auto').substring(0, 2).toUpperCase() }}
          </div>
          <div>
            <div class="text-[10px] font-mono text-muted uppercase">Assigned Worker</div>
            <div class="text-xs font-bold text-on-surface">{{ task.workerName || task.assigneeName || 'Unassigned' }}</div>
          </div>
        </div>
      </div>

      <!-- Workspace Folder Path -->
      <div class="bg-surface-container-lowest/80 rounded-xl p-3 border border-outline-variant/60 flex items-center justify-between text-xs font-mono">
        <div class="flex items-center gap-2 truncate">
          <Folder class="w-4 h-4 text-primary shrink-0" />
          <span class="text-muted">Target Folder:</span>
          <span class="text-on-surface truncate">{{ targetWorkspacePath }}</span>
        </div>
        <span class="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">Path Verified</span>
      </div>
    </div>

    <!-- Active Run Live Banner if running -->
    <div
      v-if="activeRun"
      class="bg-primary-container/10 border border-primary/30 rounded-2xl p-4.5 space-y-3 animate-in fade-in"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <PlayCircle class="w-5 h-5 text-primary animate-pulse" />
          <div>
            <div class="text-xs font-bold text-on-surface">
              Active Run #{{ activeRun.id }} &bull; Step: {{ activeRun.currentStep }}
            </div>
            <div class="text-[10px] font-mono text-muted">
              Running on {{ activeRun.telemetry?.provider || 'Hermes 3' }} &bull; Attempt #{{ activeRun.attempt }}
            </div>
          </div>
        </div>
        <router-link :to="`/runs/${activeRun.id}`">
          <UiButton variant="primary" size="sm" :icon="ExternalLink">
            Inspect Run
          </UiButton>
        </router-link>
      </div>

      <!-- Progress -->
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-muted">Execution Progress</span>
          <span class="text-primary font-bold">{{ activeRun.progress }}%</span>
        </div>
        <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-300" :style="{ width: `${activeRun.progress}%` }"></div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-outline-variant pb-2">
      <button
        v-for="tab in ['overview', 'runs', 'deliverable', 'audit']"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition',
          activeTab === tab
            ? 'bg-surface-container text-primary font-bold'
            : 'text-muted hover:text-on-surface'
        ]"
      >
        {{ tab === 'runs' ? `Execution Runs (${runs.length})` : tab }}
      </button>
    </div>

    <!-- Tab 1: Overview -->
    <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- Description -->
        <UiCard>
          <template #header>
            <span class="font-bold text-xs text-on-surface">Task Description & Requirements</span>
          </template>
          <div class="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
            {{ task.description || 'No detailed description provided.' }}
          </div>
        </UiCard>

        <!-- Acceptance Criteria -->
        <UiCard>
          <template #header>
            <span class="font-bold text-xs text-on-surface">Acceptance Criteria & Quality Gate</span>
          </template>
          <div v-if="task.acceptanceCriteria && task.acceptanceCriteria.length > 0" class="space-y-2">
            <div
              v-for="(crit, idx) in task.acceptanceCriteria"
              :key="idx"
              class="flex items-center gap-2.5 text-xs text-on-surface p-2 rounded-lg bg-surface-container-lowest border border-outline-variant"
            >
              <CheckCircle2 class="w-4 h-4 text-primary shrink-0" />
              <span>{{ crit }}</span>
            </div>
          </div>
          <div v-else class="text-xs text-muted">
            Standard deliverable integrity and sandbox security rules apply.
          </div>
        </UiCard>
      </div>

      <!-- Right Column: Meta & Schedule Info -->
      <div class="space-y-6">
        <UiCard>
          <template #header>
            <span class="font-bold text-xs text-on-surface">Task Metadata</span>
          </template>
          <div class="space-y-2.5 text-xs">
            <div class="flex items-center justify-between py-1 border-b border-outline-variant/40">
              <span class="text-muted">Created Date</span>
              <span class="font-mono text-on-surface">{{ task.createdAt?.split('T')[0] }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-outline-variant/40">
              <span class="text-muted">Total Runs</span>
              <span class="font-mono text-on-surface font-bold">{{ runs.length }} attempts</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-muted">Schedule Origin</span>
              <span class="font-mono text-primary">{{ task.scheduleId || 'Ad-hoc' }}</span>
            </div>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- Tab 2: Execution Runs History -->
    <div v-else-if="activeTab === 'runs'" class="space-y-3">
      <div v-if="runs.length === 0" class="p-8 text-center bg-surface-container-low rounded-2xl text-xs text-muted">
        No execution runs recorded yet. Click "Launch Execution" to run the agent.
      </div>
      <div
        v-for="r in runs"
        :key="r.id"
        class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-mono font-bold text-xs text-primary">
            #{{ r.attempt }}
          </div>
          <div>
            <div class="text-xs font-bold text-on-surface flex items-center gap-2">
              <span>Run {{ r.id }}</span>
              <span class="text-[10px] font-mono px-2 py-0.2 rounded-full border bg-surface-container">
                {{ r.status }}
              </span>
            </div>
            <div class="text-[10px] font-mono text-muted mt-0.5">
              {{ r.employeeName }} &bull; {{ r.startedAt?.split('T')[0] }} &bull; {{ r.durationSeconds || 0 }}s &bull; ${{ (r.telemetry?.estimatedCostUsd || 0).toFixed(4) }}
            </div>
          </div>
        </div>

        <router-link :to="`/runs/${r.id}`">
          <UiButton variant="secondary" size="sm">Inspect &rarr;</UiButton>
        </router-link>
      </div>
    </div>

    <!-- Tab 3: Deliverable & Result -->
    <div v-else-if="activeTab === 'deliverable'" class="space-y-4">
      <div v-if="latestResult" class="bg-surface-container-low border border-outline-variant rounded-2xl p-5 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-outline-variant">
          <div>
            <div class="text-xs font-bold text-on-surface">Latest Deliverable Ingestion</div>
            <div class="text-[10px] font-mono text-muted">Verification Status: {{ latestResult.verificationStatus }}</div>
          </div>
          <span class="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {{ latestResult.status }}
          </span>
        </div>
        <div class="p-4 bg-surface-container-lowest rounded-xl font-mono text-xs text-on-surface whitespace-pre-wrap leading-relaxed">
          {{ latestResult.output }}
        </div>
      </div>
      <div v-else class="p-8 text-center bg-surface-container-low rounded-2xl text-xs text-muted">
        No deliverable output ingested yet.
      </div>
    </div>

    <!-- Tab 4: Audit Trail -->
    <div v-else-if="activeTab === 'audit'" class="space-y-3">
      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 space-y-2 text-xs">
        <div class="font-bold text-on-surface mb-2">Task Lifecycle Audit Trail</div>
        <div class="space-y-2 font-mono text-[11px] text-muted">
          <div class="flex items-center gap-2">
            <span class="text-primary">&bull;</span>
            <span>Task created on {{ task.createdAt }}</span>
          </div>
          <div v-if="task.cancelledAt" class="flex items-center gap-2 text-amber-400">
            <span>&bull;</span>
            <span>Cancelled on {{ task.cancelledAt }}: {{ task.cancelReason }}</span>
          </div>
          <div v-if="task.archivedAt" class="flex items-center gap-2 text-muted">
            <span>&bull;</span>
            <span>Archived on {{ task.archivedAt }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ChangeWorkerModal
      :open="showChangeWorkerModal"
      :task-id="task.id"
      :task-title="task.title"
      :current-worker-id="task.workerId || task.assigneeId"
      :active-run-id="activeRun?.id"
      @close="showChangeWorkerModal = false"
      @updated="loadTaskData"
    />

    <AddInstructionModal
      v-if="activeRun"
      :open="showAddInstructionModal"
      :run-id="activeRun.id"
      :task-title="task.title"
      @close="showAddInstructionModal = false"
      @sent="loadTaskData"
    />

    <PreflightRunModal
      :open="showPreflightModal"
      :task-id="task.id"
      :task-title="task.title"
      :folder-path="targetWorkspacePath"
      :worker-name="task.workerName || task.assigneeName"
      :runtime-name="'Hermes 3 (Llama 3.1)'"
      @close="showPreflightModal = false"
      @launch="handleLaunchExecution"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronRight,
  PlayCircle,
  Play,
  Square,
  UserCheck,
  MessageSquarePlus,
  MoreVertical,
  Ban,
  Archive,
  Trash2,
  Folder,
  CheckCircle2,
  ExternalLink,
  AlertTriangle
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import ChangeWorkerModal from '../../components/tasks/ChangeWorkerModal.vue'
import AddInstructionModal from '../../components/tasks/AddInstructionModal.vue'
import PreflightRunModal from '../../components/tasks/PreflightRunModal.vue'
import { useTaskStore } from '../../stores/task'
import { useProjectStore } from '../../stores/project'
import { useAgentRunStore } from '../../stores/agentRun'
import { useEmployeeStore } from '../../stores/employee'
import { MockRunResultRepository } from '../../repositories'
import { useToast } from '../../composables/useToast'
import type { Task, AgentRun, RunResult } from '../../types'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const agentRunStore = useAgentRunStore()
const employeeStore = useEmployeeStore()
const resultRepo = new MockRunResultRepository()
const toast = useToast()

const loading = ref(true)
const task = ref<Task | null>(null)
const runs = ref<AgentRun[]>([])
const latestResult = ref<RunResult | null>(null)
const activeTab = ref('overview')
const showActionMenu = ref(false)
const showChangeWorkerModal = ref(false)
const showAddInstructionModal = ref(false)
const showPreflightModal = ref(false)

const taskId = computed(() => route.params.id as string)

const activeRun = computed(() => {
  if (!task.value?.activeRunId) return undefined
  return runs.value.find((r) => r.id === task.value?.activeRunId)
})

const targetWorkspacePath = computed(() => {
  if (task.value?.pathOverride) return task.value.pathOverride
  const prj = projectStore.projects.find((p) => p.id === task.value?.projectId)
  return prj?.path || 'C:/Projects/AI AGENTIC UI'
})

const loadTaskData = async () => {
  loading.value = true
  try {
    await Promise.all([
      projectStore.fetchProjectsByWorkspace('ws-dev'),
      employeeStore.fetchEmployeesByWorkspace('ws-dev')
    ])
    const foundTask = await taskStore.getTaskById(taskId.value)
    task.value = foundTask || null

    if (foundTask) {
      runs.value = await agentRunStore.fetchRunsByTask(foundTask.id)
      const resList = await resultRepo.getByTaskId(foundTask.id)
      latestResult.value = resList.length > 0 ? resList[resList.length - 1] : null
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTaskData()
})

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'Done':
      return 'bg-primary/10 border-primary/30 text-primary'
    case 'In Progress':
      return 'bg-secondary/10 border-secondary/30 text-secondary'
    case 'Review':
      return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
    case 'Waiting':
      return 'bg-amber-500/10 border-amber-500/30 text-amber-400'
    case 'Cancelled':
      return 'bg-error/10 border-error/30 text-error'
    default:
      return 'bg-surface-container-high border-outline text-muted'
  }
}

const handleStopRun = async () => {
  if (!activeRun.value) return
  try {
    await agentRunStore.stopRun(activeRun.value.id, 'Stopped by user from Task Detail')
    toast.success('Execution run stopped.')
    await loadTaskData()
  } catch (err: any) {
    toast.error(err.message || 'Failed to stop run.')
  }
}

const handleLaunchExecution = async () => {
  if (!task.value) return
  try {
    const worker = employeeStore.employees.find((e) => e.id === (task.value?.workerId || task.value?.assigneeId))
    const run = await agentRunStore.createRun({
      id: `asg-${Date.now()}`,
      taskId: task.value.id,
      taskTitle: task.value.title,
      employeeId: worker?.id || 'emp-raka',
      employeeName: worker?.name || 'Raka',
      employeeAvatar: worker?.avatar || '',
      employeeRole: worker?.roleName || 'Lead Planner',
      assignedBy: 'Owner',
      skillIds: worker?.skills.map((s) => s.skillId) || [],
      priority: task.value.priority,
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    await taskStore.updateTask(task.value.id, {
      status: 'In Progress',
      activeRunId: run.id
    })

    toast.success(`Execution launched for "${task.value.title}".`)
    await agentRunStore.startLiveRunner(run.id)
    await loadTaskData()
  } catch (err: any) {
    toast.error(err.message || 'Failed to launch execution.')
  }
}

const handleCancelTask = async () => {
  if (!task.value) return
  try {
    await taskStore.cancelTask(task.value.id, 'Cancelled from Task Detail page')
    toast.success(`Task "${task.value.title}" cancelled.`)
    await loadTaskData()
  } catch (err: any) {
    toast.error(err.message || 'Failed to cancel task.')
  }
}

const handleArchiveTask = async () => {
  if (!task.value) return
  try {
    await taskStore.archiveTask(task.value.id)
    toast.success(`Task "${task.value.title}" archived.`)
    await loadTaskData()
  } catch (err: any) {
    toast.error(err.message || 'Failed to archive task.')
  }
}

const handleDeleteTask = async () => {
  if (!task.value) return
  try {
    await taskStore.deleteTask(task.value.id, true, 'Deleted by user from Task Detail')
    toast.success(`Task "${task.value.title}" deleted.`)
    router.push('/tasks')
  } catch (err: any) {
    toast.error(err.message || 'Failed to delete task.')
  }
}
</script>
