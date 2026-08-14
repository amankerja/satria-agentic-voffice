import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TaskReview, ReviewDecision, RunResult } from '../types'
import { MockReviewRepository, MockRunResultRepository } from '../repositories'

export const useReviewStore = defineStore('review', () => {
  const reviewRepo = new MockReviewRepository()
  const resultRepo = new MockRunResultRepository()

  const reviews = ref<TaskReview[]>([])
  const results = ref<RunResult[]>([])
  const currentReview = ref<TaskReview | null>(null)
  const currentResult = ref<RunResult | null>(null)
  const loading = ref<boolean>(false)

  const pendingReviews = computed(() =>
    reviews.value.filter((r) => r.status === 'Pending')
  )

  const approvedReviews = computed(() =>
    reviews.value.filter((r) => r.status === 'Approved')
  )

  const changesRequestedReviews = computed(() =>
    reviews.value.filter((r) => r.status === 'Changes Requested')
  )

  async function fetchReviews() {
    loading.value = true
    try {
      reviews.value = await reviewRepo.getAll()
    } finally {
      loading.value = false
    }
  }

  async function fetchResults() {
    loading.value = true
    try {
      results.value = await resultRepo.getAll()
    } finally {
      loading.value = false
    }
  }

  async function fetchReviewById(id: string) {
    loading.value = true
    try {
      const review = await reviewRepo.getById(id)
      currentReview.value = review || null
      return review
    } finally {
      loading.value = false
    }
  }

  async function fetchReviewByRunId(runId: string) {
    return await reviewRepo.getByRunId(runId)
  }

  async function fetchResultByRunId(runId: string) {
    const res = await resultRepo.getByRunId(runId)
    currentResult.value = res || null
    return res
  }

  async function submitDecision(reviewId: string, decision: ReviewDecision, comment?: string) {
    loading.value = true
    try {
      const updated = await reviewRepo.submitDecision(reviewId, decision, comment)
      if (updated) {
        const idx = reviews.value.findIndex((r) => r.id === reviewId)
        if (idx >= 0) {
          reviews.value[idx] = { ...updated }
        }
        if (currentReview.value?.id === reviewId) {
          currentReview.value = { ...updated }
        }
      }
      return updated
    } finally {
      loading.value = false
    }
  }

  return {
    reviews,
    results,
    currentReview,
    currentResult,
    loading,
    pendingReviews,
    approvedReviews,
    changesRequestedReviews,
    fetchReviews,
    fetchResults,
    fetchReviewById,
    fetchReviewByRunId,
    fetchResultByRunId,
    submitDecision
  }
})
