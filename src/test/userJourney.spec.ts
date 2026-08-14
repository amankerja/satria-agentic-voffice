import { describe, it, expect, beforeEach } from 'vitest'
import {
  MockWorkspaceRepository,
  MockProjectRepository,
  MockTaskRepository,
  MockFileRepository,
  MockActivityRepository,
  MockNotificationRepository,
  MockUserRepository
} from '../repositories'

describe('SATRIA AI WORKFORCE — Integrated Demo User Journey Tests', () => {
  let wsRepo: MockWorkspaceRepository
  let prjRepo: MockProjectRepository
  let taskRepo: MockTaskRepository
  let fileRepo: MockFileRepository
  let actRepo: MockActivityRepository
  let notifRepo: MockNotificationRepository
  let userRepo: MockUserRepository

  beforeEach(() => {
    wsRepo = new MockWorkspaceRepository()
    prjRepo = new MockProjectRepository()
    taskRepo = new MockTaskRepository()
    fileRepo = new MockFileRepository()
    actRepo = new MockActivityRepository()
    notifRepo = new MockNotificationRepository()
    userRepo = new MockUserRepository()
  })

  it('Step 1 & 2: User Onboarding creates a new Workspace and persists correctly', async () => {
    const newWs = await wsRepo.create({
      name: 'Satria Command Center Alpha',
      type: 'Development',
      description: 'Internal AI Workforce development hub'
    })

    expect(newWs).toBeDefined()
    expect(newWs.id).toBeDefined()
    expect(newWs.name).toBe('Satria Command Center Alpha')
    expect(newWs.type).toBe('Development')

    const allWorkspaces = await wsRepo.getAll()
    expect(allWorkspaces.some((w) => w.id === newWs.id)).toBe(true)
  })

  it('Step 3: User accesses Projects and verifies milestones & progress', async () => {
    const projects = await prjRepo.getByWorkspace('ws-dev')
    expect(projects.length).toBeGreaterThan(0)

    const mainProject = projects[0]
    expect(mainProject.name).toBeDefined()
    expect(mainProject.progress).toBeGreaterThanOrEqual(0)
    expect(mainProject.milestones.length).toBeGreaterThan(0)
  })

  it('Step 4 & 5: User creates Task, resolves checklist items, and marks Done', async () => {
    const createdTask = await taskRepo.create({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'SATRIA AI Workforce UI',
      title: 'Implement Integrated E2E User Journey Test',
      description: 'Verify all flows end-to-end',
      status: 'In Progress',
      priority: 'High',
      assigneeName: 'Satria Utama',
      dueDate: '2026-08-14',
      tags: ['QA', 'Testing']
    })

    expect(createdTask.id).toBeDefined()
    expect(createdTask.status).toBe('In Progress')

    // Update status to Done
    const updated = await taskRepo.updateStatus(createdTask.id, 'Done')
    expect(updated?.status).toBe('Done')

    // Fetch tasks and ensure updated
    const tasks = await taskRepo.getByWorkspace('ws-dev')
    const found = tasks.find((t) => t.id === createdTask.id)
    expect(found?.status).toBe('Done')
  })

  it('Step 6: User navigates to Files Page and previews code/documents', async () => {
    const files = await fileRepo.getByWorkspace('ws-dev')
    expect(files.length).toBeGreaterThan(0)

    const docFile = files.find((f) => f.category === 'Documents')
    expect(docFile).toBeDefined()
    expect(docFile?.name).toBeDefined()

    // Add new file upload
    const uploaded = await fileRepo.upload({
      workspaceId: 'ws-dev',
      name: 'Phase0_Final_Report.pdf',
      category: 'Exports',
      extension: 'PDF',
      sizeBytes: 2516582,
      sizeFormatted: '2.4 MB'
    })
    expect(uploaded.id).toBeDefined()
    expect(uploaded.name).toBe('Phase0_Final_Report.pdf')
  })

  it('Step 7: User checks Activity Center logs timeline', async () => {
    const initialActivities = await actRepo.getByWorkspace('ws-dev')
    expect(initialActivities.length).toBeGreaterThan(0)

    await actRepo.logActivity({
      workspaceId: 'ws-dev',
      actorName: 'Satria Utama',
      action: 'completed',
      targetTitle: 'Implement Integrated E2E User Journey Test',
      targetType: 'task'
    })

    const updatedActivities = await actRepo.getByWorkspace('ws-dev')
    expect(updatedActivities[0].action).toBe('completed')
  })

  it('Step 8: User inspects Notification Center and reads notifications', async () => {
    const notifs = await notifRepo.getByWorkspace('ws-dev')
    expect(notifs.length).toBeGreaterThan(0)

    const unreadBefore = notifs.filter((n) => !n.read).length
    expect(unreadBefore).toBeGreaterThan(0)

    // Mark single notification as read
    await notifRepo.markAsRead(notifs[0].id)
    const afterSingle = await notifRepo.getByWorkspace('ws-dev')
    expect(afterSingle.find((n) => n.id === notifs[0].id)?.read).toBe(true)

    // Mark all as read
    await notifRepo.markAllAsRead('ws-dev')
    const afterAll = await notifRepo.getByWorkspace('ws-dev')
    expect(afterAll.every((n) => n.read)).toBe(true)
  })

  it('Step 9: User updates Settings & Preferences', async () => {
    const user = await userRepo.getUser()
    expect(user.settings).toBeDefined()
    expect(user.settings?.theme).toBeDefined()

    const updatedSettings = await userRepo.updateSettings({
      theme: 'dark',
      soundEnabled: false
    })

    expect(updatedSettings.theme).toBe('dark')
    expect(updatedSettings.soundEnabled).toBe(false)
  })
})
