# SATRIA AI WORKFORCE
# FULL INTEGRATION PLAN — GITHUB & EMAIL
## Integrations, Tool Control, Permissions, Approval, Audit & Agentic Workflow

**Version:** 1.0  
**Date:** 2026-08-15  
**Status:** Proposed Architecture / Product & Engineering Plan  
**Baseline:** SATRIA Phase 3.9 — Autonomous Task Loop  
**Frontend:** Vue + TypeScript + Vite + PWA  
**Primary Runtime:** Hermes Agent

---

# 1. EXECUTIVE SUMMARY

Dokumen ini memperluas arsitektur SATRIA AI Workforce dengan **Integration Layer** yang memungkinkan Digital Employee terhubung ke layanan eksternal dan menjalankan pekerjaan nyata melalui tools yang terkontrol.

Fokus integrasi pertama:

1. **GitHub**
   - Membaca repository.
   - Membaca issue dan pull request.
   - Membaca file.
   - Membuat branch.
   - Mengubah file.
   - Membuat commit.
   - Membuat dan mengelola pull request.
   - Membaca workflow/action.
   - Menjalankan operasi yang diizinkan oleh policy.

2. **Email**
   - Menghubungkan mailbox melalui OAuth.
   - Membaca email masuk.
   - Mencari email berdasarkan query.
   - Membaca thread.
   - Membaca attachment yang diizinkan.
   - Membuat draft.
   - Membalas email.
   - Mengirim email setelah policy/approval terpenuhi.

Prinsip utama:

```text
Integration
    ↓
Connection
    ↓
Tool
    ↓
Permission
    ↓
Policy
    ↓
Approval
    ↓
Agent Execution
    ↓
Verification
    ↓
Audit
```

Agent tidak menerima credential mentah. Credential dikelola oleh Integration/Credential layer dan tool dipanggil melalui interface yang dikontrol SATRIA.

Tujuan akhirnya:

```text
AI tidak hanya menjawab.
AI dapat bekerja lintas aplikasi.
```

dengan tetap:

```text
AUTONOMOUS
+
BOUNDED
+
VERIFIABLE
+
OBSERVABLE
+
AUDITABLE
+
HUMAN-GOVERNED
```

---

# 2. RELATIONSHIP WITH EXISTING PRD

Integrasi ini **memperluas**, bukan mengganti, arsitektur SATRIA yang sudah ada.

Baseline yang dipertahankan:

```text
User
 ↓
Task
 ↓
Assignment
 ↓
Digital Employee
 ↓
Autonomous Task Loop
 ↓
Planning
 ↓
Execution
 ↓
Tool Usage
 ↓
Approval bila diperlukan
 ↓
Result Ingestion
 ↓
Verification
 ↓
Review
 ↓
Retry / Revision
 ↓
Done
```

Integration Layer dimasukkan di antara runtime/tool execution:

```text
Autonomous Task Loop
        ↓
Context Builder
        ↓
Runtime
        ↓
Tool Router
        ↓
Integration Layer
        ↓
External Service
        ↓
Tool Result
        ↓
Result Ingestion
        ↓
Verification
```

Dokumen baseline SATRIA telah menetapkan Tool System dengan kategori seperti filesystem, terminal, browser, Git, research, documents, images, dan external APIs; serta permission level Read, Write, Execute, dan High Risk. Integrasi ini mengubah konsep tersebut menjadi arsitektur connector yang dapat dikelola secara eksplisit.

---

# 3. PRODUCT OBJECTIVE

## 3.1 Tujuan utama

Membangun koneksi eksternal yang:

- aman;
- dapat diaudit;
- scoped;
- dapat dikontrol per workspace;
- dapat dikontrol per Digital Employee;
- dapat dikontrol per tool;
- mendukung approval;
- dapat digunakan oleh autonomous task loop;
- dapat diperluas ke provider baru.

## 3.2 Non-goals awal

Versi pertama tidak bertujuan:

- memberi agent akses penuh ke seluruh akun user;
- memberikan credential mentah ke model;
- mengizinkan tindakan high-risk tanpa policy;
- membuat sistem permission yang berbeda untuk setiap integrasi;
- membuat provider-specific logic tersebar di seluruh frontend.

---

# 4. CORE DESIGN PRINCIPLES

## 4.1 Least Privilege

Setiap integration hanya memperoleh permission minimum yang diperlukan.

## 4.2 Scoped Access

Akses dapat dibatasi berdasarkan:

```text
Organization
Workspace
Project
Repository
Mailbox
Tool
Action
```

## 4.3 Credential Isolation

Credential tidak masuk prompt/model context.

```text
Agent
  ↓
Tool Request
  ↓
SATRIA Tool Router
  ↓
Credential Provider
  ↓
External API
```

## 4.4 Human Governance

Tindakan tertentu harus menunggu approval.

## 4.5 Evidence Based

Tool execution harus menghasilkan structured evidence.

## 4.6 Provider Abstraction

UI dan autonomous loop tidak boleh tergantung langsung pada GitHub API atau Gmail API.

## 4.7 Observable by Default

Setiap operasi penting memiliki:

```text
Run ID
Task ID
Agent ID
Connection ID
Tool Call ID
Timestamp
Result
Error
Approval
Audit Event
```

---

# 5. TARGET USER

## Owner / Director

Memantau:

- integration health;
- usage;
- activity;
- approval;
- security events;
- cost.

## Manager / Lead

Mengelola:

- connections;
- tool permissions;
- approval policy;
- agent access.

## Developer

Menggunakan:

- GitHub;
- repository;
- issues;
- pull requests;
- code workflow.

## Operations / Admin

Menggunakan:

- inbox;
- email classification;
- response draft;
- reporting.

## Digital Employee

Memiliki:

```text
Identity
Role
Skills
Tools
Permissions
Connections
Runtime
```

---

# 6. NEW PRODUCT MODULE

Tambahkan module:

```text
Integrations
```

Struktur platform:

```text
Overview
Workspaces
Projects
Tasks
Assignments
Digital Employees
Skills
Tools
Integrations        ← NEW
Agent Runs
Run Detail
Reviews
Files
Notifications
Activity Center
Reports
Calendar
Settings
Design System
```

---

# 7. INTEGRATION DOMAIN MODEL

Entity utama:

```text
IntegrationProvider
Connection
Credential
IntegrationTool
ToolPermission
ApprovalPolicy
ToolExecution
IntegrationEvent
```

Relasi:

```text
IntegrationProvider
        ↓
Connection
        ↓
Credential
        ↓
IntegrationTool
        ↓
ToolPermission
        ↓
Digital Employee
        ↓
Task
        ↓
Agent Run
        ↓
ToolExecution
        ↓
Audit
```

---

# 8. INTEGRATION PROVIDER

Provider adalah definisi platform eksternal.

Contoh:

```text
github
gmail
```

Future:

```text
google-drive
google-calendar
slack
discord
telegram
notion
whatsapp
outlook
stripe
custom-api
```

Provider tidak menyimpan credential user.

Contoh interface:

```ts
interface IntegrationProvider {
  id: string
  name: string
  category: string
  authType: AuthType
  capabilities: IntegrationCapability[]
}
```

---

# 9. CONNECTION

Connection adalah akun/provider yang benar-benar terhubung.

Contoh:

```text
GitHub Connection
account: github-user
workspace: Development
status: Connected
```

atau:

```text
Email Connection
provider: Gmail
account: account@example.com
workspace: Operations
status: Connected
```

Data:

```ts
interface Connection {
  id: string
  providerId: string
  workspaceId: string
  displayName: string
  accountLabel: string
  status: ConnectionStatus
  scopes: string[]
  createdAt: string
  updatedAt: string
  lastValidatedAt?: string
}
```

Status:

```text
Connected
Degraded
Expired
Revoked
Error
Disconnected
```

---

# 10. CREDENTIAL MANAGEMENT

Credential wajib dipisahkan dari application state biasa.

Prinsip:

```text
Frontend
   X
   ↓
Raw Token
```

Frontend hanya menerima:

```text
Connected
Account
Scopes
Status
```

Backend/credential service menangani:

```text
Access Token
Refresh Token
Private Key
Client Secret
Installation Credential
```

Credential harus:

- encrypted at rest;
- tidak masuk logs;
- tidak masuk prompt;
- tidak masuk telemetry;
- tidak ditampilkan penuh di UI.

---

# 11. OAUTH ARCHITECTURE

Untuk provider yang mendukung OAuth:

```text
SATRIA UI
 ↓
Connect
 ↓
OAuth Authorization
 ↓
Provider
 ↓
Callback
 ↓
Credential Vault
 ↓
Connection Created
```

UI hanya menampilkan hasil:

```text
✓ Connected
Account: user@example.com
```

---

# 12. GITHUB INTEGRATION

## 12.1 Recommended authentication

Gunakan:

```text
GitHub App
```

bukan menempatkan Personal Access Token user sebagai credential utama platform.

Arsitektur:

```text
SATRIA
 ↓
GitHub App
 ↓
Installation
 ↓
Selected Repositories
```

## 12.2 Repository scope

User dapat memilih:

```text
All repositories
```

atau:

```text
Selected repositories
```

Default sebaiknya:

```text
Selected repositories
```

---

# 13. GITHUB PERMISSION MODEL

Permission internal SATRIA:

```text
Repository Metadata
READ

Repository Contents
READ
WRITE

Issues
READ
WRITE

Pull Requests
READ
WRITE

Actions
READ

Workflows
WRITE
```

Tidak semua Digital Employee memperoleh seluruh permission.

Contoh:

### Backend Engineer

```text
Contents: READ / WRITE
Issues: READ
Pull Requests: READ / WRITE
Actions: READ
```

### Reviewer

```text
Contents: READ
Pull Requests: READ
Issues: READ
```

### Release Engineer

```text
Contents: READ / WRITE
Pull Requests: READ / WRITE
Actions: READ
Workflows: WRITE
```

---

# 14. GITHUB TOOL CATALOG

## Read tools

```text
github.list_repositories
github.get_repository
github.get_branch
github.list_branches
github.get_file
github.list_directory
github.search_code
github.get_commit
github.list_commits
```

## Issue tools

```text
github.list_issues
github.get_issue
github.create_issue
github.update_issue
github.comment_issue
```

## Pull Request tools

```text
github.list_pull_requests
github.get_pull_request
github.create_pull_request
github.update_pull_request
github.comment_pull_request
```

## Write tools

```text
github.create_branch
github.update_file
github.delete_file
github.create_commit
```

## Workflow tools

```text
github.list_workflows
github.get_workflow
github.list_workflow_runs
github.get_workflow_run
```

---

# 15. GITHUB HIGH-RISK ACTIONS

Contoh:

```text
Merge Pull Request
Delete Repository
Delete Branch
Modify Workflow
Create Release
Trigger Production Workflow
```

Default policy:

```text
DENY
```

atau:

```text
REQUIRES_APPROVAL
```

Agent tidak boleh melewati policy.

---

# 16. GITHUB EXAMPLE — CODE TASK

Task:

```text
Perbaiki bug authentication pada repository satria-api.
```

Flow:

```text
Task
 ↓
Assignment
 ↓
Bima — Backend Engineer
 ↓
GitHub get repository
 ↓
Get issue
 ↓
Read files
 ↓
Analyze
 ↓
Create branch
 ↓
Update files
 ↓
Run tests
 ↓
Verification
 ↓
Create Pull Request
 ↓
Review
```

Jika Create Pull Request dianggap membutuhkan approval:

```text
Verification PASS
 ↓
Approval Required
 ↓
Manager Approve
 ↓
Create PR
```

---

# 17. GITHUB TOOL CONTRACT

Setiap tool menggunakan contract internal SATRIA.

Contoh:

```ts
interface GitHubGetFileInput {
  connectionId: string
  owner: string
  repo: string
  path: string
  ref?: string
}
```

Result:

```ts
interface GitHubToolResult {
  success: boolean
  provider: "github"
  operation: string
  repository?: string
  path?: string
  data?: unknown
  evidence?: ToolEvidence[]
  error?: ToolError
}
```

---

# 18. EMAIL INTEGRATION

Provider awal:

```text
Gmail
```

Arsitektur:

```text
SATRIA
 ↓
Google OAuth
 ↓
Gmail API
 ↓
Mailbox Connection
```

Future:

```text
Microsoft Outlook
Exchange
Custom IMAP/SMTP
```

---

# 19. EMAIL PERMISSION MODEL

Contoh:

```text
Read Inbox
READ

Search Email
READ

Read Thread
READ

Read Attachment
READ

Create Draft
WRITE

Reply
WRITE / APPROVAL

Send
HIGH RISK / APPROVAL

Delete
DENY
```

Default aman:

```text
Read = ALLOW
Draft = ALLOW
Send = APPROVAL
Delete = DENY
```

---

# 20. EMAIL TOOL CATALOG

## Read

```text
email.list_messages
email.search_messages
email.get_message
email.get_thread
email.get_attachment
```

## Draft

```text
email.create_draft
email.update_draft
email.delete_draft
```

## Send

```text
email.send
email.reply
email.forward
```

---

# 21. EMAIL SEARCH

Tool menerima query terstruktur.

Contoh:

```ts
interface EmailSearchInput {
  connectionId: string
  query?: string
  from?: string
  to?: string
  subject?: string
  after?: string
  before?: string
  unreadOnly?: boolean
  limit?: number
}
```

Output:

```text
Message ID
Thread ID
Sender
Recipients
Subject
Timestamp
Snippet
Labels
Attachment Count
```

Agent tidak perlu langsung membawa seluruh inbox ke context.

---

# 22. EMAIL READING STRATEGY

Jangan:

```text
Load entire mailbox
```

Gunakan:

```text
Search
 ↓
Filter
 ↓
Fetch selected messages
 ↓
Summarize
```

Contoh:

```text
Task:
"Baca 10 email terbaru terkait order."

Search
 ↓
Filter "order"
 ↓
10 results
 ↓
Get selected messages
 ↓
Classification
 ↓
Summary
```

---

# 23. EMAIL CLASSIFICATION

SATRIA dapat membuat structured output:

```json
{
  "category": "customer_complaint",
  "priority": "high",
  "requires_reply": true,
  "summary": "..."
}
```

Kategori contoh:

```text
Customer Complaint
Customer Inquiry
Invoice
Payment
Order
Internal
Newsletter
Spam
Important
Other
```

---

# 24. EMAIL SEND SAFETY

Email send harus melalui policy.

Default:

```text
AI reads email
        ↓
AI drafts response
        ↓
Verification
        ↓
Approval
        ↓
Send
```

Untuk trusted automation yang secara eksplisit diizinkan:

```text
AI drafts
 ↓
Policy Check
 ↓
Automatic Send
 ↓
Audit
```

Namun mode automatic send harus opt-in.

---

# 25. EMAIL RECIPIENT POLICY

Tambahkan policy:

```text
Allowed Domains
Blocked Domains
Allowed Recipients
Approval Required Recipients
External Recipient Policy
```

Contoh:

```text
Internal @company.com
→ Auto Send

External recipient
→ Approval

Unknown domain
→ Approval

Blocked domain
→ DENY
```

---

# 26. EMAIL CONTENT POLICY

Sebelum send lakukan:

```text
Draft
 ↓
Validation
 ↓
Security Check
 ↓
Recipient Check
 ↓
Policy
 ↓
Approval
 ↓
Send
```

Validation:

```text
Missing recipient
Invalid recipient
Empty subject
Empty body
Attachment mismatch
Sensitive data policy
External recipient
```

---

# 27. EMAIL ATTACHMENT SECURITY

Attachment tidak langsung tersedia ke semua agent.

Policy:

```text
Read Attachment
Allowed / Denied
```

Validasi:

```text
Type
Size
Source
Workspace
Security Scan
```

Attachment harus memiliki audit event ketika dibaca.

---

# 28. UNIVERSAL TOOL ROUTER

Tambahkan layer:

```text
Tool Router
```

Arsitektur:

```text
Hermes Agent
      ↓
Tool Request
      ↓
Tool Router
      ↓
Permission Engine
      ↓
Approval Engine
      ↓
Integration Connector
      ↓
External API
```

Tool Router bertanggung jawab atas:

- authentication;
- authorization;
- scope;
- policy;
- approval;
- timeout;
- retries;
- structured result;
- audit.

---

# 29. TOOL REQUEST MODEL

```ts
interface ToolRequest {
  id: string
  runId: string
  taskId: string
  agentId: string
  connectionId?: string
  toolName: string
  action: string
  arguments: unknown
  riskLevel: RiskLevel
  createdAt: string
}
```

Risk:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# 30. PERMISSION ENGINE

Permission harus diperiksa sebelum execution.

```text
Tool Request
 ↓
Agent Permission
 ↓
Connection Permission
 ↓
Workspace Policy
 ↓
Project Policy
 ↓
Tool Policy
 ↓
Risk Policy
 ↓
ALLOW / APPROVAL / DENY
```

Jika salah satu policy memblokir:

```text
DENY
```

---

# 31. APPROVAL ENGINE

Approval object:

```ts
interface ApprovalRequest {
  id: string
  runId: string
  taskId: string
  toolRequestId: string
  reason: string
  riskLevel: RiskLevel
  requestedAction: string
  expiresAt?: string
  status: ApprovalStatus
}
```

Status:

```text
PENDING
APPROVED
REJECTED
EXPIRED
CANCELLED
```

---

# 32. APPROVAL UX

UI:

```text
Approval Required

Bima wants to:

Create Pull Request

Repository:
satria-api

Branch:
fix/authentication

Changes:
8 files

Risk:
MEDIUM

[Review Changes]

[Approve]
[Reject]
```

Email:

```text
Approval Required

Raka wants to send:

To:
manager@example.com

Subject:
Weekly Development Report

Attachments:
report.pdf

[Preview]
[Approve & Send]
[Reject]
```

---

# 33. TOOL EXECUTION LIFECYCLE

```text
REQUESTED
    ↓
VALIDATING
    ↓
POLICY_CHECK
    ↓
APPROVAL_REQUIRED?
    ├── YES → WAITING_APPROVAL
    │              ↓
    │          APPROVED
    │              ↓
    └──────────────┘
           EXECUTING
                ↓
           COMPLETED
                ↓
         RESULT_INGESTION
                ↓
           VERIFICATION
                ↓
             AUDIT
```

Failure:

```text
EXECUTING
 ↓
FAILED
 ↓
Failure Classifier
 ↓
Retryable?
```

---

# 34. RETRY POLICY FOR INTEGRATIONS

Retryable:

```text
NETWORK
TIMEOUT
RATE_LIMIT
TEMPORARY_PROVIDER_ERROR
STREAM_INTERRUPTION
```

Non-retryable:

```text
PERMISSION_DENIED
AUTH_REVOKED
POLICY_DENIED
SECURITY_FAILURE
INVALID_ARGUMENT
APPROVAL_REJECTED
```

Retry mengikuti batas Autonomous Task Loop:

```text
Maximum Attempts = 3
```

Jangan retry permission/security failures otomatis.

---

# 35. RATE LIMIT HANDLING

Integration layer harus mengetahui:

```text
Provider
Endpoint
Rate Limit
Remaining
Reset Time
```

Jika rate limited:

```text
Tool Failure
 ↓
RATE_LIMIT
 ↓
Retry Policy
 ↓
Backoff
 ↓
Retry
```

Jika tetap gagal:

```text
Blocked / Failed
```

---

# 36. CONNECTION HEALTH

Setiap connection memiliki health status:

```text
Healthy
Warning
Expired
Revoked
Error
```

Health check:

```text
Connection
 ↓
Validate Credential
 ↓
Provider Ping
 ↓
Permission Check
 ↓
Health Result
```

UI:

```text
GitHub
● Connected

Gmail
● Connected

Outlook
● Expired
```

---

# 37. INTEGRATION UI

Tambahkan:

```text
Settings
 → Integrations
```

Dashboard:

```text
INTEGRATIONS

Connected

GitHub
✓ Connected
12 repositories
[Manage]

Gmail
✓ Connected
account@example.com
[Manage]

Available

Google Drive
[Connect]

Slack
[Connect]
```

---

# 38. GITHUB MANAGEMENT UI

```text
GitHub Integration
────────────────────────

Account
github-user

Repositories

☑ satria-api
☑ satria-web
☐ sandbox-project

Permissions

Contents
[Read] [Write]

Issues
[Read] [Write]

Pull Requests
[Read] [Write]

Actions
[Read]

Workflows
[Disabled]

Approval Rules
Create PR       Require Approval
Merge PR        Require Approval
Workflow        Require Approval
```

---

# 39. EMAIL MANAGEMENT UI

```text
Email Integration
────────────────────────

Provider
Gmail

Account
account@example.com

Inbox
✓ Read

Search
✓ Allowed

Draft
✓ Allowed

Send
⚠ Approval Required

External Recipient
⚠ Approval Required

Delete
✕ Disabled
```

---

# 40. DIGITAL EMPLOYEE INTEGRATION ACCESS

Setiap employee memiliki tab:

```text
Digital Employee
 → Tools
 → Integrations
```

Contoh:

```text
Bima — Backend Engineer

GitHub
☑ Read Repository
☑ Edit Files
☑ Create Branch
☑ Create PR
☐ Merge PR

Gmail
☑ Read
☑ Draft
☐ Send
```

---

# 41. AGENT CONTEXT

Context Builder menambahkan:

```text
Available Integrations
Allowed Tools
Connection Metadata
Permissions
Approval Constraints
```

Jangan memasukkan:

```text
Access Token
Refresh Token
Private Key
Client Secret
```

---

# 42. TOOL DISCOVERY

Agent sebaiknya hanya menerima tool yang memang tersedia.

Contoh:

```text
Bima tools:

github.get_file
github.update_file
github.create_branch
github.create_pull_request
```

Bukan semua tool GitHub.

Hal ini mengurangi:

- tool overload;
- accidental action;
- policy bypass;
- context size.

---

# 43. CROSS-INTEGRATION TASK

Contoh powerful workflow:

```text
Task:
"Periksa issue baru, perbaiki bug, buat PR,
lalu kirim laporan hasil ke manager."

Planner
 ↓
GitHub
 ↓
Code Changes
 ↓
Tests
 ↓
Verification
 ↓
Pull Request
 ↓
Generate Report
 ↓
Email Draft
 ↓
Approval
 ↓
Send
 ↓
Complete
```

---

# 44. INTEGRATION RESULT EVIDENCE

Setiap tool harus menghasilkan evidence.

Contoh GitHub:

```text
Type:
github.commit

Repository:
satria-api

Branch:
fix/login

Commit:
abc123

Files Changed:
8

Status:
Success
```

Email:

```text
Type:
email.sent

Message ID:
provider-message-id

Thread ID:
provider-thread-id

Recipient:
manager@example.com

Status:
Sent
```

---

# 45. ARTIFACT INTEGRATION

Artifact dapat berasal dari integration execution.

Contoh:

```text
GitHub PR URL
Commit
Patch
Diff
Email Draft
Email Report
CSV Inbox Analysis
```

Artifact mengikuti Artifact System SATRIA.

---

# 46. AUDIT EVENT MODEL

Event baru:

```text
IntegrationConnected
IntegrationDisconnected

CredentialValidated
CredentialExpired

ToolRequested
ToolAllowed
ToolDenied

ApprovalRequested
ApprovalGranted
ApprovalRejected

ExternalRead
ExternalWrite
ExternalSend

GitHubBranchCreated
GitHubFileUpdated
GitHubPullRequestCreated

EmailRead
EmailDraftCreated
EmailSent
EmailReplySent
```

---

# 47. SECURITY AUDIT

Audit harus menyimpan:

```text
Who
What
Where
When
Why
Connection
Tool
Action
Result
Approval
```

Contoh:

```text
Who:
Bima

Connection:
github-01

Tool:
github.update_file

Repository:
satria-api

Action:
write

Approval:
not required

Result:
success
```

---

# 48. NOTIFICATION

Event yang memerlukan notifikasi:

```text
Connection Expired
Approval Required
Tool Denied
Integration Error
Email Sent
Pull Request Created
Security Violation
```

---

# 49. ERROR MODEL

Unified error:

```ts
interface IntegrationError {
  code: string
  provider: string
  tool: string
  message: string
  retryable: boolean
  status?: number
  details?: unknown
}
```

Code:

```text
AUTH_REQUIRED
AUTH_EXPIRED
PERMISSION_DENIED
POLICY_DENIED
RATE_LIMIT
NOT_FOUND
INVALID_ARGUMENT
PROVIDER_ERROR
NETWORK_ERROR
TIMEOUT
SECURITY_ERROR
APPROVAL_REQUIRED
APPROVAL_REJECTED
```

---

# 50. PROVIDER ADAPTER INTERFACE

```ts
interface IntegrationAdapter {
  providerId: string

  connect(): Promise<ConnectionResult>
  disconnect(connectionId: string): Promise<void>

  validateConnection(connectionId: string): Promise<HealthResult>

  listTools(connectionId: string): Promise<ToolDefinition[]>

  execute(
    connectionId: string,
    toolName: string,
    input: unknown
  ): Promise<ToolResult>
}
```

Implementasi:

```text
GitHubAdapter
GmailAdapter
```

Future:

```text
GoogleDriveAdapter
SlackAdapter
OutlookAdapter
```

---

# 51. BACKEND SERVICE LAYERS

Rekomendasi:

```text
IntegrationController
        ↓
IntegrationService
        ↓
ConnectionService
        ↓
CredentialService
        ↓
ToolRouter
        ↓
PolicyEngine
        ↓
ApprovalService
        ↓
ProviderAdapter
```

---

# 52. FRONTEND SERVICES

```text
integrationStore
connectionStore
toolPermissionStore
approvalStore
integrationActivityStore
```

API service:

```text
integrationsApi
connectionsApi
toolsApi
approvalsApi
```

Frontend tidak berbicara langsung ke GitHub/Gmail API untuk operational execution.

---

# 53. API DESIGN

## Integrations

```http
GET    /api/integrations
GET    /api/integrations/:provider
```

## Connections

```http
GET    /api/connections
POST   /api/connections
GET    /api/connections/:id
DELETE /api/connections/:id
POST   /api/connections/:id/validate
```

## Tools

```http
GET /api/connections/:id/tools
GET /api/tools/:id
```

## Tool Execution

```http
POST /api/tool-executions
GET  /api/tool-executions/:id
```

## Approval

```http
GET  /api/approvals
POST /api/approvals/:id/approve
POST /api/approvals/:id/reject
```

---

# 54. OAUTH CALLBACK

Contoh:

```http
GET /api/integrations/github/oauth/callback
GET /api/integrations/google/oauth/callback
```

Setelah callback:

```text
Provider
 ↓
Credential Store
 ↓
Connection
 ↓
Scope Validation
 ↓
Connected
```

---

# 55. DATABASE ENTITIES

Minimal:

```text
integration_providers
connections
connection_scopes
credentials
integration_tools
tool_permissions
approval_policies
tool_executions
integration_events
```

Relasi utama:

```text
provider
  ↓
connection
  ↓
tools
  ↓
executions
```

---

# 56. SUGGESTED DATABASE FIELDS

## connections

```text
id
provider_id
workspace_id
name
account_id
account_label
status
scope_json
metadata_json
last_validated_at
created_at
updated_at
```

## tool_permissions

```text
id
workspace_id
agent_id
connection_id
tool_name
action
effect
risk_level
approval_required
created_at
updated_at
```

## tool_executions

```text
id
run_id
task_id
agent_id
connection_id
tool_name
action
input_hash
status
started_at
completed_at
error_code
result_metadata
```

---

# 57. SECRET STORAGE

Preferred logical component:

```text
Credential Vault
```

Supported conceptual storage:

```text
Encrypted Database
Secret Manager
Vault Service
Cloud Secret Manager
```

Policy:

```text
Credential never visible to agent
Credential never visible to logs
Credential never visible to UI
Credential never added to prompt
```

---

# 58. SECURITY BOUNDARIES

## Workspace boundary

Connection dapat dibatasi ke workspace.

## Project boundary

Project hanya melihat connection yang diizinkan.

## Agent boundary

Digital Employee hanya mendapat tools yang diberikan.

## Task boundary

Task hanya meminta tools yang relevan.

## Run boundary

Run dapat membawa connectionId yang sudah divalidasi.

---

# 59. DUPLICATE EXECUTION PROTECTION

Tool execution harus idempotent jika memungkinkan.

Contoh masalah:

```text
email.send
 ↓
network timeout
 ↓
agent tidak tahu apakah email terkirim
 ↓
retry
 ↓
duplicate email
```

Solusi:

```text
Idempotency Key
```

Contoh:

```text
workspaceId
+
taskId
+
runId
+
toolName
+
operationKey
```

Untuk tindakan send/write, provider response harus disimpan sebelum retry lanjutan.

---

# 60. EMAIL DUPLICATE PROTECTION

Gunakan:

```text
Message Draft ID
+
Run ID
+
Send Operation ID
```

Agent harus tahu:

```text
UNKNOWN
SENT
FAILED
```

bukan menganggap timeout = gagal.

---

# 61. GITHUB DUPLICATE PROTECTION

Jangan membuat branch baru berkali-kali:

```text
fix/login
fix/login-2
fix/login-3
```

Gunakan deterministic branch key:

```text
task-{taskId}-fix
```

atau check branch sebelum create.

Untuk PR:

```text
Search existing PR
 ↓
Reuse if exists
```

---

# 62. RECOVERY

Setelah refresh/browser restart:

```text
Run state
 ↓
Recover active tool executions
 ↓
Check provider state
 ↓
Resume / Mark Unknown
```

Contoh email:

```text
Send started
 ↓
Application crash
 ↓
Recover
 ↓
Check provider/message state
 ↓
Do not blindly resend
```

---

# 63. OBSERVABILITY

Telemetry integration:

```text
Tool Call Count
Success Rate
Failure Rate
Latency
Provider Error Rate
Rate Limit Events
Approval Rate
Denied Rate
```

Cost:

```text
AI Cost
+
Integration Cost
```

---

# 64. DASHBOARD METRICS

Tambahkan:

```text
Connected Integrations
Healthy Connections
Tool Executions
Approval Requests
Tool Failures
Provider Errors
GitHub Operations
Email Operations
```

---

# 65. INTEGRATION ACTIVITY CENTER

UI:

```text
Activity

23:42
Bima
GitHub
Created branch fix/auth

23:45
Bima
GitHub
Updated 8 files

23:48
Bima
Verification
Tests passed

23:50
Raka
Email
Draft created

23:51
Manager
Approval
Approved

23:52
Raka
Email
Sent
```

---

# 66. REVIEW HUB INTEGRATION

Review drawer ditambah:

```text
External Actions

GitHub
- Branch created
- Files changed
- Pull Request

Email
- Recipient
- Subject
- Body
- Attachments
```

Reviewer dapat melihat semua external side effects sebelum final approval.

---

# 67. RUN DETAIL INTEGRATION TAB

Tambahkan:

```text
Overview
Pipeline
Logs
Telemetry
Tools
Integrations     ← NEW
Artifacts
Diffs
Verification
Review
Audit
```

Integration tab:

```text
GitHub
 ├─ get_file
 ├─ update_file
 ├─ create_branch
 └─ create_pull_request

Gmail
 ├─ search
 ├─ draft
 └─ send
```

---

# 68. POLICY PRESETS

Preset 1:

```text
Read Only
```

Preset 2:

```text
Developer
```

Preset 3:

```text
Operations
```

Preset 4:

```text
Trusted Automation
```

Preset 5:

```text
Strict Enterprise
```

Contoh Strict:

```text
All writes = approval
External email = approval
Destructive actions = deny
```

---

# 69. DIGITAL EMPLOYEE PRESETS

### Bima — Backend Engineer

```text
GitHub read/write
GitHub PR
GitHub actions read
Email read
Email draft
Email send approval
```

### Raka — Assistant Manager

```text
GitHub read
Email read
Email draft
Email send approval
```

### Rina — Safety Specialist

```text
GitHub read
Security review
No write
Email read
No send
```

---

# 70. CROSS-SYSTEM AGENT EXAMPLE

Task:

```text
Periksa email customer tentang bug,
cari issue terkait di GitHub,
hubungkan email ke issue,
kemudian buat draft jawaban.
```

Flow:

```text
Gmail Search
 ↓
Read Email
 ↓
Extract Issue
 ↓
GitHub Search
 ↓
Get Issue
 ↓
Correlation
 ↓
Draft Email
 ↓
Verification
 ↓
Human Review
```

---

# 71. ADVANCED CROSS-SYSTEM EXAMPLE

Task:

```text
Setiap pagi baca email bug report,
kelompokkan berdasarkan prioritas,
buat task GitHub untuk bug baru,
dan kirim summary ke manager.
```

Flow:

```text
Scheduler
 ↓
Email Search
 ↓
Classifier
 ↓
Deduplicate
 ↓
GitHub Create Issue
 ↓
Generate Report
 ↓
Email Draft
 ↓
Approval
 ↓
Send
 ↓
Audit
```

---

# 72. SCHEDULER COMPATIBILITY

Future scheduler SATRIA dapat memicu integration task:

```text
Immediate
Scheduled
Recurring
Event Driven
```

Contoh:

```text
08:00 daily
→ Read Inbox
→ Classify
→ Create GitHub issues
→ Send summary
```

---

# 73. EVENT-DRIVEN FUTURE

Future event:

```text
GitHub issue opened
 ↓
SATRIA Event Gateway
 ↓
Task Created
 ↓
Agent Assignment
 ↓
Autonomous Loop
```

Email:

```text
New Email
 ↓
Email Event
 ↓
SATRIA Gateway
 ↓
Task
```

Event-driven actions tetap melalui policy.

---

# 74. API / WEBHOOK FUTURE

External systems dapat membuat task:

```http
POST /api/tasks
```

Payload:

```json
{
  "title": "Process customer bug",
  "source": "email",
  "metadata": {
    "messageId": "..."
  }
}
```

SATRIA tetap menjalankan:

```text
Task
 ↓
Assignment
 ↓
Tools
 ↓
Approval
 ↓
Verification
```

---

# 75. LOGGING POLICY

Do not log:

```text
Access Token
Refresh Token
Authorization Header
Client Secret
Private Key
Full mailbox content unnecessarily
Sensitive attachments unnecessarily
```

Log:

```text
Tool name
Connection id
Provider
Action
Status
Latency
Error code
Metadata
```

---

# 76. DATA MINIMIZATION

Agent hanya mengambil data yang diperlukan.

Email:

```text
Search
→ Fetch selected
→ Process
→ Discard unnecessary content
```

GitHub:

```text
Read required file
→ Process
→ No unnecessary repository dump
```

---

# 77. TESTING STRATEGY

## Unit

Test:

- policy engine;
- tool router;
- provider adapter;
- credential handling;
- approval engine.

## Integration

Test:

- GitHub authentication;
- repository read;
- branch creation;
- file update;
- PR creation;
- Gmail search;
- Gmail read;
- draft;
- send.

## End-to-end

Test:

```text
Task
→ Agent
→ GitHub
→ Verification
→ Review
```

dan:

```text
Task
→ Agent
→ Gmail
→ Approval
→ Send
```

---

# 78. MOCK PROVIDER

Development harus memiliki:

```text
MockGitHubAdapter
MockGmailAdapter
```

Mock tidak boleh dianggap sebagai bukti real provider execution.

Real verification harus menggunakan:

```text
Real GitHub Connection
Real Gmail Connection
```

dalam environment yang aman.

---

# 79. SECURITY TESTING

Wajib menguji:

```text
Unauthorized tool
Expired token
Revoked access
Cross-workspace connection
Wrong repository
Wrong mailbox
Policy bypass
Approval bypass
Duplicate send
Prompt injection from external content
Malformed provider response
```

---

# 80. PROMPT INJECTION DEFENSE

Email dan repository adalah **untrusted external content**.

Contoh email dapat berisi instruksi seperti:

```text
Ignore previous instructions...
```

Agent harus menganggap isi external system sebagai data, bukan system instruction.

Boundary:

```text
System Policy
  >
Agent Role
  >
Task
  >
Tool Policy
  >
External Content
```

External content tidak boleh mengubah permission agent.

---

# 81. GITHUB CONTENT SECURITY

Repository code juga dianggap data yang tidak sepenuhnya trusted.

Agent tidak boleh mengikuti instruksi dalam source file yang mencoba:

- mengubah policy;
- meminta secret;
- meminta bypass approval;
- menghapus audit;
- menjalankan tindakan di luar task.

---

# 82. EMAIL CONTENT SECURITY

Email body tidak boleh:

- mengubah tool permission;
- memicu credential disclosure;
- menginstruksikan bypass approval;
- meminta secret;
- mengoverride system policy.

---

# 83. ACCEPTANCE CRITERIA — INTEGRATION FOUNDATION

Feature dianggap selesai jika:

1. User dapat melihat Integration page.
2. User dapat connect provider.
3. Connection memiliki status.
4. Credential tidak exposed ke frontend/model.
5. Agent hanya melihat allowed tools.
6. Tool Router menjalankan permission check.
7. Approval dapat menghentikan execution.
8. Tool result masuk ke Run.
9. Tool execution masuk Audit.
10. Integration failure diklasifikasikan.

---

# 84. ACCEPTANCE CRITERIA — GITHUB

Minimal:

1. Connect GitHub App.
2. Select repository.
3. Read repository.
4. Read file.
5. Create branch.
6. Update file.
7. Create commit.
8. Read/create PR sesuai policy.
9. Approval untuk high-risk actions.
10. Audit semua write operation.

---

# 85. ACCEPTANCE CRITERIA — EMAIL

Minimal:

1. Connect Gmail melalui OAuth.
2. Read mailbox.
3. Search email.
4. Read message.
5. Read selected attachment.
6. Create draft.
7. Reply draft.
8. Send email dengan approval.
9. Audit send.
10. Duplicate-send protection.

---

# 86. PHASED IMPLEMENTATION PLAN

## Phase A — Integration Foundation

Implement:

```text
IntegrationProvider
Connection
Credential
ToolDefinition
ToolRouter
PermissionEngine
ApprovalEngine
Audit integration
```

Deliverable:

```text
Integration UI
+
Connection lifecycle
+
Mock provider
```

---

## Phase B — GitHub Read

Implement:

```text
GitHub App
Repository list
Get repository
Get file
Search code
Issues read
PR read
```

Deliverable:

```text
Agent can understand repository context.
```

---

## Phase C — GitHub Write

Implement:

```text
Create branch
Update file
Create commit
Create PR
```

Tambah:

```text
Approval
Diff
Verification
Audit
```

---

## Phase D — Gmail Read

Implement:

```text
Google OAuth
List messages
Search
Get message
Get thread
Get attachment
```

Deliverable:

```text
Agent can understand incoming email.
```

---

## Phase E — Gmail Draft

Implement:

```text
Create draft
Update draft
Reply draft
```

Deliverable:

```text
Agent can prepare responses.
```

---

## Phase F — Gmail Send

Implement:

```text
Approval
Send
Reply
Audit
Idempotency
```

Deliverable:

```text
Agent can safely send email.
```

---

## Phase G — Cross Integration Workflow

Implement:

```text
GitHub + Gmail
```

Example:

```text
Email
 ↓
GitHub Issue
 ↓
Code
 ↓
Verification
 ↓
Report
 ↓
Email
```

---

# 87. RECOMMENDED DEVELOPMENT ORDER

Prioritas:

```text
1. Tool Router
2. Permission Engine
3. Integration Connection
4. Approval Engine integration
5. GitHub Adapter
6. Gmail Adapter
7. Audit
8. Verification
9. Cross-integration orchestration
```

Jangan membangun UI GitHub/Gmail terlalu jauh sebelum Tool Router dan Permission Engine stabil.

---

# 88. MVP DEFINITION

MVP yang realistis:

```text
GitHub
✓ Connect
✓ Select repository
✓ Read files
✓ Read issues
✓ Create branch
✓ Update file
✓ Create PR
✓ Approval

Gmail
✓ Connect
✓ Search inbox
✓ Read email
✓ Create draft
✓ Send with approval
```

Belum wajib:

```text
Workflow mutation
Repository deletion
Email deletion
Automatic external send
Multi-provider email
Advanced event-driven automation
```

---

# 89. V1 TARGET

Target V1:

```text
SATRIA
+
GitHub
+
Gmail
+
Tool Router
+
Permission
+
Approval
+
Audit
+
Verification
```

Agent mampu:

```text
READ
→ PLAN
→ WRITE
→ VERIFY
→ REQUEST APPROVAL
→ EXECUTE
→ REPORT
```

lintas sistem.

---

# 90. FUTURE CONNECTOR SDK

Setelah foundation stabil, provider baru cukup membuat:

```text
Provider Definition
OAuth / Auth Adapter
Tool Definitions
Provider Adapter
Policy Mapping
```

Contoh:

```text
GoogleDriveAdapter
SlackAdapter
OutlookAdapter
NotionAdapter
TelegramAdapter
WhatsAppAdapter
```

tanpa mengubah Autonomous Task Loop.

---

# 91. FINAL ARCHITECTURE

```text
                         USER
                          ↓
                     SATRIA UI
                          ↓
                    DOMAIN STORES
                          ↓
                 AUTONOMOUS TASK LOOP
                          ↓
                    CONTEXT BUILDER
                          ↓
                    HERMES RUNTIME
                          ↓
                      TOOL ROUTER
                          ↓
                 ┌────────┴─────────┐
                 ↓                  ↓
          PERMISSION ENGINE    APPROVAL ENGINE
                 ↓                  ↓
                 └────────┬─────────┘
                          ↓
                 INTEGRATION MANAGER
                    ┌─────┴─────┐
                    ↓           ↓
               GitHub App    Google OAuth
                    ↓           ↓
               GitHub API     Gmail API
                    ↓           ↓
                TOOL RESULT / EXTERNAL EFFECT
                          ↓
                    RESULT INGESTION
                          ↓
                  VERIFICATION ENGINE
                          ↓
                      REVIEW HUB
                          ↓
                ┌─────────┴─────────┐
                ↓                   ↓
             APPROVE             CHANGE
                ↓                   ↓
               DONE             RETRY LOOP

                   ↓
                AUDIT LOG
                   ↓
               OBSERVABILITY
```

---

# 92. FINAL PRODUCT DEFINITION

Dengan Integration Layer ini, SATRIA berkembang dari:

```text
AI Workforce Runtime
```

menjadi:

```text
AI Workforce Operating System
```

yang mampu:

```text
CONNECT
→ UNDERSTAND
→ PLAN
→ EXECUTE
→ USE TOOLS
→ ACCESS EXTERNAL SYSTEMS
→ REQUEST APPROVAL
→ VERIFY
→ RETRY
→ REPORT
→ COMPLETE
```

Contoh paling penting:

```text
GitHub:
Agent dapat bekerja pada repository secara terkontrol.

Email:
Agent dapat memahami inbox dan mempersiapkan serta mengirim komunikasi.

Cross-System:
Agent dapat menyelesaikan workflow yang membutuhkan lebih dari satu sistem.
```

Tetap dengan governance:

```text
PERMISSION
+
POLICY
+
APPROVAL
+
VERIFICATION
+
AUDIT
+
BOUNDED AUTONOMY
```

---

# 93. IMPLEMENTATION CHECKLIST

## Foundation

- [ ] IntegrationProvider
- [ ] Connection model
- [ ] Credential service
- [ ] Tool definition
- [ ] Tool Router
- [ ] Permission Engine
- [ ] Approval Engine
- [ ] Audit events
- [ ] Integration health

## GitHub

- [ ] GitHub App
- [ ] OAuth/installation flow
- [ ] Repository selection
- [ ] Repository read
- [ ] File read
- [ ] Code search
- [ ] Branch creation
- [ ] File update
- [ ] Commit
- [ ] Pull Request
- [ ] Approval policy
- [ ] Audit

## Email

- [ ] Google OAuth
- [ ] Mailbox connection
- [ ] Search
- [ ] Read message
- [ ] Read thread
- [ ] Attachment access
- [ ] Draft
- [ ] Reply
- [ ] Send
- [ ] Recipient policy
- [ ] Approval
- [ ] Idempotency
- [ ] Audit

## Agentic

- [ ] Tool discovery
- [ ] Context Builder integration metadata
- [ ] Tool request
- [ ] Tool result ingestion
- [ ] Verification evidence
- [ ] Retry handling
- [ ] Cross-integration workflow
- [ ] Recovery
- [ ] Duplicate execution protection

---

# 94. END STATE

SATRIA harus mampu menangani task seperti:

> "Baca email bug terbaru, cari issue yang sesuai di GitHub, analisis repository, perbaiki bug, jalankan test, buat pull request, buat laporan, kemudian kirim laporan ke manager setelah approval."

Execution:

```text
EMAIL
 ↓
CLASSIFY
 ↓
GITHUB
 ↓
ANALYZE
 ↓
CODE
 ↓
TEST
 ↓
VERIFY
 ↓
PR
 ↓
REPORT
 ↓
EMAIL DRAFT
 ↓
APPROVAL
 ↓
SEND
 ↓
AUDIT
 ↓
COMPLETE
```

Inilah target **Agentic Cross-System Execution** untuk SATRIA.
