<template>
  <div class="space-y-6">
    <!-- Header & Calendar Navigation Controls -->
    <div class="border-b border-outline-variant pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Calendar & Deadlines</h1>
          <UiBadge variant="info" size="sm" class="font-mono">
            {{ taskStore.tasks.length }} Tasks Mapped
          </UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Visualisasi jadwal jatuh tempo dan milestone operasional di {{ workspaceStore.currentWorkspace?.name }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View Switcher (Month, Week, Day) -->
        <div role="tablist" aria-label="Calendar view switcher" class="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
          <button
            v-for="v in viewOptions"
            :key="v"
            role="tab"
            :aria-selected="activeView === v"
            :aria-label="`${v} view`"
            @click="activeView = v"
            :class="[
              'px-2.5 py-1 rounded text-xs font-medium transition capitalize',
              activeView === v ? 'bg-surface-container-high text-primary font-semibold' : 'text-muted hover:text-on-surface'
            ]"
          >
            {{ v }}
          </button>
        </div>

        <!-- Month Nav Controls -->
        <div class="flex items-center bg-surface-container-low rounded-lg border border-outline-variant p-0.5">
          <button @click="prevMonth" aria-label="Previous month" class="p-1.5 text-muted hover:text-on-surface transition rounded hover:bg-surface-container-high">
            <ChevronLeft class="w-4 h-4" aria-hidden="true" />
          </button>
          <button @click="goToToday" aria-label="Go to current date" class="px-2 text-xs font-mono text-on-surface hover:text-primary transition">
            Today
          </button>
          <button @click="nextMonth" aria-label="Next month" class="p-1.5 text-muted hover:text-on-surface transition rounded hover:bg-surface-container-high">
            <ChevronRight class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <!-- Current Month Title Badge -->
        <div class="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-mono font-bold text-primary">
          {{ currentMonthName }} {{ currentYear }}
        </div>
      </div>
    </div>

    <!-- Main Calendar Grid + Agenda Split Layout -->
    <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <!-- CALENDAR MONTH GRID (3 Cols on XL) -->
      <div class="xl:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
        <!-- Weekday Headers -->
        <div class="grid grid-cols-7 bg-surface-container-lowest border-b border-outline-variant text-center font-mono text-[11px] text-muted uppercase py-2.5">
          <div v-for="day in weekdays" :key="day">{{ day }}</div>
        </div>

        <!-- Calendar Days Grid -->
        <div class="grid grid-cols-7 divide-x divide-y divide-outline-variant bg-surface-container-low flex-1 min-h-145">
          <div
            v-for="cell in calendarDays"
            :key="cell.dateString"
            :class="[
              'p-2 min-h-22.5 flex flex-col justify-between transition group',
              cell.isCurrentMonth ? 'bg-surface-container-low' : 'bg-surface-container-lowest/60 opacity-40',
              cell.isToday ? 'ring-1 ring-inset ring-primary/50 bg-surface-container' : ''
            ]"
          >
            <!-- Day Number & Today indicator -->
            <div class="flex items-center justify-between">
              <span
                :class="[
                  'text-xs font-mono px-1.5 py-0.5 rounded-md font-semibold',
                  cell.isToday ? 'bg-primary-container text-on-primary' : 'text-muted group-hover:text-on-surface'
                ]"
              >
                {{ cell.dayNumber }}
              </span>
              <span v-if="cell.tasks.length > 0" class="text-[9px] font-mono text-muted">
                {{ cell.tasks.length }} tasks
              </span>
            </div>

            <!-- Task Items plotted on this day -->
            <div class="space-y-1 mt-1 overflow-y-auto max-h-20 scrollbar-none">
              <div
                v-for="task in cell.tasks"
                :key="task.id"
                @click="openTaskDrawer(task)"
                :class="[
                  'px-1.5 py-1 rounded text-[10px] font-medium truncate cursor-pointer transition flex items-center justify-between gap-1',
                  task.status === 'Done'
                    ? 'bg-on-primary/40 text-primary border border-primary-container/20'
                    : task.priority === 'Urgent' || task.priority === 'High'
                    ? 'bg-on-tertiary/40 text-tertiary border border-tertiary-container/30 hover:border-tertiary-container'
                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant hover:border-primary'
                ]"
                :title="`${task.title} (${task.status})`"
              >
                <span class="truncate">{{ task.title }}</span>
                <span v-if="task.priority === 'Urgent'" class="w-1.5 h-1.5 rounded-full bg-tertiary-container shrink-0"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AGENDA & UPCOMING DEADLINES SIDEBAR (1 Col on XL) -->
      <div class="space-y-4">
        <!-- Today's Deadlines Card -->
        <UiCard padding="sm">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <CalendarIcon class="w-4 h-4 text-primary" />
                <h3 class="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">Today's Deadlines</h3>
              </div>
              <UiBadge variant="warning" size="sm" class="font-mono">
                {{ todayTasks.length }} Due
              </UiBadge>
            </div>
          </template>

          <div v-if="todayTasks.length === 0" class="text-xs text-muted py-3 text-center">
            Tidak ada deadline task untuk hari ini.
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="task in todayTasks"
              :key="task.id"
              @click="openTaskDrawer(task)"
              class="p-2.5 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant hover:border-outline transition space-y-1.5"
            >
              <div class="flex items-start justify-between gap-1">
                <span class="text-xs font-semibold text-on-surface line-clamp-1">{{ task.title }}</span>
                <UiBadge :variant="task.status === 'Done' ? 'success' : 'warning'" size="sm" class="text-[9px]">
                  {{ task.status }}
                </UiBadge>
              </div>
              <div class="text-[10px] text-muted font-mono flex items-center justify-between">
                <span>{{ task.projectName }}</span>
                <span class="text-tertiary">{{ task.priority }}</span>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- Upcoming Tasks Card -->
        <UiCard padding="sm">
          <template #header>
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-secondary" />
              <h3 class="text-xs font-bold text-on-surface uppercase tracking-wider font-mono">Upcoming (Next 7 Days)</h3>
            </div>
          </template>

          <div class="space-y-2">
            <div
              v-for="task in upcomingTasks"
              :key="task.id"
              @click="openTaskDrawer(task)"
              class="p-2.5 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant rounded-lg cursor-pointer transition space-y-1"
            >
              <div class="text-xs font-semibold text-on-surface line-clamp-1">{{ task.title }}</div>
              <div class="flex items-center justify-between text-[10px] font-mono text-muted">
                <span>Due: {{ task.dueDate }}</span>
                <UiBadge variant="neutral" size="sm" class="text-[9px]">{{ task.priority }}</UiBadge>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- TASK DETAIL DRAWER -->
    <UiDrawer
      :open="isDrawerOpen"
      :title="selectedTask?.title || 'Task Detail'"
      @close="isDrawerOpen = false"
    >
      <div v-if="selectedTask" class="space-y-5 text-xs text-on-surface">
        <div>
          <span class="text-[10px] font-mono uppercase text-muted">Project</span>
          <div class="text-sm font-semibold text-primary">{{ selectedTask.projectName }}</div>
        </div>

        <div>
          <span class="text-[10px] font-mono uppercase text-muted">Description</span>
          <p class="text-xs text-on-surface-variant mt-1 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">
            {{ selectedTask.description }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 font-mono">
          <div class="p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant">
            <div class="text-[10px] text-muted">STATUS</div>
            <div class="font-semibold text-primary mt-0.5">{{ selectedTask.status }}</div>
          </div>
          <div class="p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant">
            <div class="text-[10px] text-muted">DUE DATE</div>
            <div class="font-semibold text-tertiary mt-0.5">{{ selectedTask.dueDate }}</div>
          </div>
        </div>

        <div class="space-y-2 pt-3 border-t border-outline-variant">
          <span class="text-[10px] font-mono uppercase text-muted">Update Status</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="st in statusList"
              :key="st"
              @click="handleStatusUpdate(selectedTask.id, st)"
              :class="[
                'px-2.5 py-1 rounded text-xs font-mono transition',
                selectedTask.status === st
                  ? 'bg-primary-container text-on-primary font-bold'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              ]"
            >
              {{ st }}
            </button>
          </div>
        </div>
      </div>
    </UiDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock
} from '@lucide/vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiDrawer from '../../components/ui/UiDrawer.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useTaskStore } from '../../stores/task'
import type { Task, TaskStatus } from '../../types'

const workspaceStore = useWorkspaceStore()
const taskStore = useTaskStore()

const activeView = ref<'month' | 'week' | 'day'>('month')
const viewOptions = ['month', 'week', 'day'] as const
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const statusList: TaskStatus[] = ['Todo', 'In Progress', 'Waiting', 'Review', 'Done', 'Cancelled']

const now = new Date()
const currentMonth = ref(now.getMonth())
const currentYear = ref(now.getFullYear())

const todayDateString = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const isDrawerOpen = ref(false)
const selectedTask = ref<Task | null>(null)

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const currentMonthName = computed(() => monthNames[currentMonth.value])

const loadTasks = () => {
  taskStore.fetchTasksByWorkspace(workspaceStore.currentWorkspaceId)
}

onMounted(() => {
  loadTasks()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadTasks()
})

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const goToToday = () => {
  const d = new Date()
  currentMonth.value = d.getMonth()
  currentYear.value = d.getFullYear()
}

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []

  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const prevM = month === 0 ? 12 : month
    const prevY = month === 0 ? year - 1 : year
    const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayDateString.value,
      tasks: taskStore.tasks.filter((t) => t.dueDate === dateStr)
    })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday = dateStr === todayDateString.value
    days.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: true,
      isToday,
      tasks: taskStore.tasks.filter((t) => t.dueDate === dateStr)
    })
  }

  // Next month padding to fill 35 or 42 cells
  const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const nextM = month === 11 ? 1 : month + 2
    const nextY = month === 11 ? year + 1 : year
    const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      dayNumber: d,
      dateString: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayDateString.value,
      tasks: taskStore.tasks.filter((t) => t.dueDate === dateStr)
    })
  }

  return days
})

const todayTasks = computed(() => {
  return taskStore.tasks.filter((t) => t.dueDate === todayDateString.value)
})

const upcomingTasks = computed(() => {
  return taskStore.tasks.filter((t) => t.dueDate > todayDateString.value).slice(0, 5)
})

const openTaskDrawer = (task: Task) => {
  selectedTask.value = task
  isDrawerOpen.value = true
}

const handleStatusUpdate = async (id: string, status: TaskStatus) => {
  await taskStore.updateTaskStatus(id, status)
  if (selectedTask.value && selectedTask.value.id === id) {
    selectedTask.value.status = status
  }
}
</script>
