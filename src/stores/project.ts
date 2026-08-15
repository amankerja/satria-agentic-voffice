import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project } from '../types'
import { ProjectRepository, TaskRepository, ScheduleRepository, AgentRunRepository } from '../repositories'
import { useAuditLogStore } from './auditLog'
import { useTaskStore } from './task'
import { AuthorizationService } from '../services/AuthorizationService'

export const useProjectStore = defineStore('project', () => {
  const repo = new ProjectRepository()
  const taskRepo = new TaskRepository()
  const scheduleRepo = new ScheduleRepository()
  const runRepo = new AgentRunRepository()
  const auditLogStore = useAuditLogStore()

  const projects = ref<Project[]>([])
  const loading = ref<boolean>(false)

  async function fetchProjectsByWorkspace(workspaceId: string, includeDeleted = false) {
    loading.value = true
    try {
      projects.value = await repo.getByWorkspace(workspaceId, includeDeleted)
    } finally {
      loading.value = false
    }
  }

  async function getProjectById(projectId: string): Promise<Project | undefined> {
    const prj = await repo.getById(projectId)
    if (prj) {
      const idx = projects.value.findIndex((p) => p.id === projectId)
      if (idx !== -1) {
        projects.value[idx] = { ...prj }
      }
    }
    return prj
  }

  async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'taskCount' | 'completedTaskCount' | 'milestones'>) {
    AuthorizationService.assertPermission('Owner', 'project:create', 'Create Project')
    if (!data.path || !data.path.trim()) {
      throw new Error('Project folder path is required and cannot be empty.')
    }
    const created = await repo.create({
      ...data,
      health: data.health || 'Healthy',
      path: data.path.trim()
    })
    projects.value.push(created)
    await auditLogStore.logAction({
      actor: 'Owner',
      entity: 'Project',
      entityId: created.id,
      action: 'Project Created',
      reason: `Created project "${created.name}" with path ${created.path}`,
      metadata: { name: created.name, path: created.path }
    })
    return created
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    AuthorizationService.assertPermission('Owner', 'project:edit', 'Update Project')
    const updated = await repo.update(id, updates)
    if (updated) {
      const idx = projects.value.findIndex((p) => p.id === id)
      if (idx !== -1) {
        projects.value[idx] = { ...updated }
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Project',
        entityId: id,
        action: 'Project Edited',
        reason: 'Project settings/details modified',
        metadata: updates
      })
    }
    return updated
  }

  async function cancelProject(id: string, reason = 'Project cancelled by user') {
    AuthorizationService.assertPermission('Owner', 'project:cancel', 'Cancel Project')
    const now = new Date().toISOString()
    const updated = await repo.update(id, {
      status: 'Cancelled',
      cancelledAt: now,
      cancelledBy: 'Owner',
      cancelReason: reason
    })

    // Cascade 1: Cancel all tasks under this project and their active runs
    const tasks = await taskRepo.getByProject(id)
    const taskStore = useTaskStore()
    for (const t of tasks) {
      if (t.status !== 'Done' && t.status !== 'Cancelled') {
        if (t.activeRunId) {
          await runRepo.update(t.activeRunId, {
            status: 'Cancelled',
            cancelledAt: now,
            cancelledBy: 'Owner',
            cancelReason: `Project cancelled: ${reason}`
          })
        }
        await taskRepo.update(t.id, {
          status: 'Cancelled',
          cancelledAt: now,
          cancelledBy: 'Owner',
          cancelReason: `Parent project was cancelled: ${reason}`,
          activeRunId: undefined
        })
        const inStore = taskStore.tasks.find((tk) => tk.id === t.id)
        if (inStore) {
          inStore.status = 'Cancelled'
          inStore.activeRunId = undefined
          inStore.cancelledAt = now
          inStore.cancelledBy = 'Owner'
          inStore.cancelReason = `Parent project was cancelled: ${reason}`
        }
      }
    }

    // Cascade 2: Disable all linked recurring schedules
    const schedules = await scheduleRepo.getByProject(id)
    for (const s of schedules) {
      if (s.enabled) {
        await scheduleRepo.update(s.id, {
          enabled: false,
          updatedAt: now
        })
      }
    }

    if (updated) {
      const idx = projects.value.findIndex((p) => p.id === id)
      if (idx !== -1) {
        projects.value[idx] = { ...updated }
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Project',
        entityId: id,
        action: 'Project Cancelled',
        reason,
        metadata: { name: updated.name }
      })
    }
    return updated
  }

  async function archiveProject(id: string) {
    AuthorizationService.assertPermission('Owner', 'project:archive', 'Archive Project')
    const now = new Date().toISOString()
    const updated = await repo.update(id, {
      status: 'Archived',
      archivedAt: now
    })
    if (updated) {
      const idx = projects.value.findIndex((p) => p.id === id)
      if (idx !== -1) {
        projects.value[idx] = { ...updated }
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Project',
        entityId: id,
        action: 'Project Archived',
        reason: 'Project archived',
        metadata: { name: updated.name }
      })
    }
    return updated
  }

  async function deleteProject(id: string, soft = true, reason = 'Project deleted') {
    AuthorizationService.assertPermission('Owner', 'project:delete', 'Delete Project')
    if (soft) {
      await repo.softDelete(id, 'Owner', reason)
    } else {
      await repo.delete(id)
    }
    projects.value = projects.value.filter((p) => p.id !== id)
    await auditLogStore.logAction({
      actor: 'Owner',
      entity: 'Project',
      entityId: id,
      action: 'Project Deleted',
      reason,
      metadata: { soft }
    })
    return true
  }

  async function restoreProject(id: string) {
    AuthorizationService.assertPermission('Owner', 'project:edit', 'Restore Project')
    const updated = await repo.update(id, {
      status: 'Active',
      deletedAt: undefined,
      deletedBy: undefined,
      deleteReason: undefined,
      cancelledAt: undefined,
      cancelledBy: undefined,
      cancelReason: undefined,
      archivedAt: undefined
    })
    if (updated) {
      const idx = projects.value.findIndex((p) => p.id === id)
      if (idx !== -1) {
        projects.value[idx] = { ...updated }
      } else {
        projects.value.push(updated)
      }
    }
    return updated
  }

  return {
    projects,
    loading,
    fetchProjectsByWorkspace,
    getProjectById,
    createProject,
    updateProject,
    cancelProject,
    archiveProject,
    deleteProject,
    restoreProject
  }
})

