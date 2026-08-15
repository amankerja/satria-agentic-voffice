import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AiRuntimeConfig } from '../types'
import { useSettingsStore } from './settings'

const DEFAULT_POPULAR_MODELS = [
  'fast-work-free',
  'gemini/gemini-2.5-flash',
  'gemini/gemini-3.5-flash',
  'kc/google/gemini-2.5-flash',
  'kc/anthropic/claude-sonnet-4-20250514',
  '1/qwen-3.7-max',
  '1/claude-sonnet-4.5',
  'kr/deepseek-3.2',
  'kc/deepseek/deepseek-chat',
  'hermes-3-llama-3.1-70b',
  'gpt-4o-mini',
  'gpt-4o'
]

export const useAiRuntimeConfigStore = defineStore('aiRuntimeConfig', () => {
  const settingsStore = useSettingsStore()

  // State
  const hermesBaseUrl = ref<string>(
    localStorage.getItem('satria_hermes_url') ||
    (import.meta as any).env?.VITE_HERMES_URL ||
    '/hermes-api'
  )
  const hermesApiKey = ref<string>(
    localStorage.getItem('satria_hermes_api_key') ||
    (import.meta as any).env?.VITE_HERMES_API_KEY ||
    'satria-local-dev'
  )
  const llmBaseUrl = ref<string>(
    localStorage.getItem('satria_llm_base_url') ||
    'http://localhost:20128/v1'
  )
  const selectedModel = ref<string>(
    localStorage.getItem('satria_hermes_model') ||
    (import.meta as any).env?.VITE_HERMES_MODEL ||
    'fast-work-free'
  )
  const selectedProvider = ref<string>(
    localStorage.getItem('satria_hermes_provider') ||
    'custom'
  )
  const temperature = ref<number>(
    parseFloat(localStorage.getItem('satria_hermes_temp') || '0.2')
  )
  const maxTokens = ref<number>(
    parseInt(localStorage.getItem('satria_hermes_max_tokens') || '4096', 10)
  )
  const availableModels = ref<string[]>(
    JSON.parse(localStorage.getItem('satria_available_models') || 'null') || [...DEFAULT_POPULAR_MODELS]
  )

  const isTesting = ref<boolean>(false)
  const connectionStatus = ref<'idle' | 'success' | 'error'>('idle')
  const connectionMessage = ref<string>('')
  const latencyMs = ref<number>(0)

  // Computed
  const config = computed<AiRuntimeConfig>(() => ({
    hermesBaseUrl: hermesBaseUrl.value,
    hermesApiKey: hermesApiKey.value,
    llmBaseUrl: llmBaseUrl.value,
    selectedModel: selectedModel.value,
    selectedProvider: selectedProvider.value,
    temperature: temperature.value,
    maxTokens: maxTokens.value,
    availableModels: availableModels.value
  }))

  // Actions
  function initConfig() {
    const savedUrl = localStorage.getItem('satria_hermes_url')
    if (savedUrl) hermesBaseUrl.value = savedUrl

    const savedKey = localStorage.getItem('satria_hermes_api_key')
    if (savedKey) hermesApiKey.value = savedKey

    const savedLlmUrl = localStorage.getItem('satria_llm_base_url')
    if (savedLlmUrl) llmBaseUrl.value = savedLlmUrl

    const savedModel = localStorage.getItem('satria_hermes_model')
    if (savedModel) selectedModel.value = savedModel

    const savedProvider = localStorage.getItem('satria_hermes_provider')
    if (savedProvider) selectedProvider.value = savedProvider

    const savedTemp = localStorage.getItem('satria_hermes_temp')
    if (savedTemp) temperature.value = parseFloat(savedTemp)

    const savedMaxTokens = localStorage.getItem('satria_hermes_max_tokens')
    if (savedMaxTokens) maxTokens.value = parseInt(savedMaxTokens, 10)

    const savedModels = localStorage.getItem('satria_available_models')
    if (savedModels) {
      try {
        availableModels.value = JSON.parse(savedModels)
      } catch {
        // keep defaults
      }
    }
  }

  function setModel(model: string) {
    selectedModel.value = model.trim()
    localStorage.setItem('satria_hermes_model', selectedModel.value)
    if (!availableModels.value.includes(selectedModel.value)) {
      availableModels.value.unshift(selectedModel.value)
      localStorage.setItem('satria_available_models', JSON.stringify(availableModels.value))
    }
  }

  async function saveConfig(updates?: Partial<AiRuntimeConfig>) {
    if (updates) {
      if (updates.hermesBaseUrl !== undefined) hermesBaseUrl.value = updates.hermesBaseUrl
      if (updates.hermesApiKey !== undefined) hermesApiKey.value = updates.hermesApiKey
      if (updates.llmBaseUrl !== undefined) llmBaseUrl.value = updates.llmBaseUrl
      if (updates.selectedModel !== undefined) selectedModel.value = updates.selectedModel
      if (updates.selectedProvider !== undefined) selectedProvider.value = updates.selectedProvider
      if (updates.temperature !== undefined) temperature.value = updates.temperature
      if (updates.maxTokens !== undefined) maxTokens.value = updates.maxTokens
      if (updates.availableModels !== undefined) availableModels.value = updates.availableModels
    }

    localStorage.setItem('satria_hermes_url', hermesBaseUrl.value)
    localStorage.setItem('satria_hermes_api_key', hermesApiKey.value)
    localStorage.setItem('satria_llm_base_url', llmBaseUrl.value)
    localStorage.setItem('satria_hermes_model', selectedModel.value)
    localStorage.setItem('satria_hermes_provider', selectedProvider.value)
    localStorage.setItem('satria_hermes_temp', String(temperature.value))
    localStorage.setItem('satria_hermes_max_tokens', String(maxTokens.value))
    localStorage.setItem('satria_available_models', JSON.stringify(availableModels.value))

    // Persist to user settings in database
    await settingsStore.updateSettings({
      aiRuntime: {
        hermesBaseUrl: hermesBaseUrl.value,
        hermesApiKey: hermesApiKey.value,
        llmBaseUrl: llmBaseUrl.value,
        selectedModel: selectedModel.value,
        selectedProvider: selectedProvider.value,
        temperature: temperature.value,
        maxTokens: maxTokens.value,
        availableModels: availableModels.value
      }
    })
  }

  /**
   * Test connection to Hermes Gateway or local LLM server and fetch models list
   */
  async function testConnectionAndFetchModels(): Promise<{ ok: boolean; modelsCount: number; message: string }> {
    isTesting.value = true
    connectionStatus.value = 'idle'
    connectionMessage.value = 'Testing connection...'
    const start = performance.now()

    try {
      // 1. Try querying models from the LLM Base URL directly or via Hermes proxy
      const targetModelUrls = [
        `${llmBaseUrl.value.replace(/\/+$/, '')}/models`,
        `${hermesBaseUrl.value.replace(/\/+$/, '')}/v1/models`,
        '/hermes-api/v1/models'
      ]

      let fetchedList: string[] = []

      for (const url of targetModelUrls) {
        try {
          const res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${hermesApiKey.value}`,
              'X-API-Key': hermesApiKey.value
            },
            signal: AbortSignal.timeout(4000)
          })

          if (res.ok) {
            const data = await res.json()
            if (data?.data && Array.isArray(data.data)) {
              fetchedList = data.data.map((m: any) => m.id || m.name).filter(Boolean)
              break
            } else if (Array.isArray(data)) {
              fetchedList = data.map((m: any) => m.id || m.name || m).filter(Boolean)
              break
            }
          }
        } catch {
          // try next endpoint
        }
      }

      // Also verify Hermes Gateway /health
      let hermesHealthy = false
      try {
        const healthRes = await fetch(`${hermesBaseUrl.value.replace(/\/+$/, '')}/health`, {
          headers: {
            'Authorization': `Bearer ${hermesApiKey.value}`,
            'X-API-Key': hermesApiKey.value
          },
          signal: AbortSignal.timeout(3000)
        })
        hermesHealthy = healthRes.ok
      } catch {
        // ignore
      }

      const elapsed = Math.round(performance.now() - start)
      latencyMs.value = elapsed

      if (fetchedList.length > 0) {
        // Merge with existing models without duplicates
        const merged = Array.from(new Set([...fetchedList, ...availableModels.value]))
        availableModels.value = merged
        localStorage.setItem('satria_available_models', JSON.stringify(merged))

        connectionStatus.value = 'success'
        connectionMessage.value = `Connected (${elapsed}ms). Loaded ${fetchedList.length} models from endpoint.`
        return { ok: true, modelsCount: fetchedList.length, message: connectionMessage.value }
      }

      if (hermesHealthy) {
        connectionStatus.value = 'success'
        connectionMessage.value = `Hermes Gateway Online (${elapsed}ms). Using preset model list.`
        return { ok: true, modelsCount: availableModels.value.length, message: connectionMessage.value }
      }

      connectionStatus.value = 'error'
      connectionMessage.value = `Connection failed (${elapsed}ms). Pastikan Hermes Gateway / LLM Server aktif.`
      return { ok: false, modelsCount: 0, message: connectionMessage.value }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start)
      latencyMs.value = elapsed
      connectionStatus.value = 'error'
      connectionMessage.value = `Error: ${err?.message || 'Network error'}`
      return { ok: false, modelsCount: 0, message: connectionMessage.value }
    } finally {
      isTesting.value = false
    }
  }

  return {
    hermesBaseUrl,
    hermesApiKey,
    llmBaseUrl,
    selectedModel,
    selectedProvider,
    temperature,
    maxTokens,
    availableModels,
    isTesting,
    connectionStatus,
    connectionMessage,
    latencyMs,
    config,
    initConfig,
    setModel,
    saveConfig,
    testConnectionAndFetchModels
  }
})
