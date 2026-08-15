<template>
  <UiModal
    :open="open"
    title="Create Recurring Schedule"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4 p-1">
      <!-- Schedule Name -->
      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5">
          Schedule Rule Name <span class="text-primary">*</span>
        </label>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="e.g. Daily Database Backup & Cache Integrity"
          class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2.5 text-xs text-on-surface placeholder-muted focus:border-primary outline-none transition"
        />
      </div>

      <!-- Linked Project -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Project
          </label>
          <select
            v-model="form.projectId"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Assigned Worker
          </label>
          <select
            v-model="form.workerId"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option value="">Auto Select Worker</option>
            <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.id">
              {{ emp.name }} ({{ emp.roleName }})
            </option>
          </select>
        </div>
      </div>

      <!-- Recurrence Pattern -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Recurrence
          </label>
          <select
            v-model="form.recurrence"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="once">Once</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Trigger Time (HH:mm)
          </label>
          <input
            v-model="form.time"
            type="time"
            required
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none transition"
          />
        </div>

        <div v-if="form.recurrence === 'weekly'">
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Day of Week
          </label>
          <select
            v-model="form.dayOfWeek"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary outline-none transition"
          >
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </div>
      </div>

      <!-- Task Template Payload -->
      <div class="space-y-3 pt-2 border-t border-outline-variant/60">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Generated Task Title Template <span class="text-primary">*</span>
          </label>
          <input
            v-model="form.taskTitle"
            type="text"
            required
            placeholder="e.g. Execute scheduled database snapshot and integrity test"
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface placeholder-muted focus:border-primary outline-none transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1.5">
            Execution Instructions / Directives
          </label>
          <textarea
            v-model="form.instructions"
            rows="2"
            placeholder="Directives to pass into agent context when triggered..."
            class="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface placeholder-muted focus:border-primary outline-none resize-none transition"
          ></textarea>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-4 border-t border-outline-variant flex items-center justify-end gap-2.5">
        <UiButton variant="ghost" size="sm" type="button" @click="$emit('close')">
          Cancel
        </UiButton>
        <UiButton variant="primary" size="sm" type="submit" :loading="submitting">
          Save Schedule
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import UiModal from '../ui/UiModal.vue'
import UiButton from '../ui/UiButton.vue'
import { useScheduleStore } from '../../stores/schedule'
import { useProjectStore } from '../../stores/project'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'
import type { ScheduleRecurrence } from '../../types'

defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const scheduleStore = useScheduleStore()
const projectStore = useProjectStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const submitting = ref(false)

const form = reactive({
  name: '',
  projectId: projectStore.projects[0]?.id || '',
  workerId: '',
  recurrence: 'daily' as ScheduleRecurrence,
  time: '08:00',
  dayOfWeek: 'Monday',
  taskTitle: '',
  instructions: ''
})

const handleSubmit = async () => {
  if (!form.name.trim() || !form.taskTitle.trim()) {
    toast.error('Schedule name and task template title are required.')
    return
  }

  submitting.value = true
  try {
    const selectedProject = projectStore.projects.find((p) => p.id === form.projectId)
    const selectedWorker = employeeStore.employees.find((e) => e.id === form.workerId)

    const created = await scheduleStore.createSchedule({
      workspaceId: selectedProject?.workspaceId || 'ws-dev',
      projectId: selectedProject?.id,
      projectName: selectedProject?.name,
      name: form.name.trim(),
      recurrence: form.recurrence,
      time: form.time,
      dayOfWeek: form.recurrence === 'weekly' ? form.dayOfWeek : undefined,
      timezone: 'Asia/Jakarta (GMT+7)',
      enabled: true,
      taskTemplate: {
        title: form.taskTitle.trim(),
        description: `Automated scheduled task generated from schedule "${form.name.trim()}".`,
        workerId: selectedWorker?.id,
        workerName: selectedWorker?.name,
        priority: 'High',
        instructions: form.instructions.trim() || undefined,
        pathOverride: selectedProject?.path
      }
    })

    toast.success(`Recurring schedule "${created.name}" created.`)
    emit('created', created)
    emit('close')

    form.name = ''
    form.taskTitle = ''
    form.instructions = ''
  } catch (err: any) {
    toast.error(err.message || 'Failed to create schedule.')
  } finally {
    submitting.value = false
  }
}
</script>
