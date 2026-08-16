/**
 * SATRIA AI WORKFORCE — EMAIL REPORT AGGREGATOR
 *
 * Consolidates multiple structured email transactions into executive business intelligence reports.
 * Formats multi-source financial summaries, settlement reconciliations, and sales breakdowns.
 */

import type {
  StructuredEmailTransaction,
  ReconciledJournalEntry,
  EmailIntelligenceReport,
  EmailCategory
} from '../../types'

export class EmailReportAggregator {
  /**
   * Formats numbers into Indonesian Rupiah currency format
   */
  public static formatRupiah(amount: number): string {
    return 'Rp ' + amount.toLocaleString('id-ID')
  }

  /**
   * Aggregates transactions & reconciled journal entries into a comprehensive EmailIntelligenceReport
   */
  public static aggregate(
    transactions: StructuredEmailTransaction[],
    reconciledEntries: ReconciledJournalEntry[] = [],
    category: EmailCategory = 'FINANCE',
    scannedCount = 0,
    ignoredCount = 0,
    duplicatesMerged = 0
  ): EmailIntelligenceReport {
    let totalIncome = 0
    let totalExpense = 0
    let totalSettlement = 0
    let totalFee = 0

    // Compute financial metrics from canonical reconciled entries if available, otherwise raw
    if (reconciledEntries.length > 0) {
      for (const entry of reconciledEntries) {
        if (entry.entryType === 'EXPENSE') {
          totalExpense += entry.grossAmount
        } else {
          totalIncome += entry.grossAmount
          totalFee += entry.totalFee
        }
      }
    } else {
      for (const tx of transactions) {
        if (tx.type === 'INCOME') {
          totalIncome += tx.amount
        } else if (tx.type === 'EXPENSE') {
          totalExpense += tx.amount
        } else if (tx.type === 'SETTLEMENT') {
          totalSettlement += tx.amount
        }

        if (tx.fee) {
          totalFee += tx.fee
        }
      }
    }

    const sourceMap: Map<string, { count: number; total: number }> = new Map()
    for (const tx of transactions) {
      const current = sourceMap.get(tx.source) || { count: 0, total: 0 }
      current.count += 1
      current.total += tx.amount
      sourceMap.set(tx.source, current)
    }

    const netRevenue = totalIncome + totalSettlement - totalExpense - totalFee

    const sourceBreakdown = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      transactionCount: data.count,
      totalAmount: data.total
    }))

    const today = new Date().toISOString().split('T')[0]
    const title = `LAPORAN REKAPITULASI & REKONSILIASI KEUANGAN DARI EMAIL INTELLIGENCE`

    // Generate Markdown Deliverable
    const markdownLines = [
      `# 📊 ${title}`,
      ``,
      `> **Periode**: ${today} | **Email Dipindai**: ${scannedCount} | **Bukti Raw Terekstraksi**: ${transactions.length} | **Entri Unik Terekonsiliasi**: ${reconciledEntries.length} | **Duplikasi Dicegah**: ${duplicatesMerged}`,
      ``,
      `### 🛡️ Jaminan Keamanan Akuntansi (Anti-Triple-Counting)`,
      `Sistem menerapkan 4 tahap verifikasi: \`EXTRACTED\` &rarr; \`VERIFIED\` &rarr; \`RECONCILED\` &rarr; \`FINAL\`. Transaksi yang muncul simultan di Payment Gateway, Settlement, dan Mutasi Bank digabungkan menjadi 1 entri kanonikal resmi.`,
      ``,
      `### 💰 Ringkasan Finansial Sah (Reconciled Bookkeeping)`,
      `| Indikator Finansial | Nilai Nominal | Keterangan |`,
      `| :--- | :--- | :--- |`,
      `| **Total Omset Bruto (Gross)** | \`${this.formatRupiah(totalIncome)}\` | Transaksi penjualan kanonikal terekonsiliasi |`,
      `| **Total Biaya / MDR Gateway** | \`${this.formatRupiah(totalFee)}\` | Biaya merchant & potongan gateway |`,
      `| **Total Pengeluaran / Beban** | \`${this.formatRupiah(totalExpense)}\` | Beban operasional & tagihan terverifikasi |`,
      `| **Net Kas Masuk Bersih** | **${this.formatRupiah(netRevenue)}** | Saldo kas riil setelah rekonsiliasi bebas duplikasi |`,
      ``,
      `### 📋 Buku Kas Kanonikal Hasil Rekonsiliasi (${reconciledEntries.length} Entri Unik)`,
      `| Referensi Kanonikal | Sumber Bukti Terkorelasi | Bruto | Potongan Fee | Kas Bersih | Status |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- |`
    ]

    for (const entry of reconciledEntries) {
      markdownLines.push(
        `| \`${entry.canonicalReference}\` | ${entry.evidenceSources.join(' + ')} | ${this.formatRupiah(entry.grossAmount)} | ${this.formatRupiah(entry.totalFee)} | **${this.formatRupiah(entry.netAmount)}** | \`${entry.status}\` |`
      )
    }

    markdownLines.push(
      ``,
      `### 🔍 Jejak Audit Bukti Mentah (Raw Evidence Trail)`,
      `| Tanggal | Sumber | Nominal Mentah | Referensi | Status Siklus | Duplikasi Dari |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- |`
    )

    for (const tx of transactions) {
      markdownLines.push(
        `| ${tx.transactionDate} | \`${tx.source}\` | ${this.formatRupiah(tx.amount)} | \`${tx.referenceNumber}\` | \`${tx.status}\` | ${tx.duplicateOfId ? `Lanjutan dari \`${tx.duplicateOfId}\`` : 'Entri Primer'} |`
      )
    }

    markdownLines.push(
      ``,
      `---`,
      `*Laporan akuntansi ini diproses dengan integritas tinggi oleh SATRIA Accounting & Reconciliation Engine.*`
    )

    const markdownDeliverable = markdownLines.join('\n')

    return {
      id: `rep-email-${Date.now()}`,
      title,
      category,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: today,
        endDate: today
      },
      totalEmailsScanned: scannedCount,
      totalRelevantEmails: transactions.length,
      totalIgnoredEmails: ignoredCount,
      totalRawEvidence: transactions.length,
      totalReconciledUniqueTransactions: reconciledEntries.length,
      totalDuplicatesMerged: duplicatesMerged,
      summary: {
        totalIncome,
        totalExpense,
        totalSettlement,
        totalFee,
        netRevenue,
        currency: 'IDR'
      },
      sourceBreakdown,
      reconciledEntries,
      transactions,
      markdownDeliverable
    }
  }
}
