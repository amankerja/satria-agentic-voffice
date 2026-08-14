import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WorkforceTool } from '../types'
import { MockWorkforceToolRepository } from '../repositories'

export const useWorkforceToolStore = defineStore('workforceTool', () => {
  const repo = new MockWorkforceToolRepository()

  const tools = ref<WorkforceTool[]>([])
  const currentTool = ref<WorkforceTool | null>(null)
  const loading = ref<boolean>(false)

  async function fetchTools() {
    loading.value = true
    try {
      tools.value = await repo.getAll()
      return tools.value
    } finally {
      loading.value = false
    }
  }

  async function fetchToolById(id: string) {
    loading.value = true
    try {
      const tool = await repo.getById(id)
      currentTool.value = tool || null
      return tool
    } finally {
      loading.value = false
    }
  }

  async function createTool(data: Omit<WorkforceTool, 'id'>) {
    loading.value = true
    try {
      const created = await repo.create(data)
      tools.value.push(created)
      return created
    } finally {
      loading.value = false
    }
  }

  return {
    tools,
    currentTool,
    loading,
    fetchTools,
    fetchToolById,
    createTool
  }
})
