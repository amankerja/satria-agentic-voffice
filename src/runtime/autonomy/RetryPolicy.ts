import type { FailureClassification } from './FailureClassifier'

export interface RetryPolicyConfig {
  maxAttempts?: number
  baseDelayMs?: number
  allowSecurityRetry?: boolean
}

export interface RetryDecision {
  shouldRetry: boolean
  attempt: number
  maxAttempts: number
  reason: string
  delayMs: number
}

export class RetryPolicy {
  public readonly maxAttempts: number
  public readonly baseDelayMs: number
  public readonly allowSecurityRetry: boolean

  constructor(config: RetryPolicyConfig = {}) {
    this.maxAttempts = Math.min(3, Math.max(1, config.maxAttempts ?? 3))
    this.baseDelayMs = config.baseDelayMs ?? 1000
    this.allowSecurityRetry = config.allowSecurityRetry ?? false
  }

  /**
   * Evaluates if a failed run is permitted to retry under strict governance policies
   */
  public evaluate(attempt: number, classification: FailureClassification): RetryDecision {
    const nextAttempt = attempt + 1

    // Rule 1: Hard attempt limit
    if (attempt >= this.maxAttempts || nextAttempt > this.maxAttempts) {
      return {
        shouldRetry: false,
        attempt,
        maxAttempts: this.maxAttempts,
        reason: `Maximum retry limit of ${this.maxAttempts} attempts reached. Escalating to human oversight.`,
        delayMs: 0
      }
    }

    // Rule 2: Fatal security violations are NEVER auto-retried
    if (classification.category === 'FATAL_SECURITY_VIOLATION' && !this.allowSecurityRetry) {
      return {
        shouldRetry: false,
        attempt,
        maxAttempts: this.maxAttempts,
        reason: 'Security or sandbox violation detected. Autonomous retry blocked.',
        delayMs: 0
      }
    }

    // Rule 3: Explicit human approval rejection must not be overridden autonomously
    if (classification.category === 'APPROVAL_REJECTED') {
      return {
        shouldRetry: false,
        attempt,
        maxAttempts: this.maxAttempts,
        reason: 'Action authorization was explicitly denied by human operator.',
        delayMs: 0
      }
    }

    // Rule 4: Non-retryable classification
    if (!classification.isRetryable) {
      return {
        shouldRetry: false,
        attempt,
        maxAttempts: this.maxAttempts,
        reason: classification.reason,
        delayMs: 0
      }
    }

    // Rule 5: Valid retry with exponential backoff delay
    const delayMs = this.baseDelayMs * Math.pow(2, attempt - 1)

    return {
      shouldRetry: true,
      attempt: nextAttempt,
      maxAttempts: this.maxAttempts,
      reason: `Eligible for attempt #${nextAttempt}. ${classification.reason}`,
      delayMs
    }
  }
}

export const defaultRetryPolicy = new RetryPolicy({ maxAttempts: 3, baseDelayMs: 500 })
