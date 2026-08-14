import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Workspace } from '../types'
import { MockWorkspaceRepository } from '../repositories'

export const useWorkspaceStore = defineStore('workspace', () => {
  const repo = new MockWorkspaceRepository()
  const workspaces = ref<Workspace[]>([])
  const currentWorkspaceId = ref<string>('ws-dev')
  const loading = ref<boolean>(false)

  const currentWorkspace = computed(() => {
    return workspaces.value.find((w) => w.id === currentWorkspaceId.value) || workspaces.value[0]
  })

  async function fetchWorkspaces() {
    loading.value = true
    try {
      workspaces.value = await repo.getAll()
    } finally {
      loading.value = false
    }
  }

  function switchWorkspace(id: string) {
    if (workspaces.value.some((w) => w.id === id)) {
      currentWorkspaceId.value = id
    }
  }

  async function createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'projectCount' | 'taskCount' | 'fileCount'>) {
    const created = await repo.create(data)
    workspaces.value.push(created)
    currentWorkspaceId.value = created.id
    return created
  }

  return {
    workspaces,
    currentWorkspaceId,
    currentWorkspace,
    loading,
    fetchWorkspaces,
    switchWorkspace,
    createWorkspace
  }
})
