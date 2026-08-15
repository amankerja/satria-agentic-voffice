import { TaskLifecycleMachine, type AutonomousState } from './TaskLifecycleMachine'
import { FailureClassifier, type FailureClassification } from './FailureClassifier'
import { FeedbackBuilder } from './FeedbackBuilder'
import { RetryPolicy, defaultRetryPolicy } from './RetryPolicy'
import type { TaskAssignment, AgentRun } from '../../types'
import { MockTaskRepository, MockAssignmentRepository, MockEmployeeRepository } from '../../repositories'

export interface LoopExecutionOptions {
  maxAttempts?: number
  autoRetry?: boolean
  feedbackPrompt?: string
}

export interface AutonomousLoopStatus {
  taskId: string
  runId?: string
  state: AutonomousState
  attempt: number
  maxAttempts: number
  isComplete: boolean
  isBlocked: boolean
  history: ReturnType<TaskLifecycleMachine['getHistory']>
  lastClassification?: FailureClassification
}

export class AutonomousTaskLoop {
  private static activeLoops: Map<string, AutonomousTaskLoop> = new Map()

  public readonly taskId: string
  public readonly machine: TaskLifecycleMachine
  public readonly retryPolicy: RetryPolicy
  private currentRunId?: string
  private currentAttempt: number = 1
  private lastClassification?: FailureClassification
  private isDisposed: boolean = false

  private constructor(taskId: string, retryPolicy: RetryPolicy = defaultRetryPolicy) {
    this.taskId = taskId
    this.machine = new TaskLifecycleMachine('Idle')
    this.retryPolicy = retryPolicy
  }

  /**
   * Get active loop instance for a task if one is currently executing
   */
  public static getActiveLoop(taskId: string): AutonomousTaskLoop | undefined {
    return AutonomousTaskLoop.activeLoops.get(taskId)
  }

  /**
   * List all currently active autonomous task loops
   */
  public static getActiveLoops(): AutonomousTaskLoop[] {
    return Array.from(AutonomousTaskLoop.activeLoops.values())
  }

  /**
   * Reset/clear all active loops (useful for test isolation)
   */
  public static resetAll(): void {
    AutonomousTaskLoop.activeLoops.forEach((loop) => loop.cancel())
    AutonomousTaskLoop.activeLoops.clear()
  }

  /**
   * Factory method: starts or retrieves the single active autonomous loop for a task
   */
  public static async orchestrate(
    taskId: string,
    stores: {
      agentRunStore: any
      taskStore?: any
      assignmentStore?: any
    },
    options: LoopExecutionOptions = {}
  ): Promise<AutonomousTaskLoop> {
    // Rule 8: Exactly one active loop per task
    let loop = AutonomousTaskLoop.activeLoops.get(taskId)
    if (loop && !loop.machine.isTerminal()) {
      return loop
    }

    const policy = options.maxAttempts
      ? new RetryPolicy({ maxAttempts: options.maxAttempts })
      : defaultRetryPolicy

    loop = new AutonomousTaskLoop(taskId, policy)
    AutonomousTaskLoop.activeLoops.set(taskId, loop)

    await loop.run(stores, options)
    return loop
  }

  /**
   * Main lifecycle orchestration runner
   */
  private async run(
    stores: {
      agentRunStore: any
      taskStore?: any
      assignmentStore?: any
    },
    _options: LoopExecutionOptions
  ): Promise<void> {
    const { agentRunStore, taskStore } = stores
    const taskRepo = new MockTaskRepository()
    const assignmentRepo = new MockAssignmentRepository()
    const employeeRepo = new MockEmployeeRepository()

    try {
      this.machine.transition('Planning', `Resolving assignment context for task #${this.taskId}`)

      // 1. Resolve Task
      const task = await taskRepo.getById(this.taskId)
      if (!task) {
        this.machine.transition('Failed', `Task #${this.taskId} not found in workspace repository.`)
        this.cleanup()
        return
      }

      // 2. Resolve or create Assignment
      let assignment: TaskAssignment | undefined
      const existingAssignments = await assignmentRepo.getByTaskId(this.taskId)
      assignment = existingAssignments.find((a) => a.status === 'In Progress' || a.status === 'Assigned' || a.status === 'Queued')

      if (!assignment) {
        const employees = await employeeRepo.getAll()
        const activeEmp = employees.find((e) => e.status === 'Active') || employees[0]

        assignment = await assignmentRepo.create({
          taskId: task.id,
          taskTitle: task.title,
          employeeId: activeEmp.id,
          employeeName: activeEmp.name,
          employeeAvatar: activeEmp.avatar,
          employeeRole: activeEmp.roleName,
          assignedBy: 'Autonomous Orchestrator',
          skillIds: task.requiredSkillIds || [],
          priority: task.priority || 'High',
          status: 'In Progress'
        })
      }

      // 3. Start Execution via AgentRunStore (Single Source of Truth)
      this.machine.transition('Executing', `Starting execution run for assignment #${assignment.id}`)
      if (taskStore) {
        await taskStore.updateTaskStatus(this.taskId, 'In Progress')
      }

      const run: AgentRun = await agentRunStore.startRunFromAssignment(assignment)
      this.currentRunId = run.id
      this.currentAttempt = run.attempt || 1

    } catch (err: any) {
      this.machine.transition('Failed', `Orchestration initialization failed: ${err?.message || err}`)
      this.cleanup()
    }
  }

  /**
   * Handle iteration assessment upon run completion
   */
  public async handleRunEvaluation(
    resultContext: {
      verificationStatus: 'Passed' | 'Failed' | 'Warning' | 'Pending'
      verificationScore?: number
      failedVerificationChecks?: { name: string; details: string }[]
      error?: string
      reviewerComment?: string
    },
    stores: {
      agentRunStore: any
      taskStore?: any
    }
  ): Promise<AutonomousState> {
    if (this.isDisposed || this.machine.isTerminal()) {
      return this.machine.getState()
    }

    const { agentRunStore, taskStore } = stores
    const { verificationStatus, failedVerificationChecks = [], error, reviewerComment } = resultContext

    // 1. If Verification Quality Gate Passed
    if (verificationStatus === 'Passed') {
      this.machine.transition('AwaitingReview', 'Verification passed. Deliverable awaiting human review.')
      if (taskStore) {
        await taskStore.updateTaskStatus(this.taskId, 'Review')
      }
      return this.machine.getState()
    }

    // 2. Classify Failure & Consult Retry Governance Policy
    const classification = FailureClassifier.classify({
      runId: this.currentRunId || `run-${this.taskId}`,
      attempt: this.currentAttempt,
      maxAttempts: this.retryPolicy.maxAttempts,
      verificationStatus,
      failedVerificationChecks,
      error
    })

    this.lastClassification = classification
    const decision = this.retryPolicy.evaluate(this.currentAttempt, classification)

    // 3. Autonomous Retry Execution Flow
    if (decision.shouldRetry && this.currentRunId) {
      this.machine.transition('Retrying', decision.reason)

      // Synthesize corrective prompt feedback
      const feedbackDirective = FeedbackBuilder.buildRetryPrompt({
        taskTitle: `Task #${this.taskId}`,
        attempt: decision.attempt,
        maxAttempts: decision.maxAttempts,
        failedChecks: classification.failedChecks,
        reviewerComment,
        errorSummary: error
      })

      // HARD RULE: agentRunStore.retryRun() is the SINGLE SOURCE OF TRUTH for retry
      const retriedRun = await agentRunStore.retryRun(this.currentRunId)
      if (retriedRun) {
        this.currentRunId = retriedRun.id
        this.currentAttempt = retriedRun.attempt
        this.machine.transition('Executing', `Retry attempt #${retriedRun.attempt} started. Directive: ${feedbackDirective.slice(0, 80)}...`)
      }
      return this.machine.getState()
    }

    // 4. Non-retryable Failure / Max Attempts Reached -> Block or Fail Task
    if (classification.category === 'FATAL_SECURITY_VIOLATION' || classification.category === 'MAX_ATTEMPTS_EXCEEDED') {
      this.machine.transition('Blocked', decision.reason)
      if (taskStore) {
        await taskStore.updateTaskStatus(this.taskId, 'Waiting')
      }
    } else {
      this.machine.transition('Failed', decision.reason)
    }

    this.cleanup()
    return this.machine.getState()
  }

  /**
   * Cancel active loop and associated agent run
   */
  public cancel(reason: string = 'Autonomous loop cancelled by user'): void {
    if (!this.machine.isTerminal()) {
      this.machine.transition('Cancelled', reason)
    }
    this.cleanup()
  }

  /**
   * Clean up from active registry
   */
  private cleanup(): void {
    this.isDisposed = true
    AutonomousTaskLoop.activeLoops.delete(this.taskId)
  }

  /**
   * Get current status snapshot of this autonomous loop
   */
  public getStatus(): AutonomousLoopStatus {
    return {
      taskId: this.taskId,
      runId: this.currentRunId,
      state: this.machine.getState(),
      attempt: this.currentAttempt,
      maxAttempts: this.retryPolicy.maxAttempts,
      isComplete: this.machine.getState() === 'Completed',
      isBlocked: this.machine.getState() === 'Blocked',
      history: this.machine.getHistory(),
      lastClassification: this.lastClassification
    }
  }
}
