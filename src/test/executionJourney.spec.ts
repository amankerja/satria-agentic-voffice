import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  MockTaskRepository
} from '../repositories'
import { useAssignmentStore } from '../stores/assignment'
import { useAgentRunStore } from '../stores/agentRun'
import { useReviewStore } from '../stores/review'
import type { Employee } from '../types'
import { seedTestFixtures } from './testFixtures'

describe('SATRIA AI Workforce — Phase 2: Task Assignment, Agent Run & Review Journey', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    seedTestFixtures()
  })

  it('calculates skill eligibility accurately with separate required and optional percentages', async () => {
    const assignmentStore = useAssignmentStore()

    const mockEmp: Employee = {
      id: 'emp-test-faisal',
      name: 'Faisal',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256',
      description: 'Senior Frontend Engineer digital agent.',
      roleId: 'role-dev-frontend',
      roleName: 'Frontend Engineer',
      departmentId: 'dept-eng',
      departmentName: 'Engineering',
      status: 'Active',
      workState: 'Idle',
      skills: [
        { skillId: 'skill-uiux-frontend', priority: 'P0', assignedAt: '2026-08-14' },
        { skillId: 'skill-tailwind-v4', priority: 'P1', assignedAt: '2026-08-14' }
      ],
      toolIds: ['tool-web-search'],
      permissions: ['Read', 'Write'],
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    }

    // Case 1: Perfect match (100% required, 100% optional)
    const match1 = assignmentStore.calculateSkillMatch(
      mockEmp,
      ['skill-uiux-frontend'],
      ['skill-tailwind-v4']
    )
    expect(match1.isEligible).toBe(true)
    expect(match1.requiredMatchPercentage).toBe(100)
    expect(match1.optionalMatchPercentage).toBe(100)
    expect(match1.missingRequiredSkills.length).toBe(0)

    // Case 2: Missing optional skill (Eligible with warning)
    const match2 = assignmentStore.calculateSkillMatch(
      mockEmp,
      ['skill-uiux-frontend'],
      ['skill-tailwind-v4', 'skill-playwright-qa']
    )
    expect(match2.isEligible).toBe(true)
    expect(match2.requiredMatchPercentage).toBe(100)
    expect(match2.optionalMatchPercentage).toBe(50)
    expect(match2.warning).toContain('Missing 1 optional skill')

    // Case 3: Missing required skill (Ineligible)
    const match3 = assignmentStore.calculateSkillMatch(
      mockEmp,
      ['skill-uiux-frontend', 'skill-cloud-run-deploy'],
      []
    )
    expect(match3.isEligible).toBe(false)
    expect(match3.requiredMatchPercentage).toBe(50)
    expect(match3.missingRequiredSkills).toContain('skill-cloud-run-deploy')
    expect(match3.warning).toContain('Missing 1 required skill')

    // Case 4: Inactive employee
    const inactiveEmp = { ...mockEmp, status: 'Inactive' as const }
    const match4 = assignmentStore.calculateSkillMatch(inactiveEmp, ['skill-uiux-frontend'])
    expect(match4.isEligible).toBe(false)
    expect(match4.warning).toContain('cannot be assigned new tasks')
  })

  it('creates task assignment and manages status transitions', async () => {
    const assignmentStore = useAssignmentStore()
    const taskRepo = new MockTaskRepository()

    await assignmentStore.fetchAssignments()
    const initialCount = assignmentStore.assignments.length

    const created = await assignmentStore.createAssignment({
      taskId: 'tsk-101',
      taskTitle: 'Refactor Navigation Bar',
      employeeId: 'emp-faisal',
      employeeName: 'Faisal',
      employeeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256',
      employeeRole: 'Frontend Engineer',
      assignedBy: 'Lead Developer',
      skillIds: ['skill-uiux-frontend'],
      priority: 'High',
      status: 'Assigned',
      instructions: 'Pastikan responsive di mobile viewport.'
    })

    expect(created.id).toBeDefined()
    expect(created.status).toBe('Assigned')
    expect(assignmentStore.assignments.length).toBe(initialCount + 1)

    // Verify task was updated with assignee
    const task = await taskRepo.getById('tsk-101')
    expect(task?.assigneeName).toBe('Faisal')
    expect(task?.activeAssignmentId).toBe(created.id)

    // Update assignment status
    const updated = await assignmentStore.updateStatus(created.id, 'In Progress')
    expect(updated?.status).toBe('In Progress')
    expect(updated?.startedAt).toBeDefined()

    // Complete assignment
    const completed = await assignmentStore.updateStatus(created.id, 'Completed')
    expect(completed?.status).toBe('Completed')
    expect(completed?.completedAt).toBeDefined()
  })

  it('runs agent execution lifecycle, pause, resume, cancel, and retry attempts', async () => {
    const agentRunStore = useAgentRunStore()
    agentRunStore.setRuntimeMode('mock')
    await agentRunStore.fetchRuns()

    const run = await agentRunStore.createRun({
      id: 'asg-test-01',
      taskId: 'tsk-102',
      taskTitle: 'Build Agent Telemetry Panel',
      employeeId: 'emp-faisal',
      employeeName: 'Faisal',
      employeeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256',
      employeeRole: 'Frontend Engineer',
      assignedBy: 'Satria Lead',
      skillIds: ['skill-uiux-frontend'],
      priority: 'High',
      status: 'In Progress',
      createdAt: '2026-08-14T00:00:00Z',
      updatedAt: '2026-08-14T00:00:00Z'
    })

    expect(run.status).toBe('Running')
    expect(run.attempt).toBe(1)
    expect(run.currentStep).toBe('Initializing')

    // Pause run
    agentRunStore.pauseRun(run.id)
    expect(run.status).toBe('Waiting')

    // Resume run
    agentRunStore.resumeRun(run.id)
    expect(run.status).toBe('Running')

    // Cancel run
    agentRunStore.cancelRun(run.id)
    expect(run.status).toBe('Cancelled')

    // Retry run
    const retried = await agentRunStore.retryRun(run.id)
    expect(retried?.attempt).toBe(2)
    expect(retried?.status).toBe('Running')
    expect(retried?.progress).toBe(0)

    // Stop runner clean-up
    agentRunStore.cancelRun(run.id)
  })

  it('handles human review decisions and auto-closes approved tasks', async () => {
    const reviewStore = useReviewStore()
    const taskRepo = new MockTaskRepository()

    await reviewStore.fetchReviews()

    const review = await reviewStore.fetchReviewById('rev-101')
    expect(review).toBeDefined()
    expect(review?.status).toBe('Pending')

    // Approve the review
    const decision = await reviewStore.submitDecision('rev-101', 'Approved', 'Great work! Perfect adherence to design tokens.')
    expect(decision?.status).toBe('Approved')
    expect(decision?.comment).toContain('Great work')

    // Verify task is automatically marked as Done
    if (review?.taskId) {
      const task = await taskRepo.getById(review.taskId)
      expect(task?.status).toBe('Done')
      expect(task?.progress).toBe(100)
    }
  })

  it('rejects or requests changes on review workflow', async () => {
    const reviewStore = useReviewStore()
    await reviewStore.fetchReviews()

    const review = await reviewStore.fetchReviewById('rev-102')
    expect(review).toBeDefined()

    // Request Changes
    const changes = await reviewStore.submitDecision('rev-102', 'Changes Requested', 'Please fix mobile padding on 360px viewport.')
    expect(changes?.status).toBe('Changes Requested')
    expect(changes?.comment).toContain('mobile padding')
  })
})
