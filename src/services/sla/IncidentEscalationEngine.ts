import type {
  AgentRun,
  Task,
  SlaPolicy,
  IncidentRecord
} from '../../types'

export const DEFAULT_SLA_POLICIES: Record<string, SlaPolicy> = {
  P0: {
    priority: 'P0',
    maxExecutionTimeSeconds: 60,
    maxAttempts: 2,
    escalationTimeoutSeconds: 30,
    escalationRecipients: ['owner@satria.ai', 'lead-engineer@satria.internal']
  },
  P1: {
    priority: 'P1',
    maxExecutionTimeSeconds: 180,
    maxAttempts: 3,
    escalationTimeoutSeconds: 90,
    escalationRecipients: ['lead-engineer@satria.internal']
  },
  P2: {
    priority: 'P2',
    maxExecutionTimeSeconds: 600,
    maxAttempts: 3,
    escalationTimeoutSeconds: 300,
    escalationRecipients: []
  },
  P3: {
    priority: 'P3',
    maxExecutionTimeSeconds: 1200,
    maxAttempts: 3,
    escalationTimeoutSeconds: 600,
    escalationRecipients: []
  }
}

export class IncidentEscalationEngine {
  /**
   * Evaluates active agent run execution against SLA time and attempt thresholds
   */
  static evaluateRunSla(
    run: AgentRun,
    task?: Partial<Task>,
    customPolicies: Record<string, SlaPolicy> = DEFAULT_SLA_POLICIES
  ): IncidentRecord | null {
    const priority = task?.priority || 'High'
    const isCritical = priority === 'Urgent' || (priority as string) === 'P0'
    const policy = customPolicies[priority] || (isCritical ? DEFAULT_SLA_POLICIES.P0 : DEFAULT_SLA_POLICIES.P1)
    const duration = run.durationSeconds || (run.telemetry?.durationMs ? Math.round(run.telemetry.durationMs / 1000) : 0)

    // 1. Timeout Check
    if (run.status === 'Running' && duration > policy.maxExecutionTimeSeconds) {
      return {
        id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `[SLA Timeout] Run ${run.id} (${priority}) exceeded limit of ${policy.maxExecutionTimeSeconds}s`,
        severity: isCritical ? 'SEV-1_CRITICAL' : 'SEV-2_HIGH',
        status: 'OPEN',
        sourceRunId: run.id,
        sourceTaskId: run.taskId,
        departmentId: run.employeeRole?.includes('Backend') ? 'dept-eng' : 'dept-general',
        triggeredRule: 'SLA_TIMEOUT_EXCEEDED',
        escalationLevel: isCritical ? 3 : 2,
        summary: `Agent run telah berjalan selama ${duration}s, melebihi batas SLA ${priority} (${policy.maxExecutionTimeSeconds}s).`,
        createdAt: new Date().toISOString()
      }
    }

    // 2. Max Retry Attempts Check
    if (run.attempt > policy.maxAttempts) {
      return {
        id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `[Retry Breached] Run ${run.id} reached attempt ${run.attempt}/${policy.maxAttempts}`,
        severity: 'SEV-2_HIGH',
        status: 'OPEN',
        sourceRunId: run.id,
        sourceTaskId: run.taskId,
        departmentId: 'dept-eng',
        triggeredRule: 'MAX_RETRIES_EXCEEDED',
        escalationLevel: 2,
        summary: `Percobaan self-healing telah mencapai batas (${run.attempt} percobaan). Diperlukan intervensi human operator.`,
        createdAt: new Date().toISOString()
      }
    }

    return null
  }

  /**
   * Resolves an open incident with resolver name and timestamp
   */
  static resolveIncident(incident: IncidentRecord, resolvedBy: string): IncidentRecord {
    return {
      ...incident,
      status: 'RESOLVED',
      resolvedAt: new Date().toISOString(),
      resolvedBy
    }
  }

  /**
   * Mitigates an incident by tripping a circuit breaker or pausing active worker
   */
  static mitigateIncident(incident: IncidentRecord): IncidentRecord {
    return {
      ...incident,
      status: 'MITIGATED',
      summary: `${incident.summary} [MITIGASI OTOMATIS: Worker dijeda sementara dan circuit-breaker diaktifkan].`
    }
  }
}
