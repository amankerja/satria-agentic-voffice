import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  MockWorkspaceRepository,
  MockTaskRepository
} from '../repositories'
import { useWorkspaceStore } from '../stores/workspace'
import { useTaskStore } from '../stores/task'
import { useFileStore } from '../stores/file'
import { useActivityStore } from '../stores/activity'
import { useNotificationStore } from '../stores/notification'

describe('SATRIA AI Workforce — Mock Data Layer & Pinia Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('MockWorkspaceRepository returns workspace list and creates workspace', async () => {
    const repo = new MockWorkspaceRepository()
    const list = await repo.getAll()
    expect(list.length).toBeGreaterThan(0)
    expect(list[0]).toHaveProperty('name')
  })

  it('useWorkspaceStore fetches and switches workspace', async () => {
    const store = useWorkspaceStore()
    await store.fetchWorkspaces()
    expect(store.workspaces.length).toBeGreaterThan(0)
    expect(store.currentWorkspaceId).toBe('ws-dev')

    store.switchWorkspace('ws-personal')
    expect(store.currentWorkspaceId).toBe('ws-personal')
    expect(store.currentWorkspace?.name).toBe('Personal Workspace')
  })

  it('useTaskStore updates task status dynamically', async () => {
    const taskRepo = new MockTaskRepository()
    const taskStore = useTaskStore()
    await taskStore.fetchTasksByWorkspace('ws-dev')

    const initialTask = taskStore.tasks[0]
    expect(initialTask).toBeDefined()

    await taskStore.updateTaskStatus(initialTask.id, 'Done')
    const updated = await taskRepo.getById(initialTask.id)
    expect(updated?.status).toBe('Done')
  })

  it('useFileStore handles files fetching, category filtering, and upload', async () => {
    const fileStore = useFileStore()
    await fileStore.fetchFilesByWorkspace('ws-dev')
    expect(fileStore.files.length).toBeGreaterThan(0)

    const initialCount = fileStore.files.length
    await fileStore.uploadFile({
      workspaceId: 'ws-dev',
      name: 'test_artifact.pdf',
      extension: 'pdf',
      category: 'Documents',
      sizeBytes: 2048,
      sizeFormatted: '2 KB',
      description: 'Unit test uploaded file'
    })
    expect(fileStore.files.length).toBe(initialCount + 1)
  })

  it('useActivityStore groups activities by date correctly', async () => {
    const activityStore = useActivityStore()
    await activityStore.fetchActivitiesByWorkspace('ws-dev')
    expect(activityStore.activities.length).toBeGreaterThan(0)
    expect(activityStore.groupedActivities).toHaveProperty('Today')
  })

  it('useNotificationStore handles unread count and mark-as-read', async () => {
    const notifStore = useNotificationStore()
    await notifStore.fetchNotificationsByWorkspace('ws-dev')
    expect(notifStore.notifications.length).toBeGreaterThan(0)

    await notifStore.markAllAsRead('ws-dev')
    expect(notifStore.unreadCount).toBe(0)
  })

  // ==========================================
  // PHASE 1 — WORKFORCE REPOSITORIES & STORES
  // ==========================================

  it('MockDepartmentRepository returns 3 departments', async () => {
    const { MockDepartmentRepository } = await import('../repositories')
    const repo = new MockDepartmentRepository()
    const depts = await repo.getAll()
    expect(depts.length).toBe(3)
    expect(depts.map((d) => d.code)).toEqual(expect.arrayContaining(['CODING', 'TRAINER', 'SIDE_HUSTLE']))
  })

  it('MockEmployeeRoleRepository returns roles and filters by department', async () => {
    const { MockEmployeeRoleRepository } = await import('../repositories')
    const repo = new MockEmployeeRoleRepository()
    const roles = await repo.getAll()
    expect(roles.length).toBe(12)

    const codingRoles = await repo.getByDepartment('dept-coding')
    expect(codingRoles.length).toBe(5)
    expect(codingRoles.map((r) => r.name)).toContain('Asisten Manager / Planner')
  })

  it('MockSkillRepository returns internal and external skills', async () => {
    const { MockSkillRepository } = await import('../repositories')
    const repo = new MockSkillRepository()
    const skills = await repo.getAll()
    expect(skills.length).toBeGreaterThanOrEqual(20)

    const writingPlans = await repo.getById('skill-writing-plans')
    expect(writingPlans).toBeDefined()
    expect(writingPlans?.sourceRepository).toBe('obra/superpowers')
    expect(writingPlans?.installCommand).toContain('npx skills add')
  })

  it('MockWorkforceToolRepository returns tool list', async () => {
    const { MockWorkforceToolRepository } = await import('../repositories')
    const repo = new MockWorkforceToolRepository()
    const tools = await repo.getAll()
    expect(tools.length).toBeGreaterThanOrEqual(10)
    expect(tools.some((t) => t.id === 'tool-git')).toBe(true)
  })

  it('useEmployeeStore handles employee fetch, filter by department, and status update', async () => {
    const { useEmployeeStore } = await import('../stores/employee')
    const store = useEmployeeStore()
    await store.fetchEmployees()
    expect(store.employees.length).toBe(12)

    const codingEmps = await store.fetchEmployeesByDepartment('dept-coding')
    expect(codingEmps.length).toBe(5)

    const raka = store.employees.find((e) => e.name === 'Raka')
    expect(raka).toBeDefined()
    expect(raka?.roleName).toContain('Planner')

    // Test assign skill
    await store.assignSkill('emp-raka', {
      skillId: 'skill-ui-ux-pro-max',
      skillName: 'UI/UX Pro Max Intelligence',
      priority: 'P1',
      assignedAt: '2026-08-14'
    })
    const updatedRaka = await store.fetchEmployeeById('emp-raka')
    expect(updatedRaka?.skills.some((s) => s.skillId === 'skill-ui-ux-pro-max')).toBe(true)
  })
})

