/**
 * SATRIA AI WORKFORCE — EMAIL INTELLIGENCE MASTER SERVICE
 *
 * Orchestrates the 3-Layer Pipeline:
 * Layer 1 (Rule & Metadata Filter) -> Layer 2 (Classifier) -> Layer 3 (Structured Extraction) -> Aggregated Report
 */

import { EmailFilterEngine } from './EmailFilterEngine'
import { EmailClassifierEngine } from './EmailClassifierEngine'
import { StructuredEmailExtractor } from './StructuredEmailExtractor'
import { EmailReportAggregator } from './EmailReportAggregator'
import type { EmailFilterRule, StructuredEmailTransaction, EmailIntelligenceReport } from '../../types'
import type { RawEmail, EmailPipelineResult } from './types'

export class EmailIntelligenceService {
  /**
   * Sample realistic operational inbox dataset
   */
  public static readonly SAMPLE_INBOX_EMAILS: RawEmail[] = [
    {
      id: 'em-bca-001',
      from: 'BCA e-Banking <notification@klikbca.bank.co.id>',
      to: ['finance@satria.workforce.ai'],
      subject: 'Mutasi Rekening: Transfer Masuk Rp 1.250.000 dari PT MANDIRI SUKSES',
      snippet: 'Transaksi kredit berhasil masuk ke rekening Anda sebesar Rp 1.250.000. No Referensi: BCA-88192019',
      body: 'Pemberitahuan Transaksi Rekening BCA\nTanggal: 2026-08-15 14:20:00\nNominal: Rp 1.250.000\nJenis: KREDIT\nPengirim: PT MANDIRI SUKSES\nNo Referensi: BCA-88192019\nKeterangan: Pembayaran Jasa Konsultasi AI',
      date: '2026-08-15T14:20:00Z'
    },
    {
      id: 'em-shopee-002',
      from: 'ShopeePay Merchant <settlement@shopee.co.id>',
      to: ['finance@satria.workforce.ai'],
      subject: 'Pemberitahuan Settlement Harian ShopeePay Merchant (Rp 875.000)',
      snippet: 'Settlement dana hasil penjualan QRIS ShopeePay telah dicairkan ke rekening Anda sebesar Rp 875.000. MDR Fee: Rp 5.000.',
      body: 'ShopeePay Merchant Daily Settlement\nTanggal Settlement: 2026-08-15\nGross Payout: Rp 875.000\nMerchant Fee / MDR: Rp 5.000\nNet Payout: Rp 870.000\nNomor Transaksi: SPP-99281726\nStatus: Berhasil Dicairkan',
      date: '2026-08-15T16:00:00Z'
    },
    {
      id: 'em-midtrans-003',
      from: 'Midtrans Payment Notification <support@midtrans.com>',
      to: ['finance@satria.workforce.ai'],
      subject: 'Payment Successful: Order #SAT-9921 - Rp 2.100.000 via GoPay/QRIS',
      snippet: 'Pembayaran pelanggan Budi Santoso untuk Order #SAT-9921 telah berhasil diverifikasi sebesar Rp 2.100.000.',
      body: 'Midtrans Transaction Alert\nOrder ID: SAT-9921\nGross Amount: Rp 2.100.000\nCustomer: Budi Santoso\nPayment Type: qris\nTransaction Time: 2026-08-15 17:30:00\nStatus: SETTLEMENT\nRef: MID-5582910',
      date: '2026-08-15T17:30:00Z'
    },
    {
      id: 'em-bca-expense-004',
      from: 'BCA e-Banking <notification@klikbca.bank.co.id>',
      to: ['finance@satria.workforce.ai'],
      subject: 'Mutasi Rekening: Pembayaran Tagihan Cloud Hosting Rp 350.000',
      snippet: 'Transaksi debet berhasil keluar dari rekening Anda sebesar Rp 350.000. No Referensi: BCA-EXP-44129',
      body: 'Pemberitahuan Transaksi Rekening BCA\nTanggal: 2026-08-15 18:00:00\nNominal: Rp 350.000\nJenis: DEBET\nPenerima: CLOUD SERVER INFRA\nNo Referensi: BCA-EXP-44129',
      date: '2026-08-15T18:00:00Z'
    },
    // Non-operational emails that MUST be ignored by Layer 1 Filter
    {
      id: 'em-spam-005',
      from: 'TravelPromo <newsletter@promohotelmurah.com>',
      to: ['finance@satria.workforce.ai'],
      subject: 'Diskon Spesial Liburan Akhir Pekan Hingga 70%!',
      snippet: 'Dapatkan kupon promo tiket pesawat dan hotel favorit Anda sekarang juga.',
      body: 'Klik di sini untuk klaim diskon liburan spesial Anda.',
      date: '2026-08-15T10:00:00Z'
    },
    {
      id: 'em-spam-006',
      from: 'LinkedIn Updates <updates@linkedin.com>',
      to: ['finance@satria.workforce.ai'],
      subject: 'Orang yang mungkin Anda kenal di industri AI',
      snippet: 'Lihat profil terbaru rekan kerja Anda di LinkedIn.',
      body: 'Rekomendasi koneksi baru untuk jaringan profesional Anda.',
      date: '2026-08-15T11:00:00Z'
    }
  ]

  /**
   * Runs the full 3-Layer Email Intelligence pipeline on an inbox
   */
  public static processInbox(
    emails: RawEmail[] = this.SAMPLE_INBOX_EMAILS,
    customRules?: EmailFilterRule[]
  ): EmailPipelineResult {
    // 1. LAYER 1: Rule & Metadata Filter
    const filterResult = EmailFilterEngine.filterEmails(emails, customRules)

    const extractedTransactions: StructuredEmailTransaction[] = []

    for (const email of filterResult.relevant) {
      const match = filterResult.results.find((r) => r.emailId === email.id)

      // 2. LAYER 2: Business Classifier
      const classification = EmailClassifierEngine.classify(email, match)

      // 3. LAYER 3: Structured Data Extraction
      const transaction = StructuredEmailExtractor.extract(email, classification)
      if (match?.matchedRule?.id) {
        transaction.ruleId = match.matchedRule.id
      }
      extractedTransactions.push(transaction)
    }

    // 4. Synthesize Executive Aggregated Report
    const report: EmailIntelligenceReport = EmailReportAggregator.aggregate(
      extractedTransactions,
      'FINANCE',
      emails.length,
      filterResult.ignored.length
    )

    return {
      totalScanned: emails.length,
      passedFilter: filterResult.relevant.length,
      ignoredCount: filterResult.ignored.length,
      extractedTransactions,
      report
    }
  }
}
