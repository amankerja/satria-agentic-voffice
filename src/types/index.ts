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

export type ProjectStatus = 'Active' | 'On Track' | 'At Risk' | 'Completed' | 'Archived'

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
  progress: number
  taskCount: number
  completedTaskCount: number
  contributorsCount: number
  accentColor?: string
  milestones: Milestone[]
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'Backlog' | 'In Progress' | 'Blocked' | 'Review' | 'Done'
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
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  assigneeName: string
  assigneeAvatar?: string
  requiredSkillIds?: string[]
  optionalSkillIds?: string[]
  parentTaskId?: string
  dependencyTaskIds?: string[]
  activeRunId?: string
  activeAssignmentId?: string
  dueDate: string
  tags: string[]
  progress: number
  checklist: ChecklistItem[]
  comments: TaskComment[]
  createdAt: string
  updatedAt: string
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
  startedAt: string
  completedAt?: string
  durationSeconds?: number
  outputSummary?: string
  error?: string
  createdAt: string
  updatedAt: string
}

export type VerificationStatus = 'Passed' | 'Failed' | 'Warning' | 'Pending'

export interface RunResult {
  id: string                  // 'res-101'
  runId: string
  taskId: string
  assignmentId: string
  summary: string
  output: string
  status: 'success' | 'failure' | 'partial'
  artifactIds: string[]
  verificationStatus: VerificationStatus
  verificationNotes?: string
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


