import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReviewStore } from '../stores/review'
import { VerificationEngine } from '../runtime/verification/VerificationEngine'
import { ArtifactCollector } from '../runtime/results/ArtifactCollector'
import { ResultIngestor } from '../runtime/results/ResultIngestor'
import { MockRunResultRepository, MockReviewRepository } from '../repositories'
import type { RunResult, TaskReview } from '../types'

describe('Phase 3.8 Presentation & Verification Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('populates and retrieves complete RunResult with output, artifacts, diffs and evidence', async () => {
    const resultRepo = new MockRunResultRepository()
    const reviewStore = useReviewStore()

    const newResult: Omit<RunResult, 'id' | 'createdAt' | 'updatedAt'> = {
      runId: 'run-presentation-01',
      taskId: 'tsk-201',
      assignmentId: 'asg-201',
      summary: 'Schema definition and architecture complete.',
      output: '### Complete Output\nDetailed technical specification for user.',
      status: 'success',
      artifactIds: ['art-schema-01', 'art-diff-01'],
      diffs: [
        {
          filePath: 'src/runtime/types.ts',
          changeType: 'modified',
          additions: 10,
          deletions: 2,
          diffContent: '--- a/src/runtime/types.ts\n+++ b/src/runtime/types.ts\n@@ -1,2 +1,10 @@\n+export interface Test {}'
        }
      ],
      verificationStatus: 'Passed',
      verificationNotes: 'Quality Gate Passed: 3/3 assertions passed (Score: 100%).',
      verificationEvidence: [
        { type: 'security', name: 'Sandbox Boundary', passed: true, details: 'Zero violations' },
        { type: 'test', name: 'Vitest Unit Tests', passed: true, details: 'All tests passed', command: 'vitest run' },
        { type: 'criteria', name: 'Output Deliverable', passed: true, details: 'Non-empty output' }
      ]
    }

    const created = await resultRepo.create(newResult)
    expect(created.id).toBeTruthy()
    expect(created.verificationEvidence?.length).toBe(3)

    // Store can fetch it by runId
    const fetched = await reviewStore.fetchResultByRunId('run-presentation-01')
    expect(fetched).toBeTruthy()
    expect(fetched?.output).toContain('### Complete Output')
    expect(fetched?.verificationStatus).toBe('Passed')
    expect(fetched?.diffs?.length).toBe(1)
    expect(fetched?.artifactIds.length).toBe(2)
  })

  it('calculates accurate quality gate score and check states', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 0,
      testOutput: '25 tests passed',
      typecheckPassed: true,
      buildPassed: true,
      securityPassed: true,
      acceptanceCriteria: [
        { name: 'Feature A', passed: true, details: 'Verified' },
        { name: 'Feature B', passed: false, details: 'Not matched' }
      ]
    })

    // Because Feature B failed, Quality Gate is Failed
    expect(report.status).toBe('Failed')
    expect(report.checks.length).toBeGreaterThanOrEqual(5)
    const passedCount = report.checks.filter((c) => c.passed).length
    const expectedScore = Math.round((passedCount / report.checks.length) * 100)
    expect(report.score).toBe(expectedScore)
    expect(report.score).toBeLessThan(100)
  })

  it('correctly maps Review checklist with PASS (true) and FAIL (false) states', async () => {
    const reviewRepo = new MockReviewRepository()
    const reviewStore = useReviewStore()

    const mockReview: Omit<TaskReview, 'id' | 'createdAt' | 'updatedAt'> = {
      runId: 'run-presentation-02',
      taskId: 'tsk-202',
      taskTitle: 'API Gateway Alignment',
      assignmentId: 'asg-202',
      employeeId: 'emp-02',
      employeeName: 'Dewi Lestari',
      reviewer: 'Satria Lead',
      status: 'Changes Requested',
      checklist: [
        { item: 'Security check: Clean boundary', completed: true },
        { item: 'Acceptance: Endpoint documented', completed: true },
        { item: 'Tests: All unit tests passing', completed: false } // failed item
      ]
    }

    const createdReview = await reviewRepo.create(mockReview)
    expect(createdReview.id).toBeTruthy()

    await reviewStore.fetchReviews()
    const found = reviewStore.reviews.find((r) => r.id === createdReview.id)
    expect(found).toBeTruthy()
    expect(found?.checklist[0].completed).toBe(true)
    expect(found?.checklist[1].completed).toBe(true)
    expect(found?.checklist[2].completed).toBe(false) // Unverified / Fail item

    const passCount = found?.checklist.filter((c) => c.completed).length
    expect(passCount).toBe(2)
    const score = Math.round(((passCount || 0) / (found?.checklist.length || 1)) * 100)
    expect(score).toBe(67)
  })

  it('ingests live artifacts and diffs from tool execution and prepares presentation data', () => {
    const collector = new ArtifactCollector()
    const ingestor = new ResultIngestor(collector)
    const runId = 'run-presentation-03'

    // Stream deltas
    ingestor.appendOutputDelta(runId, '# Final Report\nArchitecture verified.')

    // Record tool execution with patch diff
    const patch = '--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,1 +1,2 @@\n+export const VERSION = "3.8.0"\n'
    ingestor.recordToolExecution(runId, 'replace_file_content', 'File updated', patch, true)

    // Record file creation
    ingestor.recordToolExecution(
      runId,
      'write_to_file',
      'Created file file:///C:/Projects/AI AGENTIC UI/docs/spec.md with content.',
      undefined,
      true
    )

    const result = ingestor.buildRuntimeResult(runId, 'Completed')
    expect(result.output).toBe('# Final Report\nArchitecture verified.')
    expect(result.diffs?.length).toBe(1)
    expect(result.diffs?.[0].filePath).toBe('src/index.ts')
    expect(result.artifactIds.length).toBe(2) // 1 patch + 1 file

    const artifacts = collector.getArtifacts(runId)
    expect(artifacts.length).toBe(2)
    expect(artifacts.find((a) => a.type === 'patch')).toBeTruthy()
    expect(artifacts.find((a) => a.name === 'spec.md')).toBeTruthy()
  })
})
