import type { RuntimeTelemetry } from '../types'
import { CostCalculator } from './CostCalculator'

export interface RawTelemetryInput {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  cachedTokens?: number
  model?: string
  provider?: string
  durationMs?: number
  estimatedCostUsd?: number | null
  // Extra provider-specific fields to sanitize/ignore
  [key: string]: any
}

export class TelemetryMapper {
  /**
   * Normalizes raw provider/runtime telemetry into a standard RuntimeTelemetry object.
   * Strips any sensitive fields and computes totalTokens and cost safely.
   */
  static normalize(
    raw: RawTelemetryInput | null | undefined,
    fallbackProvider: string = 'hermes-cloud',
    fallbackModel: string = 'hermes-3-llama-3.1-70b'
  ): RuntimeTelemetry {
    if (!raw) {
      return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cachedTokens: 0,
        model: fallbackModel,
        provider: fallbackProvider,
        durationMs: 0,
        estimatedCostUsd: CostCalculator.calculate(fallbackModel, 0, 0, 0)
      }
    }

    const provider = typeof raw.provider === 'string' && raw.provider.trim()
      ? raw.provider.trim()
      : fallbackProvider

    const model = typeof raw.model === 'string' && raw.model.trim()
      ? raw.model.trim()
      : fallbackModel

    const promptTokens = typeof raw.promptTokens === 'number' && !isNaN(raw.promptTokens)
      ? Math.max(0, Math.round(raw.promptTokens))
      : 0

    const completionTokens = typeof raw.completionTokens === 'number' && !isNaN(raw.completionTokens)
      ? Math.max(0, Math.round(raw.completionTokens))
      : 0

    const cachedTokens = typeof raw.cachedTokens === 'number' && !isNaN(raw.cachedTokens)
      ? Math.max(0, Math.round(raw.cachedTokens))
      : 0

    const totalTokens = typeof raw.totalTokens === 'number' && !isNaN(raw.totalTokens) && raw.totalTokens >= 0
      ? Math.round(raw.totalTokens)
      : promptTokens + completionTokens

    const durationMs = typeof raw.durationMs === 'number' && !isNaN(raw.durationMs)
      ? Math.max(0, Math.round(raw.durationMs))
      : 0

    let estimatedCostUsd: number | null
    if (typeof raw.estimatedCostUsd === 'number' && !isNaN(raw.estimatedCostUsd)) {
      estimatedCostUsd = raw.estimatedCostUsd
    } else if (raw.estimatedCostUsd === null) {
      estimatedCostUsd = null
    } else {
      estimatedCostUsd = CostCalculator.calculate(model, promptTokens, completionTokens, cachedTokens)
    }

    return {
      provider,
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      cachedTokens,
      durationMs,
      estimatedCostUsd
    }
  }
}
