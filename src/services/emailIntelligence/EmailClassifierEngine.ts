/**
 * SATRIA AI WORKFORCE — EMAIL CLASSIFIER ENGINE (LAYER 2)
 *
 * Classifies filtered emails into standardized business domains:
 * - FINANCE (Mutasi, Saldo, Transfer Bank)
 * - PAYMENT (ShopeePay, QRIS, Payment Gateway Settlement)
 * - SALES (Marketplace Orders, Customer Invoices)
 * - CUSTOMER (Customer Support, Inquiries)
 * - OPERATIONS (Logistics, Server Alerts, Vendor Receipts)
 * - REPORT (Daily/Weekly Statements)
 * - OTHER (Non-actionable)
 */

import type { RawEmail, Layer1FilterResult, Layer2ClassificationResult } from './types'

export class EmailClassifierEngine {
  /**
   * Classifies a filtered email into a domain category
   */
  public static classify(email: RawEmail, filterResult?: Layer1FilterResult): Layer2ClassificationResult {
    // If already matched by rule with high specificity
    if (filterResult?.matchedRule) {
      return {
        emailId: email.id,
        category: filterResult.matchedRule.targetCategory,
        source: filterResult.matchedRule.targetSource,
        confidence: 0.95,
        justification: `Diklasifikasikan berdasarkan aturan metadata: ${filterResult.matchedRule.name}`
      }
    }

    const text = `${email.from} ${email.subject} ${email.snippet} ${email.body}`.toLowerCase()

    // 1. Finance
    if (text.includes('bank') || text.includes('mutasi') || text.includes('debet') || text.includes('kredit') || text.includes('rekening')) {
      return {
        emailId: email.id,
        category: 'FINANCE',
        source: 'BANK',
        confidence: 0.9,
        justification: 'Terdeteksi mutasi perbankan atau saldo rekening.'
      }
    }

    // 2. Payment & Settlement
    if (text.includes('shopeepay') || text.includes('midtrans') || text.includes('xendit') || text.includes('qris') || text.includes('settlement')) {
      return {
        emailId: email.id,
        category: 'PAYMENT',
        source: 'PAYMENT_GATEWAY',
        confidence: 0.92,
        justification: 'Terdeteksi pembayaran merchant / settlement e-wallet.'
      }
    }

    // 3. Sales & Orders
    if (text.includes('pesanan') || text.includes('order') || text.includes('penjualan') || text.includes('invoice') || text.includes('tokopedia')) {
      return {
        emailId: email.id,
        category: 'SALES',
        source: 'MARKETPLACE',
        confidence: 0.88,
        justification: 'Terdeteksi transaksi penjualan order produk/layanan.'
      }
    }

    // 4. Operations
    if (text.includes('server') || text.includes('logistics') || text.includes('resi') || text.includes('pengiriman')) {
      return {
        emailId: email.id,
        category: 'OPERATIONS',
        source: 'LOGISTICS',
        confidence: 0.85,
        justification: 'Terdeteksi notifikasi operasional logistik/infrastruktur.'
      }
    }

    return {
      emailId: email.id,
      category: 'OTHER',
      source: 'GENERIC',
      confidence: 0.5,
      justification: 'Kategori email umum / tidak tergolong transaksi operasional.'
    }
  }
}
