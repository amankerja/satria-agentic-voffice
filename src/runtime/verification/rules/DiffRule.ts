import type { VerificationCheck } from '../VerificationEngine'
import type { RunResultDiff } from '../../../types'

export interface DiffRuleResult {
  check: VerificationCheck
  hasDiffs: boolean
}

/**
 * DiffRule
 *
 * Validates file diffs produced by the agent.
 * - Empty diffs are valid for read-only/analysis tasks.
 * - No synthetic diffs are created.
 */
export class DiffRule {
  static evaluate(diffs: RunResultDiff[]): DiffRuleResult {
    const hasDiffs = diffs.length > 0

    if (!hasDiffs) {
      return {
        hasDiffs: false,
        check: {
          name: 'File Change Verification',
          passed: true,
          details: 'No file modifications detected. Task ran as read-only analysis.'
        }
      }
    }

    const totalAdditions = diffs.reduce((s, d) => s + d.additions, 0)
    const totalDeletions = diffs.reduce((s, d) => s + d.deletions, 0)
    const fileList = diffs.map((d) => `${d.filePath} (${d.changeType})`).join(', ')

    return {
      hasDiffs: true,
      check: {
        name: 'File Change Verification',
        passed: true,
        details: `${diffs.length} file(s) changed: +${totalAdditions} additions, -${totalDeletions} deletions. Files: ${fileList}.`
      }
    }
  }
}
