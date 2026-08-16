/**
 * SATRIA AI WORKFORCE — STRUCTURED EMAIL EXTRACTOR (LAYER 3)
 *
 * Extracts structured financial and operational transaction records from classified emails.
 * Converts raw unstructured text into typed JSON data structures:
 * {
 *   category: 'FINANCE',
 *   source: 'BANK',
 *   transactionDate: '2026-08-15',
 *   amount: 1250000,
 *   type: 'INCOME',
 *   referenceNumber: 'TRX-12345'
 * }
 */

import type { StructuredEmailTransaction } from '../../types'
import type { RawEmail, Layer2ClassificationResult } from './types'

export class StructuredEmailExtractor {
  /**
   * Extracts clean number from Indonesian currency strings:
   * "Rp 1.250.000,00" -> 1250000
   * "IDR 875,000" -> 875000
   * "1.250.000" -> 1250000
   */
  public static parseIndonesianAmount(text: string): number {
    if (!text) return 0
    // Look for numbers following Rp, IDR, or standard digits
    const clean = text.replace(/rp\.?/gi, '').replace(/idr/gi, '').trim()
    // Replace thousand separators (.) and decimal commas (,)
    const normalized = clean.replace(/\./g, '').replace(/,/g, '.')
    const parsed = parseFloat(normalized)
    return isNaN(parsed) ? 0 : parsed
  }

  /**
   * Extracts structured transaction data from raw email
   */
  public static extract(email: RawEmail, classification: Layer2ClassificationResult): StructuredEmailTransaction {
    const fullText = `${email.subject} \n ${email.body || email.snippet}`

    // 1. Amount Extraction via Regex
    let amount = 0
    let fee = 0
    const currency = 'IDR'
    let type: StructuredEmailTransaction['type'] = 'INCOME'

    // Match "Rp 1.250.000" or "Rp1.250.000" or "IDR 500,000"
    const amountRegex = /(?:rp\.?|idr)\s*([\d.,]+)/i
    const match = fullText.match(amountRegex)
    if (match && match[1]) {
      amount = this.parseIndonesianAmount(match[1])
    }

    // If no Rp prefix found, check for plain numbers in key positions
    if (amount === 0) {
      const fallbackMatch = fullText.match(/nominal[:\s]+([\d.,]+)/i) || fullText.match(/total[:\s]+([\d.,]+)/i)
      if (fallbackMatch && fallbackMatch[1]) {
        amount = this.parseIndonesianAmount(fallbackMatch[1])
      }
    }

    // 2. Fee extraction if settlement
    const feeMatch = fullText.match(/(?:biaya|fee|mdr)[\s/a-z]*[:\s]+(?:rp\.?|idr)?\s*([\d.,]+)/i)
    if (feeMatch && feeMatch[1]) {
      fee = this.parseIndonesianAmount(feeMatch[1])
    }

    // 3. Reference Number Extraction
    let referenceNumber = `REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    const refMatch =
      fullText.match(/(?:ref|no\.?\s*referensi|trx|order\s*id|resi)[:\s#]*([a-z0-9-_]+)/i) ||
      fullText.match(/(?:transaksi|invoice)[:\s#]*([a-z0-9-_]+)/i)
    if (refMatch && refMatch[1]) {
      referenceNumber = refMatch[1].trim().toUpperCase()
    }

    // 4. Type classification
    if (classification.category === 'FINANCE') {
      if (/kredit|masuk|transfer masuk|terima|deposit/i.test(fullText)) {
        type = 'INCOME'
      } else if (/debet|keluar|transfer ke|tagihan|biaya/i.test(fullText)) {
        type = 'EXPENSE'
      } else {
        type = 'INCOME'
      }
    } else if (classification.category === 'PAYMENT') {
      type = 'SETTLEMENT'
    } else if (classification.category === 'SALES') {
      type = 'INCOME'
    }

    // 5. Merchant / Counterpart name
    let senderOrMerchantName = 'Merchant Partner'
    const merchantMatch =
      fullText.match(/(?:pengirim|merchant|dari|dari rekening)[:\s]+([^\n\r,]+)/i) ||
      fullText.match(/(?:pelanggan|pembeli)[:\s]+([^\n\r,]+)/i)
    if (merchantMatch && merchantMatch[1]) {
      senderOrMerchantName = merchantMatch[1].trim()
    } else if (email.from.includes('<')) {
      const nameOnly = email.from.split('<')[0].replace(/"/g, '').trim()
      if (nameOnly) senderOrMerchantName = nameOnly
    }

    const netAmount = amount > fee ? amount - fee : amount

    return {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      messageId: email.id,
      category: classification.category,
      source: classification.source,
      sender: email.from,
      subject: email.subject,
      receivedAt: email.date || new Date().toISOString(),
      transactionDate: email.date ? email.date.split('T')[0] : new Date().toISOString().split('T')[0],
      amount,
      fee: fee > 0 ? fee : undefined,
      netAmount,
      currency,
      type,
      referenceNumber,
      senderOrMerchantName,
      rawSnippet: email.snippet || email.body.substring(0, 150),
      status: 'EXTRACTED'
    }
  }
}
