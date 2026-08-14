<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#242c27] bg-[#161d19] hover:bg-[#1a211d] transition text-left text-xs font-medium text-[#dde4dd]"
    >
      <div class="flex items-center gap-2.5 overflow-hidden">
        <div class="w-6 h-6 rounded bg-[#10b981]/20 border border-[#10b981]/40 flex items-center justify-center text-[#4edea3] font-bold text-xs shrink-0">
          {{ workspaceStore.currentWorkspace?.name.charAt(0) || 'S' }}
        </div>
        <div class="truncate">
          <div class="font-semibold text-[#dde4dd] truncate">{{ workspaceStore.currentWorkspace?.name }}</div>
          <div class="text-[10px] text-[#86948a] uppercase tracking-wider font-mono">{{ workspaceStore.currentWorkspace?.type }}</div>
        </div>
      </div>
      <ChevronDown class="w-4 h-4 text-[#86948a] shrink-0" />
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      class="absolute left-0 top-full mt-1.5 w-64 bg-[#161d19] border border-[#242c27] rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100"
    >
      <div class="px-2 py-1 text-[10px] font-mono uppercase text-[#86948a]">Switch Workspace</div>
      <button
        v-for="ws in workspaceStore.workspaces"
        :key="ws.id"
        @click="selectWorkspace(ws.id)"
        :class="[
          'w-full flex items-center justify-between p-2 rounded-lg text-xs transition text-left',
          ws.id === workspaceStore.currentWorkspaceId ? 'bg-[#003824] border border-[#10b981]/40 text-[#4edea3]' : 'hover:bg-[#1a211d] text-[#dde4dd]'
        ]"
      >
        <div class="flex items-center gap-2 truncate">
          <div class="w-5 h-5 rounded bg-[#242c27] flex items-center justify-center text-[10px] font-bold">
            {{ ws.name.charAt(0) }}
          </div>
          <span class="truncate font-medium">{{ ws.name }}</span>
        </div>
        <Check v-if="ws.id === workspaceStore.currentWorkspaceId" class="w-3.5 h-3.5 text-[#4edea3]" />
      </button>

      <div class="border-t border-[#242c27] my-1 pt-1">
        <button
          @click="openNewModal = true; isOpen = false"
          class="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-[#4edea3] hover:bg-[#1a211d] font-medium transition"
        >
          <Plus class="w-4 h-4" />
          <span>New Workspace</span>
        </button>
      </div>
    </div>

    <!-- New Workspace Modal -->
    <UiModal :open="openNewModal" title="Create New Workspace" @close="openNewModal = false">
      <div class="space-y-4">
        <UiInput v-model="newWsName" label="Workspace Name" placeholder="e.g. Sandbox Project" required />
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-[#bbcabf]">Workspace Type</label>
          <select v-model="newWsType" class="w-full bg-[#09100c] text-[#dde4dd] border border-[#242c27] rounded-lg h-10 px-3 text-sm outline-none focus:border-[#4edea3]">
            <option value="Personal">Personal</option>
            <option value="Development">Development</option>
            <option value="Business">Business</option>
            <option value="Sandbox">Sandbox</option>
          </select>
        </div>
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openNewModal = false">Cancel</UiButton>
        <UiButton variant="primary" @click="handleCreate">Create Workspace</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, Check, Plus } from '@lucide/vue'
import { useWorkspaceStore } from '../../stores/workspace'
import UiModal from '../ui/UiModal.vue'
import UiInput from '../ui/UiInput.vue'
import UiButton from '../ui/UiButton.vue'
import type { WorkspaceType } from '../../types'

const workspaceStore = useWorkspaceStore()
const isOpen = ref(false)
const openNewModal = ref(false)
const newWsName = ref('')
const newWsType = ref<WorkspaceType>('Personal')

const selectWorkspace = (id: string) => {
  workspaceStore.switchWorkspace(id)
  isOpen.value = false
}

const handleCreate = async () => {
  if (!newWsName.value.trim()) return
  await workspaceStore.createWorkspace({
    name: newWsName.value,
    type: newWsType.value,
    description: 'Workspace buatan pengguna.'
  })
  newWsName.value = ''
  openNewModal.value = false
}
</script>
