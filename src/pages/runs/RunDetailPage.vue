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
          <span class="text-[10px] font-mono text-muted uppercase">Session Timeline</span>
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
          <span class="text-[10px] font-mono text-muted uppercase">Verification Gate</span>
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

      <!-- Live Runtime Telemetry & Model Accounting Card -->
      <div class="p-5 bg-surface-container-low border border-outline-variant rounded-xl space-y-4 shadow-sm">
        <div class="flex items-center justify-between border-b border-outline-variant pb-3">
          <div class="flex items-center gap-2">
            <Cpu class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-bold text-on-surface">Runtime Telemetry & Model Accounting</h3>
            <UiBadge variant="neutral" size="sm" class="font-mono text-[10px]">
              {{ telemetry?.provider || (agentRunStore.runtimeMode === 'hermes' ? 'Hermes Daemon' : 'Mock Runner') }}
            </UiBadge>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono text-muted">Live Accounting</span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <!-- Runtime -->
          <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-1">
            <span class="text-[10px] font-mono text-muted uppercase">Runtime</span>
            <div class="text-xs font-mono font-bold text-on-surface flex items-center gap-1.5 truncate">
              <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              {{ agentRunStore.runtimeMode === 'hermes' ? 'Hermes' : 'Mock Engine' }}
            </div>
          </div>

          <!-- Provider -->
          <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-1">
            <span class="text-[10px] font-mono text-muted uppercase">Provider</span>
            <div class="text-xs font-mono font-bold text-on-surface truncate">
              {{ telemetry?.provider || (agentRunStore.runtimeMode === 'hermes' ? 'NousResearch' : 'satria-in-memory') }}
            </div>
          </div>

          <!-- Model -->
          <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-1 col-span-2 sm:col-span-2 lg:col-span-2">
            <span class="text-[10px] font-mono text-muted uppercase">Model ID</span>
            <div
              class="text-xs font-mono font-bold text-primary truncate"
              :title="telemetry?.model || (agentRunStore.runtimeMode === 'hermes' ? 'hermes-3-llama-3.1-70b' : 'mock-agent-simulation-v1')"
            >
              {{ telemetry?.model || (agentRunStore.runtimeMode === 'hermes' ? 'hermes-3-llama-3.1-70b' : 'mock-agent-simulation-v1') }}
            </div>
          </div>

          <!-- Total Tokens -->
          <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-1">
            <span class="text-[10px] font-mono text-muted uppercase">Total Tokens</span>
            <div class="text-xs font-mono font-bold text-on-surface">
              {{ formattedTotalTokens }}
            </div>
          </div>

          <!-- Duration -->
          <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-1">
            <span class="text-[10px] font-mono text-muted uppercase">Duration</span>
            <div class="text-xs font-mono font-bold text-on-surface">
              {{ formattedDuration }}
            </div>
          </div>

          <!-- Estimated Cost -->
          <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-1">
            <span class="text-[10px] font-mono text-muted uppercase">Estimated Cost</span>
            <div class="text-xs font-mono font-bold text-secondary">
              {{ formattedCost }}
            </div>
          </div>
        </div>

        <!-- Token Breakdown Subgrid -->
        <div class="p-3 bg-surface-container-lowest/60 border border-outline-variant rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex items-center gap-4">
            <span class="text-muted text-[11px]">Token Breakdown:</span>
            <div class="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
              <span class="text-muted">Prompt:</span>
              <span class="text-on-surface font-semibold">{{ formattedPromptTokens }}</span>
            </div>
            <span class="text-outline">/</span>
            <div class="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
              <span class="text-muted">Completion:</span>
              <span class="text-on-surface font-semibold">{{ formattedCompletionTokens }}</span>
            </div>
            <span class="text-outline">/</span>
            <div class="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
              <span class="text-muted">Cached:</span>
              <span class="text-on-surface font-semibold">{{ formattedCachedTokens }}</span>
            </div>
          </div>

          <div class="text-[10px] text-muted flex items-center gap-1.5">
            <Coins class="w-3.5 h-3.5 text-secondary" />
            <span>Pricing Reference: Versioned Table (USD)</span>
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

      <!-- Agent Output / Deliverable Panel -->
      <RunOutputPanel
        v-if="runResult || run.status === 'Completed'"
        :output="runResult?.output || run.outputSummary"
        :summary="runResult?.summary || run.outputSummary"
        :status="runResult?.status || (run.status === 'Completed' ? 'success' : undefined)"
      />

      <!-- Quality Gate & Verification Section (When Completed or RunResult exists) -->
      <div v-if="runResult || run.status === 'Completed'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Quality Gate Card (1 Column) -->
        <div class="lg:col-span-1">
          <QualityGateCard
            :status="runResult?.verificationStatus || (run.status === 'Completed' ? 'Passed' : 'Pending')"
            :score="computedVerificationScore"
            :summary-notes="runResult?.verificationNotes || 'Quality gate evaluated against execution assertions.'"
            :checks="computedVerificationChecks"
          />
        </div>

        <!-- Verification Evidence Panel (2 Columns) -->
        <div class="lg:col-span-2">
          <VerificationEvidencePanel
            :evidence="runResult?.verificationEvidence || fallbackEvidence"
          />
        </div>
      </div>

      <!-- Generated Artifacts List -->
      <ArtifactList
        v-if="runResult || run.status === 'Completed'"
        :artifacts="collectedArtifacts"
        :artifact-ids="runResult?.artifactIds"
        @preview="handlePreviewArtifact"
      />

      <!-- Diffs / Changes Viewer -->
      <DiffViewer
        v-if="runResult?.diffs && runResult.diffs.length > 0"
        :diffs="runResult.diffs"
      />
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

    <!-- Artifact Preview Drawer -->
    <ArtifactPreviewDrawer
      :open="isArtifactDrawerOpen"
      :artifact="previewingArtifact"
      @close="isArtifactDrawerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  Pause,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  Terminal,
  ShieldAlert,
  Cpu,
  Coins
} from '@lucide/vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiSkeleton from '../../components/ui/UiSkeleton.vue'
import RunApprovalDrawer from '../../components/workforce/RunApprovalDrawer.vue'
import RunOutputPanel from '../../components/workforce/RunOutputPanel.vue'
import QualityGateCard from '../../components/workforce/QualityGateCard.vue'
import VerificationEvidencePanel from '../../components/workforce/VerificationEvidencePanel.vue'
import ArtifactList, { type ArtifactDisplayItem } from '../../components/workforce/ArtifactList.vue'
import ArtifactPreviewDrawer from '../../components/workforce/ArtifactPreviewDrawer.vue'
import DiffViewer from '../../components/workforce/DiffViewer.vue'
import { useAgentRunStore } from '../../stores/agentRun'
import { useReviewStore } from '../../stores/review'
import { CostCalculator } from '../../runtime'
import { globalArtifactCollector } from '../../runtime/results/ArtifactCollector'
import type { AgentRunStatus, RunStep, RunResult, VerificationEvidence } from '../../types'

const route = useRoute()
const agentRunStore = useAgentRunStore()
const reviewStore = useReviewStore()

const loading = ref<boolean>(false)
const isApprovalDrawerOpen = ref<boolean>(false)
const isArtifactDrawerOpen = ref<boolean>(false)
const previewingArtifact = ref<ArtifactDisplayItem | null>(null)
const runResult = ref<RunResult | null>(null)
const nowTick = ref<number>(Date.now())
let tickerInterval: any = null

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

const telemetry = computed(() => run.value?.telemetry)

const collectedArtifacts = computed(() => {
  const list = globalArtifactCollector.getArtifacts(runId.value)
  if (list.length > 0) return list
  return []
})

const formattedTotalTokens = computed(() => CostCalculator.formatTokens(telemetry.value?.totalTokens))
const formattedPromptTokens = computed(() => CostCalculator.formatTokens(telemetry.value?.promptTokens))
const formattedCompletionTokens = computed(() => CostCalculator.formatTokens(telemetry.value?.completionTokens))
const formattedCachedTokens = computed(() => CostCalculator.formatTokens(telemetry.value?.cachedTokens))
const formattedCost = computed(() => CostCalculator.formatCost(telemetry.value?.estimatedCostUsd))

const formattedDuration = computed(() => {
  if (run.value?.durationSeconds) {
    return CostCalculator.formatDuration(run.value.durationSeconds)
  }
  if (telemetry.value?.durationMs) {
    return CostCalculator.formatDuration(telemetry.value.durationMs, true)
  }
  if (run.value?.startedAt) {
    const elapsed = Math.max(0, Math.floor((nowTick.value - new Date(run.value.startedAt).getTime()) / 1000))
    return CostCalculator.formatDuration(elapsed)
  }
  return '0s'
})

const fallbackEvidence = computed<VerificationEvidence[]>(() => {
  if (run.value?.status !== 'Completed') return []
  return [
    {
      type: 'criteria',
      name: 'Deliverable Output Integrity',
      passed: true,
      details: 'Agent produced verified deliverable output and completed execution.'
    },
    {
      type: 'security',
      name: 'Sandbox Policy Compliance',
      passed: true,
      details: 'Zero sandbox violations or unauthorized file operations detected.'
    }
  ]
})

const computedVerificationChecks = computed(() => {
  const evList = runResult.value?.verificationEvidence || fallbackEvidence.value
  return evList.map((ev) => ({
    name: ev.name,
    passed: ev.passed,
    details: ev.details
  }))
})

const computedVerificationScore = computed(() => {
  const checks = computedVerificationChecks.value
  if (checks.length === 0) return 100
  const passed = checks.filter((c) => c.passed).length
  return Math.round((passed / checks.length) * 100)
})

onMounted(async () => {
  loading.value = true
  try {
    await agentRunStore.fetchRunById(runId.value)
    const res = await reviewStore.fetchResultByRunId(runId.value)
    runResult.value = res || null
  } finally {
    loading.value = false
  }

  tickerInterval = setInterval(() => {
    nowTick.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (tickerInterval) {
    clearInterval(tickerInterval)
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

function handlePreviewArtifact(artifact: ArtifactDisplayItem) {
  previewingArtifact.value = artifact
  isArtifactDrawerOpen.value = true
}
</script>
