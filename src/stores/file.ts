import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WorkspaceFile, FileCategory } from '../types'
import { MockFileRepository } from '../repositories'

export const useFileStore = defineStore('file', () => {
  const repo = new MockFileRepository()
  const files = ref<WorkspaceFile[]>([])
  const loading = ref<boolean>(false)
  const selectedCategory = ref<FileCategory | 'All'>('All')
  const searchQuery = ref<string>('')
  const selectedFile = ref<WorkspaceFile | null>(null)
  const isPreviewOpen = ref<boolean>(false)

  const filteredFiles = computed(() => {
    return files.value.filter((f) => {
      const matchCategory = selectedCategory.value === 'All' || f.category === selectedCategory.value
      const matchSearch =
        searchQuery.value.trim() === '' ||
        f.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (f.projectName && f.projectName.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
        (f.description && f.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
      return matchCategory && matchSearch
    })
  })

  const totalSizeBytes = computed(() => {
    return files.value.reduce((acc, f) => acc + f.sizeBytes, 0)
  })

  const totalSizeFormatted = computed(() => {
    const mb = totalSizeBytes.value / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  })

  async function fetchFilesByWorkspace(workspaceId: string) {
    loading.value = true
    try {
      files.value = await repo.getByWorkspace(workspaceId)
    } finally {
      loading.value = false
    }
  }

  async function uploadFile(fileData: Omit<WorkspaceFile, 'id' | 'updatedAt'>) {
    const created = await repo.upload(fileData)
    files.value.unshift(created)
    return created
  }

  async function deleteFile(id: string) {
    const success = await repo.delete(id)
    if (success) {
      files.value = files.value.filter((f) => f.id !== id)
      if (selectedFile.value?.id === id) {
        selectedFile.value = null
        isPreviewOpen.value = false
      }
    }
    return success
  }

  function openPreview(file: WorkspaceFile) {
    selectedFile.value = file
    isPreviewOpen.value = true
  }

  function closePreview() {
    isPreviewOpen.value = false
    selectedFile.value = null
  }

  return {
    files,
    loading,
    selectedCategory,
    searchQuery,
    selectedFile,
    isPreviewOpen,
    filteredFiles,
    totalSizeBytes,
    totalSizeFormatted,
    fetchFilesByWorkspace,
    uploadFile,
    deleteFile,
    openPreview,
    closePreview
  }
})
