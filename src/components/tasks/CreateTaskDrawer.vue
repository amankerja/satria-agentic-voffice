<template>
  <UiDrawer
    :open="open"
    title="Create New Task"
    description="Assign autonomous work to a digital employee or team"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5 p-1">
      <!-- 1. Task Title & Goal -->
      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5">
          Task Title & Goal <span class="text-primary">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          required
          placeholder="e.g. Implement customer webhook notification endpoint"
          class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder-muted focus:border-primary outline-none transition"
        />
      </div>

      <!-- 2. Task Description & Context -->
      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5">
          Detailed Description / Context
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Explain deliverable requirements, business expectations, or expected output format..."
          class="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface placeholder-muted focus:border-primary outline-none resize-none transition"
        ></textarea>
      </div>

      <!-- 3. Type & Project Selection -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Task Type
          </label>
          <select
            v-model="form.type"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option value="project">Project Work</option>
            <option value="one_time">One-Time Quick Task</option>
            <option value="recurring_instance">Recurring Job Instance</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Project
          </label>
          <select
            v-model="form.projectId"
            @change="handleProjectChange"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 4. Assignee & Priority -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Assign Worker
          </label>
          <select
            v-model="form.workerId"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option value="">Auto Select Best Worker</option>
            <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.id">
              {{ emp.name }} ({{ emp.roleName }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Priority
          </label>
          <select
            v-model="form.priority"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      <!-- 5. Workspace Folder Path (First-Class Concept) -->
      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5 flex items-center justify-between">
          <span>Execution Workspace Path</span>
          <span class="text-[10px] font-mono text-muted">Inherits from project by default</span>
        </label>
        <div class="relative">
          <Folder class="w-4 h-4 text-primary absolute left-3 top-3" />
          <input
            v-model="form.pathOverride"
            type="text"
            placeholder="C:/Projects/AI AGENTIC UI"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-3 py-2.5 text-xs text-on-surface font-mono placeholder-muted focus:border-primary outline-none transition"
          />
        </div>
      </div>

      <!-- 6. Due Date & Tags -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Due Date
          </label>
          <input
            v-model="form.dueDate"
            type="date"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Tags (comma separated)
          </label>
          <input
            v-model="tagsInput"
            type="text"
            placeholder="API, Backend, Automation"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface placeholder-muted focus:border-primary outline-none transition"
          />
        </div>
      </div>

      <!-- 7. Action Footer -->
      <div class="pt-4 border-t border-outline-variant flex items-center justify-end gap-2.5">
        <UiButton variant="ghost" size="sm" type="button" @click="$emit('close')">
          Cancel
        </UiButton>
        <UiButton variant="primary" size="sm" type="submit" :loading="submitting">
          Create Task
        </UiButton>
      </div>
    </form>
  </UiDrawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Folder } from '@lucide/vue'
import UiDrawer from '../ui/UiDrawer.vue'
import UiButton from '../ui/UiButton.vue'
import { useTaskStore } from '../../stores/task'
import { useProjectStore } from '../../stores/project'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'
import type { TaskPriority, TaskType } from '../../types'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const taskStore = useTaskStore()
const projectStore = useProjectStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const submitting = ref(false)
const tagsInput = ref('Automation, Core')

const defaultDueDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

const form = reactive({
  title: '',
  description: '',
  type: 'project' as TaskType,
  projectId: '',
  workerId: '',
  priority: 'High' as TaskPriority,
  pathOverride: '',
  dueDate: defaultDueDate()
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (projectStore.projects.length > 0 && !form.projectId) {
        form.projectId = projectStore.projects[0].id
        form.pathOverride = projectStore.projects[0].path || ''
        form.workerId = projectStore.projects[0].defaultWorkerId || ''
      }
    }
  }
)

const handleProjectChange = () => {
  const prj = projectStore.projects.find((p) => p.id === form.projectId)
  if (prj) {
    if (prj.path && !form.pathOverride) {
      form.pathOverride = prj.path
    }
    if (prj.defaultWorkerId && !form.workerId) {
      form.workerId = prj.defaultWorkerId
    }
  }
}

const handleSubmit = async () => {
  if (!form.title.trim()) return

  submitting.value = true
  try {
    const selectedProject = projectStore.projects.find((p) => p.id === form.projectId) || projectStore.projects[0]
    const selectedEmployee = employeeStore.employees.find((e) => e.id === form.workerId)

    const tags = tagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const created = await taskStore.createTask({
      workspaceId: selectedProject?.workspaceId || 'ws-dev',
      projectId: selectedProject?.id || 'prj-general',
      projectName: selectedProject?.name || 'General',
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      status: 'Todo',
      priority: form.priority,
      assigneeName: selectedEmployee?.name || 'Unassigned',
      assigneeId: selectedEmployee?.id,
      assigneeAvatar: selectedEmployee?.avatar,
      workerId: selectedEmployee?.id,
      workerName: selectedEmployee?.name,
      pathOverride: form.pathOverride.trim() || selectedProject?.path,
      dueDate: form.dueDate,
      tags
    })

    toast.success(`Task "${created.title}" created successfully.`)
    emit('created', created)
    emit('close')

    // Reset
    form.title = ''
    form.description = ''
  } catch (err: any) {
    toast.error(err.message || 'Failed to create task.')
  } finally {
    submitting.value = false
  }
}
</script>
