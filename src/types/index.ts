export type WorkspaceType = 'Personal' | 'Development' | 'Business' | 'Sandbox'

export interface Workspace {
  id: string
  name: string
  type: WorkspaceType
  description: string
  icon?: string
  projectCount: number
  taskCount: number
  fileCount: number
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Cancelled' | 'Archived'
export type ProjectHealth = 'Healthy' | 'At Risk' | 'Critical'

export interface Milestone {
  id: string
  title: string
  dueDate: string
  completed: boolean
}

export interface Project {
  id: string
  workspaceId: string
  name: string
  description: string
  status: ProjectStatus
  health?: ProjectHealth
  progress: number
  taskCount: number
  completedTaskCount: number
  contributorsCount: number
  accentColor?: string
  milestones: Milestone[]
  path: string
  defaultWorkerId?: string
  defaultWorkerName?: string
  runtimeProfile?: string
  repositoryUrl?: string
  branch?: string
  createdAt: string
  updatedAt: string
  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string
  archivedAt?: string
  deletedAt?: string
  deletedBy?: string
  deleteReason?: string
}

export type TaskType = 'one_time' | 'project' | 'recurring_instance'
export type TaskStatus =
  | 'Draft'
  | 'Todo'
  | 'In Progress'
  | 'Waiting'
  | 'Review'
  | 'Done'
  | 'Cancelled'
  | 'Archived'
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export interface ChecklistItem {
  id: string
  title: string
  completed: boolean
}

export interface TaskComment {
  id: string
  authorName: string
  authorAvatar?: string
  content: string
  createdAt: string
}

export interface Task {
  id: string
  workspaceId: string
  projectId: string
  projectName: string
  title: string
  description: string
  type?: TaskType
  executionMode?: SatriaExecutionMode // 'TASK_EXECUTION' | 'EMAIL_INTELLIGENCE' | 'ENGINEERING_EXECUTION' | 'CROSS_SYSTEM'
  allowedIntegrations?: IntegrationProviderType[] // Explicit whitelist of allowed integrations (e.g. ['github'] or ['gmail'])
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  assigneeName: string
  assigneeAvatar?: string
  workerId?: string
  workerName?: string
  requiredSkillIds?: string[]
  optionalSkillIds?: string[]
  acceptanceCriteria?: string[]
  parentTaskId?: string
  dependencyTaskIds?: string[]
  pathOverride?: string
  scheduleId?: string
  executionKey?: string
  instructions?: string
  activeRunId?: string
  latestRunId?: string
  activeAssignmentId?: string
  dueDate: string
  tags: string[]
  progress: number
  checklist: ChecklistItem[]
  comments: TaskComment[]
  createdAt: string
  updatedAt: string
  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string
  deletedAt?: string
  deletedBy?: string
  deleteReason?: string
  archivedAt?: string
}

export type FileCategory = 'Documents' | 'Images' | 'Exports' | 'Archives' | 'Code'

export interface WorkspaceFile {
  id: string
  workspaceId: string
  projectId?: string
  projectName?: string
  name: string
  extension: string
  category: FileCategory
  sizeBytes: number
  sizeFormatted: string
  updatedAt: string
  url?: string
  description?: string
  contentPreview?: string
  uploadedBy?: string
}

export type ActivityAction = 'created' | 'updated' | 'completed' | 'uploaded' | 'deleted'

export interface ActivityLog {
  id: string
  workspaceId: string
  actorName: string
  actorAvatar?: string
  action: ActivityAction
  targetType: 'task' | 'project' | 'file' | 'workspace'
  targetTitle: string
  targetId?: string
  projectId?: string
  timestamp: string
  timeAgo: string
  date?: string
}

export type NotificationPriority = 'normal' | 'important' | 'critical'

export interface NotificationItem {
  id: string
  workspaceId: string
  title: string
  message: string
  timeAgo: string
  read: boolean
  priority: NotificationPriority
  category: 'Tasks' | 'Projects' | 'Files' | 'System'
  link?: string
  createdAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

export interface AiRuntimeConfig {
  hermesBaseUrl: string
  hermesApiKey: string
  llmBaseUrl: string
  selectedModel: string
  selectedProvider: string
  temperature: number
  maxTokens: number
  availableModels: string[]
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system'
  compactMode: boolean
  startPage: string
  sidebarCollapsed: boolean
  defaultTaskView: 'list' | 'board' | 'calendar'
  emailNotifications: boolean
  inAppNotifications: boolean
  soundEnabled: boolean
  autoSaveInterval: number
  timezone: string
  language: string
  aiRuntime?: AiRuntimeConfig
}

export interface UserProfile {
  id: string
  displayName: string
  email: string
  avatarUrl?: string
  timezone: string
  language: string
  compactMode: boolean
  theme: 'dark' | 'light'
  settings?: UserSettings
}

// ==========================================
// PHASE 1 — WORKFORCE STRUCTURE TYPES
// ==========================================

export interface Department {
  id: string               // 'dept-coding', 'dept-trainer', 'dept-side-hustle'
  name: string             // 'Coding', 'Trainer', 'Side Hustle'
  code: string             // 'CODING', 'TRAINER', 'SIDE_HUSTLE'
  description: string
  icon: string             // Lucide icon name, e.g. 'Code', 'GraduationCap', 'Briefcase'
  status: 'active' | 'inactive'
  employeeCount: number
  roleCount: number
  createdAt: string
  updatedAt: string
}

export interface EmployeeRole {
  id: string               // 'role-planner', 'role-uiux', dst
  departmentId: string
  name: string             // 'Asisten Manager / Planner'
  description: string
  responsibilities: string[]
  status: 'active' | 'inactive'
}

export type SkillPriority = 'P0' | 'P1' | 'P2'
export type SkillStatus = 'Registered' | 'Available' | 'Installed' | 'Active'
export type SkillSourceType = 'internal' | 'external'

export interface Skill {
  id: string
  name: string
  slug: string
  category: string
  description: string
  sourceType: SkillSourceType
  sourceRepository?: string
  sourceUrl?: string
  installCommand?: string
  version: string
  status: SkillStatus
  compatibleDepartments: string[]
  compatibleRoles: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ToolStatus = 'available' | 'unavailable' | 'deprecated'

export interface WorkforceTool {
  id: string
  name: string
  category: string
  description: string
  status: ToolStatus
  permissionLevel: 'read' | 'write' | 'admin'
  compatibleDepartments?: string[]
}

export interface EmployeeSkillAssignment {
  skillId: string
  skillName?: string
  priority: SkillPriority
  assignedAt: string
}

export type EmploymentStatus = 'Active' | 'Inactive' | 'Draft' | 'Archived'

export interface Employee {
  id: string               // 'emp-raka', 'emp-maya', dst
  name: string             // 'Raka', 'Maya', dst
  avatar: string           // URL or initials
  departmentId: string
  roleId: string
  roleName: string         // denormalized for convenience
  departmentName: string   // denormalized
  description: string
  status: EmploymentStatus
  isPrimary?: boolean
  workerType?: 'digital_worker' | 'human_user'
  workState?: EmployeeWorkState
  supervisorId?: string
  supervisorName?: string
  skills: EmployeeSkillAssignment[]
  toolIds: string[]
  permissions: string[]
  createdAt: string
  updatedAt: string
}

// ==========================================
// PHASE 2 — TASK ASSIGNMENT & AGENT RUN TYPES
// ==========================================

export type AssignmentStatus = 
  | 'Unassigned' 
  | 'Assigned' 
  | 'Accepted' 
  | 'Rejected' 
  | 'Queued' 
  | 'In Progress' 
  | 'Waiting' 
  | 'Completed' 
  | 'Failed' 
  | 'Cancelled'

export interface TaskAssignment {
  id: string                  // 'asg-101'
  taskId: string
  taskTitle: string           // denormalized
  employeeId: string
  employeeName: string        // denormalized
  employeeAvatar: string
  employeeRole: string
  assignedBy: string          // user / planner
  skillIds: string[]
  priority: TaskPriority
  status: AssignmentStatus
  instructions?: string
  acceptedAt?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type AgentRunStatus = 
  | 'Queued' 
  | 'Starting' 
  | 'Running' 
  | 'Waiting' 
  | 'Verifying' 
  | 'Completed' 
  | 'Failed' 
  | 'Cancelled'

export type RunStep = 
  | 'Initializing' 
  | 'Loading Task & Context' 
  | 'Preparing Workspace' 
  | 'Working' 
  | 'Verifying' 
  | 'Completing'

export interface RunLogEntry {
  id: string
  timestamp: string
  step: RunStep
  message: string
  level: 'info' | 'warn' | 'error' | 'success'
}

export interface RuntimeTelemetry {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens: number
  model: string
  provider: string
  durationMs: number
  estimatedCostUsd: number | null
}

export interface AgentRun {
  id: string                  // 'run-1023-01'
  assignmentId: string
  taskId: string
  taskTitle: string
  employeeId: string
  employeeName: string
  employeeAvatar: string
  employeeRole: string
  status: AgentRunStatus
  attempt: number             // 1, 2, 3 (max 3)
  currentStep: RunStep
  progress: number            // 0 - 100
  logs: RunLogEntry[]
  telemetry?: RuntimeTelemetry
  runtime?: string
  runtimeName?: string
  runtimeStatus?: 'healthy' | 'degraded' | 'offline'
  workspacePath?: string
  triggerType?: 'manual' | 'schedule' | 'retry' | 'dependency'
  parentRunId?: string
  startedAt: string
  lastHeartbeatAt?: string
  completedAt?: string
  durationSeconds?: number
  outputSummary?: string
  error?: string
  injectedMemories?: AgentMemoryItem[]
  createdAt: string
  updatedAt: string
  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string
  deletedAt?: string
  deletedBy?: string
  deleteReason?: string
}

export type VerificationStatus = 'Passed' | 'Failed' | 'Warning' | 'Pending'

export interface VerificationEvidence {
  type: 'test' | 'typecheck' | 'build' | 'artifact' | 'diff' | 'security' | 'criteria'
  name: string
  passed: boolean
  details: string
  command?: string
}

export interface RunResultDeliverable {
  type: 'code' | 'document' | 'analysis' | 'config'
  title: string
  content?: string
  path?: string
  diffSummary?: string
}

export interface RunResultDiff {
  filePath: string
  changeType: 'created' | 'modified' | 'deleted'
  additions: number
  deletions: number
  diffContent?: string
}

export interface RunResult {
  id: string                  // 'res-101'
  runId: string
  taskId: string
  assignmentId: string
  summary: string
  output: string
  status: 'success' | 'failure' | 'partial'
  artifactIds: string[]
  deliverables?: RunResultDeliverable[]
  diffs?: RunResultDiff[]
  verificationStatus: VerificationStatus
  verificationNotes?: string
  verificationEvidence?: VerificationEvidence[]
  createdAt: string
  updatedAt: string
}

export type ReviewDecision = 'Approved' | 'Changes Requested' | 'Rejected' | 'Pending'

export interface TaskReview {
  id: string                  // 'rev-101'
  runId: string
  taskId: string
  taskTitle: string
  assignmentId: string
  employeeId: string
  employeeName: string
  reviewer: string
  status: ReviewDecision
  comment?: string
  checklist: { item: string; completed: boolean }[]
  decisionAt?: string
  createdAt: string
  updatedAt: string
}

export type EmployeeWorkState = 'Idle' | 'Assigned' | 'Running' | 'Waiting' | 'Review'

export interface SkillMatchResult {
  requiredMatchPercentage: number
  optionalMatchPercentage: number
  matchedRequiredSkills: string[]
  missingRequiredSkills: string[]
  matchedOptionalSkills: string[]
  missingOptionalSkills: string[]
  isEligible: boolean
  warning?: string
}

// ==========================================
// PHASE 3.11 — AGENT MEMORY SUBSYSTEM TYPES
// ==========================================

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'feedback'
export type MemoryScope = 'global' | 'project' | 'employee'

export interface AgentMemoryItem {
  id: string
  workspaceId: string
  employeeId?: string
  employeeName?: string
  projectId?: string
  projectName?: string
  runId?: string
  type: MemoryType
  scope: MemoryScope
  title: string
  content: string
  tags: string[]
  confidence: number          // 0.0 - 1.0
  importance: number          // 1 - 5
  source: 'autonomous_run' | 'reviewer_feedback' | 'manual_entry' | 'system_rule'
  accessCount: number
  lastAccessedAt?: string
  createdAt: string
  updatedAt: string
}

export interface MemoryRecallQuery {
  workspaceId: string
  employeeId?: string
  projectId?: string
  queryText?: string
  tags?: string[]
  types?: MemoryType[]
  limit?: number
  minConfidence?: number
}

// ==========================================
// RECURRING SCHEDULE & ACTIVE WORK READ MODEL
// ==========================================

export type ScheduleRecurrence = 'once' | 'daily' | 'weekly' | 'monthly' | 'cron'

export interface ScheduleTaskTemplate {
  title: string
  description: string
  workerId?: string
  workerName?: string
  priority: TaskPriority
  instructions?: string
  pathOverride?: string
  acceptanceCriteria?: string[]
  checklist?: ChecklistItem[]
}

export interface Schedule {
  id: string
  workspaceId: string
  projectId?: string
  projectName?: string
  name: string
  description?: string
  taskTemplate: ScheduleTaskTemplate
  recurrence: ScheduleRecurrence
  cronExpression?: string
  time?: string
  dayOfWeek?: string
  daysOfWeek?: number[]
  timezone: string
  enabled: boolean
  nextRunAt?: string
  lastRunAt?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  deletedBy?: string
  deleteReason?: string
}

export interface ActiveWorkItem {
  taskId: string
  taskTitle: string
  taskType?: TaskType
  taskStatus: TaskStatus
  projectId: string
  projectName: string
  workerId: string
  workerName: string
  workerAvatar: string
  workerRole: string
  runId?: string
  runStatus?: AgentRunStatus
  attempt?: number
  progress: number
  currentStep?: RunStep | string
  runtime: string
  path: string
  startedAt?: string
  lastActivityAt?: string
  outputSummary?: string
  hasPendingApproval?: boolean
  error?: string
}

export interface CostEntry {
  id: string
  runId: string
  taskId: string
  projectId?: string
  workspaceId: string
  workerId?: string
  provider: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  cachedTokens?: number
  tokens: number
  costUsd: number
  createdAt: string
  timestamp: string
}

export interface AuditLogEntry {
  id: string
  actor: string
  timestamp: string
  entity: 'Project' | 'Task' | 'Run' | 'Schedule' | 'Worker' | 'Workspace' | 'System'
  entityId: string
  action:
    | 'Task Created'
    | 'Task Edited'
    | 'Worker Changed'
    | 'Instruction Added'
    | 'Run Started'
    | 'Run Stopped'
    | 'Run Cancelled'
    | 'Run Retried'
    | 'Task Cancelled'
    | 'Task Archived'
    | 'Task Deleted'
    | 'Project Created'
    | 'Project Edited'
    | 'Project Cancelled'
    | 'Project Archived'
    | 'Project Deleted'
    | 'Schedule Created'
    | 'Schedule Disabled'
    | 'Schedule Enabled'
    | 'Schedule Deleted'
    | 'Schedule Triggered'
    | 'Workspace Locked'
    | 'Workspace Unlocked'
    | 'Backup Exported'
    | 'Backup Restored'
    | string
  reason?: string
  metadata?: Record<string, any>
}

export type WorkspaceLockConflictPolicy = 'wait' | 'stop_existing' | 'allow_concurrent'

export interface WorkspaceLock {
  workspacePath: string
  activeRunId: string
  taskId: string
  taskTitle: string
  workerName: string
  lockedAt: string
}

export type UserRole = 'Owner' | 'Worker' | 'Viewer'

export type PermissionType =
  | 'project:create'
  | 'project:edit'
  | 'project:cancel'
  | 'project:archive'
  | 'project:delete'
  | 'task:create'
  | 'task:edit'
  | 'task:cancel'
  | 'task:archive'
  | 'task:delete'
  | 'task:change_worker'
  | 'task:view'
  | 'run:start'
  | 'run:stop'
  | 'run:cancel'
  | 'run:retry'
  | 'run:delete'
  | 'run:add_instruction'
  | 'run:execute'
  | 'run:update_result'
  | 'schedule:create'
  | 'schedule:toggle'
  | 'schedule:delete'
  | 'schedule:trigger'
  | 'memory:manage'
  | 'backup:export'
  | 'backup:restore'
  | 'content:create'
  | 'content:edit'
  | 'content:approve'
  | 'content:publish'
  | 'content:delete'
  | 'datareview:create'
  | 'datareview:analyze'
  | 'social:connect'
  | 'social:disconnect'
  | 'integration:manage'
  | 'integration:connect'
  | 'integration:disconnect'
  | 'tool:execute'
  | 'tool:approve'

export interface SatriaBackupBundle {
  version: string
  exportedAt: string
  exportedBy: string
  workspaceId: string
  data: {
    projects: Project[]
    tasks: Task[]
    runs: AgentRun[]
    schedules: Schedule[]
    employees: Employee[]
    departments: Department[]
    costEntries: CostEntry[]
    auditLogs: AuditLogEntry[]
    memories: AgentMemoryItem[]
    workspacePathReferences: { projectId: string; path: string }[]
    contentItems?: ContentItem[]
    publications?: Publication[]
    socialConnections?: SocialConnection[]
    mediaAssets?: MediaAsset[]
    dataReviews?: DataReview[]
    integrationConnections?: IntegrationConnection[]
    toolPermissions?: ToolPermission[]
  }
}

// ==========================================
// PHASE 6 — CONTENT, DATA ANALYSIS & SOCIAL AUTOMATION TYPES
// ==========================================

export type PlatformTarget = 'instagram' | 'threads' | 'tiktok' | 'facebook_page' | 'facebook_group'

export type ContentStatus =
  | 'Draft'
  | 'Review'
  | 'Approved'
  | 'Scheduled'
  | 'Publishing'
  | 'Published'
  | 'Failed'
  | 'Cancelled'

export type PublicationStatus =
  | 'Pending'
  | 'Approved'
  | 'Scheduled'
  | 'Publishing'
  | 'Published'
  | 'Failed'
  | 'Cancelled'
  | 'Assisted'

export type SocialConnectionStatus = 'Connected' | 'Expired' | 'Revoked' | 'Error'

export type ApprovalPolicy = 'Auto' | 'Review' | 'Strict'

export interface MediaAsset {
  id: string
  projectId?: string
  name: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  thumbnailUrl?: string
  sizeBytes: number
  dimensions?: { width: number; height: number }
  durationSeconds?: number
  createdAt: string
}

export interface PlatformContentAdaptation {
  caption?: string
  hook?: string
  script?: string
  onScreenText?: string[]
  hashtags?: string[]
  cta?: string
  formattedBody?: string
}

export interface ContentQualityCheck {
  brandCompliance: boolean
  grammarQuality: boolean
  noSensitiveContent: boolean
  linksValid: boolean
  mediaValid: boolean
  score: number // 0 - 100
  notes?: string[]
}

export interface ContentItem {
  id: string
  projectId: string
  projectName?: string
  title: string
  caption?: string
  mediaAssetIds: string[]
  targetPlatforms: PlatformTarget[]
  status: ContentStatus
  approvalRequired: boolean
  approvalPolicy: ApprovalPolicy
  version: number
  platformVersions?: Partial<Record<PlatformTarget, PlatformContentAdaptation>>
  qualityChecks?: ContentQualityCheck
  scheduledAt?: string
  publishedAt?: string
  rejectionReason?: string
  approvedBy?: string
  approvedAt?: string
  createdBy: string
  creatorName?: string
  workflowInstanceId?: string
  dataReviewId?: string
  createdAt: string
  updatedAt: string
}

export interface Publication {
  id: string
  contentItemId: string
  contentTitle?: string
  platform: PlatformTarget
  connectionId?: string
  status: PublicationStatus
  scheduledAt?: string
  publishedAt?: string
  externalId?: string
  externalUrl?: string
  error?: string
  idempotencyKey: string
  attemptCount: number
  parentRunId?: string
  createdAt: string
  updatedAt: string
}

export interface SocialConnection {
  id: string
  platform: PlatformTarget
  accountName: string
  accountId?: string
  accountHandle?: string
  avatarUrl?: string
  status: SocialConnectionStatus
  credentialReference: string
  isAssisted?: boolean
  autoPublishEnabled?: boolean
  credentials?: {
    appId?: string
    appSecret?: string
    accessToken?: string
    clientKey?: string
    clientSecret?: string
    pageId?: string
    userId?: string
  }
  connectedAt: string
  expiresAt?: string
  updatedAt: string
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'research' | 'analyze' | 'generate' | 'visual' | 'quality_check' | 'review' | 'approval' | 'schedule' | 'publish' | 'verify'
  assignedWorkerId?: string
  requiredSkillIds?: string[]
  order: number
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  targetProjectId?: string
  steps: WorkflowStep[]
  createdAt: string
  updatedAt: string
}

export interface WorkflowInstance {
  id: string
  workflowTemplateId: string
  workflowTemplateName?: string
  projectId: string
  type?: 'project' | 'one_time' | 'recurring_instance'
  executionMode?: SatriaExecutionMode // 'TASK_EXECUTION' | 'EMAIL_INTELLIGENCE' | 'ENGINEERING_EXECUTION' | 'CROSS_SYSTEM'
  allowedIntegrations?: IntegrationProviderType[] // Explicit whitelist of permitted integration providers (e.g. ['github'] or ['gmail'])
  projectName?: string
  scheduleId?: string
  scheduleExecutionKey?: string
  parentTaskId?: string
  contentItemId?: string
  dataReviewId?: string
  status: 'Pending' | 'Running' | 'Waiting' | 'Review' | 'Completed' | 'Failed' | 'Cancelled'
  currentStepId?: string
  currentStepName?: string
  currentStepIndex: number
  totalSteps: number
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface DataReviewArtifact {
  id: string
  name: string
  type: 'docx' | 'pdf' | 'csv' | 'xlsx' | 'json' | 'markdown'
  size: string
  url: string
}

export interface DataReviewMetric {
  label: string
  value: string | number
  change?: string
  isPositive?: boolean
}

export interface DataReview {
  id: string
  projectId: string
  projectName?: string
  title: string
  sourceFile: string
  sourceFormat: 'csv' | 'xlsx' | 'json' | 'database' | 'api'
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  summary: string
  keyMetrics: DataReviewMetric[]
  anomalies: string[]
  trends: string[]
  findings: string[]
  risks: string[]
  recommendations: string[]
  sourceReferences: string[]
  artifacts: DataReviewArtifact[]
  generatedContentId?: string
  analyzedByWorkerId?: string
  analyzedByWorkerName?: string
  createdAt: string
  completedAt?: string
}

// ==========================================
// GITHUB & EMAIL INTEGRATION DOMAIN TYPES
// ==========================================
export type IntegrationProviderType = 'github' | 'gmail' | 'google_drive' | 'slack' | 'outlook' | 'custom_api'
export type IntegrationAuthType = 'oauth2' | 'github_app' | 'api_key' | 'webhook'
export type IntegrationConnectionStatus = 'Connected' | 'Degraded' | 'Expired' | 'Revoked' | 'Error' | 'Disconnected'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ToolEffect = 'ALLOW' | 'APPROVAL_REQUIRED' | 'DENY' | 'BOUNDARY_DENIED'
export type IntegrationApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
export type ToolExecutionStatus = 'REQUESTED' | 'VALIDATING' | 'WAITING_APPROVAL' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REJECTED'

export type AuditRejectionCategory =
  | 'PERMISSION_DENIED'
  | 'POLICY_DENIED'
  | 'BOUNDARY_VIOLATION'
  | 'APPROVAL_REJECTED'

export type SatriaExecutionMode =
  | 'TASK_EXECUTION'
  | 'EMAIL_INTELLIGENCE'
  | 'ENGINEERING_EXECUTION'
  | 'CROSS_SYSTEM'

// Email Intelligence 3-Layer & Accounting Safety Types
export type EmailCategory =
  | 'FINANCE'
  | 'PAYMENT'
  | 'SALES'
  | 'CUSTOMER'
  | 'OPERATIONS'
  | 'REPORT'
  | 'OTHER'

export type TransactionLifecycleStatus =
  | 'EXTRACTED'
  | 'VERIFIED'
  | 'RECONCILED'
  | 'FINAL'
  | 'FLAGGED_DUPLICATE'
  | 'DISPUTED'

export interface EmailFilterRule {
  id: string
  name: string
  enabled: boolean
  senderDomainPattern?: string // e.g. '*.bank.co.id', '*shopee.co.id*'
  senderAddressPattern?: string // e.g. 'notification@bank...', 'no-reply@shopee...'
  subjectKeywords?: string[] // e.g. ['mutasi', 'transaksi', 'saldo', 'settlement']
  bodyKeywords?: string[] // e.g. ['pembayaran', 'berhasil', 'rekening']
  hasAttachment?: boolean
  targetCategory: EmailCategory
  targetSource: string // e.g. 'BANK', 'SHOPEEPAY', 'MIDTRANS', 'MARKETPLACE'
  priority: number
}

export interface StructuredEmailTransaction {
  id: string
  messageId: string
  ruleId?: string
  category: EmailCategory
  source: string // 'BANK' | 'SHOPEEPAY' | 'MIDTRANS' | 'ECOMMERCE' | 'VENDOR'
  sender: string
  subject: string
  receivedAt: string
  transactionDate: string
  amount: number
  fee?: number
  netAmount?: number
  currency: string
  type: 'INCOME' | 'EXPENSE' | 'SETTLEMENT' | 'TRANSFER' | 'INVOICE'
  referenceNumber: string
  senderOrMerchantName?: string
  rawSnippet: string
  status: TransactionLifecycleStatus
  reconciliationGroupId?: string
  duplicateOfId?: string
  validationErrors?: string[]
}

export interface ReconciledJournalEntry {
  id: string
  canonicalReference: string // e.g. 'SAT-9921'
  title: string
  entryType: 'INCOME' | 'EXPENSE' | 'SETTLEMENT'
  transactionDate: string
  grossAmount: number
  totalFee: number
  netAmount: number
  currency: string
  status: TransactionLifecycleStatus
  primarySource: string
  evidenceSources: string[] // e.g. ['MIDTRANS', 'SHOPEEPAY', 'BANK']
  rawTransactionIds: string[]
  reconciledAt: string
  confidence: number
  reconciliationNotes: string
}

export interface EmailIntelligenceReport {
  id: string
  title: string
  category: EmailCategory
  generatedAt: string
  period: {
    startDate: string
    endDate: string
  }
  totalEmailsScanned: number
  totalRelevantEmails: number
  totalIgnoredEmails: number
  totalRawEvidence: number
  totalReconciledUniqueTransactions: number
  totalDuplicatesMerged: number
  summary: {
    totalIncome: number
    totalExpense: number
    totalSettlement: number
    totalFee: number
    netRevenue: number
    currency: string
  }
  sourceBreakdown: {
    source: string
    transactionCount: number
    totalAmount: number
  }[]
  reconciledEntries: ReconciledJournalEntry[]
  transactions: StructuredEmailTransaction[]
  markdownDeliverable: string
}

export interface IntegrationCapability {
  id: string
  name: string
  description: string
}

export interface IntegrationProvider {
  id: IntegrationProviderType
  name: string
  category: 'developer' | 'communication' | 'productivity' | 'custom'
  authType: IntegrationAuthType
  description: string
  icon: string
  capabilities: IntegrationCapability[]
}

export interface IntegrationConnection {
  id: string
  providerId: IntegrationProviderType
  workspaceId: string
  displayName: string
  accountLabel: string
  accountId?: string
  status: IntegrationConnectionStatus
  scopes: string[]
  metadata?: {
    repositories?: string[]
    defaultBranch?: string
    selectedMailbox?: string
    allowedRecipientDomains?: string[]
    autoDraftEnabled?: boolean
    autoSendEnabled?: boolean
    [key: string]: any
  }
  credentials?: {
    accessToken?: string
    refreshToken?: string
    installationId?: string
    apiKey?: string
  }
  lastValidatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ToolEvidence {
  type: string
  id?: string
  label: string
  data?: unknown
  url?: string
  diff?: string
  summary?: string
}

export interface IntegrationTool {
  name: string
  provider: IntegrationProviderType
  action: string
  displayName: string
  riskLevel: RiskLevel
  requiresApproval: boolean
  description: string
  inputSchema?: Record<string, any>
}

export interface ToolPermission {
  id: string
  workspaceId: string
  agentId: string // worker ID or '*'
  connectionId: string // connection ID or '*'
  toolName: string
  action: string
  effect: ToolEffect
  riskLevel: RiskLevel
  approvalRequired: boolean
  createdAt: string
  updatedAt: string
}

export interface ToolRequest {
  id: string
  runId: string
  taskId: string
  agentId: string
  agentName?: string
  connectionId?: string
  toolName: string
  action: string
  arguments: Record<string, any>
  riskLevel: RiskLevel
  createdAt: string
}

export interface ToolExecution {
  id: string
  runId: string
  taskId: string
  agentId: string
  agentName?: string
  connectionId?: string
  toolName: string
  action: string
  inputHash: string
  status: ToolExecutionStatus
  arguments?: Record<string, any>
  startedAt: string
  completedAt?: string
  errorCode?: string
  errorMessage?: string
  resultMetadata?: Record<string, any>
  evidence?: ToolEvidence[]
}

export interface IntegrationApprovalRequest {
  id: string
  runId: string
  taskId: string
  toolRequestId: string
  agentId: string
  agentName: string
  connectionId: string
  provider: IntegrationProviderType
  requestedAction: string
  toolName: string
  reason: string
  riskLevel: RiskLevel
  details: Record<string, any>
  status: IntegrationApprovalStatus
  expiresAt?: string
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface IntegrationAuditEvent {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  connectionId: string
  provider: IntegrationProviderType
  toolName: string
  action: string
  status: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'BOUNDARY_DENIED' | 'APPROVED' | 'REJECTED'
  rejectionCategory?: AuditRejectionCategory
  taskContext?: {
    taskId?: string
    executionMode?: SatriaExecutionMode
    allowedIntegrations?: string[]
  }
  riskLevel: RiskLevel
  details?: Record<string, any>
  evidence?: ToolEvidence[]
}

export interface CrossSystemStep {
  id: string
  name: string
  system: 'Gmail' | 'GitHub' | 'Verification' | 'Approval' | 'Reporting'
  action: string
  status: 'Pending' | 'Running' | 'Completed' | 'Waiting_Approval' | 'Failed'
  details?: string
  evidenceUrl?: string
}

export interface CrossSystemWorkflowState {
  id: string
  taskId: string
  title: string
  status: 'Idle' | 'Running' | 'Waiting_Approval' | 'Completed' | 'Failed'
  currentStepIndex: number
  steps: CrossSystemStep[]
  deliverables: {
    githubIssueUrl?: string
    branchName?: string
    filesChanged?: number
    pullRequestUrl?: string
    testResultsSummary?: string
    emailDraftId?: string
    emailRecipient?: string
    emailSentUrl?: string
  }
  startedAt?: string
  completedAt?: string
}
