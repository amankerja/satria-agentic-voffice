import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AgentMemoryItem, MemoryRecallQuery, MemoryScope, MemoryType, AgentRun } from '../types'
import { MockMemoryRepository } from '../repositories'

export const useMemoryStore = defineStore('memory', () => {
  const repo = new MockMemoryRepository()
  const memories = ref<AgentMemoryItem[]>([])
  const loading = ref<boolean>(false)
  const selectedScope = ref<MemoryScope | 'All'>('All')
  const selectedType = ref<MemoryType | 'All'>('All')
  const searchQuery = ref<string>('')

  const filteredMemories = computed(() => {
    return memories.value.filter((m) => {
      const matchScope = selectedScope.value === 'All' || m.scope === selectedScope.value
      const matchType = selectedType.value === 'All' || m.type === selectedType.value
      const q = searchQuery.value.trim().toLowerCase()
      const matchSearch =
        q === '' ||
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        (m.employeeName && m.employeeName.toLowerCase().includes(q)) ||
        (m.projectName && m.projectName.toLowerCase().includes(q))

      return matchScope && matchType && matchSearch
    })
  })

  function getMemoriesByEmployee(employeeId: string): AgentMemoryItem[] {
    return memories.value.filter((m) => m.employeeId === employeeId || m.scope === 'global')
  }

  function getMemoriesByProject(projectId: string): AgentMemoryItem[] {
    return memories.value.filter((m) => m.projectId === projectId || m.scope === 'global')
  }

  async function fetchMemories(workspaceId: string = 'ws-dev') {
    loading.value = true
    try {
      memories.value = await repo.getByWorkspace(workspaceId)
      return memories.value
    } finally {
      loading.value = false
    }
  }

  async function fetchMemoriesByEmployee(employeeId: string) {
    loading.value = true
    try {
      const list = await repo.getByEmployee(employeeId)
      // Merge or update local memories
      for (const item of list) {
        if (!memories.value.some((m) => m.id === item.id)) {
          memories.value.push(item)
        }
      }
      return list
    } finally {
      loading.value = false
    }
  }

  async function recallMemories(query: MemoryRecallQuery): Promise<AgentMemoryItem[]> {
    return await repo.recall(query)
  }

  async function createMemory(
    item: Omit<AgentMemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'accessCount'>
  ): Promise<AgentMemoryItem> {
    const created = await repo.create(item)
    memories.value.unshift(created)
    return created
  }

  async function updateMemory(
    id: string,
    updates: Partial<AgentMemoryItem>
  ): Promise<AgentMemoryItem | undefined> {
    const updated = await repo.update(id, updates)
    if (updated) {
      const idx = memories.value.findIndex((m) => m.id === id)
      if (idx !== -1) {
        memories.value[idx] = updated
      }
    }
    return updated
  }

  async function deleteMemory(id: string): Promise<boolean> {
    const success = await repo.delete(id)
    if (success) {
      memories.value = memories.value.filter((m) => m.id !== id)
    }
    return success
  }

  /**
   * Autonomous memory synthesis: extracts operational lessons from a completed or failed execution run
   */
  async function learnFromExecution(
    run: AgentRun,
    status: 'Completed' | 'Failed' | 'Blocked',
    notes?: string
  ): Promise<AgentMemoryItem> {
    const isSuccess = status === 'Completed'
    const memoryType: MemoryType = isSuccess ? 'episodic' : 'feedback'
    const title = isSuccess
      ? `Execution Success Pattern: ${run.taskTitle}`
      : `Execution Failure Diagnostic: ${run.taskTitle}`

    const content = isSuccess
      ? `Agent completed "${run.taskTitle}" in ${run.durationSeconds || 1}s (Attempt #${run.attempt}). Notes: ${notes || run.outputSummary || 'Verified by automated quality gates.'}`
      : `Agent execution failed on attempt #${run.attempt}: ${notes || run.error || 'Check runtime telemetry and tool sandboxing rules.'}`

    const tags = isSuccess
      ? ['autonomous_success', 'pattern', run.employeeRole.toLowerCase().replace(/\s+/g, '_')]
      : ['execution_error', 'retry_diagnostic', 'failure_avoidance']

    return await createMemory({
      workspaceId: 'ws-dev',
      employeeId: run.employeeId,
      employeeName: run.employeeName,
      runId: run.id,
      type: memoryType,
      scope: 'employee',
      title,
      content,
      tags,
      confidence: isSuccess ? 0.95 : 0.9,
      importance: isSuccess ? 3 : 5,
      source: 'autonomous_run'
    })
  }

  return {
    memories,
    loading,
    selectedScope,
    selectedType,
    searchQuery,
    filteredMemories,
    getMemoriesByEmployee,
    getMemoriesByProject,
    fetchMemories,
    fetchMemoriesByEmployee,
    recallMemories,
    createMemory,
    updateMemory,
    deleteMemory,
    learnFromExecution
  }
})
