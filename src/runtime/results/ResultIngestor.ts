import type { AgentRuntimeResult, RuntimeTelemetry } from '../types'
import type { RunResultDiff } from '../../types'
import { ArtifactCollector, globalArtifactCollector } from './ArtifactCollector'
import { SecuritySanitizer } from '../security/SecuritySanitizer'

export interface IngestionBuffer {
  runId: string
  outputDeltas: string[]
  toolExecutions: {
    toolName: string
    output?: string
    diff?: string
    success: boolean
    timestamp: string
  }[]
  diffs: RunResultDiff[]
  telemetry?: RuntimeTelemetry
  errors: string[]
  startedAt: string
}

export class ResultIngestor {
  private buffers: Map<string, IngestionBuffer> = new Map()
  private artifactCollector: ArtifactCollector

  constructor(artifactCollector?: ArtifactCollector) {
    this.artifactCollector = artifactCollector || globalArtifactCollector
  }

  private getOrCreateBuffer(runId: string): IngestionBuffer {
    let buf = this.buffers.get(runId)
    if (!buf) {
      buf = {
        runId,
        outputDeltas: [],
        toolExecutions: [],
        diffs: [],
        errors: [],
        startedAt: new Date().toISOString()
      }
      this.buffers.set(runId, buf)
    }
    return buf
  }

  /**
   * Append an incremental text chunk from message.delta
   */
  public appendOutputDelta(runId: string, delta: string): void {
    if (!delta) return
    const buf = this.getOrCreateBuffer(runId)
    buf.outputDeltas.push(SecuritySanitizer.sanitizeText(delta))
  }

  /**
   * Set or override full output string
   */
  public setFullOutput(runId: string, output: string): void {
    if (!output) return
    const buf = this.getOrCreateBuffer(runId)
    buf.outputDeltas = [SecuritySanitizer.sanitizeText(output)]
  }

  /**
   * Record a tool execution event and extract any real artifacts/diffs
   */
  public recordToolExecution(
    runId: string,
    toolName: string,
    output?: string,
    diff?: string,
    success: boolean = true
  ): void {
    const buf = this.getOrCreateBuffer(runId)
    buf.toolExecutions.push({
      toolName,
      output: output ? SecuritySanitizer.sanitizeText(output) : undefined,
      diff: diff ? SecuritySanitizer.sanitizeText(diff) : undefined,
      success,
      timestamp: new Date().toISOString()
    })

    // Extract real artifacts if produced by this tool
    this.artifactCollector.extractFromToolResult(runId, toolName, output, diff)

    // Extract diff if present
    if (diff && diff.trim().length > 0) {
      const match = diff.match(/(?:---|\+\+\+)\s+[ab]?\/?([^\s\n]+)/)
      const filePath = match ? match[1] : 'modified-file'
      
      // Calculate additions/deletions
      const additions = (diff.match(/^\+[^+]/gm) || []).length
      const deletions = (diff.match(/^-[^-]/gm) || []).length

      buf.diffs.push({
        filePath,
        changeType: additions > 0 && deletions === 0 ? 'created' : 'modified',
        additions,
        deletions,
        diffContent: diff
      })
    }
  }

  /**
   * Record a structured file diff
   */
  public recordDiff(runId: string, diff: RunResultDiff): void {
    const buf = this.getOrCreateBuffer(runId)
    buf.diffs.push(diff)
  }

  /**
   * Update latest telemetry metrics
   */
  public setTelemetry(runId: string, telemetry: RuntimeTelemetry): void {
    const buf = this.getOrCreateBuffer(runId)
    buf.telemetry = telemetry
  }

  /**
   * Record a runtime error
   */
  public recordError(runId: string, error: string): void {
    const buf = this.getOrCreateBuffer(runId)
    buf.errors.push(SecuritySanitizer.sanitizeText(error))
  }

  /**
   * Synthesize final AgentRuntimeResult
   */
  public buildRuntimeResult(
    runId: string,
    status: 'Completed' | 'Failed' | 'Cancelled' = 'Completed',
    fallbackSummary?: string
  ): AgentRuntimeResult {
    const buf = this.buffers.get(runId)
    const combinedOutput = buf ? buf.outputDeltas.join('') : ''
    const artifactIds = this.artifactCollector.getArtifactIds(runId)
    const diffs = buf?.diffs || []

    const summary =
      fallbackSummary ||
      (combinedOutput.length > 0
        ? combinedOutput.split('\n')[0].replace(/^[#*-\s]+/, '').substring(0, 140)
        : `Execution finished with status ${status}.`)

    return {
      runId,
      status,
      summary,
      output: combinedOutput,
      artifactIds,
      diffs,
      verificationNotes: `Ingested ${buf?.toolExecutions.length || 0} tool executions, ${diffs.length} diffs, and ${artifactIds.length} artifacts.`,
      telemetry: buf?.telemetry,
      error: buf?.errors && buf.errors.length > 0 ? buf.errors.join('; ') : undefined
    }
  }

  /**
   * Teardown & clear buffer for a run
   */
  public clear(runId: string): void {
    this.buffers.delete(runId)
    this.artifactCollector.clear(runId)
  }
}

export const globalResultIngestor = new ResultIngestor()
