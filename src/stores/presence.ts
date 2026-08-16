import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PresenceService } from '../services/collaboration/PresenceService'
import type { UserPresence, CollaborativeActivityEntry } from '../types'

export const usePresenceStore = defineStore('presence', () => {
  const users = ref<UserPresence[]>(PresenceService.getInitialCollaborators())
  const activities = ref<CollaborativeActivityEntry[]>([
    PresenceService.createActivity(
      'Faqih (Owner)',
      'dispatched_workflow',
      'WORKFLOW',
      'wf-eng-pipeline',
      'Autonomous Bugfix Pipeline'
    ),
    PresenceService.createActivity(
      'Raka Pratama',
      'created_delegation_plan',
      'TASK',
      'tsk-auth-101',
      'Full-Stack Auth Concurrency Mutex'
    )
  ])

  const onlineUsers = computed(() => {
    return users.value.filter((u) => u.status === 'ONLINE' || u.status === 'BUSY')
  })

  function updateUserLocation(userId: string, route: string, taskId?: string) {
    const user = users.value.find((u) => u.userId === userId)
    if (user) {
      user.currentRoute = route
      user.currentTaskId = taskId
      user.lastActiveAt = new Date().toISOString()
    }
  }

  function logActivity(
    actorName: string,
    action: string,
    entityType: CollaborativeActivityEntry['entityType'],
    entityId: string,
    entityTitle: string
  ) {
    const act = PresenceService.createActivity(actorName, action, entityType, entityId, entityTitle)
    activities.value.unshift(act)
  }

  return {
    users,
    activities,
    onlineUsers,
    updateUserLocation,
    logActivity
  }
})
