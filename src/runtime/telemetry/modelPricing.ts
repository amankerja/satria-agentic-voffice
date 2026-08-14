export interface ModelPricing {
  provider: string
  model: string
  promptCostPer1M: number
  completionCostPer1M: number
  cachedCostPer1M?: number
  currency?: string
  effectiveFrom?: string
}

export const MODEL_PRICING_TABLE: Record<string, ModelPricing> = {
  'claude-3-5-sonnet-20241022': {
    provider: 'Anthropic',
    model: 'claude-3-5-sonnet-20241022',
    promptCostPer1M: 3.0,
    completionCostPer1M: 15.0,
    cachedCostPer1M: 0.3,
    currency: 'USD',
    effectiveFrom: '2024-10-22'
  },
  'claude-3-haiku-20240307': {
    provider: 'Anthropic',
    model: 'claude-3-haiku-20240307',
    promptCostPer1M: 0.25,
    completionCostPer1M: 1.25,
    cachedCostPer1M: 0.03,
    currency: 'USD',
    effectiveFrom: '2024-03-07'
  },
  'gpt-4o': {
    provider: 'OpenAI',
    model: 'gpt-4o',
    promptCostPer1M: 2.5,
    completionCostPer1M: 10.0,
    cachedCostPer1M: 1.25,
    currency: 'USD',
    effectiveFrom: '2024-08-01'
  },
  'gpt-4o-mini': {
    provider: 'OpenAI',
    model: 'gpt-4o-mini',
    promptCostPer1M: 0.15,
    completionCostPer1M: 0.6,
    cachedCostPer1M: 0.075,
    currency: 'USD',
    effectiveFrom: '2024-07-18'
  },
  'hermes-3-llama-3.1-8b': {
    provider: 'NousResearch',
    model: 'hermes-3-llama-3.1-8b',
    promptCostPer1M: 0.2,
    completionCostPer1M: 0.2,
    cachedCostPer1M: 0.05,
    currency: 'USD',
    effectiveFrom: '2024-08-15'
  },
  'hermes-3-llama-3.1-70b': {
    provider: 'NousResearch',
    model: 'hermes-3-llama-3.1-70b',
    promptCostPer1M: 0.8,
    completionCostPer1M: 0.8,
    cachedCostPer1M: 0.2,
    currency: 'USD',
    effectiveFrom: '2024-08-15'
  },
  'hermes-3-llama-3.1-405b': {
    provider: 'NousResearch',
    model: 'hermes-3-llama-3.1-405b',
    promptCostPer1M: 2.0,
    completionCostPer1M: 2.0,
    cachedCostPer1M: 0.5,
    currency: 'USD',
    effectiveFrom: '2024-08-15'
  },
  'mock-agent-simulation-v1': {
    provider: 'SatriaMock',
    model: 'mock-agent-simulation-v1',
    promptCostPer1M: 0.0,
    completionCostPer1M: 0.0,
    cachedCostPer1M: 0.0,
    currency: 'USD',
    effectiveFrom: '2026-01-01'
  }
}
