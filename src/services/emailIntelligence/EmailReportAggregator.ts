/**
 * SATRIA AI WORKFORCE — EMAIL REPORT AGGREGATOR
 *
 * Consolidates multiple structured email transactions into executive business intelligence reports.
 * Formats multi-source financial summaries, settlement reconciliations, and sales breakdowns.
 */

import type {
  StructuredEmailTransaction,
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
   * Aggregates transactions into a comprehensive EmailIntelligenceReport
   */
  public static aggregate(
    transactions: StructuredEmailTransaction[],
    category: EmailCategory = 'FINANCE',
    scannedCount = 0,
    ignoredCount = 0
  ): EmailIntelligenceReport {
    let totalIncome = 0
    let totalExpense = 0
    let totalSettlement = 0
    let totalFee = 0

    const sourceMap: Map<string, { count: number; total: number }> = new Map()

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

      // Group by source
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
    const title = `LAPORAN REKAPITULASI ${category.toUpperCase()} DARI EMAIL INTELLIGENCE`

    // Generate Markdown Deliverable
    const markdownLines = [
      `# 📊 ${title}`,
      ``,
      `> **Periode Pemrosesan**: ${today} | **Total Email Dipindai**: ${scannedCount} | **Email Relevan**: ${transactions.length} | **Diabaikan (Non-Op)**: ${ignoredCount}`,
      ``,
      `### 💰 Ringkasan Finansial Eksekutif`,
      `| Indikator Finansial | Nilai Nominal | Keterangan |`,
      `| :--- | :--- | :--- |`,
      `| **Total Pemasukan / Penjualan** | \`${this.formatRupiah(totalIncome)}\` | Transaksi kredit & order marketplace |`,
      `| **Total Settlement Masuk** | \`${this.formatRupiah(totalSettlement)}\` | Pencairan dana e-wallet / payment gateway |`,
      `| **Total Pengeluaran / Biaya** | \`${this.formatRupiah(totalExpense)}\` | Debit mutasi bank & pembayaran vendor |`,
      `| **Biaya Transaksi / MDR** | \`${this.formatRupiah(totalFee)}\` | Potongan merchant & gateway |`,
      `| **Net Pemasukan Bersih** | **${this.formatRupiah(netRevenue)}** | Saldo bersih setelah rekonsiliasi |`,
      ``,
      `### 🏢 Distribusi Berdasarkan Sumber Data`,
      `| Sumber Data | Jumlah Transaksi | Total Nominal |`,
      `| :--- | :--- | :--- |`
    ]

    for (const sb of sourceBreakdown) {
      markdownLines.push(`| **${sb.source}** | ${sb.transactionCount} transaksi | \`${this.formatRupiah(sb.totalAmount)}\` |`)
    }

    markdownLines.push(
      ``,
      `### 📝 Detail Transaksi Terstruktur (Extracted Ledger)`,
      `| Tanggal | Sumber | Tipe | Nominal | Referensi | Pengirim / Merchant |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- |`
    )

    for (const tx of transactions) {
      markdownLines.push(
        `| ${tx.transactionDate} | \`${tx.source}\` | \`${tx.type}\` | **${this.formatRupiah(tx.amount)}** | \`${tx.referenceNumber}\` | ${tx.senderOrMerchantName || '-'} |`
      )
    }

    markdownLines.push(
      ``,
      `---`,
      `*Laporan ini dihasilkan secara otomatis oleh SATRIA Email Intelligence Engine (Layer 1 Filter → Layer 2 Classifier → Layer 3 Structured Extraction).*`
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
      totalTransactions: transactions.length,
      summary: {
        totalIncome,
        totalExpense,
        totalSettlement,
        totalFee,
        netRevenue,
        currency: 'IDR'
      },
      sourceBreakdown,
      transactions,
      markdownDeliverable
    }
  }
}
