import type { ISocialConnector, PublishPayload, PublishResult } from './types'

export class InstagramConnector implements ISocialConnector {
  public readonly platform = 'instagram'

  public validatePayload(payload: PublishPayload): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const adaptation = payload.content.platformVersions?.instagram
    const text = adaptation?.caption || payload.content.caption || ''

    if (!text.trim()) {
      errors.push('Instagram caption tidak boleh kosong.')
    }

    if (text.length > 2200) {
      errors.push(`Instagram caption melebihi batas 2200 karakter (${text.length} karakter).`)
    }

    if (payload.connection.status !== 'Connected') {
      errors.push(`Koneksi akun Instagram (${payload.connection.accountHandle}) tidak aktif atau kadaluarsa.`)
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

    // Simulation delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    const mockId = `ig_post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    return {
      success: true,
      externalId: mockId,
      externalUrl: `https://instagram.com/p/${mockId}`
    }
  }
}
