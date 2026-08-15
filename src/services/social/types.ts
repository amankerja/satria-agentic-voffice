import type { PlatformTarget, ContentItem, Publication, MediaAsset, SocialConnection } from '../../types'

export interface PublishPayload {
  content: ContentItem
  publication: Publication
  connection: SocialConnection
  mediaAssets?: MediaAsset[]
}

export interface PublishResult {
  success: boolean
  externalId?: string
  externalUrl?: string
  error?: string
  isAssisted?: boolean
  assistedPayload?: {
    copyText: string
    mediaUrls: string[]
    targetUrl: string
    targetName: string
  }
}

export interface ISocialConnector {
  readonly platform: PlatformTarget
  validatePayload(payload: PublishPayload): { valid: boolean; errors: string[] }
  publish(payload: PublishPayload): Promise<PublishResult>
}
