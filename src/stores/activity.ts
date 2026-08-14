import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ActivityLog, ActivityAction } from '../types'
import { MockActivityRepository } from '../repositories'

export const useActivityStore = defineStore('activity', () => {
  const repo = new MockActivityRepository()
  const activities = ref<ActivityLog[]>([])
  const loading = ref<boolean>(false)
  const selectedAction = ref<ActivityAction | 'all'>('all')
  const selectedTargetType = ref<string>('all')
  const selectedProjectId = ref<string>('all')
  const searchQuery = ref<string>('')

  const filteredActivities = computed(() => {
    return activities.value.filter((act) => {
      const matchAction = selectedAction.value === 'all' || act.action === selectedAction.value
      const matchTarget = selectedTargetType.value === 'all' || act.targetType === selectedTargetType.value
      const matchProject = selectedProjectId.value === 'all' || act.projectId === selectedProjectId.value
      const matchSearch =
        searchQuery.value.trim() === '' ||
        act.targetTitle.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        act.actorName.toLowerCase().includes(searchQuery.value.toLowerCase())
      return matchAction && matchTarget && matchProject && matchSearch
    })
  })

  const groupedActivities = computed(() => {
    const groups: Record<string, ActivityLog[]> = {
      Today: [],
      Yesterday: [],
      'Earlier this week': [],
      'Last 30 days': []
    }

    filteredActivities.value.forEach((act) => {
      const groupKey = act.date || 'Today'
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(act)
    })

    return groups
  })

  async function fetchActivitiesByWorkspace(workspaceId: string) {
    loading.value = true
    try {
      activities.value = await repo.getByWorkspace(workspaceId)
    } finally {
      loading.value = false
    }
  }

  async function logActivity(log: Omit<ActivityLog, 'id' | 'timestamp' | 'timeAgo'>) {
    const created = await repo.logActivity(log)
    activities.value.unshift(created)
    return created
  }

  return {
    activities,
    loading,
    selectedAction,
    selectedTargetType,
    selectedProjectId,
    searchQuery,
    filteredActivities,
    groupedActivities,
    fetchActivitiesByWorkspace,
    logActivity
  }
})
