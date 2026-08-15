<template>
  <div
    v-if="isOpen && item"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-4xl rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-2xl overflow-hidden my-8">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <div class="flex items-center gap-3">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            :class="statusBadgeClass"
          >
            <span class="h-2 w-2 rounded-full" :class="statusDotClass" />
            {{ item.status }}
          </span>
          <h3 class="text-base font-bold text-surface-on truncate max-w-lg">
            {{ item.title }}
          </h3>
        </div>

        <button
          @click="$emit('close')"
          class="rounded-lg p-1.5 text-surface-muted hover:bg-surface-container-high hover:text-surface-on transition-colors"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Main Body Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 max-h-[75vh] overflow-y-auto">
        <!-- Left 7 Cols: Platform Mockups & Adaptation Preview -->
        <div class="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-surface-container-high/60 space-y-5">
          <!-- Platform Tabs -->
          <div class="flex items-center gap-2 border-b border-surface-container-high/60 pb-2">
            <button
              v-for="platform in item.targetPlatforms"
              :key="platform"
              @click="activePlatformTab = platform"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
              :class="activePlatformTab === platform ? 'bg-primary text-surface-container-lowest font-semibold' : 'text-surface-muted hover:text-surface-on hover:bg-surface-container-high/50'"
            >
              <span>{{ platformLabel(platform) }}</span>
            </button>
          </div>

          <!-- Platform Mockup Preview -->
          <!-- 1. Instagram Preview -->
          <div v-if="activePlatformTab === 'instagram'" class="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-3">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px]">
                <div class="h-full w-full rounded-full bg-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-surface-on">
                  IG
                </div>
              </div>
              <div>
                <p class="text-xs font-bold text-surface-on">satria.workforce</p>
                <p class="text-[10px] text-surface-muted">Sponsored • AI Autonomous</p>
              </div>
            </div>

            <!-- Media Preview Image if available -->
            <div class="rounded-lg overflow-hidden bg-surface-container-lowest border border-surface-container-high/60 aspect-square flex items-center justify-center">
              <img
                v-if="activeMediaUrl"
                :src="activeMediaUrl"
                alt="Preview"
                class="h-full w-full object-cover"
              />
              <div v-else class="text-center p-6 text-surface-muted">
                <svg class="h-10 w-10 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p class="text-xs">Infografis Visual Generated</p>
              </div>
            </div>

            <!-- Caption -->
            <div class="text-xs text-surface-on leading-relaxed space-y-2 whitespace-pre-line">
              <p>{{ igAdaptation.caption || item.caption }}</p>
              <div v-if="igAdaptation.hashtags?.length" class="text-primary font-medium">
                {{ igAdaptation.hashtags.join(' ') }}
              </div>
            </div>
          </div>

          <!-- 2. TikTok Preview -->
          <div v-else-if="activePlatformTab === 'tiktok'" class="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-bold text-rose-400">TIKTOK SCRIPT & HOOK</span>
              <span class="text-[11px] text-surface-muted">Format 9:16 Vertical</span>
            </div>

            <!-- Hook Box -->
            <div class="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
              <p class="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">⚡ Opening Hook (0-3 Detik)</p>
              <p class="text-xs font-semibold text-surface-on">{{ ttAdaptation.hook || 'Kenapa bisnis kamu belum otomatis? Tonton sampai habis!' }}</p>
            </div>

            <!-- Script Flow -->
            <div class="space-y-2">
              <p class="text-[11px] font-bold text-surface-muted uppercase tracking-wider">Video Narrative Script</p>
              <div class="rounded-lg bg-surface-container-lowest p-3 text-xs text-surface-on whitespace-pre-line leading-relaxed border border-surface-container-high/60 font-mono">
                {{ ttAdaptation.script || item.caption }}
              </div>
            </div>

            <!-- On Screen Text -->
            <div v-if="ttAdaptation.onScreenText?.length" class="space-y-1.5">
              <p class="text-[11px] font-bold text-surface-muted uppercase tracking-wider">On-Screen Text Badges</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="(badge, idx) in ttAdaptation.onScreenText"
                  :key="idx"
                  class="rounded bg-surface-container-high px-2 py-0.5 text-xs text-surface-on"
                >
                  📌 {{ badge }}
                </span>
              </div>
            </div>

            <!-- CTA -->
            <p v-if="ttAdaptation.cta" class="text-xs font-medium text-primary">
              👉 CTA: {{ ttAdaptation.cta }}
            </p>
          </div>

          <!-- 3. Facebook Page & Group Preview -->
          <div v-else class="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-3">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                f
              </div>
              <div>
                <p class="text-xs font-bold text-surface-on">SATRIA Autonomous Workforce</p>
                <p class="text-[10px] text-surface-muted">Public Post • Auto-Distribution</p>
              </div>
            </div>

            <div class="text-xs text-surface-on whitespace-pre-line leading-relaxed bg-surface-container-lowest p-3 rounded-lg border border-surface-container-high/60">
              <p class="font-bold mb-2">{{ item.title }}</p>
              <p>{{ fbAdaptation.caption || item.caption }}</p>
              <p v-if="fbAdaptation.cta" class="mt-3 text-primary font-medium">
                👉 {{ fbAdaptation.cta }}
              </p>
            </div>
          </div>
        </div>

        <!-- Right 5 Cols: Quality Gate, Publications & Actions -->
        <div class="lg:col-span-5 p-6 space-y-6 bg-surface-container-lowest/40">
          <!-- Quality Gate Checklist Box -->
          <div class="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider">Quality Gate Check</h4>
              <span
                class="rounded-md px-2 py-0.5 text-xs font-mono font-bold"
                :class="qualityScoreClass"
              >
                Score: {{ qualityChecks.score }}/100
              </span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-surface-on-variant">Brand Compliance</span>
                <span :class="qualityChecks.brandCompliance ? 'text-emerald-400 font-medium' : 'text-rose-400'">
                  {{ qualityChecks.brandCompliance ? '✓ Lulus' : '✗ Belum' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-surface-on-variant">Grammar & Format</span>
                <span :class="qualityChecks.grammarQuality ? 'text-emerald-400 font-medium' : 'text-rose-400'">
                  {{ qualityChecks.grammarQuality ? '✓ Sesuai' : '✗ Kurang' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-surface-on-variant">Safety & Sensitive Check</span>
                <span :class="qualityChecks.noSensitiveContent ? 'text-emerald-400 font-medium' : 'text-rose-400'">
                  {{ qualityChecks.noSensitiveContent ? '✓ Aman' : '✗ Peringatan' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-surface-on-variant">Links & Media Assets</span>
                <span :class="qualityChecks.linksValid && qualityChecks.mediaValid ? 'text-emerald-400 font-medium' : 'text-amber-400'">
                  {{ qualityChecks.linksValid && qualityChecks.mediaValid ? '✓ Valid' : '⚠️ Periksa' }}
                </span>
              </div>
            </div>

            <div v-if="qualityChecks.notes?.length" class="border-t border-surface-container-high/60 pt-2 space-y-1">
              <p class="text-[10px] text-surface-muted uppercase font-bold">Catatan Gate:</p>
              <p
                v-for="(note, nIdx) in qualityChecks.notes"
                :key="nIdx"
                class="text-[11px] text-surface-on-variant leading-tight"
              >
                • {{ note }}
              </p>
            </div>
          </div>

          <!-- Platform Publications Table -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider">Status Distribusi Platform</h4>
            <div class="space-y-2">
              <div
                v-for="pub in childPublications"
                :key="pub.id"
                class="flex items-center justify-between rounded-lg border border-surface-container-high/60 bg-surface-container-low p-2.5 text-xs"
              >
                <div class="flex items-center gap-2">
                  <span class="font-bold text-surface-on uppercase font-mono">{{ pub.platform }}</span>
                  <span class="text-[10px] text-surface-muted font-mono">({{ pub.status }})</span>
                </div>

                <div class="flex items-center gap-1.5">
                  <a
                    v-if="pub.externalUrl"
                    :href="pub.externalUrl"
                    target="_blank"
                    class="text-primary hover:underline text-[11px] flex items-center gap-0.5"
                  >
                    <span>Lihat</span>
                    <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                  <button
                    v-else-if="pub.status !== 'Published' && pub.status !== 'Publishing'"
                    @click="$emit('publish-pub', pub.id)"
                    class="px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium text-[11px] transition-colors"
                  >
                    Publikasikan
                  </button>
                  <span v-else-if="pub.status === 'Publishing'" class="text-amber-400 font-medium text-[11px]">
                    Memproses...
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Schedule Input (if scheduling) -->
          <div v-if="showScheduleInput" class="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 space-y-2">
            <label class="text-xs font-bold text-cyan-400">Pilih Waktu Tayang (Schedule):</label>
            <input
              type="datetime-local"
              v-model="scheduleDateTime"
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-xs text-surface-on"
            />
            <div class="flex justify-end gap-2 pt-1">
              <button
                @click="showScheduleInput = false"
                class="px-2.5 py-1 text-xs text-surface-muted hover:text-surface-on"
              >
                Batal
              </button>
              <button
                @click="submitSchedule"
                class="px-3 py-1 text-xs font-bold bg-cyan-500 text-surface-container-lowest rounded-md"
              >
                Konfirmasi Jadwal
              </button>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="pt-4 border-t border-surface-container-high/60 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <button
                v-if="item.status === 'Review' || item.status === 'Draft'"
                @click="$emit('approve', item.id)"
                class="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-emerald-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Setujui Konten
              </button>
              <button
                v-if="item.status === 'Review'"
                @click="promptReject"
                class="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                Tolak (Revisi)
              </button>
              <button
                v-if="item.status !== 'Scheduled'"
                @click="showScheduleInput = !showScheduleInput"
                class="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors"
              >
                Jadwalkan Tayang
              </button>
              <button
                @click="$emit('publish-all', item.id)"
                class="w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Publikasikan Semua
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContentItem, PlatformTarget, Publication, MediaAsset } from '../../types'

const props = defineProps<{
  isOpen: boolean
  item?: ContentItem | null
  publications: Publication[]
  mediaAssets: MediaAsset[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'approve', id: string): void
  (e: 'reject', id: string, reason: string): void
  (e: 'schedule', id: string, scheduledAt: string): void
  (e: 'publish-pub', pubId: string): void
  (e: 'publish-all', contentId: string): void
}>()

const activePlatformTab = ref<PlatformTarget>('instagram')
const showScheduleInput = ref(false)
const scheduleDateTime = ref('')

const childPublications = computed(() => {
  if (!props.item) return []
  return props.publications.filter((p) => p.contentItemId === props.item?.id)
})

const igAdaptation = computed(() => props.item?.platformVersions?.instagram || {})
const ttAdaptation = computed(() => props.item?.platformVersions?.tiktok || {})
const fbAdaptation = computed(() => props.item?.platformVersions?.facebook_page || {})

const activeMediaUrl = computed(() => {
  if (!props.item?.mediaAssetIds?.length) return null
  const media = props.mediaAssets.find((m) => props.item?.mediaAssetIds.includes(m.id))
  return media ? media.url : null
})

const qualityChecks = computed(() => {
  return (
    props.item?.qualityChecks || {
      brandCompliance: true,
      grammarQuality: true,
      noSensitiveContent: true,
      linksValid: true,
      mediaValid: true,
      score: 90,
      notes: []
    }
  )
})

const qualityScoreClass = computed(() => {
  const score = qualityChecks.value.score
  if (score >= 90) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  if (score >= 70) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
})

const statusBadgeClass = computed(() => {
  switch (props.item?.status) {
    case 'Published':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'Approved':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'Scheduled':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
    case 'Review':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    default:
      return 'bg-surface-container-high text-surface-on-variant'
  }
})

const statusDotClass = computed(() => {
  switch (props.item?.status) {
    case 'Published':
      return 'bg-emerald-400'
    case 'Approved':
      return 'bg-blue-400'
    case 'Scheduled':
      return 'bg-cyan-400'
    case 'Review':
      return 'bg-amber-400'
    default:
      return 'bg-surface-muted'
  }
})

function platformLabel(p: PlatformTarget): string {
  switch (p) {
    case 'instagram':
      return 'Instagram'
    case 'tiktok':
      return 'TikTok'
    case 'facebook_page':
      return 'Facebook Page'
    case 'facebook_group':
      return 'Facebook Group'
    default:
      return p
  }
}

function promptReject() {
  if (!props.item) return
  const reason = prompt('Masukkan alasan penolakan / revisi:')
  if (reason) {
    emit('reject', props.item.id, reason)
  }
}

function submitSchedule() {
  if (!props.item || !scheduleDateTime.value) return
  emit('schedule', props.item.id, new Date(scheduleDateTime.value).toISOString())
  showScheduleInput.value = false
}
</script>
