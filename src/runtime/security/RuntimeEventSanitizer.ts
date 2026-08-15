/**
 * SATRIA AI WORKFORCE — Runtime Event Sanitizer
 *
 * Single mandatory boundary that ALL runtime data must pass through
 * before entering the application state layer. Covers:
 *   - Hermes SSE events
 *   - Runtime errors
 *   - Tool call parameters & results
 *   - Result ingestion output & diffs
 *   - Activity detail text
 *   - Run log entries
 *
 * This is the ONE choke-point. Nothing from outside reaches the UI
 * or persistence layer without going through sanitizeRuntimeEvent().
 */

import type {
  RuntimeEvent,
  AgentRuntimeResult,
  ToolCallRequest,
  ToolCallResult,
  ApprovalRequest
} from '../types'
import type { RunLogEntry, RuntimeTelemetry } from '../../types'
import { SecuritySanitizer } from './SecuritySanitizer'

// ─── Max Lengths ────────────────────────────────────────────────
// Defensive clamping prevents memory exhaustion from malicious or
// runaway payloads.
const MAX_LOG_MESSAGE_LENGTH = 50_000
const MAX_ERROR_LENGTH = 10_000
const MAX_TOOL_OUTPUT_LENGTH = 500_000
const MAX_DIFF_LENGTH = 1_000_000
const MAX_SUMMARY_LENGTH = 10_000
const MAX_OUTPUT_LENGTH = 2_000_000
const MAX_PREVIEW_LENGTH = 500_000
const MAX_PARAM_VALUE_LENGTH = 100_000

// ─── Helpers ────────────────────────────────────────────────────

/** Sanitize and clamp a string field */
function sanitizeString(
  value: string | undefined | null,
  maxLength: number
): string | undefined {
  if (value === undefined || value === null) return undefined
  const sanitized = SecuritySanitizer.sanitizeText(value)
  if (sanitized.length > maxLength) {
    return sanitized.slice(0, maxLength) + `\n…[truncated at ${maxLength} chars]`
  }
  return sanitized
}

/** Sanitize tool call parameters — redact secret-looking values */
function sanitizeParameters(
  params: Record<string, any> | undefined
): Record<string, any> | undefined {
  if (!params || typeof params !== 'object') return params
  return SecuritySanitizer.sanitizeObject(clampObjectStrings(params, MAX_PARAM_VALUE_LENGTH))
}

/** Recursively clamp string values in nested objects/arrays */
function clampObjectStrings(obj: any, maxLength: number): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') {
    return obj.length > maxLength
      ? obj.slice(0, maxLength) + `…[truncated]`
      : obj
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => clampObjectStrings(item, maxLength))
  }
  if (typeof obj === 'object') {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = clampObjectStrings(value, maxLength)
    }
    return result
  }
  return obj
}

// ─── Sub-Sanitizers ─────────────────────────────────────────────

function sanitizeLogEntry(log: RunLogEntry): RunLogEntry {
  return {
    ...log,
    message: sanitizeString(log.message, MAX_LOG_MESSAGE_LENGTH) || '',
    step: log.step
  }
}

function sanitizeToolCall(tc: ToolCallRequest): ToolCallRequest {
  return {
    ...tc,
    toolName: sanitizeString(tc.toolName, 256) || tc.toolName,
    parameters: sanitizeParameters(tc.parameters) || {},
    requestedAt: tc.requestedAt
  }
}

function sanitizeToolResult(tr: ToolCallResult): ToolCallResult {
  return {
    ...tr,
    toolName: sanitizeString(tr.toolName, 256) || tr.toolName,
    output: sanitizeString(tr.output, MAX_TOOL_OUTPUT_LENGTH),
    diff: sanitizeString(tr.diff, MAX_DIFF_LENGTH),
    error: sanitizeString(tr.error, MAX_ERROR_LENGTH)
  }
}

function sanitizeApprovalRequest(ar: ApprovalRequest): ApprovalRequest {
  return {
    ...ar,
    reason: sanitizeString(ar.reason, MAX_SUMMARY_LENGTH) || ar.reason,
    previewContent: sanitizeString(ar.previewContent, MAX_PREVIEW_LENGTH),
    diffContent: sanitizeString(ar.diffContent, MAX_DIFF_LENGTH),
    toolCall: sanitizeToolCall(ar.toolCall)
  }
}

function sanitizeTelemetry(
  telemetry: RuntimeTelemetry | undefined
): RuntimeTelemetry | undefined {
  if (!telemetry) return undefined
  return {
    ...telemetry,
    // Clamp numeric values to sane ranges
    promptTokens: Math.max(0, Math.min(telemetry.promptTokens, 100_000_000)),
    completionTokens: Math.max(0, Math.min(telemetry.completionTokens, 100_000_000)),
    totalTokens: Math.max(0, Math.min(telemetry.totalTokens, 200_000_000)),
    cachedTokens: Math.max(0, Math.min(telemetry.cachedTokens, 100_000_000)),
    durationMs: Math.max(0, Math.min(telemetry.durationMs, 86_400_000)), // 24h max
    estimatedCostUsd:
      telemetry.estimatedCostUsd !== null
        ? Math.max(0, Math.min(telemetry.estimatedCostUsd, 10_000)) // $10k sanity cap
        : null,
    model: sanitizeString(telemetry.model, 256) || telemetry.model,
    provider: sanitizeString(telemetry.provider, 256) || telemetry.provider
  }
}

// ─── Result Sanitizer (exported separately for ResultIngestor) ──

export function sanitizeRuntimeResult(result: AgentRuntimeResult): AgentRuntimeResult {
  return {
    ...result,
    summary: sanitizeString(result.summary, MAX_SUMMARY_LENGTH) || result.summary,
    output: sanitizeString(result.output, MAX_OUTPUT_LENGTH) || result.output,
    error: sanitizeString(result.error, MAX_ERROR_LENGTH),
    verificationNotes: sanitizeString(result.verificationNotes, MAX_SUMMARY_LENGTH),
    telemetry: sanitizeTelemetry(result.telemetry),
    diffs: result.diffs?.map((d) => ({
      ...d,
      filePath: sanitizeString(d.filePath, 1024) || d.filePath,
      diffContent: sanitizeString(d.diffContent, MAX_DIFF_LENGTH)
    }))
  }
}

// ─── Activity Text Sanitizer ────────────────────────────────────

export function sanitizeActivityText(text: string): string {
  return sanitizeString(text, MAX_SUMMARY_LENGTH) || ''
}

// ─── Main Boundary ──────────────────────────────────────────────

/**
 * **THE** single mandatory sanitization boundary.
 *
 * Every RuntimeEvent — whether from Hermes SSE, MockRuntimeAdapter,
 * or any future runtime — MUST pass through this function before
 * reaching the Pinia store event handler.
 *
 * Guarantees:
 *   1. All string fields are redacted for secrets (API keys, tokens, passwords, etc.)
 *   2. All string fields are clamped to safe maximum lengths
 *   3. Tool parameters are recursively sanitized
 *   4. Numeric telemetry values are clamped to sane ranges
 *   5. Nested structures (diffs, approval requests, results) are sanitized
 */
export function sanitizeRuntimeEvent(event: RuntimeEvent): RuntimeEvent {
  const sanitized: RuntimeEvent = {
    type: event.type,
    runId: event.runId,
    timestamp: event.timestamp,
    progress: event.progress
  }

  // Step (string | RunStep)
  if (event.step !== undefined) {
    sanitized.step = event.step
  }

  // Log entry
  if (event.log) {
    sanitized.log = sanitizeLogEntry(event.log)
  }

  // Error string
  if (event.error !== undefined) {
    sanitized.error = sanitizeString(event.error, MAX_ERROR_LENGTH)
  }

  // Telemetry
  if (event.telemetry) {
    sanitized.telemetry = sanitizeTelemetry(event.telemetry)
  }

  // Tool call request
  if (event.toolCall) {
    sanitized.toolCall = sanitizeToolCall(event.toolCall)
  }

  // Tool call result
  if (event.toolResult) {
    sanitized.toolResult = sanitizeToolResult(event.toolResult)
  }

  // Approval request
  if (event.approvalRequest) {
    sanitized.approvalRequest = sanitizeApprovalRequest(event.approvalRequest)
  }

  // Completed/failed result payload
  if (event.result) {
    sanitized.result = sanitizeRuntimeResult(event.result)
  }

  return sanitized
}
