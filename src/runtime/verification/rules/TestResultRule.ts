import type { VerificationCheck } from '../VerificationEngine'

export interface TestResultRuleInput {
  exitCode: number
  output?: string
  testCount?: number
  failedCount?: number
}

export interface TestResultRuleResult {
  check: VerificationCheck
  passed: boolean
}

/**
 * TestResultRule
 *
 * Validates test suite execution results.
 * Exit code 0 = pass. Non-zero = mandatory failure.
 */
export class TestResultRule {
  static evaluate(input: TestResultRuleInput): TestResultRuleResult {
    const passed = input.exitCode === 0
    const summary = input.testCount !== undefined
      ? `${input.testCount - (input.failedCount || 0)}/${input.testCount} tests passed`
      : `Exit code ${input.exitCode}`

    return {
      passed,
      check: {
        name: 'Automated Test Suite',
        passed,
        details: passed
          ? `All unit/integration tests passed. ${summary}.`
          : `Test suite failed with exit code ${input.exitCode}. ${summary}. ${input.output ? input.output.substring(0, 200) : ''}`
      }
    }
  }
}
