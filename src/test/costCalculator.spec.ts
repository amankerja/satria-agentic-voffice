import { describe, it, expect } from 'vitest'
import { CostCalculator } from '../runtime/telemetry/CostCalculator'

describe('CostCalculator & Model Pricing Engine (Phase 3.6)', () => {
  it('calculates token costs for Claude 3.5 Sonnet correctly (Test 4)', () => {
    // 10,000 prompt tokens ($3/1M) + 2,000 completion tokens ($15/1M) = 0.03 + 0.03 = 0.06
    const cost1 = CostCalculator.calculate('claude-3-5-sonnet-20241022', 10000, 2000)
    expect(cost1).toBe(0.06)

    // With cached tokens: 10k prompt + 2k completion + 5k cached ($0.30/1M = $0.0015)
    const cost2 = CostCalculator.calculate('claude-3-5-sonnet-20241022', 10000, 2000, 5000)
    expect(cost2).toBe(0.0615)
  })

  it('calculates token costs for Hermes 3 models accurately', () => {
    // Hermes 3 8B: $0.20/1M prompt, $0.20/1M completion
    const cost8b = CostCalculator.calculate('hermes-3-llama-3.1-8b', 10000, 2000)
    expect(cost8b).toBe(0.0024)

    // Hermes 3 70B: $0.80/1M prompt, $0.80/1M completion
    // 10,000 prompt ($0.008) + 2,000 completion ($0.0016) = $0.0096
    const cost70b = CostCalculator.calculate('hermes-3-llama-3.1-70b', 10000, 2000)
    expect(cost70b).toBe(0.0096)
  })

  it('calculates token costs for OpenAI GPT-4o and GPT-4o-mini', () => {
    // GPT-4o: $2.50/1M prompt, $10.00/1M completion
    const costGpt4o = CostCalculator.calculate('gpt-4o', 10000, 2000)
    expect(costGpt4o).toBe(0.045)

    // GPT-4o-mini: $0.15/1M prompt, $0.60/1M completion
    const costMini = CostCalculator.calculate('gpt-4o-mini', 10000, 2000)
    expect(costMini).toBe(0.0027)
  })

  it('evaluates mock agent runner as zero cost', () => {
    const mockCost = CostCalculator.calculate('mock-agent-simulation-v1', 50000, 50000, 10000)
    expect(mockCost).toBe(0)
  })

  it('returns null for unknown model and reports cost unavailable', () => {
    const unknownCost = CostCalculator.calculate('non-existent-ai-v1', 10000, 2000)
    expect(unknownCost).toBeNull()
    expect(CostCalculator.hasPricing('non-existent-ai-v1')).toBe(false)
  })

  it('formats cost values with correct currency and precision', () => {
    expect(CostCalculator.formatCost(0.18)).toBe('$0.18')
    expect(CostCalculator.formatCost(0.0024)).toBe('$0.0024')
    expect(CostCalculator.formatCost(0)).toBe('$0.00')
    expect(CostCalculator.formatCost(null)).toBe('Cost unavailable')
    expect(CostCalculator.formatCost(undefined)).toBe('Cost unavailable')
    expect(CostCalculator.formatCost(NaN)).toBe('Cost unavailable')
  })

  it('formats token numbers with thousand separators', () => {
    expect(CostCalculator.formatTokens(32410)).toBe('32,410')
    expect(CostCalculator.formatTokens(0)).toBe('0')
    expect(CostCalculator.formatTokens(null)).toBe('Unavailable')
    expect(CostCalculator.formatTokens(undefined)).toBe('Unavailable')
  })

  it('formats durations in seconds and milliseconds correctly (Test 8)', () => {
    expect(CostCalculator.formatDuration(45)).toBe('45s')
    expect(CostCalculator.formatDuration(522)).toBe('08m 42s')
    expect(CostCalculator.formatDuration(3670)).toBe('01h 01m 10s')

    // Millisecond mode
    expect(CostCalculator.formatDuration(522000, true)).toBe('08m 42s')
    expect(CostCalculator.formatDuration(15000, true)).toBe('15s')
    expect(CostCalculator.formatDuration(-10)).toBe('0s')
  })
})
