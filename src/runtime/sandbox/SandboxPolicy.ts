export interface PathValidationResult {
  allowed: boolean
  normalizedPath: string
  error?: string
}

export type RealPathResolver = (path: string) => string | null | undefined

export interface SandboxPolicyOptions {
  realPathResolver?: RealPathResolver
  symlinks?: Record<string, string>
}

export class SandboxPolicy {
  private allowedBasePath: string
  private realPathResolver?: RealPathResolver
  private symlinkMap: Map<string, string> = new Map()

  constructor(basePath: string, options?: SandboxPolicyOptions) {
    this.allowedBasePath = this.cleanPath(basePath)
    if (options?.realPathResolver) {
      this.realPathResolver = options.realPathResolver
    }
    if (options?.symlinks) {
      for (const [link, target] of Object.entries(options.symlinks)) {
        this.registerSymlink(link, target)
      }
    }
  }

  registerSymlink(linkPath: string, targetPath: string): void {
    const cleanedLink = this.cleanPath(linkPath)
    const cleanedTarget = this.cleanPath(targetPath)
    this.symlinkMap.set(cleanedLink, cleanedTarget)
  }

  private resolveSymlinks(cleanedPath: string): string {
    let current = cleanedPath

    // Check direct match in symlink map
    if (this.symlinkMap.has(current)) {
      current = this.symlinkMap.get(current)!
    }

    // Check prefix symlinks (e.g. symlink/child.txt or c:/workspace/symlink/child.txt)
    for (const [link, target] of this.symlinkMap.entries()) {
      if (current === link) {
        current = target
        break
      } else if (current.startsWith(link + '/')) {
        current = target + current.slice(link.length)
        break
      }
    }

    if (this.realPathResolver) {
      const resolved = this.realPathResolver(current)
      if (resolved) {
        current = this.cleanPath(resolved)
      }
    }

    return current
  }

  validatePath(targetPath: string): PathValidationResult {
    if (!targetPath || targetPath.trim() === '') {
      return { allowed: false, normalizedPath: '', error: 'Target path cannot be empty.' }
    }

    const cleaned = this.cleanPath(targetPath)

    // 1. Block path traversal tokens anywhere in path segments
    const segments = cleaned.split('/')
    if (segments.includes('..') || cleaned.includes('..') || cleaned.includes('/../') || cleaned.startsWith('../')) {
      return { allowed: false, normalizedPath: cleaned, error: 'Path traversal (..) is strictly forbidden.' }
    }

    // 2. Resolve symlinks and perform Canonical RealPath checks (Symlink Defense)
    const resolvedPath = this.resolveSymlinks(cleaned)
    const isResolvedAbsolute = /^[a-zA-Z]:\//.test(resolvedPath) || resolvedPath.startsWith('/')

    if (isResolvedAbsolute) {
      const isResolvedExactMatch = resolvedPath === this.allowedBasePath
      const isResolvedSubPath = resolvedPath.startsWith(this.allowedBasePath + '/')

      if (!isResolvedExactMatch && !isResolvedSubPath) {
        return {
          allowed: false,
          normalizedPath: cleaned,
          error: `Access denied. Target path "${cleaned}" resolves outside workspace root "${this.allowedBasePath}". Sibling directories and symlink escapes are prohibited.`
        }
      }
    }

    // 3. Absolute Path Handling & Strict Boundary Check on cleaned candidate
    const isAbsolute = /^[a-zA-Z]:\//.test(cleaned) || cleaned.startsWith('/')
    if (isAbsolute) {
      const isExactMatch = cleaned === this.allowedBasePath
      const isSubPath = cleaned.startsWith(this.allowedBasePath + '/')

      if (!isExactMatch && !isSubPath) {
        return {
          allowed: false,
          normalizedPath: cleaned,
          error: `Access denied. Target path "${cleaned}" is outside workspace root "${this.allowedBasePath}". Sibling directories are prohibited.`
        }
      }
    }

    // 4. Forbidden sensitive secret / credential patterns (checked against both original and resolved)
    const forbiddenPatterns = [
      /(^|\/)\.env($|\.)/i,
      /\.git(\/|$)/i,
      /id_rsa/i,
      /id_ed25519/i,
      /credentials(\.json)?$/i,
      /\.(pem|key|pfx|pkcs12)$/i,
      /(^|\/)(passwd|shadow)$/i,
      /secrets?\.(json|ya?ml|txt)$/i
    ]

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(cleaned) || pattern.test(resolvedPath)) {
        return {
          allowed: false,
          normalizedPath: cleaned,
          error: `Security violation: Access to sensitive file or pattern "${pattern.toString()}" is blocked.`
        }
      }
    }

    return { allowed: true, normalizedPath: cleaned }
  }

  private cleanPath(p: string): string {
    let normalized = p.replace(/\\/g, '/').trim()
    if (normalized.startsWith('./')) {
      normalized = normalized.slice(2)
    }
    normalized = normalized.replace(/\/+/g, '/')
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }
    return normalized.toLowerCase()
  }
}
