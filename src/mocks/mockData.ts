import type {
  Workspace,
  Project,
  Task,
  WorkspaceFile,
  ActivityLog,
  NotificationItem,
  UserProfile,
  UserSettings,
  Department,
  EmployeeRole,
  Skill,
  WorkforceTool,
  Employee,
  TaskAssignment,
  AgentRun,
  RunResult,
  TaskReview,
  AgentMemoryItem,
  Schedule
} from '../types'
import * as seed from '../database/initialSeed'

export const mockUserSettings: UserSettings = JSON.parse(JSON.stringify(seed.initialUserSettings))
export const mockUser: UserProfile = JSON.parse(JSON.stringify(seed.initialUser))
export const mockWorkspaces: Workspace[] = JSON.parse(JSON.stringify(seed.initialWorkspaces))
export const mockProjects: Project[] = JSON.parse(JSON.stringify(seed.initialProjects))
export const mockTasks: Task[] = JSON.parse(JSON.stringify(seed.initialTasks))
export const mockFiles: WorkspaceFile[] = JSON.parse(JSON.stringify(seed.initialFiles))
export const mockActivityLogs: ActivityLog[] = JSON.parse(JSON.stringify(seed.initialActivityLogs))
export const mockNotifications: NotificationItem[] = JSON.parse(JSON.stringify(seed.initialNotifications))
export const mockDepartments: Department[] = JSON.parse(JSON.stringify(seed.initialDepartments))
export const mockEmployeeRoles: EmployeeRole[] = JSON.parse(JSON.stringify(seed.initialEmployeeRoles))
export const mockSkills: Skill[] = JSON.parse(JSON.stringify(seed.initialSkills))
export const mockWorkforceTools: WorkforceTool[] = JSON.parse(JSON.stringify(seed.initialWorkforceTools))
export const mockEmployees: Employee[] = JSON.parse(JSON.stringify(seed.initialEmployees))
export const mockAssignments: TaskAssignment[] = JSON.parse(JSON.stringify(seed.initialAssignments))
export const mockAgentRuns: AgentRun[] = JSON.parse(JSON.stringify(seed.initialAgentRuns))
export const mockRunResults: RunResult[] = JSON.parse(JSON.stringify(seed.initialRunResults))
export const mockTaskReviews: TaskReview[] = JSON.parse(JSON.stringify(seed.initialTaskReviews))
export const mockMemories: AgentMemoryItem[] = JSON.parse(JSON.stringify(seed.initialMemories))
export const mockSchedules: Schedule[] = JSON.parse(JSON.stringify(seed.initialSchedules))

