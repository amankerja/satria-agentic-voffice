import { describe, it, expect } from 'vitest'
import { HermesMapper } from '../runtime/hermes/HermesMapper'
import type { AgentRunInput } from '../runtime/types'

describe('HermesMapper Event & Payload Validation', () => {
  const sampleInput: AgentRunInput = {
    runId: 'run-map-01',
    assignment: {
      id: 'asg-map-01',
      taskId: 'tsk-map-01',
      taskTitle: 'Database Optimization',
      employeeId: 'emp-bima',
      employeeName: 'Bima',
      employeeAvatar: '',
      employeeRole: 'Backend API Engineer',
      assignedBy: 'Lead',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    },
    employee: {
      id: 'emp-bima',
      name: 'Bima',
      avatar: '',
      departmentId: 'dept-coding',
      roleId: 'role-backend-api',
      roleName: 'Backend API Engineer',
      departmentName: 'Coding & Engineering',
      description: 'Backend API Engineer',
      status: 'Active',
      supervisorId: 'emp-satria',
      skills: [],
      toolIds: ['tool-terminal'],
      permissions: ['read', 'write'],
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    },
    skills: [],
    tools: [
      {
        id: 'tool-terminal',
        name: 'terminal.execute',
        description: 'Run commands',
        category: 'Development',
        status: 'available',
        permissionLevel: 'admin'
      }
    ],
    workspacePath: 'c:/Projects/AI AGENTIC UI',
    taskPrompt: 'Analyze query performance',
    acceptanceCriteria: ['Index created']
  }

  it('1. maps AgentRunInput to Hermes payload structure properly', () => {
    const payload = HermesMapper.toHermesPayload(sampleInput)

    expect(payload.runId).toBe('run-map-01')
    expect(payload.agentId).toBe('emp-bima')
    expect(payload.agentName).toBe('Bima')
    expect(payload.department).toBe('Coding & Engineering')
    expect(payload.tools).toHaveLength(1)
    expect(payload.tools[0].name).toBe('terminal.execute')
    expect(payload.modelConfig.model).toBeDefined()
  })

  it('2. safely maps non-object / empty raw events', () => {
    const event = HermesMapper.fromHermesEvent(null, 'run-map-01')
    expect(event.type).toBe('progress:updated')
    expect(event.runId).toBe('run-map-01')
  })

  it('3. maps approval:required event correctly with high risk flag', () => {
    const raw = {
      type: 'approval:required',
      approvalId: 'apprv-99',
      toolName: 'database.dropTable',
      parameters: { table: 'users' },
      reason: 'Dropping database table users'
    }

    const event = HermesMapper.fromHermesEvent(raw, 'run-map-01')
    expect(event.type).toBe('approval:required')
    if (event.type === 'approval:required') {
      expect(event.approvalRequest?.id).toBe('apprv-99')
      expect(event.approvalRequest?.toolCall.toolName).toBe('database.dropTable')
      expect(event.approvalRequest?.toolCall.isHighRisk).toBe(true)
    }
  })

  it('4. maps tool:executed event with success and execution time', () => {
    const raw = {
      type: 'tool:executed',
      toolCallId: 'tc-55',
      toolName: 'filesystem.read',
      success: true,
      output: 'file content',
      executionTimeMs: 120
    }

    const event = HermesMapper.fromHermesEvent(raw, 'run-map-01')
    expect(event.type).toBe('tool:executed')
    if (event.type === 'tool:executed') {
      expect(event.toolResult?.toolCallId).toBe('tc-55')
      expect(event.toolResult?.success).toBe(true)
      expect(event.toolResult?.executionTimeMs).toBe(120)
    }
  })
})
