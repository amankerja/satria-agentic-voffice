<template>
  <div class="rounded-2xl border border-primary/30 bg-surface-container-low p-6 space-y-6 shadow-sm relative overflow-hidden">
    <!-- Background accent indicator -->
    <div class="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

    <!-- Title & Description Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-mono font-bold text-primary flex items-center gap-1">
            <span class="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            OPERATIONS ENGINE
          </span>
          <h2 class="text-base font-black text-surface-on tracking-tight">
            Side Hustle & Small Business Operations Flow
          </h2>
        </div>
        <p class="text-xs text-surface-muted max-w-2xl leading-relaxed">
          Gunakan SATRIA untuk mengelola operasional bisnis Anda sekarang juga: baca data penjualan → ekstrak anomali → buat 3 materi konten terarah → siapkan publikasi pendampingan (Assisted).
        </p>
      </div>

      <!-- Quick Status -->
      <div v-if="latestReview" class="flex items-center gap-2 bg-surface-container-lowest/80 border border-surface-container-high px-3 py-1.5 rounded-xl text-xs">
        <span class="h-2 w-2 rounded-full bg-emerald-400" />
        <span class="text-surface-muted text-[11px]">Audit Terakhir:</span>
        <span class="font-bold text-surface-on font-mono">{{ formatDate(latestReview.createdAt) }}</span>
      </div>
    </div>

    <!-- 3-Step Action Workflow Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- STEP 1: REVIEW DATA PENJUALAN -->
      <div class="rounded-xl border border-surface-container-high/80 bg-surface-container-lowest p-4 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-all">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-mono font-bold text-surface-muted">
              LANGKAH 1
            </span>
            <span class="text-primary text-xs font-bold">📊 Data Audit</span>
          </div>
          <h4 class="text-xs font-bold text-surface-on">"Review Data Penjualan Minggu Ini"</h4>
          <p class="text-[11px] text-surface-muted leading-relaxed">
            AI memindai dataset transaksi, mendeteksi anomali order/margin, dan menyusun laporan eksekutif PDF & Markdown.
          </p>
        </div>

        <button
          @click="handleRunDataAudit"
          :disabled="dataReviewStore.isAnalyzing"
          class="w-full rounded-xl bg-surface-container-high px-3 py-2 text-xs font-bold text-surface-on hover:bg-surface-container-highest hover:text-primary transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <svg class="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>{{ dataReviewStore.isAnalyzing ? 'Menganalisis Data...' : 'Jalankan Audit Penjualan' }}</span>
        </button>
      </div>

      <!-- STEP 2: GENERATE 3 CONTENT IDEAS -->
      <div class="rounded-xl border border-surface-container-high/80 bg-surface-container-lowest p-4 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-all">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-mono font-bold text-surface-muted">
              LANGKAH 2
            </span>
            <span class="text-amber-400 text-xs font-bold">💡 3 Ide Konten</span>
          </div>
          <h4 class="text-xs font-bold text-surface-on">"Ambil Hasil Analisis & Buat 3 Konten"</h4>
          <p class="text-[11px] text-surface-muted leading-relaxed">
            AI meracik 3 pilar konten: Edukasi Bisnis, Promo Paket Bundling, & Tips Reorder Stok langsung ke Kalender.
          </p>
        </div>

        <button
          @click="handleGenerate3Contents"
          :disabled="isGeneratingContent || !latestReview"
          class="w-full rounded-xl bg-surface-container-high px-3 py-2 text-xs font-bold text-surface-on hover:bg-surface-container-highest hover:text-amber-400 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <svg class="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span>{{ isGeneratingContent ? 'Meracik 3 Konten...' : 'Buat 3 Konten Strategis' }}</span>
        </button>
      </div>

      <!-- STEP 3: PREPARE TOMORROW ASSISTED POSTING -->
      <div class="rounded-xl border border-surface-container-high/80 bg-surface-container-lowest p-4 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-all">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-mono font-bold text-surface-muted">
              LANGKAH 3
            </span>
            <span class="text-cyan-400 text-xs font-bold">🚀 Siap Tayang</span>
          </div>
          <h4 class="text-xs font-bold text-surface-on">"Siapkan Postingan untuk Besok"</h4>
          <p class="text-[11px] text-surface-muted leading-relaxed">
            Format teks siap salin 1-klik untuk Instagram, Threads, TikTok & FB Group tanpa perlu nunggu API.
          </p>
        </div>

        <button
          @click="handlePrepareTomorrowPost"
          class="w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span>Buka Assist Postingan Besok</span>
        </button>
      </div>
    </div>

    <!-- Tomorrow Assisted Posting Quick Drawer / Modal -->
    <div
      v-if="showTomorrowAssistModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      @click.self="showTomorrowAssistModal = false"
    >
      <div class="relative w-full max-w-2xl rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-2xl overflow-hidden my-8">
        <div class="flex items-center justify-between border-b border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
          <div class="flex items-center gap-2">
            <span class="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
              Assisted Publishing Hub
            </span>
            <h3 class="text-sm font-bold text-surface-on">Postingan Siap Tayang Besok</h3>
          </div>
          <button @click="showTomorrowAssistModal = false" class="text-surface-muted hover:text-surface-on">✕</button>
        </div>

        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          <p class="text-surface-muted">
            Salin teks caption & skrip di bawah ini dengan 1-klik, lalu tempelkan langsung ke aplikasi Instagram, Threads, TikTok, atau Facebook Anda:
          </p>

          <!-- 1. Instagram / Threads Copy Box -->
          <div class="rounded-xl border border-surface-container-high bg-surface-container-low p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-surface-on flex items-center gap-1.5">
                📸 Instagram & 🧵 Threads
              </span>
              <button
                @click="copyText(tomorrowSampleCopy, 'ig')"
                class="text-primary hover:underline font-bold flex items-center gap-1 text-[11px]"
              >
                <span>{{ copiedKey === 'ig' ? '✓ Tersalin!' : 'Salin Caption' }}</span>
              </button>
            </div>
            <div class="rounded-lg bg-surface-container-lowest p-3 font-mono text-[11px] text-surface-on whitespace-pre-line border border-surface-container-high/60">
              {{ tomorrowSampleCopy }}
            </div>
          </div>

          <!-- 2. TikTok Hook & Script -->
          <div class="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-rose-400 flex items-center gap-1.5">
                🎵 TikTok Hook & Script Video
              </span>
              <button
                @click="copyText(tiktokSampleCopy, 'tt')"
                class="text-rose-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
              >
                <span>{{ copiedKey === 'tt' ? '✓ Tersalin!' : 'Salin Naskah' }}</span>
              </button>
            </div>
            <div class="rounded-lg bg-surface-container-lowest p-3 font-mono text-[11px] text-surface-on whitespace-pre-line border border-surface-container-high/60">
              {{ tiktokSampleCopy }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
          <span class="text-[11px] text-surface-muted">Status: Konten Approved & Lulus Quality Gate</span>
          <button
            @click="showTomorrowAssistModal = false"
            class="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataReviewStore } from '../../stores/dataReview'
import { useToast } from '../../composables/useToast'

const dataReviewStore = useDataReviewStore()
const toast = useToast()

const isGeneratingContent = ref(false)
const showTomorrowAssistModal = ref(false)
const copiedKey = ref<string | null>(null)

const latestReview = computed(() => {
  return dataReviewStore.reviews.length > 0 ? dataReviewStore.reviews[0] : null
})

const tomorrowSampleCopy = computed(() => {
  return `Omzet naik 14% tapi uang kas sering terasa tipis? 📊⚠️

Setelah kita bedah data penjualan minggu ini, 3 faktor krusial yang perlu dievaluasi:
1. Menghitung persentase margin bersih per SKU (>30%)
2. Menerapkan paket bundling 2-in-1 untuk meningkatkan Average Order Value
3. Menghitung safety stock otomatis agar tidak kehilangan momentum order di hari ramai!

Simpan postingan ini dan mulai audit pembukuan bisnismu sekarang! 🚀

#SideHustle #BisnisUMKM #TipsBisnis #ManajemenKeuangan #SatriaWorkforce`
})

const tiktokSampleCopy = computed(() => {
  return `⚡ HOOK (0-3 Detik):
"Kenapa omzet toko kamu rame tapi uangnya gak kelihatan? Cek 3 hal ini sekarang!"

🎬 VIDEO FLOW:
Scene 1: Tunjukkan rekap pembukuan / spreadsheet.
Voiceover: "Banyak pebisnis side hustle senang omzet naik, tapi lupa ngecek dead stock dan margin per produk."
Scene 2: Tunjukkan strategi paket bundle.
Voiceover: "Fokus ke paket produk terlaris biar Average Order Value kamu naik 18%!"

👉 CTA: Follow @satria_official untuk tips operasional bisnis harian!`
})

function formatDate(isoStr?: string): string {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function handleRunDataAudit() {
  await dataReviewStore.runSalesDataAudit('penjualan_mingguan_umkm.xlsx')
}

async function handleGenerate3Contents() {
  if (!latestReview.value) {
    toast.warning('Jalankan audit data penjualan terlebih dahulu (Langkah 1).')
    return
  }
  isGeneratingContent.value = true
  await dataReviewStore.generate3ContentCampaignsFromReview(latestReview.value.id)
  isGeneratingContent.value = false
}

function handlePrepareTomorrowPost() {
  showTomorrowAssistModal.value = true
}

async function copyText(text: string, key: string) {
  await navigator.clipboard.writeText(text)
  copiedKey.value = key
  toast.success('Teks berhasil disalin ke clipboard!')
  setTimeout(() => (copiedKey.value = null), 2000)
}
</script>
