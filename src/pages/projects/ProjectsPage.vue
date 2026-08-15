<template>
  <div class="space-y-6">
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Projects Directory</h1>
          <UiBadge variant="info" size="sm" class="font-mono">{{ projectStore.projects.length }} Projects</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">Configure project workspaces, target directory paths, and default assigned workers.</p>
      </div>
      <UiButton size="sm" variant="primary" :icon="Plus" @click="showCreateModal = true">
        New Project
      </UiButton>
    </div>

    <!-- Projects Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UiCard
        v-for="prj in projectStore.projects"
        :key="prj.id"
        hoverable
        @click="$router.push(`/projects/${prj.id}`)"
      >
        <template #header>
          <div class="flex items-center justify-between w-full">
            <span class="font-bold text-sm text-on-surface truncate">{{ prj.name }}</span>
            <UiBadge :variant="prj.status === 'Active' ? 'success' : prj.status === 'Completed' ? 'info' : 'warning'" size="sm">{{ prj.status }}</UiBadge>
          </div>
        </template>
        <p class="text-xs text-muted mb-3 h-9 line-clamp-2">{{ prj.description }}</p>

        <!-- Folder Path & Default Worker -->
        <div class="space-y-1.5 pb-3 mb-3 border-b border-outline-variant/60 text-xs">
          <div class="flex items-center gap-1.5 font-mono text-[11px] text-muted truncate">
            <Folder class="w-3.5 h-3.5 text-primary shrink-0" />
            <span class="text-on-surface truncate">{{ prj.path }}</span>
          </div>
          <div v-if="prj.defaultWorkerName" class="flex items-center gap-1.5 text-[11px] text-muted">
            <Users class="w-3.5 h-3.5 text-secondary shrink-0" />
            <span>Default: <strong class="text-on-surface">{{ prj.defaultWorkerName }}</strong></span>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs font-mono mb-1.5">
          <span class="text-muted">{{ prj.completedTaskCount || 0 }} / {{ prj.taskCount || 0 }} tasks</span>
          <span class="text-primary font-bold">{{ prj.progress }}%</span>
        </div>
        <UiProgress :value="prj.progress" />
      </UiCard>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Plus, Folder, Users } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiProgress from '../../components/ui/UiProgress.vue'
import CreateProjectModal from '../../components/projects/CreateProjectModal.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'

const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const showCreateModal = ref(false)

const loadData = () => {
  projectStore.fetchProjectsByWorkspace(workspaceStore.currentWorkspaceId || 'ws-dev')
}

onMounted(() => {
  loadData()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadData()
})
</script>

