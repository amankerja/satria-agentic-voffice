import {
  mockWorkspaces,
  mockProjects,
  mockTasks,
  mockFiles,
  mockActivityLogs,
  mockNotifications,
  mockUser,
  mockDepartments,
  mockEmployeeRoles,
  mockSkills,
  mockWorkforceTools,
  mockEmployees,
  mockAssignments,
  mockAgentRuns,
  mockRunResults,
  mockTaskReviews
} from '../mocks/mockData'
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


export class MockWorkspaceRepository {
  async getAll(): Promise<Workspace[]> {
    return [...mockWorkspaces]
  }

  async getById(id: string): Promise<Workspace | undefined> {
    return mockWorkspaces.find((w) => w.id === id)
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
    mockWorkspaces.push(newWs)
    return newWs
  }
}

export class MockProjectRepository {
  async getByWorkspace(workspaceId: string): Promise<Project[]> {
    return mockProjects.filter((p) => p.workspaceId === workspaceId)
  }

  async getById(id: string): Promise<Project | undefined> {
    return mockProjects.find((p) => p.id === id)
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
    mockProjects.push(newPrj)
    return newPrj
  }
}

export class MockTaskRepository {
  async getAll(): Promise<Task[]> {
    return [...mockTasks]
  }

  async getByWorkspace(workspaceId: string): Promise<Task[]> {
    return mockTasks.filter((t) => t.workspaceId === workspaceId)
  }

  async getByProject(projectId: string): Promise<Task[]> {
    return mockTasks.filter((t) => t.projectId === projectId)
  }

  async getById(id: string): Promise<Task | undefined> {
    return mockTasks.find((t) => t.id === id)
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | undefined> {
    const task = mockTasks.find((t) => t.id === id)
    if (task) {
      task.status = status
      task.updatedAt = new Date().toISOString()
    }
    return task
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
    mockTasks.unshift(newTask)
    return newTask
  }

  async delete(id: string): Promise<boolean> {
    const index = mockTasks.findIndex((t) => t.id === id)
    if (index !== -1) {
      mockTasks.splice(index, 1)
      return true
    }
    return false
  }
}

export class MockFileRepository {
  async getAll(): Promise<WorkspaceFile[]> {
    return [...mockFiles]
  }

  async getByWorkspace(workspaceId: string): Promise<WorkspaceFile[]> {
    return mockFiles.filter((f) => f.workspaceId === workspaceId)
  }

  async getById(id: string): Promise<WorkspaceFile | undefined> {
    return mockFiles.find((f) => f.id === id)
  }

  async upload(fileData: Omit<WorkspaceFile, 'id' | 'updatedAt'>): Promise<WorkspaceFile> {
    const newFile: WorkspaceFile = {
      ...fileData,
      id: `fl-${Date.now()}`,
      updatedAt: 'Just now'
    }
    mockFiles.unshift(newFile)
    return newFile
  }

  async delete(id: string): Promise<boolean> {
    const index = mockFiles.findIndex((f) => f.id === id)
    if (index !== -1) {
      mockFiles.splice(index, 1)
      return true
    }
    return false
  }
}

export class MockActivityRepository {
  async getAll(): Promise<ActivityLog[]> {
    return [...mockActivityLogs]
  }

  async getByWorkspace(workspaceId: string): Promise<ActivityLog[]> {
    return mockActivityLogs.filter((a) => a.workspaceId === workspaceId)
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
    mockActivityLogs.unshift(newLog)
    return newLog
  }
}

export class MockNotificationRepository {
  async getAll(): Promise<NotificationItem[]> {
    return [...mockNotifications]
  }

  async getByWorkspace(workspaceId: string): Promise<NotificationItem[]> {
    return mockNotifications.filter((n) => n.workspaceId === workspaceId)
  }

  async create(notifData: Omit<NotificationItem, 'id' | 'timeAgo' | 'read'> & { read?: boolean }): Promise<NotificationItem> {
    const newNotif: NotificationItem = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: notifData.read ?? false,
      timeAgo: 'Just now',
      createdAt: new Date().toISOString()
    }
    mockNotifications.unshift(newNotif)
    return newNotif
  }

  async markAsRead(id: string): Promise<boolean> {
    const notif = mockNotifications.find((n) => n.id === id)
    if (notif) {
      notif.read = true
      return true
    }
    return false
  }

  async markAllAsRead(workspaceId?: string): Promise<void> {
    mockNotifications.forEach((n) => {
      if (!workspaceId || n.workspaceId === workspaceId) {
        n.read = true
      }
    })
  }

  async delete(id: string): Promise<boolean> {
    const index = mockNotifications.findIndex((n) => n.id === id)
    if (index !== -1) {
      mockNotifications.splice(index, 1)
      return true
    }
    return false
  }
}

export class MockUserRepository {
  async getUser(): Promise<UserProfile> {
    return { ...mockUser }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    Object.assign(mockUser, updates)
    return { ...mockUser }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    if (mockUser.settings) {
      Object.assign(mockUser.settings, settings)
      return { ...mockUser.settings }
    }
    return {} as UserSettings
  }
}

// ============================================================================
// PHASE 1 — WORKFORCE REPOSITORIES
// ============================================================================

export class MockDepartmentRepository {
  async getAll(): Promise<Department[]> {
    return [...mockDepartments]
  }

  async getById(id: string): Promise<Department | undefined> {
    return mockDepartments.find((d) => d.id === id)
  }

  async getByCode(code: string): Promise<Department | undefined> {
    return mockDepartments.find((d) => d.code.toUpperCase() === code.toUpperCase())
  }
}

export class MockEmployeeRoleRepository {
  async getAll(): Promise<EmployeeRole[]> {
    return [...mockEmployeeRoles]
  }

  async getByDepartment(departmentId: string): Promise<EmployeeRole[]> {
    return mockEmployeeRoles.filter((r) => r.departmentId === departmentId)
  }

  async getById(id: string): Promise<EmployeeRole | undefined> {
    return mockEmployeeRoles.find((r) => r.id === id)
  }
}

export class MockSkillRepository {
  async getAll(): Promise<Skill[]> {
    return [...mockSkills]
  }

  async getById(id: string): Promise<Skill | undefined> {
    return mockSkills.find((s) => s.id === id)
  }

  async getByCategory(category: string): Promise<Skill[]> {
    return mockSkills.filter((s) => s.category.toLowerCase() === category.toLowerCase())
  }

  async getBySourceType(sourceType: 'internal' | 'external'): Promise<Skill[]> {
    return mockSkills.filter((s) => s.sourceType === sourceType)
  }

  async create(skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> {
    const newSkill: Skill = {
      ...skill,
      id: `skill-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockSkills.push(newSkill)
    return newSkill
  }

  async update(id: string, updates: Partial<Skill>): Promise<Skill | undefined> {
    const skill = mockSkills.find((s) => s.id === id)
    if (skill) {
      Object.assign(skill, updates, { updatedAt: new Date().toISOString() })
    }
    return skill
  }
}

export class MockWorkforceToolRepository {
  async getAll(): Promise<WorkforceTool[]> {
    return [...mockWorkforceTools]
  }

  async getById(id: string): Promise<WorkforceTool | undefined> {
    return mockWorkforceTools.find((t) => t.id === id)
  }

  async getByCategory(category: string): Promise<WorkforceTool[]> {
    return mockWorkforceTools.filter((t) => t.category.toLowerCase() === category.toLowerCase())
  }

  async create(tool: Omit<WorkforceTool, 'id'>): Promise<WorkforceTool> {
    const newTool: WorkforceTool = {
      ...tool,
      id: `tool-${Date.now()}`
    }
    mockWorkforceTools.push(newTool)
    return newTool
  }
}

export class MockEmployeeRepository {
  async getAll(): Promise<Employee[]> {
    return [...mockEmployees]
  }

  async getById(id: string): Promise<Employee | undefined> {
    return mockEmployees.find((e) => e.id === id)
  }

  async getByDepartment(departmentId: string): Promise<Employee[]> {
    return mockEmployees.filter((e) => e.departmentId === departmentId)
  }

  async create(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockEmployees.push(newEmployee)

    // Update department count
    const dept = mockDepartments.find((d) => d.id === employee.departmentId)
    if (dept) {
      dept.employeeCount = mockEmployees.filter((e) => e.departmentId === dept.id && e.status !== 'Archived').length
    }

    return newEmployee
  }

  async update(id: string, updates: Partial<Employee>): Promise<Employee | undefined> {
    const employee = mockEmployees.find((e) => e.id === id)
    if (employee) {
      Object.assign(employee, updates, { updatedAt: new Date().toISOString() })
      
      // Update department count if department changed
      if (updates.departmentId) {
        mockDepartments.forEach((d) => {
          d.employeeCount = mockEmployees.filter((e) => e.departmentId === d.id && e.status !== 'Archived').length
        })
      }
    }
    return employee
  }

  async updateStatus(id: string, status: EmploymentStatus): Promise<Employee | undefined> {
    const employee = mockEmployees.find((e) => e.id === id)
    if (employee) {
      employee.status = status
      employee.updatedAt = new Date().toISOString()

      // Update department count
      const dept = mockDepartments.find((d) => d.id === employee.departmentId)
      if (dept) {
        dept.employeeCount = mockEmployees.filter((e) => e.departmentId === dept.id && e.status !== 'Archived').length
      }
    }
    return employee
  }

  async assignSkill(employeeId: string, assignment: EmployeeSkillAssignment): Promise<Employee | undefined> {
    const employee = mockEmployees.find((e) => e.id === employeeId)
    if (employee) {
      const existingIdx = employee.skills.findIndex((s) => s.skillId === assignment.skillId)
      if (existingIdx >= 0) {
        employee.skills[existingIdx] = assignment
      } else {
        employee.skills.push(assignment)
      }
      employee.updatedAt = new Date().toISOString()
    }
    return employee
  }

  async removeSkill(employeeId: string, skillId: string): Promise<Employee | undefined> {
    const employee = mockEmployees.find((e) => e.id === employeeId)
    if (employee) {
      employee.skills = employee.skills.filter((s) => s.skillId !== skillId)
      employee.updatedAt = new Date().toISOString()
    }
    return employee
  }

  async archive(id: string): Promise<Employee | undefined> {
    return this.updateStatus(id, 'Archived')
  }
}

// ==========================================
// PHASE 2: REPOSITORIES
// ==========================================

export class MockAssignmentRepository {
  async getAll(): Promise<TaskAssignment[]> {
    return [...mockAssignments]
  }

  async getById(id: string): Promise<TaskAssignment | undefined> {
    return mockAssignments.find((a) => a.id === id)
  }

  async getByTaskId(taskId: string): Promise<TaskAssignment[]> {
    return mockAssignments.filter((a) => a.taskId === taskId)
  }

  async getByEmployeeId(employeeId: string): Promise<TaskAssignment[]> {
    return mockAssignments.filter((a) => a.employeeId === employeeId)
  }

  async create(assignment: Omit<TaskAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskAssignment> {
    const newAssignment: TaskAssignment = {
      ...assignment,
      id: `asg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockAssignments.unshift(newAssignment)

    // Update corresponding task assignee if exists
    const task = mockTasks.find((t) => t.id === assignment.taskId)
    if (task) {
      task.assigneeId = assignment.employeeId
      task.assigneeName = assignment.employeeName
      task.assigneeAvatar = assignment.employeeAvatar
      task.activeAssignmentId = newAssignment.id
      task.updatedAt = new Date().toISOString()
    }

    return newAssignment
  }

  async update(id: string, updates: Partial<TaskAssignment>): Promise<TaskAssignment | undefined> {
    const assignment = mockAssignments.find((a) => a.id === id)
    if (assignment) {
      Object.assign(assignment, updates, { updatedAt: new Date().toISOString() })
    }
    return assignment
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<TaskAssignment | undefined> {
    const assignment = mockAssignments.find((a) => a.id === id)
    if (assignment) {
      assignment.status = status
      assignment.updatedAt = new Date().toISOString()
      if (status === 'Completed') {
        assignment.completedAt = new Date().toISOString()
      } else if (status === 'In Progress' && !assignment.startedAt) {
        assignment.startedAt = new Date().toISOString()
      }
    }
    return assignment
  }

  async cancel(id: string): Promise<TaskAssignment | undefined> {
    return this.updateStatus(id, 'Cancelled')
  }
}

export class MockAgentRunRepository {
  async getAll(): Promise<AgentRun[]> {
    return [...mockAgentRuns]
  }

  async getById(id: string): Promise<AgentRun | undefined> {
    return mockAgentRuns.find((r) => r.id === id)
  }

  async getByAssignmentId(assignmentId: string): Promise<AgentRun[]> {
    return mockAgentRuns.filter((r) => r.assignmentId === assignmentId)
  }

  async getByTaskId(taskId: string): Promise<AgentRun[]> {
    return mockAgentRuns.filter((r) => r.taskId === taskId)
  }

  async getByEmployeeId(employeeId: string): Promise<AgentRun[]> {
    return mockAgentRuns.filter((r) => r.employeeId === employeeId)
  }

  async create(run: Omit<AgentRun, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentRun> {
    const newRun: AgentRun = {
      ...run,
      id: `run-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockAgentRuns.unshift(newRun)

    // Update active run on task
    const task = mockTasks.find((t) => t.id === run.taskId)
    if (task) {
      task.activeRunId = newRun.id
      task.updatedAt = new Date().toISOString()
    }

    return newRun
  }

  async update(id: string, updates: Partial<AgentRun>): Promise<AgentRun | undefined> {
    const run = mockAgentRuns.find((r) => r.id === id)
    if (run) {
      Object.assign(run, updates, { updatedAt: new Date().toISOString() })
    }
    return run
  }

  async addLog(id: string, log: Omit<RunLogEntry, 'id'>): Promise<AgentRun | undefined> {
    const run = mockAgentRuns.find((r) => r.id === id)
    if (run) {
      const logEntry: RunLogEntry = {
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      }
      run.logs.push(logEntry)
      run.updatedAt = new Date().toISOString()
    }
    return run
  }

  async updateProgress(id: string, progress: number, step: RunStep, status?: AgentRunStatus): Promise<AgentRun | undefined> {
    const run = mockAgentRuns.find((r) => r.id === id)
    if (run) {
      run.progress = progress
      run.currentStep = step
      if (status) run.status = status
      run.updatedAt = new Date().toISOString()
      if (status === 'Completed') {
        run.completedAt = new Date().toISOString()
      }
    }
    return run
  }
}

export class MockRunResultRepository {
  async getAll(): Promise<RunResult[]> {
    return [...mockRunResults]
  }

  async getById(id: string): Promise<RunResult | undefined> {
    return mockRunResults.find((r) => r.id === id)
  }

  async getByRunId(runId: string): Promise<RunResult | undefined> {
    return mockRunResults.find((r) => r.runId === runId)
  }

  async getByTaskId(taskId: string): Promise<RunResult[]> {
    return mockRunResults.filter((r) => r.taskId === taskId)
  }

  async create(result: Omit<RunResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<RunResult> {
    const newResult: RunResult = {
      ...result,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockRunResults.unshift(newResult)
    return newResult
  }

  async update(id: string, updates: Partial<RunResult>): Promise<RunResult | undefined> {
    const result = mockRunResults.find((r) => r.id === id)
    if (result) {
      Object.assign(result, updates, { updatedAt: new Date().toISOString() })
    }
    return result
  }
}

export class MockReviewRepository {
  async getAll(): Promise<TaskReview[]> {
    return [...mockTaskReviews]
  }

  async getById(id: string): Promise<TaskReview | undefined> {
    return mockTaskReviews.find((r) => r.id === id)
  }

  async getByRunId(runId: string): Promise<TaskReview | undefined> {
    return mockTaskReviews.find((r) => r.runId === runId)
  }

  async getByTaskId(taskId: string): Promise<TaskReview[]> {
    return mockTaskReviews.filter((r) => r.taskId === taskId)
  }

  async getPending(): Promise<TaskReview[]> {
    return mockTaskReviews.filter((r) => r.status === 'Pending')
  }

  async create(review: Omit<TaskReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskReview> {
    const newReview: TaskReview = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockTaskReviews.unshift(newReview)
    return newReview
  }

  async update(id: string, updates: Partial<TaskReview>): Promise<TaskReview | undefined> {
    const review = mockTaskReviews.find((r) => r.id === id)
    if (review) {
      Object.assign(review, updates, { updatedAt: new Date().toISOString() })
    }
    return review
  }

  async submitDecision(id: string, decision: ReviewDecision, comment?: string): Promise<TaskReview | undefined> {
    const review = mockTaskReviews.find((r) => r.id === id)
    if (review) {
      review.status = decision
      if (comment) review.comment = comment
      review.decisionAt = new Date().toISOString()
      review.updatedAt = new Date().toISOString()

      // If approved, update Task to Completed / Done
      if (decision === 'Approved') {
        const task = mockTasks.find((t) => t.id === review.taskId)
        if (task) {
          task.status = 'Done'
          task.progress = 100
          task.updatedAt = new Date().toISOString()
        }
      }
    }
    return review
  }
}


