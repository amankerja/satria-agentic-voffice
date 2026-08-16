import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAgentRunStore } from './agentRun'
import { useReviewStore } from './review'
import { useEmployeeStore } from './employee'
import { useDepartmentStore } from './department'
import {
  GovernanceAggregator,
  type GovernanceTimeFilter,
  type GovernanceDashboardSummary
} from '../runtime/governance/GovernanceAggregator'
import { ModelRouter } from '../runtime/router/ModelRouter'
import type {
  ModelOptimizationPolicy,
  ModelRoutingDecision,
  Task
} from '../types'
import type { AgentRunInput } from '../runtime/types'

export const useGovernanceStore = defineStore('governance', () => {
  const agentRunStore = useAgentRunStore()
  const reviewStore = useReviewStore()
  const employeeStore = useEmployeeStore()
  const departmentStore = useDepartmentStore()

  const activeTimeRange = ref<'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'All Time'>('All Time')
  const selectedDepartmentId = ref<string>('all')
  const selectedModel = ref<string>('all')
  const budgetCapUsd = ref<number>(50.0) // default monthly budget cap in USD
  const hardCapEnabled = ref<boolean>(true)
  const modelRouterPolicy = ref<ModelOptimizationPolicy>('BALANCED')
  const departmentBudgets = ref<Record<string, number>>({
    'dept-eng': 30.0,
    'dept-side-hustle': 15.0,
    'dept-trainer': 10.0
  })
  const loading = ref<boolean>(false)

  const filter = computed<GovernanceTimeFilter>(() => ({
    range: activeTimeRange.value,
    departmentId: selectedDepartmentId.value,
    model: selectedModel.value
  }))

  const summary = computed<GovernanceDashboardSummary>(() => {
    return GovernanceAggregator.aggregate({
      runs: agentRunStore.runs,
      results: reviewStore.results,
      reviews: reviewStore.reviews,
      employees: employeeStore.employees,
      departments: departmentStore.departments,
      filter: filter.value,
      budgetCapUsd: budgetCapUsd.value
    })
  })

  async function loadAllData() {
    loading.value = true
    try {
      await Promise.all([
        agentRunStore.fetchRuns(),
        reviewStore.fetchReviews(),
        reviewStore.fetchResults(),
        employeeStore.fetchEmployees(),
        departmentStore.fetchDepartments()
      ])
    } finally {
      loading.value = false
    }
  }

  function setTimeRange(range: 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'All Time') {
    activeTimeRange.value = range
  }

  function setDepartmentFilter(deptId: string) {
    selectedDepartmentId.value = deptId
  }

  function setModelFilter(model: string) {
    selectedModel.value = model
  }

  function setBudgetCap(amountUsd: number) {
    if (amountUsd > 0) {
      budgetCapUsd.value = amountUsd
    }
  }

  function setModelRouterPolicy(policy: ModelOptimizationPolicy) {
    modelRouterPolicy.value = policy
  }

  function setDepartmentBudget(deptId: string, amountUsd: number) {
    departmentBudgets.value[deptId] = Math.max(0, amountUsd)
  }

  function routeModelForTask(
    task?: Partial<Task>,
    runInput?: Partial<AgentRunInput>,
    overridePolicy?: ModelOptimizationPolicy
  ): ModelRoutingDecision {
    const policy = overridePolicy || modelRouterPolicy.value
    return ModelRouter.routeTask(task, runInput, policy)
  }

  return {
    activeTimeRange,
    selectedDepartmentId,
    selectedModel,
    budgetCapUsd,
    hardCapEnabled,
    modelRouterPolicy,
    departmentBudgets,
    loading,
    filter,
    summary,
    loadAllData,
    setTimeRange,
    setDepartmentFilter,
    setModelFilter,
    setBudgetCap,
    setModelRouterPolicy,
    setDepartmentBudget,
    routeModelForTask
  }
})
