import { dbClient } from '../database/DatabaseClient'
import type {
  Workspace,
  Project,
  Task,
  TaskStatus,
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
  EmployeeSkillAssignment,
  EmploymentStatus,
  TaskAssignment,
  AssignmentStatus,
  AgentRun,
  AgentRunStatus,
  RunStep,
  RunLogEntry,
  RunResult,
  TaskReview,
  ReviewDecision,
  AgentMemoryItem,
  MemoryRecallQuery,
  MemoryHierarchyTier,
  Schedule,
  CostEntry,
  AuditLogEntry,
  ContentItem,
  Publication,
  SocialConnection,
  MediaAsset,
  DataReview,
  WorkflowTemplate,
  IntegrationConnection,
  ToolPermission,
  ToolExecution,
  IntegrationApprovalRequest,
  IntegrationAuditEvent
} from '../types'

// ============================================================================
// REAL DATABASE REPOSITORIES
// All queries and mutations execute against IndexedDB and sync to data/database.json
// ============================================================================

export class WorkspaceRepository {
  async getAll(): Promise<Workspace[]> {
    return await dbClient.getAll<Workspace>('workspaces')
  }

  async getById(id: string): Promise<Workspace | undefined> {
    return await dbClient.getById<Workspace>('workspaces', id)
  }

  async create(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'projectCount' | 'taskCount' | 'fileCount'>): Promise<Workspace> {
    const newWs: Workspace = {
      ...workspace,
      id: `ws-${Date.now()}`,
      projectCount: 0,
      taskCount: 0,
      fileCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return await dbClient.insert<Workspace>('workspaces', newWs)
  }
}

export class ProjectRepository {
  async getAll(includeDeleted = false): Promise<Project[]> {
    const all = await dbClient.getAll<Project>('projects')
    return includeDeleted ? all : all.filter((p) => !p.deletedAt)
  }

  async getByWorkspace(workspaceId: string, includeDeleted = false): Promise<Project[]> {
    const all = await dbClient.getAll<Project>('projects')
    return all.filter((p) => p.workspaceId === workspaceId && (includeDeleted || !p.deletedAt))
  }

  async getById(id: string): Promise<Project | undefined> {
    return await dbClient.getById<Project>('projects', id)
  }

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'taskCount' | 'completedTaskCount' | 'milestones'>): Promise<Project> {
    const newPrj: Project = {
      ...project,
      id: `prj-${Date.now()}`,
      progress: 0,
      taskCount: 0,
      completedTaskCount: 0,
      milestones: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return await dbClient.insert<Project>('projects', newPrj)
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    return await dbClient.update<Project>('projects', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async softDelete(id: string, deletedBy = 'Owner', deleteReason = 'Project deleted'): Promise<boolean> {
    const res = await dbClient.update<Project>('projects', id, {
      deletedAt: new Date().toISOString(),
      deletedBy,
      deleteReason,
      status: 'Cancelled',
      updatedAt: new Date().toISOString()
    })
    return !!res
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('projects', id)
  }
}

export class TaskRepository {
  async getAll(includeDeleted = false): Promise<Task[]> {
    const all = await dbClient.getAll<Task>('tasks')
    return includeDeleted ? all : all.filter((t) => !t.deletedAt)
  }

  async getByWorkspace(workspaceId: string, includeDeleted = false): Promise<Task[]> {
    const all = await dbClient.getAll<Task>('tasks')
    return all.filter((t) => t.workspaceId === workspaceId && (includeDeleted || !t.deletedAt))
  }

  async getByProject(projectId: string, includeDeleted = false): Promise<Task[]> {
    const all = await dbClient.getAll<Task>('tasks')
    return all.filter((t) => t.projectId === projectId && (includeDeleted || !t.deletedAt))
  }

  async getById(id: string): Promise<Task | undefined> {
    return await dbClient.getById<Task>('tasks', id)
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | undefined> {
    return await dbClient.update<Task>('tasks', id, {
      status,
      updatedAt: new Date().toISOString()
    })
  }

  async update(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    return await dbClient.update<Task>('tasks', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'checklist' | 'comments'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}`,
      progress: 0,
      checklist: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return await dbClient.insert<Task>('tasks', newTask)
  }

  async softDelete(id: string, deletedBy = 'Owner', deleteReason = 'Task deleted'): Promise<boolean> {
    const res = await dbClient.update<Task>('tasks', id, {
      deletedAt: new Date().toISOString(),
      deletedBy,
      deleteReason,
      status: 'Cancelled',
      updatedAt: new Date().toISOString()
    })
    return !!res
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('tasks', id)
  }
}

export class FileRepository {
  async getAll(): Promise<WorkspaceFile[]> {
    return await dbClient.getAll<WorkspaceFile>('files')
  }

  async getByWorkspace(workspaceId: string): Promise<WorkspaceFile[]> {
    const all = await dbClient.getAll<WorkspaceFile>('files')
    return all.filter((f) => f.workspaceId === workspaceId)
  }

  async getById(id: string): Promise<WorkspaceFile | undefined> {
    return await dbClient.getById<WorkspaceFile>('files', id)
  }

  async upload(fileData: Omit<WorkspaceFile, 'id' | 'updatedAt'>): Promise<WorkspaceFile> {
    const newFile: WorkspaceFile = {
      ...fileData,
      id: `fl-${Date.now()}`,
      updatedAt: 'Just now'
    }
    return await dbClient.insert<WorkspaceFile>('files', newFile)
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('files', id)
  }
}

export class ActivityRepository {
  async getAll(): Promise<ActivityLog[]> {
    return await dbClient.getAll<ActivityLog>('activities')
  }

  async getByWorkspace(workspaceId: string): Promise<ActivityLog[]> {
    const all = await dbClient.getAll<ActivityLog>('activities')
    return all.filter((a) => a.workspaceId === workspaceId)
  }

  async logActivity(log: Omit<ActivityLog, 'id' | 'timestamp' | 'timeAgo'>): Promise<ActivityLog> {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const mins = String(now.getMinutes()).padStart(2, '0')
    const newLog: ActivityLog = {
      ...log,
      id: `act-${Date.now()}`,
      timestamp: `${hours}:${mins}`,
      timeAgo: 'Just now',
      date: 'Today'
    }
    return await dbClient.insert<ActivityLog>('activities', newLog)
  }
}

export class NotificationRepository {
  async getAll(): Promise<NotificationItem[]> {
    return await dbClient.getAll<NotificationItem>('notifications')
  }

  async getByWorkspace(workspaceId: string): Promise<NotificationItem[]> {
    const all = await dbClient.getAll<NotificationItem>('notifications')
    return all.filter((n) => n.workspaceId === workspaceId)
  }

  async create(notifData: Omit<NotificationItem, 'id' | 'timeAgo' | 'read'> & { read?: boolean }): Promise<NotificationItem> {
    const newNotif: NotificationItem = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: notifData.read ?? false,
      timeAgo: 'Just now',
      createdAt: new Date().toISOString()
    }
    return await dbClient.insert<NotificationItem>('notifications', newNotif)
  }

  async markAsRead(id: string): Promise<boolean> {
    const res = await dbClient.update<NotificationItem>('notifications', id, { read: true })
    return !!res
  }

  async markAllAsRead(workspaceId?: string): Promise<void> {
    const all = await dbClient.getAll<NotificationItem>('notifications')
    for (const n of all) {
      if (!workspaceId || n.workspaceId === workspaceId) {
        await dbClient.update<NotificationItem>('notifications', n.id, { read: true })
      }
    }
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('notifications', id)
  }
}

export class UserRepository {
  async getUser(): Promise<UserProfile> {
    return await dbClient.getItem<UserProfile>('user_profile')
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return await dbClient.updateItem<UserProfile>('user_profile', updates)
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return await dbClient.updateItem<UserSettings>('user_settings', settings)
  }
}

export class DepartmentRepository {
  async getAll(): Promise<Department[]> {
    return await dbClient.getAll<Department>('departments')
  }

  async getById(id: string): Promise<Department | undefined> {
    return await dbClient.getById<Department>('departments', id)
  }

  async getByCode(code: string): Promise<Department | undefined> {
    const all = await dbClient.getAll<Department>('departments')
    return all.find((d) => d.code.toUpperCase() === code.toUpperCase())
  }
}

export class EmployeeRoleRepository {
  async getAll(): Promise<EmployeeRole[]> {
    return await dbClient.getAll<EmployeeRole>('roles')
  }

  async getByDepartment(departmentId: string): Promise<EmployeeRole[]> {
    const all = await dbClient.getAll<EmployeeRole>('roles')
    return all.filter((r) => r.departmentId === departmentId)
  }

  async getById(id: string): Promise<EmployeeRole | undefined> {
    return await dbClient.getById<EmployeeRole>('roles', id)
  }
}

export class SkillRepository {
  async getAll(): Promise<Skill[]> {
    return await dbClient.getAll<Skill>('skills')
  }

  async getById(id: string): Promise<Skill | undefined> {
    return await dbClient.getById<Skill>('skills', id)
  }

  async getByCategory(category: string): Promise<Skill[]> {
    const all = await dbClient.getAll<Skill>('skills')
    return all.filter((s) => s.category.toLowerCase() === category.toLowerCase())
  }

  async getBySourceType(sourceType: 'internal' | 'external'): Promise<Skill[]> {
    const all = await dbClient.getAll<Skill>('skills')
    return all.filter((s) => s.sourceType === sourceType)
  }

  async create(skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> {
    const newSkill: Skill = {
      ...skill,
      id: `skill-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return await dbClient.insert<Skill>('skills', newSkill)
  }

  async update(id: string, updates: Partial<Skill>): Promise<Skill | undefined> {
    return await dbClient.update<Skill>('skills', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }
}

export class WorkforceToolRepository {
  async getAll(): Promise<WorkforceTool[]> {
    return await dbClient.getAll<WorkforceTool>('tools')
  }

  async getById(id: string): Promise<WorkforceTool | undefined> {
    return await dbClient.getById<WorkforceTool>('tools', id)
  }

  async getByCategory(category: string): Promise<WorkforceTool[]> {
    const all = await dbClient.getAll<WorkforceTool>('tools')
    return all.filter((t) => t.category.toLowerCase() === category.toLowerCase())
  }

  async create(tool: Omit<WorkforceTool, 'id'>): Promise<WorkforceTool> {
    const newTool: WorkforceTool = {
      ...tool,
      id: `tool-${Date.now()}`
    }
    return await dbClient.insert<WorkforceTool>('tools', newTool)
  }
}

export class EmployeeRepository {
  async getAll(): Promise<Employee[]> {
    return await dbClient.getAll<Employee>('employees')
  }

  async getById(id: string): Promise<Employee | undefined> {
    return await dbClient.getById<Employee>('employees', id)
  }

  async getByDepartment(departmentId: string): Promise<Employee[]> {
    const all = await dbClient.getAll<Employee>('employees')
    return all.filter((e) => e.departmentId === departmentId)
  }

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await dbClient.insert<Employee>('employees', newEmployee)

    // Update department count
    const depts = await dbClient.getAll<Department>('departments')
    const employees = await dbClient.getAll<Employee>('employees')
    const dept = depts.find((d) => d.id === employee.departmentId)
    if (dept) {
      const count = employees.filter((e) => e.departmentId === dept.id && e.status !== 'Archived').length
      await dbClient.update<Department>('departments', dept.id, { employeeCount: count })
    }

    return newEmployee
  }

  async update(id: string, updates: Partial<Employee>): Promise<Employee | undefined> {
    const updated = await dbClient.update<Employee>('employees', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })

    if (updates.departmentId) {
      const depts = await dbClient.getAll<Department>('departments')
      const employees = await dbClient.getAll<Employee>('employees')
      for (const d of depts) {
        const count = employees.filter((e) => e.departmentId === d.id && e.status !== 'Archived').length
        await dbClient.update<Department>('departments', d.id, { employeeCount: count })
      }
    }
    return updated
  }

  async updateStatus(id: string, status: EmploymentStatus): Promise<Employee | undefined> {
    const updated = await dbClient.update<Employee>('employees', id, {
      status,
      updatedAt: new Date().toISOString()
    })

    if (updated) {
      const depts = await dbClient.getAll<Department>('departments')
      const employees = await dbClient.getAll<Employee>('employees')
      const dept = depts.find((d) => d.id === updated.departmentId)
      if (dept) {
        const count = employees.filter((e) => e.departmentId === dept.id && e.status !== 'Archived').length
        await dbClient.update<Department>('departments', dept.id, { employeeCount: count })
      }
    }
    return updated
  }

  async assignSkill(employeeId: string, assignment: EmployeeSkillAssignment): Promise<Employee | undefined> {
    const employee = await dbClient.getById<Employee>('employees', employeeId)
    if (employee) {
      const skills = [...employee.skills]
      const existingIdx = skills.findIndex((s) => s.skillId === assignment.skillId)
      if (existingIdx >= 0) {
        skills[existingIdx] = assignment
      } else {
        skills.push(assignment)
      }
      return await dbClient.update<Employee>('employees', employeeId, {
        skills,
        updatedAt: new Date().toISOString()
      })
    }
    return undefined
  }

  async removeSkill(employeeId: string, skillId: string): Promise<Employee | undefined> {
    const employee = await dbClient.getById<Employee>('employees', employeeId)
    if (employee) {
      const skills = employee.skills.filter((s) => s.skillId !== skillId)
      return await dbClient.update<Employee>('employees', employeeId, {
        skills,
        updatedAt: new Date().toISOString()
      })
    }
    return undefined
  }

  async archive(id: string): Promise<Employee | undefined> {
    return this.updateStatus(id, 'Archived')
  }
}

export class AssignmentRepository {
  async getAll(): Promise<TaskAssignment[]> {
    return await dbClient.getAll<TaskAssignment>('assignments')
  }

  async getById(id: string): Promise<TaskAssignment | undefined> {
    return await dbClient.getById<TaskAssignment>('assignments', id)
  }

  async getByTaskId(taskId: string): Promise<TaskAssignment[]> {
    const all = await dbClient.getAll<TaskAssignment>('assignments')
    return all.filter((a) => a.taskId === taskId)
  }

  async getByEmployeeId(employeeId: string): Promise<TaskAssignment[]> {
    const all = await dbClient.getAll<TaskAssignment>('assignments')
    return all.filter((a) => a.employeeId === employeeId)
  }

  async create(assignment: Omit<TaskAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskAssignment> {
    const newAssignment: TaskAssignment = {
      ...assignment,
      id: `asg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await dbClient.insert<TaskAssignment>('assignments', newAssignment)

    // Update corresponding task assignee
    await dbClient.update<Task>('tasks', assignment.taskId, {
      assigneeId: assignment.employeeId,
      assigneeName: assignment.employeeName,
      assigneeAvatar: assignment.employeeAvatar,
      activeAssignmentId: newAssignment.id,
      updatedAt: new Date().toISOString()
    })

    return newAssignment
  }

  async update(id: string, updates: Partial<TaskAssignment>): Promise<TaskAssignment | undefined> {
    return await dbClient.update<TaskAssignment>('assignments', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<TaskAssignment | undefined> {
    const updates: Partial<TaskAssignment> = {
      status,
      updatedAt: new Date().toISOString()
    }
    if (status === 'Completed') {
      updates.completedAt = new Date().toISOString()
    } else if (status === 'In Progress') {
      updates.startedAt = new Date().toISOString()
    }
    return await dbClient.update<TaskAssignment>('assignments', id, updates)
  }

  async cancel(id: string): Promise<TaskAssignment | undefined> {
    return this.updateStatus(id, 'Cancelled')
  }
}

export class AgentRunRepository {
  async getAll(includeDeleted = false): Promise<AgentRun[]> {
    const all = await dbClient.getAll<AgentRun>('agent_runs')
    return includeDeleted ? all : all.filter((r) => !r.deletedAt)
  }

  async getById(id: string): Promise<AgentRun | undefined> {
    return await dbClient.getById<AgentRun>('agent_runs', id)
  }

  async getByAssignmentId(assignmentId: string, includeDeleted = false): Promise<AgentRun[]> {
    const all = await dbClient.getAll<AgentRun>('agent_runs')
    return all.filter((r) => r.assignmentId === assignmentId && (includeDeleted || !r.deletedAt))
  }

  async getByTaskId(taskId: string, includeDeleted = false): Promise<AgentRun[]> {
    const all = await dbClient.getAll<AgentRun>('agent_runs')
    return all.filter((r) => r.taskId === taskId && (includeDeleted || !r.deletedAt))
  }

  async getByEmployeeId(employeeId: string, includeDeleted = false): Promise<AgentRun[]> {
    const all = await dbClient.getAll<AgentRun>('agent_runs')
    return all.filter((r) => r.employeeId === employeeId && (includeDeleted || !r.deletedAt))
  }

  async create(run: Omit<AgentRun, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentRun> {
    const newRun: AgentRun = {
      ...run,
      id: `run-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await dbClient.insert<AgentRun>('agent_runs', newRun)

    // Update active run on task
    await dbClient.update<Task>('tasks', run.taskId, {
      activeRunId: newRun.id,
      latestRunId: newRun.id,
      updatedAt: new Date().toISOString()
    })

    return newRun
  }

  async update(id: string, updates: Partial<AgentRun>): Promise<AgentRun | undefined> {
    return await dbClient.update<AgentRun>('agent_runs', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async addLog(id: string, log: Omit<RunLogEntry, 'id'>): Promise<AgentRun | undefined> {
    const run = await dbClient.getById<AgentRun>('agent_runs', id)
    if (run) {
      const logs = [...run.logs]
      logs.push({
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      })
      return await dbClient.update<AgentRun>('agent_runs', id, {
        logs,
        updatedAt: new Date().toISOString()
      })
    }
    return undefined
  }

  async updateProgress(id: string, progress: number, step: RunStep, status?: AgentRunStatus): Promise<AgentRun | undefined> {
    const updates: Partial<AgentRun> = {
      progress,
      currentStep: step,
      updatedAt: new Date().toISOString()
    }
    if (status) {
      updates.status = status
      if (status === 'Completed') {
        updates.completedAt = new Date().toISOString()
      }
    }
    return await dbClient.update<AgentRun>('agent_runs', id, updates)
  }

  async softDelete(id: string, deletedBy = 'Owner', deleteReason = 'Run deleted'): Promise<boolean> {
    const res = await dbClient.update<AgentRun>('agent_runs', id, {
      deletedAt: new Date().toISOString(),
      deletedBy,
      deleteReason,
      status: 'Cancelled',
      updatedAt: new Date().toISOString()
    })
    return !!res
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('agent_runs', id)
  }
}

export class RunResultRepository {
  async getAll(): Promise<RunResult[]> {
    return await dbClient.getAll<RunResult>('run_results')
  }

  async getById(id: string): Promise<RunResult | undefined> {
    return await dbClient.getById<RunResult>('run_results', id)
  }

  async getByRunId(runId: string): Promise<RunResult | undefined> {
    const all = await dbClient.getAll<RunResult>('run_results')
    return all.find((r) => r.runId === runId)
  }

  async getByTaskId(taskId: string): Promise<RunResult[]> {
    const all = await dbClient.getAll<RunResult>('run_results')
    return all.filter((r) => r.taskId === taskId)
  }

  async create(result: Omit<RunResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<RunResult> {
    const newResult: RunResult = {
      ...result,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return await dbClient.insert<RunResult>('run_results', newResult)
  }

  async update(id: string, updates: Partial<RunResult>): Promise<RunResult | undefined> {
    return await dbClient.update<RunResult>('run_results', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }
}

export class ReviewRepository {
  async getAll(): Promise<TaskReview[]> {
    return await dbClient.getAll<TaskReview>('task_reviews')
  }

  async getById(id: string): Promise<TaskReview | undefined> {
    return await dbClient.getById<TaskReview>('task_reviews', id)
  }

  async getByRunId(runId: string): Promise<TaskReview | undefined> {
    const all = await dbClient.getAll<TaskReview>('task_reviews')
    return all.find((r) => r.runId === runId)
  }

  async getByTaskId(taskId: string): Promise<TaskReview[]> {
    const all = await dbClient.getAll<TaskReview>('task_reviews')
    return all.filter((r) => r.taskId === taskId)
  }

  async getPending(): Promise<TaskReview[]> {
    const all = await dbClient.getAll<TaskReview>('task_reviews')
    return all.filter((r) => r.status === 'Pending')
  }

  async create(review: Omit<TaskReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskReview> {
    const newReview: TaskReview = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return await dbClient.insert<TaskReview>('task_reviews', newReview)
  }

  async update(id: string, updates: Partial<TaskReview>): Promise<TaskReview | undefined> {
    return await dbClient.update<TaskReview>('task_reviews', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async submitDecision(id: string, decision: ReviewDecision, comment?: string): Promise<TaskReview | undefined> {
    const updates: Partial<TaskReview> = {
      status: decision,
      decisionAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    if (comment) updates.comment = comment

    const review = await dbClient.update<TaskReview>('task_reviews', id, updates)

    if (review && decision === 'Approved') {
      await dbClient.update<Task>('tasks', review.taskId, {
        status: 'Done',
        progress: 100,
        updatedAt: new Date().toISOString()
      })
    }

    return review
  }
}

export class ScheduleRepository {
  async getAll(includeDeleted = false): Promise<Schedule[]> {
    const all = await dbClient.getAll<Schedule>('schedules')
    return includeDeleted ? all : all.filter((s) => !s.deletedAt)
  }

  async getByWorkspace(workspaceId: string, includeDeleted = false): Promise<Schedule[]> {
    const all = await dbClient.getAll<Schedule>('schedules')
    return all.filter((s) => s.workspaceId === workspaceId && (includeDeleted || !s.deletedAt))
  }

  async getByProject(projectId: string, includeDeleted = false): Promise<Schedule[]> {
    const all = await dbClient.getAll<Schedule>('schedules')
    return all.filter((s) => s.projectId === projectId && (includeDeleted || !s.deletedAt))
  }

  async getById(id: string): Promise<Schedule | undefined> {
    return await dbClient.getById<Schedule>('schedules', id)
  }

  async create(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    const newSchedule: Schedule = {
      ...schedule,
      id: `sch-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    return await dbClient.insert<Schedule>('schedules', newSchedule)
  }

  async update(id: string, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    return await dbClient.update<Schedule>('schedules', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async toggleEnabled(id: string): Promise<Schedule | undefined> {
    const sch = await dbClient.getById<Schedule>('schedules', id)
    if (sch) {
      return await dbClient.update<Schedule>('schedules', id, {
        enabled: !sch.enabled,
        updatedAt: new Date().toISOString()
      })
    }
    return undefined
  }

  async softDelete(id: string, deletedBy = 'Owner', deleteReason = 'Schedule deleted'): Promise<boolean> {
    const res = await dbClient.update<Schedule>('schedules', id, {
      deletedAt: new Date().toISOString(),
      deletedBy,
      deleteReason,
      enabled: false,
      updatedAt: new Date().toISOString()
    })
    return !!res
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('schedules', id)
  }
}

export class MemoryRepository {
  async getAll(): Promise<AgentMemoryItem[]> {
    return await dbClient.getAll<AgentMemoryItem>('memories')
  }

  async getById(id: string): Promise<AgentMemoryItem | undefined> {
    return await dbClient.getById<AgentMemoryItem>('memories', id)
  }

  async getByWorkspace(workspaceId: string): Promise<AgentMemoryItem[]> {
    const all = await dbClient.getAll<AgentMemoryItem>('memories')
    return all.filter((m) => m.workspaceId === workspaceId)
  }

  async getByEmployee(employeeId: string): Promise<AgentMemoryItem[]> {
    const all = await dbClient.getAll<AgentMemoryItem>('memories')
    return all.filter((m) => m.employeeId === employeeId || m.scope === 'global')
  }

  async getByProject(projectId: string): Promise<AgentMemoryItem[]> {
    const all = await dbClient.getAll<AgentMemoryItem>('memories')
    return all.filter((m) => m.projectId === projectId || m.scope === 'global')
  }

  async create(memoryData: Omit<AgentMemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'tier'> & { tier?: MemoryHierarchyTier }): Promise<AgentMemoryItem> {
    const now = new Date().toISOString()
    const inferredTier: MemoryHierarchyTier =
      memoryData.tier ||
      (memoryData.scope === 'global' ? 'WORKSPACE' : memoryData.scope === 'project' ? 'PROJECT' : 'EMPLOYEE')

    const newMemory: AgentMemoryItem = {
      ...memoryData,
      tier: inferredTier,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      accessCount: 0,
      createdAt: now,
      updatedAt: now
    }
    return await dbClient.insert<AgentMemoryItem>('memories', newMemory)
  }

  async update(id: string, updates: Partial<AgentMemoryItem>): Promise<AgentMemoryItem | undefined> {
    return await dbClient.update<AgentMemoryItem>('memories', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('memories', id)
  }

  async recall(query: MemoryRecallQuery): Promise<AgentMemoryItem[]> {
    const all = await dbClient.getAll<AgentMemoryItem>('memories')
    const {
      workspaceId,
      employeeId,
      projectId,
      queryText = '',
      tags = [],
      types,
      limit = 5,
      minConfidence = 0.5
    } = query

    const normalizedQueryTokens = queryText
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2)

    const normalizedTags = tags.map((t) => t.toLowerCase())

    // 1. Filter candidates by workspace and scope
    const candidates = all.filter((m) => {
      if (m.workspaceId !== workspaceId) return false

      if (m.scope === 'project' && projectId && m.projectId !== projectId) return false
      if (m.scope === 'employee' && employeeId && m.employeeId !== employeeId) return false
      if (m.scope === 'project' && !projectId) return false
      if (m.scope === 'employee' && !employeeId) return false

      if (types && types.length > 0 && !types.includes(m.type)) return false
      if (m.confidence < minConfidence) return false

      return true
    })

    // 2. Score relevance
    const scored = candidates.map((m) => {
      let score = (m.importance || 3) * 2 + (m.confidence || 0.8) * 5

      const memoryText = `${m.title} ${m.content}`.toLowerCase()
      const memoryTags = m.tags.map((t) => t.toLowerCase())

      for (const token of normalizedQueryTokens) {
        if (m.title.toLowerCase().includes(token)) score += 4
        else if (memoryText.includes(token)) score += 2
      }

      for (const tag of normalizedTags) {
        if (memoryTags.includes(tag)) score += 3
      }

      if (m.scope === 'employee') score += 3
      if (m.scope === 'project') score += 2

      return { memory: m, score }
    })

    // 3. Sort by score descending and take top N
    scored.sort((a, b) => b.score - a.score)
    const topMemories = scored.slice(0, limit).map((s) => s.memory)

    // 4. Update access tracking
    const now = new Date().toISOString()
    for (const m of topMemories) {
      await dbClient.update<AgentMemoryItem>('memories', m.id, {
        accessCount: (m.accessCount || 0) + 1,
        lastAccessedAt: now
      })
      m.accessCount = (m.accessCount || 0) + 1
      m.lastAccessedAt = now
    }

    return topMemories
  }
}

export class CostLedgerRepository {
  async getAll(): Promise<CostEntry[]> {
    return await dbClient.getAll<CostEntry>('cost_entries')
  }

  async getByWorkspace(workspaceId: string): Promise<CostEntry[]> {
    const all = await this.getAll()
    return all.filter((c) => c.workspaceId === workspaceId)
  }

  async getByProject(projectId: string): Promise<CostEntry[]> {
    const all = await this.getAll()
    return all.filter((c) => c.projectId === projectId)
  }

  async getByRun(runId: string): Promise<CostEntry[]> {
    const all = await this.getAll()
    return all.filter((c) => c.runId === runId)
  }

  async create(entry: Omit<CostEntry, 'id' | 'createdAt' | 'timestamp'>): Promise<CostEntry> {
    const now = new Date().toISOString()
    const newEntry: CostEntry = {
      ...entry,
      id: `cost-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: now,
      timestamp: now
    }
    await dbClient.insert<CostEntry>('cost_entries', newEntry)
    return newEntry
  }
}

export class AuditLogRepository {
  async getAll(): Promise<AuditLogEntry[]> {
    const all = await dbClient.getAll<AuditLogEntry>('audit_logs')
    return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async getByEntity(entity: string, entityId?: string): Promise<AuditLogEntry[]> {
    const all = await this.getAll()
    return all.filter((a) => a.entity === entity && (!entityId || a.entityId === entityId))
  }

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString()
    }
    await dbClient.insert<AuditLogEntry>('audit_logs', newEntry)
    return newEntry
  }
}

export class ContentItemRepository {
  async getAll(projectId?: string): Promise<ContentItem[]> {
    const all = await dbClient.getAll<ContentItem>('content_items')
    if (projectId) return all.filter((c) => c.projectId === projectId)
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async getById(id: string): Promise<ContentItem | undefined> {
    return await dbClient.getById<ContentItem>('content_items', id)
  }

  async create(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ContentItem> {
    const now = new Date().toISOString()
    const newItem: ContentItem = {
      ...item,
      id: `cnt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      version: 1,
      createdAt: now,
      updatedAt: now
    }
    await dbClient.insert<ContentItem>('content_items', newItem)
    return newItem
  }

  async update(id: string, updates: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined
    const updated: ContentItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return await dbClient.update<ContentItem>('content_items', id, updated)
  }

  async approve(id: string, approvedBy: string, version: number): Promise<ContentItem | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined
    return await this.update(id, {
      status: 'Approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
      version: version || existing.version
    })
  }

  async reject(id: string, reason: string): Promise<ContentItem | undefined> {
    return await this.update(id, {
      status: 'Draft',
      rejectionReason: reason
    })
  }

  async schedule(id: string, scheduledAt: string): Promise<ContentItem | undefined> {
    return await this.update(id, {
      status: 'Scheduled',
      scheduledAt
    })
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('content_items', id)
  }
}

export class PublicationRepository {
  async getAll(contentItemId?: string): Promise<Publication[]> {
    const all = await dbClient.getAll<Publication>('publications')
    if (contentItemId) return all.filter((p) => p.contentItemId === contentItemId)
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async getById(id: string): Promise<Publication | undefined> {
    return await dbClient.getById<Publication>('publications', id)
  }

  async getByIdempotencyKey(key: string): Promise<Publication | undefined> {
    const all = await this.getAll()
    return all.find((p) => p.idempotencyKey === key)
  }

  async create(pub: Omit<Publication, 'id' | 'createdAt' | 'updatedAt' | 'attemptCount'>): Promise<Publication> {
    const now = new Date().toISOString()
    const newPub: Publication = {
      ...pub,
      id: `pub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      attemptCount: 0,
      createdAt: now,
      updatedAt: now
    }
    await dbClient.insert<Publication>('publications', newPub)
    return newPub
  }

  async updateStatus(
    id: string,
    status: Publication['status'],
    extras?: { externalId?: string; externalUrl?: string; error?: string; parentRunId?: string }
  ): Promise<Publication | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined
    const updated: Publication = {
      ...existing,
      status,
      ...extras,
      attemptCount: (existing.attemptCount || 0) + 1,
      publishedAt: status === 'Published' || status === 'Assisted' ? new Date().toISOString() : existing.publishedAt,
      updatedAt: new Date().toISOString()
    }
    return await dbClient.update<Publication>('publications', id, updated)
  }
}

export class SocialConnectionRepository {
  async getAll(): Promise<SocialConnection[]> {
    return await dbClient.getAll<SocialConnection>('social_connections')
  }

  async getById(id: string): Promise<SocialConnection | undefined> {
    return await dbClient.getById<SocialConnection>('social_connections', id)
  }

  async getByPlatform(platform: string): Promise<SocialConnection[]> {
    const all = await this.getAll()
    return all.filter((c) => c.platform === platform)
  }

  async create(conn: Omit<SocialConnection, 'id' | 'connectedAt' | 'updatedAt'>): Promise<SocialConnection> {
    const now = new Date().toISOString()
    const newConn: SocialConnection = {
      ...conn,
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      connectedAt: now,
      updatedAt: now
    }
    await dbClient.insert<SocialConnection>('social_connections', newConn)
    return newConn
  }

  async update(id: string, updates: Partial<SocialConnection>): Promise<SocialConnection | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined
    const updated: SocialConnection = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return await dbClient.update<SocialConnection>('social_connections', id, updated)
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('social_connections', id)
  }
}

export class MediaAssetRepository {
  async getAll(projectId?: string): Promise<MediaAsset[]> {
    const all = await dbClient.getAll<MediaAsset>('media_assets')
    if (projectId) return all.filter((m) => m.projectId === projectId)
    return all
  }

  async getById(id: string): Promise<MediaAsset | undefined> {
    return await dbClient.getById<MediaAsset>('media_assets', id)
  }

  async create(asset: Omit<MediaAsset, 'id' | 'createdAt'>): Promise<MediaAsset> {
    const newAsset: MediaAsset = {
      ...asset,
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    }
    await dbClient.insert<MediaAsset>('media_assets', newAsset)
    return newAsset
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('media_assets', id)
  }
}

export class DataReviewRepository {
  async getAll(projectId?: string): Promise<DataReview[]> {
    const all = await dbClient.getAll<DataReview>('data_reviews')
    if (projectId) return all.filter((d) => d.projectId === projectId)
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async getById(id: string): Promise<DataReview | undefined> {
    return await dbClient.getById<DataReview>('data_reviews', id)
  }

  async create(data: Omit<DataReview, 'id' | 'createdAt'>): Promise<DataReview> {
    const newReview: DataReview = {
      ...data,
      id: `drev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    }
    await dbClient.insert<DataReview>('data_reviews', newReview)
    return newReview
  }

  async update(id: string, updates: Partial<DataReview>): Promise<DataReview | undefined> {
    const existing = await this.getById(id)
    if (!existing) return undefined
    const updated: DataReview = {
      ...existing,
      ...updates
    }
    return await dbClient.update<DataReview>('data_reviews', id, updated)
  }
}

export class WorkflowTemplateRepository {
  async getAll(): Promise<WorkflowTemplate[]> {
    return await dbClient.getAll<WorkflowTemplate>('workflow_templates')
  }

  async getById(id: string): Promise<WorkflowTemplate | undefined> {
    return await dbClient.getById<WorkflowTemplate>('workflow_templates', id)
  }
}

// ==========================================
// INTEGRATION REPOSITORIES
// ==========================================
export class IntegrationConnectionRepository {
  async getAll(): Promise<IntegrationConnection[]> {
    return await dbClient.getAll<IntegrationConnection>('integration_connections')
  }

  async getById(id: string): Promise<IntegrationConnection | undefined> {
    return await dbClient.getById<IntegrationConnection>('integration_connections', id)
  }

  async getByProvider(providerId: string): Promise<IntegrationConnection[]> {
    const all = await this.getAll()
    return all.filter((c) => c.providerId === providerId)
  }

  async create(data: Omit<IntegrationConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConnection> {
    const newConn: IntegrationConnection = {
      ...data,
      id: `conn-${data.providerId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await dbClient.insert<IntegrationConnection>('integration_connections', newConn)
    return newConn
  }

  async update(id: string, updates: Partial<IntegrationConnection>): Promise<IntegrationConnection | undefined> {
    return await dbClient.update<IntegrationConnection>('integration_connections', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('integration_connections', id)
  }
}

export class ToolPermissionRepository {
  async getAll(): Promise<ToolPermission[]> {
    return await dbClient.getAll<ToolPermission>('tool_permissions')
  }

  async getByAgent(agentId: string): Promise<ToolPermission[]> {
    const all = await this.getAll()
    return all.filter((p) => p.agentId === agentId || p.agentId === '*')
  }

  async create(data: Omit<ToolPermission, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToolPermission> {
    const perm: ToolPermission = {
      ...data,
      id: `tp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await dbClient.insert<ToolPermission>('tool_permissions', perm)
    return perm
  }

  async update(id: string, updates: Partial<ToolPermission>): Promise<ToolPermission | undefined> {
    return await dbClient.update<ToolPermission>('tool_permissions', id, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  async delete(id: string): Promise<boolean> {
    return await dbClient.delete('tool_permissions', id)
  }
}

export class ToolExecutionRepository {
  async getAll(): Promise<ToolExecution[]> {
    return await dbClient.getAll<ToolExecution>('tool_executions')
  }

  async getByRunId(runId: string): Promise<ToolExecution[]> {
    const all = await this.getAll()
    return all.filter((e) => e.runId === runId)
  }

  async create(data: Omit<ToolExecution, 'id'>): Promise<ToolExecution> {
    const exec: ToolExecution = {
      ...data,
      id: `exec-${Date.now()}`
    }
    await dbClient.insert<ToolExecution>('tool_executions', exec)
    return exec
  }

  async update(id: string, updates: Partial<ToolExecution>): Promise<ToolExecution | undefined> {
    return await dbClient.update<ToolExecution>('tool_executions', id, updates)
  }
}

export class IntegrationApprovalRepository {
  async getAll(): Promise<IntegrationApprovalRequest[]> {
    return await dbClient.getAll<IntegrationApprovalRequest>('integration_approvals')
  }

  async getPending(): Promise<IntegrationApprovalRequest[]> {
    const all = await this.getAll()
    return all.filter((a) => a.status === 'PENDING')
  }

  async getById(id: string): Promise<IntegrationApprovalRequest | undefined> {
    return await dbClient.getById<IntegrationApprovalRequest>('integration_approvals', id)
  }

  async create(data: Omit<IntegrationApprovalRequest, 'id' | 'createdAt'>): Promise<IntegrationApprovalRequest> {
    const appr: IntegrationApprovalRequest = {
      ...data,
      id: `appr-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    await dbClient.insert<IntegrationApprovalRequest>('integration_approvals', appr)
    return appr
  }

  async resolve(id: string, status: 'APPROVED' | 'REJECTED', resolvedBy = 'Owner'): Promise<IntegrationApprovalRequest | undefined> {
    return await dbClient.update<IntegrationApprovalRequest>('integration_approvals', id, {
      status,
      resolvedAt: new Date().toISOString(),
      resolvedBy
    })
  }
}

export class IntegrationAuditRepository {
  async getAll(): Promise<IntegrationAuditEvent[]> {
    return await dbClient.getAll<IntegrationAuditEvent>('integration_audit_events')
  }

  async create(data: Omit<IntegrationAuditEvent, 'id' | 'timestamp'>): Promise<IntegrationAuditEvent> {
    const event: IntegrationAuditEvent = {
      ...data,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString()
    }
    await dbClient.insert<IntegrationAuditEvent>('integration_audit_events', event)
    return event
  }
}

// Backwards compatibility aliases
export {
  WorkspaceRepository as MockWorkspaceRepository,
  ProjectRepository as MockProjectRepository,
  TaskRepository as MockTaskRepository,
  FileRepository as MockFileRepository,
  ActivityRepository as MockActivityRepository,
  NotificationRepository as MockNotificationRepository,
  UserRepository as MockUserRepository,
  DepartmentRepository as MockDepartmentRepository,
  EmployeeRoleRepository as MockEmployeeRoleRepository,
  SkillRepository as MockSkillRepository,
  WorkforceToolRepository as MockWorkforceToolRepository,
  EmployeeRepository as MockEmployeeRepository,
  AssignmentRepository as MockAssignmentRepository,
  AgentRunRepository as MockAgentRunRepository,
  RunResultRepository as MockRunResultRepository,
  ReviewRepository as MockReviewRepository,
  ScheduleRepository as MockScheduleRepository,
  MemoryRepository as MockMemoryRepository,
  CostLedgerRepository as MockCostLedgerRepository,
  AuditLogRepository as MockAuditLogRepository,
  ContentItemRepository as MockContentItemRepository,
  PublicationRepository as MockPublicationRepository,
  SocialConnectionRepository as MockSocialConnectionRepository,
  MediaAssetRepository as MockMediaAssetRepository,
  DataReviewRepository as MockDataReviewRepository,
  WorkflowTemplateRepository as MockWorkflowTemplateRepository,
  IntegrationConnectionRepository as MockIntegrationConnectionRepository,
  ToolPermissionRepository as MockToolPermissionRepository,
  ToolExecutionRepository as MockToolExecutionRepository,
  IntegrationApprovalRepository as MockIntegrationApprovalRepository,
  IntegrationAuditRepository as MockIntegrationAuditRepository
}
