<template>
  <div class="space-y-6">
    <!-- Header Controls & View Switcher -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Tasks Command Center</h1>
          <UiBadge variant="info" size="sm" class="font-mono">{{ filteredTasks.length }} Tasks</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">Kelola seluruh unit pekerjaan di {{ workspaceStore.currentWorkspace?.name }}</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View Switcher -->
        <div class="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
          <button
            @click="currentView = 'list'"
            :class="['p-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5', currentView === 'list' ? 'bg-surface-container-high text-primary' : 'text-muted hover:text-on-surface']"
            aria-label="List View"
          >
            <List class="w-4 h-4" />
            <span class="hidden sm:inline">List</span>
          </button>
          <button
            @click="currentView = 'board'"
            :class="['p-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5', currentView === 'board' ? 'bg-surface-container-high text-primary' : 'text-muted hover:text-on-surface']"
            aria-label="Board View"
          >
            <Kanban class="w-4 h-4" />
            <span class="hidden sm:inline">Board</span>
          </button>
        </div>

        <UiButton size="sm" variant="primary" :icon="Plus" @click="openModal = true">
          New Task
        </UiButton>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="st in ['All', ...columns]"
          :key="st"
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
        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search task title..."
          class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-2.5 py-1 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
        />
      </div>
    </div>

    <!-- LIST VIEW -->
    <div v-if="currentView === 'list'" class="space-y-2">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        @click="selectedTask = task; openDrawer = true"
        class="p-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-outline rounded-xl cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition shadow-sm"
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
            <div :class="['text-xs font-semibold text-on-surface truncate', task.status === 'Done' ? 'line-through opacity-50' : '']">
              {{ task.title }}
            </div>
            <div class="text-[10px] text-muted font-mono mt-0.5">{{ task.projectName }} &bull; Due {{ task.dueDate }}</div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <UiBadge :variant="task.priority === 'High' || task.priority === 'Urgent' ? 'warning' : 'neutral'" size="sm">{{ task.priority }}</UiBadge>
          <UiBadge :variant="task.status === 'Done' ? 'success' : task.status === 'Blocked' ? 'error' : 'info'" size="sm">{{ task.status }}</UiBadge>
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
            @click="selectedTask = task; openDrawer = true"
            class="p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-outline rounded-lg cursor-pointer space-y-2 transition shadow-sm"
          >
            <div class="text-xs font-semibold text-on-surface line-clamp-2">{{ task.title }}</div>
            <div class="text-[10px] text-muted font-mono">{{ task.projectName }}</div>
            <div class="flex items-center justify-between pt-1 border-t border-outline-variant">
              <span class="text-[10px] text-on-surface-variant">{{ task.assigneeName }}</span>
              <UiBadge :variant="task.priority === 'High' || task.priority === 'Urgent' ? 'warning' : 'neutral'" size="sm">{{ task.priority }}</UiBadge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Detail Drawer -->
    <UiDrawer :open="openDrawer" :title="selectedTask?.title || 'Task Detail'" @close="openDrawer = false">
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
            <div class="text-[10px] text-muted">PRIORITY</div>
            <div class="font-semibold text-tertiary mt-0.5">{{ selectedTask.priority }}</div>
          </div>
        </div>

        <!-- Phase 2: Digital Workforce Assignment & Execution Section -->
        <div class="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono text-muted uppercase">Digital Workforce Assignment</span>
            <UiBadge v-if="selectedTask.assigneeName" variant="success" size="sm">Assigned</UiBadge>
            <UiBadge v-else variant="neutral" size="sm">Unassigned</UiBadge>
          </div>

          <div v-if="selectedTask.assigneeName" class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 truncate">
              <img
                v-if="selectedTask.assigneeAvatar"
                :src="selectedTask.assigneeAvatar"
                :alt="selectedTask.assigneeName"
                class="w-7 h-7 rounded-full object-cover border border-outline"
              />
              <div class="truncate">
                <div class="text-xs font-bold text-on-surface truncate">{{ selectedTask.assigneeName }}</div>
                <div class="text-[10px] text-muted font-mono">Assigned Personnel</div>
              </div>
            </div>
            <UiButton size="sm" variant="secondary" @click="openAssignmentDrawer = true">
              Reassign
            </UiButton>
          </div>

          <div v-else class="flex items-center justify-between gap-2">
            <span class="text-xs text-muted">No employee assigned yet</span>
            <UiButton size="sm" variant="primary" @click="openAssignmentDrawer = true">
              Assign Employee
            </UiButton>
          </div>

          <div v-if="selectedTask.activeRunId" class="pt-2 border-t border-outline-variant flex items-center justify-between text-xs">
            <span class="text-[10px] font-mono text-primary flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Active Execution Run: {{ selectedTask.activeRunId }}
            </span>
            <router-link :to="`/runs/${selectedTask.activeRunId}`" class="text-primary hover:underline text-[11px] font-mono">
              Inspect Live Run &rarr;
            </router-link>
          </div>
        </div>

        <!-- Interactive Checklist Section -->
        <div v-if="selectedTask.checklist && selectedTask.checklist.length > 0" class="space-y-2 pt-2 border-t border-outline-variant">
          <span class="text-[10px] font-mono uppercase text-muted">Checklist ({{ selectedTask.checklist.filter(c => c.completed).length }}/{{ selectedTask.checklist.length }})</span>
          <div class="space-y-1.5">
            <div
              v-for="chk in selectedTask.checklist"
              :key="chk.id"
              @click="toggleChecklist(chk)"
              class="flex items-center gap-2 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant hover:border-outline cursor-pointer transition"
            >
              <input
                type="checkbox"
                :checked="chk.completed"
                class="w-3.5 h-3.5 rounded border-outline bg-surface-container-low text-primary cursor-pointer"
                @click.stop="toggleChecklist(chk)"
              />
              <span :class="['text-xs text-on-surface', chk.completed ? 'line-through opacity-50' : '']">{{ chk.title }}</span>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="space-y-2 pt-2 border-t border-outline-variant">
          <span class="text-[10px] font-mono uppercase text-muted">Activity Comments</span>
          <div v-if="selectedTask.comments && selectedTask.comments.length > 0" class="space-y-2">
            <div v-for="c in selectedTask.comments" :key="c.id" class="p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant space-y-1">
              <div class="flex items-center justify-between text-[10px] font-mono text-muted">
                <span class="text-on-surface font-semibold">{{ c.authorName }}</span>
                <span>{{ c.createdAt }}</span>
              </div>
              <p class="text-xs text-on-surface-variant">{{ c.content }}</p>
            </div>
          </div>
          <div class="flex gap-2 pt-1">
            <input
              v-model="newCommentText"
              type="text"
              placeholder="Write a comment..."
              @keyup.enter="handleAddComment"
              class="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            <UiButton size="sm" variant="secondary" @click="handleAddComment">Post</UiButton>
          </div>
        </div>

        <div class="space-y-2 pt-3 border-t border-outline-variant">
          <span class="text-[10px] font-mono uppercase text-muted">Update Task Status</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="st in columns"
              :key="st"
              @click="updateStatus(selectedTask.id, st)"
              :class="['px-2.5 py-1 rounded text-xs font-mono transition', selectedTask.status === st ? 'bg-primary-container text-on-primary font-bold' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface']"
            >
              {{ st }}
            </button>
          </div>
        </div>
      </div>
    </UiDrawer>

    <!-- Modal Create Task -->
    <UiModal :open="openModal" title="Create New Task" @close="openModal = false">
      <div class="space-y-3">
        <UiInput v-model="title" label="Task Title" placeholder="e.g. Implement API Endpoint" required />
        <UiInput v-model="projectName" label="Project Name" placeholder="e.g. CRM SaaS Backend Engine" />
        <UiInput v-model="description" label="Description" placeholder="Brief details about the task..." />
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openModal = false">Cancel</UiButton>
        <UiButton variant="primary" @click="handleCreate">Save Task</UiButton>
      </template>
    </UiModal>

    <!-- Phase 2: Assignment Drawer -->
    <AssignmentDrawer
      v-model="openAssignmentDrawer"
      :task="selectedTask"
      @assigned="handleTaskAssigned"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, List, Kanban, Search } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiDrawer from '../../components/ui/UiDrawer.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiInput from '../../components/ui/UiInput.vue'
import AssignmentDrawer from '../../components/workforce/AssignmentDrawer.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useTaskStore } from '../../stores/task'
import { useToast } from '../../composables/useToast'
import type { Task, TaskStatus, ChecklistItem, TaskAssignment } from '../../types'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const taskStore = useTaskStore()
const toast = useToast()

const currentView = ref<'list' | 'board'>('list')
const openModal = ref(false)
const openDrawer = ref(false)
const openAssignmentDrawer = ref(false)
const selectedTask = ref<Task | null>(null)

const handleTaskAssigned = (assignment: TaskAssignment) => {
  if (selectedTask.value && selectedTask.value.id === assignment.taskId) {
    selectedTask.value.assigneeName = assignment.employeeName
    selectedTask.value.assigneeAvatar = assignment.employeeAvatar
  }
  taskStore.fetchTasksByWorkspace(workspaceStore.currentWorkspaceId)
}

const title = ref('')
const projectName = ref('')
const description = ref('')
const newCommentText = ref('')
const statusFilter = ref('All')
const searchQuery = ref('')

const columns: TaskStatus[] = ['Backlog', 'In Progress', 'Blocked', 'Done']

const loadData = () => {
  taskStore.fetchTasksByWorkspace(workspaceStore.currentWorkspaceId)
  if (route.query.id) {
    const t = taskStore.tasks.find((item) => item.id === route.query.id)
    if (t) {
      selectedTask.value = t
      openDrawer.value = true
    }
  }
}

onMounted(() => {
  loadData()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadData()
})

const filteredTasks = computed(() => {
  return taskStore.tasks.filter((t) => {
    const matchStatus = statusFilter.value === 'All' || t.status === statusFilter.value
    const matchSearch = searchQuery.value.trim() === '' || t.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchStatus && matchSearch
  })
})

const tasksByStatus = (status: TaskStatus) => {
  return filteredTasks.value.filter((t) => t.status === status)
}

const toggleDone = async (id: string, currentStatus: TaskStatus) => {
  const newStatus = currentStatus === 'Done' ? 'In Progress' : 'Done'
  await taskStore.updateTaskStatus(id, newStatus)
  toast.show(newStatus === 'Done' ? 'Task Completed' : 'Task In Progress', undefined, 'success')
}

const updateStatus = async (id: string, status: TaskStatus) => {
  await taskStore.updateTaskStatus(id, status)
  if (selectedTask.value && selectedTask.value.id === id) {
    selectedTask.value.status = status
  }
  toast.show(`Status updated to ${status}`, undefined, 'info')
}

const toggleChecklist = (chk: ChecklistItem) => {
  chk.completed = !chk.completed
  toast.show(chk.completed ? 'Checklist item resolved' : 'Checklist item reopened', undefined, 'info', 1500)
}

const handleAddComment = () => {
  if (!newCommentText.value.trim() || !selectedTask.value) return
  if (!selectedTask.value.comments) {
    selectedTask.value.comments = []
  }
  selectedTask.value.comments.push({
    id: `c-${Date.now()}`,
    authorName: 'Satria Utama',
    content: newCommentText.value,
    createdAt: 'Just now'
  })
  newCommentText.value = ''
  toast.show('Comment posted', undefined, 'success', 2000)
}

const handleCreate = async () => {
  if (!title.value.trim()) return
  await taskStore.createTask({
    workspaceId: workspaceStore.currentWorkspaceId,
    projectId: 'prj-satria-ui',
    projectName: projectName.value || 'SATRIA AI Workforce UI',
    title: title.value,
    description: description.value || 'Task baru dari Task Command Center.',
    status: 'In Progress',
    priority: 'Medium',
    assigneeName: 'Satria Utama',
    dueDate: '2026-08-14',
    tags: ['TaskCenter']
  })
  title.value = ''
  projectName.value = ''
  description.value = ''
  openModal.value = false
  toast.show('Task Created Successfully', 'Unit kerja baru telah ditambahkan ke workspace.', 'success')
}
</script>
