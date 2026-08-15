import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ContentItem, Publication, MediaAsset, PlatformTarget, ContentStatus } from '../types'
import {
  ContentItemRepository,
  PublicationRepository,
  MediaAssetRepository,
  AuditLogRepository
} from '../repositories'
import { ContentQualityGate } from '../services/content/ContentQualityGate'
import { SocialConnectorFactory } from '../services/social/SocialConnectorFactory'
import { useSocialConnectionStore } from './socialConnection'
import { useToast } from '../composables/useToast'
import { AuthorizationService } from '../services/AuthorizationService'

export const useContentStore = defineStore('content', () => {
  const contentRepo = new ContentItemRepository()
  const pubRepo = new PublicationRepository()
  const mediaRepo = new MediaAssetRepository()
  const auditRepo = new AuditLogRepository()
  const toast = useToast()
  const socialStore = useSocialConnectionStore()

  const items = ref<ContentItem[]>([])
  const publications = ref<Publication[]>([])
  const mediaAssets = ref<MediaAsset[]>([])
  const isLoading = ref(false)

  // Filters
  const searchQuery = ref('')
  const filterProjectId = ref<string>('all')
  const filterStatus = ref<string>('all')
  const filterPlatform = ref<string>('all')
  const activeView = ref<'pipeline' | 'calendar' | 'media' | 'analytics'>('pipeline')

  // Computed & Filtered
  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      if (filterProjectId.value !== 'all' && item.projectId !== filterProjectId.value) return false
      if (filterStatus.value !== 'all' && item.status !== filterStatus.value) return false
      if (filterPlatform.value !== 'all' && !item.targetPlatforms.includes(filterPlatform.value as PlatformTarget)) return false
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(q)
        const matchCaption = (item.caption || '').toLowerCase().includes(q)
        if (!matchTitle && !matchCaption) return false
      }
      return true
    })
  })

  const kanbanColumns = computed(() => {
    return {
      draft: filteredItems.value.filter((i) => i.status === 'Draft'),
      review: filteredItems.value.filter((i) => i.status === 'Review'),
      approved: filteredItems.value.filter((i) => i.status === 'Approved'),
      scheduled: filteredItems.value.filter((i) => i.status === 'Scheduled'),
      published: filteredItems.value.filter((i) => i.status === 'Published'),
      failed: filteredItems.value.filter((i) => i.status === 'Failed')
    }
  })

  const counts = computed(() => ({
    total: items.value.length,
    draft: items.value.filter((i) => i.status === 'Draft').length,
    review: items.value.filter((i) => i.status === 'Review').length,
    approved: items.value.filter((i) => i.status === 'Approved').length,
    scheduled: items.value.filter((i) => i.status === 'Scheduled').length,
    published: items.value.filter((i) => i.status === 'Published').length
  }))

  async function loadAll() {
    isLoading.value = true
    try {
      await Promise.all([
        socialStore.loadConnections(),
        (async () => (items.value = await contentRepo.getAll()))(),
        (async () => (publications.value = await pubRepo.getAll()))(),
        (async () => (mediaAssets.value = await mediaRepo.getAll()))()
      ])
    } catch (err: any) {
      toast.error('Gagal memuat data konten: ' + (err.message || 'Error'))
    } finally {
      isLoading.value = false
    }
  }

  function getPublicationsForContent(contentId: string): Publication[] {
    return publications.value.filter((p) => p.contentItemId === contentId)
  }

  async function createContent(payload: {
    projectId: string
    projectName?: string
    title: string
    caption?: string
    mediaAssetIds?: string[]
    targetPlatforms: PlatformTarget[]
    status?: ContentStatus
    approvalPolicy?: 'Auto' | 'Review' | 'Strict'
    platformVersions?: ContentItem['platformVersions']
    createdBy?: string
    creatorName?: string
    dataReviewId?: string
  }) {
    AuthorizationService.assertPermission('content:create')

    const qualityChecks = ContentQualityGate.evaluate(payload, mediaAssets.value)
    const initialStatus = payload.status || (payload.approvalPolicy === 'Auto' ? 'Approved' : 'Review')

    const created = await contentRepo.create({
      ...payload,
      mediaAssetIds: payload.mediaAssetIds || [],
      status: initialStatus,
      approvalRequired: payload.approvalPolicy !== 'Auto',
      approvalPolicy: payload.approvalPolicy || 'Review',
      qualityChecks,
      createdBy: payload.createdBy || 'usr-satria',
      creatorName: payload.creatorName || 'Satria Utama'
    })

    // Create child publications for each target platform
    for (const platform of created.targetPlatforms) {
      const conn = socialStore.byPlatform.get(platform)
      const pub = await pubRepo.create({
        contentItemId: created.id,
        contentTitle: created.title,
        platform,
        connectionId: conn?.id,
        status: initialStatus === 'Approved' ? 'Approved' : 'Pending',
        idempotencyKey: `${created.id}:${platform}:v1`
      })
      publications.value.push(pub)
    }

    items.value.unshift(created)

    await auditRepo.log({
      actor: created.creatorName || 'Satria',
      entity: 'Task',
      entityId: created.id,
      action: 'Content Created',
      reason: `Konten "${created.title}" dibuat dengan status ${created.status}.`
    })

    toast.success(`Konten "${created.title}" berhasil dibuat!`)
    return created
  }

  async function updateContent(id: string, updates: Partial<ContentItem>) {
    AuthorizationService.assertPermission('content:edit')
    const existing = items.value.find((i) => i.id === id)
    if (!existing) return undefined

    const merged = { ...existing, ...updates }
    const qualityChecks = ContentQualityGate.evaluate(merged, mediaAssets.value)

    const updated = await contentRepo.update(id, {
      ...updates,
      qualityChecks
    })

    if (updated) {
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated
      toast.success('Konten berhasil diperbarui.')
    }
    return updated
  }

  async function approveContent(id: string, reviewer = 'Satria Utama (Lead)') {
    AuthorizationService.assertPermission('content:approve')
    const content = items.value.find((i) => i.id === id)
    if (!content) return

    const updated = await contentRepo.approve(id, reviewer, (content.version || 1) + 1)
    if (updated) {
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated

      // Update child publications to Approved
      const childPubs = publications.value.filter((p) => p.contentItemId === id)
      for (const p of childPubs) {
        if (p.status === 'Pending') {
          await pubRepo.updateStatus(p.id, 'Approved')
          p.status = 'Approved'
        }
      }

      await auditRepo.log({
        actor: reviewer,
        entity: 'Task',
        entityId: id,
        action: 'Content Approved',
        reason: `Konten "${content.title}" disetujui untuk publikasi.`
      })

      toast.success(`Konten "${content.title}" disetujui!`)
    }
  }

  async function rejectContent(id: string, reason: string) {
    AuthorizationService.assertPermission('content:approve')
    const content = items.value.find((i) => i.id === id)
    if (!content) return

    const updated = await contentRepo.reject(id, reason)
    if (updated) {
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated

      toast.warning(`Konten ditolak & dikembalikan ke Draft: ${reason}`)
    }
  }

  async function scheduleContent(id: string, scheduledAt: string) {
    AuthorizationService.assertPermission('content:publish')
    const content = items.value.find((i) => i.id === id)
    if (!content) return

    const updated = await contentRepo.schedule(id, scheduledAt)
    if (updated) {
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated

      // Update child publications to Scheduled
      const childPubs = publications.value.filter((p) => p.contentItemId === id)
      for (const p of childPubs) {
        await pubRepo.updateStatus(p.id, 'Scheduled', { externalUrl: undefined })
        p.status = 'Scheduled'
        p.scheduledAt = scheduledAt
      }

      toast.success(`Konten dijadwalkan tayang pada ${new Date(scheduledAt).toLocaleString('id-ID')}`)
    }
  }

  async function publishPublication(pubId: string): Promise<any> {
    AuthorizationService.assertPermission('content:publish')
    const pub = publications.value.find((p) => p.id === pubId)
    if (!pub) throw new Error('Publikasi tidak ditemukan')

    const content = items.value.find((i) => i.id === pub.contentItemId)
    if (!content) throw new Error('Konten induk tidak ditemukan')

    // Idempotency check: Don't publish already Published publication
    if (pub.status === 'Published' || pub.status === 'Publishing') {
      toast.info(`Publikasi ${pub.platform} sudah dalam status ${pub.status}.`)
      return { success: true, externalUrl: pub.externalUrl }
    }

    const conn = socialStore.connections.find((c) => c.id === pub.connectionId || c.platform === pub.platform)
    if (!conn) {
      const err = `Akun ${pub.platform} belum terhubung di pengaturan Social Connections.`
      await pubRepo.updateStatus(pub.id, 'Failed', { error: err })
      pub.status = 'Failed'
      pub.error = err
      toast.error(err)
      return { success: false, error: err }
    }

    // Set Publishing
    await pubRepo.updateStatus(pub.id, 'Publishing')
    pub.status = 'Publishing'

    try {
      const connector = SocialConnectorFactory.get(pub.platform)
      const media = mediaAssets.value.filter((m) => content.mediaAssetIds.includes(m.id))
      const result = await connector.publish({
        content,
        publication: pub,
        connection: conn,
        mediaAssets: media
      })

      if (result.success) {
        const finalStatus = result.isAssisted ? 'Assisted' : 'Published'
        await pubRepo.updateStatus(pub.id, finalStatus, {
          externalId: result.externalId,
          externalUrl: result.externalUrl
        })
        pub.status = finalStatus
        pub.externalId = result.externalId
        pub.externalUrl = result.externalUrl

        // If all publications of this content are published/assisted, update parent ContentItem status
        const allPubs = publications.value.filter((p) => p.contentItemId === content.id)
        const allDone = allPubs.every((p) => p.status === 'Published' || p.status === 'Assisted')
        if (allDone) {
          await contentRepo.update(content.id, {
            status: 'Published',
            publishedAt: new Date().toISOString()
          })
          content.status = 'Published'
          content.publishedAt = new Date().toISOString()
        }

        toast.success(`Publikasi ke ${pub.platform} berhasil!`)
        return result
      } else {
        await pubRepo.updateStatus(pub.id, 'Failed', { error: result.error })
        pub.status = 'Failed'
        pub.error = result.error
        toast.error(`Gagal publikasi ke ${pub.platform}: ${result.error}`)
        return result
      }
    } catch (err: any) {
      await pubRepo.updateStatus(pub.id, 'Failed', { error: err.message })
      pub.status = 'Failed'
      pub.error = err.message
      toast.error(`Error: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  async function publishContentNow(contentId: string) {
    const childPubs = publications.value.filter((p) => p.contentItemId === contentId)
    if (childPubs.length === 0) {
      toast.warning('Tidak ada platform tujuan publikasi.')
      return
    }

    let successCount = 0
    for (const pub of childPubs) {
      const res = await publishPublication(pub.id)
      if (res && res.success) successCount++
    }
    toast.info(`${successCount} dari ${childPubs.length} publikasi selesai diproses.`)
  }

  async function deleteContent(id: string) {
    AuthorizationService.assertPermission('content:delete')
    const content = items.value.find((i) => i.id === id)
    const title = content?.title || id

    await contentRepo.delete(id)
    items.value = items.value.filter((i) => i.id !== id)
    publications.value = publications.value.filter((p) => p.contentItemId !== id)

    await auditRepo.log({
      actor: 'Satria Utama',
      entity: 'Task',
      entityId: id,
      action: 'Content Deleted',
      reason: `Konten "${title}" dihapus.`
    })

    toast.info(`Konten "${title}" berhasil dihapus.`)
  }

  return {
    items,
    publications,
    mediaAssets,
    isLoading,
    searchQuery,
    filterProjectId,
    filterStatus,
    filterPlatform,
    activeView,
    filteredItems,
    kanbanColumns,
    counts,
    loadAll,
    getPublicationsForContent,
    createContent,
    updateContent,
    approveContent,
    rejectContent,
    scheduleContent,
    publishPublication,
    publishContentNow,
    deleteContent
  }
})
