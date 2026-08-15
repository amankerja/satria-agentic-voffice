import type { VerificationCheck } from '../VerificationEngine'
import type { CollectedArtifact } from '../../results/ArtifactCollector'

export interface ArtifactRuleInput {
  artifacts: CollectedArtifact[]
  requiredArtifactPaths?: string[]
}

export interface ArtifactRuleResult {
  checks: VerificationCheck[]
  hasArtifacts: boolean
}

/**
 * ArtifactRule
 *
 * Validates that artifacts:
 * 1. Are only counted if actually collected (not synthetic IDs)
 * 2. Required artifact paths are present if specified
 *
 * An empty artifact list is valid for read-only tasks.
 * No artifact IDs are fabricated.
 */
export class ArtifactRule {
  static evaluate(input: ArtifactRuleInput): ArtifactRuleResult {
    const checks: VerificationCheck[] = []
    const { artifacts, requiredArtifactPaths = [] } = input

    if (artifacts.length === 0 && requiredArtifactPaths.length === 0) {
      // No artifacts expected — this is fine (read-only task)
      checks.push({
        name: 'Artifact Verification',
        passed: true,
        details: 'Task produced no file artifacts (read-only execution verified).'
      })
      return { checks, hasArtifacts: false }
    }

    if (artifacts.length > 0) {
      checks.push({
        name: 'Artifact Collection',
        passed: true,
        details: `${artifacts.length} real artifact(s) collected: ${artifacts.map((a) => a.name).join(', ')}.`
      })
    }

    // Check required artifact paths
    for (const requiredPath of requiredArtifactPaths) {
      const found = artifacts.some(
        (a) => a.path === requiredPath || a.name === requiredPath.split(/[\\/]/).pop()
      )
      checks.push({
        name: `Required Artifact: ${requiredPath}`,
        passed: found,
        details: found
          ? `Artifact "${requiredPath}" exists and was produced by the agent.`
          : `Required artifact "${requiredPath}" was NOT produced by the agent.`
      })
    }

    return {
      checks,
      hasArtifacts: artifacts.length > 0
    }
  }
}
