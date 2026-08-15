import { describe, it, expect, beforeEach } from 'vitest'
import { ResultIngestor } from '../runtime/results/ResultIngestor'
import { ArtifactCollector } from '../runtime/results/ArtifactCollector'
import { VerificationEngine } from '../runtime/verification/VerificationEngine'
import { AcceptanceCriteriaRule } from '../runtime/verification/rules/AcceptanceCriteriaRule'

describe('Result Ingestion → Verification Integration (Phase 3.7)', () => {
  let collector: ArtifactCollector
  let ingestor: ResultIngestor

  beforeEach(() => {
    collector = new ArtifactCollector()
    ingestor = new ResultIngestor(collector)
  })

  // Full flow: Hermes completion → ResultIngestor → VerificationEngine → RunResult
  it('flows correctly from completion fixture to verified run result', () => {
    const runId = 'run-integration-01'
    const criteria = ['RuntimeFactory identified', 'HermesClient identified']

    // Simulate Hermes streaming output
    ingestor.appendOutputDelta(runId, '## Architecture Report\n')
    ingestor.appendOutputDelta(runId, '**RuntimeFactory** is the central dispatch gateway.\n')
    ingestor.appendOutputDelta(runId, '**HermesClient** handles SSE streaming from Hermes API.\n')
    ingestor.appendOutputDelta(runId, 'The telemetry layer tracks token usage and latency.\n')

    // Simulate tool executions (read-only — no file writes)
    ingestor.recordToolExecution(runId, 'read_file', 'Read src/runtime/RuntimeFactory.ts', undefined, true)
    ingestor.recordToolExecution(runId, 'read_file', 'Read src/runtime/hermes/HermesClient.ts', undefined, true)

    // Build runtime result (no diffs, no artifacts for read-only task)
    const runtimeResult = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(runtimeResult.status).toBe('Completed')
    expect(runtimeResult.output).toContain('RuntimeFactory')
    expect(runtimeResult.artifactIds).toEqual([]) // no artifacts for read-only
    expect(runtimeResult.diffs).toEqual([])

    // Evaluate criteria against actual output
    const evaluatedCriteria = AcceptanceCriteriaRule.evaluateAgainstOutput(
      criteria,
      runtimeResult.output,
      runtimeResult.status
    )
    expect(evaluatedCriteria[0].passed).toBe(true) // RuntimeFactory found
    expect(evaluatedCriteria[1].passed).toBe(true) // HermesClient found

    // Run verification engine
    const report = VerificationEngine.evaluate({
      runtimeResult,
      acceptanceCriteria: evaluatedCriteria,
      diffCount: 0,
      securityPassed: true
    })

    expect(report.status).toBe('Passed')
    expect(report.score).toBe(100)
    expect(report.evidence.length).toBeGreaterThan(0)
    expect(report.checks.every((c) => c.passed)).toBe(true)
    expect(report.summaryNotes).toContain('Passed')
  })

  // Flow: agent produced no output → verification fails
  it('fails verification when agent produces no output', () => {
    const runId = 'run-integration-02'
    const criteria = ['Summary provided', 'Architecture described']

    // No output deltas — agent produced nothing
    const runtimeResult = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(runtimeResult.output).toBe('')
    expect(runtimeResult.artifactIds).toEqual([])

    const evaluatedCriteria = AcceptanceCriteriaRule.evaluateAgainstOutput(
      criteria,
      runtimeResult.output,
      runtimeResult.status
    )
    expect(evaluatedCriteria.every((c) => !c.passed)).toBe(true)

    const report = VerificationEngine.evaluate({
      runtimeResult,
      acceptanceCriteria: evaluatedCriteria,
      securityPassed: true
    })
    expect(report.status).toBe('Failed')
    expect(report.checks.some((c) => !c.passed)).toBe(true)
  })

  // Flow: agent writes a file → artifact collected → verified
  it('collects real artifact when agent writes a file', () => {
    const runId = 'run-integration-03'

    ingestor.appendOutputDelta(runId, 'Writing output to file.')
    ingestor.recordToolExecution(
      runId,
      'write_to_file',
      'Created file file:///C:/Projects/AI AGENTIC UI/src/models/NewModel.ts',
      undefined,
      true
    )

    const runtimeResult = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(runtimeResult.artifactIds.length).toBe(1)
    expect(runtimeResult.artifactIds[0]).toContain('art-')

    const report = VerificationEngine.evaluate({
      runtimeResult,
      securityPassed: true,
      acceptanceCriteria: [{ name: 'File created', passed: true, details: 'NewModel.ts created' }]
    })
    expect(report.status).toBe('Passed')
  })

  // Flow: agent modifies files → diffs collected → verified
  it('collects real diffs when agent modifies files', () => {
    const runId = 'run-integration-04'
    const patch = `--- a/src/App.vue\n+++ b/src/App.vue\n@@ -1,3 +1,5 @@\n+import { ref } from 'vue'\n+import NewComponent from './NewComponent.vue'\n`

    ingestor.appendOutputDelta(runId, 'Updating App.vue to add new import.')
    ingestor.recordToolExecution(runId, 'replace_file_content', 'File edited', patch, true)

    const runtimeResult = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(runtimeResult.diffs?.length).toBe(1)
    expect(runtimeResult.diffs?.[0].filePath).toBe('src/App.vue')
    expect(runtimeResult.diffs?.[0].additions).toBeGreaterThan(0)

    const report = VerificationEngine.evaluate({
      runtimeResult,
      securityPassed: true,
      diffCount: runtimeResult.diffs?.length || 0,
      acceptanceCriteria: [{ name: 'Import added', passed: true, details: 'Done' }]
    })
    expect(report.status).toBe('Passed')
  })

  // No false positive: completed run without evidence stays Failed if criteria not met
  it('does not auto-pass verification when run completed but criteria lack evidence', () => {
    const runId = 'run-integration-05'
    const criteria = ['Implement SecurityRule', 'Add verification tests', 'Update VerificationEngine']

    ingestor.appendOutputDelta(runId, 'I read the files and understand the codebase structure.')

    const runtimeResult = ingestor.buildRuntimeResult(runId, 'Completed')
    const evaluatedCriteria = AcceptanceCriteriaRule.evaluateAgainstOutput(
      criteria,
      runtimeResult.output,
      runtimeResult.status
    )

    // The output doesn't mention the specific required deliverables
    expect(evaluatedCriteria.some((c) => !c.passed)).toBe(true)

    const report = VerificationEngine.evaluate({
      runtimeResult,
      acceptanceCriteria: evaluatedCriteria,
      securityPassed: true
    })

    // Should NOT be Passed because criteria evidence is insufficient
    expect(report.status).not.toBe('Passed')
  })
})
