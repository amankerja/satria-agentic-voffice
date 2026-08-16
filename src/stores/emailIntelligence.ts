import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  EmailFilterRule,
  StructuredEmailTransaction,
  EmailIntelligenceReport
} from '../types'
import { EmailFilterEngine } from '../services/emailIntelligence/EmailFilterEngine'
import { EmailIntelligenceService } from '../services/emailIntelligence/EmailIntelligenceService'
import { useToast } from '../composables/useToast'

export const useEmailIntelligenceStore = defineStore('emailIntelligence', () => {
  const toast = useToast()

  const rules = ref<EmailFilterRule[]>([...EmailFilterEngine.DEFAULT_RULES])
  const transactions = ref<StructuredEmailTransaction[]>([])
  const latestReport = ref<EmailIntelligenceReport | null>(null)
  const isProcessing = ref(false)
  const totalScanned = ref(0)
  const passedFilterCount = ref(0)
  const ignoredCount = ref(0)

  const totalIncome = computed(() => {
    return transactions.value
      .filter((t) => t.type === 'INCOME' || t.type === 'SETTLEMENT')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const totalExpense = computed(() => {
    return transactions.value
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const netRevenue = computed(() => totalIncome.value - totalExpense.value)

  async function processInboxEmails() {
    isProcessing.value = true
    try {
      // Simulate pipeline execution latency
      await new Promise((res) => setTimeout(res, 800))

      const result = EmailIntelligenceService.processInbox(
        EmailIntelligenceService.SAMPLE_INBOX_EMAILS,
        rules.value
      )

      totalScanned.value = result.totalScanned
      passedFilterCount.value = result.passedFilter
      ignoredCount.value = result.ignoredCount
      transactions.value = result.extractedTransactions
      latestReport.value = result.report

      toast.success(`Email Intelligence: ${result.passedFilter}/${result.totalScanned} email diproses, ${result.ignoredCount} diabaikan (Layer 1 Filter).`)
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
    latestReport,
    isProcessing,
    totalScanned,
    passedFilterCount,
    ignoredCount,
    totalIncome,
    totalExpense,
    netRevenue,
    processInboxEmails,
    toggleRule
  }
})
