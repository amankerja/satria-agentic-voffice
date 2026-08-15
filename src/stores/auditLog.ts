import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuditLogEntry } from '../types'
import { MockAuditLogRepository } from '../repositories'

export const useAuditLogStore = defineStore('auditLog', () => {
  const repo = new MockAuditLogRepository()
  const logs = ref<AuditLogEntry[]>([])
  const loading = ref<boolean>(false)

  const selectedEntity = ref<string>('all')
  const searchQuery = ref<string>('')

  const filteredLogs = computed(() => {
    return logs.value.filter((l) => {
      const matchEntity = selectedEntity.value === 'all' || l.entity === selectedEntity.value
      const query = searchQuery.value.toLowerCase().trim()
      const matchSearch =
        !query ||
        l.action.toLowerCase().includes(query) ||
        l.actor.toLowerCase().includes(query) ||
        l.entityId.toLowerCase().includes(query) ||
        (l.reason && l.reason.toLowerCase().includes(query))
      return matchEntity && matchSearch
    })
  })

  async function fetchLogs() {
    loading.value = true
    try {
      logs.value = await repo.getAll()
      return logs.value
    } finally {
      loading.value = false
    }
  }

  async function logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const created = await repo.log(entry)
    logs.value.unshift(created)
    return created
  }

  return {
    logs,
    loading,
    selectedEntity,
    searchQuery,
    filteredLogs,
    fetchLogs,
    logAction
  }
})
