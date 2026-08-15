import type { ISocialConnector, PublishPayload, PublishResult } from './types'

export class ThreadsConnector implements ISocialConnector {
  public readonly platform = 'threads'

  public validatePayload(payload: PublishPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const adaptation = payload.content.platformVersions?.instagram
    const text = payload.content.caption || adaptation?.caption || payload.content.title || ''

    if (!text.trim()) {
      errors.push('Teks thread tidak boleh kosong.')
    }

    if (text.length > 500) {
      errors.push(`Threads memiliki batas 500 karakter (${text.length} karakter).`)
    }

    if (payload.connection.status !== 'Connected') {
      errors.push(`Koneksi akun Threads (${payload.connection.accountHandle}) tidak aktif.`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  public async publish(payload: PublishPayload): Promise<PublishResult> {
    const validation = this.validatePayload(payload)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; ')
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 550))

    const mockThreadId = `th_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    return {
      success: true,
      externalId: mockThreadId,
      externalUrl: `https://www.threads.net/@${(payload.connection.accountHandle || 'user').replace('@', '')}/post/${mockThreadId}`
    }
  }
}
