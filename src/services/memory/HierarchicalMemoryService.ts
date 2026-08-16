import type {
  AgentMemoryItem,
  HierarchicalRecallContext,
  MemoryHierarchyTier,
  MemoryRecallQuery,
  MemoryType
} from '../../types'
import { MemoryRepository } from '../../repositories'

export class HierarchicalMemoryService {
  private static repo = new MemoryRepository()

  /**
   * Performs semantic hierarchical memory recall across 5 tiers:
   * RUN -> TASK -> PROJECT -> EMPLOYEE -> WORKSPACE
   */
  static async recallHierarchical(query: MemoryRecallQuery): Promise<HierarchicalRecallContext> {
    const allMemories = await this.repo.getByWorkspace(query.workspaceId)
    const {
      employeeId,
      projectId,
      taskId,
      runId,
      queryText = '',
      tags = [],
      types,
      tiers,
      limit = 10,
      minConfidence = 0.4,
      maxTokenBudget = 1500
    } = query

    const normalizedQueryTokens = queryText
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2)

    const normalizedTags = tags.map((t) => t.toLowerCase())

    // 1. Filter candidates per tier relevance
    const candidates = allMemories.filter((m) => {
      // Confidence check
      if (m.confidence < minConfidence) return false

      // Type filter
      if (types && types.length > 0 && !types.includes(m.type)) return false

      // Tier filter
      const itemTier = m.tier || this.inferTier(m)
      if (tiers && tiers.length > 0 && !tiers.includes(itemTier)) return false

      // Scope/Tier context matching
      switch (itemTier) {
        case 'RUN':
          if (runId && m.runId && m.runId !== runId) return false
          break
        case 'TASK':
          if (taskId && m.taskId && m.taskId !== taskId) return false
          break
        case 'PROJECT':
          if (projectId && m.projectId && m.projectId !== projectId) return false
          break
        case 'EMPLOYEE':
          if (employeeId && m.employeeId && m.employeeId !== employeeId) return false
          break
        case 'WORKSPACE':
          // Workspace level is accessible globally in this workspace
          break
      }

      return true
    })

    // 2. Score candidate relevance
    const scoredCandidates = candidates.map((m) => {
      const tier = m.tier || this.inferTier(m)
      let score = (m.importance || 3) * 2 + (m.confidence || 0.8) * 5

      // Tier multipliers (Employee & Project specific experiences are highly weighted)
      if (tier === 'EMPLOYEE') score *= 1.25
      else if (tier === 'PROJECT') score *= 1.15
      else if (tier === 'TASK') score *= 1.05
      else if (tier === 'WORKSPACE') score *= 1.0

      if (m.pinned) score += 10

      const memoryText = `${m.title} ${m.content}`.toLowerCase()
      const memoryTags = (m.tags || []).map((t) => t.toLowerCase())

      // Query token matches
      for (const token of normalizedQueryTokens) {
        if (m.title.toLowerCase().includes(token)) score += 6
        else if (memoryText.includes(token)) score += 3
      }

      // Tag matches
      for (const tag of normalizedTags) {
        if (memoryTags.includes(tag)) score += 4
      }

      // Recency & access count bonus
      if (m.accessCount && m.accessCount > 0) {
        score += Math.min(m.accessCount, 5) * 0.5
      }

      return {
        memory: {
          ...m,
          tier,
          relevanceScore: Math.round(score * 10) / 10
        },
        score
      }
    })

    // 3. Sort by score descending
    scoredCandidates.sort((a, b) => b.score - a.score)
    const selectedMemories = scoredCandidates.slice(0, limit).map((s) => s.memory)

    // 4. Update access stats asynchronously
    const now = new Date().toISOString()
    for (const mem of selectedMemories) {
      this.repo.update(mem.id, {
        accessCount: (mem.accessCount || 0) + 1,
        lastAccessedAt: now
      }).catch(() => {})
    }

    // 5. Categorize into 5 hierarchical buckets
    const workspaceKnowledge: AgentMemoryItem[] = []
    const employeeExperience: AgentMemoryItem[] = []
    const projectMemory: AgentMemoryItem[] = []
    const taskMemory: AgentMemoryItem[] = []
    const runMemory: AgentMemoryItem[] = []

    let estimatedTokens = 0

    for (const mem of selectedMemories) {
      const itemTokenEstimate = Math.ceil((mem.title.length + mem.content.length) / 4)
      if (estimatedTokens + itemTokenEstimate > maxTokenBudget && estimatedTokens > 300) {
        break // Stay within token budget
      }
      estimatedTokens += itemTokenEstimate

      switch (mem.tier) {
        case 'WORKSPACE':
          workspaceKnowledge.push(mem)
          break
        case 'EMPLOYEE':
          employeeExperience.push(mem)
          break
        case 'PROJECT':
          projectMemory.push(mem)
          break
        case 'TASK':
          taskMemory.push(mem)
          break
        case 'RUN':
          runMemory.push(mem)
          break
      }
    }

    // 6. Generate formatted prompt section
    const injectedPromptSection = this.formatPromptSection({
      workspaceKnowledge,
      employeeExperience,
      projectMemory,
      taskMemory,
      runMemory,
      totalItemsRecalled: workspaceKnowledge.length + employeeExperience.length + projectMemory.length + taskMemory.length + runMemory.length,
      totalTokenEstimate: estimatedTokens,
      injectedPromptSection: ''
    })

    return {
      workspaceKnowledge,
      employeeExperience,
      projectMemory,
      taskMemory,
      runMemory,
      totalItemsRecalled: workspaceKnowledge.length + employeeExperience.length + projectMemory.length + taskMemory.length + runMemory.length,
      totalTokenEstimate: estimatedTokens,
      injectedPromptSection
    }
  }

  /**
   * Helper to infer tier from legacy scope
   */
  static inferTier(item: Partial<AgentMemoryItem>): MemoryHierarchyTier {
    if (item.tier) return item.tier
    if (item.runId) return 'RUN'
    if (item.taskId) return 'TASK'
    if (item.scope === 'project' || item.projectId) return 'PROJECT'
    if (item.scope === 'employee' || item.employeeId) return 'EMPLOYEE'
    return 'WORKSPACE'
  }

  /**
   * Formats hierarchical memories into structured Markdown for LLM System Prompt injection
   */
  static formatPromptSection(context: HierarchicalRecallContext): string {
    const lines: string[] = []

    const hasAny =
      context.employeeExperience.length > 0 ||
      context.projectMemory.length > 0 ||
      context.workspaceKnowledge.length > 0 ||
      context.taskMemory.length > 0 ||
      context.runMemory.length > 0

    if (!hasAny) return ''

    lines.push('### 🧠 HIERARCHICAL AGENT MEMORY & ACCUMULATED EXPERIENCE')
    lines.push('Gunakan memori dan pelajaran dari eksekusi sebelumnya di bawah ini untuk menghindari kesalahan masa lalu dan mengikuti arsitektur baku:\n')

    if (context.employeeExperience.length > 0) {
      lines.push('#### 👤 Digital Employee Learned Patterns & Skills:')
      for (const m of context.employeeExperience) {
        lines.push(`- **[${m.title}]** (Keyakinan: ${Math.round(m.confidence * 100)}%): ${m.content}`)
      }
      lines.push('')
    }

    if (context.projectMemory.length > 0) {
      lines.push('#### 📁 Project Codebase & Architecture Conventions:')
      for (const m of context.projectMemory) {
        lines.push(`- **[${m.title}]**: ${m.content}`)
      }
      lines.push('')
    }

    if (context.taskMemory.length > 0) {
      lines.push('#### 📋 Task-Level History & Intermediate Findings:')
      for (const m of context.taskMemory) {
        lines.push(`- **[${m.title}]**: ${m.content}`)
      }
      lines.push('')
    }

    if (context.workspaceKnowledge.length > 0) {
      lines.push('#### 🏢 Workspace SOP & Organization Policies:')
      for (const m of context.workspaceKnowledge) {
        lines.push(`- **[${m.title}]**: ${m.content}`)
      }
      lines.push('')
    }

    if (context.runMemory.length > 0) {
      lines.push('#### ⚡ Active Run Scratchpad Trace:')
      for (const m of context.runMemory) {
        lines.push(`- **[${m.title}]**: ${m.content}`)
      }
      lines.push('')
    }

    return lines.join('\n').trim()
  }

  /**
   * Helper to quickly record a newly learned pattern for an employee
   */
  static async recordEmployeeLearning(params: {
    workspaceId: string
    employeeId: string
    employeeName: string
    title: string
    content: string
    tags?: string[]
    confidence?: number
    importance?: number
    type?: MemoryType
  }): Promise<AgentMemoryItem> {
    return await this.repo.create({
      workspaceId: params.workspaceId,
      tier: 'EMPLOYEE',
      scope: 'employee',
      employeeId: params.employeeId,
      employeeName: params.employeeName,
      type: params.type || 'procedural',
      title: params.title,
      content: params.content,
      tags: params.tags || ['experience', 'best_practice'],
      confidence: params.confidence ?? 0.9,
      importance: params.importance ?? 4,
      source: 'autonomous_run'
    })
  }
}
