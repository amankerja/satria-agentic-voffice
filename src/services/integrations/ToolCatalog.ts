/**
 * SATRIA AI WORKFORCE — INTEGRATION TOOL CATALOG
 *
 * Formal registry of all available external integration tools (GitHub, Gmail, Slack, Drive).
 * Contains parameter schemas, risk levels, and approval gate requirements.
 */

import type { IntegrationProviderType, RiskLevel } from '../../types'

export interface ToolParameterSchema {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description: string
  example?: any
}

export interface IntegrationToolDefinition {
  id: string
  provider: IntegrationProviderType
  name: string
  displayName: string
  action: 'read' | 'write' | 'admin'
  description: string
  riskLevel: RiskLevel
  defaultApprovalRequired: boolean
  requiredScopes: string[]
  parameters: ToolParameterSchema[]
  outputSummary: string
  timeoutMs: number
}

export class ToolCatalog {
  private static tools: IntegrationToolDefinition[] = [
    // ==========================================
    // GITHUB TOOL CATALOG
    // ==========================================
    {
      id: 'github.list_repositories',
      provider: 'github',
      name: 'github.list_repositories',
      displayName: 'List Repositories',
      action: 'read',
      description: 'Mendapatkan daftar repository yang terhubung dan dapat diakses oleh SATRIA Workforce.',
      riskLevel: 'LOW',
      defaultApprovalRequired: false,
      requiredScopes: ['repo', 'read:org'],
      parameters: [
        { name: 'org', type: 'string', required: false, description: 'Nama organisasi GitHub target', example: 'satria-workforce' }
      ],
      outputSummary: 'Array daftar repository dengan id, name, defaultBranch, openIssuesCount.',
      timeoutMs: 10000
    },
    {
      id: 'github.get_repository',
      provider: 'github',
      name: 'github.get_repository',
      displayName: 'Get Repository Info',
      action: 'read',
      description: 'Mendapatkan metadata lengkap, branch default, dan status repository.',
      riskLevel: 'LOW',
      defaultApprovalRequired: false,
      requiredScopes: ['repo'],
      parameters: [
        { name: 'repo', type: 'string', required: true, description: 'Nama repository GitHub', example: 'satria-api' }
      ],
      outputSummary: 'Objek detail repository.',
      timeoutMs: 10000
    },
    {
      id: 'github.get_file',
      provider: 'github',
      name: 'github.get_file',
      displayName: 'Read Remote File',
      action: 'read',
      description: 'Membaca isi file kode dari branch atau commit tertentu.',
      riskLevel: 'LOW',
      defaultApprovalRequired: false,
      requiredScopes: ['repo'],
      parameters: [
        { name: 'repo', type: 'string', required: true, description: 'Nama repository', example: 'satria-api' },
        { name: 'path', type: 'string', required: true, description: 'Jalur file di repository', example: 'pkg/auth/auth_handler.go' },
        { name: 'ref', type: 'string', required: false, description: 'Branch atau commit hash', example: 'main' }
      ],
      outputSummary: 'Konten file text / base64 beserta SHA commit.',
      timeoutMs: 15000
    },
    {
      id: 'github.create_branch',
      provider: 'github',
      name: 'github.create_branch',
      displayName: 'Create Git Branch',
      action: 'write',
      description: 'Membuat branch baru untuk isolasi perbaikan atau fitur.',
      riskLevel: 'LOW',
      defaultApprovalRequired: false,
      requiredScopes: ['repo'],
      parameters: [
        { name: 'repo', type: 'string', required: true, description: 'Nama repository', example: 'satria-api' },
        { name: 'branch', type: 'string', required: true, description: 'Nama branch baru', example: 'fix/auth-token-leak' },
        { name: 'base', type: 'string', required: false, description: 'Branch asal / acuan', example: 'main' }
      ],
      outputSummary: 'Objek branch yang berhasil dibuat beserta ref SHA.',
      timeoutMs: 10000
    },
    {
      id: 'github.update_file',
      provider: 'github',
      name: 'github.update_file',
      displayName: 'Commit & Update File',
      action: 'write',
      description: 'Menyimpan modifikasi file atau membuat file baru pada branch target.',
      riskLevel: 'MEDIUM',
      defaultApprovalRequired: false,
      requiredScopes: ['repo'],
      parameters: [
        { name: 'repo', type: 'string', required: true, description: 'Nama repository', example: 'satria-api' },
        { name: 'path', type: 'string', required: true, description: 'Path file yang diubah', example: 'pkg/auth/auth_handler.go' },
        { name: 'content', type: 'string', required: true, description: 'Konten file yang baru' },
        { name: 'message', type: 'string', required: true, description: 'Pesan commit Git', example: 'fix(auth): lock mutex' },
        { name: 'branch', type: 'string', required: true, description: 'Branch target commit', example: 'fix/auth-token-leak' }
      ],
      outputSummary: 'Commit SHA dan metadata file yang diperbarui.',
      timeoutMs: 15000
    },
    {
      id: 'github.create_pull_request',
      provider: 'github',
      name: 'github.create_pull_request',
      displayName: 'Publish Pull Request',
      action: 'write',
      description: 'Menerbitkan Pull Request resmi di GitHub untuk direview oleh tim pengembang.',
      riskLevel: 'HIGH',
      defaultApprovalRequired: true,
      requiredScopes: ['repo', 'pull_requests:write'],
      parameters: [
        { name: 'repo', type: 'string', required: true, description: 'Nama repository', example: 'satria-api' },
        { name: 'title', type: 'string', required: true, description: 'Judul Pull Request', example: 'fix(auth): fix race condition' },
        { name: 'branch', type: 'string', required: true, description: 'Head branch yang berisi patch', example: 'fix/auth-token-leak' },
        { name: 'base', type: 'string', required: false, description: 'Base branch target merge', example: 'main' },
        { name: 'body', type: 'string', required: false, description: 'Deskripsi lengkap perubahan & bukti test' }
      ],
      outputSummary: 'Nomor Pull Request (e.g. #143), URL, diff URL, dan status.',
      timeoutMs: 20000
    },
    {
      id: 'github.list_issues',
      provider: 'github',
      name: 'github.list_issues',
      displayName: 'List Repository Issues',
      action: 'read',
      description: 'Mencari dan membaca issues / bug report pada repository.',
      riskLevel: 'LOW',
      defaultApprovalRequired: false,
      requiredScopes: ['repo'],
      parameters: [
        { name: 'repo', type: 'string', required: true, description: 'Nama repository', example: 'satria-api' },
        { name: 'state', type: 'string', required: false, description: 'Filter status (open | closed | all)', example: 'open' }
      ],
      outputSummary: 'Daftar issues beserta author, label, dan link.',
      timeoutMs: 10000
    },

    // ==========================================
    // EMAIL / GMAIL TOOL CATALOG
    // ==========================================
    {
      id: 'email.search_messages',
      provider: 'gmail',
      name: 'email.search_messages',
      displayName: 'Search Mailbox Messages',
      action: 'read',
      description: 'Mencari email pelanggan berdasarkan query pencarian (subjek, kata kunci error, pengirim).',
      riskLevel: 'LOW',
      defaultApprovalRequired: false,
      requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      parameters: [
        { name: 'query', type: 'string', required: true, description: 'Query pencarian Gmail', example: 'HTTP 500 auth' },
        { name: 'maxResults', type: 'number', required: false, description: 'Jumlah hasil maksimum', example: 10 }
      ],
      outputSummary: 'Array email yang cocok beserta snippet dan messageId.',
      timeoutMs: 10000
    },
    {
      id: 'email.get_message',
      provider: 'gmail',
      name: 'email.get_message',
      displayName: 'Get Email Details',
      action: 'read',
      description: 'Membaca isi lengkap email beserta headers, threadId, dan lampiran.',
      riskLevel: 'LOW',
      defaultApprovalRequired: false,
      requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      parameters: [
        { name: 'messageId', type: 'string', required: true, description: 'ID pesan email', example: 'msg_9921_err' }
      ],
      outputSummary: 'Objek lengkap EmailMessage (pengirim, penerima, tanggal, body text).',
      timeoutMs: 10000
    },
    {
      id: 'email.create_draft',
      provider: 'gmail',
      name: 'email.create_draft',
      displayName: 'Create Email Draft',
      action: 'write',
      description: 'Menyusun draf balasan email di kotak draf tanpa langsung mengirimkannya.',
      riskLevel: 'LOW',
      defaultApprovalRequired: false,
      requiredScopes: ['https://www.googleapis.com/auth/gmail.compose'],
      parameters: [
        { name: 'to', type: 'string', required: true, description: 'Email penerima', example: 'budi.santoso@clientcorp.com' },
        { name: 'subject', type: 'string', required: true, description: 'Subjek email' },
        { name: 'body', type: 'string', required: true, description: 'Isi pesan balasan' },
        { name: 'threadId', type: 'string', required: false, description: 'ID thread untuk balasan langsung' }
      ],
      outputSummary: 'ID draft Gmail yang dibuat.',
      timeoutMs: 10000
    },
    {
      id: 'email.send',
      provider: 'gmail',
      name: 'email.send',
      displayName: 'Send Outbound Email',
      action: 'write',
      description: 'Mengirim email resmi ke klien/eksternal. Wajib melewati validasi Recipient Policy & Approval Gate.',
      riskLevel: 'HIGH',
      defaultApprovalRequired: true,
      requiredScopes: ['https://www.googleapis.com/auth/gmail.send'],
      parameters: [
        { name: 'to', type: 'string', required: true, description: 'Alamat email tujuan', example: 'budi.santoso@clientcorp.com' },
        { name: 'subject', type: 'string', required: true, description: 'Subjek pesan email' },
        { name: 'body', type: 'string', required: true, description: 'Isi pesan teks/HTML' },
        { name: 'cc', type: 'array', required: false, description: 'Alamat tembusan (CC)' }
      ],
      outputSummary: 'ID pesan yang terkirim dan timestamp pengiriman.',
      timeoutMs: 15000
    }
  ]

  public static getAllTools(): IntegrationToolDefinition[] {
    return this.tools
  }

  public static getToolsByProvider(provider: IntegrationProviderType): IntegrationToolDefinition[] {
    return this.tools.filter((t) => t.provider === provider)
  }

  public static getToolDefinition(toolName: string): IntegrationToolDefinition | undefined {
    return this.tools.find((t) => t.name === toolName || t.id === toolName)
  }
}
