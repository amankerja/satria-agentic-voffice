import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, TaskStatus } from '../types'
import { TaskRepository, AgentRunRepository } from '../repositories'

export const useTaskStore = defineStore('task', () => {
  const repo = new TaskRepository()
  const runRepo = new AgentRunRepository()
  const tasks = ref<Task[]>([])
  const loading = ref<boolean>(false)

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
    const updated = await repo.updateStatus(taskId, status)
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = { ...updated }
      }
    }
    return updated
  }

  async function updateTask(taskId: string, updates: Partial<Task>) {
    const updated = await repo.update(taskId, updates)
    if (updated) {
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = { ...updated }
      }
    }
    return updated
  }

  async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'checklist' | 'comments'>) {
    const created = await repo.create(data)
    tasks.value.unshift(created)
    return created
  }

  async function cancelTask(taskId: string, reason = 'Cancelled by user') {
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
    }
    return updated
  }

  async function archiveTask(taskId: string) {
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
    }
    return updated
  }

  async function deleteTask(taskId: string, soft = true, reason = 'Task deleted') {
    if (soft) {
      await repo.softDelete(taskId, 'Owner', reason)
    } else {
      await repo.delete(taskId)
    }
    tasks.value = tasks.value.filter((t) => t.id !== taskId)
    return true
  }

  async function restoreTask(taskId: string) {
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

