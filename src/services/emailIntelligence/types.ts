/**
 * SATRIA AI WORKFORCE — EMAIL INTELLIGENCE ENGINE TYPES
 */

import type {
  EmailCategory,
  EmailFilterRule,
  StructuredEmailTransaction,
  ReconciledJournalEntry,
  EmailIntelligenceReport
} from '../../types'

export interface RawEmail {
  id: string
  threadId?: string
  from: string
  to: string[]
  subject: string
  body: string
  snippet: string
  date: string
  labels?: string[]
  hasAttachment?: boolean
}

export interface Layer1FilterResult {
  emailId: string
  isRelevant: boolean
  matchedRule?: EmailFilterRule
  reason: string
  discardReason?: string
}

export interface Layer2ClassificationResult {
  emailId: string
  category: EmailCategory
  source: string
  confidence: number
  justification: string
}

export interface EmailPipelineResult {
  totalScanned: number
  passedFilter: number
  ignoredCount: number
  totalDuplicatesMerged: number
  extractedTransactions: StructuredEmailTransaction[]
  reconciledEntries: ReconciledJournalEntry[]
  report: EmailIntelligenceReport
}
