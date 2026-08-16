/**
 * SATRIA AI WORKFORCE — RECIPIENT SECURITY POLICY ENGINE
 *
 * Enforces domain whitelisting, phishing prevention, and data loss prevention (DLP)
 * for all outbound automated email communications.
 */

export interface RecipientPolicyResult {
  allowed: boolean
  domain: string
  isExternal: boolean
  requiresApproval: boolean
  reason?: string
}

export class RecipientSecurityPolicy {
  private static defaultAllowedDomains = [
    'satria.workforce.ai',
    'clientcorp.com',
    'vendorpartner.id',
    'company.co.id'
  ]

  private static blacklistedDomains = [
    'tempmail.com',
    '10minutemail.com',
    'mailinator.com',
    'guerrillamail.com',
    'throwawaymail.com',
    'malicious.com'
  ]

  /**
   * Extracts domain from email address
   */
  public static extractDomain(email: string): string {
    const parts = email.trim().toLowerCase().split('@')
    return parts.length === 2 ? parts[1] : ''
  }

  /**
   * Evaluates recipient email against security policies
   */
  public static evaluateRecipient(
    recipientEmail: string,
    customAllowedDomains?: string[]
  ): RecipientPolicyResult {
    const domain = this.extractDomain(recipientEmail)

    if (!domain) {
      return {
        allowed: false,
        domain: '',
        isExternal: true,
        requiresApproval: true,
        reason: `Format email tidak valid: "${recipientEmail}"`
      }
    }

    // 1. Check blacklist
    if (this.blacklistedDomains.includes(domain)) {
      return {
        allowed: false,
        domain,
        isExternal: true,
        requiresApproval: true,
        reason: `Pengiriman ke domain sementara/berbahaya (${domain}) dilarang oleh Security Policy.`
      }
    }

    const allowedList = customAllowedDomains && customAllowedDomains.length > 0
      ? customAllowedDomains
      : this.defaultAllowedDomains

    const isAllowed = allowedList.some((d) => domain === d.toLowerCase() || domain.endsWith(`.${d.toLowerCase()}`))
    const isInternal = domain === 'satria.workforce.ai'

    if (!isAllowed) {
      return {
        allowed: false,
        domain,
        isExternal: true,
        requiresApproval: true,
        reason: `Domain ${domain} belum terdaftar pada Whitelist Recipient Policy.`
      }
    }

    return {
      allowed: true,
      domain,
      isExternal: !isInternal,
      requiresApproval: !isInternal // External domains require manager approval before sending
    }
  }
}
