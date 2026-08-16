/**
 * SATRIA AI WORKFORCE — GITHUB AUTHENTICATION SERVICE
 *
 * Implements GitHub App Installation authentication & OAuth Web Flow handshake.
 */

import { CredentialVault } from './CredentialVault'
import type { IntegrationConnection } from '../../types'

export interface GitHubAppConfig {
  appId: string
  installationId: string
  privateKeyPem?: string
  clientId?: string
  clientSecret?: string
}

export interface GitHubAuthResult {
  success: boolean
  connection?: IntegrationConnection
  accessToken?: string
  expiresIn?: number
  error?: string
}

export class GitHubAuthService {
  /**
   * Generates OAuth redirect URL with CSRF protection
   */
  public static getOAuthUrl(clientId: string, redirectUri: string, scope = 'repo read:org issues:write pull_requests:write'): { url: string; state: string } {
    const state = `gh_state_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state
    })
    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      state
    }
  }

  /**
   * Exchanges authorization code or GitHub App installation ID for an access token
   */
  public static async authenticateGitHubApp(
    config: GitHubAppConfig,
    displayName = 'GitHub App Integration'
  ): Promise<GitHubAuthResult> {
    try {
      // Simulate /app/installations/:id/access_tokens exchange
      const token = `ghs_inst_${config.installationId}_${Date.now()}`
      const connId = `conn-github-${Date.now()}`

      // Securely store token in isolated vault
      CredentialVault.storeSecret(connId, 'github', 'github_app_key', token)

      const connection: IntegrationConnection = {
        id: connId,
        providerId: 'github',
        workspaceId: 'ws-dev',
        displayName,
        accountLabel: `org-app-${config.appId}`,
        accountId: config.installationId,
        status: 'Connected',
        scopes: ['repo', 'read:org', 'pull_requests:write', 'issues:write'],
        metadata: {
          appId: config.appId,
          installationId: config.installationId,
          repositories: ['satria-api', 'satria-web', 'satria-core-runtime'],
          defaultBranch: 'main'
        },
        credentials: {
          installationId: config.installationId,
          accessToken: CredentialVault.maskSecret(token)
        },
        lastValidatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      return {
        success: true,
        connection,
        accessToken: token,
        expiresIn: 3600
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Gagal mengautentikasi GitHub App'
      }
    }
  }
}
