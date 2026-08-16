<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-16">
    <!-- Header & Workflow Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/80 pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <GitBranch class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-surface-on font-mono tracking-tight">Visual Workflow Builder & DAG Canvas</h1>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            Phase 5 Native DAG
          </span>
        </div>
        <p class="text-xs text-surface-muted mt-1">
          Orkestrasi alur kerja multi-agent: Trigger &rarr; Classifier &rarr; Digital Worker &rarr; Condition &rarr; Approval Gate &rarr; Delivery.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <select
          v-model="wfStore.selectedWorkflowId"
          class="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
        >
          <option
            v-for="wf in wfStore.workflows"
            :key="wf.id"
            :value="wf.id"
          >
            {{ wf.name }} ({{ wf.category }})
          </option>
        </select>

        <button
          @click="runSimulation"
          :disabled="wfStore.isExecuting"
          class="px-3.5 py-1.5 rounded-lg bg-primary text-surface-base hover:bg-primary/90 text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
        >
          <Play class="w-3.5 h-3.5" />
          <span>{{ wfStore.isExecuting ? 'Menjalankan...' : 'Simulasi Eksekusi' }}</span>
        </button>
      </div>
    </div>

    <!-- Active Approval Gate Banner (If paused waiting for owner) -->
    <div
      v-if="wfStore.activeExecution?.status === 'Waiting_Approval'"
      class="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <ShieldAlert class="w-4 h-4" />
        </div>
        <div>
          <h4 class="text-xs font-bold text-amber-400 font-mono">Persetujuan Owner Diperlukan</h4>
          <p class="text-xs text-surface-muted">
            {{ activeNodeExec?.output?.prompt || 'Tinjau diff sebelum eksekusi dilanjutkan ke GitHub.' }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          @click="wfStore.approveActiveExecution(false)"
          class="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono font-bold transition"
        >
          Tolak (Reject)
        </button>
        <button
          @click="wfStore.approveActiveExecution(true)"
          class="px-3 py-1.5 rounded-lg bg-primary text-surface-base hover:bg-primary/90 text-xs font-mono font-bold transition shadow"
        >
          Setujui & Lanjutkan &rarr;
        </button>
      </div>
    </div>

    <!-- Visual DAG Canvas Board -->
    <div class="relative p-6 rounded-2xl border border-surface-container-high bg-surface-container-lowest min-h-105 overflow-x-auto">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-primary" />
          <span class="text-xs font-bold font-mono text-surface-on">{{ wfStore.selectedWorkflow?.name }}</span>
        </div>
        <div class="flex items-center gap-3 text-[10px] font-mono text-surface-muted">
          <span>Nodes: {{ wfStore.selectedWorkflow?.nodes.length }}</span>
          <span>Connections: {{ wfStore.selectedWorkflow?.edges.length }}</span>
          <span v-if="wfStore.activeExecution" class="px-2 py-0.5 rounded font-bold" :class="statusBadgeClass(wfStore.activeExecution.status)">
            Status: {{ wfStore.activeExecution.status }}
          </span>
        </div>
      </div>

      <!-- Node Graph Grid Layout -->
      <div class="flex items-center gap-4 py-8 overflow-x-auto">
        <template v-for="(node, idx) in wfStore.selectedWorkflow?.nodes" :key="node.id">
          <!-- Node Card -->
          <div
            @click="selectedNodeId = node.id"
            class="w-56 p-4 rounded-xl border transition cursor-pointer relative shrink-0 shadow-sm"
            :class="[
              selectedNodeId === node.id ? 'border-primary ring-1 ring-primary' : 'border-surface-container-high hover:border-surface-container-highest',
              getNodeExecutionStatus(node.id) === 'running' ? 'border-primary bg-primary/5 animate-pulse' :
              getNodeExecutionStatus(node.id) === 'completed' ? 'bg-surface-container-low border-emerald-500/40' :
              getNodeExecutionStatus(node.id) === 'waiting_approval' ? 'bg-amber-500/5 border-amber-500/40' :
              getNodeExecutionStatus(node.id) === 'failed' ? 'bg-red-500/5 border-red-500/40' :
              'bg-surface-container-low'
            ]"
          >
            <!-- Node Header & Icon -->
            <div class="flex items-center justify-between gap-2 mb-2">
              <span
                class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                :class="nodeTypeBadge(node.type)"
              >
                {{ node.type }}
              </span>
              <span
                class="w-2.5 h-2.5 rounded-full"
                :class="nodeStatusDot(getNodeExecutionStatus(node.id))"
              />
            </div>

            <div class="font-bold text-xs text-surface-on font-mono mb-1 truncate">{{ node.label }}</div>

            <!-- Contextual Description -->
            <p v-if="node.config.assignedEmployeeName" class="text-[10px] text-primary font-mono truncate">
              Worker: {{ node.config.assignedEmployeeName }}
            </p>
            <p v-else-if="node.config.triggerType" class="text-[10px] text-cyan-400 font-mono truncate">
              Event: {{ node.config.triggerType }}
            </p>
            <p v-else-if="node.config.integrationAction" class="text-[10px] text-purple-400 font-mono truncate">
              Action: {{ node.config.integrationAction }}
            </p>
            <p v-else class="text-[10px] text-surface-muted truncate">
              {{ node.type === 'APPROVAL' ? 'Human Gate' : 'Pipeline Node' }}
            </p>
          </div>

          <!-- Connector Arrow -->
          <div v-if="idx < (wfStore.selectedWorkflow?.nodes.length || 0) - 1" class="flex items-center text-surface-muted shrink-0">
            <ArrowRight class="w-5 h-5" />
          </div>
        </template>
      </div>
    </div>

    <!-- Node Inspector Drawer & Live Execution Context -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Node Config / Inspector -->
      <div class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-surface-on font-mono flex items-center gap-2">
            <Sliders class="w-4 h-4 text-primary" />
            Node Inspector ({{ inspectedNode?.label || 'Pilih Node' }})
          </h3>
          <span v-if="inspectedNode" class="text-[10px] font-mono text-surface-muted">{{ inspectedNode.id }}</span>
        </div>

        <div v-if="inspectedNode" class="space-y-3 text-xs font-mono">
          <div>
            <label class="text-[10px] text-surface-muted uppercase">Tipe Node</label>
            <div class="font-bold text-surface-on">{{ inspectedNode.type }}</div>
          </div>
          <div>
            <label class="text-[10px] text-surface-muted uppercase">Konfigurasi</label>
            <pre class="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-high text-[11px] text-surface-on overflow-x-auto">{{ JSON.stringify(inspectedNode.config, null, 2) }}</pre>
          </div>
        </div>
        <div v-else class="text-xs text-surface-muted font-mono py-8 text-center">
          Klik salah satu node pada grafik DAG di atas untuk melihat parameter.
        </div>
      </div>

      <!-- Live Execution Output & Logs -->
      <div class="p-5 rounded-2xl border border-surface-container-high bg-surface-container-low space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-surface-on font-mono flex items-center gap-2">
            <Terminal class="w-4 h-4 text-emerald-400" />
            Live Execution Output Context
          </h3>
          <span v-if="wfStore.activeExecution" class="text-[10px] font-mono text-primary font-bold">
            {{ wfStore.activeExecution.id }}
          </span>
        </div>

        <div v-if="wfStore.activeExecution" class="space-y-3 text-xs font-mono">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-surface-muted">Started: {{ wfStore.activeExecution.startedAt }}</span>
            <span class="font-bold text-primary">{{ wfStore.activeExecution.status }}</span>
          </div>
          <pre class="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-high text-[11px] text-emerald-400 max-h-56 overflow-y-auto">{{ JSON.stringify(wfStore.activeExecution.context, null, 2) }}</pre>
        </div>
        <div v-else class="text-xs text-surface-muted font-mono py-8 text-center">
          Klik tombol <strong>"Simulasi Eksekusi"</strong> di atas untuk menjalankan workflow DAG.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  GitBranch,
  Play,
  ArrowRight,
  Layers,
  Sliders,
  Terminal,
  ShieldAlert
} from '@lucide/vue'
import { useWorkflowStore } from '../../stores/workflow'
import { useToast } from '../../composables/useToast'
import type { WorkflowNodeType, WorkflowNodeExecutionStatus, WorkflowExecutionStatus } from '../../types'

const wfStore = useWorkflowStore()
const toast = useToast()

const selectedNodeId = ref<string>('node-trigger')

const inspectedNode = computed(() => {
  return wfStore.selectedWorkflow?.nodes.find((n) => n.id === selectedNodeId.value)
})

const activeNodeExec = computed(() => {
  if (!wfStore.activeExecution || !wfStore.activeExecution.currentNodeId) return null
  return wfStore.activeExecution.nodeExecutions[wfStore.activeExecution.currentNodeId]
})

function getNodeExecutionStatus(nodeId: string): WorkflowNodeExecutionStatus {
  if (!wfStore.activeExecution) return 'idle'
  return wfStore.activeExecution.nodeExecutions[nodeId]?.status || 'idle'
}

function nodeTypeBadge(type: WorkflowNodeType) {
  switch (type) {
    case 'TRIGGER': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
    case 'CLASSIFIER': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    case 'AGENT_TASK': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    case 'CONDITION': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    case 'APPROVAL': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'INTEGRATION_ACTION': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    case 'OUTPUT': return 'bg-primary/20 text-primary border border-primary/30'
    default: return 'bg-surface-container-high text-surface-muted'
  }
}

function nodeStatusDot(status: WorkflowNodeExecutionStatus) {
  switch (status) {
    case 'running': return 'bg-primary animate-ping'
    case 'completed': return 'bg-emerald-400'
    case 'waiting_approval': return 'bg-amber-400 animate-pulse'
    case 'failed': return 'bg-red-400'
    default: return 'bg-surface-container-high'
  }
}

function statusBadgeClass(status: WorkflowExecutionStatus) {
  switch (status) {
    case 'Completed': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    case 'Waiting_Approval': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    case 'Failed': return 'bg-red-500/20 text-red-400 border border-red-500/30'
    default: return 'bg-primary/20 text-primary border border-primary/30'
  }
}

async function runSimulation() {
  if (!wfStore.selectedWorkflow) return
  const payload = {
    title: 'Fix concurrency mutex deadlock in auth controller',
    body: 'Bug laporan: race condition pada token refresh middleware',
    source: 'github-webhook'
  }
  const exec = await wfStore.executeWorkflow(wfStore.selectedWorkflow.id, payload)
  if (exec.status === 'Waiting_Approval') {
    toast.show('Approval Required', 'Workflow dijeda sementara pada Approval Gate menunggu konfirmasi Owner.', 'info')
  } else {
    toast.show('Workflow Completed', 'Workflow DAG selesai dijalankan dengan sukses.', 'success')
  }
}
</script>
