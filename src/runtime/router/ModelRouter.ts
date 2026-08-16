import type {
  ModelOptimizationPolicy,
  ModelRoutingDecision,
  RoutingTaskCategory,
  Task
} from '../../types'
import type { AgentRunInput } from '../types'
import { MODEL_PRICING_TABLE } from '../telemetry/modelPricing'

export class ModelRouter {
  /**
   * Automatically routes an agent execution request to the most cost-effective and capable model
   * based on task characteristics, instructions, and optimization policy.
   */
  static routeTask(
    task?: Partial<Task>,
    runInput?: Partial<AgentRunInput>,
    policy: ModelOptimizationPolicy = 'BALANCED'
  ): ModelRoutingDecision {
    const taskCategory = this.classifyTaskCategory(task, runInput)

    switch (policy) {
      case 'COST_OPTIMIZED':
        return this.routeCostOptimized(taskCategory)

      case 'QUALITY_FIRST':
        return this.routeQualityFirst(taskCategory)

      case 'LOW_LATENCY':
        return this.routeLowLatency(taskCategory)

      case 'BALANCED':
      default:
        return this.routeBalanced(taskCategory)
    }
  }

  /**
   * Classifies task into one of 5 routing workload categories
   */
  static classifyTaskCategory(
    task?: Partial<Task>,
    runInput?: Partial<AgentRunInput>
  ): RoutingTaskCategory {
    const mode = task?.executionMode
    const prompt = (task?.description || task?.title || runInput?.taskPrompt || '').toLowerCase()

    if (mode === 'EMAIL_INTELLIGENCE') {
      if (prompt.includes('rekap') || prompt.includes('extract') || prompt.includes('mutasi') || prompt.includes('csv')) {
        return 'FAST_EXTRACTION'
      }
      return 'SIMPLE_CLASSIFICATION'
    }

    if (mode === 'ENGINEERING_EXECUTION' || prompt.includes('bug') || prompt.includes('refactor') || prompt.includes('pull request') || prompt.includes('test') || prompt.includes('commit')) {
      return 'CODING_ENGINEERING'
    }

    if (mode === 'CROSS_SYSTEM' || prompt.includes('plan') || prompt.includes('arsitektur') || prompt.includes('analisis') || prompt.includes('audit')) {
      return 'DEEP_REASONING_PLANNING'
    }

    if (prompt.includes('klasifikasi') || prompt.includes('filter') || prompt.includes('kategori')) {
      return 'SIMPLE_CLASSIFICATION'
    }

    return 'GENERAL_AGENTIC'
  }

  private static routeBalanced(category: RoutingTaskCategory): ModelRoutingDecision {
    switch (category) {
      case 'CODING_ENGINEERING':
        return {
          selectedModel: 'claude-3-5-sonnet-20241022',
          selectedProvider: 'Anthropic',
          taskCategory: category,
          policy: 'BALANCED',
          estimatedCostPer1kTokens: 0.009,
          estimatedLatencyMs: 1200,
          reason: 'Balanced Policy: Model coding kelas atas (Claude 3.5 Sonnet) dipilih untuk akurasi sintaks dan unit testing.',
          fallbackModel: 'gpt-4o'
        }

      case 'DEEP_REASONING_PLANNING':
        return {
          selectedModel: 'claude-3-5-sonnet-20241022',
          selectedProvider: 'Anthropic',
          taskCategory: category,
          policy: 'BALANCED',
          estimatedCostPer1kTokens: 0.009,
          estimatedLatencyMs: 1400,
          reason: 'Balanced Policy: Reasoning mendalam untuk perencanaan multi-langkah dan mitigasi risiko.',
          fallbackModel: 'gpt-4o'
        }

      case 'FAST_EXTRACTION':
        return {
          selectedModel: 'gpt-4o-mini',
          selectedProvider: 'OpenAI',
          taskCategory: category,
          policy: 'BALANCED',
          estimatedCostPer1kTokens: 0.000375,
          estimatedLatencyMs: 450,
          reason: 'Balanced Policy: Model ekstraksi cepat hemat biaya (GPT-4o Mini) untuk parsing angka dan entitas email.',
          fallbackModel: 'claude-3-haiku-20240307'
        }

      case 'SIMPLE_CLASSIFICATION':
        return {
          selectedModel: 'hermes-3-llama-3.1-8b',
          selectedProvider: 'NousResearch',
          taskCategory: category,
          policy: 'BALANCED',
          estimatedCostPer1kTokens: 0.0002,
          estimatedLatencyMs: 300,
          reason: 'Balanced Policy: Model lokal/ringan hemat token (Hermes 3 8B) untuk filter cepat tanpa biaya LLM berlebih.',
          fallbackModel: 'gpt-4o-mini'
        }

      case 'GENERAL_AGENTIC':
      default:
        return {
          selectedModel: 'gpt-4o-mini',
          selectedProvider: 'OpenAI',
          taskCategory: category,
          policy: 'BALANCED',
          estimatedCostPer1kTokens: 0.000375,
          estimatedLatencyMs: 500,
          reason: 'Balanced Policy: Eksekusi umum dengan keseimbangan optimal antara biaya dan penalaran.',
          fallbackModel: 'hermes-3-llama-3.1-8b'
        }
    }
  }

  private static routeCostOptimized(category: RoutingTaskCategory): ModelRoutingDecision {
    return {
      selectedModel: category === 'CODING_ENGINEERING' ? 'gpt-4o-mini' : 'hermes-3-llama-3.1-8b',
      selectedProvider: category === 'CODING_ENGINEERING' ? 'OpenAI' : 'NousResearch',
      taskCategory: category,
      policy: 'COST_OPTIMIZED',
      estimatedCostPer1kTokens: 0.0002,
      estimatedLatencyMs: 350,
      reason: 'Cost-Optimized Policy: Menghemat biaya token hingga 90% menggunakan model efisien.',
      fallbackModel: 'claude-3-haiku-20240307'
    }
  }

  private static routeQualityFirst(category: RoutingTaskCategory): ModelRoutingDecision {
    return {
      selectedModel: 'claude-3-5-sonnet-20241022',
      selectedProvider: 'Anthropic',
      taskCategory: category,
      policy: 'QUALITY_FIRST',
      estimatedCostPer1kTokens: 0.009,
      estimatedLatencyMs: 1300,
      reason: 'Quality-First Policy: Mengutamakan akurasi mutlak dan zero-defect deliverable.',
      fallbackModel: 'gpt-4o'
    }
  }

  private static routeLowLatency(category: RoutingTaskCategory): ModelRoutingDecision {
    return {
      selectedModel: 'claude-3-haiku-20240307',
      selectedProvider: 'Anthropic',
      taskCategory: category,
      policy: 'LOW_LATENCY',
      estimatedCostPer1kTokens: 0.00075,
      estimatedLatencyMs: 250,
      reason: 'Low-Latency Policy: Respon cepat di bawah 300ms untuk workflow interaktif real-time.',
      fallbackModel: 'gpt-4o-mini'
    }
  }

  /**
   * Helper to retrieve pricing details for selected model
   */
  static getModelPricing(modelName: string) {
    return MODEL_PRICING_TABLE[modelName] || {
      provider: 'Custom',
      model: modelName,
      promptCostPer1M: 1.0,
      completionCostPer1M: 2.0,
      currency: 'USD'
    }
  }
}
