import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TaskReview, ReviewDecision, RunResult } from '../types'
import { MockReviewRepository, MockRunResultRepository } from '../repositories'
import { useTaskStore } from './task'
import { useAgentRunStore } from './agentRun'
import { useNotificationStore } from './notification'
import { useActivityStore } from './activity'

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

        const taskStore = useTaskStore()
        const notificationStore = useNotificationStore()
        const activityStore = useActivityStore()
        const agentRunStore = useAgentRunStore()

        if (decision === 'Approved') {
          await taskStore.updateTask(updated.taskId, {
            status: 'Done',
            progress: 100
          })

          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Review Approved',
            message: `Task "${updated.taskTitle}" has been approved and marked Done.`,
            priority: 'normal',
            category: 'Tasks',
            link: '/tasks',
            read: false
          })

          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: 'Lead Reviewer',
            action: 'completed',
            targetType: 'task',
            targetTitle: `Approved deliverable for "${updated.taskTitle}"`
          })
        } else if (decision === 'Changes Requested') {
          await taskStore.updateTaskStatus(updated.taskId, 'In Progress')

          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Changes Requested',
            message: `Revisions requested for "${updated.taskTitle}": ${comment || 'See reviewer notes'}`,
            priority: 'important',
            category: 'Tasks',
            link: `/runs/${updated.runId}`,
            read: false
          })

          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: 'Lead Reviewer',
            action: 'updated',
            targetType: 'task',
            targetTitle: `Requested changes on "${updated.taskTitle}"`
          })

          // Trigger autonomous retry with reviewer feedback
          if (updated.runId) {
            await agentRunStore.retryRun(updated.runId, comment)
          }
        } else if (decision === 'Rejected') {
          await taskStore.updateTaskStatus(updated.taskId, 'Waiting')

          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Review Rejected',
            message: `Deliverable for task "${updated.taskTitle}" was rejected.`,
            priority: 'important',
            category: 'Tasks',
            link: '/reviews',
            read: false
          })

          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: 'Lead Reviewer',
            action: 'updated',
            targetType: 'task',
            targetTitle: `Rejected deliverable for "${updated.taskTitle}"`
          })
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

