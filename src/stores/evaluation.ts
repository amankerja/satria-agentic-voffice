import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useEmployeeStore } from './employee'
import { AgentEvaluationLab } from '../services/evaluation/AgentEvaluationLab'
import type {
  BenchmarkSuiteType,
  AgentBenchmarkResult,
  AgentEvaluationLeaderboardItem,
  Employee
} from '../types'

export const useEvaluationStore = defineStore('evaluation', () => {
  const employeeStore = useEmployeeStore()

  const benchmarkHistory = ref<AgentBenchmarkResult[]>([])
  const isRunningBenchmark = ref<boolean>(false)
  const activeBenchmarkSuite = ref<BenchmarkSuiteType | 'ALL'>('ALL')
  const selectedEmployeeId = ref<string>('all')

  const leaderboard = computed<AgentEvaluationLeaderboardItem[]>(() => {
    return AgentEvaluationLab.generateLeaderboard(
      employeeStore.employees,
      benchmarkHistory.value
    )
  })

  const topPerformer = computed<AgentEvaluationLeaderboardItem | undefined>(() => {
    return leaderboard.value[0]
  })

  const filteredHistory = computed(() => {
    return benchmarkHistory.value.filter((b) => {
      const matchSuite = activeBenchmarkSuite.value === 'ALL' || b.suiteType === activeBenchmarkSuite.value
      const matchEmp = selectedEmployeeId.value === 'all' || b.employeeId === selectedEmployeeId.value
      return matchSuite && matchEmp
    })
  })

  async function runBenchmarkForEmployee(
    employee: Employee,
    suiteType: BenchmarkSuiteType
  ): Promise<AgentBenchmarkResult> {
    isRunningBenchmark.value = true
    try {
      // Simulate realistic execution delay for benchmark suite run
      await new Promise((resolve) => setTimeout(resolve, 300))
      const result = AgentEvaluationLab.runBenchmark(employee, suiteType)
      benchmarkHistory.value.unshift(result)
      return result
    } finally {
      isRunningBenchmark.value = false
    }
  }

  async function runFullLabSuite(): Promise<AgentBenchmarkResult[]> {
    isRunningBenchmark.value = true
    try {
      const results: AgentBenchmarkResult[] = []
      const suites: BenchmarkSuiteType[] = ['CODING', 'REASONING', 'EXTRACTION', 'LATENCY', 'COST']
      const activeEmps = employeeStore.activeEmployees.slice(0, 4) // Top primary workers

      for (const emp of activeEmps) {
        for (const suite of suites) {
          const res = AgentEvaluationLab.runBenchmark(emp, suite)
          results.push(res)
          benchmarkHistory.value.unshift(res)
        }
      }
      return results
    } finally {
      isRunningBenchmark.value = false
    }
  }

  return {
    benchmarkHistory,
    isRunningBenchmark,
    activeBenchmarkSuite,
    selectedEmployeeId,
    leaderboard,
    topPerformer,
    filteredHistory,
    runBenchmarkForEmployee,
    runFullLabSuite
  }
})
