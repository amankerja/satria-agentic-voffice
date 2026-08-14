<template>
  <div class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-3.5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Cpu class="w-4 h-4 text-primary" />
        <span class="text-xs font-bold text-on-surface">Agent Execution Workspace</span>
      </div>

      <div class="flex items-center gap-2">
        <UiBadge
          v-if="currentRun"
          :variant="currentRun.status === 'Completed' ? 'success' : currentRun.status === 'Waiting' ? 'warning' : currentRun.status === 'Failed' ? 'error' : 'info'"
          size="sm"
        >
          {{ currentRun.status }}
        </UiBadge>
        <UiBadge v-else variant="neutral" size="sm">Idle</UiBadge>
      </div>
    </div>

    <!-- Assigned Employee Preview & Start Button -->
    <div v-if="!currentRun || currentRun.status === 'Cancelled' || currentRun.status === 'Failed'" class="flex items-center justify-between gap-3 bg-surface-container-low p-3 rounded-lg border border-outline-variant">
      <div class="flex items-center gap-2.5 truncate">
        <img
          v-if="task.assigneeAvatar"
          :src="task.assigneeAvatar"
          :alt="task.assigneeName"
          class="w-7 h-7 rounded-full object-cover border border-outline shrink-0"
        />
        <div class="truncate">
          <div class="text-xs font-bold text-on-surface truncate">{{ task.assigneeName || 'Unassigned Employee' }}</div>
          <div class="text-[10px] text-muted font-mono">Assigned Agent</div>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <UiButton
          size="sm"
          variant="primary"
          :icon="Play"
          :loading="isLoading"
          @click="startExecution"
        >
          {{ currentRun ? '⚡ Rerun Agent' : '⚡ Run Agent' }}
        </UiButton>
      </div>
    </div>

    <!-- Live Execution Active / Running View -->
    <div v-if="currentRun" class="space-y-3">
      <!-- Progress Bar -->
      <UiProgress
        :value="currentRun.progress || (currentRun.status === 'Completed' ? 100 : 25)"
        :label="currentRun.currentStep || currentRun.status"
      />

      <!-- Live Telemetry Badges -->
      <div class="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
        <div class="p-2 bg-surface-container-low rounded-lg border border-outline-variant">
          <div class="text-muted">DURATION</div>
          <div class="font-bold text-on-surface mt-0.5">{{ agentRunStore.getRunDuration(currentRun.id) }}s</div>
        </div>
        <div class="p-2 bg-surface-container-low rounded-lg border border-outline-variant">
          <div class="text-muted">TOKENS</div>
          <div class="font-bold text-primary mt-0.5">{{ currentRun.telemetry?.totalTokens || 0 }}</div>
        </div>
        <div class="p-2 bg-surface-container-low rounded-lg border border-outline-variant">
          <div class="text-muted">EST. COST</div>
          <div class="font-bold text-primary mt-0.5">
            {{ currentRun.telemetry?.estimatedCostUsd ? `$${currentRun.telemetry.estimatedCostUsd.toFixed(4)}` : '$0.00' }}
          </div>
        </div>
      </div>

      <!-- In-line Approval Gate if Waiting -->
      <div v-if="currentRun.status === 'Waiting' && pendingApproval" class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2.5">
        <div class="flex items-center gap-2 text-amber-300 font-bold text-xs">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>Approval Gate: Human Confirmation Required</span>
        </div>
        <p class="text-[11px] text-on-surface-variant">
          Agent meminta izin untuk mengeksekusi tool <code class="text-primary font-mono font-bold">{{ pendingApproval.toolCall.toolName }}</code>.
        </p>
        <div class="flex items-center justify-end gap-2 pt-1">
          <UiButton size="sm" variant="danger" @click="handleApproval(false)">Reject Action</UiButton>
          <UiButton size="sm" variant="primary" @click="handleApproval(true)">Approve & Continue</UiButton>
        </div>
      </div>

      <!-- Live Terminal Log Window -->
      <div class="space-y-1">
        <div class="flex items-center justify-between text-[10px] font-mono text-muted">
          <span>EXECUTION LOGS</span>
          <span>{{ currentRun.logs?.length || 0 }} events</span>
        </div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 max-h-36 overflow-y-auto font-mono text-[11px] space-y-1 scrollbar-none">
          <div
            v-for="log in currentRun.logs"
            :key="log.id"
            :class="[
              'flex items-start gap-1.5',
              log.level === 'error' ? 'text-error' : log.level === 'warn' ? 'text-amber-400' : 'text-on-surface-variant'
            ]"
          >
            <span class="text-muted text-[10px] shrink-0">[{{ log.timestamp }}]</span>
            <span class="break-all">{{ log.message }}</span>
          </div>
          <div v-if="!currentRun.logs || currentRun.logs.length === 0" class="text-muted italic">
            Connecting to runtime stream...
          </div>
        </div>
      </div>

      <!-- Action Controls when Completed or Failed -->
      <div v-if="currentRun.status === 'Completed'" class="p-3 bg-primary-container/10 border border-primary/30 rounded-lg flex items-center justify-between gap-2">
        <div class="text-xs">
          <div class="font-bold text-primary flex items-center gap-1.5">
            <CheckCircle2 class="w-4 h-4" />
            <span>Pekerjaan Selesai</span>
          </div>
          <div class="text-[11px] text-muted">Deliverable siap dan verifikasi passed.</div>
        </div>
        <div class="flex items-center gap-2">
          <UiButton size="sm" variant="primary" @click="handleAcceptAndDone">
            ✓ Mark Task Done
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cpu, Play, AlertCircle, CheckCircle2 } from '@lucide/vue'
import UiButton from '../ui/UiButton.vue'
import UiBadge from '../ui/UiBadge.vue'
import UiProgress from '../ui/UiProgress.vue'
import { useAgentRunStore } from '../../stores/agentRun'
import { useTaskStore } from '../../stores/task'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'
import type { Task, TaskAssignment } from '../../types'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits(['updated'])

const agentRunStore = useAgentRunStore()
const taskStore = useTaskStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const isLoading = ref(false)

const currentRun = computed(() => {
  // Find run by activeRunId or by taskId
  if (props.task.activeRunId) {
    const r = agentRunStore.runs.find((item) => item.id === props.task.activeRunId)
    if (r) return r
  }
  return agentRunStore.runs.find((item) => item.taskId === props.task.id) || null
})

const pendingApproval = computed(() => {
  if (!currentRun.value) return undefined
  return agentRunStore.getPendingApproval(currentRun.value.id)
})

const handleApproval = async (approved: boolean) => {
  if (!currentRun.value || !pendingApproval.value) return
  await agentRunStore.respondApproval(currentRun.value.id, pendingApproval.value.id, approved)
  toast.show(approved ? 'Approval Granted' : 'Approval Rejected', undefined, approved ? 'success' : 'info')
}

const handleAcceptAndDone = async () => {
  await taskStore.updateTaskStatus(props.task.id, 'Done')
  toast.show('Task Marked as Done!', 'Deliverable diterima dan tugas diselesaikan.', 'success')
  emit('updated')
}

const startExecution = async () => {
  isLoading.value = true
  try {
    const empName = props.task.assigneeName || 'Bima'
    const emp = employeeStore.employees.find((e) => e.name === empName) || employeeStore.activeEmployees[0]

    const assignment: TaskAssignment = {
      id: `asg-${Date.now()}`,
      taskId: props.task.id,
      taskTitle: props.task.title,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeAvatar: emp.avatar,
      employeeRole: emp.roleName,
      assignedBy: 'Lead Developer',
      skillIds: emp.skills?.map((s) => s.skillId) || [],
      priority: props.task.priority,
      status: 'In Progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const run = await agentRunStore.startRunFromAssignment(assignment)
    props.task.activeRunId = run.id
    toast.show(`Agent ${emp.name} Started`, 'Live execution sedang berjalan.', 'success')
    emit('updated')
  } catch (err: any) {
    toast.show('Execution Failed', err?.message || 'Gagal memulai agent run', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>
