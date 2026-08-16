import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { WorkflowEngine } from '../services/workflow/WorkflowEngine'
import { useWorkflowStore } from '../stores/workflow'
import type { WorkflowDefinition } from '../types'

describe('SATRIA AI Workforce — Visual Workflow Engine & DAG Orchestrator (Phase 5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockWf: WorkflowDefinition = {
    id: 'wf-test-dag',
    workspaceId: 'ws-dev',
    name: 'Test Autonomous Pipeline',
    description: 'Unit test DAG with trigger, classifier, agent task, approval, and output',
    category: 'ENGINEERING',
    enabled: true,
    createdAt: '2026-08-16T08:00:00Z',
    updatedAt: '2026-08-16T08:00:00Z',
    nodes: [
      {
        id: 'n-trig',
        type: 'TRIGGER',
        label: 'Webhook Trigger',
        position: { x: 0, y: 0 },
        config: { triggerType: 'EMAIL_RECEIVED' }
      },
      {
        id: 'n-class',
        type: 'CLASSIFIER',
        label: 'Category Matcher',
        position: { x: 100, y: 0 },
        config: {
          classifierRules: [
            { category: 'BUG_FIX', keywords: ['error', 'panic', 'mutex', 'bug'] }
          ]
        }
      },
      {
        id: 'n-agent',
        type: 'AGENT_TASK',
        label: 'Bima Backend',
        position: { x: 200, y: 0 },
        config: {
          assignedEmployeeId: 'emp-bima',
          assignedEmployeeName: 'Bima Wicaksono',
          taskInstructions: 'Fix concurrency bug'
        }
      },
      {
        id: 'n-appr',
        type: 'APPROVAL',
        label: 'Owner Review',
        position: { x: 300, y: 0 },
        config: {
          approvalPrompt: 'Approve before Git PR creation'
        }
      },
      {
        id: 'n-act',
        type: 'INTEGRATION_ACTION',
        label: 'GitHub PR',
        position: { x: 400, y: 0 },
        config: {
          integrationAction: 'GITHUB_CREATE_PR'
        }
      },
      {
        id: 'n-out',
        type: 'OUTPUT',
        label: 'Finished Summary',
        position: { x: 500, y: 0 },
        config: {}
      }
    ],
    edges: [
      { id: 'e1', source: 'n-trig', target: 'n-class' },
      { id: 'e2', source: 'n-class', target: 'n-agent' },
      { id: 'e3', source: 'n-agent', target: 'n-appr' },
      { id: 'e4', source: 'n-appr', target: 'n-act' },
      { id: 'e5', source: 'n-act', target: 'n-out' }
    ]
  }

  it('runs workflow DAG and correctly pauses at Approval Gate (Waiting_Approval)', async () => {
    const payload = {
      title: 'Fix mutex panic in auth controller',
      body: 'Critical error bug in token handler'
    }

    const exec = await WorkflowEngine.runWorkflow(mockWf, payload)

    expect(exec.status).toBe('Waiting_Approval')
    expect(exec.nodeExecutions['n-trig'].status).toBe('completed')
    expect(exec.nodeExecutions['n-class'].status).toBe('completed')
    expect(exec.context.category).toBe('BUG_FIX')
    expect(exec.nodeExecutions['n-agent'].status).toBe('completed')
    expect(exec.nodeExecutions['n-appr'].status).toBe('waiting_approval')
    expect(exec.nodeExecutions['n-act'].status).toBe('idle')
  })

  it('resumes execution successfully when Owner approves', async () => {
    const payload = { title: 'Fix bug', body: 'error found' }
    const exec = await WorkflowEngine.runWorkflow(mockWf, payload)

    expect(exec.status).toBe('Waiting_Approval')

    // Owner approves
    const resumed = await WorkflowEngine.resumeExecution(mockWf, exec, true)

    expect(resumed.status).toBe('Completed')
    expect(resumed.nodeExecutions['n-appr'].status).toBe('completed')
    expect(resumed.nodeExecutions['n-act'].status).toBe('completed')
    expect(resumed.nodeExecutions['n-act'].output.action).toBe('GITHUB_CREATE_PR')
    expect(resumed.nodeExecutions['n-out'].status).toBe('completed')
  })

  it('terminates execution with Failed status when Owner rejects', async () => {
    const payload = { title: 'Fix bug', body: 'error found' }
    const exec = await WorkflowEngine.runWorkflow(mockWf, payload)

    expect(exec.status).toBe('Waiting_Approval')

    // Owner rejects
    const resumed = await WorkflowEngine.resumeExecution(mockWf, exec, false)

    expect(resumed.status).toBe('Failed')
    expect(resumed.nodeExecutions['n-appr'].status).toBe('failed')
    expect(resumed.nodeExecutions['n-appr'].error).toContain('Rejected')
    expect(resumed.nodeExecutions['n-act'].status).toBe('idle')
  })

  it('runs seamlessly via useWorkflowStore Pinia actions', async () => {
    const store = useWorkflowStore()
    expect(store.workflows.length).toBeGreaterThan(0)

    const exec = await store.executeWorkflow(store.workflows[0].id, {
      title: 'Run test pipeline'
    })

    expect(exec).toBeDefined()
    expect(store.executions.length).toBe(1)
    expect(store.activeExecution).toBeDefined()

    if (store.activeExecution?.status === 'Waiting_Approval') {
      const approved = await store.approveActiveExecution(true)
      expect(approved?.status).toBe('Completed')
    }
  })
})
