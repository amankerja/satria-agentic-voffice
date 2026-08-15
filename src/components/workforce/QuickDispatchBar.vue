<template>
  <div class="p-4 sm:p-5 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col justify-between h-full relative overflow-hidden space-y-4 shadow-sm">
    <!-- Subtle Background Glow -->
    <div class="absolute -right-8 -top-8 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header Section -->
    <div class="flex items-center justify-between pb-3 border-b border-outline-variant/60">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
          <Zap class="w-4 h-4" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-on-surface leading-none">Quick Dispatch</h3>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 leading-none">Fast Track</span>
          </div>
          <p class="text-[11px] text-muted mt-1 leading-none">Eksekusi tugas langsung ke AI worker dalam 1 klik</p>
        </div>
      </div>

      <!-- Runtime Mode Toggle Badge -->
      <button
        @click="toggleRuntime"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition shrink-0"
        :class="agentRunStore.runtimeMode === 'hermes' ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20' : 'bg-surface-container border-outline-variant text-muted hover:text-on-surface'"
        :title="`Runtime aktif: ${agentRunStore.runtimeMode === 'hermes' ? 'Hermes Native Gateway' : 'Simulation Runner'}. Klik untuk beralih.`"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-primary" :class="agentRunStore.runtimeMode === 'hermes' ? 'animate-pulse' : 'opacity-40'"></span>
        <span>{{ agentRunStore.runtimeMode === 'hermes' ? 'Hermes' : 'Mock' }}</span>
      </button>
    </div>

    <!-- Main Prompt Input Area -->
    <div class="space-y-2 flex-1">
      <div class="relative bg-surface-container-lowest border border-outline-variant rounded-xl p-3 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition group">
        <textarea
          v-model="promptText"
          rows="3"
          placeholder="Ketik instruksi tugas (contoh: Audit arsitektur backend dan verifikasi boundary sandbox)..."
          aria-label="Prompt text for AI Workforce Dispatch"
          class="w-full bg-transparent text-xs text-on-surface placeholder-muted outline-none resize-none font-sans leading-relaxed"
          @keydown.enter.ctrl="handleDispatch"
        ></textarea>

        <!-- Chips & Keyboard Shortcut Hint -->
        <div class="flex items-center justify-between pt-2 border-t border-outline-variant/40 mt-1 text-[11px]">
          <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-[80%]">
            <span class="text-muted text-[10px] font-mono shrink-0">Contoh:</span>
            <button
              v-for="chip in promptChips"
              :key="chip.label"
              :aria-label="`Apply prompt: ${chip.label}`"
              @click="applyChip(chip)"
              class="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high hover:text-primary text-[11px] text-on-surface-variant transition shrink-0 border border-outline-variant/60"
            >
              {{ chip.label }}
            </button>
          </div>

          <span class="text-[10px] font-mono text-muted shrink-0 hidden sm:inline ml-2">
            Ctrl+Enter
          </span>
        </div>
      </div>
    </div>

    <!-- Parameter Config Grid (Prevents Overflow/Truncation) -->
    <div class="space-y-3 pt-1">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <!-- Employee Selector -->
        <div class="space-y-1">
          <label for="quick-emp-select" class="text-[10px] font-medium text-muted uppercase tracking-wider block">Agent</label>
          <div class="relative">
            <select
              id="quick-emp-select"
              v-model="selectedEmployeeId"
              aria-label="Select digital employee"
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-medium outline-none focus:border-primary transition appearance-none cursor-pointer pr-7"
            >
              <option v-for="emp in employeeStore.activeEmployees" :key="emp.id" :value="emp.id" class="bg-surface-container-low text-on-surface">
                {{ emp.name }} ({{ emp.roleName }})
              </option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <!-- AI Model Selector -->
        <div class="space-y-1">
          <label for="quick-model-select" class="text-[10px] font-medium text-muted uppercase tracking-wider block">Model</label>
          <div class="relative">
            <select
              id="quick-model-select"
              v-model="aiStore.selectedModel"
              aria-label="Select AI model"
              @change="aiStore.setModel(aiStore.selectedModel)"
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-primary font-mono font-semibold outline-none focus:border-primary transition appearance-none cursor-pointer pr-7"
            >
              <option v-for="m in aiStore.availableModels" :key="m" :value="m" class="bg-surface-container-low text-on-surface font-sans">
                {{ m }}
              </option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <!-- Priority Selector -->
        <div class="space-y-1">
          <label for="quick-priority-select" class="text-[10px] font-medium text-muted uppercase tracking-wider block">Priority</label>
          <div class="relative">
            <select
              id="quick-priority-select"
              v-model="priority"
              aria-label="Select task priority"
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface font-medium outline-none focus:border-primary transition appearance-none cursor-pointer pr-7"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
            <ChevronDown class="w-3.5 h-3.5 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <!-- Action Button (Full Width, Never Truncates) -->
      <UiButton
        variant="primary"
        size="md"
        :loading="isDispatching"
        :disabled="!promptText.trim()"
        @click="handleDispatch"
        class="w-full justify-center font-bold shadow-md shadow-primary/10 gap-2 h-10 text-xs"
      >
        <Zap class="w-4 h-4" />
        <span>Launch & Execute</span>
      </UiButton>
    </div>

    <!-- Active Run Inline Monitor (if dispatched recently) -->
    <div
      v-if="latestDispatchedRun"
      class="mt-2 p-3 bg-surface-container-lowest border border-primary/30 rounded-xl space-y-2.5 animate-in fade-in duration-200"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-primary animate-ping"></div>
          <span class="text-xs font-bold text-on-surface truncate max-w-48">{{ latestDispatchedRun.taskTitle }}</span>
          <UiBadge :variant="latestDispatchedRun.status === 'Completed' ? 'success' : latestDispatchedRun.status === 'Waiting' ? 'warning' : 'info'" size="sm">
            {{ latestDispatchedRun.status }}
          </UiBadge>
        </div>

        <router-link :to="`/runs/${latestDispatchedRun.id}`" class="text-primary hover:underline text-[11px] font-medium flex items-center gap-1">
          <span>View Run</span>
          <ArrowRight class="w-3 h-3" />
        </router-link>
      </div>

      <!-- Live progress bar -->
      <UiProgress :value="latestDispatchedRun.progress || 10" :label="latestDispatchedRun.currentStep || 'Working'" />

      <!-- Latest log snippet -->
      <div v-if="latestDispatchedRun.logs && latestDispatchedRun.logs.length > 0" class="p-2 bg-surface-container-low rounded-lg font-mono text-[11px] text-on-surface-variant flex items-center justify-between">
        <span class="truncate">&gt; {{ latestDispatchedRun.logs[latestDispatchedRun.logs.length - 1].message }}</span>
        <span class="text-muted text-[10px] shrink-0 ml-2">{{ latestDispatchedRun.logs[latestDispatchedRun.logs.length - 1].timestamp }}</span>
      </div>

      <!-- Inline Approval Gate if waiting -->
      <div v-if="latestDispatchedRun.status === 'Waiting' && pendingApproval" class="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between gap-2">
        <div class="text-xs">
          <div class="font-bold text-amber-300">Approval Diperlukan</div>
          <div class="text-[10px] text-muted truncate max-w-40">Action: {{ pendingApproval.toolCall.toolName }}</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <UiButton size="sm" variant="danger" @click="resolveApproval(false)">Reject</UiButton>
          <UiButton size="sm" variant="primary" @click="resolveApproval(true)">Approve</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Zap, ChevronDown, ArrowRight } from '@lucide/vue'
import UiButton from '../ui/UiButton.vue'
import UiBadge from '../ui/UiBadge.vue'
import UiProgress from '../ui/UiProgress.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useEmployeeStore } from '../../stores/employee'
import { useTaskStore } from '../../stores/task'
import { useAgentRunStore } from '../../stores/agentRun'
import { useAiRuntimeConfigStore } from '../../stores/aiRuntimeConfig'
import { useToast } from '../../composables/useToast'
import type { TaskPriority } from '../../types'

const workspaceStore = useWorkspaceStore()
const employeeStore = useEmployeeStore()
const taskStore = useTaskStore()
const agentRunStore = useAgentRunStore()
const aiStore = useAiRuntimeConfigStore()
const toast = useToast()

const promptText = ref('')
const selectedEmployeeId = ref('')
const priority = ref<TaskPriority>('High')
const isDispatching = ref(false)
const latestDispatchedRunId = ref<string | null>(null)

const promptChips = [
  {
    label: '🔍 Audit Backend',
    prompt: 'Analisis backend project structure dan buat ringkasan arsitektur.',
    roleMatch: 'role-backend-api'
  },
  {
    label: '⚡ Optimasi Query',
    prompt: 'Optimasi query performa database dan audit connection pool.',
    roleMatch: 'role-backend-api'
  },
  {
    label: '🎨 Design Tokens',
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
    const emp =
      employeeStore.employees.find((e) => e.id === selectedEmployeeId.value) ||
      employeeStore.activeEmployees[0] ||
      employeeStore.employees[0]

    // 1. Create Task in store
    const createdTask = await taskStore.createTask({
      workspaceId: workspaceStore.currentWorkspaceId || 'ws-dev',
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
      employeeId: emp?.id || 'emp-bima',
      employeeName: emp?.name || 'Bima',
      employeeAvatar: emp?.avatar || '',
      employeeRole: emp?.roleName || 'Backend API',
      assignedBy: 'Lead Developer (Quick Action)',
      skillIds: emp?.skills?.map((s) => s.skillId) || [],
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
