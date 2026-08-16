/**
 * SATRIA AI WORKFORCE — RECONCILIATION & DEDUPLICATION ENGINE
 *
 * Stage 3: Accounting-grade Cross-Source Reconciliation.
 * Correlates transactions across multiple channels (Bank Mutasi + ShopeePay Settlement + Midtrans Order).
 *
 * Prevents triple-counting duplicate representations of the same underlying transaction:
 * e.g. Customer pays Midtrans (Gross) -> ShopeePay Settles (Net) -> Bank Receives Deposit (Cash In).
 * Merges them into 1 Canonical ReconciledJournalEntry.
 */

import type {
  StructuredEmailTransaction,
  ReconciledJournalEntry,
  TransactionLifecycleStatus
} from '../../types'

export interface ReconciliationResult {
  reconciledEntries: ReconciledJournalEntry[]
  updatedRawTransactions: StructuredEmailTransaction[]
  totalDuplicatesPrevented: number
  totalGrossVolume: number
  totalNetRevenue: number
  totalFee: number
}

export class ReconciliationEngine {
  /**
   * Normalizes reference strings (e.g. '#SAT-9921', 'SAT-9921', 'ORDER #SAT-9921')
   */
  public static normalizeReference(ref?: string): string {
    if (!ref) return ''
    return ref.toUpperCase().replace(/[#\s-]/g, '')
  }

  /**
   * Checks if two transactions correlate to the same underlying payment
   */
  public static isCorrelated(
    a: StructuredEmailTransaction,
    b: StructuredEmailTransaction
  ): { matches: boolean; reason: string; confidence: number } {
    // 1. Direct Reference / Order ID match
    const normA = this.normalizeReference(a.referenceNumber)
    const normB = this.normalizeReference(b.referenceNumber)

    if (normA && normB && (normA === normB || normA.includes(normB) || normB.includes(normA))) {
      return {
        matches: true,
        reason: `Nomor referensi / Order ID cocok (${a.referenceNumber} <=> ${b.referenceNumber})`,
        confidence: 0.98
      }
    }

    // 2. Cross-Text Reference Match (e.g. Snippet contains Order ID of other tx)
    if (normA && b.rawSnippet && b.rawSnippet.toUpperCase().includes(normA)) {
      return {
        matches: true,
        reason: `Snippet teks mengandung referensi silang (${a.referenceNumber})`,
        confidence: 0.92
      }
    }
    if (normB && a.rawSnippet && a.rawSnippet.toUpperCase().includes(normB)) {
      return {
        matches: true,
        reason: `Snippet teks mengandung referensi silang (${b.referenceNumber})`,
        confidence: 0.92
      }
    }

    // 3. Amount & Date Proximity match between Gateway/Settlement and Bank Deposit
    const sameDate = a.transactionDate === b.transactionDate
    const netMatch = Math.abs((a.netAmount || a.amount) - (b.netAmount || b.amount)) < 10000 // Within Rp 10k tolerance for MDR fee

    if (sameDate && netMatch && a.source !== b.source) {
      // E.g. Midtrans + Bank or ShopeePay + Bank
      const isGatewayAndBank =
        (a.source === 'BANK' && (b.source === 'SHOPEEPAY' || b.source === 'PAYMENT_GATEWAY' || b.source === 'MIDTRANS')) ||
        (b.source === 'BANK' && (a.source === 'SHOPEEPAY' || a.source === 'PAYMENT_GATEWAY' || a.source === 'MIDTRANS'))

      if (isGatewayAndBank) {
        return {
          matches: true,
          reason: `Pencocokan rekonsiliasi gateway vs mutasi bank (Tanggal & Nominal cocok dalam rentang toleransi fee)`,
          confidence: 0.85
        }
      }
    }

    return { matches: false, reason: '', confidence: 0 }
  }

  /**
   * Reconciles a list of verified raw transactions into canonical journal entries
   */
  public static reconcile(transactions: StructuredEmailTransaction[]): ReconciliationResult {
    const rawList = [...transactions]
    const reconciledEntries: ReconciledJournalEntry[] = []
    const processedIds = new Set<string>()
    let totalDuplicatesPrevented = 0

    for (let i = 0; i < rawList.length; i++) {
      const current = rawList[i]
      if (processedIds.has(current.id)) continue

      const cluster: StructuredEmailTransaction[] = [current]
      processedIds.add(current.id)

      // Search for correlated counterpart records
      for (let j = i + 1; j < rawList.length; j++) {
        const candidate = rawList[j]
        if (processedIds.has(candidate.id)) continue

        const correlation = this.isCorrelated(current, candidate)
        if (correlation.matches) {
          cluster.push(candidate)
          processedIds.add(candidate.id)
        }
      }

      // If cluster has > 1 items, duplicate/multi-channel reporting detected!
      if (cluster.length > 1) {
        totalDuplicatesPrevented += cluster.length - 1
      }

      // Determine Canonical Values from Cluster
      // 1. Gross Amount: Pick the maximum amount in the cluster (e.g. Midtrans gross order amount)
      const grossAmount = Math.max(...cluster.map((c) => c.amount))
      // 2. Fee: Pick any fee specified, or calculate difference between gross and net bank deposit
      const explicitFee = cluster.find((c) => c.fee && c.fee > 0)?.fee || 0
      const minNet = Math.min(...cluster.map((c) => c.netAmount || c.amount))
      const calculatedFee = grossAmount > minNet && explicitFee === 0 ? grossAmount - minNet : explicitFee
      const totalFee = calculatedFee
      const netAmount = grossAmount - totalFee

      // Canonical Reference: Choose most specific (e.g. Order ID > TRX > generic)
      const primaryTx =
        cluster.find((c) => c.source === 'PAYMENT_GATEWAY' || c.source === 'MIDTRANS' || c.source === 'MARKETPLACE') ||
        cluster[0]

      const canonicalReference = primaryTx.referenceNumber || `CANONICAL-${primaryTx.id}`
      const evidenceSources = Array.from(new Set(cluster.map((c) => c.source)))
      const rawTransactionIds = cluster.map((c) => c.id)

      const entryId = `rec-entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

      const status: TransactionLifecycleStatus = 'RECONCILED'

      const entryType: ReconciledJournalEntry['entryType'] =
        primaryTx.type === 'EXPENSE' ? 'EXPENSE' : primaryTx.type === 'SETTLEMENT' ? 'SETTLEMENT' : 'INCOME'

      const entry: ReconciledJournalEntry = {
        id: entryId,
        canonicalReference,
        title: `Rekonsiliasi Transaksi [${canonicalReference}] — ${evidenceSources.join(' + ')}`,
        entryType,
        transactionDate: primaryTx.transactionDate,
        grossAmount,
        totalFee,
        netAmount,
        currency: 'IDR',
        status,
        primarySource: primaryTx.source,
        evidenceSources,
        rawTransactionIds,
        reconciledAt: new Date().toISOString(),
        confidence: cluster.length > 1 ? 0.95 : 0.9,
        reconciliationNotes:
          cluster.length > 1
            ? `Ditemukan ${cluster.length} bukti email silang (${evidenceSources.join(', ')}). Berhasil direkonsiliasi menjadi 1 entri buku kas (mencegah ${cluster.length - 1}x duplikasi).`
            : `Entri tunggal terverifikasi dari sumber ${primaryTx.source}.`
      }

      reconciledEntries.push(entry)

      // Update statuses in raw transactions
      for (const item of cluster) {
        const found = rawList.find((r) => r.id === item.id)
        if (found) {
          found.status = 'RECONCILED'
          found.reconciliationGroupId = entryId
          if (item.id !== primaryTx.id && cluster.length > 1) {
            found.duplicateOfId = primaryTx.id
          }
        }
      }
    }

    const totalGrossVolume = reconciledEntries.reduce((sum, e) => sum + e.grossAmount, 0)
    const totalFee = reconciledEntries.reduce((sum, e) => sum + e.totalFee, 0)
    const totalNetRevenue = reconciledEntries.reduce((sum, e) => sum + e.netAmount, 0)

    return {
      reconciledEntries,
      updatedRawTransactions: rawList,
      totalDuplicatesPrevented,
      totalGrossVolume,
      totalNetRevenue,
      totalFee
    }
  }
}
