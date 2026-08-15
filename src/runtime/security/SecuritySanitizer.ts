/**
 * SATRIA AI WORKFORCE — Security Sanitizer
 * Automatically redacts API keys, passwords, bearer tokens, private keys,
 * and database credentials from logs, task outputs, and diff payloads.
 */

export interface DetectedSecret {
  type: string
  match: string
  index: number
}

export class SecuritySanitizer {
  private static readonly SECRET_PATTERNS: { name: string; regex: RegExp; replacement: string }[] = [
    // OpenAI API Keys
    {
      name: 'OpenAI API Key',
      regex: /sk-(?:proj-)?[a-zA-Z0-9_-]{20,}/g,
      replacement: '[REDACTED_OPENAI_KEY]'
    },
    // Anthropic API Keys
    {
      name: 'Anthropic API Key',
      regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g,
      replacement: '[REDACTED_ANTHROPIC_KEY]'
    },
    // GitHub Tokens
    {
      name: 'GitHub Token',
      regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}|github_pat_[a-zA-Z0-9_]{40,}/g,
      replacement: '[REDACTED_GITHUB_TOKEN]'
    },
    // AWS Access Key ID
    {
      name: 'AWS Access Key',
      regex: /\bAKIA[0-9A-Z]{16}\b/g,
      replacement: '[REDACTED_AWS_KEY]'
    },
    // Private RSA / ED25519 Keys
    {
      name: 'Private Key',
      regex: /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP|ENCRYPTED)? ?PRIVATE KEY-----[a-zA-Z0-9+/=\s\r\n]+-----END (?:RSA|EC|OPENSSH|DSA|PGP|ENCRYPTED)? ?PRIVATE KEY-----/g,
      replacement: '[REDACTED_PRIVATE_KEY]'
    },
    // Bearer Authorization Header Tokens
    {
      name: 'Bearer Token',
      regex: /(?:Bearer\s+)[a-zA-Z0-9_.-]{24,}/gi,
      replacement: 'Bearer [REDACTED_TOKEN]'
    },
    // Database Connection Strings with Passwords
    {
      name: 'Database URL',
      regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[a-zA-Z0-9_]+:[^@\s]+@[a-zA-Z0-9_.-]+(?::\d+)?\/[^\s?]+/gi,
      replacement: '[REDACTED_DATABASE_URL]'
    },
    // Key/Password assignments in code / configs
    {
      name: 'Generic Credential Assignment',
      regex: /(?:api_?key|auth_?token|secret_?key|client_?secret|password|access_?token)\s*[:=]\s*["']([^"'\s]{8,})["']/gi,
      replacement: '$1: "[REDACTED_CREDENTIAL]"'
    }
  ]

  /**
   * Redacts sensitive secrets from a string
   */
  public static sanitizeText(input: string | null | undefined): string {
    if (!input || typeof input !== 'string') return ''

    let sanitized = input
    for (const pattern of this.SECRET_PATTERNS) {
      sanitized = sanitized.replace(pattern.regex, pattern.replacement)
    }
    return sanitized
  }

  /**
   * Recursively sanitizes strings inside objects or arrays
   */
  public static sanitizeObject<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'string') {
      return this.sanitizeText(obj) as unknown as T
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item)) as unknown as T
    }
    if (typeof obj === 'object') {
      const result: Record<string, any> = {}
      for (const [key, value] of Object.entries(obj)) {
        // Redact key itself if it looks like a sensitive credential key
        if (/api_?key|secret|token|password|credential/i.test(key) && typeof value === 'string' && value.length > 0) {
          result[key] = '[REDACTED_CREDENTIAL]'
        } else {
          result[key] = this.sanitizeObject(value)
        }
      }
      return result as T
    }
    return obj
  }

  /**
   * Checks if input contains any known sensitive secret pattern
   */
  public static containsSecret(input: string | null | undefined): boolean {
    if (!input || typeof input !== 'string') return false
    for (const pattern of this.SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0
      if (pattern.regex.test(input)) {
        return true
      }
    }
    return false
  }

  /**
   * Returns list of secret types detected in string
   */
  public static detectSecrets(input: string | null | undefined): string[] {
    if (!input || typeof input !== 'string') return []
    const detected: string[] = []
    for (const pattern of this.SECRET_PATTERNS) {
      pattern.regex.lastIndex = 0
      if (pattern.regex.test(input)) {
        detected.push(pattern.name)
      }
    }
    return detected
  }
}
