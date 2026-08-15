import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  IntegrationProvider,
  IntegrationConnection,
  ToolPermission,
  ToolExecution,
  IntegrationApprovalRequest,
  IntegrationAuditEvent,
  IntegrationProviderType
} from '../types'
import {
  IntegrationConnectionRepository,
  ToolPermissionRepository,
  ToolExecutionRepository,
  IntegrationApprovalRepository,
  IntegrationAuditRepository
} from '../repositories'
import { UniversalToolRouter } from '../services/integrations/UniversalToolRouter'
import { useToast } from '../composables/useToast'
import { initialIntegrationProviders } from '../database/initialSeed'

export const useIntegrationStore = defineStore('integration', () => {
  const connRepo = new IntegrationConnectionRepository()
  const permRepo = new ToolPermissionRepository()
  const execRepo = new ToolExecutionRepository()
  const apprRepo = new IntegrationApprovalRepository()
  const auditRepo = new IntegrationAuditRepository()
  const toast = useToast()

  const providers = ref<IntegrationProvider[]>(initialIntegrationProviders)
  const connections = ref<IntegrationConnection[]>([])
  const permissions = ref<ToolPermission[]>([])
  const executions = ref<ToolExecution[]>([])
  const approvals = ref<IntegrationApprovalRequest[]>([])
  const auditEvents = ref<IntegrationAuditEvent[]>([])

  const isLoading = ref(false)
  const isTesting = ref(false)

  const connectedCount = computed(() => connections.value.filter((c) => c.status === 'Connected').length)
  const pendingApprovalsCount = computed(() => approvals.value.filter((a) => a.status === 'PENDING').length)

  async function loadAll() {
    isLoading.value = true
    try {
      const [cList, pList, eList, aList, audList] = await Promise.all([
        connRepo.getAll(),
        permRepo.getAll(),
        execRepo.getAll(),
        apprRepo.getAll(),
        auditRepo.getAll()
      ])
      connections.value = cList
      permissions.value = pList
      executions.value = eList
      approvals.value = aList
      auditEvents.value = audList
    } catch (err: any) {
      toast.error('Gagal memuat data integrasi: ' + (err.message || 'Error'))
    } finally {
      isLoading.value = false
    }
  }

  function getConnectionByProvider(providerId: IntegrationProviderType): IntegrationConnection | undefined {
    return connections.value.find((c) => c.providerId === providerId)
  }

  async function addConnection(data: Omit<IntegrationConnection, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const created = await connRepo.create(data)
      connections.value.unshift(created)
      toast.success(`Koneksi ${created.displayName} berhasil ditambahkan!`)
      return created
    } catch (err: any) {
      toast.error('Gagal menambahkan koneksi: ' + err.message)
      throw err
    }
  }

  async function updateConnection(id: string, updates: Partial<IntegrationConnection>) {
    try {
      const updated = await connRepo.update(id, updates)
      if (updated) {
        const idx = connections.value.findIndex((c) => c.id === id)
        if (idx !== -1) connections.value[idx] = updated
        toast.success(`Koneksi ${updated.displayName} berhasil diperbarui.`)
      }
      return updated
    } catch (err: any) {
      toast.error('Gagal memperbarui koneksi: ' + err.message)
      throw err
    }
  }

  async function disconnectConnection(id: string) {
    try {
      await connRepo.update(id, { status: 'Disconnected' })
      const conn = connections.value.find((c) => c.id === id)
      if (conn) conn.status = 'Disconnected'
      toast.info('Koneksi integrasi diputuskan.')
    } catch (err: any) {
      toast.error('Gagal memutuskan koneksi: ' + err.message)
    }
  }

  async function testConnectionHealth(connectionId: string) {
    isTesting.value = true
    const conn = connections.value.find((c) => c.id === connectionId)
    if (!conn) {
      isTesting.value = false
      return { healthy: false, status: 'Error', message: 'Koneksi tidak ditemukan' }
    }

    try {
      const adapter = UniversalToolRouter.getAdapter(conn.providerId)
      const health = await adapter.validateConnection(conn)

      conn.status = health.status
      conn.lastValidatedAt = health.validatedAt
      await connRepo.update(conn.id, {
        status: health.status,
        lastValidatedAt: health.validatedAt
      })

      if (health.healthy) {
        toast.success(`Tes koneksi ${conn.displayName} berhasil! (${health.latencyMs}ms)`)
      } else {
        toast.warning(`Peringatan: ${health.message}`)
      }

      return health
    } catch (err: any) {
      toast.error('Tes koneksi gagal: ' + err.message)
      return { healthy: false, status: 'Error', message: err.message }
    } finally {
      isTesting.value = false
    }
  }

  async function approveRequest(approvalId: string, reviewer = 'Owner') {
    try {
      const resolved = await apprRepo.resolve(approvalId, 'APPROVED', reviewer)
      if (resolved) {
        const idx = approvals.value.findIndex((a) => a.id === approvalId)
        if (idx !== -1) approvals.value[idx] = resolved
        toast.success(`Otorisasi ${resolved.requestedAction} disetujui!`)
      }
      return resolved
    } catch (err: any) {
      toast.error('Gagal menyetujui request: ' + err.message)
      throw err
    }
  }

  async function rejectRequest(approvalId: string, reviewer = 'Owner') {
    try {
      const resolved = await apprRepo.resolve(approvalId, 'REJECTED', reviewer)
      if (resolved) {
        const idx = approvals.value.findIndex((a) => a.id === approvalId)
        if (idx !== -1) approvals.value[idx] = resolved
        toast.info(`Request ${resolved.requestedAction} ditolak.`)
      }
      return resolved
    } catch (err: any) {
      toast.error('Gagal menolak request: ' + err.message)
      throw err
    }
  }

  async function updatePermission(id: string, updates: Partial<ToolPermission>) {
    try {
      const updated = await permRepo.update(id, updates)
      if (updated) {
        const idx = permissions.value.findIndex((p) => p.id === id)
        if (idx !== -1) permissions.value[idx] = updated
        toast.success('Kebijakan izin tool berhasil diperbarui.')
      }
      return updated
    } catch (err: any) {
      toast.error('Gagal mengupdate permission: ' + err.message)
      throw err
    }
  }

  return {
    providers,
    connections,
    permissions,
    executions,
    approvals,
    auditEvents,
    isLoading,
    isTesting,
    connectedCount,
    pendingApprovalsCount,
    loadAll,
    getConnectionByProvider,
    addConnection,
    updateConnection,
    disconnectConnection,
    testConnectionHealth,
    approveRequest,
    rejectRequest,
    updatePermission
  }
})
