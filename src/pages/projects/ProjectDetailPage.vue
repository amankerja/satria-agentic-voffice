<template>
  <div class="space-y-6" v-if="project">
    <!-- Header -->
    <div class="border-b border-[#242c27] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <router-link to="/projects" class="text-xs text-[#4edea3] hover:underline">&larr; Projects</router-link>
          <span class="text-xs text-[#86948a]">/</span>
          <UiBadge variant="success" size="sm">{{ project.status }}</UiBadge>
        </div>
        <h1 class="text-2xl font-bold text-[#dde4dd] mt-1">{{ project.name }}</h1>
        <p class="text-xs text-[#86948a] mt-1">{{ project.description }}</p>
      </div>
      <div class="flex items-center gap-2">
        <UiButton size="sm" variant="secondary" :icon="Folder">Overview</UiButton>
      </div>
    </div>

    <!-- Stats & Progress -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UiCard class="md:col-span-2">
        <template #header>
          <span class="font-semibold text-sm text-[#dde4dd]">Project Progress</span>
        </template>
        <UiProgress :value="project.progress" label="Overall Milestones Completion" />
      </UiCard>

      <UiCard>
        <template #header>
          <span class="font-semibold text-sm text-[#dde4dd]">Project Metrics</span>
        </template>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between text-[#86948a]">
            <span>Total Tasks:</span>
            <span class="font-mono text-[#dde4dd] font-semibold">{{ projectTasks.length }}</span>
          </div>
          <div class="flex justify-between text-[#86948a]">
            <span>Contributors:</span>
            <span class="font-mono text-[#4edea3] font-semibold">{{ project.contributorsCount }}</span>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Milestones & Project Tasks -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <h2 class="text-base font-semibold text-[#dde4dd]">Project Tasks</h2>
        <div class="space-y-2">
          <div
            v-for="task in projectTasks"
            :key="task.id"
            @click="$router.push(`/tasks?id=${task.id}`)"
            class="p-3 bg-[#161d19] hover:bg-[#1a211d] border border-[#242c27] rounded-lg cursor-pointer flex items-center justify-between text-xs transition"
          >
            <div class="font-medium text-[#dde4dd] truncate">{{ task.title }}</div>
            <UiBadge :variant="task.status === 'Done' ? 'success' : 'info'" size="sm">{{ task.status }}</UiBadge>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <h2 class="text-base font-semibold text-[#dde4dd]">Milestones</h2>
        <UiCard>
          <div class="space-y-3">
            <div v-for="m in project.milestones" :key="m.id" class="flex items-center justify-between text-xs border-b border-[#242c27] pb-2 last:border-0 last:pb-0">
              <span :class="m.completed ? 'line-through text-[#86948a]' : 'text-[#dde4dd] font-medium'">{{ m.title }}</span>
              <UiBadge :variant="m.completed ? 'success' : 'neutral'" size="sm">{{ m.completed ? 'Done' : m.dueDate }}</UiBadge>
            </div>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
  <UiEmptyState v-else title="Project Not Found" description="Proyek yang Anda cari tidak ditemukan." />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Folder } from '@lucide/vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiProgress from '../../components/ui/UiProgress.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'
import { useTaskStore } from '../../stores/task'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()

const projectId = computed(() => route.params.id as string)

onMounted(() => {
  const wsId = workspaceStore.currentWorkspaceId
  projectStore.fetchProjectsByWorkspace(wsId)
  taskStore.fetchTasksByWorkspace(wsId)
})

const project = computed(() => projectStore.projects.find((p) => p.id === projectId.value))
const projectTasks = computed(() => taskStore.tasks.filter((t) => t.projectId === projectId.value))
</script>
