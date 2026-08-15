import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, TaskStatus } from '../types'
import { TaskRepository, AgentRunRepository } from '../repositories'
import { useAuditLogStore } from './auditLog'
import { AuthorizationService } from '../services/AuthorizationService'

export const useTaskStore = defineStore('task', () => {
  const repo = new TaskRepository()
  const runRepo = new AgentRunRepository()
  const tasks = ref<Task[]>([])
  const loading = ref<boolean>(false)
  const auditLogStore = useAuditLogStore()

  async function fetchTasksByWorkspace(workspaceId: string, includeDeleted = false) {
    loading.value = true
    try {
      tasks.value = await repo.getByWorkspace(workspaceId, includeDeleted)
    } finally {
      loading.value = false
    }
  }

  async function getTaskById(taskId: string): Promise<Task | undefined> {
    const task = await repo.getById(taskId)
    if (task) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = { ...task }
      }
    }
    return task
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    AuthorizationService.assertPermission('Owner', 'task:edit', 'Update Task Status')
    const updated = await repo.updateStatus(taskId, status)
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = { ...updated }
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Task',
        entityId: taskId,
        action: 'Task Edited',
        reason: `Status changed to ${status}`,
        metadata: { newStatus: status }
      })
    }
    return updated
  }

  async function updateTask(taskId: string, updates: Partial<Task>) {
    AuthorizationService.assertPermission('Owner', 'task:edit', 'Update Task')
    const updated = await repo.update(taskId, updates)
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = { ...updated }
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Task',
        entityId: taskId,
        action: 'Task Edited',
        reason: updates.workerId ? `Worker changed to ${updates.workerName || updates.workerId}` : 'Task details updated',
        metadata: updates
      })
    }
    return updated
  }

  async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'checklist' | 'comments'>) {
    AuthorizationService.assertPermission('Owner', 'task:create', 'Create Task')
    const created = await repo.create(data)
    tasks.value.unshift(created)
    await auditLogStore.logAction({
      actor: 'Owner',
      entity: 'Task',
      entityId: created.id,
      action: 'Task Created',
      reason: `Created task "${created.title}"`,
      metadata: { title: created.title, projectId: created.projectId }
    })
    return created
  }

  async function cancelTask(taskId: string, reason = 'Cancelled by user') {
    AuthorizationService.assertPermission('Owner', 'task:cancel', 'Cancel Task')
    const task = await repo.getById(taskId)
    const now = new Date().toISOString()

    // If task has an active run, cancel the active run too
    if (task?.activeRunId) {
      await runRepo.update(task.activeRunId, {
        status: 'Cancelled',
        cancelledAt: now,
        cancelledBy: 'Owner',
        cancelReason: `Task was cancelled: ${reason}`
      })
    }

    const updated = await repo.update(taskId, {
      status: 'Cancelled',
      cancelledAt: now,
      cancelledBy: 'Owner',
      cancelReason: reason,
      activeRunId: undefined
    })

    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = { ...updated }
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Task',
        entityId: taskId,
        action: 'Task Cancelled',
        reason,
        metadata: { title: task?.title }
      })
    }
    return updated
  }

  async function archiveTask(taskId: string) {
    AuthorizationService.assertPermission('Owner', 'task:archive', 'Archive Task')
    const now = new Date().toISOString()
    const updated = await repo.update(taskId, {
      status: 'Archived',
      archivedAt: now,
      activeRunId: undefined
    })
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = { ...updated }
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Task',
        entityId: taskId,
        action: 'Task Archived',
        reason: 'Task moved to archive',
        metadata: { title: updated.title }
      })
    }
    return updated
  }

  async function deleteTask(taskId: string, soft = true, reason = 'Task deleted') {
    AuthorizationService.assertPermission('Owner', 'task:delete', 'Delete Task')
    if (soft) {
      await repo.softDelete(taskId, 'Owner', reason)
    } else {
      await repo.delete(taskId)
    }
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
    await auditLogStore.logAction({
      actor: 'Owner',
      entity: 'Task',
      entityId: taskId,
      action: 'Task Deleted',
      reason,
      metadata: { soft }
    })
    return true
  }

  async function restoreTask(taskId: string) {
    AuthorizationService.assertPermission('Owner', 'task:edit', 'Restore Task')
    const updated = await repo.update(taskId, {
      status: 'Todo',
      deletedAt: undefined,
      deletedBy: undefined,
      deleteReason: undefined,
      cancelledAt: undefined,
      cancelledBy: undefined,
      cancelReason: undefined,
      archivedAt: undefined
    })
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = { ...updated }
      } else {
        tasks.value.push(updated)
      }
      await auditLogStore.logAction({
        actor: 'Owner',
        entity: 'Task',
        entityId: taskId,
        action: 'Task Edited',
        reason: 'Restored from soft-delete or cancel/archive',
        metadata: { title: updated.title }
      })
    }
    return updated
  }

  return {
    tasks,
    loading,
    fetchTasksByWorkspace,
    getTaskById,
    updateTaskStatus,
    updateTask,
    createTask,
    cancelTask,
    archiveTask,
    deleteTask,
    restoreTask
  }
})

