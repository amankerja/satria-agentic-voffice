import type { VerificationCheck } from '../VerificationEngine'

export interface BuildRuleResult {
  check: VerificationCheck
  passed: boolean
}

/**
 * BuildRule
 *
 * Validates production build results.
 * Must be explicitly provided — never assumed to be true.
 */
export class BuildRule {
  static evaluate(passed: boolean, errorSummary?: string): BuildRuleResult {
    return {
      passed,
      check: {
        name: 'Production Build & Bundling',
        passed,
        details: passed
          ? 'Vite production build and PWA bundle succeeded with clean output.'
          : `Build failed: ${errorSummary || 'Vite build reported errors'}.`
      }
    }
  }
}
