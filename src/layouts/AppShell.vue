<template>
  <div class="min-h-screen bg-surface text-on-surface flex flex-col font-sans">
    <!-- Subtle Offline Notification Banner (PRD Section 46) -->
    <UiOfflineBanner />

    <!-- Sidebar for Desktop -->
    <Sidebar />

    <!-- Main Outer Wrapper -->
    <div :class="['flex-1 flex flex-col transition-all duration-200', isCollapsed ? 'md:ml-17' : 'md:ml-62.5']">
      <!-- Topbar -->
      <Topbar @openSearch="showSearchModal = true" @openQuickCreate="showQuickCreateModal = true" />

      <!-- Main Page Content -->
      <main class="flex-1 p-4 md:p-6 pb-20 md:pb-6 max-w-[1600px] w-full mx-auto">
        <slot />
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <BottomNav />

    <!-- Global Command Palette (Ctrl+K) -->
    <CommandPalette :open="showSearchModal" @close="showSearchModal = false" />

    <!-- Global Quick Create Modal -->
    <UiModal :open="showQuickCreateModal" title="Quick Create Item" @close="showQuickCreateModal = false">
      <div class="space-y-3">
        <button @click="showQuickCreateModal = false; $router.push('/tasks')" class="w-full p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-lg text-left text-xs font-semibold text-primary transition flex items-center justify-between">
          <span>+ Create New Task</span>
          <span class="text-[10px] font-mono text-muted">Tasks Center</span>
        </button>
        <button @click="showQuickCreateModal = false; $router.push('/projects')" class="w-full p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-lg text-left text-xs font-semibold text-secondary transition flex items-center justify-between">
          <span>+ Create New Project</span>
          <span class="text-[10px] font-mono text-muted">Projects Directory</span>
        </button>
        <button @click="showQuickCreateModal = false; $router.push('/files')" class="w-full p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-lg text-left text-xs font-semibold text-tertiary transition flex items-center justify-between">
          <span>+ Upload Document / File</span>
          <span class="text-[10px] font-mono text-muted">Files Manager</span>
        </button>
      </div>
    </UiModal>

    <!-- Global Toast Notification -->
    <UiToast
      v-if="toastState.visible"
      :message="toastState.message"
      :description="toastState.description"
      :variant="toastState.variant"
    />

    <!-- Global Floating Active Agent Run Pill -->
    <ActiveRunPill />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from '../components/layout/Sidebar.vue'
import Topbar from '../components/layout/Topbar.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import CommandPalette from '../components/layout/CommandPalette.vue'
import ActiveRunPill from '../components/layout/ActiveRunPill.vue'
import UiModal from '../components/ui/UiModal.vue'
import UiToast from '../components/ui/UiToast.vue'
import UiOfflineBanner from '../components/ui/UiOfflineBanner.vue'
import { useWorkspaceStore } from '../stores/workspace'
import { useProjectStore } from '../stores/project'
import { useTaskStore } from '../stores/task'
import { useNotificationStore } from '../stores/notification'
import { useFileStore } from '../stores/file'
import { useActivityStore } from '../stores/activity'
import { useThemeStore } from '../stores/theme'
import { useToast } from '../composables/useToast'

const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const notificationStore = useNotificationStore()
const fileStore = useFileStore()
const activityStore = useActivityStore()
const themeStore = useThemeStore()
const { toastState } = useToast()

const isCollapsed = ref(false)
const showSearchModal = ref(false)
const showQuickCreateModal = ref(false)

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    showSearchModal.value = !showSearchModal.value
  }
}

onMounted(() => {
  themeStore.initTheme()
  workspaceStore.fetchWorkspaces().then(() => {
    const wsId = workspaceStore.currentWorkspaceId
    projectStore.fetchProjectsByWorkspace(wsId)
    taskStore.fetchTasksByWorkspace(wsId)
    notificationStore.fetchNotificationsByWorkspace(wsId)
    fileStore.fetchFilesByWorkspace(wsId)
    activityStore.fetchActivitiesByWorkspace(wsId)
  })
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
