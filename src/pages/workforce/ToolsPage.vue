<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Workforce Tool Registry</h1>
          <UiBadge variant="info" size="sm" class="font-mono">{{ filteredTools.length }} Tools</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Katalog perlengkapan alat kerja digital dan permission access yang dialokasikan ke employee
        </p>
      </div>

      <UiButton size="sm" variant="primary" :icon="Plus" @click="openAddModal = true">
        Register New Tool
      </UiButton>
    </div>

    <!-- Filter & Search Bar -->
    <div class="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <!-- Category Filter Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            v-for="cat in ['All', ...categories]"
            :key="cat"
            @click="selectedCategory = cat"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap',
              selectedCategory === cat
                ? 'bg-surface-container-high text-primary font-bold border border-outline'
                : 'text-muted hover:text-on-surface hover:bg-surface-container'
            ]"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Permission Level & Search -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <select
            v-model="selectedPermission"
            class="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="All">All Permissions</option>
            <option value="read">Read-Only</option>
            <option value="write">Read & Write</option>
            <option value="admin">Admin Level</option>
          </select>

          <div class="relative w-full sm:w-60">
            <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search tool name, category..."
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <UiEmptyState
      v-if="filteredTools.length === 0"
      title="No tools found"
      description="Tidak ada tool yang cocok dengan filter atau pencarian Anda."
    >
      <UiButton variant="secondary" size="sm" @click="resetFilters">
        Reset Filters
      </UiButton>
    </UiEmptyState>

    <!-- Tools Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="tool in filteredTools"
        :key="tool.id"
        class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl p-4.5 space-y-3.5 transition shadow-sm flex flex-col justify-between"
      >
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-surface-container-high border border-outline flex items-center justify-center text-secondary">
                <Wrench class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-xs font-bold text-on-surface">{{ tool.name }}</h3>
                <span class="text-[10px] font-mono text-muted">{{ tool.category }}</span>
              </div>
            </div>

            <UiBadge
              :variant="tool.permissionLevel === 'admin' ? 'warning' : tool.permissionLevel === 'write' ? 'info' : 'neutral'"
              size="sm"
              class="font-mono text-[9px] uppercase"
            >
              {{ tool.permissionLevel }}
            </UiBadge>
          </div>

          <p class="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {{ tool.description }}
          </p>
        </div>

        <!-- Tool Footer -->
        <div class="pt-3 border-t border-outline-variant flex items-center justify-between text-xs font-mono">
          <span class="text-[10px] text-muted">
            Used by <strong class="text-primary">{{ getUsedByCount(tool.id) }}</strong> personnel
          </span>
          <UiBadge variant="success" size="sm" class="text-[9px]">
            {{ tool.status }}
          </UiBadge>
        </div>
      </div>
    </div>

    <!-- MODAL: REGISTER NEW TOOL -->
    <UiModal :open="openAddModal" title="Register Workforce Tool" @close="openAddModal = false">
      <div class="space-y-3.5">
        <UiInput v-model="newForm.name" label="Tool Name" placeholder="e.g. Docker Container Manager" required />
        <UiInput v-model="newForm.category" label="Category" placeholder="e.g. Infrastructure / Developer" required />

        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Permission Level</label>
          <select
            v-model="newForm.permissionLevel"
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="read">Read-Only</option>
            <option value="write">Read & Write</option>
            <option value="admin">Admin Full Access</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Tool Description</label>
          <textarea
            v-model="newForm.description"
            rows="3"
            placeholder="Deskripsi fungsi dan kapabilitas alat digital ini..."
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          ></textarea>
        </div>
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openAddModal = false">Cancel</UiButton>
        <UiButton variant="primary" :disabled="!newForm.name || !newForm.category" @click="handleRegisterTool">
          Register Tool
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Wrench } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import { useWorkforceToolStore } from '../../stores/workforceTool'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'
import type { ToolStatus } from '../../types'

const toolStore = useWorkforceToolStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const selectedCategory = ref('All')
const selectedPermission = ref('All')
const searchQuery = ref('')
const openAddModal = ref(false)

const newForm = ref({
  name: '',
  category: '',
  description: '',
  permissionLevel: 'write' as 'read' | 'write' | 'admin',
  status: 'available' as ToolStatus
})

onMounted(async () => {
  await Promise.all([
    toolStore.fetchTools(),
    employeeStore.fetchEmployees()
  ])
})

const categories = computed(() => {
  const cats = new Set(toolStore.tools.map((t) => t.category))
  return Array.from(cats)
})

const filteredTools = computed(() => {
  return toolStore.tools.filter((t) => {
    const matchCat = selectedCategory.value === 'All' || t.category === selectedCategory.value
    const matchPerm = selectedPermission.value === 'All' || t.permissionLevel === selectedPermission.value
    const query = searchQuery.value.toLowerCase().trim()
    const matchQuery =
      query === '' ||
      t.name.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)

    return matchCat && matchPerm && matchQuery
  })
})

const getUsedByCount = (toolId: string) => {
  return employeeStore.employees.filter((e) => e.toolIds.includes(toolId)).length
}

const resetFilters = () => {
  selectedCategory.value = 'All'
  selectedPermission.value = 'All'
  searchQuery.value = ''
}

const handleRegisterTool = async () => {
  if (!newForm.value.name || !newForm.value.category) return
  await toolStore.createTool({
    name: newForm.value.name,
    category: newForm.value.category,
    description: newForm.value.description || 'Custom registered tool.',
    permissionLevel: newForm.value.permissionLevel,
    status: newForm.value.status
  })

  openAddModal.value = false
  newForm.value.name = ''
  newForm.value.category = ''
  newForm.value.description = ''
  toast.show('Tool Registered', 'Tool baru berhasil ditambahkan ke registry.', 'success')
}
</script>
