import type { SatriaBackupBundle } from '../types'
import { dbClient } from '../database/DatabaseClient'
import {
  MockProjectRepository,
  MockTaskRepository,
  MockAgentRunRepository,
  MockScheduleRepository,
  MockEmployeeRepository,
  MockDepartmentRepository,
  MockCostLedgerRepository,
  MockAuditLogRepository,
  MockMemoryRepository
} from '../repositories'

export class BackupService {
  private projectRepo = new MockProjectRepository()
  private taskRepo = new MockTaskRepository()
  private runRepo = new MockAgentRunRepository()
  private scheduleRepo = new MockScheduleRepository()
  private employeeRepo = new MockEmployeeRepository()
  private deptRepo = new MockDepartmentRepository()
  private costRepo = new MockCostLedgerRepository()
  private auditRepo = new MockAuditLogRepository()
  private memoryRepo = new MockMemoryRepository()

  public async exportBackup(workspaceId = 'ws-dev', actor = 'Owner'): Promise<SatriaBackupBundle> {
    const [
      projects,
      tasks,
      runs,
      schedules,
      employees,
      departments,
      costEntries,
      auditLogs,
      memories
    ] = await Promise.all([
      this.projectRepo.getByWorkspace(workspaceId, true),
      this.taskRepo.getByWorkspace(workspaceId, true),
      this.runRepo.getAll(true),
      this.scheduleRepo.getByWorkspace(workspaceId, true),
      this.employeeRepo.getAll(),
      this.deptRepo.getAll(),
      this.costRepo.getByWorkspace(workspaceId),
      this.auditRepo.getAll(),
      this.memoryRepo.getAll()
    ])

    const workspacePathReferences = projects
      .filter((p) => Boolean(p.path))
      .map((p) => ({ projectId: p.id, path: p.path }))

    const bundle: SatriaBackupBundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: actor,
      workspaceId,
      data: {
        projects,
        tasks,
        runs,
        schedules,
        employees,
        departments,
        costEntries,
        auditLogs,
        memories,
        workspacePathReferences
      }
    }

    // Log backup event in audit
    await this.auditRepo.log({
      actor,
      entity: 'System',
      entityId: workspaceId,
      action: 'Backup Exported',
      reason: 'User triggered full workspace backup bundle export',
      metadata: {
        projectsCount: projects.length,
        tasksCount: tasks.length,
        runsCount: runs.length,
        schedulesCount: schedules.length
      }
    })

    return bundle
  }

  public validateBackupBundle(bundleInput: string | unknown): {
    valid: boolean
    bundle?: SatriaBackupBundle
    error?: string
  } {
    let parsed: any = bundleInput
    if (typeof bundleInput === 'string') {
      try {
        parsed = JSON.parse(bundleInput)
      } catch (err: any) {
        return { valid: false, error: `Invalid JSON syntax: ${err.message}` }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Backup payload must be a non-null object' }
    }

    if (!parsed.version || !parsed.data || typeof parsed.data !== 'object') {
      return { valid: false, error: 'Backup bundle is missing version or data payload structure' }
    }

    const { projects, tasks, runs, employees } = parsed.data
    if (!Array.isArray(projects) || !Array.isArray(tasks) || !Array.isArray(runs) || !Array.isArray(employees)) {
      return { valid: false, error: 'Backup bundle corrupted: core entity arrays are missing or invalid.' }
    }

    return { valid: true, bundle: parsed as SatriaBackupBundle }
  }

  public async restoreBackup(
    bundle: SatriaBackupBundle,
    actor = 'Owner'
  ): Promise<{ success: boolean; stats: Record<string, number> }> {
    const validation = this.validateBackupBundle(bundle)
    if (!validation.valid || !validation.bundle) {
      throw new Error(`Restore failed: ${validation.error}`)
    }

    const data = validation.bundle.data
    const stats: Record<string, number> = {}

    // Save datasets into database stores
    if (data.projects) {
      await dbClient.replaceStoreData('projects', data.projects)
      stats.projects = data.projects.length
    }
    if (data.tasks) {
      await dbClient.replaceStoreData('tasks', data.tasks)
      stats.tasks = data.tasks.length
    }
    if (data.runs) {
      await dbClient.replaceStoreData('agent_runs', data.runs)
      stats.runs = data.runs.length
    }
    if (data.schedules) {
      await dbClient.replaceStoreData('schedules', data.schedules)
      stats.schedules = data.schedules.length
    }
    if (data.employees) {
      await dbClient.replaceStoreData('employees', data.employees)
      stats.employees = data.employees.length
    }
    if (data.departments) {
      await dbClient.replaceStoreData('departments', data.departments)
      stats.departments = data.departments.length
    }
    if (data.costEntries) {
      await dbClient.replaceStoreData('cost_entries', data.costEntries)
      stats.costEntries = data.costEntries.length
    }
    if (data.memories) {
      await dbClient.replaceStoreData('memories', data.memories)
      stats.memories = data.memories.length
    }

    // Log restore event in audit
    await this.auditRepo.log({
      actor,
      entity: 'System',
      entityId: bundle.workspaceId,
      action: 'Backup Restored',
      reason: `Full workspace restored from backup bundle exported at ${bundle.exportedAt}`,
      metadata: stats
    })

    return { success: true, stats }
  }
}

export const globalBackupService = new BackupService()
