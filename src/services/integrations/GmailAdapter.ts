import type {
  IIntegrationAdapter,
  HealthResult,
  ToolResult,
  EmailMessage,
  EmailDraft
} from './types'
import type { IntegrationConnection } from '../../types'

export class GmailAdapter implements IIntegrationAdapter {
  public readonly providerId = 'gmail'

  private mockInbox: EmailMessage[] = [
    {
      id: 'msg-01',
      threadId: 'th-901',
      from: 'budi.santoso@clientcorp.com',
      to: ['support@satria.workforce.ai'],
      subject: '[URGENT] Bug: HTTP 500 saat refresh auth token transaksi',
      body: 'Halo tim Satria,\n\nKami mendapati error 500 di sistem checkout saat token expired di jam sibuk pagi ini. Mohon bantuannya segera diperiksa dan diperbaiki.\n\nTerlampir log error:\nJWT_REFRESH_RACE_CONDITION: auth_handler.go:48\n\nSalam,\nBudi Santoso',
      snippet: 'Kami mendapati error 500 di sistem checkout saat token expired di jam sibuk pagi ini...',
      date: new Date(Date.now() - 1800000).toISOString(),
      isUnread: true,
      labels: ['INBOX', 'URGENT', 'CUSTOMER'],
      attachments: [
        {
          id: 'att-01',
          filename: 'error_trace.log',
          mimeType: 'text/plain',
          sizeBytes: 14200
        }
      ]
    },
    {
      id: 'msg-02',
      threadId: 'th-902',
      from: 'finance@vendorpartner.id',
      to: ['ops@satria.workforce.ai'],
      subject: 'Invoice Bulanan Server & Cloud Infrastructure #INV-2026-08',
      body: 'Yth. Manajemen Satria AI,\n\nBerikut terlampir invoice tagihan cluster server periode Agustus 2026 sebesar Rp12.500.000.\n\nTerima kasih.',
      snippet: 'Berikut terlampir invoice tagihan cluster server periode Agustus 2026...',
      date: new Date(Date.now() - 7200000).toISOString(),
      isUnread: false,
      labels: ['INBOX', 'FINANCE']
    }
  ]

  private mockDrafts: EmailDraft[] = []

  public async validateConnection(connection: IntegrationConnection): Promise<HealthResult> {
    await new Promise((resolve) => setTimeout(resolve, 250))
    const isConnected = connection.status === 'Connected'
    return {
      healthy: isConnected,
      status: connection.status,
      latencyMs: 98,
      message: isConnected
        ? `Koneksi Google Mailbox (${connection.accountLabel}) aktif. OAuth token valid.`
        : 'Token Gmail kadaluarsa atau otorisasi dicabut.',
      validatedAt: new Date().toISOString()
    }
  }

  public async execute(
    connection: IntegrationConnection,
    toolName: string,
    action: string,
    args: Record<string, any>
  ): Promise<ToolResult> {
    await new Promise((resolve) => setTimeout(resolve, 350))

    switch (toolName) {
      case 'email.list_messages':
      case 'email.search_messages': {
        const query = (args.query || '').toLowerCase()
        const unreadOnly = Boolean(args.unreadOnly)

        let filtered = this.mockInbox
        if (unreadOnly) {
          filtered = filtered.filter((m) => m.isUnread)
        }
        if (query) {
          filtered = filtered.filter(
            (m) =>
              m.subject.toLowerCase().includes(query) ||
              m.body.toLowerCase().includes(query) ||
              m.from.toLowerCase().includes(query)
          )
        }

        return {
          success: true,
          provider: 'gmail',
          toolName,
          action: 'read',
          data: filtered,
          evidence: [
            {
              type: 'email.search_result',
              label: `Inbox Query: "${query || 'all'}"`,
              summary: `Ditemukan ${filtered.length} pesan email cocok di ${connection.accountLabel}`
            }
          ]
        }
      }

      case 'email.get_message': {
        const id = args.messageId || 'msg-01'
        const msg = this.mockInbox.find((m) => m.id === id) || this.mockInbox[0]
        msg.isUnread = false

        return {
          success: true,
          provider: 'gmail',
          toolName,
          action: 'read',
          data: msg,
          evidence: [
            {
              type: 'email.message',
              label: `Email: ${msg.subject}`,
              summary: `Dari: ${msg.from} | Waktu: ${new Date(msg.date).toLocaleTimeString('id-ID')}`
            }
          ]
        }
      }

      case 'email.create_draft': {
        const to = Array.isArray(args.to) ? args.to : [args.to || 'budi.santoso@clientcorp.com']
        const newDraft: EmailDraft = {
          id: `draft-${Date.now()}`,
          threadId: args.threadId || 'th-901',
          to,
          subject: args.subject || 'Re: [URGENT] Bug: HTTP 500 saat refresh auth token transaksi',
          body:
            args.body ||
            'Halo Pak Budi,\n\nTerima kasih laporannya. Tim engineering AI Satria telah menganalisis root cause pada auth_handler.go, menerapkan mutex lock fix, dan mempublikasikan PR #88. Update perbaikan sudah diuji dan berhasil deploy.\n\nSalam,\nRaka (Satria AI Workforce Operations)',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        this.mockDrafts.push(newDraft)

        return {
          success: true,
          provider: 'gmail',
          toolName,
          action: 'write',
          data: newDraft,
          evidence: [
            {
              type: 'email.draft',
              id: newDraft.id,
              label: `Draft Prepared: ${newDraft.subject}`,
              summary: `Kepada: ${newDraft.to.join(', ')} | Panjang: ${newDraft.body.length} karakter`
            }
          ]
        }
      }

      case 'email.send': {
        const to = Array.isArray(args.to) ? args.to : [args.to || 'budi.santoso@clientcorp.com']
        const subject = args.subject || 'Laporan Penyelesaian Bug & Update Sistem'

        // Domain validation policy check
        const blockedDomains = ['malicious.com', 'spam.org']
        const hasBlocked = to.some((recipient: string) =>
          blockedDomains.some((d) => recipient.toLowerCase().endsWith(d))
        )
        if (hasBlocked) {
          return {
            success: false,
            provider: 'gmail',
            toolName,
            action: 'write',
            error: {
              code: 'POLICY_DENIED',
              message: 'Pengiriman email ke domain penerima terblokir oleh Kebijakan Keamanan Satria.',
              retryable: false
            }
          }
        }

        const sentId = `sent-${Date.now()}`
        return {
          success: true,
          provider: 'gmail',
          toolName,
          action: 'write',
          data: {
            messageId: sentId,
            threadId: args.threadId || 'th-901',
            to,
            subject,
            sentAt: new Date().toISOString(),
            status: 'Delivered'
          },
          evidence: [
            {
              type: 'email.sent',
              id: sentId,
              label: `Email Sent: ${subject}`,
              summary: `Terkirim ke: ${to.join(', ')} melalui ${connection.accountLabel}`
            }
          ]
        }
      }

      default:
        return {
          success: false,
          provider: 'gmail',
          toolName,
          action,
          error: {
            code: 'UNKNOWN_TOOL',
            message: `Tool ${toolName} tidak dikenal pada adapter Gmail.`,
            retryable: false
          }
        }
    }
  }
}
