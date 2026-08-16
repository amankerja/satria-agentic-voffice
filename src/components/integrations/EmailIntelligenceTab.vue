<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="rounded-2xl border border-primary/30 bg-surface-container-low p-6 space-y-4 shadow-sm relative overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-400 flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-cyan-400" :class="emailStore.isProcessing ? 'animate-pulse' : ''" />
              MODE 2 — EMAIL INTELLIGENCE & RECONCILIATION
            </span>
            <h3 class="text-base font-black text-surface-on">
              Selective Ingestion & Accounting Reconciliation Hub
            </h3>
          </div>
          <p class="text-xs text-surface-muted mt-1 max-w-2xl leading-relaxed">
            Email diperlakukan sebagai <strong>Extracted Evidence</strong>. Sistem menerapkan jaminan akuntansi 4 tahap:
            <strong>Extracted</strong> &rarr; <strong>Verified</strong> &rarr; <strong>Reconciled (Anti-Triple-Counting)</strong> &rarr; <strong>Final Ledger</strong>, mencegah duplikasi perhitungan antara Payment Gateway, Settlement, dan Mutasi Bank.
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
            <span>{{ emailStore.isProcessing ? 'Menganalisis & Merekonsiliasi...' : 'Pindai, Ekstraksi & Rekonsiliasi' }}</span>
          </button>
        </div>
      </div>

      <!-- 4 Stages Reconciliation Architecture Diagram -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-1">
          <div class="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-400">
            <span>1. EXTRACTED</span>
            <span>EVIDENCE</span>
          </div>
          <p class="text-[11px] text-surface-muted">
            Ekstraksi teks mentah ke objek JSON (Rp, tanggal, ref) tanpa klaim sah instan.
          </p>
        </div>

        <div class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-1">
          <div class="flex items-center justify-between text-[11px] font-mono font-bold text-blue-400">
            <span>2. VERIFIED</span>
            <span>SANITY PASS</span>
          </div>
          <p class="text-[11px] text-surface-muted">
            Pengecekan batas kewajaran nominal (max Rp 500jt cap), format tanggal & integritas.
          </p>
        </div>

        <div class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-1">
          <div class="flex items-center justify-between text-[11px] font-mono font-bold text-amber-400">
            <span>3. RECONCILED</span>
            <span>DEDUPLICATION</span>
          </div>
          <p class="text-[11px] text-surface-muted">
            Pencocokan silang Bank + ShopeePay + Midtrans untuk menyatukan 1 transaksi tunggal.
          </p>
        </div>

        <div class="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-1">
          <div class="flex items-center justify-between text-[11px] font-mono font-bold text-emerald-400">
            <span>4. FINAL LEDGER</span>
            <span>CANONICAL</span>
          </div>
          <p class="text-[11px] text-surface-muted">
            Entri buku kas bersih siap audit, menghasilkan laporan laba rugi & mutasi riil.
          </p>
        </div>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Omset Bruto Kanonikal</p>
        <p class="text-2xl font-black text-emerald-400 font-mono">{{ formatRupiah(emailStore.totalIncome) }}</p>
      </div>

      <div class="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Pengeluaran & Beban Debet</p>
        <p class="text-2xl font-black text-rose-400 font-mono">{{ formatRupiah(emailStore.totalExpense) }}</p>
      </div>

      <div class="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Net Kas Bersih (Setelah Fee)</p>
        <p class="text-2xl font-black text-cyan-400 font-mono">{{ formatRupiah(emailStore.netRevenue) }}</p>
      </div>

      <div class="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
        <p class="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Anti-Triple-Counting</p>
        <p class="text-sm font-mono text-surface-on pt-1">
          <strong class="text-amber-400 font-black text-lg">{{ emailStore.totalDuplicatesMerged }}</strong> duplikasi multi-channel dicegah
        </p>
      </div>
    </div>

    <!-- View Switcher Tabs -->
    <div class="flex items-center gap-2 border-b border-surface-container-high pb-2">
      <button
        @click="activeSubTab = 'reconciled'"
        class="px-4 py-2 text-xs font-bold font-mono rounded-xl transition-all"
        :class="activeSubTab === 'reconciled' ? 'bg-primary text-surface-container-lowest shadow-sm' : 'text-surface-muted hover:text-surface-on'"
      >
        📋 Buku Kas Kanonikal ({{ emailStore.reconciledEntries.length }} Entri Sah)
      </button>
      <button
        @click="activeSubTab = 'raw_evidence'"
        class="px-4 py-2 text-xs font-bold font-mono rounded-xl transition-all"
        :class="activeSubTab === 'raw_evidence' ? 'bg-primary text-surface-container-lowest shadow-sm' : 'text-surface-muted hover:text-surface-on'"
      >
        🔍 Jejak Bukti Mentah ({{ emailStore.transactions.length }} Raw Evidence)
      </button>
      <button
        @click="activeSubTab = 'rules'"
        class="px-4 py-2 text-xs font-bold font-mono rounded-xl transition-all"
        :class="activeSubTab === 'rules' ? 'bg-primary text-surface-container-lowest shadow-sm' : 'text-surface-muted hover:text-surface-on'"
      >
        ⚙️ Aturan Filter Layer 1 ({{ emailStore.rules.length }} Rules)
      </button>
    </div>

    <!-- SUB-TAB 1: Reconciled Canonical Ledger -->
    <div v-if="activeSubTab === 'reconciled'" class="space-y-4">
      <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-surface-container-lowest border-b border-surface-container-high text-surface-muted uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th class="py-3 px-3.5 font-bold">Referensi Kanonikal</th>
                <th class="py-3 px-3.5 font-bold">Sumber Bukti Terkorelasi</th>
                <th class="py-3 px-3.5 font-bold">Tanggal</th>
                <th class="py-3 px-3.5 font-bold">Bruto (Gross)</th>
                <th class="py-3 px-3.5 font-bold">MDR Fee</th>
                <th class="py-3 px-3.5 font-bold">Kas Bersih</th>
                <th class="py-3 px-3.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-container-high/60 text-surface-on font-mono">
              <tr
                v-for="entry in emailStore.reconciledEntries"
                :key="entry.id"
                class="hover:bg-surface-container-lowest/80 transition-colors"
              >
                <td class="py-3 px-3.5 font-bold text-cyan-400">
                  {{ entry.canonicalReference }}
                </td>
                <td class="py-3 px-3.5">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span
                      v-for="src in entry.evidenceSources"
                      :key="src"
                      class="rounded bg-surface-container-lowest border border-surface-container-high px-1.5 py-0.5 text-[10px] font-bold"
                    >
                      {{ src }}
                    </span>
                  </div>
                </td>
                <td class="py-3 px-3.5 text-surface-muted text-[11px]">
                  {{ entry.transactionDate }}
                </td>
                <td class="py-3 px-3.5 font-bold text-xs text-surface-on">
                  {{ formatRupiah(entry.grossAmount) }}
                </td>
                <td class="py-3 px-3.5 text-rose-400 text-xs">
                  -{{ formatRupiah(entry.totalFee) }}
                </td>
                <td class="py-3 px-3.5 font-bold text-xs text-emerald-400">
                  {{ formatRupiah(entry.netAmount) }}
                </td>
                <td class="py-3 px-3.5">
                  <span class="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                    {{ entry.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="emailStore.reconciledEntries.length === 0">
                <td colspan="7" class="text-center py-8 text-surface-muted text-xs font-sans">
                  Belum ada data rekonsiliasi. Klik <strong>"Pindai, Ekstraksi & Rekonsiliasi"</strong> di atas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SUB-TAB 2: Raw Extracted Evidence Audit Trail -->
    <div v-else-if="activeSubTab === 'raw_evidence'" class="space-y-4">
      <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-surface-container-lowest border-b border-surface-container-high text-surface-muted uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th class="py-3 px-3.5 font-bold">Tanggal</th>
                <th class="py-3 px-3.5 font-bold">Sumber</th>
                <th class="py-3 px-3.5 font-bold">Nominal Mentah</th>
                <th class="py-3 px-3.5 font-bold">Referensi</th>
                <th class="py-3 px-3.5 font-bold">Status Siklus</th>
                <th class="py-3 px-3.5 font-bold">Relasi Duplikasi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-container-high/60 text-surface-on font-mono">
              <tr
                v-for="tx in emailStore.transactions"
                :key="tx.id"
                class="hover:bg-surface-container-lowest/80 transition-colors"
              >
                <td class="py-2.5 px-3.5 text-surface-muted text-[11px]">
                  {{ tx.transactionDate }}
                </td>
                <td class="py-2.5 px-3.5 font-bold text-xs">
                  {{ tx.source }}
                </td>
                <td class="py-2.5 px-3.5 font-bold text-xs" :class="tx.type === 'EXPENSE' ? 'text-rose-400' : 'text-emerald-400'">
                  {{ tx.type === 'EXPENSE' ? '-' : '+' }}{{ formatRupiah(tx.amount) }}
                </td>
                <td class="py-2.5 px-3.5 text-cyan-400 text-xs">
                  {{ tx.referenceNumber }}
                </td>
                <td class="py-2.5 px-3.5">
                  <span class="rounded px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400">
                    {{ tx.status }}
                  </span>
                </td>
                <td class="py-2.5 px-3.5 text-xs font-sans">
                  <span v-if="tx.duplicateOfId" class="text-amber-400 text-[11px] font-mono">
                    Merged into {{ tx.duplicateOfId }}
                  </span>
                  <span v-else class="text-emerald-400 text-[11px]">
                    Entri Primer
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- SUB-TAB 3: Layer 1 Filter Rules Settings -->
    <div v-else-if="activeSubTab === 'rules'" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="rule in emailStore.rules"
          :key="rule.id"
          class="rounded-xl border border-surface-container-high/60 bg-surface-container-low p-4 space-y-2"
        >
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-bold text-surface-on">{{ rule.name }}</h5>
            <input
              type="checkbox"
              :checked="rule.enabled"
              @change="emailStore.toggleRule(rule.id)"
              class="h-4 w-4 rounded border-surface-container-high text-cyan-400 focus:ring-0 cursor-pointer"
            />
          </div>
          <div class="text-[11px] text-surface-muted font-mono space-y-1">
            <p>Domain: <span class="text-surface-on">{{ rule.senderDomainPattern || '*' }}</span></p>
            <p v-if="rule.subjectKeywords">Kata Kunci: <span class="text-cyan-400">{{ rule.subjectKeywords.join(', ') }}</span></p>
            <p>Target: <strong class="text-emerald-400">{{ rule.targetCategory }}</strong> ({{ rule.targetSource }})</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEmailIntelligenceStore } from '../../stores/emailIntelligence'

const emailStore = useEmailIntelligenceStore()
const activeSubTab = ref<'reconciled' | 'raw_evidence' | 'rules'>('reconciled')

onMounted(async () => {
  if (emailStore.reconciledEntries.length === 0) {
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
</script>
