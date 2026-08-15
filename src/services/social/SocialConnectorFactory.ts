import type { PlatformTarget } from '../../types'
import type { ISocialConnector } from './types'
import { InstagramConnector } from './InstagramConnector'
import { FacebookPageConnector } from './FacebookPageConnector'
import { TikTokConnector } from './TikTokConnector'
import { FacebookGroupConnector } from './FacebookGroupConnector'

export class SocialConnectorFactory {
  private static connectors: Map<PlatformTarget, ISocialConnector> = new Map<PlatformTarget, ISocialConnector>([
    ['instagram', new InstagramConnector() as ISocialConnector],
    ['facebook_page', new FacebookPageConnector() as ISocialConnector],
    ['tiktok', new TikTokConnector() as ISocialConnector],
    ['facebook_group', new FacebookGroupConnector() as ISocialConnector]
  ])

  public static get(platform: PlatformTarget): ISocialConnector {
    const connector = this.connectors.get(platform)
    if (!connector) {
      throw new Error(`Social connector untuk platform "${platform}" tidak ditemukan.`)
    }
    return connector
  }
}
