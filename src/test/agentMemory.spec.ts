import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { MemoryRepository } from '../repositories'
import { MemoryRecallFormatter } from '../runtime/context/MemoryRecallFormatter'
import { ContextBuilder } from '../runtime/context/ContextBuilder'
import { HierarchicalMemoryService } from '../services/memory/HierarchicalMemoryService'
import { useMemoryStore } from '../stores/memory'
import { useAgentRunStore } from '../stores/agentRun'
import { canManageOrganizationMemory } from '../utils/rbac'
import type { AgentMemoryItem, TaskAssignment, Employee } from '../types'
import type { AgentRunInput } from '../runtime/types'

describe('SATRIA AI Workforce — Hierarchical Agent Memory Subsystem (Phase 4.1)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('1. MemoryRepository & 5-Tier Recall Engine', () => {
    it('creates, retrieves, updates, and deletes agent memories across tiers', async () => {
      const repo = new MemoryRepository()

      const created = await repo.create({
        workspaceId: 'ws-dev',
        tier: 'EMPLOYEE',
        employeeId: 'emp-bima',
        employeeName: 'Bima Wicaksono',
        type: 'procedural',
        scope: 'employee',
        title: 'Vitest Test Execution Protocol',
        content: 'Always run vitest in single-run mode for CI/CD checks.',
        tags: ['testing', 'vitest', 'ci'],
        confidence: 0.99,
        importance: 5,
        source: 'manual_entry'
      })

      expect(created.id).toBeDefined()
      expect(created.tier).toBe('EMPLOYEE')
      expect(created.accessCount).toBe(0)
      expect(created.createdAt).toBeDefined()

      const fetched = await repo.getById(created.id)
      expect(fetched?.title).toBe('Vitest Test Execution Protocol')

      const updated = await repo.update(created.id, { importance: 4 })
      expect(updated?.importance).toBe(4)

      const deleted = await repo.delete(created.id)
      expect(deleted).toBe(true)

      const afterDelete = await repo.getById(created.id)
      expect(afterDelete).toBeUndefined()
    })

    it('recalls relevant memories matching workspace, scope, keywords, and tags', async () => {
      const repo = new MemoryRepository()

      const recalled = await repo.recall({
        workspaceId: 'ws-dev',
        employeeId: 'emp-bima',
        projectId: 'prj-satria-ui',
        queryText: 'Design tokens and dark mode palette',
        tags: ['design_system', 'styling'],
        limit: 3
      })

      expect(recalled.length).toBeGreaterThan(0)
      expect(recalled.length).toBeLessThanOrEqual(3)

      const firstMemory = recalled[0]
      expect(firstMemory.accessCount).toBeGreaterThan(0)
      expect(firstMemory.lastAccessedAt).toBeDefined()
    })

    it('filters out memories below minConfidence threshold', async () => {
      const repo = new MemoryRepository()

      const lowConfidenceMemory = await repo.create({
        workspaceId: 'ws-dev',
        tier: 'WORKSPACE',
        type: 'episodic',
        scope: 'global',
        title: 'Uncertain observation',
        content: 'Might be an intermittent glitch.',
        tags: ['experimental'],
        confidence: 0.3,
        importance: 1,
        source: 'autonomous_run'
      })

      const recalled = await repo.recall({
        workspaceId: 'ws-dev',
        queryText: 'glitch',
        minConfidence: 0.8
      })

      expect(recalled.some((m) => m.id === lowConfidenceMemory.id)).toBe(false)
    })
  })

  describe('2. HierarchicalMemoryService & Tiered Categorization', () => {
    it('categorizes recalled memories into 5 hierarchy tiers (Run -> Task -> Project -> Employee -> Workspace)', async () => {
      const recallCtx = await HierarchicalMemoryService.recallHierarchical({
        workspaceId: 'ws-dev',
        employeeId: 'emp-bima',
        projectId: 'prj-satria-ui',
        queryText: 'JWT token concurrency and accessibility standards',
        limit: 5
      })

      expect(recallCtx.totalItemsRecalled).toBeGreaterThan(0)
      expect(recallCtx.totalTokenEstimate).toBeGreaterThan(0)
      expect(recallCtx.injectedPromptSection).toContain('### 🧠 HIERARCHICAL AGENT MEMORY')

      // Check tier distribution
      expect(recallCtx.employeeExperience.length).toBeGreaterThan(0)
      expect(recallCtx.workspaceKnowledge.length).toBeGreaterThan(0)

      // Check Bima's specialized experience is in employeeExperience
      const bimaExp = recallCtx.employeeExperience.find((m) => m.employeeId === 'emp-bima')
      expect(bimaExp).toBeDefined()
      expect(bimaExp?.title).toContain('JWT Refresh Token Concurrency')
    })

    it('enforces token budget cap on hierarchical recall without bloating prompt', async () => {
      const recallCtx = await HierarchicalMemoryService.recallHierarchical({
        workspaceId: 'ws-dev',
        employeeId: 'emp-bima',
        projectId: 'prj-satria-ui',
        queryText: 'security and design tokens',
        maxTokenBudget: 100 // strict small budget
      })

      expect(recallCtx.totalTokenEstimate).toBeLessThanOrEqual(400)
    })
  })

  describe('3. MemoryRecallFormatter & ContextBuilder Prompt Injection', () => {
    it('formats memories into structured prompt blocks with scope, type, and confidence', () => {
      const mockMemories: AgentMemoryItem[] = [
        {
          id: 'mem-1',
          workspaceId: 'ws-dev',
          tier: 'WORKSPACE',
          type: 'semantic',
          scope: 'global',
          title: 'Tailwind Semantic Tokens',
          content: 'Do not use raw hex colors.',
          tags: ['css', 'ui'],
          confidence: 0.98,
          importance: 5,
          source: 'system_rule',
          accessCount: 5,
          createdAt: '2026-08-14T00:00:00Z',
          updatedAt: '2026-08-14T00:00:00Z'
        }
      ]

      const formatted = MemoryRecallFormatter.format(mockMemories)
      expect(formatted).toContain('[MEMORY #1 | Scope: GLOBAL | Type: SEMANTIC | Confidence: 98%]')
      expect(formatted).toContain('Title: Tailwind Semantic Tokens')
      expect(formatted).toContain('Do not use raw hex colors.')
    })

    it('injects recalled memories into ContextBuilder system prompt', () => {
      const mockEmployee: Employee = {
        id: 'emp-bima',
        name: 'Bima Wicaksono',
        roleId: 'role-dev',
        roleName: 'Senior Backend Engineer',
        departmentId: 'dept-eng',
        departmentName: 'Engineering',
        avatar: '',
        status: 'Active',
        description: 'Core developer',
        skills: [],
        toolIds: [],
        permissions: [],
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01'
      }

      const mockAssignment: TaskAssignment = {
        id: 'asg-01',
        taskId: 'tsk-01',
        taskTitle: 'Implement Payment Gateway',
        employeeId: 'emp-bima',
        employeeName: 'Bima Wicaksono',
        employeeAvatar: '',
        employeeRole: 'Senior Backend Engineer',
        assignedBy: 'Lead',
        skillIds: [],
        priority: 'High',
        status: 'In Progress',
        createdAt: '2026-08-14',
        updatedAt: '2026-08-14'
      }

      const mockMemories: AgentMemoryItem[] = [
        {
          id: 'mem-bima-01',
          workspaceId: 'ws-dev',
          tier: 'EMPLOYEE',
          employeeId: 'emp-bima',
          type: 'procedural',
          scope: 'employee',
          title: 'Payment Idempotency Rule',
          content: 'Always supply Idempotency-Key header on mutation requests.',
          tags: ['payments', 'api'],
          confidence: 0.99,
          importance: 5,
          source: 'manual_entry',
          accessCount: 1,
          createdAt: '2026-08-14',
          updatedAt: '2026-08-14'
        }
      ]

      const input: AgentRunInput = {
        runId: 'run-test-01',
        assignment: mockAssignment,
        employee: mockEmployee,
        skills: [],
        tools: [],
        workspacePath: 'C:/Projects/App',
        taskPrompt: 'Implement checkout idempotency',
        memories: mockMemories
      }

      const built = ContextBuilder.build(input)
      expect(built.systemPrompt).toContain('### RECALLED AGENT MEMORIES & LESSONS (PAST EXPERIENCE):')
      expect(built.systemPrompt).toContain('Payment Idempotency Rule')
      expect(built.metadata.memoryCount).toBe(1)
    })
  })

  describe('4. Role-Based Access Control (RBAC) Governance', () => {
    it('grants canManageOrganizationMemory only to Owner, Director, and Lead', () => {
      expect(canManageOrganizationMemory('Owner')).toBe(true)
      expect(canManageOrganizationMemory('Director')).toBe(true)
      expect(canManageOrganizationMemory('Lead')).toBe(true)
      expect(canManageOrganizationMemory('Developer')).toBe(false)
      expect(canManageOrganizationMemory('Viewer')).toBe(false)
    })
  })

  describe('5. Pinia Memory Store & Autonomous Learning Loop', () => {
    it('manages hierarchical memory collections, tier filtering, and CRUD', async () => {
      const store = useMemoryStore()
      await store.fetchMemories('ws-dev')

      expect(store.memories.length).toBeGreaterThan(0)

      // Test tier filtering
      store.selectedTier = 'WORKSPACE'
      expect(store.filteredMemories.every((m) => m.tier === 'WORKSPACE')).toBe(true)

      store.selectedTier = 'All'
      store.searchQuery = 'Semantic'
      expect(store.filteredMemories.every((m) => m.title.includes('Semantic') || m.content.includes('Semantic'))).toBe(true)
    })

    it('synthesizes lessons autonomously into EMPLOYEE tier memory from completed execution run', async () => {
      const memoryStore = useMemoryStore()
      const agentRunStore = useAgentRunStore()

      const assignment: TaskAssignment = {
        id: 'asg-mem-test',
        taskId: 'tsk-mem-test',
        taskTitle: 'Build Responsive Header Bar',
        employeeId: 'emp-bima',
        employeeName: 'Bima Wicaksono',
        employeeAvatar: '',
        employeeRole: 'Senior Backend Engineer',
        assignedBy: 'Lead',
        skillIds: [],
        priority: 'High',
        status: 'In Progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const run = await agentRunStore.createRun(assignment, 1)
      run.durationSeconds = 12
      run.outputSummary = 'Header bar responsive breakpoint verified.'

      const learned = await memoryStore.learnFromExecution(run, 'Completed')
      expect(learned.tier).toBe('EMPLOYEE')
      expect(learned.type).toBe('episodic')
      expect(learned.employeeId).toBe('emp-bima')
      expect(learned.title).toContain('Execution Success Pattern')
      expect(learned.tags).toContain('autonomous_success')
    })
  })
})
