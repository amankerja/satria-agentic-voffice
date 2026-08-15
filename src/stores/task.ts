import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task, TaskStatus } from '../types'
import { MockTaskRepository } from '../repositories'

export const useTaskStore = defineStore('task', () => {
  const repo = new MockTaskRepository()
  const tasks = ref<Task[]>([])
  const loading = ref<boolean>(false)

  async function fetchTasksByWorkspace(workspaceId: string) {
    loading.value = true
    try {
      tasks.value = await repo.getByWorkspace(workspaceId)
    } finally {
      loading.value = false
    }
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

  return {
    tasks,
    loading,
    fetchTasksByWorkspace,
    updateTaskStatus,
    updateTask,
    createTask
  }
})
