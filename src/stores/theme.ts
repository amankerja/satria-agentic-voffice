import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<'dark' | 'light'>('dark')

  function initTheme() {
    const saved = localStorage.getItem('satria_theme') as 'dark' | 'light' | null
    if (saved) {
      currentTheme.value = saved
    } else {
      currentTheme.value = 'dark'
    }
    applyTheme()
  }

  function setTheme(theme: 'dark' | 'light') {
    currentTheme.value = theme
    localStorage.setItem('satria_theme', theme)
    applyTheme()
  }

  function toggleTheme() {
    setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
  }

  function applyTheme() {
    const root = document.documentElement
    if (currentTheme.value === 'light') {
      root.classList.add('light-theme')
      root.classList.remove('dark')
    } else {
      root.classList.remove('light-theme')
      root.classList.add('dark')
    }
  }

  return {
    currentTheme,
    initTheme,
    setTheme,
    toggleTheme
  }
})
