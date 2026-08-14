import type { AgentRuntime, RuntimeMode } from './types'
import { MockRuntimeAdapter } from './mock/MockRuntimeAdapter'
import { HermesRuntimeAdapter } from './hermes/HermesRuntimeAdapter'

export class RuntimeFactory {
  private static instanceMap = new Map<RuntimeMode, AgentRuntime>()
  private static currentDefaultMode: RuntimeMode = 'mock' // Default to mock until hermes connection is selected

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
  }

  public static getDefaultMode(): RuntimeMode {
    return this.currentDefaultMode
  }

  public static reset(): void {
    this.instanceMap.clear()
    this.currentDefaultMode = 'mock'
  }
}
