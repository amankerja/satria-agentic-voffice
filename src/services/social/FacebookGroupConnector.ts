import type { ISocialConnector, PublishPayload, PublishResult } from './types'

export class FacebookGroupConnector implements ISocialConnector {
  public readonly platform = 'facebook_group'

  public validatePayload(payload: PublishPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const text = payload.content.caption || payload.content.title || ''

    if (!text.trim()) {
      errors.push('Teks postingan untuk grup Facebook tidak boleh kosong.')
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

    const adaptation = payload.content.platformVersions?.facebook_page
    const copyText = [
      payload.content.title,
      '',
      adaptation?.caption || payload.content.caption || '',
      adaptation?.cta ? `\n👉 ${adaptation.cta}` : ''
    ].join('\n')

    const targetUrl = payload.connection.accountHandle?.includes('facebook.com')
      ? payload.connection.accountHandle
      : `https://facebook.com/groups/${payload.connection.accountId || 'sample_group'}`

    return {
      success: true,
      isAssisted: true,
      assistedPayload: {
        copyText,
        mediaUrls: (payload.mediaAssets || []).map((m) => m.url),
        targetUrl,
        targetName: payload.connection.accountName
      }
    }
  }
}
