import { describe, it, expect } from 'vitest'
import { SandboxPolicy } from '../runtime/sandbox/SandboxPolicy'

describe('SATRIA AI Workforce — Sub-Phase 3.5 Hardening: Sandbox Path Boundary', () => {
  const rootPath = 'c:/projects/satria-workspace'
  const policy = new SandboxPolicy(rootPath)

  it('1. allows normal relative source files', () => {
    const res = policy.validatePath('src/index.ts')
    expect(res.allowed).toBe(true)
    expect(res.normalizedPath).toBe('src/index.ts')
  })

  it('2. allows nested relative source files', () => {
    const res = policy.validatePath('src/services/auth/TokenService.ts')
    expect(res.allowed).toBe(true)
  })

  it('3. allows leading dot-slash files', () => {
    const res = policy.validatePath('./src/components/Button.vue')
    expect(res.allowed).toBe(true)
    expect(res.normalizedPath).toBe('src/components/button.vue')
  })

  it('4. allows absolute paths inside workspace root', () => {
    const res = policy.validatePath('c:/projects/satria-workspace/src/main.ts')
    expect(res.allowed).toBe(true)
  })

  it('5. strictly denies path traversal attempts (..)', () => {
    const r1 = policy.validatePath('../secret.txt')
    expect(r1.allowed).toBe(false)
    expect(r1.error).toContain('Path traversal (..) is strictly forbidden')

    const r2 = policy.validatePath('../../etc/passwd')
    expect(r2.allowed).toBe(false)

    const r3 = policy.validatePath('src/../../outside.txt')
    expect(r3.allowed).toBe(false)

    const r4 = policy.validatePath('..\\..\\windows\\system32')
    expect(r4.allowed).toBe(false)
  })

  it('6. strictly denies sibling directories sharing common prefix', () => {
    // Sibling directory /satria-workspace-other must NOT be allowed
    const res = policy.validatePath('c:/projects/satria-workspace-other/file.txt')
    expect(res.allowed).toBe(false)
    expect(res.error).toContain('outside workspace root')
  })

  it('7. strictly blocks sensitive .env environment files', () => {
    expect(policy.validatePath('.env').allowed).toBe(false)
    expect(policy.validatePath('.env.local').allowed).toBe(false)
    expect(policy.validatePath('.env.production').allowed).toBe(false)
    expect(policy.validatePath('config/.env').allowed).toBe(false)
  })

  it('8. strictly blocks cryptographic keys and credentials', () => {
    expect(policy.validatePath('id_rsa').allowed).toBe(false)
    expect(policy.validatePath('id_ed25519').allowed).toBe(false)
    expect(policy.validatePath('credentials.json').allowed).toBe(false)
    expect(policy.validatePath('certs/server.pem').allowed).toBe(false)
    expect(policy.validatePath('certs/server.key').allowed).toBe(false)
  })

  it('9. strictly denies symlink targets escaping workspace root', () => {
    const symlinkPolicy = new SandboxPolicy('c:/projects/satria-workspace', {
      symlinks: {
        'symlink-outside': 'c:/windows/system32',
        'c:/projects/satria-workspace/symlink-etc': 'c:/etc/passwd',
        'shared-ext': 'd:/external-drive/secret.txt'
      }
    })

    const r1 = symlinkPolicy.validatePath('symlink-outside/cmd.exe')
    expect(r1.allowed).toBe(false)
    expect(r1.error).toContain('outside workspace root')

    const r2 = symlinkPolicy.validatePath('c:/projects/satria-workspace/symlink-etc')
    expect(r2.allowed).toBe(false)
    expect(r2.error).toContain('outside workspace root')

    const r3 = symlinkPolicy.validatePath('shared-ext')
    expect(r3.allowed).toBe(false)
    expect(r3.error).toContain('outside workspace root')
  })

  it('10. allows valid internal symlinks and blocks symlink targets to sensitive files', () => {
    const symlinkPolicy = new SandboxPolicy('c:/projects/satria-workspace', {
      symlinks: {
        'link-to-components': 'c:/projects/satria-workspace/src/components',
        'link-to-env': 'c:/projects/satria-workspace/.env'
      }
    })

    // Valid internal symlink to subfolder
    const r1 = symlinkPolicy.validatePath('link-to-components/Button.vue')
    expect(r1.allowed).toBe(true)

    // Symlink targeting .env inside workspace is blocked
    const r2 = symlinkPolicy.validatePath('link-to-env')
    expect(r2.allowed).toBe(false)
    expect(r2.error).toContain('Security violation')
  })
})
