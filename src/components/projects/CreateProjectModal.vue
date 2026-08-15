<template>
  <UiModal
    :open="open"
    title="Create New Project"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4 p-1">
      <!-- Project Name -->
      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5">
          Project Name <span class="text-primary">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="e.g. CRM SaaS Backend Engine"
          class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder-muted focus:border-primary outline-none transition"
        />
      </div>

      <!-- Description -->
      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5">
          Project Description
        </label>
        <textarea
          v-model="form.description"
          rows="2"
          placeholder="High-level mission and architecture scope..."
          class="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface placeholder-muted focus:border-primary outline-none resize-none transition"
        ></textarea>
      </div>

      <!-- Mandatory Folder Path (First Class Concept) -->
      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5 flex items-center justify-between">
          <span>Target Workspace Folder Path <span class="text-primary">*</span></span>
          <span class="text-[10px] font-mono text-primary font-normal">Mandatory for Agent Execution</span>
        </label>
        <div class="relative">
          <Folder class="w-4 h-4 text-primary absolute left-3 top-3" />
          <input
            v-model="form.path"
            type="text"
            required
            placeholder="C:/Projects/crm-backend"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-3 py-2.5 text-xs text-on-surface font-mono placeholder-muted focus:border-primary outline-none transition"
          />
        </div>
      </div>

      <!-- Default Worker & Accent Color -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Default Project Worker
          </label>
          <select
            v-model="form.defaultWorkerId"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option value="">Auto Assign</option>
            <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.id">
              {{ emp.name }} ({{ emp.roleName }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Accent Color
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="form.accentColor"
              type="color"
              class="w-8 h-8 rounded-lg bg-surface-container-low border border-outline-variant cursor-pointer p-0.5"
            />
            <input
              v-model="form.accentColor"
              type="text"
              class="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface font-mono focus:border-primary outline-none transition"
            />
          </div>
        </div>
      </div>

      <!-- Git Repository URL & Branch (Optional) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Git Repository URL (Optional)
          </label>
          <input
            v-model="form.repositoryUrl"
            type="text"
            placeholder="https://github.com/org/repo"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface placeholder-muted focus:border-primary outline-none transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Default Branch
          </label>
          <input
            v-model="form.branch"
            type="text"
            placeholder="main"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface font-mono placeholder-muted focus:border-primary outline-none transition"
          />
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-4 border-t border-outline-variant flex items-center justify-end gap-2.5">
        <UiButton variant="ghost" size="sm" type="button" @click="$emit('close')">
          Cancel
        </UiButton>
        <UiButton variant="primary" size="sm" type="submit" :loading="submitting">
          Create Project
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Folder } from '@lucide/vue'
import UiModal from '../ui/UiModal.vue'
import UiButton from '../ui/UiButton.vue'
import { useProjectStore } from '../../stores/project'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'

defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const projectStore = useProjectStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const submitting = ref(false)

const form = reactive({
  name: '',
  description: '',
  path: '',
  defaultWorkerId: '',
  accentColor: '#10b981',
  repositoryUrl: '',
  branch: 'main'
})

const handleSubmit = async () => {
  if (!form.name.trim() || !form.path.trim()) {
    toast.error('Project name and folder path are mandatory.')
    return
  }

  submitting.value = true
  try {
    const selectedWorker = employeeStore.employees.find((e) => e.id === form.defaultWorkerId)

    const created = await projectStore.createProject({
      workspaceId: 'ws-dev',
      name: form.name.trim(),
      description: form.description.trim(),
      path: form.path.trim(),
      defaultWorkerId: selectedWorker?.id,
      defaultWorkerName: selectedWorker?.name,
      accentColor: form.accentColor,
      status: 'Active',
      repositoryUrl: form.repositoryUrl.trim() || undefined,
      branch: form.branch.trim() || 'main',
      contributorsCount: 1
    })

    toast.success(`Project "${created.name}" configured at ${created.path}.`)
    emit('created', created)
    emit('close')

    form.name = ''
    form.description = ''
    form.path = ''
  } catch (err: any) {
    toast.error(err.message || 'Failed to create project.')
  } finally {
    submitting.value = false
  }
}
</script>
