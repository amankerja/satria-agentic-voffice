/**
 * Satria AI Workforce — Real Persistent Database Engine
 *
 * Provides a transactional, reactive storage layer combining:
 * 1. Fast reactive in-memory cache for synchronous reads & UI responsiveness.
 * 2. Real browser IndexedDB persistence (ObjectStores) surviving reloads.
 * 3. Vite development server synchronization via `/api/db/sync` -> `data/database.json`.
 * 4. Automatic fallback for test environments (Vitest / Node.js).
 */

import {
  initialWorkspaces,
  initialProjects,
  initialTasks,
  initialDepartments,
  initialEmployeeRoles,
  initialSkills,
  initialWorkforceTools,
  initialEmployees,
  initialAssignments,
  initialAgentRuns,
  initialRunResults,
  initialTaskReviews,
  initialFiles,
  initialActivityLogs,
  initialNotifications,
  initialUser,
  initialUserSettings,
  initialMemories,
  initialSchedules
} from './initialSeed'
import type {
  Workspace,
  Project,
  Task,
  Department,
  EmployeeRole,
  Skill,
  WorkforceTool,
  Employee,
  TaskAssignment,
  AgentRun,
  RunResult,
  TaskReview,
  WorkspaceFile,
  ActivityLog,
  NotificationItem,
  UserProfile,
  UserSettings,
  AgentMemoryItem,
  Schedule
} from '../types'
import { STORAGE_KEYS, saveStoredCollection } from '../utils/mockStorage'
import * as mockArrays from '../mocks/mockData'

export interface FullDatabaseState {
  workspaces: Workspace[]
  projects: Project[]
  tasks: Task[]
  departments: Department[]
  roles: EmployeeRole[]
  skills: Skill[]
  tools: WorkforceTool[]
  employees: Employee[]
  assignments: TaskAssignment[]
  agent_runs: AgentRun[]
  run_results: RunResult[]
  task_reviews: TaskReview[]
  files: WorkspaceFile[]
  activities: ActivityLog[]
  notifications: NotificationItem[]
  memories: AgentMemoryItem[]
  schedules: Schedule[]
  user_profile: UserProfile
  user_settings: UserSettings
}

export type StoreName = keyof FullDatabaseState

class SatriaDatabaseClient {
  private dbName = 'satria_ai_workforce_db'
  private dbVersion = 5
  private db: IDBDatabase | null = null
  private memoryCache: FullDatabaseState
  private initialized = false
  private initPromise: Promise<void> | null = null
  private syncTimer: any = null

  constructor() {
    this.memoryCache = this.getDefaultState()
  }

  public getDefaultState(): FullDatabaseState {
    return {
      workspaces: JSON.parse(JSON.stringify(initialWorkspaces)),
      projects: JSON.parse(JSON.stringify(initialProjects)),
      tasks: JSON.parse(JSON.stringify(initialTasks)),
      departments: JSON.parse(JSON.stringify(initialDepartments)),
      roles: JSON.parse(JSON.stringify(initialEmployeeRoles)),
      skills: JSON.parse(JSON.stringify(initialSkills)),
      tools: JSON.parse(JSON.stringify(initialWorkforceTools)),
      employees: JSON.parse(JSON.stringify(initialEmployees)),
      assignments: JSON.parse(JSON.stringify(initialAssignments)),
      agent_runs: JSON.parse(JSON.stringify(initialAgentRuns)),
      run_results: JSON.parse(JSON.stringify(initialRunResults)),
      task_reviews: JSON.parse(JSON.stringify(initialTaskReviews)),
      files: JSON.parse(JSON.stringify(initialFiles)),
      activities: JSON.parse(JSON.stringify(initialActivityLogs)),
      notifications: JSON.parse(JSON.stringify(initialNotifications)),
      memories: JSON.parse(JSON.stringify(initialMemories)),
      schedules: JSON.parse(JSON.stringify(initialSchedules)),
      user_profile: JSON.parse(JSON.stringify(initialUser)),
      user_settings: JSON.parse(JSON.stringify(initialUserSettings))
    }
  }

  public async init(): Promise<void> {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      // 1. Try to load from server disk (/api/db/sync) if available in Vite dev mode
      await this.fetchServerDiskState()

      // 2. Open IndexedDB if running in browser
      if (typeof window !== 'undefined' && window.indexedDB) {
        try {
          this.db = await this.openIndexedDB()
          await this.populateOrLoadIndexedDB()
        } catch (err) {
          console.warn('[SatriaDB] IndexedDB initialization warning:', err)
        }
      }

      this.syncMockArrays()
      this.initialized = true
    })()

    return this.initPromise
  }

  private syncMockArrays(): void {
    const storeMap: Record<StoreName, { array?: any[]; key?: string }> = {
      workspaces: { array: mockArrays.mockWorkspaces, key: STORAGE_KEYS.WORKSPACES },
      projects: { array: mockArrays.mockProjects, key: STORAGE_KEYS.PROJECTS },
      tasks: { array: mockArrays.mockTasks, key: STORAGE_KEYS.TASKS },
      departments: { array: mockArrays.mockDepartments, key: STORAGE_KEYS.DEPARTMENTS },
      roles: { array: mockArrays.mockEmployeeRoles, key: STORAGE_KEYS.ROLES },
      skills: { array: mockArrays.mockSkills, key: STORAGE_KEYS.SKILLS },
      tools: { array: mockArrays.mockWorkforceTools, key: STORAGE_KEYS.TOOLS },
      employees: { array: mockArrays.mockEmployees, key: STORAGE_KEYS.EMPLOYEES },
      assignments: { array: mockArrays.mockAssignments, key: STORAGE_KEYS.ASSIGNMENTS },
      agent_runs: { array: mockArrays.mockAgentRuns, key: STORAGE_KEYS.AGENT_RUNS },
      run_results: { array: mockArrays.mockRunResults, key: STORAGE_KEYS.RUN_RESULTS },
      task_reviews: { array: mockArrays.mockTaskReviews, key: STORAGE_KEYS.TASK_REVIEWS },
      files: { array: mockArrays.mockFiles, key: STORAGE_KEYS.FILES },
      activities: { array: mockArrays.mockActivityLogs, key: STORAGE_KEYS.ACTIVITY },
      notifications: { array: mockArrays.mockNotifications, key: STORAGE_KEYS.NOTIFICATIONS },
      memories: { array: mockArrays.mockMemories, key: STORAGE_KEYS.MEMORIES },
      schedules: { array: mockArrays.mockSchedules, key: STORAGE_KEYS.SCHEDULES },
      user_profile: {},
      user_settings: {}
    }

    for (const [store, config] of Object.entries(storeMap) as [StoreName, { array?: any[]; key?: string }][]) {
      const current = (this.memoryCache as any)[store]
      if (config.array && Array.isArray(current)) {
        config.array.length = 0
        config.array.push(...current)
        if (config.key) {
          saveStoredCollection(config.key, current)
        }
      }
    }
  }

  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion)

      request.onupgradeneeded = () => {
        const db = request.result
        const stores: StoreName[] = [
          'workspaces',
          'projects',
          'tasks',
          'departments',
          'roles',
          'skills',
          'tools',
          'employees',
          'assignments',
          'agent_runs',
          'run_results',
          'task_reviews',
          'files',
          'activities',
          'notifications',
          'memories',
          'schedules',
          'user_profile',
          'user_settings'
        ]

        stores.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' })
          }
        })
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async populateOrLoadIndexedDB(): Promise<void> {
    if (!this.db) return

    if (!this.db.objectStoreNames.contains('tasks')) {
      await this.saveAllToIndexedDB(this.memoryCache)
      return
    }

    const tx = this.db.transaction('tasks', 'readonly')
    const store = tx.objectStore('tasks')
    const countReq = store.count()

    const count: number = await new Promise((resolve) => {
      countReq.onsuccess = () => resolve(countReq.result)
      countReq.onerror = () => resolve(0)
    })

    if (count === 0) {
      await this.saveAllToIndexedDB(this.memoryCache)
    } else {
      await this.loadAllFromIndexedDB()
    }
  }

  private async loadAllFromIndexedDB(): Promise<void> {
    if (!this.db) return
    const stores: StoreName[] = [
      'workspaces',
      'projects',
      'tasks',
      'departments',
      'roles',
      'skills',
      'tools',
      'employees',
      'assignments',
      'agent_runs',
      'run_results',
      'task_reviews',
      'files',
      'activities',
      'notifications',
      'memories',
      'schedules'
    ]

    for (const storeName of stores) {
      if (!this.db.objectStoreNames.contains(storeName)) {
        continue
      }
      try {
        const tx = this.db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const req = store.getAll()
        const items = await new Promise<any[]>((resolve, reject) => {
          req.onsuccess = () => resolve(req.result || [])
          req.onerror = () => reject(req.error)
        })
        if (items && items.length > 0) {
          ;(this.memoryCache as any)[storeName] = items
        }
      } catch (err) {
        console.warn(`[SatriaDB] Failed to load store ${storeName}:`, err)
      }
    }
  }

  private async saveAllToIndexedDB(state: FullDatabaseState): Promise<void> {
    if (!this.db) return
    const stores = Object.keys(state) as StoreName[]

    for (const storeName of stores) {
      if (!this.db.objectStoreNames.contains(storeName)) {
        continue
      }
      try {
        const tx = this.db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        store.clear()
        const data = (state as any)[storeName]
        if (Array.isArray(data)) {
          data.forEach((item) => store.put(item))
        } else if (data && typeof data === 'object') {
          store.put(data)
        }
      } catch (err) {
        console.warn(`[SatriaDB] Failed saving to IndexedDB store ${storeName}:`, err)
      }
    }
  }

  // --- Disk Sync (Vite Middleware) ---
  private async fetchServerDiskState(): Promise<void> {
    if (typeof window === 'undefined' || !window.fetch) return
    try {
      const res = await fetch('/api/db/sync', { method: 'GET' })
      if (res.ok) {
        const data = await res.json()
        if (data && data.tasks && data.employees) {
          this.memoryCache = data
        }
      }
    } catch {
      // Disk sync unavailable (e.g. static build or offline)
    }
  }

  private scheduleDiskSync(): void {
    if (this.syncTimer) clearTimeout(this.syncTimer)
    this.syncTimer = setTimeout(async () => {
      if (typeof window === 'undefined' || !window.fetch) return
      try {
        await fetch('/api/db/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.memoryCache)
        })
      } catch {
        // Disk sync failure ignored in offline mode
      }
    }, 200)
  }

  // --- CRUD Engine ---

  public async getAll<T>(storeName: StoreName): Promise<T[]> {
    await this.init()
    const items = (this.memoryCache as any)[storeName]
    return Array.isArray(items) ? JSON.parse(JSON.stringify(items)) : []
  }

  public async getById<T extends { id: string }>(storeName: StoreName, id: string): Promise<T | undefined> {
    await this.init()
    const list: T[] = (this.memoryCache as any)[storeName] || []
    const found = list.find((item) => item.id === id)
    return found ? JSON.parse(JSON.stringify(found)) : undefined
  }

  public async insert<T extends { id: string }>(storeName: StoreName, item: T): Promise<T> {
    await this.init()
    const list: T[] = (this.memoryCache as any)[storeName] || []
    list.unshift(item)

    if (this.db && this.db.objectStoreNames.contains(storeName)) {
      try {
        const tx = this.db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).put(item)
      } catch (err) {
        console.warn(`[SatriaDB] IndexedDB insert failed for ${storeName}:`, err)
      }
    }

    this.syncMockArrays()
    this.scheduleDiskSync()
    return JSON.parse(JSON.stringify(item))
  }

  public async update<T extends { id: string }>(
    storeName: StoreName,
    id: string,
    updates: Partial<T>
  ): Promise<T | undefined> {
    await this.init()
    const list: T[] = (this.memoryCache as any)[storeName] || []
    const index = list.findIndex((item) => item.id === id)
    if (index === -1) return undefined

    const updated = { ...list[index], ...updates }
    list[index] = updated

    if (this.db && this.db.objectStoreNames.contains(storeName)) {
      try {
        const tx = this.db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).put(updated)
      } catch (err) {
        console.warn(`[SatriaDB] IndexedDB update failed for ${storeName}:`, err)
      }
    }

    this.syncMockArrays()
    this.scheduleDiskSync()
    return JSON.parse(JSON.stringify(updated))
  }

  public async delete(storeName: StoreName, id: string): Promise<boolean> {
    await this.init()
    const list: any[] = (this.memoryCache as any)[storeName] || []
    const index = list.findIndex((item) => item.id === id)
    if (index === -1) return false

    list.splice(index, 1)

    if (this.db && this.db.objectStoreNames.contains(storeName)) {
      try {
        const tx = this.db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).delete(id)
      } catch (err) {
        console.warn(`[SatriaDB] IndexedDB delete failed for ${storeName}:`, err)
      }
    }

    this.syncMockArrays()
    this.scheduleDiskSync()
    return true
  }

  public async getItem<T>(storeName: 'user_profile' | 'user_settings'): Promise<T> {
    await this.init()
    const item = (this.memoryCache as any)[storeName]
    return JSON.parse(JSON.stringify(item))
  }

  public async setItem<T>(storeName: 'user_profile' | 'user_settings', data: T): Promise<T> {
    await this.init()
    ;(this.memoryCache as any)[storeName] = data
    if (this.db) {
      try {
        const tx = this.db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).put(data)
      } catch (err) {
        console.warn(`[SatriaDB] IndexedDB setItem failed for ${storeName}:`, err)
      }
    }
    this.scheduleDiskSync()
    return JSON.parse(JSON.stringify(data))
  }

  public async updateItem<T>(storeName: 'user_profile' | 'user_settings', updates: Partial<T>): Promise<T> {
    await this.init()
    const current = (this.memoryCache as any)[storeName] || {}
    const merged = { ...current, ...updates }
    ;(this.memoryCache as any)[storeName] = merged
    if (this.db) {
      try {
        const tx = this.db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).put(merged)
      } catch (err) {
        console.warn(`[SatriaDB] IndexedDB updateItem failed for ${storeName}:`, err)
      }
    }
    this.scheduleDiskSync()
    return JSON.parse(JSON.stringify(merged))
  }

  public async resetToDefaults(): Promise<void> {
    this.memoryCache = this.getDefaultState()
    if (this.db) {
      await this.saveAllToIndexedDB(this.memoryCache)
    }
    this.syncMockArrays()
    this.scheduleDiskSync()
  }

  public getRawMemoryState(): FullDatabaseState {
    return this.memoryCache
  }
}

export const dbClient = new SatriaDatabaseClient()
