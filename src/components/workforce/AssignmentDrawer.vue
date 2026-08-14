<template>
  <UiDrawer
    :open="modelValue"
    @close="$emit('update:modelValue', false)"
    :title="task ? `Assign Workforce: ${task.title}` : 'Task Assignment'"
  >
    <div v-if="task" class="space-y-6">
      <!-- Task Summary Inset -->
      <div class="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono text-muted uppercase">Target Work Unit</span>
          <UiBadge variant="neutral" size="sm">{{ task.projectName }}</UiBadge>
        </div>
        <div class="text-sm font-bold text-on-surface">{{ task.title }}</div>
        <p v-if="task.description" class="text-xs text-on-surface-variant line-clamp-2">
          {{ task.description }}
        </p>
      </div>

      <!-- Employee Selection -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-on-surface">
          Select Digital Employee <span class="text-error">*</span>
        </label>
        <div class="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
          <div
            v-for="emp in employeeStore.activeEmployees"
            :key="emp.id"
            @click="selectedEmployeeId = emp.id"
            :class="[
              'p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3',
              selectedEmployeeId === emp.id
                ? 'bg-primary-container/10 border-primary shadow-sm'
                : 'bg-surface-container-low border-outline-variant hover:border-outline'
            ]"
          >
            <div class="flex items-center gap-3 truncate">
              <img
                :src="emp.avatar"
                :alt="emp.name"
                class="w-9 h-9 rounded-full object-cover border border-outline shrink-0"
              />
              <div class="truncate">
                <div class="text-xs font-bold text-on-surface truncate">{{ emp.name }}</div>
                <div class="text-[10px] text-muted truncate">{{ emp.roleName }} &bull; {{ emp.departmentName }}</div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span
                :class="[
                  'px-2 py-0.5 rounded text-[10px] font-mono font-medium',
                  emp.workState === 'Running' ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                ]"
              >
                {{ emp.workState || 'Idle' }}
              </span>
              <div
                :class="[
                  'w-4 h-4 rounded-full border flex items-center justify-center text-[10px]',
                  selectedEmployeeId === emp.id ? 'bg-primary text-surface border-primary font-bold' : 'border-outline'
                ]"
              >
                <Check v-if="selectedEmployeeId === emp.id" class="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skill Eligibility & Match Calculation Card -->
      <div v-if="selectedEmployee" class="space-y-3 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5 text-primary" />
            Skill Match & Eligibility
          </span>
          <UiBadge
            :variant="skillMatch.isEligible ? 'success' : 'error'"
            size="sm"
            class="font-mono"
          >
            {{ skillMatch.requiredMatchPercentage }}% Required Match
          </UiBadge>
        </div>

        <!-- Warning / Status Alert -->
        <div
          v-if="skillMatch.warning"
          :class="[
            'p-2.5 rounded-lg text-xs flex items-start gap-2',
            skillMatch.isEligible ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-error/10 text-error border border-error/20'
          ]"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span class="leading-relaxed">{{ skillMatch.warning }}</span>
        </div>

        <!-- Matched vs Missing Breakdown -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
          <div class="space-y-1">
            <span class="text-[10px] font-mono text-muted uppercase">Matched Skills ({{ skillMatch.matchedRequiredSkills.length }})</span>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="sId in skillMatch.matchedRequiredSkills"
                :key="sId"
                class="px-2 py-0.5 rounded bg-surface-container-highest text-primary text-[10px] font-mono flex items-center gap-1"
              >
                <Check class="w-2.5 h-2.5" />
                {{ getSkillName(sId) }}
              </span>
              <span v-if="skillMatch.matchedRequiredSkills.length === 0" class="text-[10px] text-muted italic">None</span>
            </div>
          </div>

          <div class="space-y-1">
            <span class="text-[10px] font-mono text-muted uppercase">Missing Required ({{ skillMatch.missingRequiredSkills.length }})</span>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="sId in skillMatch.missingRequiredSkills"
                :key="sId"
                class="px-2 py-0.5 rounded bg-error/10 text-error text-[10px] font-mono flex items-center gap-1"
              >
                &times; {{ getSkillName(sId) }}
              </span>
              <span v-if="skillMatch.missingRequiredSkills.length === 0" class="text-[10px] text-primary italic">None (All clear)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Execution Instructions Box -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-on-surface">
          Execution Context & Specific Instructions (Optional)
        </label>
        <textarea
          v-model="instructions"
          rows="3"
          placeholder="e.g. Pastikan mengikuti panduan design token dan cek kembali responsive di mobile viewport."
          class="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-xl p-3 text-xs text-on-surface placeholder-muted focus:outline-none transition resize-none"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-end gap-2.5">
        <UiButton variant="ghost" size="sm" @click="$emit('update:modelValue', false)">
          Cancel
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          :disabled="!selectedEmployee || loading"
          @click="handleAssignOnly"
        >
          Assign Task
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :icon="Play"
          :disabled="!selectedEmployee || loading"
          @click="handleAssignAndStartRun"
        >
          Assign & Start Live Run
        </UiButton>
      </div>
    </div>
  </UiDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Check, Sparkles, AlertCircle, Play } from '@lucide/vue'
import UiDrawer from '../ui/UiDrawer.vue'
import UiBadge from '../ui/UiBadge.vue'
import UiButton from '../ui/UiButton.vue'
import type { Task, Employee, TaskAssignment } from '../../types'
import { useEmployeeStore } from '../../stores/employee'
import { useSkillStore } from '../../stores/skill'
import { useAssignmentStore } from '../../stores/assignment'
import { useAgentRunStore } from '../../stores/agentRun'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  modelValue: boolean
  task: Task | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'assigned', assignment: TaskAssignment): void
}>()

const employeeStore = useEmployeeStore()
const skillStore = useSkillStore()
const assignmentStore = useAssignmentStore()
const agentRunStore = useAgentRunStore()
const toast = useToast()

const selectedEmployeeId = ref<string>('')
const instructions = ref<string>('')
const loading = ref<boolean>(false)

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    employeeStore.fetchEmployees()
    skillStore.fetchSkills()
    if (props.task?.assigneeId) {
      selectedEmployeeId.value = props.task.assigneeId
    } else {
      // Default to first active employee or empty
      selectedEmployeeId.value = employeeStore.activeEmployees[0]?.id || ''
    }
  }
})

const selectedEmployee = computed<Employee | undefined>(() => {
  return employeeStore.employees.find((e) => e.id === selectedEmployeeId.value)
})

const getSkillName = (skillId: string) => {
  const skill = skillStore.skills.find((s) => s.id === skillId)
  return skill?.name || skillId
}

const skillMatch = computed(() => {
  if (!selectedEmployee.value) {
    return {
      requiredMatchPercentage: 0,
      optionalMatchPercentage: 0,
      matchedRequiredSkills: [],
      missingRequiredSkills: [],
      matchedOptionalSkills: [],
      missingOptionalSkills: [],
      isEligible: false
    }
  }

  const required = props.task?.requiredSkillIds || ['skill-uiux-frontend']
  const optional = props.task?.optionalSkillIds || []

  return assignmentStore.calculateSkillMatch(selectedEmployee.value, required, optional)
})

const handleAssignOnly = async () => {
  if (!props.task || !selectedEmployee.value) return
  loading.value = true
  try {
    const assignment = await assignmentStore.createAssignment({
      taskId: props.task.id,
      taskTitle: props.task.title,
      employeeId: selectedEmployee.value.id,
      employeeName: selectedEmployee.value.name,
      employeeAvatar: selectedEmployee.value.avatar,
      employeeRole: selectedEmployee.value.roleName,
      assignedBy: 'Satria Lead / Planner',
      skillIds: selectedEmployee.value.skills.map((s) => s.skillId),
      priority: props.task.priority,
      status: 'Assigned',
      instructions: instructions.value.trim() || undefined
    })

    toast.show('Task Assigned Successfully', `${selectedEmployee.value.name} telah ditugaskan untuk task "${props.task.title}".`, 'success')
    emit('assigned', assignment)
    emit('update:modelValue', false)
  } finally {
    loading.value = false
  }
}

const handleAssignAndStartRun = async () => {
  if (!props.task || !selectedEmployee.value) return
  loading.value = true
  try {
    const assignment = await assignmentStore.createAssignment({
      taskId: props.task.id,
      taskTitle: props.task.title,
      employeeId: selectedEmployee.value.id,
      employeeName: selectedEmployee.value.name,
      employeeAvatar: selectedEmployee.value.avatar,
      employeeRole: selectedEmployee.value.roleName,
      assignedBy: 'Satria Lead / Planner',
      skillIds: selectedEmployee.value.skills.map((s) => s.skillId),
      priority: props.task.priority,
      status: 'In Progress',
      instructions: instructions.value.trim() || undefined
    })

    const run = await agentRunStore.startRunFromAssignment(assignment)
    toast.show('Agent Run Started', `Run #${run.id} dimulai secara otomatis oleh ${selectedEmployee.value.name}.`, 'success')
    emit('assigned', assignment)
    emit('update:modelValue', false)
  } finally {
    loading.value = false
  }
}
</script>
