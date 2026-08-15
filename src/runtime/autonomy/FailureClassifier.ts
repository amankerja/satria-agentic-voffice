export type FailureCategory =
  | 'RETRYABLE_VERIFICATION_FAILURE'
  | 'RETRYABLE_EXECUTION_ERROR'
  | 'FATAL_SECURITY_VIOLATION'
  | 'APPROVAL_REJECTED'
  | 'MAX_ATTEMPTS_EXCEEDED'
  | 'UNRECOVERABLE_RUNTIME_ERROR'

export interface FailureClassification {
  category: FailureCategory
  isRetryable: boolean
  reason: string
  recommendedAction: 'retry' | 'block' | 'human_escalation' | 'abort'
  failedChecks: string[]
}

export interface FailureContext {
  runId: string
  attempt: number
  maxAttempts: number
  verificationStatus?: 'Passed' | 'Failed' | 'Warning' | 'Pending'
  verificationScore?: number
  failedVerificationChecks?: { name: string; details: string }[]
  error?: string
  approvalRejected?: boolean
  rejectionReason?: string
}

export class FailureClassifier {
  /**
   * Classifies execution outcome to determine whether an autonomous retry is safe and valid
   */
  static classify(context: FailureContext): FailureClassification {
    const {
      attempt,
      maxAttempts,
      verificationStatus,
      failedVerificationChecks = [],
      error,
      approvalRejected,
      rejectionReason
    } = context

    // 1. Max Attempts Guard (Hard Limit)
    if (attempt >= maxAttempts) {
      return {
        category: 'MAX_ATTEMPTS_EXCEEDED',
        isRetryable: false,
        reason: `Maximum retry limit (${maxAttempts} attempts) reached for run ${context.runId}.`,
        recommendedAction: 'human_escalation',
        failedChecks: failedVerificationChecks.map((c) => c.name)
      }
    }

    // 2. Human Rejection Guard
    if (approvalRejected) {
      return {
        category: 'APPROVAL_REJECTED',
        isRetryable: false,
        reason: `Human reviewer rejected action authorization: ${rejectionReason || 'No feedback provided'}.`,
        recommendedAction: 'human_escalation',
        failedChecks: []
      }
    }

    // 3. Fatal Security / Sandbox Boundary Guard
    if (error && (error.toLowerCase().includes('sandbox') || error.toLowerCase().includes('traversal') || error.toLowerCase().includes('forbidden'))) {
      return {
        category: 'FATAL_SECURITY_VIOLATION',
        isRetryable: false,
        reason: `Security constraint violated: ${error}. Autonomous retries blocked for safety.`,
        recommendedAction: 'block',
        failedChecks: ['Security & Sandbox Policy Compliance']
      }
    }

    // 4. Verification Quality Gate Failure
    if (verificationStatus === 'Failed') {
      const failedNames = failedVerificationChecks.map((c) => `${c.name}: ${c.details}`)
      const hasSecurityFail = failedVerificationChecks.some((c) => c.name.toLowerCase().includes('security') || c.name.toLowerCase().includes('sandbox'))

      if (hasSecurityFail) {
        return {
          category: 'FATAL_SECURITY_VIOLATION',
          isRetryable: false,
          reason: 'Verification failed on mandatory Security & Sandbox policy assertion.',
          recommendedAction: 'block',
          failedChecks: failedNames
        }
      }

      return {
        category: 'RETRYABLE_VERIFICATION_FAILURE',
        isRetryable: true,
        reason: `Verification assertions failed (${failedVerificationChecks.length} failed checks). Can retry with targeted feedback.`,
        recommendedAction: 'retry',
        failedChecks: failedNames
      }
    }

    // 5. General Error or Crash
    if (error) {
      return {
        category: 'RETRYABLE_EXECUTION_ERROR',
        isRetryable: true,
        reason: `Runtime execution reported error: ${error}.`,
        recommendedAction: 'retry',
        failedChecks: []
      }
    }

    // 6. Default Fallback
    return {
      category: 'UNRECOVERABLE_RUNTIME_ERROR',
      isRetryable: false,
      reason: 'Unknown failure state occurred.',
      recommendedAction: 'abort',
      failedChecks: []
    }
  }
}
