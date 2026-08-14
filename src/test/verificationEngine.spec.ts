import { describe, it, expect } from 'vitest'
import { VerificationEngine } from '../runtime/verification/VerificationEngine'

describe('VerificationEngine Quality Gate Suite', () => {
  it('evaluates all mandatory checks passed with 100% score', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 0,
      testOutput: '15 passed tests',
      typecheckPassed: true,
      buildPassed: true,
      securityPassed: true,
      acceptanceCriteria: [
        { name: 'Architecture Review', passed: true, details: 'Clear summary generated' },
        { name: 'No file modification', passed: true, details: 'Read only' }
      ],
      diffCount: 0
    })

    expect(report.status).toBe('Passed')
    expect(report.score).toBe(100)
    expect(report.evidence.length).toBeGreaterThan(4)
    expect(report.evidence.every((e) => e.passed)).toBe(true)
  })

  it('fails quality gate when security boundary is violated', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 0,
      typecheckPassed: true,
      securityPassed: false,
      acceptanceCriteria: [{ name: 'Task', passed: true, details: 'Output produced' }]
    })

    expect(report.status).toBe('Failed')
    expect(report.checks.find((c) => c.name.includes('Security'))?.passed).toBe(false)
  })

  it('fails quality gate when test exit code is non-zero even with high score', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 1,
      testOutput: 'Assertion error in auth.spec.ts',
      typecheckPassed: true,
      securityPassed: true,
      acceptanceCriteria: [
        { name: 'Step 1', passed: true, details: 'Done' },
        { name: 'Step 2', passed: true, details: 'Done' },
        { name: 'Step 3', passed: true, details: 'Done' }
      ]
    })

    expect(report.status).toBe('Failed')
    expect(report.checks.find((c) => c.name.includes('Test'))?.passed).toBe(false)
  })

  it('produces Warning status on non-fatal missing optional artifact', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 0,
      typecheckPassed: true,
      securityPassed: true,
      artifactChecks: [
        { name: 'Core deliverable', passed: true, details: 'Generated' },
        { name: 'Optional swagger schema', passed: false, details: 'Not generated' }
      ]
    })

    expect(report.status).toBe('Warning')
    expect(report.score).toBeLessThan(100)
  })
})
