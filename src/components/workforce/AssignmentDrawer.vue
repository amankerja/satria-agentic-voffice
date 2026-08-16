<template>
  <UiDrawer
    :open="modelValue"
    @close="$emit('update:modelValue', false)"
    :title="task ? `Assign Workforce: ${task.title}` : 'Task Assignment'"
  >
    <div v-if="task" class="space-y-5">
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

      <!-- Capability 2.0 Recommended Best Agent Banner -->
      <div
        v-if="bestCandidate"
        class="p-3 bg-gradient-to-r from-emerald-950/20 via-surface-container-low to-surface-container-low border border-primary/30 rounded-xl space-y-2"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 text-xs font-bold text-primary font-mono">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Capability 2.0 Best Match</span>
          </div>
          <button
            @click="selectBestCandidate"
            class="px-2.5 py-1 rounded bg-primary text-surface-base text-[11px] font-mono font-bold hover:bg-primary/90 transition shadow-sm"
          >
            Auto-Pilih {{ bestCandidate.employeeName.split(' ')[0] }} ({{ bestCandidate.capabilityScore }}%)
          </button>
        </div>
        <p class="text-[11px] text-on-surface-variant font-mono">
          {{ bestCandidate.recommendedReason }}
        </p>
      </div>

      <!-- Employee Selection with Capability Score Pills -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label id="select-employee-label" class="block text-xs font-semibold text-on-surface">
            Pilih Digital Employee <span class="text-error">*</span>
          </label>
          <span class="text-[10px] font-mono text-muted">Diurutkan berdasarkan Capability Score</span>
        </div>

        <div
          role="listbox"
          aria-labelledby="select-employee-label"
          class="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin"
        >
          <div
            v-for="cand in candidateRankings"
            :key="cand.employeeId"
            role="option"
            :aria-selected="selectedEmployeeId === cand.employeeId"
            tabindex="0"
            @keydown.enter="selectedEmployeeId = cand.employeeId"
            @keydown.space.prevent="selectedEmployeeId = cand.employeeId"
            @click="selectedEmployeeId = cand.employeeId"
            :class="[
              'p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              selectedEmployeeId === cand.employeeId
                ? 'bg-primary-container/10 border-primary shadow-sm'
                : 'bg-surface-container-low border-outline-variant hover:border-outline'
            ]"
          >
            <div class="flex items-center gap-3 truncate">
              <img
                :src="cand.employeeAvatar"
                :alt="cand.employeeName"
                class="w-9 h-9 rounded-full object-cover border border-outline shrink-0"
              />
              <div class="truncate">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-on-surface truncate">{{ cand.employeeName }}</span>
                  <span v-if="cand.isBestMatch" class="px-1.5 py-0.2 rounded bg-primary/20 text-primary text-[9px] font-mono font-bold">
                    BEST
                  </span>
                </div>
                <div class="text-[10px] text-muted truncate">{{ cand.employeeRole }} &bull; {{ cand.departmentName }}</div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <!-- Score Badge -->
              <span
                :class="[
                  'px-2 py-0.5 rounded text-[10px] font-mono font-bold',
                  cand.capabilityScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  cand.capabilityScore >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                ]"
              >
                {{ cand.capabilityScore }}% Score
              </span>

              <div
                :class="[
                  'w-4 h-4 rounded-full border flex items-center justify-center text-[10px]',
                  selectedEmployeeId === cand.employeeId ? 'bg-primary text-surface border-primary font-bold' : 'border-outline'
                ]"
              >
                <Check v-if="selectedEmployeeId === cand.employeeId" class="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Capability 2.0 Multi-Factor Analysis Card -->
      <div v-if="selectedCandidate" class="space-y-3 p-3.5 bg-surface-container-low border border-outline-variant rounded-xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5 text-primary" />
            Analisis Komprehensif: {{ selectedCandidate.employeeName }}
          </span>
          <UiBadge
            :variant="selectedCandidate.capabilityScore >= 70 ? 'success' : 'warning'"
            size="sm"
            class="font-mono"
          >
            {{ selectedCandidate.capabilityScore }}% Total Match
          </UiBadge>
        </div>

        <!-- 4-Factor Metric Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div class="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <span class="text-[9px] font-mono text-muted uppercase">Skill (40%)</span>
            <div class="text-xs font-bold font-mono text-primary mt-0.5">{{ selectedCandidate.skillMatchPercentage }}%</div>
          </div>
          <div class="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <span class="text-[9px] font-mono text-muted uppercase">Performa (25%)</span>
            <div class="text-xs font-bold font-mono text-secondary mt-0.5">{{ selectedCandidate.performanceScore }}%</div>
          </div>
          <div class="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <span class="text-[9px] font-mono text-muted uppercase">Workload (15%)</span>
            <div class="text-xs font-bold font-mono text-amber-400 mt-0.5">{{ selectedCandidate.availabilityScore }}%</div>
          </div>
          <div class="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <span class="text-[9px] font-mono text-muted uppercase">Biaya (10%)</span>
            <div class="text-xs font-bold font-mono text-emerald-400 mt-0.5">{{ selectedCandidate.costEfficiencyScore }}%</div>
          </div>
        </div>

        <!-- Reasoning description -->
        <p class="text-[11px] text-on-surface-variant font-mono leading-relaxed pt-1">
          {{ selectedCandidate.recommendedReason }}
        </p>

        <!-- Matched Skills Pills -->
        <div v-if="selectedCandidate.matchedSkills.length > 0" class="pt-1 flex flex-wrap gap-1">
          <span
            v-for="sId in selectedCandidate.matchedSkills"
            :key="sId"
            class="px-2 py-0.5 rounded bg-surface-container-highest text-primary text-[10px] font-mono flex items-center gap-1"
          >
            <Check class="w-2.5 h-2.5" />
            {{ getSkillName(sId) }}
          </span>
        </div>
      </div>

      <!-- Execution Instructions Box -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-on-surface">
          Instruksi Khusus & Konteks Eksekusi (Opsional)
        </label>
        <textarea
          v-model="instructions"
          rows="2"
          placeholder="e.g. Pastikan mengikuti standar error handling dan sertakan unit test vitest."
          class="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface focus:border-primary focus:outline-none placeholder:text-muted"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="pt-3 border-t border-outline-variant flex items-center justify-end gap-2.5">
        <UiButton
          variant="secondary"
          size="sm"
          @click="$emit('update:modelValue', false)"
        >
          Batal
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :icon="Play"
          :loading="loading"
          :disabled="!selectedEmployeeId"
          @click="handleAssignAndStartRun"
        >
          Assign & Jalankan Run
        </UiButton>
      </div>
    </div>
  </UiDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Check,
  Sparkles,
  Play
} from '@lucide/vue'
import UiDrawer from '../ui/UiDrawer.vue'
import UiButton from '../ui/UiButton.vue'
import UiBadge from '../ui/UiBadge.vue'
import type { Task, TaskAssignment, CandidateAgentRanking } from '../../types'
import { useEmployeeStore } from '../../stores/employee'
import { useSkillStore } from '../../stores/skill'
import { useAssignmentStore } from '../../stores/assignment'
import { useAgentRunStore } from '../../stores/agentRun'
import { useToast } from '../../composables/useToast'

interface Props {
  modelValue: boolean
  task: Task | null
}

const props = defineProps<Props>()
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
    agentRunStore.fetchRuns()

    // Auto-select best candidate or task.assigneeId
    if (props.task?.assigneeId) {
      selectedEmployeeId.value = props.task.assigneeId
    } else if (bestCandidate.value) {
      selectedEmployeeId.value = bestCandidate.value.employeeId
    } else {
      selectedEmployeeId.value = employeeStore.activeEmployees[0]?.id || ''
    }
  }
})

const capabilityReport = computed(() => {
  if (!props.task) return null
  return assignmentStore.evaluateCapability2(
    props.task,
    employeeStore.activeEmployees,
    agentRunStore.runs
  )
})

const candidateRankings = computed<CandidateAgentRanking[]>(() => {
  return capabilityReport.value?.rankings || []
})

const bestCandidate = computed<CandidateAgentRanking | undefined>(() => {
  return capabilityReport.value?.bestCandidate
})

const selectedCandidate = computed<CandidateAgentRanking | undefined>(() => {
  return candidateRankings.value.find((c) => c.employeeId === selectedEmployeeId.value)
})

const getSkillName = (skillId: string) => {
  const skill = skillStore.skills.find((s) => s.id === skillId)
  return skill?.name || skillId
}

const selectBestCandidate = () => {
  if (bestCandidate.value) {
    selectedEmployeeId.value = bestCandidate.value.employeeId
  }
}

const handleAssignAndStartRun = async () => {
  if (!props.task || !selectedCandidate.value) return
  loading.value = true
  try {
    const assignment = await assignmentStore.createAssignment({
      taskId: props.task.id,
      taskTitle: props.task.title,
      employeeId: selectedCandidate.value.employeeId,
      employeeName: selectedCandidate.value.employeeName,
      employeeAvatar: selectedCandidate.value.employeeAvatar,
      employeeRole: selectedCandidate.value.employeeRole,
      assignedBy: 'Satria Lead / Planner',
      skillIds: selectedCandidate.value.matchedSkills,
      priority: props.task.priority,
      status: 'In Progress',
      instructions: instructions.value.trim() || undefined
    })

    const run = await agentRunStore.startRunFromAssignment(assignment)
    if (props.task) {
      props.task.activeRunId = run.id
      props.task.assigneeId = selectedCandidate.value.employeeId
      props.task.assigneeName = selectedCandidate.value.employeeName
      props.task.assigneeAvatar = selectedCandidate.value.employeeAvatar
    }
    toast.show('Agent Run Started', `Run #${run.id} dimulai secara otomatis oleh ${selectedCandidate.value.employeeName}.`, 'success')
    emit('assigned', assignment)
    emit('update:modelValue', false)
  } finally {
    loading.value = false
  }
}
</script>
