/**
 * SATRIA AI WORKFORCE — Command Whitelist & Execution Restriction Engine
 * Enforces strict sandboxing on system and terminal commands triggered by AI agents.
 */

export interface CommandValidationResult {
  allowed: boolean
  command: string
  executable: string
  reason?: string
  securityRiskLevel: 'SAFE' | 'LOW' | 'HIGH' | 'CRITICAL'
}

export class CommandWhitelist {
  // Safe executables permitted for agent development tasks
  private static readonly ALLOWED_EXECUTABLES: Set<string> = new Set([
    // Node / JS / TS ecosystem
    'npm',
    'npx',
    'node',
    'yarn',
    'pnpm',
    'bun',
    'deno',
    'tsc',
    'vite',
    'vitest',
    'jest',
    'eslint',
    'prettier',
    'playwright',

    // Git / VCS
    'git',

    // Python / Build tools
    'python',
    'python3',
    'pip',
    'pip3',
    'pytest',
    'go',
    'cargo',
    'rustc',

    // Safe read-only inspection utilities
    'echo',
    'cat',
    'ls',
    'dir',
    'pwd',
    'find',
    'grep',
    'rg',
    'head',
    'tail',
    'wc',
    'diff'
  ])

  // Explicitly forbidden dangerous command signatures
  private static readonly FORBIDDEN_SIGNATURES: { regex: RegExp; reason: string }[] = [
    // Destructive filesystem commands
    { regex: /\brm\s+-[rfRF]{1,4}\s+(?:\/|\*|[a-zA-Z]:\\|\.\.)/i, reason: 'Root/unbounded recursive deletion is forbidden' },
    { regex: /\bformat\s+[a-zA-Z]:/i, reason: 'Disk format command is blocked' },
    { regex: /\b(?:mkfs|fdisk|diskpart)\b/i, reason: 'Disk partitioning commands are blocked' },
    { regex: /\bdd\s+if=/i, reason: 'Direct disk write utility (dd) is blocked' },

    // System restart/shutdown
    { regex: /\b(?:shutdown|reboot|init\s+0|init\s+6)\b/i, reason: 'System power/reboot commands are blocked' },

    // Remote execution / piped shell injection
    { regex: /\b(?:curl|wget|fetch)\s+[^\n|;&]+\|\s*(?:sh|bash|zsh|powershell|pwsh|cmd)/i, reason: 'Piped web-to-shell execution is blocked' },
    { regex: /\bpowershell(?:\.exe)?\s+(?:-enc|-encodedcommand|-e)\b/i, reason: 'Encoded PowerShell execution is prohibited' },
    { regex: /\b(?:Invoke-Expression|IEX)\b/i, reason: 'Arbitrary dynamic PowerShell execution (IEX) is prohibited' },

    // Sensitive system file manipulation
    { regex: />\s*(?:\/etc\/(?:passwd|shadow|sudoers)|C:\\Windows\\System32)/i, reason: 'Direct modification of system configuration files is blocked' },
    { regex: /\bchmod\s+(?:777|000)\s+\//i, reason: 'Root permission override is blocked' },
    { regex: /\breg\s+(?:add|delete)\s+HK/i, reason: 'System registry modification is blocked' }
  ]

  /**
   * Validates if a command string is permissible for agent execution
   */
  public static validateCommand(commandLine: string): CommandValidationResult {
    const trimmed = (commandLine || '').trim()
    if (!trimmed) {
      return {
        allowed: false,
        command: trimmed,
        executable: '',
        reason: 'Empty command string',
        securityRiskLevel: 'SAFE'
      }
    }

    // 1. Check against forbidden dangerous command signatures
    for (const signature of this.FORBIDDEN_SIGNATURES) {
      if (signature.regex.test(trimmed)) {
        return {
          allowed: false,
          command: trimmed,
          executable: this.extractExecutable(trimmed),
          reason: `Security Restriction: ${signature.reason}`,
          securityRiskLevel: 'CRITICAL'
        }
      }
    }

    // 2. Extract base executable name
    const executable = this.extractExecutable(trimmed)

    // 3. Verify against allowed executables whitelist
    if (!this.ALLOWED_EXECUTABLES.has(executable.toLowerCase())) {
      return {
        allowed: false,
        command: trimmed,
        executable,
        reason: `Command executable "${executable}" is not in the approved agent toolchain whitelist.`,
        securityRiskLevel: 'HIGH'
      }
    }

    return {
      allowed: true,
      command: trimmed,
      executable,
      securityRiskLevel: 'SAFE'
    }
  }

  private static extractExecutable(cmd: string): string {
    // Strip leading environment variables or path wrappers (e.g. CI=1 /usr/bin/npm)
    const tokens = cmd.split(/\s+/)
    for (const token of tokens) {
      if (token.includes('=')) continue // skip VAR=val
      // Extract basename if full path was provided
      const cleanToken = token.replace(/\\/g, '/').split('/').pop() || token
      return cleanToken.replace(/\.(exe|cmd|bat|sh)$/i, '')
    }
    return ''
  }
}
