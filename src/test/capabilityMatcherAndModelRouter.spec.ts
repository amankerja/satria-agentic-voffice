import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { CapabilityMatcherEngine } from '../services/workforce/CapabilityMatcherEngine'
import { ModelRouter } from '../runtime/router/ModelRouter'
import { useAssignmentStore } from '../stores/assignment'
import { useGovernanceStore } from '../stores/governance'
import type { Employee, Task, AgentRun, TaskAssignment } from '../types'

describe('SATRIA AI Workforce — Capability Matching 2.0 & Dynamic Model Router (Phase 4.2 & 4.3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('1. CapabilityMatcherEngine (Formula 2.0: Skill + Performance + Workload + Cost - Risk)', () => {
    const mockEmployees: Employee[] = [
      {
        id: 'emp-bima',
        name: 'Bima Wicaksono',
        roleId: 'role-backend',
        roleName: 'Senior Backend Engineer',
        departmentId: 'dept-eng',
        departmentName: 'Engineering',
        avatar: '',
        status: 'Active',
        description: 'Backend specialist',
        skills: [
          { skillId: 'skill-golang', priority: 'P0', assignedAt: '2026-08-01' },
          { skillId: 'skill-jwt-auth', priority: 'P0', assignedAt: '2026-08-01' },
          { skillId: 'skill-docker', priority: 'P1', assignedAt: '2026-08-01' }
        ],
        toolIds: ['tool-filesystem', 'tool-bash'],
        permissions: [],
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01'
      },
      {
        id: 'emp-maya',
        name: 'Maya Salsabila',
        roleId: 'role-frontend',
        roleName: 'Lead Frontend Engineer',
        departmentId: 'dept-eng',
        departmentName: 'Engineering',
        avatar: '',
        status: 'Active',
        description: 'Frontend specialist',
        skills: [
          { skillId: 'skill-vue-ts', priority: 'P0', assignedAt: '2026-08-01' },
          { skillId: 'skill-tailwind', priority: 'P0', assignedAt: '2026-08-01' }
        ],
        toolIds: ['tool-filesystem'],
        permissions: [],
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01'
      },
      {
        id: 'emp-dimas',
        name: 'Dimas Anggara',
        roleId: 'role-qa',
        roleName: 'QA & Security Engineer',
        departmentId: 'dept-eng',
        departmentName: 'Engineering',
        avatar: '',
        status: 'Active',
        description: 'QA & Security specialist',
        skills: [
          { skillId: 'skill-vitest', priority: 'P0', assignedAt: '2026-08-01' },
          { skillId: 'skill-jwt-auth', priority: 'P1', assignedAt: '2026-08-01' }
        ],
        toolIds: ['tool-filesystem', 'tool-bash'],
        permissions: [],
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01'
      }
    ]

    const mockHistoricalRuns: AgentRun[] = [
      {
        id: 'run-bima-1',
        assignmentId: 'asg-01',
        currentStep: 'Completing',
        progress: 100,
        createdAt: '2026-08-14',
        updatedAt: '2026-08-14',
        taskId: 'tsk-01',
        taskTitle: 'Auth Mutex Fix',
        employeeId: 'emp-bima',
        employeeName: 'Bima Wicaksono',
        employeeRole: 'Senior Backend Engineer',
        employeeAvatar: '',
        status: 'Completed',
        attempt: 1,
        startedAt: '2026-08-14',
        durationSeconds: 15,
        telemetry: {
          promptTokens: 1200,
          completionTokens: 400,
          totalTokens: 1600,
          cachedTokens: 0,
          estimatedCostUsd: 0.008,
          durationMs: 15000,
          model: 'claude-3-5-sonnet-20241022',
          provider: 'Anthropic'
        },
        logs: []
      }
    ]

    it('ranks Bima as #1 Best Match for Go/JWT Backend Task with highest capability score', () => {
      const task: Partial<Task> = {
        id: 'tsk-jwt-fix',
        title: 'Fix Golang JWT Auth Mutex and Containerize',
        requiredSkillIds: ['skill-golang', 'skill-jwt-auth'],
        optionalSkillIds: ['skill-docker']
      }

      const report = CapabilityMatcherEngine.evaluateCandidates(
        task,
        mockEmployees,
        mockHistoricalRuns,
        []
      )

      expect(report.rankings.length).toBe(3)
      expect(report.bestCandidate?.employeeId).toBe('emp-bima')
      expect(report.bestCandidate?.isBestMatch).toBe(true)
      expect(report.bestCandidate?.capabilityScore).toBeGreaterThan(85)
      expect(report.bestCandidate?.matchedSkills).toContain('skill-golang')
      expect(report.bestCandidate?.matchedSkills).toContain('skill-jwt-auth')

      // Maya should have lower score due to missing required skills
      const maya = report.rankings.find((r) => r.employeeId === 'emp-maya')
      expect(maya?.capabilityScore).toBeLessThan(report.bestCandidate!.capabilityScore)
      expect(maya?.missingSkills).toContain('skill-golang')
    })

    it('penalizes busy employees with reduced availability score', () => {
      const task: Partial<Task> = {
        id: 'tsk-vue-fix',
        title: 'Fix Vue Header Component',
        requiredSkillIds: ['skill-vue-ts']
      }

      const activeAssignments: TaskAssignment[] = [
        {
          id: 'asg-maya-1',
          taskId: 'tsk-other-1',
          taskTitle: 'Other task',
          employeeId: 'emp-maya',
          employeeName: 'Maya Salsabila',
          employeeAvatar: '',
          employeeRole: 'Lead Frontend Engineer',
          assignedBy: 'Lead',
          skillIds: [],
          priority: 'High',
          status: 'In Progress',
          createdAt: '2026-08-15',
          updatedAt: '2026-08-15'
        },
        {
          id: 'asg-maya-2',
          taskId: 'tsk-other-2',
          taskTitle: 'Another task',
          employeeId: 'emp-maya',
          employeeName: 'Maya Salsabila',
          employeeAvatar: '',
          employeeRole: 'Lead Frontend Engineer',
          assignedBy: 'Lead',
          skillIds: [],
          priority: 'Medium',
          status: 'In Progress',
          createdAt: '2026-08-15',
          updatedAt: '2026-08-15'
        },
        {
          id: 'asg-maya-3',
          taskId: 'tsk-other-3',
          taskTitle: 'Third task',
          employeeId: 'emp-maya',
          employeeName: 'Maya Salsabila',
          employeeAvatar: '',
          employeeRole: 'Lead Frontend Engineer',
          assignedBy: 'Lead',
          skillIds: [],
          priority: 'Medium',
          status: 'In Progress',
          createdAt: '2026-08-15',
          updatedAt: '2026-08-15'
        }
      ]

      const report = CapabilityMatcherEngine.evaluateCandidates(
        task,
        mockEmployees,
        mockHistoricalRuns,
        activeAssignments
      )

      const maya = report.rankings.find((r) => r.employeeId === 'emp-maya')
      expect(maya?.availabilityScore).toBe(20) // heavily loaded
      expect(maya?.workState).toBe('Running')
    })

    it('works directly through useAssignmentStore.evaluateCapability2 action', () => {
      const store = useAssignmentStore()
      const task: Partial<Task> = {
        title: 'Backend API implementation',
        requiredSkillIds: ['skill-golang']
      }

      const report = store.evaluateCapability2(task, mockEmployees, mockHistoricalRuns)
      expect(report.rankings.length).toBe(3)
      expect(report.bestCandidate?.employeeId).toBe('emp-bima')
    })
  })

  describe('2. Dynamic Multi-Model Router (ModelRouter)', () => {
    it('classifies task categories accurately based on executionMode and prompt semantics', () => {
      expect(
        ModelRouter.classifyTaskCategory({ executionMode: 'EMAIL_INTELLIGENCE', title: 'Rekap mutasi email BCA' })
      ).toBe('FAST_EXTRACTION')

      expect(
        ModelRouter.classifyTaskCategory({ executionMode: 'ENGINEERING_EXECUTION', title: 'Fix bug login controller' })
      ).toBe('CODING_ENGINEERING')

      expect(
        ModelRouter.classifyTaskCategory({ executionMode: 'CROSS_SYSTEM', title: 'Perencanaan migrasi database' })
      ).toBe('DEEP_REASONING_PLANNING')

      expect(
        ModelRouter.classifyTaskCategory({ executionMode: 'EMAIL_INTELLIGENCE', title: 'Filter spam dan forward' })
      ).toBe('SIMPLE_CLASSIFICATION')
    })

    it('routes CODING_ENGINEERING to Claude 3.5 Sonnet in BALANCED policy', () => {
      const decision = ModelRouter.routeTask(
        { executionMode: 'ENGINEERING_EXECUTION', title: 'Implement Vitest unit test' },
        {},
        'BALANCED'
      )

      expect(decision.selectedModel).toBe('claude-3-5-sonnet-20241022')
      expect(decision.selectedProvider).toBe('Anthropic')
      expect(decision.taskCategory).toBe('CODING_ENGINEERING')
      expect(decision.fallbackModel).toBe('gpt-4o')
    })

    it('routes FAST_EXTRACTION to GPT-4o Mini in BALANCED policy', () => {
      const decision = ModelRouter.routeTask(
        { executionMode: 'EMAIL_INTELLIGENCE', title: 'Rekap data transaksi CSV' },
        {},
        'BALANCED'
      )

      expect(decision.selectedModel).toBe('gpt-4o-mini')
      expect(decision.selectedProvider).toBe('OpenAI')
      expect(decision.taskCategory).toBe('FAST_EXTRACTION')
      expect(decision.estimatedCostPer1kTokens).toBeLessThan(0.001)
    })

    it('routes all tasks to cost-efficient models in COST_OPTIMIZED policy', () => {
      const decision = ModelRouter.routeTask(
        { executionMode: 'ENGINEERING_EXECUTION', title: 'Refactor auth service' },
        {},
        'COST_OPTIMIZED'
      )

      expect(decision.selectedModel).toBe('gpt-4o-mini')
      expect(decision.policy).toBe('COST_OPTIMIZED')
    })

    it('routes all tasks to top reasoning model in QUALITY_FIRST policy', () => {
      const decision = ModelRouter.routeTask(
        { title: 'General prompt classification' },
        {},
        'QUALITY_FIRST'
      )

      expect(decision.selectedModel).toBe('claude-3-5-sonnet-20241022')
      expect(decision.policy).toBe('QUALITY_FIRST')
    })

    it('integrates seamlessly with useGovernanceStore and Pinia', () => {
      const govStore = useGovernanceStore()
      govStore.setModelRouterPolicy('LOW_LATENCY')

      const decision = govStore.routeModelForTask({
        title: 'Interactive chatbot query'
      })

      expect(decision.policy).toBe('LOW_LATENCY')
      expect(decision.selectedModel).toBe('claude-3-haiku-20240307')
      expect(decision.estimatedLatencyMs).toBeLessThanOrEqual(300)
    })
  })
})
