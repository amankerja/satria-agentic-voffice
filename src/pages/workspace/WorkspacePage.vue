<template>
  <div class="space-y-6">
    <!-- Workspace Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-bold text-on-surface">{{ workspaceStore.currentWorkspace?.name }}</h1>
          <UiBadge variant="info">{{ workspaceStore.currentWorkspace?.type }}</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">{{ workspaceStore.currentWorkspace?.description }}</p>
      </div>
      <UiButton size="sm" variant="secondary" :icon="Settings" @click="$router.push('/settings')">
        Workspace Settings
      </UiButton>
    </div>

    <!-- Summary Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <UiCard padding="sm">
        <div class="text-xs text-muted font-medium">Projects</div>
        <div class="text-xl font-bold text-primary font-mono mt-1">{{ projectStore.projects.length }}</div>
      </UiCard>
      <UiCard padding="sm">
        <div class="text-xs text-muted font-medium">Active Tasks</div>
        <div class="text-xl font-bold text-secondary font-mono mt-1">{{ taskStore.tasks.length }}</div>
      </UiCard>
      <UiCard padding="sm">
        <div class="text-xs text-muted font-medium">Files</div>
        <div class="text-xl font-bold text-on-surface font-mono mt-1">28</div>
      </UiCard>
      <UiCard padding="sm">
        <div class="text-xs text-muted font-medium">Contributors</div>
        <div class="text-xl font-bold text-tertiary font-mono mt-1">4</div>
      </UiCard>
    </div>

    <!-- Workspace Projects & Tasks Section -->
    <div class="space-y-4">
      <h2 class="text-base font-semibold text-on-surface">Workspace Projects</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UiCard v-for="prj in projectStore.projects" :key="prj.id" hoverable @click="$router.push(`/projects/${prj.id}`)">
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="font-semibold text-sm text-on-surface">{{ prj.name }}</span>
              <UiBadge variant="success" size="sm">{{ prj.status }}</UiBadge>
            </div>
          </template>
          <p class="text-xs text-muted mb-3 line-clamp-2">{{ prj.description }}</p>
          <UiProgress :value="prj.progress" />
        </UiCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { Settings } from '@lucide/vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiProgress from '../../components/ui/UiProgress.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'
import { useTaskStore } from '../../stores/task'

const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const loadData = () => {
  const wsId = workspaceStore.currentWorkspaceId
  projectStore.fetchProjectsByWorkspace(wsId)
  taskStore.fetchTasksByWorkspace(wsId)
}

onMounted(() => {
  loadData()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadData()
})
</script>
