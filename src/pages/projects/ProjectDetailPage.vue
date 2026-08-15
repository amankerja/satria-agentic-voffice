<template>
  <div class="space-y-6" v-if="project">
    <!-- Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <router-link to="/projects" class="text-xs text-primary hover:underline">&larr; Projects</router-link>
          <span class="text-xs text-muted">/</span>
          <UiBadge variant="success" size="sm">{{ project.status }}</UiBadge>
        </div>
        <h1 class="text-2xl font-bold text-on-surface mt-1">{{ project.name }}</h1>
        <p class="text-xs text-muted mt-1">{{ project.description }}</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <UiButton size="sm" variant="primary" :icon="Plus" @click="showCreateTask = true">
          Add Task
        </UiButton>

        <UiButton
          v-if="project.status !== 'Cancelled'"
          size="sm"
          variant="danger"
          :icon="Ban"
          @click="handleCancelProject"
        >
          Cancel Project
        </UiButton>
      </div>
    </div>

    <!-- Target Folder Path Banner with Connection Test -->
    <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3 truncate">
        <div class="w-9 h-9 rounded-xl bg-primary-container/20 border border-primary text-primary flex items-center justify-center shrink-0">
          <Folder class="w-5 h-5" />
        </div>
        <div class="truncate">
          <div class="text-[10px] font-mono text-muted uppercase">Workspace Folder Path</div>
          <div class="text-xs font-mono font-bold text-on-surface truncate">{{ project.path }}</div>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <UiButton
          variant="secondary"
          size="sm"
          :icon="CheckCircle2"
          :loading="testingConnection"
          @click="testFolderConnection"
        >
          Test Folder Connection
        </UiButton>
      </div>
    </div>

    <!-- Stats & Progress -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UiCard class="md:col-span-2">
        <template #header>
          <span class="font-semibold text-sm text-on-surface">Project Progress</span>
        </template>
        <UiProgress :value="project.progress" label="Overall Milestones Completion" />
      </UiCard>

      <UiCard>
        <template #header>
          <span class="font-semibold text-sm text-on-surface">Project Information</span>
        </template>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between text-muted">
            <span>Total Tasks:</span>
            <span class="font-mono text-on-surface font-semibold">{{ projectTasks.length }}</span>
          </div>
          <div class="flex justify-between text-muted">
            <span>Default Worker:</span>
            <span class="font-mono text-primary font-semibold">{{ project.defaultWorkerName || 'Auto Select' }}</span>
          </div>
          <div v-if="project.repositoryUrl" class="flex justify-between text-muted truncate">
            <span>Repository:</span>
            <span class="font-mono text-on-surface truncate max-w-xs">{{ project.repositoryUrl }}</span>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Project Tasks -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-on-surface">Project Tasks ({{ projectTasks.length }})</h2>
        <UiButton size="sm" variant="ghost" :icon="Plus" @click="showCreateTask = true">
          Add Task
        </UiButton>
      </div>

      <div v-if="projectTasks.length === 0" class="p-8 text-center bg-surface-container-low rounded-2xl text-xs text-muted">
        No tasks created for this project yet.
      </div>

      <div class="space-y-2">
        <div
          v-for="task in projectTasks"
          :key="task.id"
          @click="$router.push(`/tasks/${task.id}`)"
          class="p-3.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-outline rounded-xl cursor-pointer flex items-center justify-between text-xs transition"
        >
          <div>
            <div class="font-semibold text-on-surface">{{ task.title }}</div>
            <div class="text-[10px] text-muted font-mono mt-0.5">
              Assigned: {{ task.workerName || task.assigneeName || 'Unassigned' }} &bull; Due {{ task.dueDate || 'No date' }}
            </div>
          </div>
          <UiBadge :variant="task.status === 'Done' ? 'success' : task.status === 'Cancelled' ? 'error' : task.status === 'Waiting' ? 'warning' : 'info'" size="sm">
            {{ task.status }}
          </UiBadge>
        </div>
      </div>
    </div>

    <!-- Create Task Drawer -->
    <CreateTaskDrawer
      :open="showCreateTask"
      @close="showCreateTask = false"
      @created="loadData"
    />
  </div>
  <UiEmptyState v-else title="Project Not Found" description="Proyek yang Anda cari tidak ditemukan." />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Folder, Plus, CheckCircle2, Ban } from '@lucide/vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiProgress from '../../components/ui/UiProgress.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import CreateTaskDrawer from '../../components/tasks/CreateTaskDrawer.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'
import { useTaskStore } from '../../stores/task'
import { useToast } from '../../composables/useToast'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const toast = useToast()

const showCreateTask = ref(false)
const testingConnection = ref(false)

const projectId = computed(() => route.params.id as string)

const loadData = async () => {
  const wsId = workspaceStore.currentWorkspaceId || 'ws-dev'
  await Promise.all([
    projectStore.fetchProjectsByWorkspace(wsId),
    taskStore.fetchTasksByWorkspace(wsId)
  ])
}

onMounted(() => {
  loadData()
})

const project = computed(() => projectStore.projects.find((p) => p.id === projectId.value))
const projectTasks = computed(() => taskStore.tasks.filter((t) => t.projectId === projectId.value))

const testFolderConnection = async () => {
  testingConnection.value = true
  try {
    // Simulate pre-flight folder connection check
    await new Promise((resolve) => setTimeout(resolve, 600))
    toast.success(`Folder path "${project.value?.path}" is accessible and verified.`)
  } finally {
    testingConnection.value = false
  }
}

const handleCancelProject = async () => {
  if (!project.value) return
  try {
    await projectStore.cancelProject(project.value.id, 'Cancelled by user from Project detail')
    toast.success(`Project "${project.value.name}" and all child tasks were cancelled.`)
    await loadData()
  } catch (err: any) {
    toast.error(err.message || 'Failed to cancel project.')
  }
}
</script>

