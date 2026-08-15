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
  ReviewDecision
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
  async getAll(): Promise<Project[]> {
    return await dbClient.getAll<Project>('projects')
  }

  async getByWorkspace(workspaceId: string): Promise<Project[]> {
    const all = await dbClient.getAll<Project>('projects')
    return all.filter((p) => p.workspaceId === workspaceId)
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
}

export class TaskRepository {
  async getAll(): Promise<Task[]> {
    return await dbClient.getAll<Task>('tasks')
  }

  async getByWorkspace(workspaceId: string): Promise<Task[]> {
    const all = await dbClient.getAll<Task>('tasks')
    return all.filter((t) => t.workspaceId === workspaceId)
  }

  async getByProject(projectId: string): Promise<Task[]> {
    const all = await dbClient.getAll<Task>('tasks')
    return all.filter((t) => t.projectId === projectId)
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
  async getAll(): Promise<AgentRun[]> {
    return await dbClient.getAll<AgentRun>('agent_runs')
  }

  async getById(id: string): Promise<AgentRun | undefined> {
    return await dbClient.getById<AgentRun>('agent_runs', id)
  }

  async getByAssignmentId(assignmentId: string): Promise<AgentRun[]> {
    const all = await dbClient.getAll<AgentRun>('agent_runs')
    return all.filter((r) => r.assignmentId === assignmentId)
  }

  async getByTaskId(taskId: string): Promise<AgentRun[]> {
    const all = await dbClient.getAll<AgentRun>('agent_runs')
    return all.filter((r) => r.taskId === taskId)
  }

  async getByEmployeeId(employeeId: string): Promise<AgentRun[]> {
    const all = await dbClient.getAll<AgentRun>('agent_runs')
    return all.filter((r) => r.employeeId === employeeId)
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
  ReviewRepository as MockReviewRepository
}
