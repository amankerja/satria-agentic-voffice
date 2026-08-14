import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TaskAssignment, AssignmentStatus, Employee, SkillMatchResult } from '../types'
import { MockAssignmentRepository } from '../repositories'

export const useAssignmentStore = defineStore('assignment', () => {
  const assignmentRepo = new MockAssignmentRepository()

  const assignments = ref<TaskAssignment[]>([])
  const currentAssignment = ref<TaskAssignment | null>(null)
  const loading = ref<boolean>(false)

  const activeAssignments = computed(() =>
    assignments.value.filter((a) => a.status === 'In Progress' || a.status === 'Assigned' || a.status === 'Queued')
  )

  const completedAssignments = computed(() =>
    assignments.value.filter((a) => a.status === 'Completed')
  )

  async function fetchAssignments() {
    loading.value = true
    try {
      assignments.value = await assignmentRepo.getAll()
    } finally {
      loading.value = false
    }
  }

  async function fetchAssignmentById(id: string) {
    loading.value = true
    try {
      const assignment = await assignmentRepo.getById(id)
      currentAssignment.value = assignment || null
      return assignment
    } finally {
      loading.value = false
    }
  }

  async function fetchByTaskId(taskId: string) {
    return await assignmentRepo.getByTaskId(taskId)
  }

  async function fetchByEmployeeId(employeeId: string) {
    return await assignmentRepo.getByEmployeeId(employeeId)
  }

  async function createAssignment(assignmentData: Omit<TaskAssignment, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    try {
      const newAssignment = await assignmentRepo.create(assignmentData)
      assignments.value.unshift(newAssignment)
      return newAssignment
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id: string, status: AssignmentStatus) {
    const updated = await assignmentRepo.updateStatus(id, status)
    if (updated) {
      const idx = assignments.value.findIndex((a) => a.id === id)
      if (idx >= 0) {
        assignments.value[idx] = { ...updated }
      }
      if (currentAssignment.value?.id === id) {
        currentAssignment.value = { ...updated }
      }
    }
    return updated
  }

  async function cancelAssignment(id: string) {
    return await updateStatus(id, 'Cancelled')
  }

  /**
   * Evaluates skill matching and eligibility for an employee against task requirements
   */
  function calculateSkillMatch(
    employee: Employee,
    requiredSkillIds: string[] = [],
    optionalSkillIds: string[] = []
  ): SkillMatchResult {
    const employeeSkillIds = employee.skills.map((s) => s.skillId)

    const matchedRequiredSkills = requiredSkillIds.filter((id) => employeeSkillIds.includes(id))
    const missingRequiredSkills = requiredSkillIds.filter((id) => !employeeSkillIds.includes(id))

    const matchedOptionalSkills = optionalSkillIds.filter((id) => employeeSkillIds.includes(id))
    const missingOptionalSkills = optionalSkillIds.filter((id) => !employeeSkillIds.includes(id))

    const requiredMatchPercentage =
      requiredSkillIds.length === 0 ? 100 : Math.round((matchedRequiredSkills.length / requiredSkillIds.length) * 100)

    const optionalMatchPercentage =
      optionalSkillIds.length === 0 ? 100 : Math.round((matchedOptionalSkills.length / optionalSkillIds.length) * 100)

    const isEligible = employee.status === 'Active' && missingRequiredSkills.length === 0

    let warning: string | undefined
    if (employee.status !== 'Active') {
      warning = `Employee is currently ${employee.status} and cannot be assigned new tasks.`
    } else if (missingRequiredSkills.length > 0) {
      warning = `Missing ${missingRequiredSkills.length} required skill(s). Assignment not recommended.`
    } else if (missingOptionalSkills.length > 0) {
      warning = `Missing ${missingOptionalSkills.length} optional skill(s), but all required skills are matched.`
    }

    return {
      requiredMatchPercentage,
      optionalMatchPercentage,
      matchedRequiredSkills,
      missingRequiredSkills,
      matchedOptionalSkills,
      missingOptionalSkills,
      isEligible,
      warning
    }
  }

  return {
    assignments,
    currentAssignment,
    loading,
    activeAssignments,
    completedAssignments,
    fetchAssignments,
    fetchAssignmentById,
    fetchByTaskId,
    fetchByEmployeeId,
    createAssignment,
    updateStatus,
    cancelAssignment,
    calculateSkillMatch
  }
})
