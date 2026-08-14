import { MODEL_PRICING_TABLE, type ModelPricing } from './modelPricing'

export class CostCalculator {
  /**
   * Calculates estimated cost in USD based on model pricing table.
   * Returns null if pricing is unknown.
   */
  static calculate(
    model: string,
    promptTokens: number,
    completionTokens: number,
    cachedTokens: number = 0
  ): number | null {
    const pricing = MODEL_PRICING_TABLE[model]
    if (!pricing) {
      return null
    }

    const pTokens = Math.max(0, promptTokens || 0)
    const cTokens = Math.max(0, completionTokens || 0)
    const kTokens = Math.max(0, cachedTokens || 0)

    const promptCost = (pTokens / 1_000_000) * pricing.promptCostPer1M
    const completionCost = (cTokens / 1_000_000) * pricing.completionCostPer1M
    const cachedCost = (kTokens / 1_000_000) * (pricing.cachedCostPer1M ?? 0)

    const rawTotal = promptCost + completionCost + cachedCost
    return Math.round(rawTotal * 1_000_000) / 1_000_000
  }

  /**
   * Retrieves pricing specification for a model.
   */
  static getPricing(model: string): ModelPricing | undefined {
    return MODEL_PRICING_TABLE[model]
  }

  /**
   * Checks whether pricing is registered for the specified model.
   */
  static hasPricing(model: string): boolean {
    return Boolean(MODEL_PRICING_TABLE[model])
  }

  /**
   * Formats numeric cost to display string (e.g. "$0.18", "$0.0024", "Cost unavailable").
   */
  static formatCost(cost: number | null | undefined, currency: string = '$'): string {
    if (cost === null || cost === undefined || isNaN(cost)) {
      return 'Cost unavailable'
    }
    if (cost === 0) {
      return `${currency}0.00`
    }
    if (cost < 0.01) {
      return `${currency}${cost.toFixed(4)}`
    }
    return `${currency}${cost.toFixed(2)}`
  }

  /**
   * Formats token integer to localized string (e.g. "32,410", "Unavailable").
   */
  static formatTokens(tokens: number | null | undefined): string {
    if (tokens === null || tokens === undefined || isNaN(tokens)) {
      return 'Unavailable'
    }
    return Math.round(tokens).toLocaleString('en-US')
  }

  /**
   * Formats duration in seconds or milliseconds into human-readable format.
   * e.g. "45s", "08m 42s", "01h 12m 30s"
   */
  static formatDuration(duration: number, isMs: boolean = false): string {
    if (duration === null || duration === undefined || isNaN(duration) || duration < 0) {
      return '0s'
    }

    const totalSeconds = isMs ? Math.floor(duration / 1000) : Math.floor(duration)
    if (totalSeconds < 60) {
      return `${totalSeconds}s`
    }

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')

    if (hours > 0) {
      const hh = String(hours).padStart(2, '0')
      return `${hh}h ${mm}m ${ss}s`
    }

    return `${mm}m ${ss}s`
  }
}
