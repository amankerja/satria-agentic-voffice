import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfile, UserSettings } from '../types'
import { MockUserRepository } from '../repositories'
import { mockUserSettings } from '../mocks/mockData'

export const useSettingsStore = defineStore('settings', () => {
  const repo = new MockUserRepository()
  const user = ref<UserProfile | null>(null)
  const settings = ref<UserSettings>({ ...mockUserSettings })
  const loading = ref<boolean>(false)

  async function fetchSettings() {
    loading.value = true
    try {
      user.value = await repo.getUser()
      if (user.value.settings) {
        settings.value = { ...user.value.settings }
      }
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(updates: Partial<UserProfile>) {
    const updated = await repo.updateProfile(updates)
    user.value = { ...updated }
    return updated
  }

  async function updateSettings(updates: Partial<UserSettings>) {
    const updated = await repo.updateSettings(updates)
    settings.value = { ...settings.value, ...updated }
    return updated
  }

  return {
    user,
    settings,
    loading,
    fetchSettings,
    updateProfile,
    updateSettings
  }
})
