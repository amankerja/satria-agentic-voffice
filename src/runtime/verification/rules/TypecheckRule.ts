import type { VerificationCheck } from '../VerificationEngine'

export interface TypecheckRuleResult {
  check: VerificationCheck
  passed: boolean
}

/**
 * TypecheckRule
 *
 * Validates TypeScript strict typecheck results.
 * Must be explicitly provided — never assumed to be true.
 */
export class TypecheckRule {
  static evaluate(passed: boolean, errorSummary?: string): TypecheckRuleResult {
    return {
      passed,
      check: {
        name: 'TypeScript Strict Typecheck',
        passed,
        details: passed
          ? 'vue-tsc --noEmit exited with code 0. Zero type errors in strict mode.'
          : `Typecheck failed: ${errorSummary || 'Type errors reported by vue-tsc'}.`
      }
    }
  }
}
