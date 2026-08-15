import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { seedTestFixtures } from './testFixtures'
import {
  TaskLifecycleMachine,
  FailureClassifier,
  FeedbackBuilder,
  RetryPolicy,
  AutonomousTaskLoop
} from '../runtime'
import { useAgentRunStore } from '../stores/agentRun'
import { useTaskStore } from '../stores/task'
import { useAssignmentStore } from '../stores/assignment'

describe('Phase 3.9 — Autonomous Task Loop & Lifecycle Governance Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    seedTestFixtures()
    const agentRunStore = useAgentRunStore()
    agentRunStore.setRuntimeMode('mock')
    AutonomousTaskLoop.resetAll()
  })

  // 1. Task Lifecycle Machine Unit Tests
  describe('TaskLifecycleMachine', () => {
    it('initializes in Idle state and records initial history', () => {
      const machine = new TaskLifecycleMachine('Idle')
      expect(machine.getState()).toBe('Idle')
      expect(machine.toTaskStatus()).toBe('Backlog')
      expect(machine.toRunStatus()).toBe('Queued')
      expect(machine.getHistory().length).toBe(1)
    })

    it('allows valid sequential transitions', () => {
      const machine = new TaskLifecycleMachine('Idle')
      machine.transition('Planning', 'Planning context')
      expect(machine.getState()).toBe('Planning')

      machine.transition('Executing', 'Run started')
      expect(machine.getState()).toBe('Executing')
      expect(machine.toTaskStatus()).toBe('In Progress')

      machine.transition('Verifying', 'Evaluating quality gate')
      expect(machine.getState()).toBe('Verifying')

      machine.transition('AwaitingReview', 'Passed gate')
      expect(machine.getState()).toBe('AwaitingReview')
      expect(machine.toTaskStatus()).toBe('Review')

      machine.transition('Completed', 'Approved by lead')
      expect(machine.getState()).toBe('Completed')
      expect(machine.toTaskStatus()).toBe('Done')
      expect(machine.isTerminal()).toBe(true)
    })

    it('strictly throws on invalid transitions', () => {
      const machine = new TaskLifecycleMachine('Idle')
      machine.transition('Cancelled', 'User aborted')

      // Cannot transition from Cancelled to Executing
      expect(() => machine.transition('Executing')).toThrow(/Invalid lifecycle transition/)
    })
  })

  // 2. Failure Classifier Tests
  describe('FailureClassifier', () => {
    it('classifies retryable verification failures accurately', () => {
      const classification = FailureClassifier.classify({
        runId: 'run-01',
        attempt: 1,
        maxAttempts: 3,
        verificationStatus: 'Failed',
        failedVerificationChecks: [
          { name: 'Deliverable Output', details: 'Empty response' }
        ]
      })

      expect(classification.category).toBe('RETRYABLE_VERIFICATION_FAILURE')
      expect(classification.isRetryable).toBe(true)
      expect(classification.recommendedAction).toBe('retry')
      expect(classification.failedChecks.length).toBe(1)
    })

    it('blocks retry on fatal security violations (Rule 9 & Safety)', () => {
      const classification = FailureClassifier.classify({
        runId: 'run-02',
        attempt: 1,
        maxAttempts: 3,
        error: 'Security violation: Path traversal ../ outside sandbox blocked.'
      })

      expect(classification.category).toBe('FATAL_SECURITY_VIOLATION')
      expect(classification.isRetryable).toBe(false)
      expect(classification.recommendedAction).toBe('block')
    })

    it('blocks retry when max attempts (3) is reached (Rule 6: No Infinite Loop)', () => {
      const classification = FailureClassifier.classify({
        runId: 'run-03',
        attempt: 3,
        maxAttempts: 3,
        verificationStatus: 'Failed',
        failedVerificationChecks: [{ name: 'Test check', details: 'Failed' }]
      })

      expect(classification.category).toBe('MAX_ATTEMPTS_EXCEEDED')
      expect(classification.isRetryable).toBe(false)
      expect(classification.recommendedAction).toBe('human_escalation')
    })

    it('blocks retry when human operator rejected authorization', () => {
      const classification = FailureClassifier.classify({
        runId: 'run-04',
        attempt: 1,
        maxAttempts: 3,
        approvalRejected: true,
        rejectionReason: 'File write target is protected.'
      })

      expect(classification.category).toBe('APPROVAL_REJECTED')
      expect(classification.isRetryable).toBe(false)
      expect(classification.recommendedAction).toBe('human_escalation')
    })
  })

  // 3. Retry Policy Tests
  describe('RetryPolicy', () => {
    it('enforces maximum 3 attempts and exponential backoff delay', () => {
      const policy = new RetryPolicy({ maxAttempts: 3, baseDelayMs: 500 })

      const retryableClassification = FailureClassifier.classify({
        runId: 'run-10',
        attempt: 1,
        maxAttempts: 3,
        verificationStatus: 'Failed'
      })

      const decision1 = policy.evaluate(1, retryableClassification)
      expect(decision1.shouldRetry).toBe(true)
      expect(decision1.attempt).toBe(2)
      expect(decision1.delayMs).toBe(500)

      const decision2 = policy.evaluate(2, retryableClassification)
      expect(decision2.shouldRetry).toBe(true)
      expect(decision2.attempt).toBe(3)
      expect(decision2.delayMs).toBe(1000)

      // Attempt 3: No more retries allowed
      const decision3 = policy.evaluate(3, retryableClassification)
      expect(decision3.shouldRetry).toBe(false)
    })
  })

  // 4. Feedback Builder Tests
  describe('FeedbackBuilder', () => {
    it('builds structured prompt containing previous failed checks and directives', () => {
      const prompt = FeedbackBuilder.buildRetryPrompt({
        taskTitle: 'Implement Payment Gateway',
        attempt: 2,
        maxAttempts: 3,
        failedChecks: ['Unit tests failed with exit code 1', 'OpenAPI schema validation failed'],
        reviewerComment: 'Please add currency conversion support.'
      })

      expect(prompt).toContain('AUTONOMOUS EXECUTION ITERATION (Attempt #2 of 3)')
      expect(prompt).toContain('Task: "Implement Payment Gateway"')
      expect(prompt).toContain('Unit tests failed with exit code 1')
      expect(prompt).toContain('Please add currency conversion support.')
    })
  })

  // 5. Autonomous Task Loop Orchestrator Tests
  describe('AutonomousTaskLoop Orchestrator', () => {
    it('guarantees exactly one active autonomous loop per task (Rule 8: No Duplicate Loops)', async () => {
      const agentRunStore = useAgentRunStore()
      const taskStore = useTaskStore()
      const assignmentStore = useAssignmentStore()

      const loop1 = await AutonomousTaskLoop.orchestrate('tsk-101', {
        agentRunStore,
        taskStore,
        assignmentStore
      })

      const loop2 = await AutonomousTaskLoop.orchestrate('tsk-101', {
        agentRunStore,
        taskStore,
        assignmentStore
      })

      expect(loop1).toBe(loop2)
      expect(AutonomousTaskLoop.getActiveLoops().length).toBe(1)
    })

    it('transitions to AwaitingReview when verification passes and does not auto-approve', async () => {
      const agentRunStore = useAgentRunStore()
      const taskStore = useTaskStore()

      const loop = await AutonomousTaskLoop.orchestrate('tsk-102', { agentRunStore, taskStore })

      const nextState = await loop.handleRunEvaluation(
        {
          verificationStatus: 'Passed',
          verificationScore: 100
        },
        { agentRunStore, taskStore }
      )

      expect(nextState).toBe('AwaitingReview')
      expect(loop.getStatus().state).toBe('AwaitingReview')
    })

    it('auto-retries via agentRunStore when verification fails and attempt < 3', async () => {
      const agentRunStore = useAgentRunStore()
      const taskStore = useTaskStore()

      const loop = await AutonomousTaskLoop.orchestrate('tsk-103', { agentRunStore, taskStore })

      const nextState = await loop.handleRunEvaluation(
        {
          verificationStatus: 'Failed',
          verificationScore: 50,
          failedVerificationChecks: [{ name: 'Criterion A', details: 'Keyword not found in deliverable' }]
        },
        { agentRunStore, taskStore }
      )

      expect(nextState).toBe('Executing')
      expect(loop.getStatus().attempt).toBe(2)
    })

    it('blocks task when max attempts (3) is exceeded (Rule 6 & 7: No Infinite Loop)', async () => {
      const agentRunStore = useAgentRunStore()
      const taskStore = useTaskStore()

      const loop = await AutonomousTaskLoop.orchestrate('tsk-104', { agentRunStore, taskStore })

      // Attempt 1 -> Fail -> Retrying (Attempt 2)
      await loop.handleRunEvaluation(
        {
          verificationStatus: 'Failed',
          failedVerificationChecks: [{ name: 'Check 1', details: 'Fail' }]
        },
        { agentRunStore, taskStore }
      )

      // Attempt 2 -> Fail -> Retrying (Attempt 3)
      await loop.handleRunEvaluation(
        {
          verificationStatus: 'Failed',
          failedVerificationChecks: [{ name: 'Check 2', details: 'Fail' }]
        },
        { agentRunStore, taskStore }
      )

      // Attempt 3 -> Fail -> BLOCKED
      const finalState = await loop.handleRunEvaluation(
        {
          verificationStatus: 'Failed',
          failedVerificationChecks: [{ name: 'Check 3', details: 'Fail' }]
        },
        { agentRunStore, taskStore }
      )

      expect(finalState).toBe('Blocked')
      expect(loop.getStatus().isBlocked).toBe(true)
      expect(AutonomousTaskLoop.getActiveLoops().length).toBe(0) // cleaned up from active
    })

    it('blocks task immediately on fatal security violations', async () => {
      const agentRunStore = useAgentRunStore()
      const taskStore = useTaskStore()

      const loop = await AutonomousTaskLoop.orchestrate('tsk-105', { agentRunStore, taskStore })

      const finalState = await loop.handleRunEvaluation(
        {
          verificationStatus: 'Failed',
          error: 'Security violation: Path traversal outside sandbox boundary is forbidden.'
        },
        { agentRunStore, taskStore }
      )

      expect(finalState).toBe('Blocked')
      expect(loop.getStatus().isBlocked).toBe(true)
    })
  })
})
