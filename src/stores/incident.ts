import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { IncidentEscalationEngine, DEFAULT_SLA_POLICIES } from '../services/sla/IncidentEscalationEngine'
import type { IncidentRecord, SlaPolicy } from '../types'

const SEED_INCIDENTS: IncidentRecord[] = [
  {
    id: 'inc-001',
    title: '[SLA Alert] Task Concurrency Mutex exceeded 60s execution timeout',
    severity: 'SEV-2_HIGH',
    status: 'RESOLVED',
    sourceRunId: 'run-101-01',
    sourceTaskId: 'tsk-101',
    departmentId: 'dept-eng',
    triggeredRule: 'SLA_TIMEOUT_EXCEEDED',
    escalationLevel: 2,
    summary: 'Execution took 78s against 60s SLA. Resolved after worker concurrency lock fix.',
    createdAt: '2026-08-16T08:15:00Z',
    resolvedAt: '2026-08-16T08:25:00Z',
    resolvedBy: 'Faqih (Owner)'
  }
]

export const useIncidentStore = defineStore('incident', () => {
  const incidents = ref<IncidentRecord[]>(SEED_INCIDENTS)
  const slaPolicies = ref<Record<string, SlaPolicy>>(DEFAULT_SLA_POLICIES)

  const openIncidents = computed(() => {
    return incidents.value.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING')
  })

  const criticalCount = computed(() => {
    return incidents.value.filter((i) => i.severity === 'SEV-1_CRITICAL' && i.status !== 'RESOLVED').length
  })

  const slaComplianceRate = computed(() => {
    const total = incidents.value.length
    if (total === 0) return 100
    const resolved = incidents.value.filter((i) => i.status === 'RESOLVED' || i.status === 'MITIGATED').length
    return Math.round((resolved / total) * 100)
  })

  function reportIncident(incident: IncidentRecord) {
    incidents.value.unshift(incident)
  }

  function resolveIncident(incidentId: string, resolvedBy: string = 'Workspace Owner') {
    const inc = incidents.value.find((i) => i.id === incidentId)
    if (inc) {
      const resolved = IncidentEscalationEngine.resolveIncident(inc, resolvedBy)
      Object.assign(inc, resolved)
    }
  }

  function mitigateIncident(incidentId: string) {
    const inc = incidents.value.find((i) => i.id === incidentId)
    if (inc) {
      const mitigated = IncidentEscalationEngine.mitigateIncident(inc)
      Object.assign(inc, mitigated)
    }
  }

  function triggerSimulatedIncident() {
    const dummyIncident: IncidentRecord = {
      id: `inc-${Date.now()}`,
      title: '[Simulated SLA Timeout] Agent Worker Stalled on Docker Container Spawn',
      severity: 'SEV-1_CRITICAL',
      status: 'OPEN',
      sourceRunId: 'run-sim-99',
      sourceTaskId: 'tsk-sim-99',
      departmentId: 'dept-eng',
      triggeredRule: 'SLA_TIMEOUT_EXCEEDED',
      escalationLevel: 3,
      summary: 'Task P0 running over 120s without progress emission. Auto-escalated to Owner.',
      createdAt: new Date().toISOString()
    }
    reportIncident(dummyIncident)
    return dummyIncident
  }

  return {
    incidents,
    slaPolicies,
    openIncidents,
    criticalCount,
    slaComplianceRate,
    reportIncident,
    resolveIncident,
    mitigateIncident,
    triggerSimulatedIncident
  }
})
