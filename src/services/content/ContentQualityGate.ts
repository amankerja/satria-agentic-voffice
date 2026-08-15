import type { ContentItem, ContentQualityCheck, MediaAsset } from '../../types'

export interface QualityGateOptions {
  prohibitedKeywords?: string[]
  brandGuidelines?: {
    requiredHashtags?: string[]
    maxCaptionLength?: number
    prohibitedClaims?: string[]
  }
}

export class ContentQualityGate {
  private static defaultProhibitedWords = [
    'garansi 100% kaya',
    'skema cepat kaya',
    'pasti untung tanpa risiko',
    'bocoran judi',
    'penipuan'
  ]

  public static evaluate(
    content: Partial<ContentItem>,
    mediaAssets: MediaAsset[] = [],
    options: QualityGateOptions = {}
  ): ContentQualityCheck {
    const notes: string[] = []
    let score = 100

    const textToScan = [
      content.title || '',
      content.caption || '',
      ...(Object.values(content.platformVersions || {}).map((v) => `${v?.caption || ''} ${v?.hook || ''} ${v?.script || ''}`))
    ].join(' ').toLowerCase()

    // 1. Prohibited / Sensitive content check
    const prohibited = [...this.defaultProhibitedWords, ...(options.prohibitedKeywords || [])]
    const matchedProhibited = prohibited.filter((kw) => textToScan.includes(kw.toLowerCase()))
    const noSensitiveContent = matchedProhibited.length === 0
    if (!noSensitiveContent) {
      score -= 35
      notes.push(`Ditemukan kata/frasa berisiko: ${matchedProhibited.join(', ')}`)
    }

    // 2. Grammar & Length quality check
    let grammarQuality = true
    if (!content.title || content.title.trim().length < 5) {
      grammarQuality = false
      score -= 15
      notes.push('Judul konten terlalu singkat (minimal 5 karakter).')
    }
    if (!content.caption || content.caption.trim().length < 20) {
      grammarQuality = false
      score -= 15
      notes.push('Deskripsi / caption utama terlalu singkat (minimal 20 karakter).')
    }

    // 3. Link validity check
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = textToScan.match(urlRegex) || []
    let linksValid = true
    for (const url of urls) {
      try {
        new URL(url)
      } catch {
        linksValid = false
        score -= 10
        notes.push(`URL tidak valid ditemukan: ${url}`)
      }
    }

    // 4. Media validity check
    let mediaValid = true
    if (content.mediaAssetIds && content.mediaAssetIds.length > 0) {
      const missingMedia = content.mediaAssetIds.filter((id) => !mediaAssets.some((m) => m.id === id))
      if (missingMedia.length > 0) {
        mediaValid = false
        score -= 15
        notes.push(`Aset media tidak ditemukan di perpustakaan: ${missingMedia.join(', ')}`)
      }
    }

    // 5. Brand compliance check
    let brandCompliance = true
    if (options.brandGuidelines?.requiredHashtags) {
      const missingTags = options.brandGuidelines.requiredHashtags.filter(
        (tag) => !textToScan.includes(tag.toLowerCase())
      )
      if (missingTags.length > 0) {
        brandCompliance = false
        score -= 10
        notes.push(`Hashtag wajib brand belum tercantum: ${missingTags.join(', ')}`)
      }
    }

    score = Math.max(0, Math.min(100, score))

    if (score >= 90 && notes.length === 0) {
      notes.push('Konten memenuhi seluruh standar kualitas dan kepatuhan brand.')
    }

    return {
      brandCompliance,
      grammarQuality,
      noSensitiveContent,
      linksValid,
      mediaValid,
      score,
      notes
    }
  }
}
