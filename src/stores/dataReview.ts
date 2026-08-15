import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataReview, ContentItem } from '../types'
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
  const isAnalyzing = ref(false)
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

  // =========================================================================
  // STEP 1: SIDE HUSTLE DATA AUDIT ENGINE ("Review data penjualan minggu ini")
  // =========================================================================
  async function runSalesDataAudit(datasetName = 'penjualan_minggu_ini.xlsx'): Promise<DataReview> {
    AuthorizationService.assertPermission('datareview:analyze')
    isAnalyzing.value = true

    // Simulate AI data parsing & anomaly detection
    await new Promise((resolve) => setTimeout(resolve, 900))

    const now = new Date()
    const reviewData: Omit<DataReview, 'id' | 'createdAt'> = {
      projectId: 'prj-marketing',
      projectName: 'Marketing & Digital Business',
      title: `Audit Penjualan & Operasional Bisnis — Minggu ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
      sourceFile: datasetName,
      sourceFormat: datasetName.endsWith('.csv') ? 'csv' : 'xlsx',
      status: 'Completed',
      summary:
        'Total omzet minggu ini tercatat Rp18.450.000 (naik +14.2% dari minggu lalu). Terdeteksi anomali penurunan order di hari Selasa (-28%), namun Average Order Value (AOV) melonjak tinggi didorong paket bundle.',
      keyMetrics: [
        { label: 'Total Omzet (Revenue)', value: 'Rp18.450.000', change: '+14.2%', isPositive: true },
        { label: 'Total Transaksi', value: '142 orders', change: '-3.4%', isPositive: false },
        { label: 'Rata-rata Order (AOV)', value: 'Rp129.900', change: '+18.1%', isPositive: true },
        { label: 'Estimasi Gross Profit', value: 'Rp7.240.000 (39.2%)', change: '+2.4%', isPositive: true }
      ],
      anomalies: [
        'Anomali Hari Selasa: Order turun drastis -28% karena kehabisan stok varian terlaris.',
        'Margin SKU-B tipis (hanya 12%) akibat kenaikan ongkos packaging lokal.'
      ],
      trends: [
        '78% pembeli memilih metode pembayaran QRIS & Transfer instan.',
        'Paket Bundling 2-in-1 menyumbang 54% total omzet mingguan.'
      ],
      findings: [
        'Produk bundling memiliki tingkat konversi 2.4x lebih tinggi dibanding jual satuan.',
        'Pelanggan loyal melakukan repeat order dalam rentang 10-14 hari.'
      ],
      risks: [
        'Potensi kehabisan stok varian utama jika reorder ke supplier terlambat >3 hari.',
        'SKU-B perlu penyesuaian harga jual agar margin kembali sehat di atas 30%.'
      ],
      recommendations: [
        'Segera reorder bahan baku untuk varian best seller sebelum hari Rabu.',
        'Buat 3 materi konten edukasi & promo bundling untuk mendongkrak penjualan minggu depan.',
        'Naikkan harga SKU-B sebesar Rp4.000 atau ubah format bundling agar tetap profitable.'
      ],
      sourceReferences: [
        `File: ${datasetName} (142 baris transaksi)`,
        'Rekap Pembukuan Kas & Mutasi Bank',
        'Laporan Stok Fisik Toko'
      ],
      artifacts: [
        {
          id: `art-${Date.now()}-pdf`,
          name: `Laporan_Eksekutif_Penjualan_Mingguan.pdf`,
          type: 'pdf',
          size: '640 KB',
          url: '/artifacts/laporan_penjualan_mingguan.pdf'
        },
        {
          id: `art-${Date.now()}-md`,
          name: `Executive_Summary_Findings.markdown`,
          type: 'markdown',
          size: '42 KB',
          url: '/artifacts/summary.md'
        },
        {
          id: `art-${Date.now()}-csv`,
          name: `Cleaned_Sales_Metrics.csv`,
          type: 'csv',
          size: '95 KB',
          url: '/artifacts/metrics.csv'
        }
      ],
      analyzedByWorkerId: 'emp-raka',
      analyzedByWorkerName: 'Raka (Planner / Business Operations Analyst)',
      completedAt: new Date().toISOString()
    }

    const created = await repo.create(reviewData)
    reviews.value.unshift(created)
    isAnalyzing.value = false

    toast.success(`Audit data penjualan selesai! 3 artefak dokumen berhasil disimpan.`)
    return created
  }

  // =========================================================================
  // STEP 2: CONVERT INSIGHT INTO 3 CONTENT CAMPAIGNS ("Buat 3 konten dari analisis tadi")
  // =========================================================================
  async function generate3ContentCampaignsFromReview(reviewId: string): Promise<ContentItem[]> {
    AuthorizationService.assertPermission('content:create')
    const review = reviews.value.find((r) => r.id === reviewId)
    if (!review) throw new Error('Data review tidak ditemukan')

    const createdContents: ContentItem[] = []
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const threeDaysAfter = new Date(Date.now() + 72 * 60 * 60 * 1000)

    // 1. KONTEN 1: Edukasi / Behind The Scenes (Story & Insight)
    const content1 = await contentStore.createContent({
      projectId: review.projectId,
      projectName: review.projectName,
      title: 'Kenapa Omzet Naik tapi Kas Sering Boncos? (Studi Kasus Penjualan)',
      caption:
        'Banyak pebisnis senang melihat omzet naik, tapi lupa cek margin dan dead stock. Ini hasil evaluasi data penjualan mingguan dan cara mengamankan cashflow bisnis kamu.',
      targetPlatforms: ['instagram', 'threads', 'facebook_page'],
      dataReviewId: review.id,
      status: 'Approved',
      approvalPolicy: 'Review',
      platformVersions: {
        instagram: {
          caption:
            'Omzet naik 14% tapi uang kas kok gak kelihatan? ⚠️📊\n\nSetelah kita bedah data penjualan minggu ini, ternyata penyebab utamanya adalah:\n1. Margin produk tertentu terlalu tipis (<15%)\n2. Biaya kemasan dan admin tidak tercatat rapi\n3. Stok menumpuk di barang yang lambat laku\n\nSolusinya? Fokus pada produk bundling dengan Average Order Value tinggi! 🚀\n\n#BisnisSideHustle #TipsBisnis #ManajemenKeuangan #SatriaWorkforce #UMKM',
          hashtags: ['#BisnisSideHustle', '#TipsBisnis', '#ManajemenKeuangan', '#SatriaWorkforce']
        },
        threads: {
          caption:
            'Omzet naik 14% tapi uang di rekening tetap seret? Jangan-jangan margin kamu kemakan biaya tersembunyi. Fokus ke 3 hal ini: safety stock, paket bundling, dan audit mingguan rutin.'
        },
        facebook_page: {
          caption:
            'Evaluasi Keuangan Mingguan: Bagaimana kami mengoptimalkan Average Order Value (AOV) hingga naik +18% hanya dengan menyusun paket produk 2-in-1.',
          cta: 'Simak artikel selengkapnya di portal bisnis Satria.'
        }
      }
    })
    await contentStore.scheduleContent(content1.id, tomorrow.toISOString())
    createdContents.push(content1)

    // 2. KONTEN 2: Promo / Solutif Penjualan (Conversion Offer)
    const content2 = await contentStore.createContent({
      projectId: review.projectId,
      projectName: review.projectName,
      title: 'Paket Hemat Bundling Best Seller Minggu Ini (Promo Terbatas)',
      caption:
        'Berdasarkan data produk terlaris, kami hadirkan paket hemat spesial untuk kamu hemat hingga 25% dibanding beli satuan!',
      targetPlatforms: ['instagram', 'tiktok', 'facebook_group'],
      dataReviewId: review.id,
      status: 'Approved',
      approvalPolicy: 'Review',
      platformVersions: {
        instagram: {
          caption:
            'PROMO BUNDLE MINGGU INI! 🔥\n\nPaket 2-in-1 favorit pelanggan kini hadir dengan diskon spesial hemat s/d 25%. Stok sangat terbatas hanya untuk 50 pemesan pertama!\n\nKlik link di bio untuk amankan kuota kamu sekarang! 📦✨',
          hashtags: ['#PromoSpesial', '#DiskonMingguIni', '#BestSeller', '#BelanjaHemat']
        },
        tiktok: {
          hook: 'Yang mau belanja hemat minggu ini kumpul! Paket bundle ini diskon 25%!',
          script:
            'Scene 1: Buka paket unboxing produk bundling.\nVoiceover: "Ini dia paket yang paling banyak dibeli minggu ini! Hemat 25% dibanding beli satuan."\nScene 2: Tunjukkan detail produk.\nVoiceover: "Khusus minggu ini, free ongkir ke seluruh kota!"',
          onScreenText: ['Diskon 25% Bundle', 'Gratis Ongkir Terbatas'],
          cta: 'Klik keranjang kuning sekarang!'
        }
      }
    })
    await contentStore.scheduleContent(content2.id, dayAfter.toISOString())
    createdContents.push(content2)

    // 3. KONTEN 3: Tips & Trik Praktis (Authority & Engagement)
    const content3 = await contentStore.createContent({
      projectId: review.projectId,
      projectName: review.projectName,
      title: '3 Rumus Cepat Menghitung Safety Stock agar Tidak Kehabisan Barang',
      caption:
        'Jangan sampai calon pembeli kabur gara-gara stok habis di hari peak order. Terapkan rumus reorder point otomatis ini.',
      targetPlatforms: ['threads', 'tiktok', 'facebook_page'],
      dataReviewId: review.id,
      status: 'Approved',
      approvalPolicy: 'Review',
      platformVersions: {
        threads: {
          caption:
            'Rumus simpel reorder stock untuk side hustle:\nReorder Point = (Penjualan Harian x Lead Time Supplier) + Safety Stock 20%.\nSimpan postingan ini biar gak keabisan stok pas orderan lagi rame!'
        },
        tiktok: {
          hook: 'Toko kamu sering kehabisan stok pas lagi rame? Ini rumus hitungnya!',
          script:
            'Voiceover: "Gunakan rumus Lead Time x Penjualan Harian + Safety Stock 20%. Dengan cara ini, kamu gak bakal pernah tolak orderan lagi!"',
          onScreenText: ['Rumus Stok Toko', 'Cegah Kehabisan Barang']
        },
        facebook_page: {
          caption:
            'Panduan Operasional Toko: Cara sederhana menghitung persediaan pengaman (Safety Stock) agar operasional pengiriman selalu tepat waktu.',
          cta: 'Bagikan postingan ini kepada tim pengelola inventaris Anda.'
        }
      }
    })
    await contentStore.scheduleContent(content3.id, threeDaysAfter.toISOString())
    createdContents.push(content3)

    // Link back to review
    await repo.update(review.id, { generatedContentId: content1.id })
    review.generatedContentId = content1.id

    toast.success('3 konten strategis (Edukasi, Promo Bundle, Tips Stok) berhasil dibuat & dijadwalkan di Kalender!')
    return createdContents
  }

  // Alias compatibility
  async function generateContentFromReview(reviewId: string) {
    const list = await generate3ContentCampaignsFromReview(reviewId)
    return list[0]
  }

  return {
    reviews,
    isLoading,
    isAnalyzing,
    selectedProjectId,
    filteredReviews,
    loadReviews,
    getReviewById,
    createReview,
    runSalesDataAudit,
    generate3ContentCampaignsFromReview,
    generateContentFromReview
  }
})
