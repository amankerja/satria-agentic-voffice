import type { TaskStatus, AgentRunStatus } from '../../types'

export type AutonomousState =
  | 'Idle'
  | 'Planning'
  | 'Executing'
  | 'Verifying'
  | 'AwaitingReview'
  | 'Retrying'
  | 'Completed'
  | 'Blocked'
  | 'Failed'
  | 'Cancelled'

export interface StateTransitionEvent {
  from: AutonomousState
  to: AutonomousState
  timestamp: string
  reason?: string
}

export class TaskLifecycleMachine {
  private currentState: AutonomousState = 'Idle'
  private history: StateTransitionEvent[] = []

  // Valid state transition matrix
  private static readonly VALID_TRANSITIONS: Record<AutonomousState, AutonomousState[]> = {
    Idle: ['Planning', 'Executing', 'Cancelled'],
    Planning: ['Executing', 'Blocked', 'Cancelled', 'Failed'],
    Executing: ['Verifying', 'AwaitingReview', 'Retrying', 'Blocked', 'Failed', 'Cancelled'],
    Verifying: ['AwaitingReview', 'Retrying', 'Completed', 'Failed', 'Blocked', 'Cancelled'],
    AwaitingReview: ['Completed', 'Retrying', 'Blocked', 'Failed', 'Cancelled'],
    Retrying: ['Executing', 'Blocked', 'Failed', 'Cancelled'],
    Completed: [],
    Blocked: ['Retrying', 'Cancelled'],
    Failed: ['Retrying', 'Cancelled'],
    Cancelled: []
  }

  constructor(initialState: AutonomousState = 'Idle') {
    this.currentState = initialState
    this.history.push({
      from: 'Idle',
      to: initialState,
      timestamp: new Date().toISOString(),
      reason: 'Lifecycle machine initialized'
    })
  }

  public getState(): AutonomousState {
    return this.currentState
  }

  public getHistory(): readonly StateTransitionEvent[] {
    return [...this.history]
  }

  public isTerminal(): boolean {
    return (
      this.currentState === 'Completed' ||
      this.currentState === 'Failed' ||
      this.currentState === 'Cancelled'
    )
  }

  public canTransitionTo(nextState: AutonomousState): boolean {
    const allowed = TaskLifecycleMachine.VALID_TRANSITIONS[this.currentState] || []
    return allowed.includes(nextState)
  }

  public transition(nextState: AutonomousState, reason?: string): AutonomousState {
    if (this.currentState === nextState) return this.currentState

    if (!this.canTransitionTo(nextState)) {
      throw new Error(
        `Invalid lifecycle transition from ${this.currentState} to ${nextState}. Allowed transitions: [${TaskLifecycleMachine.VALID_TRANSITIONS[this.currentState].join(', ')}]`
      )
    }

    const event: StateTransitionEvent = {
      from: this.currentState,
      to: nextState,
      timestamp: new Date().toISOString(),
      reason
    }

    this.history.push(event)
    this.currentState = nextState
    return this.currentState
  }

  /**
   * Maps internal AutonomousState to existing TaskStatus domain
   */
  public toTaskStatus(): TaskStatus {
    switch (this.currentState) {
      case 'Idle':
      case 'Planning':
        return 'Backlog'
      case 'Executing':
      case 'Verifying':
      case 'Retrying':
        return 'In Progress'
      case 'AwaitingReview':
        return 'Review'
      case 'Blocked':
        return 'Blocked'
      case 'Completed':
        return 'Done'
      case 'Failed':
      case 'Cancelled':
        return 'Backlog'
    }
  }

  /**
   * Maps internal AutonomousState to existing AgentRunStatus domain
   */
  public toRunStatus(): AgentRunStatus {
    switch (this.currentState) {
      case 'Idle':
        return 'Queued'
      case 'Planning':
        return 'Starting'
      case 'Executing':
        return 'Running'
      case 'Verifying':
        return 'Verifying'
      case 'AwaitingReview':
        return 'Waiting'
      case 'Retrying':
        return 'Starting'
      case 'Completed':
        return 'Completed'
      case 'Blocked':
      case 'Failed':
        return 'Failed'
      case 'Cancelled':
        return 'Cancelled'
    }
  }
}
