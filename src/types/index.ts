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
  }
}
