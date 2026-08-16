import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { AgentAclEngine } from '../services/delegation/AgentAclEngine'
import { MultiAgentDelegationManager } from '../services/delegation/MultiAgentDelegationManager'
import { useDelegationStore } from '../stores/delegation'
import type { Employee } from '../types'

describe('SATRIA AI Workforce — Multi-Agent Delegation & ACL Subsystem (Phase 6)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mockSupervisor: Employee = {
    id: 'emp-raka',
    name: 'Raka Pratama',
    roleId: 'role-planner',
    roleName: 'Lead Project Planner & Architect',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    avatar: '',
    status: 'Active',
    description: 'Lead planner',
    skills: [],
    toolIds: ['tool-filesystem', 'tool-bash', 'tool-github'],
    permissions: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01'
  }

  const mockSpecialistBackend: Employee = {
    id: 'emp-bima',
    name: 'Bima Wicaksono',
    roleId: 'role-backend',
    roleName: 'Senior Backend Engineer',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    avatar: '',
    status: 'Active',
    description: 'Backend specialist',
    skills: [],
    toolIds: ['tool-filesystem', 'tool-bash'],
    permissions: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01'
  }

  const mockWorkerJunior: Employee = {
    id: 'emp-junior',
    name: 'Junior Assistant',
    roleId: 'role-trainee',
    roleName: 'Trainee Assistant',
    departmentId: 'dept-eng',
    departmentName: 'Engineering',
    avatar: '',
    status: 'Active',
    description: 'Trainee',
    skills: [],
    toolIds: ['tool-filesystem'],
    permissions: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01'
  }

  describe('1. AgentAclEngine Boundary Tests', () => {
    it('authorizes delegation for Lead / Supervisor agents', () => {
      const policy = AgentAclEngine.getDefaultPolicy(mockSupervisor)
      expect(policy.roleLevel).toBe('SUPERVISOR')
      expect(policy.canDelegate).toBe(true)
      expect(policy.maxDelegationDepth).toBe(2)

      const validation = AgentAclEngine.validateDelegation(
        mockSupervisor,
        mockSpecialistBackend,
        policy,
        1,
        0.08
      )
      expect(validation.allowed).toBe(true)
    })

    it('rejects delegation attempt from worker without delegation permissions', () => {
      const juniorPolicy = AgentAclEngine.getDefaultPolicy(mockWorkerJunior)
      expect(juniorPolicy.canDelegate).toBe(false)

      const validation = AgentAclEngine.validateDelegation(
        mockWorkerJunior,
        mockSpecialistBackend,
        juniorPolicy,
        1,
        0.05
      )
      expect(validation.allowed).toBe(false)
      expect(validation.reason).toContain('ACL_DENIED')
    })

    it('rejects delegation when recursion depth reaches max limit', () => {
      const policy = AgentAclEngine.getDefaultPolicy(mockSupervisor)
      const validation = AgentAclEngine.validateDelegation(
        mockSupervisor,
        mockSpecialistBackend,
        policy,
        2, // depth 2 equals maxDelegationDepth 2
        0.05
      )
      expect(validation.allowed).toBe(false)
      expect(validation.reason).toContain('ACL_DEPTH_EXCEEDED')
    })

    it('rejects delegation when sub-task budget exceeds cap', () => {
      const policy = AgentAclEngine.getDefaultPolicy(mockSupervisor)
      const validation = AgentAclEngine.validateDelegation(
        mockSupervisor,
        mockSpecialistBackend,
        policy,
        1,
        1.50 // exceeds $0.25 max
      )
      expect(validation.allowed).toBe(false)
      expect(validation.reason).toContain('ACL_BUDGET_CAP_EXCEEDED')
    })
  })

  describe('2. MultiAgentDelegationManager Decomposition & Execution', () => {
    it('decomposes project goal into structured specialist subtasks', () => {
      const plan = MultiAgentDelegationManager.createPlan(
        'tsk-parent-101',
        mockSupervisor,
        'Full-Stack Auth Concurrency Fix',
        [mockSupervisor, mockSpecialistBackend, mockWorkerJunior]
      )

      expect(plan.subTasks.length).toBe(3)
      expect(plan.overallStatus).toBe('Planning')
      expect(plan.subTasks[0].status).toBe('Pending')
      expect(plan.subTasks[0].delegatorEmployeeId).toBe(mockSupervisor.id)
    })

    it('executes sub-tasks and synthesizes consolidated deliverable', async () => {
      const plan = MultiAgentDelegationManager.createPlan(
        'tsk-parent-102',
        mockSupervisor,
        'Payment Webhook Reconciliation',
        [mockSupervisor, mockSpecialistBackend]
      )

      const completed = await MultiAgentDelegationManager.executePlan(plan)

      expect(completed.overallStatus).toBe('Completed')
      expect(completed.aggregatedResult).toBeDefined()
      expect(completed.aggregatedResult).toContain('Consolidated Multi-Agent Deliverable')
      expect(completed.subTasks.every((s) => s.status === 'Completed')).toBe(true)
    })

    it('operates reactively with useDelegationStore Pinia store', async () => {
      const store = useDelegationStore()
      const plan = store.createPlan('tsk-103', 'Database Schema Migration')

      expect(store.plans.length).toBe(1)
      expect(store.activePlanId).toBe(plan.planId)

      const executed = await store.executeActivePlan()
      expect(executed?.overallStatus).toBe('Completed')
    })
  })
})
