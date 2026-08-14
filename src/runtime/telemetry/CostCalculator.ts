export interface ModelPricing {
  promptCostPer1M: number
  completionCostPer1M: number
  cachedCostPer1M: number
}

export const MODEL_PRICING_TABLE: Record<string, ModelPricing> = {
  'claude-3-5-sonnet-20241022': { promptCostPer1M: 3.0, completionCostPer1M: 15.0, cachedCostPer1M: 0.3 },
  'gpt-4o': { promptCostPer1M: 2.5, completionCostPer1M: 10.0, cachedCostPer1M: 1.25 },
  'hermes-3-llama-3.1-8b': { promptCostPer1M: 0.2, completionCostPer1M: 0.2, cachedCostPer1M: 0.05 },
  'hermes-3-llama-3.1-70b': { promptCostPer1M: 0.8, completionCostPer1M: 0.8, cachedCostPer1M: 0.2 },
  'mock-agent-simulation-v1': { promptCostPer1M: 0.0, completionCostPer1M: 0.0, cachedCostPer1M: 0.0 }
}

export class CostCalculator {
  static calculate(
    model: string,
    promptTokens: number,
    completionTokens: number,
    cachedTokens: number = 0
  ): number {
    const pricing = MODEL_PRICING_TABLE[model] || MODEL_PRICING_TABLE['hermes-3-llama-3.1-8b']
    const cost =
      (promptTokens / 1_000_000) * pricing.promptCostPer1M +
      (completionTokens / 1_000_000) * pricing.completionCostPer1M +
      (cachedTokens / 1_000_000) * pricing.cachedCostPer1M
    return Math.round(cost * 10000) / 10000
  }
}
