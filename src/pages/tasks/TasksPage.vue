<template>
  <div class="space-y-6">
    <!-- Header Controls & View Switcher -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Tasks Command Center</h1>
          <UiBadge variant="info" size="sm" class="font-mono">{{ filteredTasks.length }} Tasks</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">Manage, assign, and track autonomous workforce task lifecycles.</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View Switcher -->
        <div role="tablist" aria-label="Task layout view" class="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
          <button
            role="tab"
            :aria-selected="currentView === 'list'"
            @click="currentView = 'list'"
            :class="['p-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5', currentView === 'list' ? 'bg-surface-container-high text-primary font-bold' : 'text-muted hover:text-on-surface']"
            aria-label="List View"
          >
            <List class="w-4 h-4" aria-hidden="true" />
            <span class="hidden sm:inline">List</span>
          </button>
          <button
            role="tab"
            :aria-selected="currentView === 'board'"
            @click="currentView = 'board'"
            :class="['p-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5', currentView === 'board' ? 'bg-surface-container-high text-primary font-bold' : 'text-muted hover:text-on-surface']"
            aria-label="Board View"
          >
            <Kanban class="w-4 h-4" aria-hidden="true" />
            <span class="hidden sm:inline">Board</span>
          </button>
        </div>

        <UiButton size="sm" variant="primary" :icon="Plus" @click="showCreateDrawer = true">
          New Task
        </UiButton>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
      <div role="tablist" aria-label="Task status filters" class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="st in ['All', ...columns, 'Cancelled']"
          :key="st"
          role="tab"
          :aria-selected="statusFilter === st"
          :aria-label="`Filter ${st}`"
          @click="statusFilter = st"
          :class="[
            'px-2.5 py-1 rounded text-xs font-mono transition whitespace-nowrap',
            statusFilter === st ? 'bg-surface-container-high text-primary font-bold border border-outline' : 'text-muted hover:text-on-surface'
          ]"
        >
          {{ st }}
        </button>
      </div>

      <div class="relative w-full sm:w-60">
        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          v-model="searchQuery"
          type="text"
          aria-label="Search task by title"
          placeholder="Search task title..."
          class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-2.5 py-1 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
        />
      </div>
    </div>

    <!-- LIST VIEW -->
    <div v-if="currentView === 'list'" class="space-y-2">
      <div v-if="filteredTasks.length === 0" class="p-12 text-center bg-surface-container-low rounded-2xl text-xs text-muted">
        No tasks match the active filter criteria.
      </div>
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="p-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-outline rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-sm"
      >
        <div class="flex items-center gap-3 truncate">
          <div class="p-1 -m-1" @click.stop>
            <input
              type="checkbox"
              :checked="task.status === 'Done'"
              @change="toggleDone(task.id, task.status)"
              class="w-4 h-4 rounded border-outline bg-surface-container-lowest text-primary focus:ring-0 cursor-pointer"
            />
          </div>
          <div class="truncate">
            <div class="flex items-center gap-2">
              <router-link
                :to="`/tasks/${task.id}`"
                :class="['text-xs font-semibold text-on-surface hover:text-primary transition truncate', task.status === 'Done' ? 'line-through opacity-50' : '']"
              >
                {{ task.title }}
              </router-link>
              <span
                v-if="task.type === 'recurring_instance'"
                class="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20"
              >
                Scheduled
              </span>
            </div>
            <div class="text-[10px] text-muted font-mono mt-0.5 flex items-center gap-2">
              <span>{{ task.projectName }}</span>
              <span>&bull;</span>
              <span class="text-secondary font-medium">{{ task.workerName || task.assigneeName || 'Unassigned' }}</span>
              <span>&bull;</span>
              <span>Due {{ task.dueDate || 'No Date' }}</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <UiBadge :variant="task.priority === 'High' || task.priority === 'Urgent' ? 'warning' : 'neutral'" size="sm">{{ task.priority }}</UiBadge>
          <UiBadge :variant="task.status === 'Done' ? 'success' : task.status === 'Cancelled' ? 'error' : task.status === 'Waiting' ? 'warning' : 'info'" size="sm">{{ task.status }}</UiBadge>
          <router-link :to="`/tasks/${task.id}`" class="p-1 rounded-lg text-muted hover:text-on-surface hover:bg-surface-container-high transition">
            <ChevronRight class="w-4 h-4" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- BOARD / KANBAN VIEW -->
    <div v-else-if="currentView === 'board'" class="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
      <div v-for="status in columns" :key="status" class="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant min-w-60 space-y-3">
        <div class="flex items-center justify-between font-mono text-xs font-semibold text-on-surface border-b border-outline-variant pb-2">
          <span>{{ status }}</span>
          <span class="text-muted font-normal">({{ tasksByStatus(status).length }})</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="task in tasksByStatus(status)"
            :key="task.id"
            class="p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-outline rounded-lg space-y-2 transition shadow-sm"
          >
            <router-link :to="`/tasks/${task.id}`" class="text-xs font-semibold text-on-surface hover:text-primary transition line-clamp-2 block">
              {{ task.title }}
            </router-link>
            <div class="text-[10px] text-muted font-mono">{{ task.projectName }}</div>
            <div class="flex items-center justify-between pt-1 border-t border-outline-variant">
              <span class="text-[10px] text-on-surface-variant">{{ task.workerName || task.assigneeName || 'Unassigned' }}</span>
              <UiBadge :variant="task.priority === 'High' || task.priority === 'Urgent' ? 'warning' : 'neutral'" size="sm">{{ task.priority }}</UiBadge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Task Drawer -->
    <CreateTaskDrawer
      :open="showCreateDrawer"
      @close="showCreateDrawer = false"
      @created="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, List, Kanban, Search, ChevronRight } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import CreateTaskDrawer from '../../components/tasks/CreateTaskDrawer.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'
import { useTaskStore } from '../../stores/task'
import { useToast } from '../../composables/useToast'
import type { TaskStatus } from '../../types'

const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const toast = useToast()

const currentView = ref<'list' | 'board'>('list')
const showCreateDrawer = ref(false)
const statusFilter = ref('All')
const searchQuery = ref('')
const columns: TaskStatus[] = ['Todo', 'In Progress', 'Waiting', 'Review', 'Done']

const loadData = async () => {
  const wsId = workspaceStore.currentWorkspaceId || 'ws-dev'
  await projectStore.fetchProjectsByWorkspace(wsId)
  await taskStore.fetchTasksByWorkspace(wsId)
}

onMounted(() => {
  loadData()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadData()
})

const filteredTasks = computed(() => {
  return taskStore.tasks.filter((t) => {
    const matchStatus =
      statusFilter.value === 'All' ||
      t.status === statusFilter.value
    const matchSearch =
      searchQuery.value.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchStatus && matchSearch
  })
})

const tasksByStatus = (status: TaskStatus) => {
  return filteredTasks.value.filter((t) => t.status === status)
}

const toggleDone = async (id: string, currentStatus: TaskStatus) => {
  const newStatus: TaskStatus = currentStatus === 'Done' ? 'Todo' : 'Done'
  await taskStore.updateTaskStatus(id, newStatus)
  toast.success(newStatus === 'Done' ? 'Task Completed' : 'Task reopened as Todo')
}
</script>

