<template>
  <div class="space-y-6">
    <!-- Page Header & Quick Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-on-surface flex items-center gap-2">
          <Zap class="w-5 h-5 text-primary" />
          <span>Active Work Command Center</span>
        </h1>
        <p class="text-xs text-muted mt-1">
          Real-time visibility into all running autonomous agents, folder paths, and execution telemetry.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UiButton
          variant="secondary"
          size="sm"
          :icon="RefreshCw"
          @click="refreshData"
        >
          Refresh
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :icon="Plus"
          @click="showCreateTask = true"
        >
          New Task
        </UiButton>
      </div>
    </div>

    <!-- Active Summary Cards (4 Pillars) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-mono text-muted uppercase tracking-wider">Active Executions</div>
          <div class="text-2xl font-bold text-primary font-mono mt-1">
            {{ activeWorkStore.activeWorkItems.filter((i) => i.runStatus === 'Running' || i.taskStatus === 'In Progress').length }}
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <PlayCircle class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-mono text-muted uppercase tracking-wider">Awaiting Approvals</div>
          <div class="text-2xl font-bold text-amber-400 font-mono mt-1">
            {{ activeWorkStore.activeWorkItems.filter((i) => i.hasPendingApproval).length }}
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
          <AlertCircle class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-mono text-muted uppercase tracking-wider">In Review</div>
          <div class="text-2xl font-bold text-cyan-400 font-mono mt-1">
            {{ activeWorkStore.activeWorkItems.filter((i) => i.taskStatus === 'Review').length }}
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          <ClipboardCheck class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-mono text-muted uppercase tracking-wider">Total Active Cost</div>
          <div class="text-2xl font-bold text-on-surface font-mono mt-1">
            ${{ agentRunStore.totalEstimatedCost.toFixed(4) }}
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant">
          <DollarSign class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Active Work Feed & Control Ledger -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-on-surface flex items-center gap-2">
          <span>Live Active Workfeed</span>
          <span class="text-xs font-mono text-muted bg-surface-container px-2 py-0.5 rounded-full">
            {{ activeWorkStore.activeWorkItems.length }} items
          </span>
        </h2>

        <!-- Filter pills -->
        <div class="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-outline-variant text-xs">
          <button
            v-for="filter in ['all', 'running', 'waiting', 'review']"
            :key="filter"
            @click="activeFilter = filter"
            :class="[
              'px-2.5 py-1 rounded-lg capitalize transition font-medium',
              activeFilter === filter
                ? 'bg-surface-container-high text-on-surface shadow-sm font-semibold'
                : 'text-muted hover:text-on-surface'
            ]"
          >
            {{ filter }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredActiveItems.length === 0"
        class="bg-surface-container-low border border-outline-variant rounded-2xl p-12 text-center space-y-3"
      >
        <div class="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-muted mx-auto">
          <Zap class="w-6 h-6" />
        </div>
        <div>
          <div class="text-sm font-bold text-on-surface">No Active Work in Progress</div>
          <div class="text-xs text-muted mt-1 max-w-md mx-auto">
            All workers are currently idle. Assign new tasks or trigger recurring schedules to start autonomous execution.
          </div>
        </div>
        <UiButton variant="primary" size="sm" :icon="Plus" @click="showCreateTask = true">
          Create Task Now
        </UiButton>
      </div>

      <!-- Active Work Cards Grid -->
      <div v-else class="grid grid-cols-1 gap-3.5">
        <div
          v-for="item in filteredActiveItems"
          :key="item.taskId"
          class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-2xl p-4.5 transition space-y-4"
        >
          <!-- Top Row: Worker, Task Title & Status Badges -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-start gap-3">
              <!-- Worker Avatar -->
              <div class="relative shrink-0">
                <img
                  v-if="item.workerAvatar"
                  :src="item.workerAvatar"
                  :alt="item.workerName"
                  class="w-9 h-9 rounded-xl object-cover border border-outline-variant"
                />
                <div
                  v-else
                  class="w-9 h-9 rounded-xl bg-primary-container/20 border border-primary text-primary flex items-center justify-center font-bold text-xs"
                >
                  {{ item.workerName.substring(0, 2).toUpperCase() }}
                </div>
                <span
                  :class="[
                    'absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-surface',
                    item.hasPendingApproval
                      ? 'bg-amber-400 animate-ping'
                      : item.runStatus === 'Running' || item.taskStatus === 'In Progress'
                      ? 'bg-primary animate-pulse'
                      : 'bg-muted'
                  ]"
                ></span>
              </div>

              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <router-link
                    :to="`/tasks/${item.taskId}`"
                    class="text-sm font-bold text-on-surface hover:text-primary transition"
                  >
                    {{ item.taskTitle }}
                  </router-link>
                  <span class="text-[10px] font-mono text-muted bg-surface-container px-2 py-0.5 rounded">
                    {{ item.projectName }}
                  </span>
                  <span
                    v-if="item.taskType === 'recurring_instance'"
                    class="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20"
                  >
                    Scheduled
                  </span>
                </div>
                <div class="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                  <span class="text-on-surface font-medium">{{ item.workerName }}</span>
                  <span>&bull;</span>
                  <span>{{ item.workerRole }}</span>
                  <span v-if="item.attempt && item.attempt > 1" class="font-mono text-amber-400">
                    (Attempt #{{ item.attempt }})
                  </span>
                </div>
              </div>
            </div>

            <!-- Status Pill & Progress -->
            <div class="flex items-center gap-3 self-end sm:self-center">
              <div v-if="item.hasPendingApproval" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium">
                <AlertCircle class="w-3.5 h-3.5" />
                <span>Approval Required</span>
              </div>

              <div
                v-else
                :class="[
                  'px-2.5 py-1 rounded-full text-xs font-mono font-medium border',
                  item.runStatus === 'Running' || item.taskStatus === 'In Progress'
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : item.taskStatus === 'Review'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-surface-container-high border-outline text-muted'
                ]"
              >
                {{ item.runStatus || item.taskStatus }}
              </div>

              <router-link
                v-if="item.runId"
                :to="`/runs/${item.runId}`"
                class="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-muted hover:text-on-surface transition"
                title="Inspect Live Agent Run"
              >
                <ExternalLink class="w-4 h-4" />
              </router-link>
            </div>
          </div>

          <!-- Middle Row: Progress Bar & Execution State -->
          <div class="space-y-1.5 bg-surface-container-lowest/60 rounded-xl p-3 border border-outline-variant/60">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <Terminal class="w-3.5 h-3.5 text-primary" />
                <span class="font-mono text-on-surface-variant text-[11px]">{{ item.currentStep }}</span>
              </div>
              <span class="font-mono font-bold text-on-surface">{{ item.progress }}%</span>
            </div>
            <div class="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-300 rounded-full"
                :style="{ width: `${Math.max(5, item.progress)}%` }"
              ></div>
            </div>
          </div>

          <!-- Bottom Row: Workspace Path, Runtime & Owner Actions -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-outline-variant/40 text-xs">
            <div class="flex items-center gap-4 flex-wrap text-muted text-[11px]">
              <div class="flex items-center gap-1.5 font-mono">
                <Folder class="w-3.5 h-3.5 text-primary shrink-0" />
                <span class="text-on-surface truncate max-w-xs">{{ item.path }}</span>
              </div>
              <div class="flex items-center gap-1.5 font-mono">
                <Cpu class="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{{ item.runtime }}</span>
              </div>
            </div>

            <!-- Owner Action Buttons -->
            <div class="flex items-center gap-2 self-end sm:self-center">
              <!-- Add Instruction -->
              <UiButton
                v-if="item.runId && (item.runStatus === 'Running' || item.runStatus === 'Waiting')"
                variant="ghost"
                size="sm"
                :icon="MessageSquarePlus"
                @click="openAddInstruction(item)"
              >
                Directive
              </UiButton>

              <!-- Change Worker -->
              <UiButton
                variant="ghost"
                size="sm"
                :icon="UserCheck"
                @click="openChangeWorker(item)"
              >
                Change Worker
              </UiButton>

              <!-- Stop Run -->
              <UiButton
                v-if="item.runId && (item.runStatus === 'Running' || item.runStatus === 'Waiting')"
                variant="danger"
                size="sm"
                :icon="Square"
                @click="handleStopRun(item)"
              >
                Stop
              </UiButton>

              <!-- Start / Restart Run if stopped -->
              <UiButton
                v-else-if="item.taskStatus !== 'Done' && item.taskStatus !== 'Cancelled'"
                variant="primary"
                size="sm"
                :icon="Play"
                @click="handleLaunchRun(item)"
              >
                Run
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals & Drawers -->
    <CreateTaskDrawer
      :open="showCreateTask"
      @close="showCreateTask = false"
      @created="refreshData"
    />

    <ChangeWorkerModal
      v-if="activeModalItem"
      :open="showChangeWorkerModal"
      :task-id="activeModalItem.taskId"
      :task-title="activeModalItem.taskTitle"
      :current-worker-id="activeModalItem.workerId"
      :active-run-id="activeModalItem.runId"
      @close="showChangeWorkerModal = false"
      @updated="refreshData"
    />

    <AddInstructionModal
      v-if="activeModalItem && activeModalItem.runId"
      :open="showAddInstructionModal"
      :run-id="activeModalItem.runId"
      :task-title="activeModalItem.taskTitle"
      @close="showAddInstructionModal = false"
      @sent="refreshData"
    />

    <PreflightRunModal
      v-if="activeModalItem"
      :open="showPreflightModal"
      :task-id="activeModalItem.taskId"
      :task-title="activeModalItem.taskTitle"
      :folder-path="activeModalItem.path"
      :worker-name="activeModalItem.workerName"
      :runtime-name="activeModalItem.runtime"
      @close="showPreflightModal = false"
      @launch="executeLaunch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Zap,
  PlayCircle,
  AlertCircle,
  ClipboardCheck,
  DollarSign,
  Plus,
  RefreshCw,
  Folder,
  Cpu,
  Terminal,
  ExternalLink,
  MessageSquarePlus,
  UserCheck,
  Square,
  Play
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import CreateTaskDrawer from '../../components/tasks/CreateTaskDrawer.vue'
import ChangeWorkerModal from '../../components/tasks/ChangeWorkerModal.vue'
import AddInstructionModal from '../../components/tasks/AddInstructionModal.vue'
import PreflightRunModal from '../../components/tasks/PreflightRunModal.vue'
import { useActiveWorkStore } from '../../stores/activeWork'
import { useAgentRunStore } from '../../stores/agentRun'
import { useTaskStore } from '../../stores/task'
import { useEmployeeStore } from '../../stores/employee'
import { useProjectStore } from '../../stores/project'
import { useToast } from '../../composables/useToast'
import type { ActiveWorkItem } from '../../types'

const activeWorkStore = useActiveWorkStore()
const agentRunStore = useAgentRunStore()
const taskStore = useTaskStore()
const employeeStore = useEmployeeStore()
const projectStore = useProjectStore()
const toast = useToast()

const activeFilter = ref('all')
const showCreateTask = ref(false)
const showChangeWorkerModal = ref(false)
const showAddInstructionModal = ref(false)
const showPreflightModal = ref(false)
const activeModalItem = ref<ActiveWorkItem | null>(null)

onMounted(async () => {
  await refreshData()
})

const refreshData = async () => {
  await Promise.all([
    taskStore.fetchTasksByWorkspace('ws-dev'),
    agentRunStore.fetchRuns(),
    projectStore.fetchProjectsByWorkspace('ws-dev'),
    employeeStore.fetchEmployeesByWorkspace('ws-dev')
  ])
}

const filteredActiveItems = computed(() => {
  const items = activeWorkStore.activeWorkItems
  if (activeFilter.value === 'running') {
    return items.filter((i) => i.runStatus === 'Running' || i.taskStatus === 'In Progress')
  }
  if (activeFilter.value === 'waiting') {
    return items.filter((i) => i.hasPendingApproval || i.runStatus === 'Waiting')
  }
  if (activeFilter.value === 'review') {
    return items.filter((i) => i.taskStatus === 'Review')
  }
  return items
})

const openChangeWorker = (item: ActiveWorkItem) => {
  activeModalItem.value = item
  showChangeWorkerModal.value = true
}

const openAddInstruction = (item: ActiveWorkItem) => {
  activeModalItem.value = item
  showAddInstructionModal.value = true
}

const handleStopRun = async (item: ActiveWorkItem) => {
  if (!item.runId) return
  try {
    await agentRunStore.stopRun(item.runId, 'Stopped by user from Active Work center')
    toast.success(`Stopped execution run for "${item.taskTitle}".`)
    await refreshData()
  } catch (err: any) {
    toast.error(err.message || 'Failed to stop run.')
  }
}

const handleLaunchRun = (item: ActiveWorkItem) => {
  activeModalItem.value = item
  showPreflightModal.value = true
}

const executeLaunch = async () => {
  if (!activeModalItem.value) return
  const item = activeModalItem.value

  try {
    const worker = employeeStore.employees.find((e) => e.id === item.workerId)
    const run = await agentRunStore.createRun({
      id: `asg-${Date.now()}`,
      taskId: item.taskId,
      taskTitle: item.taskTitle,
      employeeId: item.workerId,
      employeeName: item.workerName,
      employeeAvatar: item.workerAvatar,
      employeeRole: item.workerRole,
      assignedBy: 'Owner',
      skillIds: worker?.skills.map((s) => s.skillId) || [],
      priority: 'High',
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    await taskStore.updateTask(item.taskId, {
      status: 'In Progress',
      activeRunId: run.id
    })

    toast.success(`Launched execution for "${item.taskTitle}".`)
    await agentRunStore.startLiveRunner(run.id)
    await refreshData()
  } catch (err: any) {
    toast.error(err.message || 'Failed to launch execution.')
  }
}
</script>
