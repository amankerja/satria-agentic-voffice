import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowNode,
  WorkflowNodeExecution
} from '../../types'

export class WorkflowEngine {
  /**
   * Initializes a new workflow execution instance
   */
  static createExecution(
    workflow: WorkflowDefinition,
    initialPayload: Record<string, any> = {}
  ): WorkflowExecution {
    const nodeExecutions: Record<string, WorkflowNodeExecution> = {}
    for (const node of workflow.nodes) {
      nodeExecutions[node.id] = {
        nodeId: node.id,
        nodeLabel: node.label,
        nodeType: node.type,
        status: 'idle'
      }
    }

    return {
      id: `wfx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: 'Running',
      nodeExecutions,
      context: { ...initialPayload },
      startedAt: new Date().toISOString()
    }
  }

  /**
   * Executes a workflow DAG step-by-step from trigger to completion
   */
  static async runWorkflow(
    workflow: WorkflowDefinition,
    initialPayload: Record<string, any> = {}
  ): Promise<WorkflowExecution> {
    const execution = this.createExecution(workflow, initialPayload)
    const triggerNode = workflow.nodes.find((n) => n.type === 'TRIGGER') || workflow.nodes[0]

    if (!triggerNode) {
      execution.status = 'Failed'
      execution.completedAt = new Date().toISOString()
      return execution
    }

    await this.executeNode(triggerNode, workflow, execution)
    return execution
  }

  /**
   * Resumes a paused workflow after an approval gate decision
   */
  static async resumeExecution(
    workflow: WorkflowDefinition,
    execution: WorkflowExecution,
    approved: boolean
  ): Promise<WorkflowExecution> {
    if (!execution.currentNodeId) return execution

    const approvalNode = workflow.nodes.find((n) => n.id === execution.currentNodeId)
    if (!approvalNode) return execution

    const nodeExec = execution.nodeExecutions[approvalNode.id]
    if (approved) {
      nodeExec.status = 'completed'
      nodeExec.completedAt = new Date().toISOString()
      nodeExec.output = { approved: true, approvedBy: 'Workspace Owner' }
      execution.status = 'Running'

      // Continue to next nodes
      const nextNodes = this.getNextNodes(approvalNode, workflow, execution)
      for (const next of nextNodes) {
        await this.executeNode(next, workflow, execution)
      }
    } else {
      nodeExec.status = 'failed'
      nodeExec.completedAt = new Date().toISOString()
      nodeExec.error = 'Rejected by Workspace Owner'
      execution.status = 'Failed'
      execution.completedAt = new Date().toISOString()
    }

    return execution
  }

  /**
   * Recursive execution of an individual node in the DAG
   */
  private static async executeNode(
    node: WorkflowNode,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution
  ): Promise<void> {
    const nodeExec = execution.nodeExecutions[node.id]
    nodeExec.status = 'running'
    nodeExec.startedAt = new Date().toISOString()
    execution.currentNodeId = node.id

    try {
      switch (node.type) {
        case 'TRIGGER':
          nodeExec.output = {
            triggeredAt: new Date().toISOString(),
            payload: execution.context
          }
          nodeExec.status = 'completed'
          break

        case 'CLASSIFIER': {
          const textToClassify = String(
            execution.context.body || execution.context.title || execution.context.subject || 'Engineering task'
          ).toLowerCase()

          let detectedCategory = 'GENERAL'
          const rules = node.config.classifierRules || [
            { category: 'FINANCE', keywords: ['transfer', 'pembayaran', 'bayar', 'invoice', 'rp', 'bank'] },
            { category: 'BUG_FIX', keywords: ['error', 'bug', 'fail', 'panic', 'broken', 'mutex'] },
            { category: 'FEATURE', keywords: ['fitur', 'feature', 'enhancement', 'tambah'] }
          ]

          for (const rule of rules) {
            if (rule.keywords.some((k) => textToClassify.includes(k.toLowerCase()))) {
              detectedCategory = rule.category
              break
            }
          }

          execution.context.category = detectedCategory
          nodeExec.output = { detectedCategory, confidence: 0.94 }
          nodeExec.status = 'completed'
          break
        }

        case 'AGENT_TASK': {
          const assignee = node.config.assignedEmployeeName || 'Bima Wicaksono'
          const prompt = node.config.taskInstructions || 'Execute autonomous task instructions'
          // Simulated agent task execution step
          execution.context.agentDeliverable = `Task executed successfully by ${assignee}. AST clean, tests passed.`
          nodeExec.output = {
            assignee,
            prompt,
            deliverable: execution.context.agentDeliverable,
            tokensConsumed: 450,
            costUsd: 0.003
          }
          nodeExec.status = 'completed'
          break
        }

        case 'CONDITION': {
          // If condition checks e.g. context.category === 'FINANCE'
          const expr = node.config.conditionExpression || "category === 'BUG_FIX'"
          let branchResult = true
          if (expr.includes('FINANCE')) {
            branchResult = execution.context.category === 'FINANCE'
          } else if (expr.includes('BUG_FIX')) {
            branchResult = execution.context.category === 'BUG_FIX'
          }

          execution.context.lastConditionResult = branchResult
          nodeExec.output = { expression: expr, result: branchResult }
          nodeExec.status = 'completed'
          break
        }

        case 'APPROVAL':
          nodeExec.status = 'waiting_approval'
          execution.status = 'Waiting_Approval'
          nodeExec.output = {
            prompt: node.config.approvalPrompt || 'Persetujuan Owner diperlukan sebelum mengirim pesan / commit.',
            requestedAt: new Date().toISOString()
          }
          return // Pause execution until human confirms

        case 'INTEGRATION_ACTION': {
          const action = node.config.integrationAction || 'GITHUB_CREATE_PR'
          let actionResult = {}
          if (action === 'GITHUB_CREATE_PR') {
            actionResult = { prNumber: 42, branch: 'fix/auth-mutex', url: 'https://github.com/org/repo/pull/42' }
          } else if (action === 'EMAIL_SEND_RECAP') {
            actionResult = { messageId: 'msg-rec-01', recipient: 'owner@satria.internal', sent: true }
          } else {
            actionResult = { file: 'deliverables/summary.md', status: 'written' }
          }
          nodeExec.output = { action, result: actionResult }
          nodeExec.status = 'completed'
          break
        }

        case 'OUTPUT':
          nodeExec.output = {
            summary: 'Workflow pipeline execution completed with zero defects.',
            finalContext: execution.context
          }
          nodeExec.status = 'completed'
          break
      }

      nodeExec.completedAt = new Date().toISOString()

      // Traverse next connected nodes
      const nextNodes = this.getNextNodes(node, workflow, execution)
      if (nextNodes.length === 0) {
        execution.status = 'Completed'
        execution.completedAt = new Date().toISOString()
      } else {
        for (const next of nextNodes) {
          await this.executeNode(next, workflow, execution)
        }
      }
    } catch (err: any) {
      nodeExec.status = 'failed'
      nodeExec.error = err?.message || 'Node execution failed'
      nodeExec.completedAt = new Date().toISOString()
      execution.status = 'Failed'
      execution.completedAt = new Date().toISOString()
    }
  }

  /**
   * Finds subsequent nodes based on edges and conditional branching
   */
  private static getNextNodes(
    currentNode: WorkflowNode,
    workflow: WorkflowDefinition,
    execution: WorkflowExecution
  ): WorkflowNode[] {
    const outboundEdges = workflow.edges.filter((e) => e.source === currentNode.id)
    const nextNodes: WorkflowNode[] = []

    for (const edge of outboundEdges) {
      if (currentNode.type === 'CONDITION' && edge.conditionBranch) {
        const conditionResult = Boolean(execution.context.lastConditionResult)
        if (
          (edge.conditionBranch === 'true' && !conditionResult) ||
          (edge.conditionBranch === 'false' && conditionResult)
        ) {
          // Skip branch that did not match
          continue
        }
      }

      const targetNode = workflow.nodes.find((n) => n.id === edge.target)
      if (targetNode) {
        nextNodes.push(targetNode)
      }
    }

    return nextNodes
  }
}
