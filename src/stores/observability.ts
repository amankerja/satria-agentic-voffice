import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAgentRunStore } from './agentRun'
import { useScheduleStore } from './schedule'
import { globalWorkspaceLock } from '../services/WorkspaceLockService'
import { useHermesHealth } from '../composables/useHermesHealth'

export interface ProviderHealth {
  name: string
  status: 'healthy' | 'degraded' | 'offline' | 'mock'
  latencyMs: number
  lastChecked: string
}

export const useObservabilityStore = defineStore('observability', () => {
  const hermesHealth = useHermesHealth()
  const agentRunStore = useAgentRunStore()
  const scheduleStore = useScheduleStore()

  const lastSchedulerTick = ref<string>(new Date().toISOString())
  const schedulerStatus = ref<'healthy' | 'paused' | 'error'>('healthy')
  const providers = ref<ProviderHealth[]>([
    { name: 'Hermes Runtime', status: 'healthy', latencyMs: 24, lastChecked: new Date().toLocaleTimeString() },
    { name: 'Anthropic Claude', status: 'healthy', latencyMs: 180, lastChecked: new Date().toLocaleTimeString() },
    { name: 'OpenAI GPT-4o', status: 'healthy', latencyMs: 195, lastChecked: new Date().toLocaleTimeString() }
  ])

  // Active Runs
  const activeRunsCount = computed(() => {
    return agentRunStore.runs.filter((r) =>
      ['Starting', 'Running', 'Verifying', 'Waiting'].includes(r.status)
    ).length
  })

  // Failed Runs
  const failedRunsCount = computed(() => {
    return agentRunStore.runs.filter((r) => r.status === 'Failed').length
  })

  // Orphan Runs: Active runs with stale heartbeat (> 30s) or no runner lock
  const orphanRuns = computed(() => {
    const now = Date.now()
    return agentRunStore.runs.filter((r) => {
      if (!['Starting', 'Running', 'Verifying', 'Waiting'].includes(r.status)) return false
      if (!r.lastHeartbeatAt) return true
      const last = new Date(r.lastHeartbeatAt).getTime()
      return now - last > 30000
    })
  })

  const orphanRunsCount = computed(() => orphanRuns.value.length)

  // Runtime Health
  const runtimeHealth = computed(() => {
    if (hermesHealth.status.value === 'mock') return 'mock'
    if (hermesHealth.status.value === 'healthy') return 'healthy'
    if (hermesHealth.status.value === 'degraded') return 'degraded'
    return 'offline'
  })

  // Scheduler Health
  const schedulerHealth = computed(() => {
    const enabledSchedules = scheduleStore.schedules.filter((s) => s.enabled)
    if (enabledSchedules.length === 0) return 'paused'
    return schedulerStatus.value
  })

  // Active Workspace Locks
  const activeWorkspaceLocks = computed(() => {
    return globalWorkspaceLock.getAllLocks()
  })

  const activeWorkspaceLocksCount = computed(() => {
    return Object.keys(activeWorkspaceLocks.value).length
  })

  function recordSchedulerTick() {
    lastSchedulerTick.value = new Date().toISOString()
  }

  function setSchedulerStatus(status: 'healthy' | 'paused' | 'error') {
    schedulerStatus.value = status
  }

  return {
    runtimeHealth,
    activeRunsCount,
    failedRunsCount,
    orphanRuns,
    orphanRunsCount,
    schedulerHealth,
    lastSchedulerTick,
    activeWorkspaceLocks,
    activeWorkspaceLocksCount,
    providers,
    recordSchedulerTick,
    setSchedulerStatus
  }
})
