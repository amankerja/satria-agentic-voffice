<template>
  <UiModal
    :open="open"
    title="Change Assigned Worker"
    @close="$emit('close')"
  >
    <div class="space-y-4 p-1">
      <p class="text-xs text-muted">
        Reassign task <span class="text-on-surface font-semibold">"{{ taskTitle }}"</span> to a different digital employee.
      </p>

      <!-- Worker Selector -->
      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5">
          Select New Worker <span class="text-primary">*</span>
        </label>
        <select
          v-model="selectedWorkerId"
          class="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2.5 text-xs text-on-surface focus:border-primary outline-none transition"
        >
          <option v-for="emp in availableEmployees" :key="emp.id" :value="emp.id">
            {{ emp.name }} — {{ emp.roleName }} ({{ emp.departmentName }})
          </option>
        </select>
      </div>

      <!-- Action Mode Switch -->
      <div v-if="hasActiveRun" class="space-y-2 pt-2 border-t border-outline-variant/60">
        <label class="block text-xs font-semibold text-on-surface">Execution Strategy</label>
        <div class="space-y-2">
          <label class="flex items-start gap-2.5 p-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low cursor-pointer transition">
            <input
              type="radio"
              v-model="restartImmediately"
              :value="true"
              class="mt-0.5 text-primary focus:ring-primary"
            />
            <div>
              <div class="text-xs font-semibold text-on-surface">Stop & Restart Immediately (Recommended)</div>
              <div class="text-[11px] text-muted">Cancels current run attempt, resets workspace, and starts execution with the new worker.</div>
            </div>
          </label>

          <label class="flex items-start gap-2.5 p-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low cursor-pointer transition">
            <input
              type="radio"
              v-model="restartImmediately"
              :value="false"
              class="mt-0.5 text-primary focus:ring-primary"
            />
            <div>
              <div class="text-xs font-semibold text-on-surface">Apply to Next Run</div>
              <div class="text-[11px] text-muted">Let current execution attempt complete or cancel manually later.</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-4 border-t border-outline-variant flex items-center justify-end gap-2.5">
        <UiButton variant="ghost" size="sm" @click="$emit('close')">
          Cancel
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :loading="loading"
          @click="handleConfirm"
        >
          Confirm Reassignment
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import UiModal from '../ui/UiModal.vue'
import UiButton from '../ui/UiButton.vue'
import { useEmployeeStore } from '../../stores/employee'
import { useAgentRunStore } from '../../stores/agentRun'
import { useTaskStore } from '../../stores/task'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  open: boolean
  taskId: string
  taskTitle: string
  currentWorkerId?: string
  activeRunId?: string
}>()

const emit = defineEmits(['close', 'updated'])

const employeeStore = useEmployeeStore()
const agentRunStore = useAgentRunStore()
const taskStore = useTaskStore()
const toast = useToast()

const selectedWorkerId = ref(props.currentWorkerId || '')
const restartImmediately = ref(true)
const loading = ref(false)

const availableEmployees = computed(() => {
  return employeeStore.employees.filter((e) => e.status !== 'Archived')
})

const hasActiveRun = computed(() => Boolean(props.activeRunId))

const handleConfirm = async () => {
  if (!selectedWorkerId.value) return

  loading.value = true
  try {
    const worker = employeeStore.employees.find((e) => e.id === selectedWorkerId.value)

    if (props.activeRunId && restartImmediately.value) {
      await agentRunStore.changeWorkerMidRun(props.activeRunId, selectedWorkerId.value, true)
      toast.success(`Reassigned task to ${worker?.name || 'new worker'} and restarted execution.`)
    } else {
      await taskStore.updateTask(props.taskId, {
        assigneeId: selectedWorkerId.value,
        assigneeName: worker?.name || 'Worker',
        assigneeAvatar: worker?.avatar,
        workerId: selectedWorkerId.value,
        workerName: worker?.name
      })
      toast.success(`Assigned worker updated to ${worker?.name || 'new worker'}.`)
    }

    emit('updated', selectedWorkerId.value)
    emit('close')
  } catch (err: any) {
    toast.error(err.message || 'Failed to reassign worker.')
  } finally {
    loading.value = false
  }
}
</script>
