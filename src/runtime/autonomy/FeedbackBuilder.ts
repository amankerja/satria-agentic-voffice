export interface FeedbackBuilderInput {
  taskTitle: string
  attempt: number
  maxAttempts: number
  previousOutput?: string
  failedChecks: string[]
  reviewerComment?: string
  errorSummary?: string
}

export class FeedbackBuilder {
  /**
   * Synthesizes actionable instructions for the next autonomous iteration attempt
   */
  static buildRetryPrompt(input: FeedbackBuilderInput): string {
    const {
      taskTitle,
      attempt,
      maxAttempts,
      failedChecks,
      reviewerComment,
      errorSummary
    } = input

    const lines: string[] = []

    lines.push(`## AUTONOMOUS EXECUTION ITERATION (Attempt #${attempt} of ${maxAttempts})`)
    lines.push(`Task: "${taskTitle}"`)
    lines.push('')
    lines.push('### Diagnostic Summary from Previous Run:')

    if (failedChecks.length > 0) {
      lines.push('The previous attempt failed the following verification assertions:')
      failedChecks.forEach((check, idx) => {
        lines.push(`  ${idx + 1}. ${check}`)
      })
      lines.push('')
    }

    if (reviewerComment) {
      lines.push('### Reviewer Directives:')
      lines.push(`> "${reviewerComment}"`)
      lines.push('')
    }

    if (errorSummary) {
      lines.push('### Previous Error Log:')
      lines.push(`\`\`\`\n${errorSummary}\n\`\`\``)
      lines.push('')
    }

    lines.push('### Instructions for this Attempt:')
    lines.push('1. Address all failed assertions listed above specifically.')
    lines.push('2. Ensure full deliverable content is outputted clearly with proper validation evidence.')
    lines.push('3. Do not repeat previous syntax, boundary, or logic errors.')

    return lines.join('\n')
  }
}
