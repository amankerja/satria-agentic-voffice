import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CostEntry } from '../types'
import { MockCostLedgerRepository } from '../repositories'

export const useCostLedgerStore = defineStore('costLedger', () => {
  const repo = new MockCostLedgerRepository()
  const entries = ref<CostEntry[]>([])
  const loading = ref<boolean>(false)

  async function fetchEntries(workspaceId = 'ws-dev') {
    loading.value = true
    try {
      entries.value = await repo.getByWorkspace(workspaceId)
      return entries.value
    } finally {
      loading.value = false
    }
  }

  async function recordCost(data: Omit<CostEntry, 'id' | 'createdAt' | 'timestamp'>): Promise<CostEntry> {
    const created = await repo.create(data)
    entries.value.unshift(created)
    return created
  }

  const totalCostUsd = computed(() => {
    return entries.value.reduce((sum, e) => sum + (e.costUsd || 0), 0)
  })

  const totalInputTokens = computed(() => {
    return entries.value.reduce((sum, e) => sum + (e.inputTokens || 0), 0)
  })

  const totalOutputTokens = computed(() => {
    return entries.value.reduce((sum, e) => sum + (e.outputTokens || 0), 0)
  })

  const totalTokens = computed(() => {
    return entries.value.reduce((sum, e) => sum + (e.tokens || (e.inputTokens || 0) + (e.outputTokens || 0)), 0)
  })

  const costByProject = computed(() => {
    const map: Record<string, number> = {}
    for (const e of entries.value) {
      const key = e.projectId || 'Unassigned'
      map[key] = (map[key] || 0) + (e.costUsd || 0)
    }
    return map
  })

  const costByModel = computed(() => {
    const map: Record<string, number> = {}
    for (const e of entries.value) {
      const key = e.model || e.provider || 'default'
      map[key] = (map[key] || 0) + (e.costUsd || 0)
    }
    return map
  })

  return {
    entries,
    loading,
    totalCostUsd,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    costByProject,
    costByModel,
    fetchEntries,
    recordCost
  }
})
