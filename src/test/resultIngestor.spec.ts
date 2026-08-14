import { describe, it, expect, beforeEach } from 'vitest'
import { ResultIngestor } from '../runtime/results/ResultIngestor'
import { ArtifactCollector } from '../runtime/results/ArtifactCollector'

describe('ResultIngestor & ArtifactCollector Suite', () => {
  let collector: ArtifactCollector
  let ingestor: ResultIngestor

  beforeEach(() => {
    collector = new ArtifactCollector()
    ingestor = new ResultIngestor(collector)
  })

  it('accumulates streaming message deltas into complete output', () => {
    const runId = 'run-test-01'
    ingestor.appendOutputDelta(runId, 'Hello ')
    ingestor.appendOutputDelta(runId, 'World! ')
    ingestor.appendOutputDelta(runId, 'Architecture summary completed.')

    const result = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(result.output).toBe('Hello World! Architecture summary completed.')
    expect(result.status).toBe('Completed')
    expect(result.artifactIds).toEqual([])
  })

  it('extracts real artifacts from tool write outputs', () => {
    const runId = 'run-test-02'
    ingestor.recordToolExecution(
      runId,
      'write_to_file',
      'Created file file:///C:/Projects/AI AGENTIC UI/src/models/User.ts with requested content.',
      undefined,
      true
    )

    const artifacts = collector.getArtifacts(runId)
    expect(artifacts.length).toBe(1)
    expect(artifacts[0].name).toBe('User.ts')

    const result = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(result.artifactIds.length).toBe(1)
    expect(result.artifactIds[0]).toContain('art-run-test-02')
  })

  it('extracts structured diffs from patch output', () => {
    const runId = 'run-test-03'
    const patch = `--- a/src/App.vue\n+++ b/src/App.vue\n@@ -1,3 +1,4 @@\n+import NewComponent from './NewComponent.vue'\n`
    
    ingestor.recordToolExecution(runId, 'replace_file_content', 'File edited', patch, true)

    const result = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(result.diffs?.length).toBe(1)
    expect(result.diffs?.[0].filePath).toBe('src/App.vue')
    expect(result.diffs?.[0].additions).toBe(1)
  })

  it('returns empty artifact list when no artifacts are produced', () => {
    const runId = 'run-test-04'
    ingestor.appendOutputDelta(runId, 'Read-only analysis finished without modifying files.')

    const result = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(result.artifactIds).toEqual([])
  })
})
