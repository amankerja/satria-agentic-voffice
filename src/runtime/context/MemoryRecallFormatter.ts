import type { AgentMemoryItem } from '../../types'

export class MemoryRecallFormatter {
  /**
   * Formats recalled memories into structured sections for injection into the Agent system prompt.
   */
  static format(memories: AgentMemoryItem[] = []): string {
    if (!memories || memories.length === 0) {
      return '- No historical memories or specific past feedback found for this task context.'
    }

    return memories
      .map((m, idx) => {
        const scopeBadge = m.scope.toUpperCase()
        const typeBadge = m.type.toUpperCase()
        const confPct = Math.round(m.confidence * 100)
        const tagsStr = m.tags && m.tags.length > 0 ? `[Tags: ${m.tags.join(', ')}]` : ''

        return `[MEMORY #${idx + 1} | Scope: ${scopeBadge} | Type: ${typeBadge} | Confidence: ${confPct}%] ${tagsStr}
Title: ${m.title}
Directive/Lesson:
${m.content}`
      })
      .join('\n\n')
  }
}
