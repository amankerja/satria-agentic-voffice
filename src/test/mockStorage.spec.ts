import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  STORAGE_KEYS,
  loadStoredCollection,
  saveStoredCollection,
  loadStoredItem,
  saveStoredItem,
  clearAllMockStorage,
  getStorageStats
} from '../utils/mockStorage'
import { MockTaskRepository } from '../repositories'
import { mockTasks } from '../mocks/mockData'

describe('MockStorage Persistence Layer', () => {
  const mockStorageMap = new Map<string, string>()

  beforeEach(() => {
    mockStorageMap.clear()
    
    // Setup window.localStorage mock for testing
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorageMap.get(key) ?? null,
      setItem: (key: string, value: string) => mockStorageMap.set(key, value),
      removeItem: (key: string) => mockStorageMap.delete(key),
      clear: () => mockStorageMap.clear()
    })
  })

  it('initializes collection from seed fallback when localStorage is empty', () => {
    const seed = [{ id: '1', name: 'Item 1' }]
    const result = loadStoredCollection('test_key', seed)
    
    expect(result).toEqual(seed)
    expect(mockStorageMap.get('test_key')).toBe(JSON.stringify(seed))
  })

  it('loads existing collection from localStorage when available', () => {
    const saved = [{ id: '99', name: 'Persisted Item' }]
    mockStorageMap.set('test_key', JSON.stringify(saved))

    const seed = [{ id: '1', name: 'Item 1' }]
    const result = loadStoredCollection('test_key', seed)

    expect(result).toEqual(saved)
  })

  it('saves modified collection to localStorage', () => {
    const data = [{ id: '1', name: 'New Item' }, { id: '2', name: 'Second Item' }]
    saveStoredCollection('test_key', data)

    expect(mockStorageMap.get('test_key')).toBe(JSON.stringify(data))
  })

  it('loads and saves single item object correctly', () => {
    const defaultUser = { id: 'usr-1', name: 'Default User' }
    const loaded = loadStoredItem('user_key', defaultUser)
    expect(loaded).toEqual(defaultUser)

    const updatedUser = { id: 'usr-1', name: 'Updated Satria' }
    saveStoredItem('user_key', updatedUser)
    expect(mockStorageMap.get('user_key')).toBe(JSON.stringify(updatedUser))
  })

  it('clears all mock storage keys on clearAllMockStorage()', () => {
    mockStorageMap.set(STORAGE_KEYS.TASKS, JSON.stringify([{ id: 'tsk-1' }]))
    mockStorageMap.set(STORAGE_KEYS.PROJECTS, JSON.stringify([{ id: 'prj-1' }]))

    clearAllMockStorage()

    expect(mockStorageMap.get(STORAGE_KEYS.TASKS)).toBeUndefined()
    expect(mockStorageMap.get(STORAGE_KEYS.PROJECTS)).toBeUndefined()
  })

  it('calculates storage statistics correctly', () => {
    mockStorageMap.set(STORAGE_KEYS.TASKS, JSON.stringify([{ id: 't1' }, { id: 't2' }]))
    mockStorageMap.set(STORAGE_KEYS.PROJECTS, JSON.stringify([{ id: 'p1' }]))

    const stats = getStorageStats()
    expect(stats.TASKS).toBe(2)
    expect(stats.PROJECTS).toBe(1)
  })

  it('MockTaskRepository persists created tasks to localStorage', async () => {
    const repo = new MockTaskRepository()
    const taskCountBefore = mockTasks.length

    const created = await repo.create({
      workspaceId: 'ws-dev',
      projectId: 'prj-satria-ui',
      projectName: 'SATRIA AI Workforce UI',
      title: 'Persistent Task Test',
      description: 'Testing task persistence in localStorage',
      status: 'In Progress',
      priority: 'High',
      assigneeName: 'Satria Utama',
      dueDate: '2026-08-20',
      tags: ['Test', 'Persistence']
    })

    expect(created.title).toBe('Persistent Task Test')
    expect(mockTasks.length).toBe(taskCountBefore + 1)

    // Verify localStorage was updated
    const storedTasksRaw = mockStorageMap.get(STORAGE_KEYS.TASKS)
    expect(storedTasksRaw).toBeDefined()
    const storedTasks = JSON.parse(storedTasksRaw!)
    expect(storedTasks[0].title).toBe('Persistent Task Test')
  })
})
