import { describe, it, expect } from 'vitest'
import { TelemetryMapper } from '../runtime/telemetry/TelemetryMapper'
import { CostCalculator } from '../runtime/telemetry/CostCalculator'

describe('Telemetry Normalization & Mapping Engine (Phase 3.6)', () => {
  it('maps raw provider response to normalized RuntimeTelemetry (Test 1)', () => {
    const raw = {
      provider: 'Anthropic',
      model: 'claude-3-5-sonnet-20241022',
      promptTokens: 24100,
      completionTokens: 8310,
      cachedTokens: 1024,
      durationMs: 522000
    }

    const telemetry = TelemetryMapper.normalize(raw)

    expect(telemetry.provider).toBe('Anthropic')
    expect(telemetry.model).toBe('claude-3-5-sonnet-20241022')
    expect(telemetry.promptTokens).toBe(24100)
    expect(telemetry.completionTokens).toBe(8310)
    expect(telemetry.totalTokens).toBe(32410)
    expect(telemetry.cachedTokens).toBe(1024)
    expect(telemetry.durationMs).toBe(522000)
    expect(telemetry.estimatedCostUsd).toBeCloseTo(0.19725, 4)
  })

  it('calculates totalTokens as prompt + completion when not provided authoritatively (Test 2)', () => {
    const rawWithoutTotal = {
      promptTokens: 1500,
      completionTokens: 500
    }
    const tel1 = TelemetryMapper.normalize(rawWithoutTotal)
    expect(tel1.totalTokens).toBe(2000)

    const rawWithAuthoritativeTotal = {
      promptTokens: 1500,
      completionTokens: 500,
      totalTokens: 2050 // provider includes system reasoning overhead in total
    }
    const tel2 = TelemetryMapper.normalize(rawWithAuthoritativeTotal)
    expect(tel2.totalTokens).toBe(2050)
  })

  it('handles cached tokens safely and defaults to 0 when not provided (Test 3)', () => {
    const rawWithCached = {
      cachedTokens: 2048,
      promptTokens: 5000,
      completionTokens: 1000
    }
    const tel1 = TelemetryMapper.normalize(rawWithCached)
    expect(tel1.cachedTokens).toBe(2048)

    const rawWithoutCached = {
      promptTokens: 5000,
      completionTokens: 1000
    }
    const tel2 = TelemetryMapper.normalize(rawWithoutCached)
    expect(tel2.cachedTokens).toBe(0)
  })

  it('handles unknown model pricing gracefully without crashing (Test 5)', () => {
    const raw = {
      model: 'unknown-experimental-model-v99',
      promptTokens: 10000,
      completionTokens: 5000
    }

    const telemetry = TelemetryMapper.normalize(raw)
    expect(telemetry.model).toBe('unknown-experimental-model-v99')
    expect(telemetry.estimatedCostUsd).toBeNull()

    // Formatting in UI returns 'Cost unavailable'
    const formatted = CostCalculator.formatCost(telemetry.estimatedCostUsd)
    expect(formatted).toBe('Cost unavailable')
  })

  it('provides safe fallback telemetry when raw data is missing or empty (Test 7)', () => {
    const nullTelemetry = TelemetryMapper.normalize(null)
    expect(nullTelemetry.promptTokens).toBe(0)
    expect(nullTelemetry.completionTokens).toBe(0)
    expect(nullTelemetry.totalTokens).toBe(0)
    expect(nullTelemetry.cachedTokens).toBe(0)
    expect(nullTelemetry.durationMs).toBe(0)
    expect(nullTelemetry.model).toBe('hermes-3-llama-3.1-70b')
    expect(nullTelemetry.provider).toBe('hermes-cloud')

    const emptyTelemetry = TelemetryMapper.normalize({})
    expect(emptyTelemetry.promptTokens).toBe(0)
    expect(emptyTelemetry.completionTokens).toBe(0)
    expect(emptyTelemetry.totalTokens).toBe(0)
  })

  it('sanitizes input and does not leak auth headers or sensitive credentials (Privacy & Security)', () => {
    const rawWithSecrets = {
      apiKey: 'sk-ant-api03-secret123456789',
      authorization: 'Bearer sk-proj-super-secret',
      promptTokens: 100,
      completionTokens: 200,
      model: 'gpt-4o'
    }

    const telemetry: any = TelemetryMapper.normalize(rawWithSecrets)
    expect(telemetry.apiKey).toBeUndefined()
    expect(telemetry.authorization).toBeUndefined()
    expect(telemetry.promptTokens).toBe(100)
    expect(telemetry.completionTokens).toBe(200)
  })
})
