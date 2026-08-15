import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ContentQualityGate } from '../services/content/ContentQualityGate'
import { SocialConnectorFactory } from '../services/social/SocialConnectorFactory'
import { useContentStore } from '../stores/content'
import { useSocialConnectionStore } from '../stores/socialConnection'
import { useDataReviewStore } from '../stores/dataReview'

describe('Phase 6 — Content, Data Analysis & Social Automation Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('ContentQualityGate Engine', () => {
    it('passes clean compliant content with high score', () => {
      const result = ContentQualityGate.evaluate({
        title: '5 Tips Mengelola Stok Retail dengan AI',
        caption: 'Panduan komprehensif mengelola stok retail agar terhindar dari dead stock dan kebocoran dana kas.'
      })

      expect(result.brandCompliance).toBe(true)
      expect(result.grammarQuality).toBe(true)
      expect(result.noSensitiveContent).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(90)
    })

    it('detects prohibited sensitive content and penalizes score', () => {
      const result = ContentQualityGate.evaluate({
        title: 'Skema cepat kaya dengan trading otomatis',
        caption: 'Garansi 100% kaya dalam semalam tanpa kerja keras dan pasti untung tanpa risiko sama sekali.'
      })

      expect(result.noSensitiveContent).toBe(false)
      expect(result.score).toBeLessThan(70)
      expect(result.notes?.some((n) => n.includes('berisiko'))).toBe(true)
    })

    it('validates URLs and flags invalid links', () => {
      const result = ContentQualityGate.evaluate({
        title: 'Panduan Bisnis Retail 2026',
        caption: 'Buka link https://satria.workforce.ai untuk membaca laporan dan panduan lengkap.'
      })

      expect(result.linksValid).toBe(true)
    })
  })

  describe('Social Connectors & Idempotency', () => {
    it('resolves connectors for all 5 platforms', () => {
      expect(SocialConnectorFactory.get('instagram').platform).toBe('instagram')
      expect(SocialConnectorFactory.get('threads').platform).toBe('threads')
      expect(SocialConnectorFactory.get('tiktok').platform).toBe('tiktok')
      expect(SocialConnectorFactory.get('facebook_page').platform).toBe('facebook_page')
      expect(SocialConnectorFactory.get('facebook_group').platform).toBe('facebook_group')
    })

    it('validates Instagram caption length limit', () => {
      const ig = SocialConnectorFactory.get('instagram')
      const longText = 'A'.repeat(2500)
      const validation = ig.validatePayload({
        content: {
          id: 'cnt-test',
          projectId: 'prj-test',
          title: 'Test',
          caption: longText,
          mediaAssetIds: [],
          targetPlatforms: ['instagram'],
          status: 'Draft',
          approvalRequired: true,
          approvalPolicy: 'Review',
          version: 1,
          createdBy: 'user',
          createdAt: '',
          updatedAt: ''
        },
        publication: {
          id: 'pub-test',
          contentItemId: 'cnt-test',
          platform: 'instagram',
          status: 'Pending',
          idempotencyKey: 'cnt-test:instagram:v1',
          attemptCount: 0,
          createdAt: '',
          updatedAt: ''
        },
        connection: {
          id: 'conn-test',
          platform: 'instagram',
          accountName: 'Test',
          status: 'Connected',
          credentialReference: 'token',
          connectedAt: '',
          updatedAt: ''
        }
      })

      expect(validation.valid).toBe(false)
      expect(validation.errors[0]).toContain('2200')
    })
  })

  describe('Content Store & Approval Lifecycle', () => {
    it('creates content and automatically sets up platform publications', async () => {
      const contentStore = useContentStore()
      await contentStore.loadAll()

      const created = await contentStore.createContent({
        projectId: 'prj-marketing',
        title: 'Automasi Laporan Mingguan 2026',
        caption: 'Gunakan AI Agent untuk merangkum seluruh metrik bisnis mingguan secara instan dan akurat.',
        targetPlatforms: ['instagram', 'tiktok'],
        approvalPolicy: 'Review'
      })

      expect(created.id).toBeDefined()
      expect(created.status).toBe('Review')

      const childPubs = contentStore.getPublicationsForContent(created.id)
      expect(childPubs.length).toBe(2)
      expect(childPubs.map((p) => p.platform)).toEqual(['instagram', 'tiktok'])
    })

    it('approves content and updates child publications to Approved', async () => {
      const contentStore = useContentStore()
      await contentStore.loadAll()

      const created = await contentStore.createContent({
        projectId: 'prj-marketing',
        title: 'Review Candidate Content',
        caption: 'Deskripsi konten yang menunggu persetujuan lead reviewer sebelum dipublikasikan.',
        targetPlatforms: ['instagram'],
        approvalPolicy: 'Review'
      })

      await contentStore.approveContent(created.id, 'Satria Utama (Lead)')

      const updated = contentStore.items.find((i) => i.id === created.id)
      expect(updated?.status).toBe('Approved')
      expect(updated?.approvedBy).toBe('Satria Utama (Lead)')

      const childPubs = contentStore.getPublicationsForContent(created.id)
      expect(childPubs[0].status).toBe('Approved')
    })

    it('schedules content and updates publication scheduled status', async () => {
      const contentStore = useContentStore()
      await contentStore.loadAll()

      const created = await contentStore.createContent({
        projectId: 'prj-marketing',
        title: 'Scheduled Campaign Promo',
        caption: 'Materi promosi bulanan yang dijadwalkan tayang pada waktu peak engagement.',
        targetPlatforms: ['instagram'],
        approvalPolicy: 'Review'
      })

      const targetDate = '2026-08-25T10:00:00Z'
      await contentStore.scheduleContent(created.id, targetDate)

      const updated = contentStore.items.find((i) => i.id === created.id)
      expect(updated?.status).toBe('Scheduled')
      expect(updated?.scheduledAt).toBe(targetDate)
    })
  })

  describe('Data Review & Content Pipeline Conversion', () => {
    it('converts data review findings into social content item', async () => {
      const dataReviewStore = useDataReviewStore()
      const contentStore = useContentStore()

      await Promise.all([
        dataReviewStore.loadReviews(),
        contentStore.loadAll()
      ])

      const review = dataReviewStore.reviews[0]
      expect(review).toBeDefined()

      const generatedContent = await dataReviewStore.generateContentFromReview(review.id)
      expect(generatedContent).toBeDefined()
      expect(generatedContent.title).toContain(review.title)
      expect(generatedContent.dataReviewId).toBe(review.id)

      const linkedReview = await dataReviewStore.getReviewById(review.id)
      expect(linkedReview?.generatedContentId).toBe(generatedContent.id)
    })
  })

  describe('Social Connections Management', () => {
    it('loads active connections and reconnects expired accounts', async () => {
      const socialStore = useSocialConnectionStore()
      await socialStore.loadConnections()

      expect(socialStore.connections.length).toBeGreaterThanOrEqual(4)
      const igConn = socialStore.connections.find((c) => c.platform === 'instagram')
      expect(igConn?.status).toBe('Connected')

      await socialStore.disconnect(igConn!.id)
      expect(igConn?.status).toBe('Revoked')

      await socialStore.reconnect(igConn!.id)
      expect(igConn?.status).toBe('Connected')
    })
  })
})
