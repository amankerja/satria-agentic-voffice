import { ref, computed } from 'vue'
import { HermesClient } from '../runtime/hermes/HermesClient'
import { RuntimeFactory } from '../runtime/RuntimeFactory'
import type { RuntimeMode } from '../runtime/types'

export type HermesHealthStatus = 'healthy' | 'degraded' | 'offline' | 'mock' | 'checking'

const status = ref<HermesHealthStatus>('checking')
const latencyMs = ref<number>(0)
const gatewayVersion = ref<string>('1.0.0')
const errorMessage = ref<string | null>(null)
const lastChecked = ref<string>('')
let checkInterval: any = null

export function useHermesHealth() {
  const client = new HermesClient()
  const runtimeMode = computed<RuntimeMode>(() => RuntimeFactory.getDefaultMode())

  async function checkHealth() {
    if (runtimeMode.value === 'mock') {
      status.value = 'mock'
      latencyMs.value = 1
      errorMessage.value = null
      lastChecked.value = new Date().toLocaleTimeString()
      return
    }

    status.value = 'checking'
    try {
      const result = await client.healthCheck(4000)
      lastChecked.value = new Date().toLocaleTimeString()
      latencyMs.value = result.latencyMs

      if (result.ok) {
        status.value = result.latencyMs < 1000 ? 'healthy' : 'degraded'
        gatewayVersion.value = result.version || '1.0.0'
        errorMessage.value = null
      } else {
        status.value = 'offline'
        errorMessage.value = result.error || 'Gateway returned non-200'
      }
    } catch (err: any) {
      status.value = 'offline'
      latencyMs.value = 0
      errorMessage.value = err?.message || 'Failed to connect to Hermes Gateway'
      lastChecked.value = new Date().toLocaleTimeString()
    }
  }

  function startPolling(intervalMs = 30000) {
    checkHealth()
    if (!checkInterval && typeof window !== 'undefined') {
      checkInterval = setInterval(checkHealth, intervalMs)
    }
  }

  function stopPolling() {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }

  return {
    status,
    latencyMs,
    gatewayVersion,
    errorMessage,
    lastChecked,
    runtimeMode,
    checkHealth,
    startPolling,
    stopPolling
  }
}
