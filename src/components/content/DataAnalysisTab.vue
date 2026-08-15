<template>
  <div class="space-y-6">
    <!-- Header & Action Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 class="text-base font-bold text-surface-on">Data Analysis & Review Engine</h3>
        <p class="text-xs text-surface-muted">Ingest data mentah (CSV/XLSX/JSON), ekstrak temuan kritis, dan ubah insight menjadi kampanye konten otomatis.</p>
      </div>

      <button
        @click="showCreateModal = true"
        class="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-sm"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Unggah Data & Jalankan Analisis</span>
      </button>
    </div>

    <!-- Review Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="review in reviews"
        :key="review.id"
        class="rounded-2xl border border-surface-container-high/60 bg-surface-container-low p-5 space-y-4 hover:border-primary/40 transition-all cursor-pointer"
        @click="$emit('inspect-review', review)"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {{ review.status }}
          </span>
          <span class="text-[11px] font-mono text-surface-muted uppercase">
            {{ review.sourceFormat }} • {{ review.sourceFile }}
          </span>
        </div>

        <div>
          <h4 class="text-sm font-bold text-surface-on leading-snug hover:text-primary transition-colors">
            {{ review.title }}
          </h4>
          <p class="mt-1 text-xs text-surface-on-variant line-clamp-2 leading-relaxed">
            {{ review.summary }}
          </p>
        </div>

        <!-- Metrics Preview -->
        <div v-if="review.keyMetrics?.length" class="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-high/40">
          <div
            v-for="(m, mIdx) in review.keyMetrics.slice(0, 2)"
            :key="mIdx"
            class="rounded-lg bg-surface-container-lowest p-2 text-xs"
          >
            <p class="text-[10px] text-surface-muted truncate">{{ m.label }}</p>
            <p class="font-bold text-surface-on font-mono">{{ m.value }} <span v-if="m.change" class="text-[10px] font-normal" :class="m.isPositive ? 'text-emerald-400' : 'text-rose-400'">({{ m.change }})</span></p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-2 border-t border-surface-container-high/40 text-xs">
          <span class="text-surface-muted text-[11px]">
            Oleh: {{ review.analyzedByWorkerName || 'Agent Planner' }}
          </span>
          <button
            @click.stop="$emit('inspect-review', review)"
            class="font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Buka Laporan Penuh</span>
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal / New Review Form Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      @click.self="showCreateModal = false"
    >
      <div class="w-full max-w-lg rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 space-y-4 shadow-2xl">
        <h3 class="text-sm font-bold text-surface-on">Jalankan Analisis Data Baru</h3>
        
        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Judul Review</label>
            <input
              type="text"
              v-model="newReviewForm.title"
              placeholder="e.g. Analisis Performa Penjualan & Margin Agustus"
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on"
            />
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Nama File Sumber</label>
            <input
              type="text"
              v-model="newReviewForm.sourceFile"
              placeholder="e.g. sales_transactions_aug2026.xlsx"
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on"
            />
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Ringkasan Awal / Prompt Instruksi Analisis</label>
            <textarea
              v-model="newReviewForm.summary"
              rows="3"
              placeholder="Jelaskan fokus analisis: Cari anomali order, perhitungan margin, dan rekomendasi stok..."
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high/60">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 text-xs font-medium text-surface-muted hover:text-surface-on"
          >
            Batal
          </button>
          <button
            @click="submitNewReview"
            class="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90"
          >
            Mulai Analisis
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DataReview } from '../../types'
import { useDataReviewStore } from '../../stores/dataReview'

defineProps<{
  reviews: DataReview[]
}>()

defineEmits<{
  (e: 'inspect-review', review: DataReview): void
}>()

const reviewStore = useDataReviewStore()
const showCreateModal = ref(false)

const newReviewForm = ref({
  title: '',
  sourceFile: '',
  summary: ''
})

async function submitNewReview() {
  if (!newReviewForm.value.title.trim()) return
  await reviewStore.createReview({
    projectId: 'prj-marketing',
    projectName: 'Marketing & Digital Business',
    title: newReviewForm.value.title,
    sourceFile: newReviewForm.value.sourceFile || 'dataset_export.xlsx',
    sourceFormat: 'xlsx',
    status: 'Completed',
    summary: newReviewForm.value.summary || 'Analisis data transaksi berhasil dijalankan.',
    keyMetrics: [
      { label: 'Data Rows Processed', value: '4,280', isPositive: true },
      { label: 'Calculated Variance', value: '+8.4%', isPositive: true }
    ],
    anomalies: ['Tidak ada anomali kritis yang melanggar batas ambang data.'],
    trends: ['Peningkatan konsisten pada segmen produk utama.'],
    findings: ['Data tervalidasi lengkap dan siap dikonversi ke materi publikasi.'],
    risks: ['Perlu verifikasi lanjutan terhadap data supplier minggu ke-4.'],
    recommendations: ['Susun materi konten sosial untuk dipublikasikan ke Instagram dan TikTok.'],
    sourceReferences: ['Dataset file'],
    artifacts: [
      { id: `art-${Date.now()}`, name: 'Summary_Report.pdf', type: 'pdf', size: '540 KB', url: '/artifacts/summary.pdf' }
    ],
    analyzedByWorkerName: 'Raka (Planner / Data Analyst)'
  })

  showCreateModal.value = false
  newReviewForm.value = { title: '', sourceFile: '', summary: '' }
}
</script>
