<template>
  <div
    v-if="isOpen && review"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-4xl rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-2xl overflow-hidden my-8">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span class="h-2 w-2 rounded-full bg-emerald-400" />
            {{ review.status }}
          </span>
          <h3 class="text-base font-bold text-surface-on truncate max-w-lg">
            {{ review.title }}
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

      <!-- Content Body -->
      <div class="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
        <!-- Metadata bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-surface-muted bg-surface-container-low p-3 rounded-xl border border-surface-container-high/60">
          <div class="flex items-center gap-4">
            <span><strong class="text-surface-on">File Sumber:</strong> {{ review.sourceFile }} ({{ review.sourceFormat.toUpperCase() }})</span>
            <span><strong class="text-surface-on">Analis AI:</strong> {{ review.analyzedByWorkerName || 'Agent Planner' }}</span>
          </div>
          <span>{{ formatDate(review.createdAt) }}</span>
        </div>

        <!-- Executive Summary -->
        <div class="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
          <h4 class="text-xs font-bold text-primary uppercase tracking-wider">Executive Summary</h4>
          <p class="text-xs text-surface-on leading-relaxed">
            {{ review.summary }}
          </p>
        </div>

        <!-- Key Metrics Cards -->
        <div v-if="review.keyMetrics?.length" class="space-y-2">
          <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider">Metrik Finansial & Operasional Kunci</h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              v-for="(metric, idx) in review.keyMetrics"
              :key="idx"
              class="rounded-xl border border-surface-container-high bg-surface-container-low p-3.5 space-y-1"
            >
              <p class="text-[11px] text-surface-muted truncate">{{ metric.label }}</p>
              <p class="text-base font-bold text-surface-on font-mono">{{ metric.value }}</p>
              <p
                v-if="metric.change"
                class="text-xs font-medium"
                :class="metric.isPositive ? 'text-emerald-400' : 'text-rose-400'"
              >
                {{ metric.change }} vs periode lalu
              </p>
            </div>
          </div>
        </div>

        <!-- Findings & Anomalies Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Findings & Trends -->
          <div class="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-3">
            <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider flex items-center gap-1.5">
              <svg class="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Temuan & Tren Positif
            </h4>
            <ul class="space-y-2 text-xs text-surface-on-variant">
              <li v-for="(f, idx) in review.findings" :key="idx" class="leading-relaxed">
                • {{ f }}
              </li>
              <li v-for="(t, idx) in review.trends" :key="'t-' + idx" class="leading-relaxed text-cyan-400">
                ⚡ {{ t }}
              </li>
            </ul>
          </div>

          <!-- Anomalies & Risks -->
          <div class="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-3">
            <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider flex items-center gap-1.5">
              <svg class="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Anomali & Potensi Risiko
            </h4>
            <ul class="space-y-2 text-xs text-surface-on-variant">
              <li v-for="(a, idx) in review.anomalies" :key="idx" class="leading-relaxed text-amber-300">
                ⚠️ {{ a }}
              </li>
              <li v-for="(r, idx) in review.risks" :key="'r-' + idx" class="leading-relaxed text-rose-300">
                🔴 {{ r }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-2">
          <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider">Rekomendasi Tindakan Strategis</h4>
          <div class="space-y-1.5 text-xs text-surface-on">
            <div
              v-for="(rec, idx) in review.recommendations"
              :key="idx"
              class="flex items-start gap-2 bg-surface-container-lowest/60 p-2.5 rounded-lg border border-surface-container-high/40"
            >
              <span class="font-bold text-primary">{{ idx + 1 }}.</span>
              <p class="leading-relaxed">{{ rec }}</p>
            </div>
          </div>
        </div>

        <!-- Deliverable Artifacts -->
        <div v-if="review.artifacts?.length" class="space-y-2">
          <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider">Artefak & Dokumen Tergenerasi</h4>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="art in review.artifacts"
              :key="art.id"
              class="flex items-center gap-2 rounded-lg bg-surface-container-low border border-surface-container-high px-3 py-2 text-xs text-surface-on"
            >
              <span class="font-mono font-bold uppercase text-primary text-[10px]">{{ art.type }}</span>
              <span>{{ art.name }} ({{ art.size }})</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between border-t border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <span class="text-xs text-surface-muted">
          {{ review.generatedContentId ? '✓ Konten sosial telah terhubung ke analisis ini' : 'Belum diekspor ke kampanye konten' }}
        </span>

        <div class="flex items-center gap-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-xs font-medium text-surface-muted hover:text-surface-on"
          >
            Tutup
          </button>
          <button
            @click="$emit('generate-content', review.id)"
            class="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Buat Konten Sosial Otomatis
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataReview } from '../../types'

defineProps<{
  isOpen: boolean
  review?: DataReview | null
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'generate-content', reviewId: string): void
}>()

function formatDate(isoStr?: string): string {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
