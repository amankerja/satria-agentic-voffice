import type { VerificationCheck } from '../VerificationEngine'

export interface CriterionInput {
  name: string
  /**
   * True only when there is concrete evidence the criterion was met.
   * False = failed, undefined = not checked / skipped.
   */
  passed: boolean
  details: string
  mandatory?: boolean // defaults true
}

export interface AcceptanceCriteriaRuleResult {
  checks: VerificationCheck[]
  allMandatoryPassed: boolean
  passedCount: number
  totalCount: number
}

/**
 * AcceptanceCriteriaRule
 *
 * Evaluates each acceptance criterion independently.
 * A criterion must be explicitly marked as passed=true to pass.
 * There is NO implicit pass for "completed status" alone.
 */
export class AcceptanceCriteriaRule {
  static evaluate(criteria: CriterionInput[]): AcceptanceCriteriaRuleResult {
    const checks: VerificationCheck[] = []
    let allMandatoryPassed = true
    let passedCount = 0

    for (const crit of criteria) {
      const isMandatory = crit.mandatory !== false
      const passed = crit.passed === true

      if (!passed && isMandatory) {
        allMandatoryPassed = false
      }
      if (passed) passedCount++

      checks.push({
        name: `Acceptance Criteria: ${crit.name}`,
        passed,
        details: crit.details
      })
    }

    return {
      checks,
      allMandatoryPassed,
      passedCount,
      totalCount: criteria.length
    }
  }

  /**
   * Evaluate acceptance criteria against agent output.
   *
   * Strategy:
   * - If output is non-empty, we check if the criterion keyword appears in output (keyword search).
   * - This is the best we can do without a real LLM judge — it is intentionally conservative.
   * - If output is empty, ALL criteria fail.
   * - If output is non-empty but keyword not found, that criterion is marked as "UNVERIFIED" (passed=false).
   */
  static evaluateAgainstOutput(
    criteria: string[],
    output: string,
    runStatus: 'Completed' | 'Failed' | 'Cancelled'
  ): CriterionInput[] {
    if (!output || output.trim().length === 0 || runStatus !== 'Completed') {
      return criteria.map((name) => ({
        name,
        passed: false,
        details:
          runStatus !== 'Completed'
            ? `Run did not complete (status: ${runStatus}). Criterion cannot be verified.`
            : 'Agent produced no output. Criterion cannot be verified.',
        mandatory: true
      }))
    }

    const lowerOutput = output.toLowerCase()

    return criteria.map((name) => {
      // Keyword extraction: take significant words from criterion (length > 3)
      const keywords = name
        .toLowerCase()
        .split(/[\s,.:;()/-]+/)
        .filter((w) => w.length > 3)

      // A criterion is considered verified if at least half of its keywords appear in output
      const matchCount = keywords.filter((kw) => lowerOutput.includes(kw)).length
      const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0

      const passed = matchRatio >= 0.5

      return {
        name,
        passed,
        details: passed
          ? `Output contains evidence for criterion: "${name}" (${matchCount}/${keywords.length} keywords matched).`
          : keywords.length === 0
            ? `Criterion "${name}" could not be keyword-matched (no searchable terms). Manual review required.`
            : `Output does not contain sufficient evidence for criterion: "${name}" (${matchCount}/${keywords.length} keywords matched). Manual review required.`,
        mandatory: true
      }
    })
  }
}
