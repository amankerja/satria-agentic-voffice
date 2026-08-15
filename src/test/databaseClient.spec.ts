import { describe, it, expect, beforeEach } from 'vitest'
import { dbClient } from '../database/DatabaseClient'
import {
  TaskRepository,
  EmployeeRepository,
  DepartmentRepository
} from '../repositories'

describe('Real Persistent Database Layer (DatabaseClient & Repositories)', () => {
  beforeEach(async () => {
    await dbClient.resetToDefaults()
  })

  it('initializes with exactly 12 digital employees from the clean seeder', async () => {
    const empRepo = new EmployeeRepository()
    const employees = await empRepo.getAll()

    expect(employees.length).toBe(12)
    expect(employees.map((e) => e.name)).toContain('Maya')
    expect(employees.map((e) => e.name)).toContain('Dimas')
    expect(employees.map((e) => e.name)).toContain('Raka')
    expect(employees.map((e) => e.name)).toContain('Bima')
    expect(employees.map((e) => e.name)).toContain('Ardi')
    expect(employees.map((e) => e.name)).toContain('Rina')
    expect(employees.map((e) => e.name)).toContain('Dani')
    expect(employees.map((e) => e.name)).toContain('Sari')
    expect(employees.map((e) => e.name)).toContain('Citra')
    expect(employees.map((e) => e.name)).toContain('Faisal')
    expect(employees.map((e) => e.name)).toContain('Tari')
    expect(employees.map((e) => e.name)).toContain('Bagas')
  })

  it('initializes with exactly 1 starter task per employee / project', async () => {
    const taskRepo = new TaskRepository()
    const tasks = await taskRepo.getAll()

    expect(tasks.length).toBe(12)
    const mayaTask = tasks.find((t) => t.assigneeId === 'emp-maya')
    expect(mayaTask).toBeDefined()
    expect(mayaTask?.title).toBe('Design and implement responsive task matrix layout')

    const bimaTask = tasks.find((t) => t.assigneeId === 'emp-bima')
    expect(bimaTask).toBeDefined()
    expect(bimaTask?.title).toBe('Implement REST API schema validation and database query optimization')
  })

  it('inserts and persists real user-created tasks into database', async () => {
    const taskRepo = new TaskRepository()

    const created = await taskRepo.create({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'SATRIA AI Workforce UI',
      title: 'Real Database Integration Test Task',
      description: 'Verifying real persistent database insert',
      status: 'In Progress',
      priority: 'Urgent',
      assigneeName: 'Alex',
      dueDate: '2026-08-28',
      tags: ['Database', 'RealData']
    })

    expect(created.id).toMatch(/^tsk-/)
    expect(created.title).toBe('Real Database Integration Test Task')

    // Query back from DB
    const fetched = await taskRepo.getById(created.id)
    expect(fetched).toBeDefined()
    expect(fetched?.title).toBe('Real Database Integration Test Task')

    const allTasks = await taskRepo.getAll()
    expect(allTasks.length).toBe(13)
  })

  it('updates task status in database', async () => {
    const taskRepo = new TaskRepository()
    const tasks = await taskRepo.getAll()
    const targetTask = tasks[0]

    const updated = await taskRepo.updateStatus(targetTask.id, 'Done')
    expect(updated?.status).toBe('Done')

    const reFetched = await taskRepo.getById(targetTask.id)
    expect(reFetched?.status).toBe('Done')
  })

  it('deletes task from database', async () => {
    const taskRepo = new TaskRepository()
    const tasks = await taskRepo.getAll()
    const targetTask = tasks[0]

    const deleted = await taskRepo.delete(targetTask.id)
    expect(deleted).toBe(true)

    const reFetched = await taskRepo.getById(targetTask.id)
    expect(reFetched).toBeUndefined()

    const remaining = await taskRepo.getAll()
    expect(remaining.length).toBe(11)
  })

  it('manages digital employees and department counts in database', async () => {
    const empRepo = new EmployeeRepository()
    const deptRepo = new DepartmentRepository()

    const newEmp = await empRepo.create({
      name: 'Zara AI Specialist',
      avatar: 'https://example.com/zara.png',
      departmentId: 'dept-coding',
      departmentName: 'Coding',
      roleId: 'role-uiux',
      roleName: 'UI/UX Frontend',
      description: 'New AI Frontend Specialist',
      status: 'Active',
      skills: [],
      toolIds: ['tool-browser'],
      permissions: ['ui:read', 'ui:write']
    })

    expect(newEmp.id).toMatch(/^emp-/)
    const codingDept = await deptRepo.getById('dept-coding')
    expect(codingDept?.employeeCount).toBe(6)
  })
})
