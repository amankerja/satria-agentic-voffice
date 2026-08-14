<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Breadcrumb & Top Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
      <div class="flex items-center gap-3">
        <router-link
          to="/runs"
          aria-label="Back to runs list"
          class="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant text-muted hover:text-on-surface transition"
        >
          <ArrowLeft class="w-4 h-4" />
        </router-link>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-primary">#{{ run?.id }}</span>
            <UiBadge :variant="getStatusVariant(run?.status)" size="sm" class="font-mono">
              {{ run?.status || 'Unknown' }}
            </UiBadge>
            <span class="px-2 py-0.5 rounded bg-surface-container-highest text-[10px] font-mono text-muted">
              Attempt {{ run?.attempt || 1 }}/3
            </span>
          </div>
          <h1 class="text-xl font-bold text-on-surface mt-1">{{ run?.taskTitle || 'Execution Run Detail' }}</h1>
        </div>
      </div>

      <!-- Execution Control Actions -->
      <div v-if="run" class="flex items-center gap-2">
        <UiButton
          v-if="pendingApproval"
          size="sm"
          variant="primary"
          :icon="ShieldAlert"
          class="bg-amber-500 hover:bg-amber-600 text-black font-bold"
          @click="isApprovalDrawerOpen = true"
        >
          Review Action (Required)
        </UiButton>
        <UiButton
          v-else-if="run.status === 'Running'"
          size="sm"
          variant="secondary"
          :icon="Pause"
          @click="agentRunStore.pauseRun(run.id)"
        >
          Pause
        </UiButton>
        <UiButton
          v-else-if="run.status === 'Waiting'"
          size="sm"
          variant="primary"
          :icon="Play"
          @click="agentRunStore.resumeRun(run.id)"
        >
          Resume
        </UiButton>
        <UiButton
          v-if="run.status === 'Running' || run.status === 'Waiting'"
          size="sm"
          variant="danger"
          :icon="Square"
          @click="agentRunStore.cancelRun(run.id)"
        >
          Cancel
        </UiButton>
        <UiButton
          v-if="run.status === 'Failed' || run.status === 'Cancelled'"
          size="sm"
          variant="primary"
          :icon="RotateCcw"
          @click="agentRunStore.retryRun(run.id)"
        >
          Retry Run
        </UiButton>
        <router-link v-if="run.taskId" :to="`/tasks?id=${run.taskId}`">
          <UiButton size="sm" variant="ghost">View Task</UiButton>
        </router-link>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-4">
      <UiSkeleton class="h-44 rounded-xl" />
      <UiSkeleton class="h-80 rounded-xl" />
    </div>

    <div v-else-if="run" class="space-y-6">
      <!-- Human-in-the-Loop Intercept Banner (When Approval is Required) -->
      <div
        v-if="pendingApproval"
        class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse shadow-sm"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <ShieldAlert class="w-5 h-5" />
          </div>
          <div>
            <div class="text-sm font-bold text-amber-300">Action Approval Required</div>
            <div class="text-xs text-on-surface-variant">
              Agent requested <code class="text-amber-200 font-mono">{{ pendingApproval.toolCall.toolName }}</code>:
              {{ pendingApproval.reason || 'Confirmation required before proceeding.' }}
            </div>
          </div>
        </div>

        <UiButton
          size="sm"
          variant="primary"
          class="bg-amber-500 hover:bg-amber-600 text-black font-bold whitespace-nowrap"
          @click="isApprovalDrawerOpen = true"
        >
          Inspect & Respond
        </UiButton>
      </div>

      <!-- Live Progress & Step Visualizer Card -->
      <div class="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-xs font-mono text-muted uppercase">Execution Lifecycle Stage</span>
            <div class="text-sm font-bold text-on-surface flex items-center gap-2">
              <span
                :class="[
                  'w-2 h-2 rounded-full',
                  run.status === 'Running'
                    ? 'bg-primary animate-pulse'
                    : run.status === 'Completed'
                    ? 'bg-primary-container'
                    : run.status === 'Waiting'
                    ? 'bg-amber-400'
                    : 'bg-muted'
                ]"
              ></span>
              {{ run.currentStep }}
            </div>
          </div>

          <div class="text-right">
            <span class="text-2xl font-bold font-mono text-primary">{{ run.progress }}%</span>
            <div class="text-[10px] font-mono text-muted">
              {{ run.durationSeconds ? `${run.durationSeconds}s elapsed` : 'Live session' }}
            </div>
          </div>
        </div>

        <!-- Animated Big Progress Bar -->
        <div class="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            class="h-full bg-primary transition-all duration-300 rounded-full"
            :style="{ width: `${run.progress}%` }"
          ></div>
        </div>

        <!-- 6 Step Pipeline Visualizer -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 text-[10px] font-mono">
          <div
            v-for="(stepName, sIdx) in pipelineSteps"
            :key="stepName"
            :class="[
              'p-2 rounded-lg border text-center transition',
              isStepPassed(stepName)
                ? 'bg-primary-container/10 border-primary text-primary font-bold'
                : isStepActive(stepName)
                ? 'bg-surface-container-highest border-primary text-on-surface animate-pulse font-bold'
                : 'bg-surface-container-lowest border-outline-variant text-muted'
            ]"
          >
            <div>0{{ sIdx + 1 }}.</div>
            <div class="truncate">{{ stepName }}</div>
          </div>
        </div>
      </div>

      <!-- Personnel & Assignment Context Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Assigned Employee Card -->
        <div class="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-3">
          <span class="text-[10px] font-mono text-muted uppercase">Executing Digital Employee</span>
          <div class="flex items-center gap-3">
            <img
              :src="run.employeeAvatar"
              :alt="run.employeeName"
              class="w-11 h-11 rounded-full object-cover border border-outline shrink-0"
            />
            <div class="truncate">
              <div class="text-sm font-bold text-on-surface truncate">{{ run.employeeName }}</div>
              <div class="text-xs text-muted truncate">{{ run.employeeRole }}</div>
              <router-link
                :to="`/workforce/employees/${run.employeeId}`"
                class="text-[10px] font-mono text-primary hover:underline mt-0.5 inline-block"
              >
                View Profile &rarr;
              </router-link>
            </div>
          </div>
        </div>

        <!-- Session Timing & Attempt Stats -->
        <div class="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-2">
          <span class="text-[10px] font-mono text-muted uppercase">Session Telemetry</span>
          <div class="space-y-1 text-xs font-mono">
            <div class="flex justify-between text-on-surface-variant">
              <span>Started:</span>
              <span class="text-on-surface">{{ new Date(run.startedAt).toLocaleTimeString() }}</span>
            </div>
            <div class="flex justify-between text-on-surface-variant">
              <span>Completed:</span>
              <span class="text-on-surface">{{ run.completedAt ? new Date(run.completedAt).toLocaleTimeString() : 'In Progress' }}</span>
            </div>
            <div class="flex justify-between text-on-surface-variant">
              <span>Attempt Index:</span>
              <span class="text-primary font-bold">#{{ run.attempt }} of 3</span>
            </div>
          </div>
        </div>

        <!-- Review / Verification Quick Action -->
        <div class="p-4 bg-surface-container-low border border-outline-variant rounded-xl flex flex-col justify-between space-y-2">
          <span class="text-[10px] font-mono text-muted uppercase">Verification Status</span>
          <div v-if="run.status === 'Completed'" class="space-y-1.5">
            <div class="flex items-center gap-1.5 text-xs text-primary-container font-bold">
              <CheckCircle2 class="w-4 h-4" />
              <span>Ready for Review</span>
            </div>
            <router-link to="/reviews" class="w-full inline-block">
              <UiButton size="sm" variant="primary" class="w-full">
                Open Review Hub
              </UiButton>
            </router-link>
          </div>
          <div v-else class="text-xs text-muted">
            Verification gate will activate upon execution completion.
          </div>
        </div>
      </div>

      <!-- Execution Log Stream Terminal Card -->
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-3 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Terminal class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-bold text-on-surface">Execution Timeline Stream</h3>
            <span class="text-xs font-mono text-muted">({{ run.logs.length }} events logged)</span>
          </div>
          <span class="text-[10px] font-mono text-muted">Telemetry Feed</span>
        </div>

        <!-- Terminal Log Box -->
        <div class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-xs max-h-80 overflow-y-auto space-y-2.5 scrollbar-thin">
          <div
            v-for="log in run.logs"
            :key="log.id"
            class="flex items-start gap-2.5 leading-relaxed"
          >
            <span class="text-muted text-[10px] shrink-0 pt-0.5">{{ log.timestamp }}</span>
            <span
              :class="[
                'px-1.5 py-0.2 rounded text-[9px] uppercase shrink-0',
                log.level === 'error'
                  ? 'bg-error/20 text-error'
                  : log.level === 'success'
                  ? 'bg-primary-container/20 text-primary'
                  : log.level === 'warn'
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-surface-container-high text-on-surface-variant'
              ]"
            >
              {{ log.step }}
            </span>
            <span
              :class="[
                log.level === 'error'
                  ? 'text-error font-medium'
                  : log.level === 'success'
                  ? 'text-primary'
                  : log.level === 'warn'
                  ? 'text-amber-200'
                  : 'text-on-surface'
              ]"
            >
              {{ log.message }}
            </span>
          </div>

          <div v-if="run.status === 'Running'" class="flex items-center gap-2 text-primary text-xs pt-1">
            <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            <span>Synthesizing step: {{ run.currentStep }}...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Human-in-the-Loop Approval Drawer Component -->
    <RunApprovalDrawer
      :open="isApprovalDrawerOpen"
      :run-id="(route.params.id as string)"
      :approval-request="pendingApproval"
      :on-approve-async="handleApprove"
      :on-reject-async="handleReject"
      @close="isApprovalDrawerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  Pause,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  Terminal,
  ShieldAlert
} from '@lucide/vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiSkeleton from '../../components/ui/UiSkeleton.vue'
import RunApprovalDrawer from '../../components/workforce/RunApprovalDrawer.vue'
import { useAgentRunStore } from '../../stores/agentRun'
import type { AgentRunStatus, RunStep } from '../../types'

const route = useRoute()
const agentRunStore = useAgentRunStore()

const loading = ref<boolean>(false)
const isApprovalDrawerOpen = ref<boolean>(false)

const pipelineSteps: RunStep[] = [
  'Initializing',
  'Loading Task & Context',
  'Preparing Workspace',
  'Working',
  'Verifying',
  'Completing'
]

const runId = computed(() => route.params.id as string)

const run = computed(() => {
  return agentRunStore.runs.find((r) => r.id === runId.value) || agentRunStore.currentRun
})

const pendingApproval = computed(() => {
  return agentRunStore.getPendingApproval(runId.value)
})

onMounted(async () => {
  loading.value = true
  try {
    await agentRunStore.fetchRunById(runId.value)
  } finally {
    loading.value = false
  }
})

const getStatusVariant = (status?: AgentRunStatus) => {
  switch (status) {
    case 'Running':
    case 'Starting':
      return 'info'
    case 'Completed':
      return 'success'
    case 'Waiting':
      return 'warning'
    case 'Failed':
      return 'error'
    default:
      return 'neutral'
  }
}

const isStepPassed = (step: RunStep) => {
  if (!run.value) return false
  const currentIdx = pipelineSteps.indexOf(run.value.currentStep)
  const targetIdx = pipelineSteps.indexOf(step)
  return run.value.status === 'Completed' || targetIdx < currentIdx
}

const isStepActive = (step: RunStep) => {
  if (!run.value || run.value.status === 'Completed') return false
  return run.value.currentStep === step
}

async function handleApprove(approvalId: string) {
  if (run.value) {
    await agentRunStore.respondApproval(run.value.id, approvalId, true)
  }
}

async function handleReject(approvalId: string, feedback?: string) {
  if (run.value) {
    await agentRunStore.respondApproval(run.value.id, approvalId, false, feedback)
  }
}
</script>
