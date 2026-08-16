import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { EmailFilterEngine } from '../services/emailIntelligence/EmailFilterEngine'
import { EmailClassifierEngine } from '../services/emailIntelligence/EmailClassifierEngine'
import { StructuredEmailExtractor } from '../services/emailIntelligence/StructuredEmailExtractor'
import { EmailReportAggregator } from '../services/emailIntelligence/EmailReportAggregator'
import { EmailIntelligenceService } from '../services/emailIntelligence/EmailIntelligenceService'
import { EngineeringExecutionEngine } from '../services/engineering/EngineeringExecutionEngine'
import { useEmailIntelligenceStore } from '../stores/emailIntelligence'
import type { IntegrationConnection } from '../types'
import type { RawEmail } from '../services/emailIntelligence/types'

describe('SATRIA 4-Mode Execution Architecture — Mode 2 (Email Intelligence) & Mode 3 (Engineering Execution)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Layer 1 — Email Filter (Fast & 0 LLM Cost)', () => {
    it('passes relevant bank mutasi, settlement, and payment emails', () => {
      const bankEmail: RawEmail = {
        id: 'em-1',
        from: 'BCA e-Banking <notification@klikbca.bank.co.id>',
        to: ['finance@satria.workforce.ai'],
        subject: 'Mutasi Rekening: Transfer Masuk Rp 1.250.000',
        snippet: 'Transfer masuk Rp 1.250.000 berhasil',
        body: 'Pemberitahuan Transaksi Rp 1.250.000',
        date: '2026-08-15T10:00:00Z'
      }

      const res = EmailFilterEngine.evaluateEmail(bankEmail)
      expect(res.isRelevant).toBe(true)
      expect(res.matchedRule?.targetCategory).toBe('FINANCE')
    })

    it('passes ShopeePay settlement and payment gateway emails', () => {
      const shopeeEmail: RawEmail = {
        id: 'em-2',
        from: 'ShopeePay Merchant <settlement@shopee.co.id>',
        to: ['finance@satria.workforce.ai'],
        subject: 'Pemberitahuan Settlement ShopeePay Merchant',
        snippet: 'Dana settlement berhasil dicairkan sebesar Rp 875.000',
        body: 'Gross Payout: Rp 875.000, MDR: Rp 5.000',
        date: '2026-08-15T12:00:00Z'
      }

      const res = EmailFilterEngine.evaluateEmail(shopeeEmail)
      expect(res.isRelevant).toBe(true)
      expect(res.matchedRule?.targetCategory).toBe('PAYMENT')
    })

    it('strictly discards marketing newsletters and spam from processing', () => {
      const spamEmail: RawEmail = {
        id: 'em-spam',
        from: 'Promo Tiket <newsletter@hoteldiskon.com>',
        to: ['finance@satria.workforce.ai'],
        subject: 'Klaim Kupon Diskon Liburan 70% Hari Ini!',
        snippet: 'Diskon hotel dan penerbangan murah.',
        body: 'Dapatkan penawaran terbaik untuk liburan Anda.',
        date: '2026-08-15T09:00:00Z'
      }

      const res = EmailFilterEngine.evaluateEmail(spamEmail)
      expect(res.isRelevant).toBe(false)
      expect(res.discardReason).toContain('diabaikan')
    })
  })

  describe('Layer 2 — Email Classifier (Business Domains)', () => {
    it('classifies bank mutasi into FINANCE and settlement into PAYMENT', () => {
      const bankEmail: RawEmail = {
        id: 'em-bca',
        from: 'BCA <alert@bank.co.id>',
        to: ['me@satria.ai'],
        subject: 'Mutasi Rekening BCA',
        snippet: 'Kredit Rp 500.000',
        body: 'Transfer masuk dari Budi',
        date: '2026-08-15T10:00:00Z'
      }

      const classRes = EmailClassifierEngine.classify(bankEmail)
      expect(classRes.category).toBe('FINANCE')
      expect(classRes.source).toBe('BANK')
    })
  })

  describe('Layer 3 — Structured Extractor & Indonesian Rupiah Parsing', () => {
    it('extracts numbers, fee, reference, and sender from raw unstructured text', () => {
      const email: RawEmail = {
        id: 'em-shopee-test',
        from: 'ShopeePay Merchant <settlement@shopee.co.id>',
        to: ['finance@satria.ai'],
        subject: 'Pemberitahuan Settlement ShopeePay Merchant (Rp 875.000)',
        snippet: 'Settlement dana telah dicairkan ke rekening Anda sebesar Rp 875.000. MDR Fee: Rp 5.000.',
        body: 'ShopeePay Merchant Daily Settlement\nGross Payout: Rp 875.000\nMerchant Fee / MDR: Rp 5.000\nNet Payout: Rp 870.000\nNo Referensi: SPP-99281726',
        date: '2026-08-15T16:00:00Z'
      }

      const tx = StructuredEmailExtractor.extract(email, {
        emailId: email.id,
        category: 'PAYMENT',
        source: 'SHOPEEPAY',
        confidence: 0.95,
        justification: 'ShopeePay rule'
      })

      expect(tx.amount).toBe(875000)
      expect(tx.fee).toBe(5000)
      expect(tx.netAmount).toBe(870000)
      expect(tx.referenceNumber).toBe('SPP-99281726')
      expect(tx.type).toBe('SETTLEMENT')
    })
  })

  describe('EmailReportAggregator & Consolidated Business Reports', () => {
    it('synthesizes multi-source transactions into accurate financial report', () => {
      const transactions = [
        {
          id: 'tx-1',
          messageId: 'em-1',
          category: 'FINANCE' as const,
          source: 'BANK',
          sender: 'BCA',
          subject: 'Transfer Masuk',
          receivedAt: '2026-08-15T10:00:00Z',
          transactionDate: '2026-08-15',
          amount: 1250000,
          currency: 'IDR',
          type: 'INCOME' as const,
          referenceNumber: 'BCA-01',
          rawSnippet: '',
          status: 'EXTRACTED' as const
        },
        {
          id: 'tx-2',
          messageId: 'em-2',
          category: 'PAYMENT' as const,
          source: 'SHOPEEPAY',
          sender: 'ShopeePay',
          subject: 'Settlement',
          receivedAt: '2026-08-15T12:00:00Z',
          transactionDate: '2026-08-15',
          amount: 875000,
          fee: 5000,
          currency: 'IDR',
          type: 'SETTLEMENT' as const,
          referenceNumber: 'SPP-02',
          rawSnippet: '',
          status: 'EXTRACTED' as const
        },
        {
          id: 'tx-3',
          messageId: 'em-3',
          category: 'FINANCE' as const,
          source: 'BANK',
          sender: 'BCA',
          subject: 'Pembayaran Hosting',
          receivedAt: '2026-08-15T15:00:00Z',
          transactionDate: '2026-08-15',
          amount: 350000,
          currency: 'IDR',
          type: 'EXPENSE' as const,
          referenceNumber: 'BCA-EXP-03',
          rawSnippet: '',
          status: 'EXTRACTED' as const
        }
      ]

      const report = EmailReportAggregator.aggregate(transactions, 'FINANCE', 6, 3)

      expect(report.summary.totalIncome).toBe(1250000)
      expect(report.summary.totalSettlement).toBe(875000)
      expect(report.summary.totalExpense).toBe(350000)
      expect(report.summary.totalFee).toBe(5000)
      expect(report.summary.netRevenue).toBe(1250000 + 875000 - 350000 - 5000) // 1.770.000
      expect(report.markdownDeliverable).toContain('Ringkasan Finansial Eksekutif')
      expect(report.markdownDeliverable).toContain('SHOPEEPAY')
      expect(report.markdownDeliverable).toContain('BANK')
    })
  })

  describe('Full 3-Layer Email Intelligence Pipeline & Store', () => {
    it('executes master EmailIntelligenceService on raw inbox', () => {
      const res = EmailIntelligenceService.processInbox()
      expect(res.totalScanned).toBe(6)
      expect(res.passedFilter).toBe(4)
      expect(res.ignoredCount).toBe(2)
      expect(res.extractedTransactions.length).toBe(4)
      expect(res.report.summary.netRevenue).toBeGreaterThan(0)
    })

    it('runs pipeline on inbox and populates store reactively', async () => {
      const store = useEmailIntelligenceStore()
      const result = await store.processInboxEmails()

      expect(result.totalScanned).toBe(6)
      expect(result.passedFilter).toBe(4) // 4 operational emails passed
      expect(result.ignoredCount).toBe(2) // 2 spam/newsletter ignored
      expect(store.transactions.length).toBe(4)
      expect(store.totalIncome).toBeGreaterThan(0)
      expect(store.netRevenue).toBeGreaterThan(0)
    })
  })

  describe('Mode 3 — Pure Engineering Execution (Decoupled from Email)', () => {
    it('executes coding task directly against GitHub without email triggers', async () => {
      const mockGitHubConn: IntegrationConnection = {
        id: 'conn-gh-eng',
        providerId: 'github',
        workspaceId: 'ws-dev',
        displayName: 'Satria GitHub',
        accountLabel: 'satria-workforce',
        status: 'Connected',
        scopes: ['repo', 'pull_requests:write'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const result = await EngineeringExecutionEngine.executeCodingTask(mockGitHubConn, {
        taskId: 'tsk-eng-99',
        taskTitle: 'Fix Mutex Race Condition',
        repository: 'satria-api',
        targetBranch: 'fix/mutex-race',
        fileChanges: [
          {
            path: 'pkg/auth/auth_handler.go',
            newContent: 'package auth\n// Mutex locked',
            commitMessage: 'fix(auth): lock mutex'
          }
        ],
        pullRequestTitle: 'fix(auth): lock mutex',
        pullRequestBody: 'Resolves race condition on auth token refresh'
      })

      expect(result.success).toBe(true)
      expect(result.pullRequestNumber).toBeGreaterThan(0)
      expect(result.testResults.passed).toBe(true)
      expect(result.branchName).toBe('fix/mutex-race')
    })
  })
})
