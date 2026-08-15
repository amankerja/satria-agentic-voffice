import type { AgentRuntime, RuntimeMode } from './types'
import { MockRuntimeAdapter } from './mock/MockRuntimeAdapter'
import { HermesRuntimeAdapter } from './hermes/HermesRuntimeAdapter'

export class RuntimeFactory {
  private static instanceMap = new Map<RuntimeMode, AgentRuntime>()
  private static currentDefaultMode: RuntimeMode =
    typeof localStorage !== 'undefined' && localStorage.getItem('satria_runtime_mode') === 'mock'
      ? 'mock'
      : (typeof localStorage !== 'undefined' && localStorage.getItem('satria_runtime_mode') as RuntimeMode) || 'hermes'

  public static getRuntime(mode?: RuntimeMode): AgentRuntime {
    const selectedMode = mode || this.currentDefaultMode
    if (!this.instanceMap.has(selectedMode)) {
      if (selectedMode === 'hermes') {
        this.instanceMap.set(selectedMode, new HermesRuntimeAdapter())
      } else {
        this.instanceMap.set(selectedMode, new MockRuntimeAdapter())
      }
    }
    return this.instanceMap.get(selectedMode)!
  }

  public static setDefaultMode(mode: RuntimeMode): void {
    this.currentDefaultMode = mode
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('satria_runtime_mode', mode)
    }
  }

  public static getDefaultMode(): RuntimeMode {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('satria_runtime_mode') as RuntimeMode
      if (saved) return saved
    }
    return this.currentDefaultMode
  }

  public static reset(): void {
    this.instanceMap.clear()
    this.currentDefaultMode = 'hermes'
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('satria_runtime_mode')
    }
  }
}
