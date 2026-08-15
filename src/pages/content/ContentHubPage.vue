<template>
  <div class="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-mono font-bold text-primary uppercase">
            Phase 6 Production
          </span>
          <h1 class="text-2xl font-black tracking-tight text-surface-on">
            Content & Social Automation Command Center
          </h1>
        </div>
        <p class="mt-1 text-sm text-surface-muted">
          Orkestrasi kreasi konten multi-platform, verifikasi quality gate, analisis data otomatis, dan publikasi sosial.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="showCreateDrawer = true"
          class="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Buat Konten Baru</span>
        </button>
      </div>
    </div>

    <!-- Side Hustle Business Operations Engine (3-Step Practical Flow) -->
    <SideHustleOpsBanner />

    <!-- 5 KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="rounded-2xl border border-surface-container-high/60 bg-surface-container-low p-4 space-y-1">
        <p class="text-[11px] font-medium text-surface-muted uppercase tracking-wider">Total Konten</p>
        <p class="text-2xl font-black text-surface-on font-mono">{{ contentStore.counts.total }}</p>
      </div>

      <div class="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Menunggu Review</p>
        <p class="text-2xl font-black text-amber-400 font-mono">{{ contentStore.counts.review }}</p>
      </div>

      <div class="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Approved</p>
        <p class="text-2xl font-black text-blue-400 font-mono">{{ contentStore.counts.approved }}</p>
      </div>

      <div class="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Terjadwal</p>
        <p class="text-2xl font-black text-cyan-400 font-mono">{{ contentStore.counts.scheduled }}</p>
      </div>

      <div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Published</p>
        <p class="text-2xl font-black text-emerald-400 font-mono">{{ contentStore.counts.published }}</p>
      </div>
    </div>

    <!-- Navigation Tabs & Search / Filter Controls -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container-high pb-4">
      <!-- Tabs Switcher -->
      <div class="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl border border-surface-container-high/60">
        <button
          v-for="tab in tabOptions"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2"
          :class="activeTab === tab.id ? 'bg-primary text-surface-container-lowest shadow-sm' : 'text-surface-muted hover:text-surface-on'"
        >
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.badge"
            class="rounded-full px-1.5 py-0.2 text-[10px]"
            :class="activeTab === tab.id ? 'bg-surface-container-lowest/20 text-surface-container-lowest' : 'bg-surface-container-high text-surface-muted'"
          >
            {{ tab.badge }}
          </span>
        </button>
      </div>

      <!-- Filters (Visible in Pipeline & Calendar) -->
      <div v-if="activeTab === 'pipeline' || activeTab === 'calendar'" class="flex flex-wrap items-center gap-2">
        <div class="relative">
          <input
            type="text"
            v-model="contentStore.searchQuery"
            placeholder="Cari konten..."
            class="rounded-xl bg-surface-container-low border border-surface-container-high pl-8 pr-3 py-1.5 text-xs text-surface-on focus:border-primary focus:outline-none w-48"
          />
          <svg class="absolute left-2.5 top-2 h-3.5 w-3.5 text-surface-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <select
          v-model="contentStore.filterPlatform"
          class="rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-1.5 text-xs text-surface-on"
        >
          <option value="all">Semua Platform</option>
          <option value="instagram">Instagram</option>
          <option value="threads">Threads</option>
          <option value="tiktok">TikTok</option>
          <option value="facebook_page">Facebook Page</option>
          <option value="facebook_group">Facebook Group</option>
        </select>
      </div>
    </div>

    <!-- TAB 1: PIPELINE KANBAN VIEW -->
    <div v-if="activeTab === 'pipeline'" class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <!-- 1. Draft Column -->
      <div class="space-y-3 rounded-2xl bg-surface-container-lowest/60 p-3 border border-surface-container-high/40">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold uppercase tracking-wider text-surface-muted font-mono">Draft</span>
          <span class="text-xs font-mono font-bold text-surface-muted">{{ contentStore.kanbanColumns.draft.length }}</span>
        </div>
        <div class="space-y-3">
          <ContentCard
            v-for="item in contentStore.kanbanColumns.draft"
            :key="item.id"
            :item="item"
            @inspect="openInspectModal"
            @approve="handleApprove"
            @publish-now="handlePublishNow"
            @delete="handleDelete"
          />
          <div v-if="!contentStore.kanbanColumns.draft.length" class="text-center py-6 text-xs text-surface-muted">
            Tidak ada draft
          </div>
        </div>
      </div>

      <!-- 2. Review Column -->
      <div class="space-y-3 rounded-2xl bg-amber-500/5 p-3 border border-amber-500/20">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">In Review</span>
          <span class="text-xs font-mono font-bold text-amber-400">{{ contentStore.kanbanColumns.review.length }}</span>
        </div>
        <div class="space-y-3">
          <ContentCard
            v-for="item in contentStore.kanbanColumns.review"
            :key="item.id"
            :item="item"
            @inspect="openInspectModal"
            @approve="handleApprove"
            @publish-now="handlePublishNow"
            @delete="handleDelete"
          />
          <div v-if="!contentStore.kanbanColumns.review.length" class="text-center py-6 text-xs text-surface-muted">
            Semua telah direview
          </div>
        </div>
      </div>

      <!-- 3. Approved Column -->
      <div class="space-y-3 rounded-2xl bg-blue-500/5 p-3 border border-blue-500/20">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">Approved</span>
          <span class="text-xs font-mono font-bold text-blue-400">{{ contentStore.kanbanColumns.approved.length }}</span>
        </div>
        <div class="space-y-3">
          <ContentCard
            v-for="item in contentStore.kanbanColumns.approved"
            :key="item.id"
            :item="item"
            @inspect="openInspectModal"
            @approve="handleApprove"
            @publish-now="handlePublishNow"
            @delete="handleDelete"
          />
          <div v-if="!contentStore.kanbanColumns.approved.length" class="text-center py-6 text-xs text-surface-muted">
            Belum ada approved
          </div>
        </div>
      </div>

      <!-- 4. Scheduled Column -->
      <div class="space-y-3 rounded-2xl bg-cyan-500/5 p-3 border border-cyan-500/20">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Scheduled</span>
          <span class="text-xs font-mono font-bold text-cyan-400">{{ contentStore.kanbanColumns.scheduled.length }}</span>
        </div>
        <div class="space-y-3">
          <ContentCard
            v-for="item in contentStore.kanbanColumns.scheduled"
            :key="item.id"
            :item="item"
            @inspect="openInspectModal"
            @approve="handleApprove"
            @publish-now="handlePublishNow"
            @delete="handleDelete"
          />
          <div v-if="!contentStore.kanbanColumns.scheduled.length" class="text-center py-6 text-xs text-surface-muted">
            Tidak ada jadwal tayang
          </div>
        </div>
      </div>

      <!-- 5. Published Column -->
      <div class="space-y-3 rounded-2xl bg-emerald-500/5 p-3 border border-emerald-500/20">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Published</span>
          <span class="text-xs font-mono font-bold text-emerald-400">{{ contentStore.kanbanColumns.published.length }}</span>
        </div>
        <div class="space-y-3">
          <ContentCard
            v-for="item in contentStore.kanbanColumns.published"
            :key="item.id"
            :item="item"
            @inspect="openInspectModal"
            @approve="handleApprove"
            @publish-now="handlePublishNow"
            @delete="handleDelete"
          />
          <div v-if="!contentStore.kanbanColumns.published.length" class="text-center py-6 text-xs text-surface-muted">
            Belum ada yang tayang
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: CALENDAR VIEW -->
    <div v-else-if="activeTab === 'calendar'">
      <ContentCalendarView
        :items="contentStore.filteredItems"
        @inspect="openInspectModal"
      />
    </div>

    <!-- TAB 3: DATA ANALYSIS VIEW -->
    <div v-else-if="activeTab === 'data_review'">
      <DataAnalysisTab
        :reviews="dataReviewStore.reviews"
        @inspect-review="openDataReviewModal"
      />
    </div>

    <!-- TAB 4: SOCIAL CONNECTIONS VIEW -->
    <div v-else-if="activeTab === 'social_connections'">
      <SocialConnectionsTab
        :connections="socialConnectionStore.connections"
      />
    </div>

    <!-- Modals -->
    <ContentDetailModal
      :is-open="showInspectModal"
      :item="inspectedItem"
      :publications="contentStore.publications"
      :media-assets="contentStore.mediaAssets"
      @close="showInspectModal = false"
      @approve="handleApproveId"
      @reject="handleRejectId"
      @schedule="handleScheduleId"
      @publish-pub="handlePublishPub"
      @publish-all="handlePublishAllId"
    />

    <DataReviewDetailModal
      :is-open="showDataReviewModal"
      :review="inspectedDataReview"
      @close="showDataReviewModal = false"
      @generate-content="handleGenerateContentFromReview"
    />

    <AssistedPublishModal
      :is-open="showAssistedModal"
      :payload="assistedModalPayload"
      @close="showAssistedModal = false"
      @mark-done="showAssistedModal = false"
    />

    <CreateContentDrawer
      :is-open="showCreateDrawer"
      @close="showCreateDrawer = false"
      @created="contentStore.loadAll"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { ContentItem, DataReview } from '../../types'
import { useContentStore } from '../../stores/content'
import { useDataReviewStore } from '../../stores/dataReview'
import { useSocialConnectionStore } from '../../stores/socialConnection'

import ContentCard from '../../components/content/ContentCard.vue'
import ContentDetailModal from '../../components/content/ContentDetailModal.vue'
import DataReviewDetailModal from '../../components/content/DataReviewDetailModal.vue'
import AssistedPublishModal from '../../components/content/AssistedPublishModal.vue'
import ContentCalendarView from '../../components/content/ContentCalendarView.vue'
import DataAnalysisTab from '../../components/content/DataAnalysisTab.vue'
import SocialConnectionsTab from '../../components/content/SocialConnectionsTab.vue'
import CreateContentDrawer from '../../components/content/CreateContentDrawer.vue'
import SideHustleOpsBanner from '../../components/content/SideHustleOpsBanner.vue'

const contentStore = useContentStore()
const dataReviewStore = useDataReviewStore()
const socialConnectionStore = useSocialConnectionStore()

const activeTab = ref<'pipeline' | 'calendar' | 'data_review' | 'social_connections'>('pipeline')

const tabOptions = computed<{ id: 'pipeline' | 'calendar' | 'data_review' | 'social_connections'; label: string; badge?: string }[]>(() => [
  { id: 'pipeline', label: 'Pipeline Kanban', badge: contentStore.counts.total.toString() },
  { id: 'calendar', label: 'Jadwal Kalender' },
  { id: 'data_review', label: 'Data Analysis Engine', badge: dataReviewStore.reviews.length.toString() },
  { id: 'social_connections', label: 'Social Connections', badge: socialConnectionStore.activeConnections.length.toString() }
])

// Modal states
const showInspectModal = ref(false)
const inspectedItem = ref<ContentItem | null>(null)

const showDataReviewModal = ref(false)
const inspectedDataReview = ref<DataReview | null>(null)

const showAssistedModal = ref(false)
const assistedModalPayload = ref<any>(null)

const showCreateDrawer = ref(false)

onMounted(async () => {
  await Promise.all([
    contentStore.loadAll(),
    dataReviewStore.loadReviews()
  ])
})

function openInspectModal(item: ContentItem) {
  inspectedItem.value = item
  showInspectModal.value = true
}

function openDataReviewModal(review: DataReview) {
  inspectedDataReview.value = review
  showDataReviewModal.value = true
}

async function handleApprove(item: ContentItem) {
  await contentStore.approveContent(item.id)
}

async function handleApproveId(id: string) {
  await contentStore.approveContent(id)
  showInspectModal.value = false
}

async function handleRejectId(id: string, reason: string) {
  await contentStore.rejectContent(id, reason)
  showInspectModal.value = false
}

async function handleScheduleId(id: string, scheduledAt: string) {
  await contentStore.scheduleContent(id, scheduledAt)
}

async function handlePublishPub(pubId: string) {
  const result = await contentStore.publishPublication(pubId)
  if (result && result.isAssisted && result.assistedPayload) {
    assistedModalPayload.value = result.assistedPayload
    showAssistedModal.value = true
  }
}

async function handlePublishNow(item: ContentItem) {
  await contentStore.publishContentNow(item.id)
}

async function handlePublishAllId(id: string) {
  await contentStore.publishContentNow(id)
  showInspectModal.value = false
}

async function handleDelete(item: ContentItem) {
  if (confirm(`Yakin ingin menghapus konten "${item.title}"?`)) {
    await contentStore.deleteContent(item.id)
  }
}

async function handleGenerateContentFromReview(reviewId: string) {
  const content = await dataReviewStore.generateContentFromReview(reviewId)
  showDataReviewModal.value = false
  if (content) {
    inspectedItem.value = content
    showInspectModal.value = true
  }
}
</script>
