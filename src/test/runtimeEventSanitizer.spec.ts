import { describe, it, expect } from 'vitest'
import {
  sanitizeRuntimeEvent,
  sanitizeRuntimeResult,
  sanitizeActivityText
} from '../runtime/security/RuntimeEventSanitizer'
import type { RuntimeEvent, AgentRuntimeResult } from '../runtime/types'

describe('RuntimeEventSanitizer — Mandatory Boundary', () => {
  // ─── Secret Redaction ──────────────────────────────────────
  it('redacts API keys from log messages', () => {
    const event: RuntimeEvent = {
      type: 'log:emitted',
      runId: 'run-001',
      timestamp: new Date().toISOString(),
      log: {
        id: 'log-1',
        timestamp: '12:00:00',
        step: 'Working',
        message: 'Using key sk-proj-abc123def456ghi789jklmno for API call',
        level: 'info'
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.log!.message).not.toContain('sk-proj-abc123def456ghi789jklmno')
    expect(sanitized.log!.message).toContain('[REDACTED_OPENAI_KEY]')
  })

  it('redacts bearer tokens from error strings', () => {
    const event: RuntimeEvent = {
      type: 'run:failed',
      runId: 'run-002',
      timestamp: new Date().toISOString(),
      error: 'Auth failed with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.error!).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
    expect(sanitized.error!).toContain('[REDACTED_TOKEN]')
  })

  it('redacts secrets from tool call parameters', () => {
    const event: RuntimeEvent = {
      type: 'tool:requested',
      runId: 'run-003',
      timestamp: new Date().toISOString(),
      toolCall: {
        id: 'tc-1',
        toolName: 'http.request',
        parameters: {
          url: 'https://api.openai.com/v1/chat',
          headers: {
            authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-longer-token',
            api_key: 'sk-ant-very-secret-key-1234567890abcdef'
          }
        },
        isHighRisk: true,
        requestedAt: new Date().toISOString()
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    const params = sanitized.toolCall!.parameters
    expect(params.headers.api_key).toBe('[REDACTED_CREDENTIAL]')
  })

  it('redacts secrets from tool result output', () => {
    const event: RuntimeEvent = {
      type: 'tool:executed',
      runId: 'run-004',
      timestamp: new Date().toISOString(),
      toolResult: {
        toolCallId: 'tc-2',
        toolName: 'filesystem.read',
        success: true,
        output: 'password: "super_secret_pass_12345"',
        executionTimeMs: 150
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    // The generic credential regex replaces the key=value pattern
    expect(sanitized.toolResult!.output!).toContain('[REDACTED_CREDENTIAL]')
  })

  it('redacts database URLs from tool result diffs', () => {
    const event: RuntimeEvent = {
      type: 'tool:executed',
      runId: 'run-005',
      timestamp: new Date().toISOString(),
      toolResult: {
        toolCallId: 'tc-3',
        toolName: 'filesystem.write',
        success: true,
        diff: '+DATABASE_URL=postgres://admin:s3cret@db.prod.internal:5432/myapp',
        executionTimeMs: 80
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.toolResult!.diff!).toContain('[REDACTED_DATABASE_URL]')
    expect(sanitized.toolResult!.diff!).not.toContain('admin:s3cret')
  })

  it('redacts secrets from approval request preview and diff', () => {
    const event: RuntimeEvent = {
      type: 'approval:required',
      runId: 'run-006',
      timestamp: new Date().toISOString(),
      approvalRequest: {
        id: 'apprv-1',
        runId: 'run-006',
        toolCall: {
          id: 'tc-4',
          toolName: 'deploy',
          parameters: { api_key: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz1234' },
          isHighRisk: true,
          requestedAt: new Date().toISOString()
        },
        reason: 'High risk action: deploy with token ghp_1234567890abcdefghijklmnopqrstuvwxyz1234',
        previewContent: 'Deploying with secret_key: "my-app-secret-password-12345"',
        diffContent: '+GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz1234',
        requestedAt: new Date().toISOString()
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.approvalRequest!.reason).toContain('[REDACTED_GITHUB_TOKEN]')
    expect(sanitized.approvalRequest!.previewContent!).toContain('[REDACTED_CREDENTIAL]')
    expect(sanitized.approvalRequest!.diffContent!).toContain('[REDACTED_GITHUB_TOKEN]')
    expect(sanitized.approvalRequest!.toolCall.parameters.api_key).toBe('[REDACTED_CREDENTIAL]')
  })

  // ─── Length Clamping ───────────────────────────────────────
  it('clamps excessively long log messages', () => {
    const longMessage = 'A'.repeat(100_000)
    const event: RuntimeEvent = {
      type: 'log:emitted',
      runId: 'run-007',
      timestamp: new Date().toISOString(),
      log: {
        id: 'log-2',
        timestamp: '12:00:00',
        step: 'Working',
        message: longMessage,
        level: 'info'
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.log!.message.length).toBeLessThan(60_000)
    expect(sanitized.log!.message).toContain('truncated')
  })

  it('clamps excessively long error strings', () => {
    const longError = 'E'.repeat(50_000)
    const event: RuntimeEvent = {
      type: 'run:failed',
      runId: 'run-008',
      timestamp: new Date().toISOString(),
      error: longError
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.error!.length).toBeLessThan(15_000)
    expect(sanitized.error!).toContain('truncated')
  })

  it('clamps excessively long tool output', () => {
    const longOutput = 'X'.repeat(1_000_000)
    const event: RuntimeEvent = {
      type: 'tool:executed',
      runId: 'run-009',
      timestamp: new Date().toISOString(),
      toolResult: {
        toolCallId: 'tc-5',
        toolName: 'terminal.execute',
        success: true,
        output: longOutput,
        executionTimeMs: 5000
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.toolResult!.output!.length).toBeLessThan(600_000)
    expect(sanitized.toolResult!.output!).toContain('truncated')
  })

  // ─── Telemetry Clamping ────────────────────────────────────
  it('clamps unreasonable telemetry values', () => {
    const event: RuntimeEvent = {
      type: 'telemetry:updated',
      runId: 'run-010',
      timestamp: new Date().toISOString(),
      telemetry: {
        promptTokens: -100,
        completionTokens: 999_999_999,
        totalTokens: 999_999_999,
        cachedTokens: -5,
        model: 'test-model',
        provider: 'test-provider',
        durationMs: 999_999_999,
        estimatedCostUsd: 100_000
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.telemetry!.promptTokens).toBe(0)
    expect(sanitized.telemetry!.completionTokens).toBeLessThanOrEqual(100_000_000)
    expect(sanitized.telemetry!.cachedTokens).toBe(0)
    expect(sanitized.telemetry!.durationMs).toBeLessThanOrEqual(86_400_000)
    expect(sanitized.telemetry!.estimatedCostUsd).toBeLessThanOrEqual(10_000)
  })

  // ─── Preserves structure ───────────────────────────────────
  it('preserves event type and runId unchanged', () => {
    const event: RuntimeEvent = {
      type: 'progress:updated',
      runId: 'run-011',
      timestamp: '2026-08-15T12:00:00Z',
      progress: 75,
      step: 'Working'
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.type).toBe('progress:updated')
    expect(sanitized.runId).toBe('run-011')
    expect(sanitized.timestamp).toBe('2026-08-15T12:00:00Z')
    expect(sanitized.progress).toBe(75)
    expect(sanitized.step).toBe('Working')
  })

  it('handles null/undefined fields gracefully', () => {
    const event: RuntimeEvent = {
      type: 'run:started',
      runId: 'run-012',
      timestamp: new Date().toISOString()
    }

    const sanitized = sanitizeRuntimeEvent(event)
    expect(sanitized.log).toBeUndefined()
    expect(sanitized.error).toBeUndefined()
    expect(sanitized.telemetry).toBeUndefined()
    expect(sanitized.toolCall).toBeUndefined()
    expect(sanitized.toolResult).toBeUndefined()
    expect(sanitized.approvalRequest).toBeUndefined()
    expect(sanitized.result).toBeUndefined()
  })

  // ─── sanitizeRuntimeResult ─────────────────────────────────
  it('sanitizes runtime result output and summary', () => {
    const result: AgentRuntimeResult = {
      runId: 'run-013',
      status: 'Completed',
      summary: 'Used key sk-proj-abc123def456ghi789jklmno to generate output',
      output: 'Full output with postgres://admin:secret@db:5432/app connection string',
      artifactIds: ['art-1']
    }

    const sanitized = sanitizeRuntimeResult(result)
    expect(sanitized.summary).not.toContain('sk-proj-abc123def456ghi789jklmno')
    expect(sanitized.output).toContain('[REDACTED_DATABASE_URL]')
  })

  it('sanitizes runtime result diffs', () => {
    const result: AgentRuntimeResult = {
      runId: 'run-014',
      status: 'Completed',
      summary: 'File changes',
      output: 'Done',
      artifactIds: [],
      diffs: [
        {
          filePath: '.env',
          changeType: 'modified',
          additions: 1,
          deletions: 0,
          diffContent: '+API_KEY=sk-proj-abc123def456ghi789jklmno'
        }
      ]
    }

    const sanitized = sanitizeRuntimeResult(result)
    expect(sanitized.diffs![0].diffContent).toContain('[REDACTED_OPENAI_KEY]')
  })

  // ─── sanitizeActivityText ──────────────────────────────────
  it('sanitizes activity text', () => {
    const text = 'Worker used Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secrettoken to access API'
    const sanitized = sanitizeActivityText(text)
    expect(sanitized).toContain('[REDACTED_TOKEN]')
    expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
  })

  it('clamps excessively long activity text', () => {
    const longText = 'B'.repeat(50_000)
    const sanitized = sanitizeActivityText(longText)
    expect(sanitized.length).toBeLessThan(15_000)
  })

  // ─── Result event with embedded result ────────────────────
  it('sanitizes embedded result in run:completed event', () => {
    const event: RuntimeEvent = {
      type: 'run:completed',
      runId: 'run-015',
      timestamp: new Date().toISOString(),
      result: {
        runId: 'run-015',
        status: 'Completed',
        summary: 'Generated with key sk-ant-very-secret-key-1234567890abcdef',
        output: 'Result containing postgres://root:password@localhost:5432/db',
        artifactIds: ['art-2'],
        diffs: [
          {
            filePath: 'config.ts',
            changeType: 'modified',
            additions: 2,
            deletions: 1,
            diffContent: '+const key = "ghp_1234567890abcdefghijklmnopqrstuvwxyz1234"'
          }
        ]
      }
    }

    const sanitized = sanitizeRuntimeEvent(event)
    // sk-ant key is redacted (may match OpenAI or Anthropic key pattern)
    expect(sanitized.result!.summary).not.toContain('sk-ant-very-secret-key')
    expect(sanitized.result!.output).toContain('[REDACTED_DATABASE_URL]')
    expect(sanitized.result!.diffs![0].diffContent).toContain('[REDACTED_GITHUB_TOKEN]')
  })
})
