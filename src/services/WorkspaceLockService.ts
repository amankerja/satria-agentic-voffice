import type { WorkspaceLock, WorkspaceLockConflictPolicy } from '../types'
import { MockAgentRunRepository } from '../repositories'

export class WorkspaceLockService {
  private static instance: WorkspaceLockService
  private locks = new Map<string, WorkspaceLock>()
  private runRepo = new MockAgentRunRepository()

  private constructor() {}

  public static getInstance(): WorkspaceLockService {
    if (!WorkspaceLockService.instance) {
      WorkspaceLockService.instance = new WorkspaceLockService()
    }
    return WorkspaceLockService.instance
  }

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '')
  }

  public isLocked(workspacePath: string): { locked: boolean; activeLock?: WorkspaceLock } {
    const key = this.normalizePath(workspacePath)
    const existing = this.locks.get(key)
    if (!existing) {
      return { locked: false }
    }
    return { locked: true, activeLock: existing }
  }

  public async acquireLock(
    workspacePath: string,
    lock: WorkspaceLock,
    policy: WorkspaceLockConflictPolicy = 'wait'
  ): Promise<{ acquired: boolean; currentLock?: WorkspaceLock; conflictAction?: string }> {
    const key = this.normalizePath(workspacePath)
    const existing = this.locks.get(key)

    if (existing && existing.activeRunId !== lock.activeRunId) {
      // Verify if existing lock's run is still active in database
      const activeRun = await this.runRepo.getById(existing.activeRunId)
      const isActive = activeRun && ['Starting', 'Running', 'Verifying', 'Waiting'].includes(activeRun.status)

      if (isActive) {
        if (policy === 'allow_concurrent') {
          return { acquired: true, currentLock: existing, conflictAction: 'allowed_concurrent' }
        }
        if (policy === 'stop_existing') {
          // Preempt and release old lock
          this.locks.delete(key)
          this.locks.set(key, lock)
          return { acquired: true, currentLock: lock, conflictAction: 'preempted_existing' }
        }
        // Default: wait / rejected
        return { acquired: false, currentLock: existing, conflictAction: 'locked_wait' }
      } else {
        // Old run is dead/completed, release obsolete lock
        this.locks.delete(key)
      }
    }

    this.locks.set(key, lock)
    return { acquired: true, currentLock: lock }
  }

  public releaseLock(workspacePath: string, runId: string): boolean {
    const key = this.normalizePath(workspacePath)
    const existing = this.locks.get(key)
    if (existing && existing.activeRunId === runId) {
      this.locks.delete(key)
      return true
    }
    return false
  }

  public getActiveLocks(): WorkspaceLock[] {
    return Array.from(this.locks.values())
  }

  public getAllLocks(): Record<string, WorkspaceLock> {
    const result: Record<string, WorkspaceLock> = {}
    for (const [key, lock] of this.locks.entries()) {
      result[key] = lock
    }
    return result
  }

  public clearAllLocks(): void {
    this.locks.clear()
  }
}

export const globalWorkspaceLock = WorkspaceLockService.getInstance()
