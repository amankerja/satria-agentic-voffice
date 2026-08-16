import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useEmployeeStore } from './employee'
import { AgentAclEngine } from '../services/delegation/AgentAclEngine'
import { MultiAgentDelegationManager } from '../services/delegation/MultiAgentDelegationManager'
import type {
  DelegationPlan,
  AgentAclPolicy,
  Employee
} from '../types'

export const useDelegationStore = defineStore('delegation', () => {
  const employeeStore = useEmployeeStore()

  const plans = ref<DelegationPlan[]>([])
  const activePlanId = ref<string | null>(null)
  const isExecuting = ref<boolean>(false)
  const employeePolicies = ref<Record<string, AgentAclPolicy>>({})

  const activePlan = computed<DelegationPlan | undefined>(() => {
    return plans.value.find((p) => p.planId === activePlanId.value) || plans.value[0]
  })

  function getEmployeePolicy(employeeId: string): AgentAclPolicy {
    if (employeePolicies.value[employeeId]) {
      return employeePolicies.value[employeeId]
    }
    const emp = employeeStore.employees.find((e) => e.id === employeeId)
    if (emp) {
      const defaultPolicy = AgentAclEngine.getDefaultPolicy(emp)
      employeePolicies.value[employeeId] = defaultPolicy
      return defaultPolicy
    }
    return {
      employeeId,
      roleLevel: 'WORKER',
      canDelegate: false,
      maxDelegationDepth: 0,
      allowedDelegateeRoleIds: [],
      maxSubTaskBudgetUsd: 0.05,
      inheritedToolWhiteList: ['tool-filesystem']
    }
  }

  function updateEmployeePolicy(policy: AgentAclPolicy) {
    employeePolicies.value[policy.employeeId] = { ...policy }
  }

  function createPlan(parentTaskId: string, goal: string): DelegationPlan {
    const defaultSupervisor: Employee = {
      id: 'emp-raka',
      name: 'Raka Pratama',
      roleId: 'role-planner',
      roleName: 'Lead Project Planner & Architect',
      departmentId: 'dept-eng',
      departmentName: 'Engineering',
      avatar: '',
      status: 'Active',
      description: 'Lead planner',
      skills: [],
      toolIds: ['tool-filesystem'],
      permissions: [],
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01'
    }

    const defaultBackend: Employee = {
      id: 'emp-bima',
      name: 'Bima Wicaksono',
      roleId: 'role-backend',
      roleName: 'Senior Backend Engineer',
      departmentId: 'dept-eng',
      departmentName: 'Engineering',
      avatar: '',
      status: 'Active',
      description: 'Backend',
      skills: [],
      toolIds: ['tool-filesystem'],
      permissions: [],
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01'
    }

    const supervisor = employeeStore.employees.find((e) => e.id === 'emp-raka' || e.roleId?.includes('planner')) ||
      employeeStore.employees[0] ||
      defaultSupervisor

    const available: Employee[] = employeeStore.employees.length > 0
      ? employeeStore.employees
      : [supervisor, defaultBackend]

    const plan = MultiAgentDelegationManager.createPlan(
      parentTaskId,
      supervisor,
      goal,
      available,
      employeePolicies.value
    )
    plans.value.unshift(plan)
    activePlanId.value = plan.planId
    return plan
  }

  async function executeActivePlan(): Promise<DelegationPlan | null> {
    if (!activePlan.value) return null
    isExecuting.value = true
    try {
      const completed = await MultiAgentDelegationManager.executePlan(activePlan.value)
      return completed
    } finally {
      isExecuting.value = false
    }
  }

  return {
    plans,
    activePlanId,
    isExecuting,
    employeePolicies,
    activePlan,
    getEmployeePolicy,
    updateEmployeePolicy,
    createPlan,
    executeActivePlan
  }
})
