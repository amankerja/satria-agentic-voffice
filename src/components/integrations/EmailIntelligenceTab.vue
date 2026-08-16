<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="rounded-2xl border border-primary/30 bg-surface-container-low p-6 space-y-4 shadow-sm relative overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-400 flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-cyan-400" :class="emailStore.isProcessing ? 'animate-pulse' : ''" />
              MODE 2 — EMAIL INTELLIGENCE & INGESTION
            </span>
            <h3 class="text-base font-black text-surface-on">
              Selective Email Data Source & Reporting Hub
            </h3>
          </div>
          <p class="text-xs text-surface-muted mt-1 max-w-2xl leading-relaxed">
            Email berfungsi murni sebagai <strong>sumber data & laporan terstruktur</strong>, bukan pemicu coding. Menggunakan arsitektur 3 lapisan:
            <strong>Layer 1 Filter</strong> (Cepat & Hemat) → <strong>Layer 2 Classifier</strong> (Kategori Bisnis) → <strong>Layer 3 Structured Extractor</strong> (Rekap Finansial).
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handleRunEmailPipeline"
            :disabled="emailStore.isProcessing"
            class="rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-cyan-400 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <svg v-if="emailStore.isProcessing" class="h-4 w-4 animate-spin text-surface-container-lowest" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{{ emailStore.isProcessing ? 'Menganalisis Email...' : 'Pindai & Ekstraksi Data Email' }}</span>
          </button>
        </div>
      </div>

      <!-- 3 Layer Architecture Diagram -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-1">
          <div class="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-400">
            <span>LAYER 1: FILTER</span>
            <span>0 LLM COST</span>
          </div>
          <p class="text-[11px] text-surface-muted">
            Penyaringan cepat berbasis Domain, Sender & Keyword. Email marketing/spam langsung diabaikan.
          </p>
        </div>

        <div class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-1">
          <div class="flex items-center justify-between text-[11px] font-mono font-bold text-blue-400">
            <span>LAYER 2: CLASSIFIER</span>
            <span>BUSINESS DOMAIN</span>
          </div>
          <p class="text-[11px] text-surface-muted">
            Klasifikasi cerdas: FINANCE (Mutasi Bank), PAYMENT (ShopeePay/QRIS), SALES (Marketplace).
          </p>
        </div>

        <div class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-1">
          <div class="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-400">
            <span>LAYER 3: EXTRACTOR</span>
            <span>STRUCTURED JSON</span>
          </div>
          <p class="text-[11px] text-surface-muted">
            Ekstraksi nominal Rupiah, MDR fee, nomor referensi, tanggal, dan sintesis laporan rekap.
          </p>
        </div>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Total Pemasukan & Settlement</p>
        <p class="text-2xl font-black text-emerald-400 font-mono">{{ formatRupiah(emailStore.totalIncome) }}</p>
      </div>

      <div class="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Total Pengeluaran / Debet</p>
        <p class="text-2xl font-black text-rose-400 font-mono">{{ formatRupiah(emailStore.totalExpense) }}</p>
      </div>

      <div class="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Net Saldo Operasional</p>
        <p class="text-2xl font-black text-cyan-400 font-mono">{{ formatRupiah(emailStore.netRevenue) }}</p>
      </div>

      <div class="rounded-2xl border border-surface-container-high/60 bg-surface-container-low p-4 space-y-1">
        <p class="text-[11px] font-medium text-surface-muted uppercase tracking-wider">Filter Efisiensi</p>
        <p class="text-sm font-mono text-surface-on pt-1">
          <strong class="text-emerald-400">{{ emailStore.passedFilterCount }}</strong> diproses /
          <span class="text-surface-muted">{{ emailStore.ignoredCount }} diabaikan</span>
        </p>
      </div>
    </div>

    <!-- Main Content: Extracted Ledger & Filter Rules -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 2 Cols: Extracted Transactions Ledger Table -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider font-mono">
            Buku Kas Transaksi Terstruktur (Extracted Ledger)
          </h4>
          <span class="text-xs font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-bold">
            {{ emailStore.transactions.length }} Transaksi
          </span>
        </div>

        <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-surface-container-lowest border-b border-surface-container-high text-surface-muted uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th class="py-3 px-3.5 font-bold">Tanggal</th>
                  <th class="py-3 px-3.5 font-bold">Sumber</th>
                  <th class="py-3 px-3.5 font-bold">Kategori / Tipe</th>
                  <th class="py-3 px-3.5 font-bold">Nominal</th>
                  <th class="py-3 px-3.5 font-bold">Referensi</th>
                  <th class="py-3 px-3.5 font-bold">Pihak / Merchant</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-container-high/60 text-surface-on font-mono">
                <tr
                  v-for="tx in emailStore.transactions"
                  :key="tx.id"
                  class="hover:bg-surface-container-lowest/80 transition-colors"
                >
                  <td class="py-2.5 px-3.5 text-surface-muted text-[11px] whitespace-nowrap">
                    {{ tx.transactionDate }}
                  </td>
                  <td class="py-2.5 px-3.5 font-bold text-xs" :class="getSourceClass(tx.source)">
                    {{ tx.source }}
                  </td>
                  <td class="py-2.5 px-3.5">
                    <span
                      class="rounded px-2 py-0.5 text-[10px] font-bold"
                      :class="tx.type === 'INCOME' || tx.type === 'SETTLEMENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'"
                    >
                      {{ tx.category }} &bull; {{ tx.type }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3.5 font-bold text-xs" :class="tx.type === 'EXPENSE' ? 'text-rose-400' : 'text-emerald-400'">
                    {{ tx.type === 'EXPENSE' ? '-' : '+' }}{{ formatRupiah(tx.amount) }}
                  </td>
                  <td class="py-2.5 px-3.5 text-surface-muted text-[11px]">
                    {{ tx.referenceNumber }}
                  </td>
                  <td class="py-2.5 px-3.5 text-surface-on text-xs truncate max-w-xs">
                    {{ tx.senderOrMerchantName }}
                  </td>
                </tr>
                <tr v-if="emailStore.transactions.length === 0">
                  <td colspan="6" class="text-center py-8 text-surface-muted text-xs font-sans">
                    Klik tombol <strong>"Pindai & Ekstraksi Data Email"</strong> di atas untuk menjalankan pipeline 3 lapisan.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 1 Col: Layer 1 Filter Rules Settings -->
      <div class="space-y-4">
        <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider font-mono">
          Aturan Filter Layer 1 (Metadata)
        </h4>

        <div class="space-y-3">
          <div
            v-for="rule in emailStore.rules"
            :key="rule.id"
            class="rounded-xl border border-surface-container-high/60 bg-surface-container-low p-3.5 space-y-2"
          >
            <div class="flex items-center justify-between">
              <h5 class="text-xs font-bold text-surface-on truncate">{{ rule.name }}</h5>
              <input
                type="checkbox"
                :checked="rule.enabled"
                @change="emailStore.toggleRule(rule.id)"
                class="h-4 w-4 rounded border-surface-container-high text-cyan-400 focus:ring-0 cursor-pointer"
              />
            </div>
            <div class="text-[11px] text-surface-muted font-mono space-y-0.5">
              <p>Domain: <span class="text-surface-on">{{ rule.senderDomainPattern || '*' }}</span></p>
              <p v-if="rule.subjectKeywords">Kata Kunci: <span class="text-cyan-400">{{ rule.subjectKeywords.join(', ') }}</span></p>
              <p>Target: <strong class="text-emerald-400">{{ rule.targetCategory }}</strong> ({{ rule.targetSource }})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useEmailIntelligenceStore } from '../../stores/emailIntelligence'

const emailStore = useEmailIntelligenceStore()

onMounted(async () => {
  if (emailStore.transactions.length === 0) {
    await emailStore.processInboxEmails()
  }
})

async function handleRunEmailPipeline() {
  await emailStore.processInboxEmails()
}

function formatRupiah(num?: number): string {
  if (!num) return 'Rp 0'
  return 'Rp ' + num.toLocaleString('id-ID')
}

function getSourceClass(source: string): string {
  switch (source) {
    case 'BANK':
      return 'text-blue-400'
    case 'SHOPEEPAY':
      return 'text-amber-400'
    case 'PAYMENT_GATEWAY':
      return 'text-emerald-400'
    case 'MARKETPLACE':
      return 'text-purple-400'
    default:
      return 'text-surface-on'
  }
}
</script>
