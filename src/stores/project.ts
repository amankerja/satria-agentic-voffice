import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project } from '../types'
import { MockProjectRepository } from '../repositories'

export const useProjectStore = defineStore('project', () => {
  const repo = new MockProjectRepository()
  const projects = ref<Project[]>([])
  const loading = ref<boolean>(false)

  async function fetchProjectsByWorkspace(workspaceId: string) {
    loading.value = true
    try {
      projects.value = await repo.getByWorkspace(workspaceId)
    } finally {
      loading.value = false
    }
  }

  async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'taskCount' | 'completedTaskCount' | 'milestones'>) {
    const created = await repo.create(data)
    projects.value.push(created)
    return created
  }

  return {
    projects,
    loading,
    fetchProjectsByWorkspace,
    createProject
  }
})
