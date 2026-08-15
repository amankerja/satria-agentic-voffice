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

export const useGovernanceStore = defineStore('governance', () => {
  const agentRunStore = useAgentRunStore()
  const reviewStore = useReviewStore()
  const employeeStore = useEmployeeStore()
  const departmentStore = useDepartmentStore()

  const activeTimeRange = ref<'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'All Time'>('All Time')
  const selectedDepartmentId = ref<string>('all')
  const selectedModel = ref<string>('all')
  const budgetCapUsd = ref<number>(50.0) // default monthly budget cap in USD
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

  return {
    activeTimeRange,
    selectedDepartmentId,
    selectedModel,
    budgetCapUsd,
    loading,
    filter,
    summary,
    loadAllData,
    setTimeRange,
    setDepartmentFilter,
    setModelFilter,
    setBudgetCap
  }
})
