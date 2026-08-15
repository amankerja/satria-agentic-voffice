import { describe, it, expect } from 'vitest'
import { VerificationEngine } from '../runtime/verification/VerificationEngine'

describe('Quality Gate — Full Verification Scenarios', () => {
  // 12. Quality gate: all mandatory checks pass → Passed
  it('quality gate passes when all mandatory checks are satisfied', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 0,
      testOutput: '104 tests passed',
      typecheckPassed: true,
      buildPassed: true,
      securityPassed: true,
      acceptanceCriteria: [
        { name: 'RuntimeFactory identified', passed: true, details: 'Found in output' },
        { name: 'HermesClient identified', passed: true, details: 'Found in output' }
      ],
      diffCount: 0
    })
    expect(report.status).toBe('Passed')
    expect(report.score).toBe(100)
    expect(report.evidence.length).toBeGreaterThanOrEqual(5)
  })

  // 13. Quality gate: non-critical artifact failure → Warning
  it('quality gate returns Warning when optional artifact check fails', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 0,
      typecheckPassed: true,
      securityPassed: true,
      artifactChecks: [
        { name: 'Main deliverable', passed: true, details: 'Present' },
        { name: 'Optional readme', passed: false, details: 'Not generated' }
      ]
    })
    expect(report.status).toBe('Warning')
    expect(report.score).toBeLessThan(100)
  })

  // 14. Quality gate: mandatory criterion fails → Failed
  it('quality gate fails when mandatory acceptance criterion fails', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 0,
      typecheckPassed: true,
      securityPassed: true,
      acceptanceCriteria: [
        { name: 'Feature A', passed: true, details: 'Verified' },
        { name: 'Feature B', passed: false, details: 'Not found in output' }
      ]
    })
    expect(report.status).toBe('Failed')
    expect(report.checks.some((c) => !c.passed && c.name.includes('Feature B'))).toBe(true)
  })

  // Quality gate: typecheck failure → Failed
  it('quality gate fails when typecheck fails', () => {
    const report = VerificationEngine.evaluate({
      typecheckPassed: false,
      securityPassed: true,
      acceptanceCriteria: [{ name: 'Output', passed: true, details: 'ok' }]
    })
    expect(report.status).toBe('Failed')
    expect(report.checks.find((c) => c.name.includes('Typecheck'))?.passed).toBe(false)
  })

  // Quality gate: build failure → Failed
  it('quality gate fails when production build fails', () => {
    const report = VerificationEngine.evaluate({
      buildPassed: false,
      typecheckPassed: true,
      securityPassed: true,
      acceptanceCriteria: [{ name: 'Output', passed: true, details: 'ok' }]
    })
    expect(report.status).toBe('Failed')
    expect(report.checks.find((c) => c.name.includes('Build'))?.passed).toBe(false)
  })

  // No artifacts: valid for read-only tasks
  it('passes quality gate with no artifacts for read-only analysis task', () => {
    const report = VerificationEngine.evaluate({
      securityPassed: true,
      acceptanceCriteria: [
        { name: 'Architecture reviewed', passed: true, details: 'Summary produced' }
      ],
      diffCount: 0
    })
    expect(report.status).toBe('Passed')
  })

  // Evidence persistence: evidence array is populated correctly
  it('populates verification evidence for each check', () => {
    const report = VerificationEngine.evaluate({
      testExitCode: 0,
      testOutput: '15 tests passed',
      typecheckPassed: true,
      securityPassed: true,
      acceptanceCriteria: [{ name: 'Deliverable', passed: true, details: 'Output produced' }]
    })
    const evidenceTypes = report.evidence.map((e) => e.type)
    expect(evidenceTypes).toContain('security')
    expect(evidenceTypes).toContain('test')
    expect(evidenceTypes).toContain('typecheck')
    expect(evidenceTypes).toContain('criteria')
    // All evidence items have required fields
    report.evidence.forEach((ev) => {
      expect(ev.type).toBeTruthy()
      expect(ev.name).toBeTruthy()
      expect(ev.details).toBeTruthy()
      expect(typeof ev.passed).toBe('boolean')
    })
  })

  // Quality Gate summary notes format
  it('includes quality gate summary with score and pass count', () => {
    const report = VerificationEngine.evaluate({
      securityPassed: true,
      acceptanceCriteria: [
        { name: 'Check A', passed: true, details: 'ok' },
        { name: 'Check B', passed: true, details: 'ok' }
      ]
    })
    expect(report.summaryNotes).toMatch(/Quality Gate/)
    expect(report.summaryNotes).toMatch(/Score/)
  })
})
