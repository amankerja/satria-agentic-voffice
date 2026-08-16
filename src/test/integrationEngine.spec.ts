import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { PermissionEngine } from '../services/integrations/PermissionEngine'
import { UniversalToolRouter } from '../services/integrations/UniversalToolRouter'
import { GitHubAdapter } from '../services/integrations/GitHubAdapter'
import { GmailAdapter } from '../services/integrations/GmailAdapter'
import { CrossSystemWorkflowEngine } from '../services/integrations/CrossSystemWorkflowEngine'
import { useIntegrationStore } from '../stores/integration'
import { CredentialVault } from '../services/integrations/CredentialVault'
import { GitHubAuthService } from '../services/integrations/GitHubAuthService'
import { GoogleOAuthService } from '../services/integrations/GoogleOAuthService'
import { ToolCatalog } from '../services/integrations/ToolCatalog'
import { RecipientSecurityPolicy } from '../services/integrations/RecipientSecurityPolicy'
import { IntegrationApprovalPolicy } from '../services/integrations/IntegrationApprovalPolicy'
import { TaskBoundaryGuard } from '../services/integrations/TaskBoundaryGuard'
import type { IntegrationConnection, Task } from '../types'

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

  describe('CredentialVault & Secret Masking', () => {
    it('stores, masks, rotates, and revokes credentials with zero raw exposure', () => {
      const rawSecret = 'ghs_live_super_secret_token_123456789'
      const stored = CredentialVault.storeSecret('conn-test-vault', 'github', 'github_app_key', rawSecret)

      expect(stored.maskedValue).toContain('****')
      expect(stored.maskedValue.startsWith('ghs_')).toBe(true)
      expect(stored.maskedValue.endsWith('6789')).toBe(true)

      const decrypted = CredentialVault.getSecret('conn-test-vault')
      expect(decrypted).toBe(rawSecret)

      // Rotate
      const rotated = CredentialVault.rotateSecret('conn-test-vault', 'ghs_rotated_token_99999999')
      expect(rotated.maskedValue).toContain('****')
      expect(CredentialVault.getSecret('conn-test-vault')).toBe('ghs_rotated_token_99999999')

      // Revoke
      const revoked = CredentialVault.revokeSecret('conn-test-vault')
      expect(revoked).toBe(true)
      expect(CredentialVault.getSecret('conn-test-vault')).toBeNull()
    })
  })

  describe('GitHub App & Google OAuth Handshake Services', () => {
    it('authenticates GitHub App and exchanges installation token', async () => {
      const authRes = await GitHubAuthService.authenticateGitHubApp({
        appId: '123456',
        installationId: 'inst_9988'
      })

      expect(authRes.success).toBe(true)
      expect(authRes.connection?.status).toBe('Connected')
      expect(authRes.connection?.credentials?.accessToken).toContain('****')
    })

    it('generates Google OAuth URL and exchanges authorization code', async () => {
      const urlInfo = GoogleOAuthService.getAuthorizationUrl('client_123', 'http://localhost/callback')
      expect(urlInfo.url).toContain('accounts.google.com')
      expect(urlInfo.state).toContain('google_state')

      const exchangeRes = await GoogleOAuthService.exchangeAuthCode('code_test_123', 'ops@satria.workforce.ai')
      expect(exchangeRes.success).toBe(true)
      expect(exchangeRes.connection?.status).toBe('Connected')
      expect(exchangeRes.connection?.accountLabel).toBe('ops@satria.workforce.ai')
    })
  })

  describe('ToolCatalog Registry & Schemas', () => {
    it('retrieves tools for GitHub and Gmail with valid schemas', () => {
      const ghTools = ToolCatalog.getToolsByProvider('github')
      expect(ghTools.length).toBeGreaterThanOrEqual(5)

      const prTool = ToolCatalog.getToolDefinition('github.create_pull_request')
      expect(prTool).toBeDefined()
      expect(prTool?.riskLevel).toBe('HIGH')
      expect(prTool?.defaultApprovalRequired).toBe(true)
      expect(prTool?.parameters.some((p) => p.name === 'repo')).toBe(true)

      const gmTools = ToolCatalog.getToolsByProvider('gmail')
      expect(gmTools.length).toBeGreaterThanOrEqual(4)
      const sendTool = ToolCatalog.getToolDefinition('email.send')
      expect(sendTool?.riskLevel).toBe('HIGH')
    })
  })

  describe('RecipientSecurityPolicy & IntegrationApprovalPolicy', () => {
    it('allows whitelisted domains and flags external domains for approval', () => {
      const internalRes = RecipientSecurityPolicy.evaluateRecipient('team@satria.workforce.ai')
      expect(internalRes.allowed).toBe(true)
      expect(internalRes.isExternal).toBe(false)
      expect(internalRes.requiresApproval).toBe(false)

      const externalAllowed = RecipientSecurityPolicy.evaluateRecipient('client@clientcorp.com')
      expect(externalAllowed.allowed).toBe(true)
      expect(externalAllowed.isExternal).toBe(true)
      expect(externalAllowed.requiresApproval).toBe(true)

      const disposableRes = RecipientSecurityPolicy.evaluateRecipient('spammer@tempmail.com')
      expect(disposableRes.allowed).toBe(false)
    })

    it('enforces owner approval on protected branches and external emails', () => {
      const ghPrMain = IntegrationApprovalPolicy.evaluateGitHubAction('github.create_pull_request', { base: 'main' })
      expect(ghPrMain.requiresApproval).toBe(true)
      expect(ghPrMain.riskLevel).toBe('HIGH')
      expect(ghPrMain.approvalType).toBe('Owner')

      const emailSend = IntegrationApprovalPolicy.evaluateEmailAction('email.send', { to: 'client@clientcorp.com' })
      expect(emailSend.requiresApproval).toBe(true)
      expect(emailSend.riskLevel).toBe('HIGH')
    })
  })

  describe('TaskBoundaryGuard & Explicit Workflow Mode Containment', () => {
    it('blocks Engineering task from accessing email tools with BOUNDARY_VIOLATION', async () => {
      const task: Partial<Task> = {
        id: 'tsk-eng-test',
        title: 'Fix Bug in satria-api',
        executionMode: 'ENGINEERING_EXECUTION',
        allowedIntegrations: ['github']
      }

      const check = TaskBoundaryGuard.assertToolAccess(task, 'gmail', 'email.send')
      expect(check.allowed).toBe(false)
      expect(check.reason).toContain('BOUNDARY_VIOLATION')

      // Check router dispatch rejection
      const mockEmailConn: IntegrationConnection = {
        id: 'conn-gmail-boundary',
        providerId: 'gmail',
        workspaceId: 'ws-dev',
        displayName: 'Gmail',
        accountLabel: 'ops@satria.ai',
        status: 'Connected',
        scopes: ['send'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const routerRes = await UniversalToolRouter.executeTool(
        {
          id: 'req-boundary-test',
          runId: 'run-1',
          taskId: 'tsk-eng-test',
          agentId: 'emp-bima',
          toolName: 'email.send',
          action: 'write',
          arguments: { to: 'test@satria.ai', subject: 'hi' },
          riskLevel: 'HIGH',
          createdAt: new Date().toISOString()
        },
        mockEmailConn,
        { taskContext: task }
      )

      expect(routerRes.result.success).toBe(false)
      expect(routerRes.result.error?.code).toBe('BOUNDARY_VIOLATION')
      expect(routerRes.auditEvent.status).toBe('BOUNDARY_DENIED')
      expect(routerRes.auditEvent.rejectionCategory).toBe('BOUNDARY_VIOLATION')
      expect(routerRes.auditEvent.taskContext?.executionMode).toBe('ENGINEERING_EXECUTION')
    })

    it('blocks Email Intelligence task from accessing GitHub tools', () => {
      const task: Partial<Task> = {
        id: 'tsk-email-test',
        title: 'Rekap Transaksi Bank',
        executionMode: 'EMAIL_INTELLIGENCE',
        allowedIntegrations: ['gmail']
      }

      const check = TaskBoundaryGuard.assertToolAccess(task, 'github', 'github.create_pull_request')
      expect(check.allowed).toBe(false)
      expect(check.reason).toContain('BOUNDARY_VIOLATION')
    })

    it('permits multi-system tools only when task is explicitly CROSS_SYSTEM', () => {
      const taskCross: Partial<Task> = {
        id: 'tsk-cross-test',
        title: 'Ambil error email lalu buat issue GitHub',
        executionMode: 'CROSS_SYSTEM',
        allowedIntegrations: ['gmail', 'github']
      }

      const emailCheck = TaskBoundaryGuard.assertToolAccess(taskCross, 'gmail', 'email.search_messages')
      const ghCheck = TaskBoundaryGuard.assertToolAccess(taskCross, 'github', 'github.create_pull_request')

      expect(emailCheck.allowed).toBe(true)
      expect(ghCheck.allowed).toBe(true)
    })
  })
})
