/**
 * SATRIA AI WORKFORCE — TASK BOUNDARY GUARD
 *
 * Strict Capability Containment & Explicit Workflow Mode Enforcement.
 *
 * Guarantees that:
 * 1. An Agent cannot spontaneously switch from Mode 3 (ENGINEERING) to Mode 4 (CROSS_SYSTEM).
 * 2. Allowed integrations are determined explicitly by Task Definition, not on-the-fly tool discovery.
 * 3. Violations result in deterministic BOUNDARY_VIOLATION errors.
 */

import type { Task, IntegrationProviderType, SatriaExecutionMode } from '../../types'

export interface BoundaryCheckResult {
  allowed: boolean
  reason: string
  executionMode: SatriaExecutionMode
  disallowedIntegration?: IntegrationProviderType
}

export class TaskBoundaryGuard {
  /**
   * Resolves default allowed integrations based on executionMode if not explicitly defined
   */
  public static getDefaultAllowedIntegrations(mode: SatriaExecutionMode): IntegrationProviderType[] {
    switch (mode) {
      case 'ENGINEERING_EXECUTION':
        return ['github']
      case 'EMAIL_INTELLIGENCE':
        return ['gmail']
      case 'CROSS_SYSTEM':
        return ['github', 'gmail', 'slack', 'google_drive']
      case 'TASK_EXECUTION':
      default:
        return []
    }
  }

  /**
   * Infers executionMode from task metadata if not explicitly provided
   */
  public static inferExecutionMode(task: Partial<Task>): SatriaExecutionMode {
    if (task.executionMode) {
      return task.executionMode
    }

    const text = `${task.title || ''} ${task.description || ''} ${task.instructions || ''}`.toLowerCase()

    // 1. Cross-System if explicitly mentioning both email and github/code
    if ((text.includes('email') || text.includes('gmail')) && (text.includes('github') || text.includes('issue') || text.includes('repo') || text.includes('code'))) {
      return 'CROSS_SYSTEM'
    }

    // 2. Engineering if code/git/bug/feature/pr
    if (text.includes('github') || text.includes('bug') || text.includes('pr') || text.includes('code') || text.includes('fix') || text.includes('refactor')) {
      return 'ENGINEERING_EXECUTION'
    }

    // 3. Email Intelligence if mutasi/transaksi/inbox/email
    if (text.includes('email') || text.includes('mutasi') || text.includes('transaksi') || text.includes('inbox') || text.includes('shopeepay') || text.includes('bank')) {
      return 'EMAIL_INTELLIGENCE'
    }

    return 'TASK_EXECUTION'
  }

  /**
   * Validates whether a tool call from a specific provider is permitted for the given task
   */
  public static assertToolAccess(
    task: Partial<Task>,
    targetProvider: IntegrationProviderType,
    toolName: string
  ): BoundaryCheckResult {
    const mode = task.executionMode || this.inferExecutionMode(task)
    const allowed = task.allowedIntegrations && task.allowedIntegrations.length > 0
      ? task.allowedIntegrations
      : this.getDefaultAllowedIntegrations(mode)

    // Check if target provider is within allowed whitelist
    if (!allowed.includes(targetProvider)) {
      return {
        allowed: false,
        executionMode: mode,
        disallowedIntegration: targetProvider,
        reason: `BOUNDARY_VIOLATION: Tool '${toolName}' dari penyedia '${targetProvider}' diblokir. Mode task aktif adalah '${mode}' dengan izin integrasi: [${allowed.join(', ') || 'NONE'}]. Agent tidak diizinkan mengubah mode alur kerja secara spontan.`
      }
    }

    // Additional Cross-System Safety Check
    if (mode !== 'CROSS_SYSTEM' && targetProvider === 'gmail' && mode === 'ENGINEERING_EXECUTION') {
      return {
        allowed: false,
        executionMode: mode,
        disallowedIntegration: targetProvider,
        reason: `BOUNDARY_VIOLATION: Task coding engineering murni tidak diizinkan mengakses email/inbox. Ubah definisi task menjadi mode 'CROSS_SYSTEM' jika diperlukan kolaborasi lintas sistem.`
      }
    }

    if (mode !== 'CROSS_SYSTEM' && targetProvider === 'github' && mode === 'EMAIL_INTELLIGENCE') {
      return {
        allowed: false,
        executionMode: mode,
        disallowedIntegration: targetProvider,
        reason: `BOUNDARY_VIOLATION: Task email intelligence tidak diizinkan memodifikasi kode atau membuat repositori GitHub. Ubah definisi task menjadi mode 'CROSS_SYSTEM' jika diperlukan.`
      }
    }

    return {
      allowed: true,
      executionMode: mode,
      reason: `Tool '${toolName}' diizinkan sesuai batasan Task Mode '${mode}'.`
    }
  }
}
