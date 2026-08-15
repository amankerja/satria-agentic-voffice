<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Reviews & Verification Hub</h1>
          <UiBadge variant="warning" size="sm" class="font-mono">
            {{ reviewStore.pendingReviews.length }} Pending Reviews
          </UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Pusat validasi dan persetujuan hasil pengerjaan unit kerja sebelum dinyatakan selesai (Done)
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link to="/runs">
          <UiButton size="sm" variant="secondary" :icon="PlayCircle">
            Execution Runs
          </UiButton>
        </router-link>
      </div>
    </div>

    <!-- 3 Summary KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Pending Decision</span>
          <Clock class="w-4 h-4 text-[#f59e0b]" />
        </div>
        <div class="text-2xl font-bold font-mono text-[#f59e0b] mt-1.5">
          {{ reviewStore.pendingReviews.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Awaiting Human Approval</div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Approved Work</span>
          <CheckCircle2 class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary mt-1.5">
          {{ reviewStore.approvedReviews.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Tasks Closed to Done</div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Changes Requested</span>
          <RotateCcw class="w-4 h-4 text-error" />
        </div>
        <div class="text-2xl font-bold font-mono text-error mt-1.5">
          {{ reviewStore.changesRequestedReviews.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">Requires Revision Iteration</div>
      </UiCard>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="st in ['All', 'Pending', 'Approved', 'Changes Requested', 'Rejected']"
          :key="st"
          @click="statusFilter = st"
          :class="[
            'px-2.5 py-1 rounded text-xs font-mono transition whitespace-nowrap',
            statusFilter === st
              ? 'bg-surface-container-high text-primary font-bold border border-outline'
              : 'text-muted hover:text-on-surface'
          ]"
        >
          {{ st }}
        </button>
      </div>

      <div class="relative w-full sm:w-64">
        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search task, employee, review ID..."
          class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-2.5 py-1 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
        />
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="reviewStore.loading" class="space-y-3">
      <UiSkeleton v-for="i in 3" :key="i" class="h-28 rounded-xl" />
    </div>

    <!-- Empty State -->
    <UiEmptyState
      v-else-if="filteredReviews.length === 0"
      title="No Reviews Found"
      description="Tidak ada berkas hasil eksekusi yang memerlukan tindakan review saat ini."
    />

    <!-- Review Items List -->
    <div v-else class="space-y-3">
      <div
        v-for="rev in filteredReviews"
        :key="rev.id"
        @click="openReview(rev)"
        class="p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-outline rounded-xl cursor-pointer transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div class="space-y-2 truncate">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-bold text-primary">#{{ rev.id }}</span>
            <span class="text-[10px] font-mono text-muted">Run #{{ rev.runId }}</span>
            <UiBadge :variant="getDecisionVariant(rev.status)" size="sm" class="font-mono">
              {{ rev.status }}
            </UiBadge>
          </div>

          <div class="text-sm font-bold text-on-surface truncate">{{ rev.taskTitle }}</div>

          <div class="flex items-center gap-3 text-xs text-muted font-mono flex-wrap">
            <span>By: <strong class="text-on-surface">{{ rev.employeeName }}</strong></span>
            <span>&bull;</span>
            <span class="flex items-center gap-1">
              <span
                :class="[
                  'px-1.5 py-0.5 rounded text-[10px] font-bold font-mono',
                  rev.checklist.every(c => c.completed)
                    ? 'bg-primary-container/20 text-primary-container'
                    : 'bg-amber-400/20 text-amber-300'
                ]"
              >
                {{ Math.round((rev.checklist.filter(c => c.completed).length / (rev.checklist.length || 1)) * 100) }}% Score
              </span>
              <span>({{ rev.checklist.filter(c => c.completed).length }}/{{ rev.checklist.length }} assertions)</span>
            </span>
          </div>

          <p v-if="rev.comment" class="text-xs text-on-surface-variant line-clamp-1 italic">
            "{{ rev.comment }}"
          </p>
        </div>

        <div class="flex items-center gap-3 self-end md:self-auto shrink-0">
          <UiButton size="sm" :variant="rev.status === 'Pending' ? 'primary' : 'secondary'">
            {{ rev.status === 'Pending' ? 'Review & Approve' : 'View Decision' }} &rarr;
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Review Drawer Component -->
    <ReviewDrawer
      v-model="drawerOpen"
      :review="selectedReview"
      @decision="handleDecisionMade"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PlayCircle, Clock, CheckCircle2, RotateCcw, Search } from '@lucide/vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiSkeleton from '../../components/ui/UiSkeleton.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import ReviewDrawer from '../../components/workforce/ReviewDrawer.vue'
import { useReviewStore } from '../../stores/review'
import type { TaskReview, ReviewDecision } from '../../types'

const reviewStore = useReviewStore()

const statusFilter = ref<string>('All')
const searchQuery = ref<string>('')
const drawerOpen = ref<boolean>(false)
const selectedReview = ref<TaskReview | null>(null)

onMounted(() => {
  reviewStore.fetchReviews()
})

const filteredReviews = computed(() => {
  return reviewStore.reviews.filter((r) => {
    const matchStatus = statusFilter.value === 'All' || r.status === statusFilter.value
    const matchSearch =
      searchQuery.value.trim() === '' ||
      r.taskTitle.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchStatus && matchSearch
  })
})

const getDecisionVariant = (status: ReviewDecision) => {
  switch (status) {
    case 'Approved':
      return 'success'
    case 'Changes Requested':
      return 'warning'
    case 'Rejected':
      return 'error'
    default:
      return 'neutral'
  }
}

const openReview = (rev: TaskReview) => {
  selectedReview.value = rev
  drawerOpen.value = true
}

const handleDecisionMade = () => {
  reviewStore.fetchReviews()
}
</script>
