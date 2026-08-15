import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Employee, EmployeeSkillAssignment, EmploymentStatus } from '../types'
import { MockEmployeeRepository } from '../repositories'

export const useEmployeeStore = defineStore('employee', () => {
  const repo = new MockEmployeeRepository()

  const employees = ref<Employee[]>([])
  const currentEmployee = ref<Employee | null>(null)
  const loading = ref<boolean>(false)

  const activeEmployees = computed(() => employees.value.filter((e) => e.status === 'Active'))
  const archivedEmployees = computed(() => employees.value.filter((e) => e.status === 'Archived'))
  const draftEmployees = computed(() => employees.value.filter((e) => e.status === 'Draft'))

  async function fetchEmployees() {
    loading.value = true
    try {
      employees.value = await repo.getAll()
      return employees.value
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployeeById(id: string) {
    loading.value = true
    try {
      const emp = await repo.getById(id)
      currentEmployee.value = emp || null
      return emp
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployeesByDepartment(departmentId: string) {
    loading.value = true
    try {
      const deptEmployees = await repo.getByDepartment(departmentId)
      return deptEmployees
    } finally {
      loading.value = false
    }
  }

  async function createEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    try {
      const created = await repo.create(data)
      employees.value.push(created)
      return created
    } finally {
      loading.value = false
    }
  }

  async function updateEmployee(id: string, updates: Partial<Employee>) {
    loading.value = true
    try {
      const updated = await repo.update(id, updates)
      if (updated) {
        const idx = employees.value.findIndex((e) => e.id === id)
        if (idx >= 0) {
          employees.value[idx] = updated
        }
        if (currentEmployee.value && currentEmployee.value.id === id) {
          currentEmployee.value = updated
        }
      }
      return updated
    } finally {
      loading.value = false
    }
  }

  async function updateEmployeeStatus(id: string, status: EmploymentStatus) {
    loading.value = true
    try {
      const updated = await repo.updateStatus(id, status)
      if (updated) {
        const idx = employees.value.findIndex((e) => e.id === id)
        if (idx >= 0) {
          employees.value[idx] = updated
        }
        if (currentEmployee.value && currentEmployee.value.id === id) {
          currentEmployee.value = updated
        }
      }
      return updated
    } finally {
      loading.value = false
    }
  }

  async function assignSkill(employeeId: string, assignment: EmployeeSkillAssignment) {
    loading.value = true
    try {
      const updated = await repo.assignSkill(employeeId, assignment)
      if (updated) {
        const idx = employees.value.findIndex((e) => e.id === employeeId)
        if (idx >= 0) {
          employees.value[idx] = updated
        }
        if (currentEmployee.value && currentEmployee.value.id === employeeId) {
          currentEmployee.value = updated
        }
      }
      return updated
    } finally {
      loading.value = false
    }
  }

  async function removeSkill(employeeId: string, skillId: string) {
    loading.value = true
    try {
      const updated = await repo.removeSkill(employeeId, skillId)
      if (updated) {
        const idx = employees.value.findIndex((e) => e.id === employeeId)
        if (idx >= 0) {
          employees.value[idx] = updated
        }
        if (currentEmployee.value && currentEmployee.value.id === employeeId) {
          currentEmployee.value = updated
        }
      }
      return updated
    } finally {
      loading.value = false
    }
  }

  async function fetchEmployeesByWorkspace(_workspaceId?: string) {
    return fetchEmployees()
  }

  async function archiveEmployee(id: string) {
    return updateEmployeeStatus(id, 'Archived')
  }

  return {
    employees,
    currentEmployee,
    loading,
    activeEmployees,
    archivedEmployees,
    draftEmployees,
    fetchEmployees,
    fetchEmployeesByWorkspace,
    fetchEmployeeById,
    fetchEmployeesByDepartment,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
    assignSkill,
    removeSkill,
    archiveEmployee
  }
})
