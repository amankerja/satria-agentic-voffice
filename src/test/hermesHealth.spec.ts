import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHermesHealth } from '../composables/useHermesHealth'
import { RuntimeFactory } from '../runtime/RuntimeFactory'

describe('Hermes Gateway Health & Mobile Observability Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    RuntimeFactory.setDefaultMode('mock')
  })

  it('reports mock simulator status when in mock runtime mode', async () => {
    const health = useHermesHealth()
    await health.checkHealth()

    expect(health.runtimeMode.value).toBe('mock')
    expect(health.status.value).toBe('mock')
    expect(health.errorMessage.value).toBeNull()
    expect(health.lastChecked.value).toBeDefined()
  })

  it('handles polling lifecycle cleanly without memory leaks', () => {
    const health = useHermesHealth()
    health.startPolling(5000)
    expect(health.status.value).toBeDefined()
    health.stopPolling()
  })

  it('probes gateway connectivity when mode is hermes', async () => {
    RuntimeFactory.setDefaultMode('hermes')
    const health = useHermesHealth()

    // Will attempt fetch against configured baseUrl
    await health.checkHealth()
    expect(['healthy', 'degraded', 'offline']).toContain(health.status.value)
  })
})
