import type {
  IIntegrationAdapter,
  HealthResult,
  ToolResult,
  GitHubRepository,
  GitHubIssue,
  GitHubPullRequest
} from './types'
import type { IntegrationConnection } from '../../types'

export class GitHubAdapter implements IIntegrationAdapter {
  public readonly providerId = 'github'

  private mockRepositories: GitHubRepository[] = [
    {
      id: 'repo-satria-api',
      name: 'satria-api',
      fullName: 'satria-workforce/satria-api',
      owner: 'satria-workforce',
      isPrivate: true,
      defaultBranch: 'main',
      description: 'Core Gateway API & Distributed Orchestration Layer for Satria AI Workforce',
      openIssuesCount: 4,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'repo-satria-web',
      name: 'satria-web',
      fullName: 'satria-workforce/satria-web',
      owner: 'satria-workforce',
      isPrivate: true,
      defaultBranch: 'main',
      description: 'PWA Web Workspace & Autonomous Digital Employee Command Center',
      openIssuesCount: 2,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'repo-satria-core',
      name: 'satria-core-runtime',
      fullName: 'satria-workforce/satria-core-runtime',
      owner: 'satria-workforce',
      isPrivate: true,
      defaultBranch: 'main',
      description: 'Hermes Runtime Protocol & Sandbox Isolation Kernel',
      openIssuesCount: 1,
      updatedAt: new Date().toISOString()
    }
  ]

  private mockIssues: GitHubIssue[] = [
    {
      id: 'iss-142',
      number: 142,
      title: 'Auth token leak in JWT verification interceptor',
      body: 'Customer reported HTTP 500 when expired JWT is refreshed during concurrent task execution in auth_handler.go.',
      state: 'open',
      author: 'dimas-qa',
      labels: ['bug', 'security', 'backend'],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      url: 'https://github.com/satria-workforce/satria-api/issues/142'
    },
    {
      id: 'iss-139',
      number: 139,
      title: 'Database connection pool saturation under spike traffic',
      body: 'Pool size needs to be increased from 20 to 50 with keep-alive ping enabled.',
      state: 'open',
      author: 'bima-backend',
      labels: ['performance', 'database'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      url: 'https://github.com/satria-workforce/satria-api/issues/139'
    }
  ]

  private mockPullRequests: GitHubPullRequest[] = [
    {
      id: 'pr-88',
      number: 88,
      title: 'fix(auth): sanitize token refresh race condition and error logging',
      body: 'Closes #142. Patches auth_handler.go mutex locking to prevent expired JWT race conditions.',
      state: 'open',
      branch: 'fix/auth-token-leak',
      baseBranch: 'main',
      author: 'Bima (Backend Engineer)',
      filesChanged: 3,
      diffUrl: 'https://github.com/satria-workforce/satria-api/pull/88.diff',
      url: 'https://github.com/satria-workforce/satria-api/pull/88',
      createdAt: new Date().toISOString()
    }
  ]

  public async validateConnection(connection: IntegrationConnection): Promise<HealthResult> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const isConnected = connection.status === 'Connected'
    return {
      healthy: isConnected,
      status: connection.status,
      latencyMs: 142,
      message: isConnected
        ? 'Koneksi GitHub App aktif. 3 repositories terhubung dengan permission Read/Write.'
        : 'Token GitHub kadaluarsa atau instalasi dicabut.',
      validatedAt: new Date().toISOString()
    }
  }

  public async execute(
    connection: IntegrationConnection,
    toolName: string,
    action: string,
    args: Record<string, any>
  ): Promise<ToolResult> {
    await new Promise((resolve) => setTimeout(resolve, 400))

    switch (toolName) {
      case 'github.list_repositories':
        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'read',
          data: this.mockRepositories,
          evidence: [
            {
              type: 'github.repositories',
              label: 'Connected Repositories',
              summary: `${this.mockRepositories.length} repositories available in ${connection.accountLabel}`
            }
          ]
        }

      case 'github.get_repository': {
        const repoName = args.repo || 'satria-api'
        const found = this.mockRepositories.find((r) => r.name === repoName) || this.mockRepositories[0]
        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'read',
          data: found,
          evidence: [
            {
              type: 'github.repository',
              label: `Repository Metadata: ${found.name}`,
              summary: `Default branch: ${found.defaultBranch}, Open issues: ${found.openIssuesCount}`
            }
          ]
        }
      }

      case 'github.list_issues':
        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'read',
          data: this.mockIssues,
          evidence: [
            {
              type: 'github.issues',
              label: 'Repository Issues',
              summary: `${this.mockIssues.length} open issues found`
            }
          ]
        }

      case 'github.get_issue': {
        const num = args.issueNumber || 142
        const issue = this.mockIssues.find((i) => i.number === num) || this.mockIssues[0]
        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'read',
          data: issue,
          evidence: [
            {
              type: 'github.issue',
              label: `Issue #${issue.number}`,
              url: issue.url,
              summary: issue.title
            }
          ]
        }
      }

      case 'github.get_file': {
        const path = args.path || 'pkg/auth/auth_handler.go'
        const sampleContent = `package auth

import (
    "net/http"
    "sync"
    "time"
)

var authMutex sync.RWMutex

func VerifyAndRefreshToken(tokenString string) (string, error) {
    authMutex.Lock()
    defer authMutex.Unlock()
    
    // Fixed: sanitized race condition on concurrent refresh
    return "sanitized_refreshed_token", nil
}
`
        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'read',
          data: {
            path,
            content: sampleContent,
            sha: 'a1b2c3d4e5f6',
            size: sampleContent.length
          },
          evidence: [
            {
              type: 'github.file',
              label: `File Content: ${path}`,
              summary: `Loaded ${path} (${sampleContent.length} bytes)`
            }
          ]
        }
      }

      case 'github.create_branch': {
        const branchName = args.branch || `fix/auth-token-leak-${Date.now()}`
        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'write',
          data: {
            branch: branchName,
            base: args.base || 'main',
            sha: 'b7c8d9e0f1a2'
          },
          evidence: [
            {
              type: 'github.branch',
              label: `Branch Created: ${branchName}`,
              summary: `Created branch ${branchName} from ${args.base || 'main'}`
            }
          ]
        }
      }

      case 'github.update_file': {
        const path = args.path || 'pkg/auth/auth_handler.go'
        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'write',
          data: {
            path,
            commitSha: 'commit_' + Math.random().toString(36).substr(2, 8),
            message: args.message || 'fix(auth): patch mutex locking on JWT refresh'
          },
          evidence: [
            {
              type: 'github.commit',
              label: `File Updated: ${path}`,
              diff: `+ var authMutex sync.RWMutex\n+ authMutex.Lock()\n+ defer authMutex.Unlock()`,
              summary: `Committed changes to ${path}`
            }
          ]
        }
      }

      case 'github.create_pull_request': {
        const title = args.title || 'fix(auth): sanitize JWT race condition in auth_handler.go'
        const newPr: GitHubPullRequest = {
          id: `pr-${Date.now()}`,
          number: this.mockPullRequests.length + 101,
          title,
          body: args.body || 'Closes #142. Verified by Automated Quality Gate test suite.',
          state: 'open',
          branch: args.branch || 'fix/auth-token-leak',
          baseBranch: args.base || 'main',
          author: args.author || 'Bima (Backend Engineer)',
          filesChanged: 3,
          diffUrl: 'https://github.com/satria-workforce/satria-api/pull/143.diff',
          url: `https://github.com/satria-workforce/satria-api/pull/143`,
          createdAt: new Date().toISOString()
        }
        this.mockPullRequests.unshift(newPr)

        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'write',
          data: newPr,
          evidence: [
            {
              type: 'github.pull_request',
              id: newPr.id,
              label: `Pull Request #${newPr.number}`,
              url: newPr.url,
              summary: newPr.title
            }
          ]
        }
      }

      case 'github.list_pull_requests':
        return {
          success: true,
          provider: 'github',
          toolName,
          action: 'read',
          data: this.mockPullRequests,
          evidence: [
            {
              type: 'github.pull_requests',
              label: 'Pull Requests List',
              summary: `${this.mockPullRequests.length} active PRs`
            }
          ]
        }

      default:
        return {
          success: false,
          provider: 'github',
          toolName,
          action,
          error: {
            code: 'UNKNOWN_TOOL',
            message: `Tool ${toolName} tidak dikenal pada adapter GitHub.`,
            retryable: false
          }
        }
    }
  }
}
