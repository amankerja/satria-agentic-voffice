import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { PermissionEngine } from '../services/integrations/PermissionEngine'
import { UniversalToolRouter } from '../services/integrations/UniversalToolRouter'
import { GitHubAdapter } from '../services/integrations/GitHubAdapter'
import { GmailAdapter } from '../services/integrations/GmailAdapter'
import { CrossSystemWorkflowEngine } from '../services/integrations/CrossSystemWorkflowEngine'
import { useIntegrationStore } from '../stores/integration'
import type { IntegrationConnection } from '../types'

describe('Phase 7 — Enterprise Integrations (GitHub & Email), Tool Control & Cross-System Execution', () => {
  let mockGitHubConn: IntegrationConnection
  let mockGmailConn: IntegrationConnection

  beforeEach(() => {
    setActivePinia(createPinia())

    mockGitHubConn = {
      id: 'conn-gh-test',
      providerId: 'github',
      workspaceId: 'ws-dev',
      displayName: 'Satria GitHub App',
      accountLabel: 'satria-workforce',
      status: 'Connected',
      scopes: ['repo', 'pull_requests:write'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    mockGmailConn = {
      id: 'conn-gm-test',
      providerId: 'gmail',
      workspaceId: 'ws-dev',
      displayName: 'Operations Mailbox',
      accountLabel: 'ops@satria.workforce.ai',
      status: 'Connected',
      scopes: ['gmail.readonly', 'gmail.send'],
      metadata: {
        allowedRecipientDomains: ['clientcorp.com', 'satria.workforce.ai']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })

  describe('PermissionEngine & Least Privilege', () => {
    it('allows read operations with low risk level', () => {
      const result = PermissionEngine.evaluate('emp-bima', 'github.get_file', 'read')
      expect(result.allowed).toBe(true)
      expect(result.approvalRequired).toBe(false)
      expect(result.riskLevel).toBe('LOW')
    })

    it('flags high-risk actions as requiring approval by default', () => {
      const prResult = PermissionEngine.evaluate('emp-bima', 'github.create_pull_request', 'write')
      expect(prResult.allowed).toBe(true)
      expect(prResult.approvalRequired).toBe(true)
      expect(prResult.riskLevel).toBe('HIGH')

      const sendResult = PermissionEngine.evaluate('emp-raka', 'email.send', 'write')
      expect(sendResult.allowed).toBe(true)
      expect(sendResult.approvalRequired).toBe(true)
      expect(sendResult.riskLevel).toBe('HIGH')
    })

    it('denies unknown dangerous operations without matching permission rule', () => {
      const result = PermissionEngine.evaluate('emp-alex', 'server.delete_database', 'write')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Akses ditolak')
    })
  })

  describe('GitHub Adapter Operations & Evidence', () => {
    const adapter = new GitHubAdapter()

    it('validates connection health and returns repository list', async () => {
      const health = await adapter.validateConnection(mockGitHubConn)
      expect(health.healthy).toBe(true)
      expect(health.status).toBe('Connected')

      const listRes = await adapter.execute(mockGitHubConn, 'github.list_repositories', 'read', {})
      expect(listRes.success).toBe(true)
      expect(Array.isArray(listRes.data)).toBe(true)
      expect((listRes.data as any[]).length).toBeGreaterThan(0)
    })

    it('reads files and creates code branch with structured evidence', async () => {
      const fileRes = await adapter.execute(mockGitHubConn, 'github.get_file', 'read', {
        repo: 'satria-api',
        path: 'pkg/auth/auth_handler.go'
      })
      expect(fileRes.success).toBe(true)
      expect((fileRes.data as any).content).toContain('package auth')
      expect(fileRes.evidence?.[0].type).toBe('github.file')

      const branchRes = await adapter.execute(mockGitHubConn, 'github.create_branch', 'write', {
        repo: 'satria-api',
        branch: 'fix/auth-leak-test',
        base: 'main'
      })
      expect(branchRes.success).toBe(true)
      expect((branchRes.data as any).branch).toBe('fix/auth-leak-test')
    })

    it('creates pull request with complete diff metadata', async () => {
      const prRes = await adapter.execute(mockGitHubConn, 'github.create_pull_request', 'write', {
        repo: 'satria-api',
        branch: 'fix/auth-leak-test',
        base: 'main',
        title: 'fix(auth): sanitize JWT mutex locking'
      })
      expect(prRes.success).toBe(true)
      expect((prRes.data as any).number).toBeGreaterThan(0)
      expect(prRes.evidence?.[0].type).toBe('github.pull_request')
    })
  })

  describe('Gmail Adapter & Security Policies', () => {
    const adapter = new GmailAdapter()

    it('searches inbox and retrieves specific messages', async () => {
      const searchRes = await adapter.execute(mockGmailConn, 'email.search_messages', 'read', {
        query: 'HTTP 500'
      })
      expect(searchRes.success).toBe(true)
      const messages = searchRes.data as any[]
      expect(messages.length).toBeGreaterThan(0)
      expect(messages[0].subject).toContain('HTTP 500')
    })

    it('creates draft response with recipient and body', async () => {
      const draftRes = await adapter.execute(mockGmailConn, 'email.create_draft', 'write', {
        to: 'budi.santoso@clientcorp.com',
        subject: 'Re: Bug Fix Confirmation',
        body: 'Perbaikan telah diaplikasikan di PR #143.'
      })
      expect(draftRes.success).toBe(true)
      expect((draftRes.data as any).id).toBeDefined()
    })

    it('blocks sending email to disallowed or malicious domains', async () => {
      const blockedRes = await adapter.execute(mockGmailConn, 'email.send', 'write', {
        to: 'hacker@malicious.com',
        subject: 'Sensitive Data'
      })
      expect(blockedRes.success).toBe(false)
      expect(blockedRes.error?.code).toBe('POLICY_DENIED')
    })
  })

  describe('UniversalToolRouter Dispatch & Approval Lifecycle', () => {
    it('intercepts high-risk tool call with approval gate callback', async () => {
      let approvalRequested = false

      const execRes = await UniversalToolRouter.executeTool(
        {
          id: 'req-test-01',
          runId: 'run-test-01',
          taskId: 'tsk-test-01',
          agentId: 'emp-bima',
          agentName: 'Bima',
          toolName: 'github.create_pull_request',
          action: 'write',
          arguments: { title: 'High risk PR' },
          riskLevel: 'HIGH',
          createdAt: new Date().toISOString()
        },
        mockGitHubConn,
        {
          onApprovalRequired: async (appr) => {
            approvalRequested = true
            expect(appr.riskLevel).toBe('HIGH')
            return true // Approve
          }
        }
      )

      expect(approvalRequested).toBe(true)
      expect(execRes.result.success).toBe(true)
      expect(execRes.approval?.status).toBe('APPROVED')
      expect(execRes.auditEvent.status).toBe('SUCCESS')
    })

    it('aborts execution when approval is rejected', async () => {
      const execRes = await UniversalToolRouter.executeTool(
        {
          id: 'req-test-02',
          runId: 'run-test-02',
          taskId: 'tsk-test-02',
          agentId: 'emp-raka',
          agentName: 'Raka',
          toolName: 'email.send',
          action: 'write',
          arguments: { to: 'budi.santoso@clientcorp.com', subject: 'Test' },
          riskLevel: 'HIGH',
          createdAt: new Date().toISOString()
        },
        mockGmailConn,
        {
          onApprovalRequired: async () => {
            return false // Reject
          }
        }
      )

      expect(execRes.result.success).toBe(false)
      expect(execRes.approval?.status).toBe('REJECTED')
      expect(execRes.execution.status).toBe('REJECTED')
      expect(execRes.auditEvent.status).toBe('REJECTED')
    })
  })

  describe('CrossSystemWorkflowEngine — Full 9-Step Journey', () => {
    it('executes complete Email → GitHub Issue → Code Patch → Test → PR → Draft → Approval → Send flow', async () => {
      const state = CrossSystemWorkflowEngine.createInitialState()
      expect(state.steps.length).toBe(9)

      let approvalTriggered = false
      const resultState = await CrossSystemWorkflowEngine.executeWorkflow(
        state,
        { github: mockGitHubConn, gmail: mockGmailConn },
        undefined,
        async () => {
          approvalTriggered = true
          return true
        }
      )

      expect(approvalTriggered).toBe(true)
      expect(resultState.status).toBe('Completed')
      expect(resultState.deliverables.githubIssueUrl).toBeDefined()
      expect(resultState.deliverables.pullRequestUrl).toBeDefined()
      expect(resultState.deliverables.emailSentUrl).toBeDefined()
      expect(resultState.deliverables.testResultsSummary).toContain('pass')
    })
  })

  describe('Pinia Integration Store', () => {
    it('loads integration connections, permissions, and audit logs', async () => {
      const store = useIntegrationStore()
      await store.loadAll()

      expect(store.connections.length).toBeGreaterThanOrEqual(2)
      expect(store.permissions.length).toBeGreaterThanOrEqual(4)
      expect(store.auditEvents.length).toBeGreaterThanOrEqual(2)

      const ghConn = store.getConnectionByProvider('github')
      expect(ghConn).toBeDefined()

      const health = await store.testConnectionHealth(ghConn!.id)
      expect(health.healthy).toBe(true)
    })
  })
})
