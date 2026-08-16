import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { IncidentEscalationEngine } from '../services/sla/IncidentEscalationEngine'
import { usePresenceStore } from '../stores/presence'
import { useIncidentStore } from '../stores/incident'
import type { AgentRun } from '../types'

describe('SATRIA AI Workforce — Presence & SLA Incident Subsystems (Phase 8 & 9)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('1. Presence & Collaborative Stream (Phase 8)', () => {
    it('initializes collaborators and tracks online peers reactively', () => {
      const store = usePresenceStore()
      expect(store.users.length).toBeGreaterThan(0)
      expect(store.onlineUsers.length).toBeGreaterThan(0)

      store.updateUserLocation('usr-owner-01', '/incidents', 'tsk-p0-99')
      const owner = store.users.find((u) => u.userId === 'usr-owner-01')
      expect(owner?.currentRoute).toBe('/incidents')
      expect(owner?.currentTaskId).toBe('tsk-p0-99')
    })

    it('logs and broadcasts collaborative activity across the workspace', () => {
      const store = usePresenceStore()
      const initialCount = store.activities.length

      store.logActivity('Faqih (Owner)', 'mitigated_incident', 'INCIDENT', 'inc-001', 'SLA Alert')
      expect(store.activities.length).toBe(initialCount + 1)
      expect(store.activities[0].action).toBe('mitigated_incident')
    })
  })

  describe('2. Enterprise SLA & Incident Escalation Engine (Phase 9)', () => {
    const mockP0Run = {
      id: 'run-p0-breach',
      taskId: 'tsk-p0-101',
      employeeId: 'emp-bima',
      employeeName: 'Bima Satria',
      employeeRole: 'Backend Engineer',
      status: 'Running',
      attempt: 1,
      durationSeconds: 95, // Exceeds P0 60s limit
      startedAt: '2026-08-16T10:00:00Z',
      runtime: 'hermes',
      logs: []
    } as unknown as AgentRun

    it('detects P0 SLA timeout and auto-generates SEV-1 Critical Incident', () => {
      const incident = IncidentEscalationEngine.evaluateRunSla(mockP0Run, { priority: 'Urgent' })

      expect(incident).not.toBeNull()
      expect(incident?.severity).toBe('SEV-1_CRITICAL')
      expect(incident?.triggeredRule).toBe('SLA_TIMEOUT_EXCEEDED')
      expect(incident?.escalationLevel).toBe(3)
    })

    it('detects retry attempts breach and triggers human intervention incident', () => {
      const retryBreachRun: AgentRun = {
        ...mockP0Run,
        durationSeconds: 20,
        attempt: 4 // Exceeds P1 3 max attempts
      }

      const incident = IncidentEscalationEngine.evaluateRunSla(retryBreachRun, { priority: 'High' })

      expect(incident).not.toBeNull()
      expect(incident?.severity).toBe('SEV-2_HIGH')
      expect(incident?.triggeredRule).toBe('MAX_RETRIES_EXCEEDED')
    })

    it('mitigates and resolves incidents seamlessly via Pinia store', () => {
      const store = useIncidentStore()
      const sim = store.triggerSimulatedIncident()

      expect(store.openIncidents.some((i) => i.id === sim.id)).toBe(true)

      store.mitigateIncident(sim.id)
      const mitigated = store.incidents.find((i) => i.id === sim.id)
      expect(mitigated?.status).toBe('MITIGATED')

      store.resolveIncident(sim.id, 'Faqih (Owner)')
      const resolved = store.incidents.find((i) => i.id === sim.id)
      expect(resolved?.status).toBe('RESOLVED')
      expect(resolved?.resolvedBy).toBe('Faqih (Owner)')
    })
  })
})
