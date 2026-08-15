import type { VerificationCheck } from '../VerificationEngine'

export interface SecurityRuleInput {
  /** Explicitly passed from sandbox policy evaluation */
  passed: boolean
  /** Optional: list of violations detected */
  violations?: string[]
  /** Optional: policy name checked */
  policyName?: string
}

export interface SecurityRuleResult {
  check: VerificationCheck
  passed: boolean
}

/**
 * SecurityRule
 *
 * Mandatory hard gate. Security failure always blocks Passed status.
 * Never assumed to be true — must be explicitly provided.
 */
export class SecurityRule {
  static evaluate(input: SecurityRuleInput): SecurityRuleResult {
    const { passed, violations = [], policyName = 'Sandbox Policy' } = input
    const violationDetails = violations.length > 0
      ? `Violations detected: ${violations.join('; ')}`
      : 'No violations detected.'

    return {
      passed,
      check: {
        name: `Security & ${policyName} Compliance`,
        passed,
        details: passed
          ? `${policyName} check passed. Zero sandbox boundary violations or unauthorized access attempts. ${violationDetails}`
          : `${policyName} check FAILED. ${violationDetails} Execution blocked from review.`
      }
    }
  }
}
