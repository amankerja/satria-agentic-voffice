import type { AgentRun, AgentRunStatus, RunStep, RunLogEntry } from '../types'

export interface RunnerCallbacks {
  onProgress?: (progress: number, step: RunStep, log: RunLogEntry) => void
  onComplete?: (run: AgentRun) => void
  onError?: (error: string) => void
  onStatusChange?: (status: AgentRunStatus) => void
}

interface ActiveRunnerState {
  runId: string
  timer: any
  progress: number
  stepIndex: number
  isPaused: boolean
  callbacks: RunnerCallbacks
}

const EXECUTION_STEPS: { step: RunStep; targetProgress: number; messages: string[] }[] = [
  {
    step: 'Initializing',
    targetProgress: 15,
    messages: [
      'Initializing digital employee execution environment.',
      'Allocating isolated runtime memory sandbox.',
      'Loading assigned tool permissions and role constraints.'
    ]
  },
  {
    step: 'Loading Task & Context',
    targetProgress: 35,
    messages: [
      'Ingesting task requirements, checklists, and project files.',
      'Parsing skill package instructions and design guidelines.',
      'Analyzing dependency inputs and previous milestone context.'
    ]
  },
  {
    step: 'Preparing Workspace',
    targetProgress: 50,
    messages: [
      'Configuring workspace tokens, environment variables, and assets.',
      'Setting up verification assertions and quality gates.'
    ]
  },
  {
    step: 'Working',
    targetProgress: 80,
    messages: [
      'Synthesizing primary deliverables according to task prompt.',
      'Refining code components and responsive layout structures.',
      'Generating deliverable artifacts and structured summaries.'
    ]
  },
  {
    step: 'Verifying',
    targetProgress: 95,
    messages: [
      'Executing automated QA checks, linting, and acceptance assertions.',
      'Validating output against task acceptance criteria.',
      'Formatting verification logs and security checks.'
    ]
  },
  {
    step: 'Completing',
    targetProgress: 100,
    messages: [
      'Finalizing deliverable bundle and packaging run result.',
      'Emitting execution completion event for review approval.'
    ]
  }
]

export class MockAgentRunner {
  private activeRunners = new Map<string, ActiveRunnerState>()

  /**
   * Starts a realistic simulation of agent run execution
   */
  start(
    runId: string,
    initialProgress: number = 0,
    callbacks: RunnerCallbacks = {},
    tickIntervalMs: number = 700
  ): boolean {
    // Idempotency: Do not create duplicate timer if already running
    if (this.activeRunners.has(runId)) {
      const existing = this.activeRunners.get(runId)!
      if (existing.isPaused) {
        this.resume(runId)
        return true
      }
      return false
    }

    let progress = initialProgress
    let currentStepIdx = 0
    while (
      currentStepIdx < EXECUTION_STEPS.length - 1 &&
      progress >= EXECUTION_STEPS[currentStepIdx].targetProgress
    ) {
      currentStepIdx++
    }

    const state: ActiveRunnerState = {
      runId,
      timer: null,
      progress,
      stepIndex: currentStepIdx,
      isPaused: false,
      callbacks
    }

    callbacks.onStatusChange?.('Running')

    state.timer = setInterval(() => {
      if (state.isPaused) return

      const currentStage = EXECUTION_STEPS[state.stepIndex]
      const stepIncrement = Math.floor(Math.random() * 6) + 4
      state.progress = Math.min(100, state.progress + stepIncrement)

      // Random message from current step
      const randomMsg =
        currentStage.messages[Math.floor(Math.random() * currentStage.messages.length)]

      const logEntry: RunLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
        step: currentStage.step,
        message: randomMsg,
        level: state.progress >= 95 ? 'success' : 'info'
      }

      callbacks.onProgress?.(state.progress, currentStage.step, logEntry)

      // Transition to next step if reached threshold
      if (
        state.progress >= currentStage.targetProgress &&
        state.stepIndex < EXECUTION_STEPS.length - 1
      ) {
        state.stepIndex++
      }

      // Check for completion
      if (state.progress >= 100) {
        this.stop(runId)
        callbacks.onStatusChange?.('Completed')
      }
    }, tickIntervalMs)

    this.activeRunners.set(runId, state)
    return true
  }

  pause(runId: string): boolean {
    const state = this.activeRunners.get(runId)
    if (state && !state.isPaused) {
      state.isPaused = true
      state.callbacks.onStatusChange?.('Waiting')
      return true
    }
    return false
  }

  resume(runId: string): boolean {
    const state = this.activeRunners.get(runId)
    if (state && state.isPaused) {
      state.isPaused = false
      state.callbacks.onStatusChange?.('Running')
      return true
    }
    return false
  }

  cancel(runId: string): boolean {
    const state = this.activeRunners.get(runId)
    if (state) {
      this.stop(runId)
      state.callbacks.onStatusChange?.('Cancelled')
      return true
    }
    return false
  }

  stop(runId: string): void {
    const state = this.activeRunners.get(runId)
    if (state) {
      if (state.timer) {
        clearInterval(state.timer)
      }
      this.activeRunners.delete(runId)
    }
  }

  isRunnerActive(runId: string): boolean {
    return this.activeRunners.has(runId)
  }

  isRunnerPaused(runId: string): boolean {
    return this.activeRunners.get(runId)?.isPaused ?? false
  }
}

export const globalMockRunner = new MockAgentRunner()
