import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SocialConnection, PlatformTarget } from '../types'
import { SocialConnectionRepository } from '../repositories'
import { useToast } from '../composables/useToast'
import { AuthorizationService } from '../services/AuthorizationService'

export const useSocialConnectionStore = defineStore('socialConnection', () => {
  const repo = new SocialConnectionRepository()
  const toast = useToast()

  const connections = ref<SocialConnection[]>([])
  const isLoading = ref(false)

  const activeConnections = computed(() => connections.value.filter((c) => c.status === 'Connected'))
  
  const byPlatform = computed(() => {
    const map = new Map<PlatformTarget, SocialConnection>()
    for (const c of connections.value) {
      if (c.status === 'Connected') {
        map.set(c.platform, c)
      }
    }
    return map
  })

  async function loadConnections() {
    isLoading.value = true
    try {
      connections.value = await repo.getAll()
    } catch (err: any) {
      toast.error('Gagal memuat koneksi media sosial: ' + (err.message || 'Error'))
    } finally {
      isLoading.value = false
    }
  }

  async function addConnection(data: Omit<SocialConnection, 'id' | 'connectedAt' | 'updatedAt'>) {
    AuthorizationService.assertPermission('social:connect')
    try {
      const created = await repo.create(data)
      connections.value.push(created)
      toast.success(`Akun ${created.accountName} berhasil dihubungkan!`)
      return created
    } catch (err: any) {
      toast.error('Gagal menghubungkan akun: ' + (err.message || 'Error'))
      throw err
    }
  }

  async function disconnect(id: string) {
    AuthorizationService.assertPermission('social:disconnect')
    try {
      await repo.update(id, { status: 'Revoked' })
      const found = connections.value.find((c) => c.id === id)
      if (found) found.status = 'Revoked'
      toast.info('Koneksi media sosial dinonaktifkan.')
    } catch (err: any) {
      toast.error('Gagal memutuskan koneksi: ' + (err.message || 'Error'))
    }
  }

  async function reconnect(id: string) {
    AuthorizationService.assertPermission('social:connect')
    try {
      await repo.update(id, {
        status: 'Connected',
        connectedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      })
      const found = connections.value.find((c) => c.id === id)
      if (found) {
        found.status = 'Connected'
        found.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      }
      toast.success('Koneksi media sosial berhasil diperbarui!')
    } catch (err: any) {
      toast.error('Gagal memperbarui koneksi: ' + (err.message || 'Error'))
    }
  }

  return {
    connections,
    isLoading,
    activeConnections,
    byPlatform,
    loadConnections,
    addConnection,
    disconnect,
    reconnect
  }
})
