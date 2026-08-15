import type { ISocialConnector, PublishPayload, PublishResult } from './types'

export class FacebookPageConnector implements ISocialConnector {
  public readonly platform = 'facebook_page'

  public validatePayload(payload: PublishPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const adaptation = payload.content.platformVersions?.facebook_page
    const text = [adaptation?.caption || payload.content.caption || '', adaptation?.cta || ''].filter(Boolean).join('\n\n')

    if (!text.trim()) {
      errors.push('Postingan Facebook Page tidak boleh kosong.')
    }

    if (payload.connection.status !== 'Connected') {
      errors.push(`Koneksi Facebook Page (${payload.connection.accountName}) tidak aktif.`)
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

    await new Promise((resolve) => setTimeout(resolve, 500))

    const mockPostId = `fb_post_${Date.now()}`
    return {
      success: true,
      externalId: mockPostId,
      externalUrl: `https://facebook.com/${payload.connection.accountId || 'page'}/posts/${mockPostId}`
    }
  }
}
