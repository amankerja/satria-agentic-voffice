import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Department, EmployeeRole } from '../types'
import { MockDepartmentRepository, MockEmployeeRoleRepository } from '../repositories'

export const useDepartmentStore = defineStore('department', () => {
  const deptRepo = new MockDepartmentRepository()
  const roleRepo = new MockEmployeeRoleRepository()

  const departments = ref<Department[]>([])
  const roles = ref<EmployeeRole[]>([])
  const currentDepartment = ref<Department | null>(null)
  const loading = ref<boolean>(false)

  async function fetchDepartments() {
    loading.value = true
    try {
      departments.value = await deptRepo.getAll()
    } finally {
      loading.value = false
    }
  }

  async function fetchDepartmentById(id: string) {
    loading.value = true
    try {
      const dept = await deptRepo.getById(id)
      currentDepartment.value = dept || null
      return dept
    } finally {
      loading.value = false
    }
  }

  async function fetchAllRoles() {
    loading.value = true
    try {
      roles.value = await roleRepo.getAll()
      return roles.value
    } finally {
      loading.value = false
    }
  }

  async function fetchRolesByDepartment(departmentId: string) {
    loading.value = true
    try {
      const deptRoles = await roleRepo.getByDepartment(departmentId)
      return deptRoles
    } finally {
      loading.value = false
    }
  }

  return {
    departments,
    roles,
    currentDepartment,
    loading,
    fetchDepartments,
    fetchDepartmentById,
    fetchAllRoles,
    fetchRolesByDepartment
  }
})
