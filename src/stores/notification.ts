import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NotificationItem } from '../types'
import { MockNotificationRepository } from '../repositories'

export const useNotificationStore = defineStore('notification', () => {
  const repo = new MockNotificationRepository()
  const notifications = ref<NotificationItem[]>([])
  const loading = ref<boolean>(false)
  const filterCategory = ref<string>('All')
  const onlyUnread = ref<boolean>(false)

  const unreadCount = computed(() => {
    return notifications.value.filter((n) => !n.read).length
  })

  const filteredNotifications = computed(() => {
    return notifications.value.filter((n) => {
      const matchCategory = filterCategory.value === 'All' || n.category === filterCategory.value
      const matchUnread = !onlyUnread.value || !n.read
      return matchCategory && matchUnread
    })
  })

  async function fetchNotificationsByWorkspace(workspaceId: string) {
    loading.value = true
    try {
      notifications.value = await repo.getByWorkspace(workspaceId)
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string) {
    const success = await repo.markAsRead(id)
    if (success) {
      const item = notifications.value.find((n) => n.id === id)
      if (item) {
        item.read = true
      }
    }
  }

  async function markAllAsRead(workspaceId?: string) {
    await repo.markAllAsRead(workspaceId)
    notifications.value.forEach((n) => {
      if (!workspaceId || n.workspaceId === workspaceId) {
        n.read = true
      }
    })
  }

  async function deleteNotification(id: string) {
    const success = await repo.delete(id)
    if (success) {
      notifications.value = notifications.value.filter((n) => n.id !== id)
    }
  }

  async function createNotification(notifData: Omit<NotificationItem, 'id' | 'timeAgo' | 'read'> & { read?: boolean }) {
    const created = await repo.create(notifData)
    notifications.value.unshift(created)
    return created
  }

  return {
    notifications,
    loading,
    filterCategory,
    onlyUnread,
    unreadCount,
    filteredNotifications,
    fetchNotificationsByWorkspace,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  }
})
