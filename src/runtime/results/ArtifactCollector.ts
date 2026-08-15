export interface CollectedArtifact {
  id: string
  name: string
  type: 'file' | 'code' | 'document' | 'patch' | 'report'
  path?: string
  content?: string
  sizeBytes?: number
  createdAt: string
}

export class ArtifactCollector {
  private artifacts: Map<string, CollectedArtifact[]> = new Map()

  /**
   * Ingest an artifact discovered from tool execution or runtime result
   */
  public registerArtifact(runId: string, artifact: Omit<CollectedArtifact, 'id' | 'createdAt'>): CollectedArtifact {
    const list = this.artifacts.get(runId) || []
    const newArtifact: CollectedArtifact = {
      ...artifact,
      id: `art-${runId}-${list.length + 1}`,
      createdAt: new Date().toISOString()
    }
    list.push(newArtifact)
    this.artifacts.set(runId, list)
    return newArtifact
  }

  /**
   * Extract artifacts from tool result output or modified files
   */
  public extractFromToolResult(runId: string, toolName: string, output?: string, diff?: string): CollectedArtifact[] {
    const extracted: CollectedArtifact[] = []

    if (diff && diff.trim().length > 0) {
      const match = diff.match(/(?:---|\+\+\+)\s+[ab]?\/?([^\s\n]+)/)
      const fileName = match ? match[1] : `diff-${Date.now()}.patch`
      
      const artifact = this.registerArtifact(runId, {
        name: fileName,
        type: 'patch',
        content: diff,
        path: fileName,
        sizeBytes: diff.length
      })
      extracted.push(artifact)
    }

    if (output && (toolName.includes('write') || toolName.includes('create') || toolName.includes('generate'))) {
      const matchUri = output.match(/file:\/\/\/(.+?\.[a-zA-Z0-9]+)/i)
      const matchPath = output.match(/(?:file|saved to|created at|written to)\s+([^\n()]+?\.[a-zA-Z0-9]+)/i)
      
      const rawPath = matchUri ? matchUri[1] : matchPath ? matchPath[1].trim() : null
      if (rawPath) {
        const cleanPath = rawPath.replace(/^file:\/\/\/?/, '')
        const fileName = cleanPath.split(/[\\/]/).pop() || 'generated-file'
        const artifact = this.registerArtifact(runId, {
          name: fileName,
          type: 'file',
          path: cleanPath,
          content: output,
          sizeBytes: output.length
        })
        extracted.push(artifact)
      }
    }

    return extracted
  }

  /**
   * Get all collected artifacts for a run
   */
  public getArtifacts(runId: string): CollectedArtifact[] {
    return this.artifacts.get(runId) || []
  }

  /**
   * Get list of artifact IDs (empty if none exist)
   */
  public getArtifactIds(runId: string): string[] {
    const list = this.artifacts.get(runId) || []
    return list.map((a) => a.id)
  }

  /**
   * Teardown & clean artifacts for a run
   */
  public clear(runId: string): void {
    this.artifacts.delete(runId)
  }
}

export const globalArtifactCollector = new ArtifactCollector()
