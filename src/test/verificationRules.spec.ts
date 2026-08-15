import { describe, it, expect } from 'vitest'
import { AcceptanceCriteriaRule } from '../runtime/verification/rules/AcceptanceCriteriaRule'

describe('AcceptanceCriteriaRule', () => {
  // 1. All criteria pass
  it('marks all criteria as passed when output contains evidence for all', () => {
    const criteria = [
      'RuntimeFactory role identified',
      'HermesClient identified',
      'Telemetry layer identified'
    ]
    const output = `
## Architecture Analysis

**RuntimeFactory** serves as the central factory that selects the runtime adapter.
The **RuntimeFactory** role is to dispatch execution to the correct backend.
**HermesClient** is the HTTP/SSE client that communicates with the Hermes API gateway.
The HermesClient role is to handle streaming events.
The **telemetry** layer captures token usage, cost estimates, and latency metrics.
The telemetry layer is identified as the observability subsystem.
    `
    const result = AcceptanceCriteriaRule.evaluateAgainstOutput(criteria, output, 'Completed')
    expect(result).toHaveLength(3)
    expect(result.every((r) => r.passed)).toBe(true)
  })

  // 2. Criterion failure — keyword not in output
  it('marks criterion as failed when output lacks evidence', () => {
    const criteria = ['SecurityRule implemented', 'VerificationEngine upgraded']
    const output = 'I analyzed the codebase and found the runtime components.'
    const result = AcceptanceCriteriaRule.evaluateAgainstOutput(criteria, output, 'Completed')
    const allPassed = result.every((r) => r.passed)
    expect(allPassed).toBe(false)
    const veResult = result.find((r) => r.name === 'VerificationEngine upgraded')
    expect(veResult?.passed).toBe(false)
  })

  // 3. Empty output — all criteria fail
  it('fails all criteria when output is empty', () => {
    const criteria = ['step1', 'step2', 'step3']
    const result = AcceptanceCriteriaRule.evaluateAgainstOutput(criteria, '', 'Completed')
    expect(result.every((r) => r.passed)).toBe(false)
    expect(result[0].details).toContain('no output')
  })

  // 4. Run status Failed — all criteria fail
  it('fails all criteria when run did not complete', () => {
    const criteria = ['analyze runtime', 'report findings']
    const result = AcceptanceCriteriaRule.evaluateAgainstOutput(
      criteria,
      'partial output',
      'Failed'
    )
    expect(result.every((r) => r.passed)).toBe(false)
    expect(result[0].details).toContain('Failed')
  })

  // 5. AcceptanceCriteriaRule.evaluate with explicit passed values
  it('evaluates explicit criterion inputs correctly', () => {
    const result = AcceptanceCriteriaRule.evaluate([
      { name: 'Criterion A', passed: true, details: 'Done' },
      { name: 'Criterion B', passed: false, details: 'Missing' },
      { name: 'Criterion C', passed: true, details: 'Done' }
    ])
    expect(result.passedCount).toBe(2)
    expect(result.totalCount).toBe(3)
    expect(result.allMandatoryPassed).toBe(false)
  })

  // 6. All explicit criteria pass
  it('reports allMandatoryPassed=true when all pass', () => {
    const result = AcceptanceCriteriaRule.evaluate([
      { name: 'A', passed: true, details: 'Ok' },
      { name: 'B', passed: true, details: 'Ok' }
    ])
    expect(result.allMandatoryPassed).toBe(true)
    expect(result.passedCount).toBe(2)
  })
})
