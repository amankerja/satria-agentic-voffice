/**
 * Mock Data LocalStorage Persistence Manager
 * Automatically synchronizes mock repositories to the browser's localStorage
 * so that state (tasks, runs, assignments, employees, etc.) is retained
 * across page reloads and dev server restarts (npm run dev).
 */

export const STORAGE_KEYS = {
  WORKSPACES: 'satria_v1_workspaces',
  PROJECTS: 'satria_v1_projects',
  TASKS: 'satria_v1_tasks',
  FILES: 'satria_v1_files',
  ACTIVITY: 'satria_v1_activity',
  NOTIFICATIONS: 'satria_v1_notifications',
  USER: 'satria_v1_user',
  DEPARTMENTS: 'satria_v1_departments',
  ROLES: 'satria_v1_roles',
  SKILLS: 'satria_v1_skills',
  TOOLS: 'satria_v1_tools',
  EMPLOYEES: 'satria_v1_employees',
  ASSIGNMENTS: 'satria_v1_assignments',
  AGENT_RUNS: 'satria_v1_agent_runs',
  RUN_RESULTS: 'satria_v1_run_results',
  TASK_REVIEWS: 'satria_v1_task_reviews',
  MEMORIES: 'satria_v1_memories',
  SCHEDULES: 'satria_v1_schedules'
} as const

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage
    }
    return null
  } catch {
    return null
  }
}

export function isStorageAvailable(): boolean {
  return getStorage() !== null
}

/**
 * Load a collection from localStorage, or initialize with seed data and save.
 */
export function loadStoredCollection<T>(key: string, seedFallback: T[]): T[] {
  const storage = getStorage()
  if (!storage) {
    return JSON.parse(JSON.stringify(seedFallback))
  }
  try {
    const raw = storage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
    // If not found in localStorage or not array, persist and return default seed
    saveStoredCollection(key, seedFallback)
    return JSON.parse(JSON.stringify(seedFallback))
  } catch (err) {
    console.warn(`[SatriaStorage] Failed to load ${key} from localStorage:`, err)
    return JSON.parse(JSON.stringify(seedFallback))
  }
}

/**
 * Persist a collection array to localStorage safely.
 */
export function saveStoredCollection<T>(key: string, data: T[]): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`[SatriaStorage] Failed to save ${key} to localStorage:`, err)
  }
}

/**
 * Load a single object item from localStorage.
 */
export function loadStoredItem<T>(key: string, seedFallback: T): T {
  const storage = getStorage()
  if (!storage) {
    return JSON.parse(JSON.stringify(seedFallback))
  }
  try {
    const raw = storage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
    }
    saveStoredItem(key, seedFallback)
    return JSON.parse(JSON.stringify(seedFallback))
  } catch (err) {
    console.warn(`[SatriaStorage] Failed to load ${key} from localStorage:`, err)
    return JSON.parse(JSON.stringify(seedFallback))
  }
}

/**
 * Persist a single item to localStorage safely.
 */
export function saveStoredItem<T>(key: string, data: T): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`[SatriaStorage] Failed to save ${key} to localStorage:`, err)
  }
}

/**
 * Clear all Satria mock storage items from localStorage.
 */
export function clearAllMockStorage(): void {
  const storage = getStorage()
  if (!storage) return
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      storage.removeItem(key)
    } catch {
      // ignore
    }
  })
}

/**
 * Return summary statistics about stored entities.
 */
export function getStorageStats(): Record<string, number> {
  const stats: Record<string, number> = {}
  const storage = getStorage()
  if (!storage) return stats

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    try {
      const raw = storage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        stats[name] = Array.isArray(parsed) ? parsed.length : 1
      } else {
        stats[name] = 0
      }
    } catch {
      stats[name] = 0
    }
  })

  return stats
}
