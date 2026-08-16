/**
 * SATRIA AI WORKFORCE — TRANSACTION VALIDATION ENGINE
 *
 * Stage 2: Validation of raw extracted evidence.
 * Asserts syntax, numerical bounds, currency formats, and timestamp sanity.
 * State Transition: EXTRACTED -> VERIFIED (or FLAGGED_INVALID)
 */

import type { StructuredEmailTransaction } from '../../types'

export interface ValidationRuleResult {
  isValid: boolean
  errors: string[]
}

export class TransactionValidationEngine {
  public static readonly MAX_SINGLE_TX_SANITY_LIMIT = 500_000_000 // Rp 500 Juta sanity cap

  /**
   * Validates a single extracted transaction
   */
  public static validate(tx: StructuredEmailTransaction): StructuredEmailTransaction {
    const errors: string[] = []

    // 1. Amount Sanity Check
    if (isNaN(tx.amount) || tx.amount <= 0) {
      errors.push('Nominal transaksi tidak valid atau <= 0.')
    } else if (tx.amount > this.MAX_SINGLE_TX_SANITY_LIMIT) {
      errors.push(`Nominal melebihi batas batas wajar (Sanity Cap Rp 500jt): Rp ${tx.amount.toLocaleString('id-ID')}`)
    }

    // 2. Date Format Validation
    if (!tx.transactionDate || isNaN(Date.parse(tx.transactionDate))) {
      errors.push('Format tanggal transaksi tidak valid.')
    }

    // 3. Reference Validation
    if (!tx.referenceNumber || tx.referenceNumber.trim().length === 0) {
      errors.push('Nomor referensi atau order ID kosong.')
    }

    // 4. Net Amount Consistency Check
    if (tx.fee !== undefined && tx.fee > tx.amount) {
      errors.push('Biaya transaksi (fee) tidak boleh melebihi nilai nominal transaksi.')
    }

    if (errors.length > 0) {
      return {
        ...tx,
        status: 'DISPUTED',
        validationErrors: errors
      }
    }

    return {
      ...tx,
      status: 'VERIFIED',
      validationErrors: []
    }
  }

  /**
   * Batch validate a list of extracted transactions
   */
  public static validateAll(transactions: StructuredEmailTransaction[]): StructuredEmailTransaction[] {
    return transactions.map((t) => this.validate(t))
  }
}
