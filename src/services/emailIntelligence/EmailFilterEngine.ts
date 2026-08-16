/**
 * SATRIA AI WORKFORCE — EMAIL FILTER ENGINE (LAYER 1)
 *
 * Fast & Cost-Effective Rule / Metadata Filter.
 * Evaluates: Sender Domain, Sender Address, Subject Pattern, Keywords, Labels, Attachment.
 * Decision: Is email relevant? If NO -> Ignore/Archive from processing (0 LLM cost).
 */

import type { EmailFilterRule } from '../../types'
import type { RawEmail, Layer1FilterResult } from './types'

export class EmailFilterEngine {
  public static readonly DEFAULT_RULES: EmailFilterRule[] = [
    {
      id: 'rule-bank-mutasi',
      name: 'Bank Transaction & Mutasi Notification',
      enabled: true,
      senderDomainPattern: 'bank.co.id',
      senderAddressPattern: 'notif|alert|transaksi|mutasi|ebanking',
      subjectKeywords: ['mutasi', 'transaksi', 'rekening', 'transfer', 'saldo', 'debet', 'kredit'],
      bodyKeywords: ['rp', 'idr', 'berhasil', 'nominal', 'pengirim', 'penerima'],
      targetCategory: 'FINANCE',
      targetSource: 'BANK',
      priority: 10
    },
    {
      id: 'rule-shopeepay-settlement',
      name: 'ShopeePay & E-Wallet Settlement',
      enabled: true,
      senderDomainPattern: 'shopee.co.id',
      senderAddressPattern: 'shopeepay|merchant|settlement',
      subjectKeywords: ['settlement', 'pembayaran', 'merchant', 'pencairan', 'saldo'],
      bodyKeywords: ['shopeepay', 'rp', 'berhasil', 'dana', 'rekening'],
      targetCategory: 'PAYMENT',
      targetSource: 'SHOPEEPAY',
      priority: 20
    },
    {
      id: 'rule-payment-gateway-midtrans',
      name: 'Payment Gateway & QRIS Settlement (Midtrans/Xendit)',
      enabled: true,
      senderDomainPattern: 'midtrans.com|xendit.co|doku.com',
      subjectKeywords: ['payment', 'pembayaran', 'qris', 'settlement', 'paid', 'invoice'],
      bodyKeywords: ['order', 'gross', 'amount', 'rp', 'settled'],
      targetCategory: 'PAYMENT',
      targetSource: 'PAYMENT_GATEWAY',
      priority: 30
    },
    {
      id: 'rule-marketplace-sales',
      name: 'Marketplace Sales & Order Invoices',
      enabled: true,
      senderDomainPattern: 'tokopedia.com|shopee.co.id|tiktok.com',
      subjectKeywords: ['pesanan', 'order', 'penjualan', 'invoice', 'tagihan', 'dikirim'],
      bodyKeywords: ['produk', 'total', 'pembeli', 'resi'],
      targetCategory: 'SALES',
      targetSource: 'MARKETPLACE',
      priority: 40
    }
  ]

  /**
   * Filters a single raw email against active filter rules (Layer 1)
   */
  public static evaluateEmail(email: RawEmail, customRules?: EmailFilterRule[]): Layer1FilterResult {
    const rules = customRules && customRules.length > 0 ? customRules : this.DEFAULT_RULES
    const enabledRules = rules.filter((r) => r.enabled).sort((a, b) => a.priority - b.priority)

    const sender = email.from.toLowerCase()
    const subject = email.subject.toLowerCase()
    const body = (email.body || email.snippet || '').toLowerCase()

    for (const rule of enabledRules) {
      let domainMatched = true
      if (rule.senderDomainPattern) {
        const patterns = rule.senderDomainPattern.toLowerCase().split('|')
        domainMatched = patterns.some((p) => sender.includes(p.replace('*', '')))
      }

      let addressMatched = true
      if (rule.senderAddressPattern) {
        const patterns = rule.senderAddressPattern.toLowerCase().split('|')
        addressMatched = patterns.some((p) => sender.includes(p.replace('*', '')))
      }

      let subjectMatched = true
      if (rule.subjectKeywords && rule.subjectKeywords.length > 0) {
        subjectMatched = rule.subjectKeywords.some((kw) => subject.includes(kw.toLowerCase()))
      }

      let bodyMatched = true
      if (rule.bodyKeywords && rule.bodyKeywords.length > 0) {
        bodyMatched = rule.bodyKeywords.some((kw) => body.includes(kw.toLowerCase()))
      }

      // If domain or address matches AND (subject or body matches)
      const senderMatches = domainMatched || addressMatched
      const contentMatches = subjectMatched || bodyMatched

      if (senderMatches && contentMatches) {
        return {
          emailId: email.id,
          isRelevant: true,
          matchedRule: rule,
          reason: `Lolos Filter Layer 1 (Rule: "${rule.name}")`
        }
      }
    }

    return {
      emailId: email.id,
      isRelevant: false,
      reason: 'Tidak relevan dengan data operasional/keuangan/penjualan.',
      discardReason: 'Email non-operasional (marketing/newsletter/spam diabaikan dari pemrosesan).'
    }
  }

  /**
   * Batch filters a list of raw emails
   */
  public static filterEmails(emails: RawEmail[], customRules?: EmailFilterRule[]): {
    relevant: RawEmail[]
    ignored: { email: RawEmail; reason: string }[]
    results: Layer1FilterResult[]
  } {
    const relevant: RawEmail[] = []
    const ignored: { email: RawEmail; reason: string }[] = []
    const results: Layer1FilterResult[] = []

    for (const email of emails) {
      const evalRes = this.evaluateEmail(email, customRules)
      results.push(evalRes)
      if (evalRes.isRelevant) {
        relevant.push(email)
      } else {
        ignored.push({ email, reason: evalRes.discardReason || evalRes.reason })
      }
    }

    return { relevant, ignored, results }
  }
}
