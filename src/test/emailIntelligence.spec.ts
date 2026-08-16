import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { EmailFilterEngine } from '../services/emailIntelligence/EmailFilterEngine'
import { EmailClassifierEngine } from '../services/emailIntelligence/EmailClassifierEngine'
import { StructuredEmailExtractor } from '../services/emailIntelligence/StructuredEmailExtractor'
import { TransactionValidationEngine } from '../services/emailIntelligence/TransactionValidationEngine'
import { ReconciliationEngine } from '../services/emailIntelligence/ReconciliationEngine'
import { EmailReportAggregator } from '../services/emailIntelligence/EmailReportAggregator'
import { EmailIntelligenceService } from '../services/emailIntelligence/EmailIntelligenceService'
import { EngineeringExecutionEngine } from '../services/engineering/EngineeringExecutionEngine'
import { useEmailIntelligenceStore } from '../stores/emailIntelligence'
import type { IntegrationConnection, StructuredEmailTransaction } from '../types'
import type { RawEmail } from '../services/emailIntelligence/types'

describe('SATRIA 4-Mode Execution Architecture & Accounting Reconciliation Engine', () => {
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

  describe('Layer 2 & 3 — Classifier and Structured Extraction', () => {
    it('extracts structured transaction with currency, amount, fee and reference', () => {
      const email: RawEmail = {
        id: 'em-shopee-test',
        from: 'ShopeePay Merchant <settlement@shopee.co.id>',
        to: ['finance@satria.ai'],
        subject: 'Pemberitahuan Settlement ShopeePay Merchant (Rp 875.000)',
        snippet: 'Settlement dana telah dicairkan ke rekening Anda sebesar Rp 875.000. MDR Fee: Rp 5.000.',
        body: 'ShopeePay Merchant Daily Settlement\nGross Payout: Rp 875.000\nMerchant Fee / MDR: Rp 5.000\nNet Payout: Rp 870.000\nNo Referensi: SPP-99281726',
        date: '2026-08-15T16:00:00Z'
      }

      const classification = EmailClassifierEngine.classify(email)
      const tx = StructuredEmailExtractor.extract(email, classification)

      expect(tx.amount).toBe(875000)
      expect(tx.fee).toBe(5000)
      expect(tx.netAmount).toBe(870000)
      expect(tx.referenceNumber).toBe('SPP-99281726')
      expect(tx.status).toBe('EXTRACTED')
    })
  })

  describe('Stage 4 — Transaction Validation Engine', () => {
    it('validates sane transactions and flags invalid amounts', () => {
      const validTx: StructuredEmailTransaction = {
        id: 'tx-valid',
        messageId: 'em-v',
        category: 'FINANCE',
        source: 'BANK',
        sender: 'bank',
        subject: 'Valid',
        receivedAt: '2026-08-15T10:00:00Z',
        transactionDate: '2026-08-15',
        amount: 1500000,
        currency: 'IDR',
        type: 'INCOME',
        referenceNumber: 'TRX-101',
        rawSnippet: '',
        status: 'EXTRACTED'
      }

      const result = TransactionValidationEngine.validate(validTx)
      expect(result.status).toBe('VERIFIED')
      expect(result.validationErrors?.length).toBe(0)

      const invalidTx: StructuredEmailTransaction = {
        ...validTx,
        amount: -5000
      }
      const invalidResult = TransactionValidationEngine.validate(invalidTx)
      expect(invalidResult.status).toBe('DISPUTED')
      expect(invalidResult.validationErrors?.length).toBeGreaterThan(0)
    })
  })

  describe('Stage 5 — Accounting Reconciliation & Anti-Triple-Counting (Midtrans + ShopeePay + Bank)', () => {
    it('correlates 3 notifications for Order #SAT-9921 and merges them into 1 Canonical ReconciledJournalEntry', () => {
      const midtransTx: StructuredEmailTransaction = {
        id: 'tx-midtrans-1',
        messageId: 'em-1',
        category: 'PAYMENT',
        source: 'MIDTRANS',
        sender: 'Midtrans <support@midtrans.com>',
        subject: 'Payment Successful: Order #SAT-9921',
        receivedAt: '2026-08-15T17:30:00Z',
        transactionDate: '2026-08-15',
        amount: 2100000,
        currency: 'IDR',
        type: 'INCOME',
        referenceNumber: 'SAT-9921',
        rawSnippet: 'Order SAT-9921 Rp 2.100.000',
        status: 'VERIFIED'
      }

      const shopeePaySettlementTx: StructuredEmailTransaction = {
        id: 'tx-shopee-2',
        messageId: 'em-2',
        category: 'PAYMENT',
        source: 'SHOPEEPAY',
        sender: 'ShopeePay <settlement@shopee.co.id>',
        subject: 'Settlement ShopeePay #SAT-9921',
        receivedAt: '2026-08-15T18:00:00Z',
        transactionDate: '2026-08-15',
        amount: 2100000,
        fee: 5000,
        netAmount: 2095000,
        currency: 'IDR',
        type: 'SETTLEMENT',
        referenceNumber: 'SAT-9921',
        rawSnippet: 'Settlement Order SAT-9921 Net Rp 2.095.000',
        status: 'VERIFIED'
      }

      const bcaDepositTx: StructuredEmailTransaction = {
        id: 'tx-bca-3',
        messageId: 'em-3',
        category: 'FINANCE',
        source: 'BANK',
        sender: 'BCA <alert@klikbca.bank.co.id>',
        subject: 'Mutasi Rekening: Transfer Masuk Rp 2.095.000',
        receivedAt: '2026-08-15T18:30:00Z',
        transactionDate: '2026-08-15',
        amount: 2095000,
        currency: 'IDR',
        type: 'INCOME',
        referenceNumber: 'SAT-9921',
        rawSnippet: 'Kredit Rp 2.095.000 Ref SAT-9921 dari ShopeePay',
        status: 'VERIFIED'
      }

      // Reconcile all 3 transactions
      const res = ReconciliationEngine.reconcile([midtransTx, shopeePaySettlementTx, bcaDepositTx])

      // CRITICAL ASSERTION: Exactly 1 Reconciled Canonical Entry created (NOT 3 entries totaling 6.29m!)
      expect(res.reconciledEntries.length).toBe(1)
      expect(res.totalDuplicatesPrevented).toBe(2)

      const canonical = res.reconciledEntries[0]
      expect(canonical.canonicalReference).toBe('SAT-9921')
      expect(canonical.grossAmount).toBe(2100000)
      expect(canonical.totalFee).toBe(5000)
      expect(canonical.netAmount).toBe(2095000)
      expect(canonical.evidenceSources).toEqual(expect.arrayContaining(['MIDTRANS', 'SHOPEEPAY', 'BANK']))
      expect(canonical.rawTransactionIds.length).toBe(3)

      // Raw transactions must reflect the reconciliation link
      const updatedMidtrans = res.updatedRawTransactions.find((r) => r.id === 'tx-midtrans-1')
      const updatedShopee = res.updatedRawTransactions.find((r) => r.id === 'tx-shopee-2')
      expect(updatedMidtrans?.status).toBe('RECONCILED')
      expect(updatedShopee?.duplicateOfId).toBe('tx-midtrans-1')
    })
  })

  describe('Full Master Pipeline with Multi-Source Ingestion & Store', () => {
    it('executes master EmailIntelligenceService.processInbox directly', () => {
      const result = EmailIntelligenceService.processInbox()
      expect(result.totalScanned).toBe(7)
      expect(result.totalDuplicatesMerged).toBe(2)
      expect(result.reconciledEntries.length).toBe(3)
    })

    it('aggregates reconciled entries into report with deliverable text', () => {
      const res = EmailIntelligenceService.processInbox()
      const report = EmailReportAggregator.aggregate(
        res.extractedTransactions,
        res.reconciledEntries,
        'FINANCE',
        res.totalScanned,
        res.ignoredCount,
        res.totalDuplicatesMerged
      )
      expect(report.markdownDeliverable).toContain('Jaminan Keamanan Akuntansi (Anti-Triple-Counting)')
      expect(report.totalReconciledUniqueTransactions).toBe(3)
    })

    it('executes master EmailIntelligenceService, merges multi-channel duplicates, and populates canonical ledger', async () => {
      const store = useEmailIntelligenceStore()
      const result = await store.processInboxEmails()

      expect(result.totalScanned).toBe(7)
      expect(result.passedFilter).toBe(5) // 5 operational emails passed
      expect(result.ignoredCount).toBe(2) // 2 spam/newsletters discarded

      // Reconciled entries should merge the 3 multi-channel items (Midtrans + Shopee + BCA) for SAT-9921
      expect(result.totalDuplicatesMerged).toBe(2)
      expect(result.reconciledEntries.length).toBe(3) // 1 for SAT-9921, 1 for Consulting, 1 for Expense

      // Financial figures should be clean and accurate
      expect(store.totalIncome).toBe(2100000 + 1250000) // 3.350.000
      expect(store.totalFee).toBe(5000)
      expect(store.totalExpense).toBe(350000)
      expect(store.netRevenue).toBe(3350000 - 350000 - 5000) // 2.995.000
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
