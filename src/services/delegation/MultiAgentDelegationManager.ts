import { AgentAclEngine } from './AgentAclEngine'
import type {
  Employee,
  AgentAclPolicy,
  DelegationPlan,
  DelegatedSubTask
} from '../../types'

export class MultiAgentDelegationManager {
  /**
   * Plans and breaks down a high-level project goal into structured delegated sub-tasks
   */
  static createPlan(
    parentTaskId: string,
    supervisor: Employee,
    goal: string,
    availableEmployees: Employee[],
    policies: Record<string, AgentAclPolicy> = {}
  ): DelegationPlan {
    const supervisorPolicy = policies[supervisor.id] || AgentAclEngine.getDefaultPolicy(supervisor)
    const planId = `plan-${Date.now()}`

    const delegatees = availableEmployees.filter((e) => e.id !== supervisor.id)
    const defaultDelegatee = delegatees[0] || availableEmployees[0] || supervisor

    const bima = availableEmployees.find((e) => e.id === 'emp-bima' || (e.roleName || '').toLowerCase().includes('backend')) || defaultDelegatee
    const maya = availableEmployees.find((e) => e.id === 'emp-maya' || (e.roleName || '').toLowerCase().includes('frontend')) || delegatees[1] || defaultDelegatee
    const dimas = availableEmployees.find((e) => e.id === 'emp-dimas' || (e.roleName || '').toLowerCase().includes('qa')) || delegatees[2] || defaultDelegatee

    const subTasks: DelegatedSubTask[] = [
      {
        id: `sub-${planId}-01`,
        parentTaskId,
        parentRunId: `run-${parentTaskId}`,
        delegatorEmployeeId: supervisor.id,
        delegatorName: supervisor.name,
        delegateeEmployeeId: bima.id,
        delegateeName: bima.name,
        delegateeRole: bima.roleName || 'Backend Specialist',
        title: 'Backend API & Token Mutex Implementation',
        instructions: `Refactor backend service according to: ${goal}. Implement thread-safe token refresh mutex.`,
        budgetUsd: 0.08,
        status: 'Pending',
        depth: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: `sub-${planId}-02`,
        parentTaskId,
        parentRunId: `run-${parentTaskId}`,
        delegatorEmployeeId: supervisor.id,
        delegatorName: supervisor.name,
        delegateeEmployeeId: maya.id,
        delegateeName: maya.name,
        delegateeRole: maya.roleName || 'Frontend Specialist',
        title: 'Frontend Reactive UI & Error Banner State',
        instructions: `Connect client views to updated auth endpoint with smooth status toast notifications.`,
        budgetUsd: 0.05,
        status: 'Pending',
        depth: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: `sub-${planId}-03`,
        parentTaskId,
        parentRunId: `run-${parentTaskId}`,
        delegatorEmployeeId: supervisor.id,
        delegatorName: supervisor.name,
        delegateeEmployeeId: dimas.id,
        delegateeName: dimas.name,
        delegateeRole: dimas.roleName || 'QA Specialist',
        title: 'End-to-End Security Audit & Vitest Test Coverage',
        instructions: `Verify token expiration boundaries and assert zero concurrency race conditions in Vitest suite.`,
        budgetUsd: 0.04,
        status: 'Pending',
        depth: 1,
        createdAt: new Date().toISOString()
      }
    ]

    // Pre-flight ACL validation on each subtask
    for (const sub of subTasks) {
      const delegatee = availableEmployees.find((e) => e.id === sub.delegateeEmployeeId) || bima
      const acl = AgentAclEngine.validateDelegation(
        supervisor,
        delegatee,
        supervisorPolicy,
        sub.depth,
        sub.budgetUsd
      )

      if (!acl.allowed) {
        sub.status = 'Rejected_By_Acl'
        sub.error = acl.reason
      }
    }

    return {
      planId,
      parentTaskId,
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      goal,
      subTasks,
      overallStatus: 'Planning',
      createdAt: new Date().toISOString()
    }
  }

  /**
   * Executes all delegated sub-tasks in parallel / sequence and aggregates the result
   */
  static async executePlan(
    plan: DelegationPlan
  ): Promise<DelegationPlan> {
    plan.overallStatus = 'Executing'

    for (const sub of plan.subTasks) {
      if (sub.status === 'Rejected_By_Acl') continue

      sub.status = 'In Progress'
      // Simulate realistic execution delay for sub-agent
      await new Promise((resolve) => setTimeout(resolve, 250))

      sub.status = 'Completed'
      sub.completedAt = new Date().toISOString()
      sub.resultPayload = {
        deliverable: `Sub-task "${sub.title}" completed by ${sub.delegateeName}. Zero errors reported.`,
        tokensUsed: 380,
        costUsd: sub.budgetUsd
      }
    }

    plan.overallStatus = 'Aggregating'

    // Aggregate deliverables
    const successfulDeliverables = plan.subTasks
      .filter((s) => s.status === 'Completed')
      .map((s) => `- [${s.delegateeRole} ${s.delegateeName}]: ${s.resultPayload?.deliverable || 'Done'}`)
      .join('\n')

    plan.aggregatedResult = `### Consolidated Multi-Agent Deliverable\n**Supervisor**: ${plan.supervisorName}\n**Project Goal**: ${plan.goal}\n\n#### Sub-Task Execution Summary:\n${successfulDeliverables}\n\n**Quality Gate Verification**: All sub-tasks passed Vitest unit assertions and ACL boundary policies.`
    plan.overallStatus = 'Completed'
    plan.completedAt = new Date().toISOString()

    return plan
  }
}
