import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  RuntimeFactory,
  SandboxPolicy,
  SkillLoader,
  ContextBuilder,
  CostCalculator,
  VerificationEngine,
  HermesMapper
} from '../runtime'
import { useAgentRunStore } from '../stores/agentRun'
import type { Employee, Skill, WorkforceTool, TaskAssignment } from '../types'
import type { AgentRunInput } from '../runtime/types'

describe('SATRIA AI Workforce — Phase 3: Real Agent Runtime & Safety Engine', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    RuntimeFactory.reset()
  })

  it('instantiates and switches runtime adapters via RuntimeFactory', async () => {
    const mockRuntime = RuntimeFactory.getRuntime('mock')
    expect(mockRuntime.mode).toBe('mock')

    const hermesRuntime = RuntimeFactory.getRuntime('hermes')
    expect(hermesRuntime.mode).toBe('hermes')

    const health = await mockRuntime.checkHealth()
    expect(health.healthy).toBe(true)
    expect(health.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('enforces strict path sandboxing and blocks traversal/secret patterns', () => {
    const policy = new SandboxPolicy('C:/Projects/AI AGENTIC UI')

    // Valid file in workspace
    const valid = policy.validatePath('C:/Projects/AI AGENTIC UI/src/runtime/types.ts')
    expect(valid.allowed).toBe(true)

    // Path traversal attempt
    const traversal = policy.validatePath('C:/Projects/AI AGENTIC UI/../../Windows/System32/cmd.exe')
    expect(traversal.allowed).toBe(false)
    expect(traversal.error).toContain('Path traversal')

    // Out-of-bounds path
    const outside = policy.validatePath('D:/OtherProject/secret.txt')
    expect(outside.allowed).toBe(false)
    expect(outside.error).toContain('Access denied')

    // Sensitive files blocklist (.env, id_rsa, credentials)
    const envBlocked = policy.validatePath('C:/Projects/AI AGENTIC UI/.env')
    expect(envBlocked.allowed).toBe(false)
    expect(envBlocked.error).toContain('Security violation')

    const sshBlocked = policy.validatePath('C:/Projects/AI AGENTIC UI/id_rsa')
    expect(sshBlocked.allowed).toBe(false)
  })

  it('loads skill instructions and synthesizes context correctly', () => {
    const skills: Skill[] = [
      {
        id: 'skill-laravel-api',
        name: 'Laravel REST API Architecture',
        slug: 'laravel-rest-api',
        category: 'Backend',
        description: 'Design robust RESTful APIs with Sanctum authentication.',
        sourceType: 'internal',
        version: '1.2.0',
        status: 'Active',
        compatibleDepartments: ['dept-coding'],
        compatibleRoles: ['role-backend'],
        tags: ['php', 'laravel', 'api'],
        createdAt: '2026-08-14T00:00:00Z',
        updatedAt: '2026-08-14T00:00:00Z'
      }
    ]

    const loaded = SkillLoader.loadSkills(skills)
    expect(loaded.length).toBe(1)
    expect(loaded[0].name).toBe('Laravel REST API Architecture')

    const employee: Employee = {
      id: 'emp-bima',
      name: 'Bima',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256',
      description: 'Senior Backend API Engineer specialized in microservices.',
      roleId: 'role-backend',
      roleName: 'Backend API Engineer',
      departmentId: 'dept-coding',
      departmentName: 'Coding',
      status: 'Active',
      workState: 'Idle',
      skills: [{ skillId: 'skill-laravel-api', priority: 'P0', assignedAt: '2026-08-14' }],
      toolIds: ['tool-filesystem-read'],
      permissions: ['Read', 'Write'],
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    }

    const tools: WorkforceTool[] = [
      {
        id: 'tool-filesystem-read',
        name: 'filesystem.read',
        category: 'Development',
        description: 'Read file contents in workspace',
        status: 'available',
        permissionLevel: 'read'
      }
    ]

    const assignment: TaskAssignment = {
      id: 'asg-301',
      taskId: 'tsk-301',
      taskTitle: 'Develop Authentication Middleware',
      employeeId: employee.id,
      employeeName: employee.name,
      employeeAvatar: employee.avatar,
      employeeRole: employee.roleName,
      assignedBy: 'Satria Lead',
      skillIds: ['skill-laravel-api'],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    }

    const input: AgentRunInput = {
      runId: 'run-test-301',
      assignment,
      employee,
      skills,
      tools,
      workspacePath: 'C:/Projects/AI AGENTIC UI',
      taskPrompt: 'Implement token validation guard in Laravel.',
      acceptanceCriteria: ['Middleware returns 401 on missing bearer token.', 'All tests pass.']
    }

    const context = ContextBuilder.build(input)
    expect(context.systemPrompt).toContain('You are Bima')
    expect(context.systemPrompt).toContain('Laravel REST API Architecture')
    expect(context.userPrompt).toContain('Develop Authentication Middleware')
    expect(context.userPrompt).toContain('Middleware returns 401 on missing bearer token.')
  })

  it('calculates token costs per model accurately', () => {
    // Claude 3.5 Sonnet: $3.00/1M prompt, $15.00/1M completion
    const sonnetCost = CostCalculator.calculate('claude-3-5-sonnet-20241022', 10000, 2000)
    expect(sonnetCost).toBe(0.06)

    // Hermes 3 8B: $0.20/1M prompt, $0.20/1M completion
    const hermesCost = CostCalculator.calculate('hermes-3-llama-3.1-8b', 10000, 2000)
    expect(hermesCost).toBe(0.0024)

    // Mock runner: $0.00
    const mockCost = CostCalculator.calculate('mock-agent-simulation-v1', 50000, 50000)
    expect(mockCost).toBe(0)
  })

  it('evaluates automated quality gate verifications', () => {
    // Perfect run: tests exit code 0, 2 diffs, all criteria met
    const passReport = VerificationEngine.evaluate('Pass: 12 tests', 0, 2, true)
    expect(passReport.status).toBe('Passed')
    expect(passReport.score).toBe(100)

    // Warning run: 0 diffs on modification task
    const warnReport = VerificationEngine.evaluate('Pass: 12 tests', 0, 0, true)
    expect(warnReport.status).toBe('Warning')
    expect(warnReport.score).toBeGreaterThanOrEqual(50)

    // Failed run: test suite returned exit code 1
    const failReport = VerificationEngine.evaluate('FAIL: test_auth_failed', 1, 1, false)
    expect(failReport.status).toBe('Failed')
  })

  it('maps Hermes input and SSE streaming events bidirectionally', () => {
    const input: AgentRunInput = {
      runId: 'run-hermes-01',
      assignment: {
        id: 'asg-01',
        taskId: 'tsk-01',
        taskTitle: 'Analyze API Schema',
        employeeId: 'emp-bima',
        employeeName: 'Bima',
        employeeAvatar: '',
        employeeRole: 'Backend API Engineer',
        assignedBy: 'Lead',
        skillIds: [],
        priority: 'Medium',
        status: 'In Progress',
        createdAt: '2026-08-14T00:00:00Z',
        updatedAt: '2026-08-14T00:00:00Z'
      },
      employee: {
        id: 'emp-bima',
        name: 'Bima',
        avatar: '',
        roleId: 'role-backend',
        roleName: 'Backend API Engineer',
        departmentId: 'dept-coding',
        departmentName: 'Coding',
        description: 'Backend engineer',
        status: 'Active',
        skills: [],
        toolIds: [],
        permissions: [],
        createdAt: '2026-08-14T00:00:00Z',
        updatedAt: '2026-08-14T00:00:00Z'
      },
      skills: [],
      tools: [],
      workspacePath: 'C:/Projects/AI AGENTIC UI',
      taskPrompt: 'Analyze OpenAPI swagger spec.',
      acceptanceCriteria: ['Output valid OpenAPI specification summary.']
    }

    const payload = HermesMapper.toHermesPayload(input)
    expect(payload.runId).toBe('run-hermes-01')
    expect(payload.agentName).toBe('Bima')

    // Tool request event mapping
    const rawToolEvent = {
      type: 'tool:requested',
      toolCallId: 'tc-99',
      toolName: 'filesystem.read',
      parameters: { path: 'routes/api.php' }
    }
    const mappedToolEvent = HermesMapper.fromHermesEvent(rawToolEvent, 'run-hermes-01')
    expect(mappedToolEvent.type).toBe('tool:requested')
    expect(mappedToolEvent.toolCall?.toolName).toBe('filesystem.read')

    // Approval required event mapping
    const rawApprovalEvent = {
      type: 'approval:required',
      approvalId: 'apprv-101',
      toolName: 'filesystem.write',
      reason: 'Modifying AuthController.php requires human confirmation.',
      diffContent: '+ public function authenticate() {}'
    }
    const mappedApproval = HermesMapper.fromHermesEvent(rawApprovalEvent, 'run-hermes-01')
    expect(mappedApproval.type).toBe('approval:required')
    expect(mappedApproval.approvalRequest?.reason).toContain('AuthController.php')
  })

  it('runs full AgentRunStore execution through the pluggable runtime adapter', async () => {
    const store = useAgentRunStore()
    store.setRuntimeMode('mock')
    await store.fetchRuns()

    const initialCount = store.runs.length

    const created = await store.createRun(
      {
        id: 'asg-test-runtime',
        taskId: 'tsk-302',
        taskTitle: 'Build GraphQL Schema Gateway',
        employeeId: 'emp-bima',
        employeeName: 'Bima',
        employeeAvatar: '',
        employeeRole: 'Backend API Engineer',
        assignedBy: 'Satria Lead',
        skillIds: [],
        priority: 'High',
        status: 'In Progress',
        createdAt: '2026-08-14T00:00:00Z',
        updatedAt: '2026-08-14T00:00:00Z'
      },
      1
    )

    expect(created.id).toBeDefined()
    expect(store.runs.length).toBe(initialCount + 1)
    expect(created.status).toBe('Running')

    // Test pause, resume, cancel
    store.pauseRun(created.id)
    expect(created.status).toBe('Waiting')

    store.resumeRun(created.id)
    expect(created.status).toBe('Running')

    store.cancelRun(created.id)
    expect(created.status).toBe('Cancelled')
  })
})
