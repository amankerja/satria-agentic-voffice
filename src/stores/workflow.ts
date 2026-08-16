import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { WorkflowEngine } from '../services/workflow/WorkflowEngine'
import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowNode,
  WorkflowEdge
} from '../types'

const SEED_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'wf-eng-pipeline',
    workspaceId: 'ws-dev',
    name: 'Autonomous Bugfix & PR Deployment Pipeline',
    description: 'Menerima laporan issue/email, klasifikasi bug, penugasan ke Bima (Backend), buat PR GitHub, dan minta approval.',
    category: 'ENGINEERING',
    enabled: true,
    createdAt: '2026-08-16T08:00:00Z',
    updatedAt: '2026-08-16T08:00:00Z',
    nodes: [
      {
        id: 'node-trigger',
        type: 'TRIGGER',
        label: 'Webhook / Email Trigger',
        position: { x: 50, y: 150 },
        config: { triggerType: 'EMAIL_RECEIVED' }
      },
      {
        id: 'node-classifier',
        type: 'CLASSIFIER',
        label: 'AI Category Matcher',
        position: { x: 260, y: 150 },
        config: {
          classifierRules: [
            { category: 'BUG_FIX', keywords: ['error', 'bug', 'panic', 'broken', 'mutex'] },
            { category: 'FINANCE', keywords: ['pembayaran', 'transfer', 'invoice'] }
          ]
        }
      },
      {
        id: 'node-agent-task',
        type: 'AGENT_TASK',
        label: 'Bima — Code Fix & Vitest',
        position: { x: 480, y: 150 },
        config: {
          assignedEmployeeId: 'emp-bima',
          assignedEmployeeName: 'Bima Wicaksono',
          taskInstructions: 'Fix JWT concurrency mutex in auth controller and assert unit tests.'
        }
      },
      {
        id: 'node-approval',
        type: 'APPROVAL',
        label: 'Owner Approval Gate',
        position: { x: 700, y: 150 },
        config: {
          approvalPrompt: 'Tinjau diff Pull Request sebelum dilakukan merge ke main branch.'
        }
      },
      {
        id: 'node-action-pr',
        type: 'INTEGRATION_ACTION',
        label: 'GitHub Create PR',
        position: { x: 920, y: 150 },
        config: {
          integrationAction: 'GITHUB_CREATE_PR'
        }
      },
      {
        id: 'node-output',
        type: 'OUTPUT',
        label: 'Final Deliverable Summary',
        position: { x: 1140, y: 150 },
        config: {}
      }
    ],
    edges: [
      { id: 'e1', source: 'node-trigger', target: 'node-classifier' },
      { id: 'e2', source: 'node-classifier', target: 'node-agent-task' },
      { id: 'e3', source: 'node-agent-task', target: 'node-approval' },
      { id: 'e4', source: 'node-approval', target: 'node-action-pr' },
      { id: 'e5', source: 'node-action-pr', target: 'node-output' }
    ]
  },
  {
    id: 'wf-finance-recap',
    workspaceId: 'ws-dev',
    name: 'Multi-Channel Daily Financial Reconciliation',
    description: 'Ekstraksi transaksi dari Bank & E-Wallet, filter mutasi duplikat, dan rekap ke pembukuan kas kanonik.',
    category: 'FINANCE',
    enabled: true,
    createdAt: '2026-08-16T08:00:00Z',
    updatedAt: '2026-08-16T08:00:00Z',
    nodes: [
      {
        id: 'node-f-trigger',
        type: 'TRIGGER',
        label: 'Scheduled Daily Cron',
        position: { x: 50, y: 150 },
        config: { triggerType: 'SCHEDULE_CRON' }
      },
      {
        id: 'node-f-agent',
        type: 'AGENT_TASK',
        label: 'Maya — Transaction Extractor',
        position: { x: 260, y: 150 },
        config: {
          assignedEmployeeId: 'emp-maya',
          assignedEmployeeName: 'Maya Salsabila',
          taskInstructions: 'Extract and reconcile bank statement receipts.'
        }
      },
      {
        id: 'node-f-action',
        type: 'INTEGRATION_ACTION',
        label: 'Send Executive Email Recap',
        position: { x: 480, y: 150 },
        config: { integrationAction: 'EMAIL_SEND_RECAP' }
      },
      {
        id: 'node-f-output',
        type: 'OUTPUT',
        label: 'Reconciled Ledger Ready',
        position: { x: 700, y: 150 },
        config: {}
      }
    ],
    edges: [
      { id: 'ef1', source: 'node-f-trigger', target: 'node-f-agent' },
      { id: 'ef2', source: 'node-f-agent', target: 'node-f-action' },
      { id: 'ef3', source: 'node-f-action', target: 'node-f-output' }
    ]
  }
]

export const useWorkflowStore = defineStore('workflow', () => {
  const workflows = ref<WorkflowDefinition[]>(SEED_WORKFLOWS)
  const selectedWorkflowId = ref<string>('wf-eng-pipeline')
  const executions = ref<WorkflowExecution[]>([])
  const activeExecution = ref<WorkflowExecution | null>(null)
  const isExecuting = ref<boolean>(false)

  const selectedWorkflow = computed<WorkflowDefinition | undefined>(() => {
    return workflows.value.find((w) => w.id === selectedWorkflowId.value) || workflows.value[0]
  })

  async function executeWorkflow(
    workflowId: string,
    initialPayload: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const wf = workflows.value.find((w) => w.id === workflowId)
    if (!wf) throw new Error(`Workflow not found: ${workflowId}`)

    isExecuting.value = true
    try {
      const exec = await WorkflowEngine.runWorkflow(wf, initialPayload)
      executions.value.unshift(exec)
      activeExecution.value = exec
      return exec
    } finally {
      isExecuting.value = false
    }
  }

  async function approveActiveExecution(approved: boolean): Promise<WorkflowExecution | null> {
    if (!activeExecution.value || !selectedWorkflow.value) return null

    isExecuting.value = true
    try {
      const resumed = await WorkflowEngine.resumeExecution(
        selectedWorkflow.value,
        activeExecution.value,
        approved
      )
      activeExecution.value = resumed
      return resumed
    } finally {
      isExecuting.value = false
    }
  }

  function addNode(workflowId: string, node: WorkflowNode) {
    const wf = workflows.value.find((w) => w.id === workflowId)
    if (wf) {
      wf.nodes.push(node)
      wf.updatedAt = new Date().toISOString()
    }
  }

  function addEdge(workflowId: string, edge: WorkflowEdge) {
    const wf = workflows.value.find((w) => w.id === workflowId)
    if (wf) {
      wf.edges.push(edge)
      wf.updatedAt = new Date().toISOString()
    }
  }

  function updateNodePosition(workflowId: string, nodeId: string, x: number, y: number) {
    const wf = workflows.value.find((w) => w.id === workflowId)
    if (wf) {
      const node = wf.nodes.find((n) => n.id === nodeId)
      if (node) {
        node.position = { x, y }
        wf.updatedAt = new Date().toISOString()
      }
    }
  }

  return {
    workflows,
    selectedWorkflowId,
    executions,
    activeExecution,
    isExecuting,
    selectedWorkflow,
    executeWorkflow,
    approveActiveExecution,
    addNode,
    addEdge,
    updateNodePosition
  }
})
