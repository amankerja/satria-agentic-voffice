<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="rounded-2xl border border-primary/30 bg-surface-container-low p-6 space-y-4 shadow-sm relative overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-mono font-bold text-primary flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-primary" :class="workflowStore.isExecuting ? 'animate-pulse' : ''" />
              CROSS-SYSTEM AUTONOMOUS ENGINE
            </span>
            <h3 class="text-base font-black text-surface-on">
              Agentic Cross-System Execution Studio
            </h3>
          </div>
          <p class="text-xs text-surface-muted mt-1 max-w-2xl leading-relaxed">
            Mengeksekusi alur otomatis end-to-end melintasi berbagai layanan: 
            <strong>Email Masuk (Gmail)</strong> → <strong>Ekstraksi Error</strong> → <strong>GitHub Code Patch & PR</strong> → <strong>Quality Gate Test</strong> → <strong>Persetujuan Manager</strong> → <strong>Kirim Email Balasan</strong>.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="workflowStore.workflow.status === 'Completed'"
            @click="workflowStore.resetWorkflow"
            class="rounded-xl border border-surface-container-high bg-surface-container-lowest px-4 py-2.5 text-xs font-bold text-surface-on hover:bg-surface-container-high transition-colors"
          >
            Reset Alur
          </button>
          <button
            @click="handleStartWorkflow"
            :disabled="workflowStore.isExecuting"
            class="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <svg v-if="workflowStore.isExecuting" class="h-4 w-4 animate-spin text-surface-container-lowest" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{{ workflowStore.isExecuting ? 'Agent Sedang Bekerja...' : 'Jalankan Alur Lintas Sistem' }}</span>
          </button>
        </div>
      </div>

      <!-- Live Progress Indicator -->
      <div v-if="workflowStore.workflow.status !== 'Idle'" class="space-y-1.5 pt-2">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-surface-muted">Progress Workflow:</span>
          <span class="text-primary font-bold">{{ workflowStore.progressPercent }}% Selesai</span>
        </div>
        <div class="h-2 w-full rounded-full bg-surface-container-lowest overflow-hidden border border-surface-container-high">
          <div
            class="h-full bg-primary transition-all duration-500 rounded-full"
            :style="{ width: `${workflowStore.progressPercent}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Active Approval Gate Intercept Box -->
    <div
      v-if="workflowStore.isWaitingApproval"
      class="rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-5 space-y-3 animate-pulse-slow shadow-lg"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 font-mono">
              ⚠️ APPROVAL REQUIRED
            </span>
            <h4 class="text-sm font-bold text-surface-on">Otorisasi Pengiriman Email Eksternal</h4>
          </div>
          <p class="text-xs text-surface-on leading-relaxed">
            Digital Employee <strong>Raka (Operations)</strong> siap mengirimkan email konfirmasi penyelesaian bug ke <strong>budi.santoso@clientcorp.com</strong> dengan melampirkan tautan Pull Request #143.
          </p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="workflowStore.rejectPendingStep"
            class="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            Tolak Eksekusi
          </button>
          <button
            @click="workflowStore.approvePendingStep"
            class="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-sm"
          >
            ✓ Setujui & Kirim Email
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content: Steps Timeline & Deliverables Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 2 Cols: 9-Step Timeline -->
      <div class="lg:col-span-2 space-y-3">
        <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider font-mono">
          Tahapan Eksekusi Agentic Workflow
        </h4>

        <div class="space-y-2.5">
          <div
            v-for="(step, idx) in workflowStore.workflow.steps"
            :key="step.id"
            class="rounded-xl border p-4 transition-all flex items-start gap-3.5"
            :class="getStepCardClass(step.status)"
          >
            <!-- Step Status Icon -->
            <div class="mt-0.5 shrink-0">
              <div
                class="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                :class="getStepBadgeClass(step.status)"
              >
                <span v-if="step.status === 'Completed'">✓</span>
                <span v-else-if="step.status === 'Running'" class="animate-spin">⟳</span>
                <span v-else-if="step.status === 'Waiting_Approval'">!</span>
                <span v-else>{{ idx + 1 }}</span>
              </div>
            </div>

            <!-- Step Details -->
            <div class="flex-1 min-w-0 space-y-1">
              <div class="flex items-center justify-between gap-2">
                <h5 class="text-xs font-bold text-surface-on truncate">{{ step.name }}</h5>
                <span class="rounded px-2 py-0.5 text-[10px] font-mono font-bold" :class="getSystemBadge(step.system)">
                  {{ step.system }}
                </span>
              </div>

              <p class="text-[11px] text-surface-muted leading-relaxed">
                {{ step.details }}
              </p>

              <!-- Optional Evidence Link -->
              <div v-if="step.evidenceUrl" class="pt-1">
                <a
                  :href="step.evidenceUrl"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono"
                >
                  <span>Lihat Bukti Eksternal &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 1 Col: Structured Deliverables Card -->
      <div class="space-y-4">
        <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider font-mono">
          Hasil & Artefak Pekerjaan
        </h4>

        <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low p-5 space-y-4 text-xs">
          <!-- 1. GitHub Deliverables -->
          <div class="space-y-2 pb-3 border-b border-surface-container-high/60">
            <span class="text-[11px] font-mono font-bold text-surface-muted uppercase">1. GitHub Code & PR</span>
            <div v-if="workflowStore.workflow.deliverables.pullRequestUrl" class="space-y-1.5">
              <div class="flex items-center justify-between text-surface-on">
                <span class="text-surface-muted">Branch:</span>
                <span class="font-mono text-primary font-bold">{{ workflowStore.workflow.deliverables.branchName }}</span>
              </div>
              <div class="flex items-center justify-between text-surface-on">
                <span class="text-surface-muted">Files Changed:</span>
                <span class="font-mono">{{ workflowStore.workflow.deliverables.filesChanged }} files</span>
              </div>
              <a
                :href="workflowStore.workflow.deliverables.pullRequestUrl"
                target="_blank"
                rel="noopener"
                class="block rounded-lg bg-surface-container-lowest border border-primary/30 p-2.5 text-primary hover:bg-primary/5 transition font-mono font-bold text-center mt-2"
              >
                🐙 Buka Pull Request #143 &rarr;
              </a>
            </div>
            <p v-else class="text-[11px] text-surface-muted italic">Menunggu eksekusi...</p>
          </div>

          <!-- 2. Test Verification Summary -->
          <div class="space-y-2 pb-3 border-b border-surface-container-high/60">
            <span class="text-[11px] font-mono font-bold text-surface-muted uppercase">2. Quality Gate Verification</span>
            <div v-if="workflowStore.workflow.deliverables.testResultsSummary" class="space-y-1">
              <p class="text-emerald-400 font-bold flex items-center gap-1">
                <span>✓</span>
                <span>All Tests Passed</span>
              </p>
              <p class="text-[11px] text-surface-muted font-mono">{{ workflowStore.workflow.deliverables.testResultsSummary }}</p>
            </div>
            <p v-else class="text-[11px] text-surface-muted italic">Menunggu eksekusi...</p>
          </div>

          <!-- 3. Email Dispatch Result -->
          <div class="space-y-2">
            <span class="text-[11px] font-mono font-bold text-surface-muted uppercase">3. Customer Communication</span>
            <div v-if="workflowStore.workflow.deliverables.emailSentUrl" class="space-y-1.5">
              <div class="flex items-center justify-between text-surface-on">
                <span class="text-surface-muted">Penerima:</span>
                <span class="font-mono text-cyan-400 font-bold truncate max-w-[150px]">{{ workflowStore.workflow.deliverables.emailRecipient }}</span>
              </div>
              <a
                :href="workflowStore.workflow.deliverables.emailSentUrl"
                target="_blank"
                rel="noopener"
                class="block rounded-lg bg-surface-container-lowest border border-cyan-500/30 p-2.5 text-cyan-400 hover:bg-cyan-500/5 transition font-mono font-bold text-center mt-2"
              >
                ✉️ Lihat Email Terkirim &rarr;
              </a>
            </div>
            <p v-else class="text-[11px] text-surface-muted italic">Menunggu persetujuan & pengiriman...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCrossSystemWorkflowStore } from '../../stores/crossSystemWorkflow'

const workflowStore = useCrossSystemWorkflowStore()

async function handleStartWorkflow() {
  await workflowStore.startWorkflow()
}

function getStepCardClass(status: string): string {
  switch (status) {
    case 'Completed':
      return 'border-emerald-500/30 bg-emerald-500/5'
    case 'Running':
      return 'border-primary/50 bg-primary/5 shadow-sm'
    case 'Waiting_Approval':
      return 'border-amber-500/60 bg-amber-500/10'
    case 'Failed':
      return 'border-rose-500/40 bg-rose-500/5'
    default:
      return 'border-surface-container-high/60 bg-surface-container-lowest opacity-70'
  }
}

function getStepBadgeClass(status: string): string {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-500 text-black'
    case 'Running':
      return 'bg-primary text-black'
    case 'Waiting_Approval':
      return 'bg-amber-400 text-black font-bold'
    case 'Failed':
      return 'bg-rose-500 text-white'
    default:
      return 'bg-surface-container-high text-surface-muted'
  }
}

function getSystemBadge(sys: string): string {
  switch (sys) {
    case 'GitHub':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    case 'Gmail':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
    case 'Verification':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'Approval':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    default:
      return 'bg-surface-container-high text-surface-on'
  }
}
</script>
