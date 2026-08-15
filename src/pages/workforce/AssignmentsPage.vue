<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Workforce Assignments & Workload</h1>
          <UiBadge variant="info" size="sm" class="font-mono">
            Manager View
          </UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Cross-employee workload distribution, active execution queue, capacity balancing, and dispatch orchestration.
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-2.5">
        <UiButton
          variant="secondary"
          size="sm"
          :icon="RefreshCw"
          @click="loadAllData"
          aria-label="Refresh assignment and workload status"
        >
          Refresh
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :icon="Plus"
          @click="openTaskModal = true"
          aria-label="Create new work unit to assign"
        >
          Create Task
        </UiButton>
      </div>
    </div>

    <!-- 4 High-Level Workload KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total Active Workload -->
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Active Work Units</span>
          <Briefcase class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary mt-1.5">
          {{ activeTasksCount }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          {{ inProgressTasksCount }} In-Progress &bull; {{ inReviewTasksCount }} In-Review
        </div>
      </UiCard>

      <!-- Employee Utilization -->
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Workforce Utilization</span>
          <Users class="w-4 h-4 text-secondary" />
        </div>
        <div class="text-2xl font-bold font-mono text-secondary mt-1.5">
          {{ workforceUtilizationRate }}%
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          {{ busyEmployeesCount }}/{{ employeeStore.activeEmployees.length }} Active Personnel Assigned
        </div>
      </UiCard>

      <!-- Unassigned Queue -->
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Unassigned Backlog</span>
          <Inbox class="w-4 h-4 text-amber-400" />
        </div>
        <div class="text-2xl font-bold font-mono text-amber-400 mt-1.5">
          {{ unassignedTasks.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          Ready for Skill Match & Dispatch
        </div>
      </UiCard>

      <!-- Live Execution Runs -->
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Live Agent Runs</span>
          <PlayCircle class="w-4 h-4 text-primary-container" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary-container mt-1.5">
          {{ agentRunStore.activeRuns.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          {{ agentRunStore.completedRuns.length }} Completed Runs
        </div>
      </UiCard>
    </div>

    <!-- Search & Filters -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
      <div class="flex flex-wrap items-center gap-2">
        <!-- Department Filter Pills -->
        <button
          v-for="dept in departmentsList"
          :key="dept.id"
          @click="selectedDeptId = dept.id"
          :class="[
            'px-3 py-1 rounded-lg text-xs font-medium transition',
            selectedDeptId === dept.id
              ? 'bg-surface-container-high text-primary font-bold border border-primary/30'
              : 'text-muted hover:text-on-surface hover:bg-surface-container-lowest'
          ]"
        >
          {{ dept.name }}
        </button>
      </div>

      <div class="flex items-center gap-2.5">
        <!-- Status Filter Selector -->
        <select
          v-model="selectedWorkState"
          aria-label="Filter by employee work state"
          class="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
        >
          <option value="ALL">All Work States</option>
          <option value="BUSY">Assigned / Busy</option>
          <option value="IDLE">Available / Idle</option>
        </select>

        <!-- Search Input -->
        <div class="relative w-full sm:w-60">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search employee or task..."
            aria-label="Search employee or task title"
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>

    <!-- Cross-Employee Workload Distribution Grid -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-on-surface flex items-center gap-2">
          <Users class="w-4 h-4 text-primary" />
          Digital Employee Workload Ledger ({{ filteredEmployees.length }})
        </h2>
        <span class="text-xs font-mono text-muted">
          Click employee to inspect profile & tasks
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="item in filteredEmployees"
          :key="item.employee.id"
          class="p-4 bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl transition space-y-4 shadow-sm"
        >
          <!-- Employee Profile Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <img
                :src="item.employee.avatar"
                :alt="item.employee.name"
                class="w-11 h-11 rounded-full object-cover border border-outline shrink-0"
              />
              <div>
                <div class="flex items-center gap-2">
                  <router-link
                    :to="`/workforce/employees/${item.employee.id}`"
                    class="text-sm font-bold text-on-surface hover:text-primary transition"
                  >
                    {{ item.employee.name }}
                  </router-link>
                  <span class="text-[10px] font-mono text-secondary px-1.5 py-0.5 rounded bg-secondary/10">
                    {{ item.employee.departmentName }}
                  </span>
                </div>
                <div class="text-xs text-muted mt-0.5">
                  {{ item.employee.roleName }}
                </div>
              </div>
            </div>

            <!-- Capacity Badge -->
            <div class="text-right">
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1',
                  item.tasks.length === 0
                    ? 'bg-surface-container-high text-muted'
                    : item.tasks.length === 1
                    ? 'bg-primary-container/15 text-primary'
                    : 'bg-amber-500/15 text-amber-400'
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    item.tasks.length === 0 ? 'bg-muted' : item.tasks.length === 1 ? 'bg-primary' : 'bg-amber-400'
                  ]"
                ></span>
                {{ item.tasks.length === 0 ? 'Available' : item.tasks.length === 1 ? '1 Task (Normal)' : `${item.tasks.length} Tasks (High Load)` }}
              </span>
              <div class="text-[10px] font-mono text-muted mt-1">
                {{ item.employee.workState || 'Idle' }}
              </div>
            </div>
          </div>

          <!-- Capacity Bar -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-[10px] font-mono text-muted">
              <span>Workload Capacity</span>
              <span>{{ Math.min(item.tasks.length * 50, 100) }}%</span>
            </div>
            <div class="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant">
              <div
                :class="[
                  'h-full rounded-full transition-all duration-300',
                  item.tasks.length === 0
                    ? 'bg-muted w-0'
                    : item.tasks.length === 1
                    ? 'bg-primary w-1/2'
                    : 'bg-amber-400 w-full'
                ]"
              ></div>
            </div>
          </div>

          <!-- Assigned Tasks List -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px] font-mono text-muted">
              <span>ASSIGNED WORK UNITS ({{ item.tasks.length }})</span>
              <button
                @click="openAssignDrawerForEmployee(item.employee)"
                class="text-primary hover:underline text-[11px] flex items-center gap-1 font-sans"
              >
                <Plus class="w-3 h-3" /> Assign Task
              </button>
            </div>

            <!-- Empty State for Employee -->
            <div
              v-if="item.tasks.length === 0"
              class="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-center text-xs text-muted"
            >
              No active tasks assigned. Ready for new assignments.
            </div>

            <!-- Tasks List -->
            <div v-else class="space-y-1.5">
              <div
                v-for="task in item.tasks"
                :key="task.id"
                class="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-between gap-3 text-xs"
              >
                <div class="truncate">
                  <div class="font-medium text-on-surface truncate flex items-center gap-1.5">
                    <span
                      :class="[
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        task.status === 'In Progress' ? 'bg-primary' : task.status === 'Review' ? 'bg-amber-400' : 'bg-muted'
                      ]"
                    ></span>
                    {{ task.title }}
                  </div>
                  <div class="text-[10px] font-mono text-muted flex items-center gap-2 mt-0.5">
                    <span>#{{ task.id }}</span>
                    <span>&bull;</span>
                    <span>{{ task.projectName }}</span>
                    <span>&bull;</span>
                    <span class="capitalize text-secondary">{{ task.priority }} priority</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <router-link
                    v-if="getRunForTask(task.id)"
                    :to="`/runs/${getRunForTask(task.id)?.id}`"
                    class="p-1 rounded hover:bg-surface-container text-primary font-mono text-[10px] flex items-center gap-1"
                    title="Inspect Live Run"
                  >
                    <PlayCircle class="w-3.5 h-3.5" />
                    <span>Run</span>
                  </router-link>
                  <router-link
                    :to="`/tasks?id=${task.id}`"
                    class="p-1 rounded hover:bg-surface-container text-muted hover:text-on-surface"
                    title="View Task Details"
                  >
                    <ExternalLink class="w-3.5 h-3.5" />
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Unassigned Tasks Backlog Section -->
    <div v-if="unassignedTasks.length > 0" class="space-y-3 pt-4 border-t border-outline-variant">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-amber-300 flex items-center gap-2">
          <Inbox class="w-4 h-4 text-amber-400" />
          Unassigned Tasks Queue ({{ unassignedTasks.length }})
        </h2>
        <span class="text-xs font-mono text-muted">
          Allocate to available digital employees
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="task in unassignedTasks"
          :key="task.id"
          class="p-3.5 bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl space-y-2.5 transition flex flex-col justify-between"
        >
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[10px] font-mono">
              <span class="text-muted">#{{ task.id }}</span>
              <UiBadge variant="warning" size="sm">{{ task.priority }}</UiBadge>
            </div>
            <div class="text-xs font-bold text-on-surface line-clamp-2">
              {{ task.title }}
            </div>
            <p v-if="task.description" class="text-[11px] text-muted line-clamp-2">
              {{ task.description }}
            </p>
          </div>

          <div class="pt-2 border-t border-outline-variant flex items-center justify-between">
            <span class="text-[10px] font-mono text-muted truncate max-w-30">
              {{ task.projectName }}
            </span>
            <UiButton
              size="sm"
              variant="primary"
              :icon="UserPlus"
              @click="openAssignDrawerForTask(task)"
            >
              Match & Assign
            </UiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Assignment Drawer -->
    <AssignmentDrawer
      v-model="isAssignmentDrawerOpen"
      :task="targetTaskForAssignment"
      @assigned="handleAssignmentCompleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Users,
  Briefcase,
  Inbox,
  PlayCircle,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  UserPlus
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import AssignmentDrawer from '../../components/workforce/AssignmentDrawer.vue'
import type { Task, Employee } from '../../types'
import { useEmployeeStore } from '../../stores/employee'
import { useDepartmentStore } from '../../stores/department'
import { useTaskStore } from '../../stores/task'
import { useAgentRunStore } from '../../stores/agentRun'
import { useWorkspaceStore } from '../../stores/workspace'
import { useToast } from '../../composables/useToast'

const employeeStore = useEmployeeStore()
const departmentStore = useDepartmentStore()
const taskStore = useTaskStore()
const agentRunStore = useAgentRunStore()
const workspaceStore = useWorkspaceStore()
const toast = useToast()

const selectedDeptId = ref<string>('ALL')
const selectedWorkState = ref<'ALL' | 'BUSY' | 'IDLE'>('ALL')
const searchQuery = ref<string>('')

const isAssignmentDrawerOpen = ref<boolean>(false)
const targetTaskForAssignment = ref<Task | null>(null)
const openTaskModal = ref<boolean>(false)

onMounted(() => {
  loadAllData()
})

async function loadAllData() {
  await Promise.all([
    employeeStore.fetchEmployees(),
    departmentStore.fetchDepartments(),
    taskStore.fetchTasksByWorkspace(workspaceStore.currentWorkspaceId || 'ws-satria-dev'),
    agentRunStore.fetchRuns()
  ])
}

const departmentsList = computed(() => {
  return [
    { id: 'ALL', name: 'All Departments' },
    ...departmentStore.departments
  ]
})

const activeTasksCount = computed(() => {
  return taskStore.tasks.filter(t => t.status === 'In Progress' || t.status === 'Review').length
})

const inProgressTasksCount = computed(() => {
  return taskStore.tasks.filter(t => t.status === 'In Progress').length
})

const inReviewTasksCount = computed(() => {
  return taskStore.tasks.filter(t => t.status === 'Review').length
})

const unassignedTasks = computed(() => {
  return taskStore.tasks.filter(t => !t.assigneeId && t.status !== 'Done')
})

const busyEmployeesCount = computed(() => {
  const assignedIds = new Set(
    taskStore.tasks
      .filter(t => t.assigneeId && t.status !== 'Done')
      .map(t => t.assigneeId)
  )
  return assignedIds.size
})

const workforceUtilizationRate = computed(() => {
  const total = employeeStore.activeEmployees.length
  if (total === 0) return 0
  return Math.round((busyEmployeesCount.value / total) * 100)
})

interface EmployeeWorkloadItem {
  employee: Employee
  tasks: Task[]
}

const employeeWorkloadList = computed<EmployeeWorkloadItem[]>(() => {
  return employeeStore.activeEmployees.map(emp => {
    const tasks = taskStore.tasks.filter(t => t.assigneeId === emp.id && t.status !== 'Done')
    return {
      employee: emp,
      tasks
    }
  })
})

const filteredEmployees = computed(() => {
  let list = employeeWorkloadList.value

  // Department filter
  if (selectedDeptId.value !== 'ALL') {
    list = list.filter(item => item.employee.departmentId === selectedDeptId.value)
  }

  // Work state filter
  if (selectedWorkState.value === 'BUSY') {
    list = list.filter(item => item.tasks.length > 0)
  } else if (selectedWorkState.value === 'IDLE') {
    list = list.filter(item => item.tasks.length === 0)
  }

  // Search query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(item => {
      const matchName = item.employee.name.toLowerCase().includes(q)
      const matchRole = item.employee.roleName.toLowerCase().includes(q)
      const matchTask = item.tasks.some(t => t.title.toLowerCase().includes(q))
      return matchName || matchRole || matchTask
    })
  }

  return list
})

function getRunForTask(taskId: string) {
  return agentRunStore.runs.find(r => r.taskId === taskId)
}

function openAssignDrawerForTask(task: Task) {
  targetTaskForAssignment.value = task
  isAssignmentDrawerOpen.value = true
}

function openAssignDrawerForEmployee(_emp: Employee) {
  // If there are unassigned tasks, pick the first one
  if (unassignedTasks.value.length > 0) {
    targetTaskForAssignment.value = unassignedTasks.value[0]
  } else {
    // Pick any active task
    targetTaskForAssignment.value = taskStore.tasks[0] || null
  }
  isAssignmentDrawerOpen.value = true
}

function handleAssignmentCompleted() {
  toast.success('Work unit assigned successfully', 'Employee workload and dispatch status updated.')
  loadAllData()
}
</script>
