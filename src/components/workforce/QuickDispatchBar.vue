<template>
  <div class="p-4 sm:p-5 bg-surface-container-low border border-outline-variant rounded-2xl shadow-lg relative overflow-hidden space-y-4">
    <!-- Subtle Background Glow -->
    <div class="absolute -right-10 -top-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
          <Zap class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-sm font-bold text-on-surface flex items-center gap-2">
            <span>Quick AI Workforce Dispatch</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Fast Track</span>
          </h2>
          <p class="text-[11px] text-muted">Ketik instruksi pekerjaan, pilih digital employee, dan eksekusi langsung dalam 1 klik.</p>
        </div>
      </div>

      <!-- Runtime Mode Toggle Badge -->
      <div class="hidden sm:flex items-center gap-1.5 bg-surface-container-lowest px-2.5 py-1 rounded-lg border border-outline-variant text-[11px] font-mono">
        <span class="text-muted">Runtime:</span>
        <button
          @click="toggleRuntime"
          :class="[
            'px-2 py-0.5 rounded font-bold transition flex items-center gap-1',
            agentRunStore.runtimeMode === 'hermes' ? 'bg-primary/20 text-primary' : 'bg-surface-container text-muted'
          ]"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          {{ agentRunStore.runtimeMode === 'hermes' ? 'Hermes Native' : 'Simulation' }}
        </button>
      </div>
    </div>

    <!-- Main Input Box -->
    <div class="space-y-3">
      <div class="relative">
        <textarea
          v-model="promptText"
          rows="2"
          placeholder="Contoh: Analisis backend project structure dan berikan arsitektur ringkas..."
          class="w-full bg-surface-container-lowest text-xs text-on-surface placeholder-muted border border-outline-variant rounded-xl p-3 outline-none focus:border-primary transition resize-none font-sans"
          @keydown.enter.ctrl="handleDispatch"
        ></textarea>

        <!-- Quick Prompts Chips -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 mt-1 scrollbar-none text-[11px]">
          <span class="text-muted font-mono shrink-0">Contoh:</span>
          <button
            v-for="chip in promptChips"
            :key="chip.label"
            @click="applyChip(chip)"
            class="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition shrink-0 border border-outline-variant/60"
          >
            {{ chip.label }}
          </button>
        </div>
      </div>

      <!-- Controls Row: Employee Picker, Project, & Dispatch Button -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-outline-variant/60">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Employee Selector -->
          <div class="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs">
            <span class="text-muted text-[11px]">Agent:</span>
            <select
              v-model="selectedEmployeeId"
              class="bg-transparent text-on-surface font-medium outline-none cursor-pointer text-xs"
            >
              <option v-for="emp in employeeStore.activeEmployees" :key="emp.id" :value="emp.id">
                {{ emp.name }} ({{ emp.roleName }})
              </option>
            </select>
          </div>

          <!-- Priority Selector -->
          <div class="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs">
            <span class="text-muted text-[11px]">Priority:</span>
            <select v-model="priority" class="bg-transparent text-on-surface font-medium outline-none cursor-pointer text-xs">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <UiButton
          variant="primary"
          size="md"
          :icon="Play"
          :loading="isDispatching"
          :disabled="!promptText.trim()"
          @click="handleDispatch"
          class="shrink-0 font-bold"
        >
          ⚡ Launch & Execute
        </UiButton>
      </div>
    </div>

    <!-- Active Run Inline Monitor (if dispatched recently) -->
    <div
      v-if="latestDispatchedRun"
      class="mt-3 p-3.5 bg-surface-container-lowest border border-primary/30 rounded-xl space-y-3 animate-in fade-in duration-200"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-2 h-2 rounded-full bg-primary animate-ping"></div>
          <span class="text-xs font-bold text-on-surface">{{ latestDispatchedRun.taskTitle }}</span>
          <UiBadge :variant="latestDispatchedRun.status === 'Completed' ? 'success' : latestDispatchedRun.status === 'Waiting' ? 'warning' : 'info'" size="sm">
            {{ latestDispatchedRun.status }}
          </UiBadge>
        </div>

        <div class="flex items-center gap-3 text-[11px] font-mono text-muted">
          <span>Tokens: <strong class="text-primary">{{ latestDispatchedRun.telemetry?.totalTokens || 0 }}</strong></span>
          <span>Cost: <strong class="text-primary">{{ latestDispatchedRun.telemetry?.estimatedCostUsd ? `$${latestDispatchedRun.telemetry.estimatedCostUsd.toFixed(4)}` : 'N/A' }}</strong></span>
          <router-link :to="`/runs/${latestDispatchedRun.id}`" class="text-primary hover:underline font-sans font-medium">
            Open Full View &rarr;
          </router-link>
        </div>
      </div>

      <!-- Live progress bar -->
      <UiProgress :value="latestDispatchedRun.progress || 10" :label="latestDispatchedRun.currentStep || 'Working'" />

      <!-- Latest log snippet -->
      <div v-if="latestDispatchedRun.logs && latestDispatchedRun.logs.length > 0" class="p-2 bg-surface-container-low rounded-lg font-mono text-[11px] text-on-surface-variant flex items-center justify-between">
        <span class="truncate">&gt; {{ latestDispatchedRun.logs[latestDispatchedRun.logs.length - 1].message }}</span>
        <span class="text-muted text-[10px] shrink-0 ml-2">{{ latestDispatchedRun.logs[latestDispatchedRun.logs.length - 1].timestamp }}</span>
      </div>

      <!-- Inline Approval Gate if waiting -->
      <div v-if="latestDispatchedRun.status === 'Waiting' && pendingApproval" class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-3">
        <div class="text-xs">
          <div class="font-bold text-amber-300">Approval Diperlukan</div>
          <div class="text-[11px] text-muted">Action: {{ pendingApproval.toolCall.toolName }}</div>
        </div>
        <div class="flex items-center gap-2">
          <UiButton size="sm" variant="danger" @click="resolveApproval(false)">Reject</UiButton>
          <UiButton size="sm" variant="primary" @click="resolveApproval(true)">Approve & Resume</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Zap, Play } from '@lucide/vue'
import UiButton from '../ui/UiButton.vue'
import UiBadge from '../ui/UiBadge.vue'
import UiProgress from '../ui/UiProgress.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useEmployeeStore } from '../../stores/employee'
import { useTaskStore } from '../../stores/task'
import { useAgentRunStore } from '../../stores/agentRun'
import { useToast } from '../../composables/useToast'
import type { TaskPriority } from '../../types'

const workspaceStore = useWorkspaceStore()
const employeeStore = useEmployeeStore()
const taskStore = useTaskStore()
const agentRunStore = useAgentRunStore()
const toast = useToast()

const promptText = ref('')
const selectedEmployeeId = ref('')
const priority = ref<TaskPriority>('High')
const isDispatching = ref(false)
const latestDispatchedRunId = ref<string | null>(null)

const promptChips = [
  {
    label: '🔍 Audit Backend Architecture',
    prompt: 'Analisis backend project structure dan buat ringkasan arsitektur.',
    roleMatch: 'role-backend-api'
  },
  {
    label: '⚡ Optimize API & DB Queries',
    prompt: 'Optimasi query performa database dan audit connection pool.',
    roleMatch: 'role-backend-api'
  },
  {
    label: '🎨 Audit UI Design Tokens',
    prompt: 'Verifikasi konsistensi Tailwind design tokens dan responsive layout.',
    roleMatch: 'role-frontend-ui'
  }
]

onMounted(async () => {
  if (employeeStore.employees.length === 0) {
    await employeeStore.fetchEmployees()
  }
  if (!selectedEmployeeId.value && employeeStore.activeEmployees.length > 0) {
    selectedEmployeeId.value = employeeStore.activeEmployees[0].id
  }
})

const applyChip = (chip: typeof promptChips[0]) => {
  promptText.value = chip.prompt
  const matchedEmp = employeeStore.activeEmployees.find((e) => e.roleId === chip.roleMatch)
  if (matchedEmp) {
    selectedEmployeeId.value = matchedEmp.id
  }
}

const toggleRuntime = () => {
  const nextMode = agentRunStore.runtimeMode === 'hermes' ? 'mock' : 'hermes'
  agentRunStore.setRuntimeMode(nextMode)
  toast.show(`Runtime Mode: ${nextMode.toUpperCase()}`, undefined, 'info', 1500)
}

const latestDispatchedRun = computed(() => {
  if (!latestDispatchedRunId.value) return null
  return agentRunStore.runs.find((r) => r.id === latestDispatchedRunId.value) || null
})

const pendingApproval = computed(() => {
  if (!latestDispatchedRunId.value) return undefined
  return agentRunStore.getPendingApproval(latestDispatchedRunId.value)
})

const resolveApproval = async (approved: boolean) => {
  if (!latestDispatchedRunId.value || !pendingApproval.value) return
  await agentRunStore.respondApproval(latestDispatchedRunId.value, pendingApproval.value.id, approved)
}

const handleDispatch = async () => {
  if (!promptText.value.trim()) return

  isDispatching.value = true
  try {
    const emp = employeeStore.employees.find((e) => e.id === selectedEmployeeId.value) || employeeStore.activeEmployees[0]
    
    // 1. Create Task in store
    const createdTask = await taskStore.createTask({
      workspaceId: workspaceStore.currentWorkspaceId,
      projectId: 'prj-satria-ui',
      projectName: 'SATRIA AI Workforce Command',
      title: promptText.value.length > 50 ? promptText.value.substring(0, 47) + '...' : promptText.value,
      description: promptText.value,
      status: 'In Progress',
      priority: priority.value,
      assigneeName: emp?.name || 'Bima',
      assigneeAvatar: emp?.avatar,
      dueDate: '2026-08-14',
      tags: ['AutoDispatched', 'AIWorkforce']
    })

    // 2. Build Assignment
    const assignment = {
      id: `asg-quick-${Date.now()}`,
      taskId: createdTask.id,
      taskTitle: createdTask.title,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeAvatar: emp.avatar,
      employeeRole: emp.roleName,
      assignedBy: 'Lead Developer (Quick Action)',
      skillIds: emp.skills?.map((s) => s.skillId) || [],
      priority: priority.value,
      status: 'In Progress' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 3. Launch Agent Run directly
    const run = await agentRunStore.startRunFromAssignment(assignment)
    latestDispatchedRunId.value = run.id

    // Bind active run to task
    createdTask.activeRunId = run.id

    toast.show('Agent Dispatched & Running!', `${emp.name} sedang mengeksekusi tugas.`, 'success', 3000)
    promptText.value = ''
  } catch (err: any) {
    toast.show('Dispatch Failed', err?.message || 'Gagal memulai runtime agent.', 'error')
  } finally {
    isDispatching.value = false
  }
}
</script>
