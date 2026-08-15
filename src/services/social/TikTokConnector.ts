import type { ISocialConnector, PublishPayload, PublishResult } from './types'

export class TikTokConnector implements ISocialConnector {
  public readonly platform = 'tiktok'

  public validatePayload(payload: PublishPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const adaptation = payload.content.platformVersions?.tiktok
    const hook = adaptation?.hook || ''
    const script = adaptation?.script || payload.content.caption || ''

    if (!hook.trim() && !script.trim()) {
      errors.push('TikTok membutuhkan Script atau Hook pembuka.')
    }

    if (payload.connection.status !== 'Connected') {
      errors.push(`Koneksi TikTok (${payload.connection.accountHandle}) tidak aktif.`)
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

    await new Promise((resolve) => setTimeout(resolve, 700))

    const mockVideoId = `7${Math.floor(100000000000000000 + Math.random() * 900000000000000000)}`
    return {
      success: true,
      externalId: mockVideoId,
      externalUrl: `https://www.tiktok.com/@${(payload.connection.accountHandle || 'user').replace('@', '')}/video/${mockVideoId}`
    }
  }
}
