import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  EmailFilterRule,
  StructuredEmailTransaction,
  ReconciledJournalEntry,
  EmailIntelligenceReport
} from '../types'
import { EmailFilterEngine } from '../services/emailIntelligence/EmailFilterEngine'
import { EmailIntelligenceService } from '../services/emailIntelligence/EmailIntelligenceService'
import { useToast } from '../composables/useToast'

export const useEmailIntelligenceStore = defineStore('emailIntelligence', () => {
  const toast = useToast()

  const rules = ref<EmailFilterRule[]>([...EmailFilterEngine.DEFAULT_RULES])
  const transactions = ref<StructuredEmailTransaction[]>([])
  const reconciledEntries = ref<ReconciledJournalEntry[]>([])
  const latestReport = ref<EmailIntelligenceReport | null>(null)
  const isProcessing = ref(false)
  const totalScanned = ref(0)
  const passedFilterCount = ref(0)
  const ignoredCount = ref(0)
  const totalDuplicatesMerged = ref(0)

  // Reconciled Accounting Totals (Guaranteed free from triple-counting)
  const totalIncome = computed(() => {
    return reconciledEntries.value
      .filter((t) => t.entryType !== 'EXPENSE')
      .reduce((sum, t) => sum + t.grossAmount, 0)
  })

  const totalFee = computed(() => {
    return reconciledEntries.value
      .reduce((sum, t) => sum + t.totalFee, 0)
  })

  const totalExpense = computed(() => {
    const fromReconciled = reconciledEntries.value
      .filter((t) => t.entryType === 'EXPENSE')
      .reduce((sum, t) => sum + t.grossAmount, 0)

    if (fromReconciled > 0) return fromReconciled

    return transactions.value
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const netRevenue = computed(() => totalIncome.value - totalExpense.value - totalFee.value)

  async function processInboxEmails() {
    isProcessing.value = true
    try {
      await new Promise((res) => setTimeout(res, 800))

      const result = EmailIntelligenceService.processInbox(
        EmailIntelligenceService.SAMPLE_INBOX_EMAILS,
        rules.value
      )

      totalScanned.value = result.totalScanned
      passedFilterCount.value = result.passedFilter
      ignoredCount.value = result.ignoredCount
      totalDuplicatesMerged.value = result.totalDuplicatesMerged
      transactions.value = result.extractedTransactions
      reconciledEntries.value = result.reconciledEntries
      latestReport.value = result.report

      toast.success(
        `Email Intelligence: ${result.reconciledEntries.length} entri buku kas sah (${result.totalDuplicatesMerged} duplikasi multi-channel berhasil direkonsiliasi).`
      )
      return result
    } catch (err: any) {
      toast.error('Gagal memproses email intelligence: ' + err.message)
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  function toggleRule(ruleId: string) {
    const r = rules.value.find((x) => x.id === ruleId)
    if (r) {
      r.enabled = !r.enabled
      toast.info(`Aturan filter "${r.name}" ${r.enabled ? 'diaktifkan' : 'dinonaktifkan'}.`)
    }
  }

  return {
    rules,
    transactions,
    reconciledEntries,
    latestReport,
    isProcessing,
    totalScanned,
    passedFilterCount,
    ignoredCount,
    totalDuplicatesMerged,
    totalIncome,
    totalFee,
    totalExpense,
    netRevenue,
    processInboxEmails,
    toggleRule
  }
})
