<template>
  <div class="space-y-6">
    <div class="border-b border-[#242c27] pb-5 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[#dde4dd]">Projects Directory</h1>
        <p class="text-xs text-[#86948a] mt-1">Daftar proyek di {{ workspaceStore.currentWorkspace?.name }}</p>
      </div>
      <UiButton size="sm" variant="primary" :icon="Plus" @click="openModal = true">
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
            <span class="font-semibold text-sm text-[#dde4dd] truncate">{{ prj.name }}</span>
            <UiBadge :variant="prj.status === 'On Track' ? 'success' : 'warning'" size="sm">{{ prj.status }}</UiBadge>
          </div>
        </template>
        <p class="text-xs text-[#86948a] mb-4 h-10 line-clamp-2">{{ prj.description }}</p>
        <UiProgress :value="prj.progress" />
      </UiCard>
    </div>

    <!-- Modal Create Project -->
    <UiModal :open="openModal" title="Create New Project" @close="openModal = false">
      <div class="space-y-3">
        <UiInput v-model="name" label="Project Name" placeholder="e.g. Analytics Platform" required />
        <UiInput v-model="desc" label="Description" placeholder="Ringkasan proyek..." />
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openModal = false">Cancel</UiButton>
        <UiButton variant="primary" @click="handleCreate">Save Project</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Plus } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiProgress from '../../components/ui/UiProgress.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiInput from '../../components/ui/UiInput.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'

const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const openModal = ref(false)
const name = ref('')
const desc = ref('')

const loadData = () => {
  projectStore.fetchProjectsByWorkspace(workspaceStore.currentWorkspaceId)
}

onMounted(() => {
  loadData()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadData()
})

const handleCreate = async () => {
  if (!name.value.trim()) return
  await projectStore.createProject({
    workspaceId: workspaceStore.currentWorkspaceId,
    name: name.value,
    description: desc.value || 'Proyek baru.',
    status: 'On Track',
    contributorsCount: 1
  })
  name.value = ''
  desc.value = ''
  openModal.value = false
}
</script>
