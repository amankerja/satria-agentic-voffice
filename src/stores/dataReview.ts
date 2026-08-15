import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataReview } from '../types'
import { DataReviewRepository } from '../repositories'
import { useContentStore } from './content'
import { useToast } from '../composables/useToast'
import { AuthorizationService } from '../services/AuthorizationService'

export const useDataReviewStore = defineStore('dataReview', () => {
  const repo = new DataReviewRepository()
  const contentStore = useContentStore()
  const toast = useToast()

  const reviews = ref<DataReview[]>([])
  const isLoading = ref(false)
  const selectedProjectId = ref<string>('all')

  const filteredReviews = computed(() => {
    if (selectedProjectId.value === 'all') return reviews.value
    return reviews.value.filter((r) => r.projectId === selectedProjectId.value)
  })

  async function loadReviews() {
    isLoading.value = true
    try {
      reviews.value = await repo.getAll()
    } catch (err: any) {
      toast.error('Gagal memuat Data Reviews: ' + (err.message || 'Error'))
    } finally {
      isLoading.value = false
    }
  }

  async function getReviewById(id: string): Promise<DataReview | undefined> {
    return reviews.value.find((r) => r.id === id) || (await repo.getById(id))
  }

  async function createReview(data: Omit<DataReview, 'id' | 'createdAt'>) {
    AuthorizationService.assertPermission('datareview:create')
    try {
      const created = await repo.create(data)
      reviews.value.unshift(created)
      toast.success(`Data Review "${created.title}" berhasil dibuat!`)
      return created
    } catch (err: any) {
      toast.error('Gagal membuat review data: ' + (err.message || 'Error'))
      throw err
    }
  }

  async function generateContentFromReview(reviewId: string) {
    AuthorizationService.assertPermission('content:create')
    const review = reviews.value.find((r) => r.id === reviewId)
    if (!review) throw new Error('Data review tidak ditemukan')

    const metricsSummary = (review.keyMetrics || [])
      .map((m) => `• ${m.label}: ${m.value} (${m.change || 'N/A'})`)
      .join('\n')

    const findingsSummary = (review.findings || []).slice(0, 3).map((f, i) => `${i + 1}. ${f}`).join('\n')

    const caption = [
      `📊 Ringkasan Analisis Data: ${review.title}`,
      '',
      review.summary,
      '',
      'Metrik Kunci:',
      metricsSummary,
      '',
      'Temuan & Insight Utama:',
      findingsSummary,
      '',
      'Pelajari strategi optimalisasi selengkapnya di portal Satria AI Workforce! 🚀'
    ].join('\n')

    const content = await contentStore.createContent({
      projectId: review.projectId,
      projectName: review.projectName,
      title: `Infografis Hasil Analisis: ${review.title}`,
      caption,
      targetPlatforms: ['instagram', 'facebook_page'],
      dataReviewId: review.id,
      platformVersions: {
        instagram: {
          caption: `${caption}\n\n#DataAnalytics #BusinessIntelligence #SatriaWorkforce #GrowthAudit`,
          hashtags: ['#DataAnalytics', '#BusinessIntelligence', '#SatriaWorkforce']
        },
        facebook_page: {
          caption,
          cta: 'Unduh laporan lengkap format PDF di portal manajemen Satria.'
        }
      },
      approvalPolicy: 'Review'
    })

    // Link back to review
    await repo.update(review.id, { generatedContentId: content.id })
    review.generatedContentId = content.id

    toast.success(`Konten sosial otomatis dibuat dari hasil analisis data review!`)
    return content
  }

  return {
    reviews,
    isLoading,
    selectedProjectId,
    filteredReviews,
    loadReviews,
    getReviewById,
    createReview,
    generateContentFromReview
  }
})
