<template>
  <div
    class="group relative flex flex-col justify-between rounded-xl border border-surface-container-high/60 bg-surface-container-low p-4 transition-all hover:border-primary/40 hover:bg-surface-container-mid/50"
    :class="{ 'opacity-70': item.status === 'Cancelled' }"
  >
    <!-- Header: Status & Quality Score -->
    <div class="mb-3 flex items-start justify-between gap-2">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span
          class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
          :class="statusBadgeClass"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass" />
          {{ item.status }}
        </span>
        <span
          v-if="item.qualityChecks"
          class="inline-flex items-center gap-1 rounded-md bg-surface-container-high/40 px-2 py-0.5 text-[11px] font-mono font-medium text-surface-on-variant"
          title="Quality Gate Score"
        >
          <svg class="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          {{ item.qualityChecks.score }}/100
        </span>
      </div>

      <!-- Action dropdown / Inspect button -->
      <button
        @click.stop="$emit('inspect', item)"
        class="text-xs text-surface-muted hover:text-surface-on transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-container-high/50"
      >
        <span>Detail</span>
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>

    <!-- Title & Snippet -->
    <div class="mb-3 cursor-pointer" @click="$emit('inspect', item)">
      <h4 class="text-sm font-semibold text-surface-on leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {{ item.title }}
      </h4>
      <p class="mt-1 text-xs text-surface-on-variant line-clamp-2 leading-relaxed">
        {{ item.caption || 'Tidak ada deskripsi caption.' }}
      </p>
    </div>

    <!-- Platforms & Metadata Footer -->
    <div class="mt-auto pt-3 border-t border-surface-container-high/40 flex flex-col gap-2.5">
      <div class="flex items-center justify-between gap-2">
        <!-- Target Platforms Pills -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span
            v-for="platform in item.targetPlatforms"
            :key="platform"
            class="inline-flex items-center gap-1 rounded bg-surface-container-high/60 px-1.5 py-0.5 text-[10px] font-mono font-medium text-surface-on-variant uppercase"
          >
            {{ platformBadgeText(platform) }}
          </span>
        </div>

        <!-- Creator / Date -->
        <span class="text-[11px] text-surface-muted">
          {{ formatDate(item.createdAt) }}
        </span>
      </div>

      <!-- Quick Context Actions -->
      <div class="flex items-center justify-between gap-2 pt-1">
        <div class="flex items-center gap-1">
          <button
            v-if="item.status === 'Review'"
            @click.stop="$emit('approve', item)"
            class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
          >
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Setujui
          </button>
          <button
            v-if="item.status === 'Approved' || item.status === 'Scheduled'"
            @click.stop="$emit('publish-now', item)"
            class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Publikasikan
          </button>
        </div>

        <button
          @click.stop="$emit('delete', item)"
          class="text-surface-muted hover:text-rose-400 p-1 rounded transition-colors"
          title="Hapus Konten"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContentItem, PlatformTarget } from '../../types'

const props = defineProps<{
  item: ContentItem
}>()

defineEmits<{
  (e: 'inspect', item: ContentItem): void
  (e: 'approve', item: ContentItem): void
  (e: 'publish-now', item: ContentItem): void
  (e: 'delete', item: ContentItem): void
}>()

const statusBadgeClass = computed(() => {
  switch (props.item.status) {
    case 'Published':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'Approved':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'Scheduled':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
    case 'Review':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'Failed':
      return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    default:
      return 'bg-surface-container-high text-surface-on-variant border border-surface-container-high'
  }
})

const statusDotClass = computed(() => {
  switch (props.item.status) {
    case 'Published':
      return 'bg-emerald-400'
    case 'Approved':
      return 'bg-blue-400'
    case 'Scheduled':
      return 'bg-cyan-400'
    case 'Review':
      return 'bg-amber-400'
    case 'Failed':
      return 'bg-rose-400'
    default:
      return 'bg-surface-muted'
  }
})

function platformBadgeText(platform: PlatformTarget): string {
  switch (platform) {
    case 'instagram':
      return 'IG'
    case 'threads':
      return 'TH'
    case 'tiktok':
      return 'TT'
    case 'facebook_page':
      return 'FB Page'
    case 'facebook_group':
      return 'FB Grp'
    default:
      return platform
  }
}

function formatDate(isoStr: string): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
}
</script>
