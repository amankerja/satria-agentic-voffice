<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Departments Directory</h1>
          <UiBadge variant="info" size="sm" class="font-mono">{{ departmentStore.departments.length }} Departments</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Divisi organisasi kerja digital SATRIA AI Workforce (Coding, Trainer, Side Hustle)
        </p>
      </div>

      <router-link to="/workforce/employees/new">
        <UiButton size="sm" variant="primary" :icon="Plus">
          New Employee
        </UiButton>
      </router-link>
    </div>

    <!-- Departments Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="dept in departmentStore.departments"
        :key="dept.id"
        class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl p-5 space-y-5 transition shadow-sm flex flex-col justify-between"
      >
        <div class="space-y-4">
          <!-- Top Icon & Info -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline flex items-center justify-center text-primary font-bold text-base">
                <component :is="getDeptIcon(dept.icon)" class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-base font-bold text-on-surface">{{ dept.name }}</h2>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-container-lowest text-muted border border-outline-variant">
                    {{ dept.code }}
                  </span>
                  <UiBadge variant="success" size="sm">Active</UiBadge>
                </div>
              </div>
            </div>
          </div>

          <p class="text-xs text-on-surface-variant leading-relaxed">
            {{ dept.description }}
          </p>

          <!-- Department Metrics -->
          <div class="grid grid-cols-2 gap-2.5 font-mono text-xs">
            <div class="p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg">
              <div class="text-[10px] text-muted uppercase">WORKFORCE</div>
              <div class="font-bold text-primary text-base mt-0.5">{{ getDeptEmployees(dept.id).length }}</div>
            </div>
            <div class="p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg">
              <div class="text-[10px] text-muted uppercase">ROLES</div>
              <div class="font-bold text-secondary text-base mt-0.5">{{ getDeptRoles(dept.id).length }}</div>
            </div>
          </div>

          <!-- Roles in this department -->
          <div class="space-y-2 pt-1">
            <div class="text-[10px] font-mono uppercase text-muted">Specialist Roster:</div>
            <div class="space-y-1.5">
              <div
                v-for="emp in getDeptEmployees(dept.id)"
                :key="emp.id"
                class="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg flex items-center justify-between text-xs"
              >
                <div class="flex items-center gap-2 truncate">
                  <img :src="emp.avatar" :alt="emp.name" class="w-6 h-6 rounded-full object-cover border border-outline shrink-0" />
                  <span class="font-semibold text-on-surface truncate">{{ emp.name }}</span>
                </div>
                <span class="text-[10px] font-mono text-muted truncate max-w-35">{{ emp.roleName }}</span>
              </div>

            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div class="pt-4 border-t border-outline-variant">
          <router-link :to="`/workforce/departments/${dept.id}`" class="w-full block">
            <UiButton variant="secondary" size="sm" class="w-full">
              Manage Department Details &rarr;
            </UiButton>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus, Code, GraduationCap, Briefcase, Building2 } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import { useDepartmentStore } from '../../stores/department'
import { useEmployeeStore } from '../../stores/employee'

const departmentStore = useDepartmentStore()
const employeeStore = useEmployeeStore()

onMounted(async () => {
  await Promise.all([
    departmentStore.fetchDepartments(),
    departmentStore.fetchAllRoles(),
    employeeStore.fetchEmployees()
  ])
})

const getDeptEmployees = (deptId: string) => {
  return employeeStore.employees.filter((e) => e.departmentId === deptId && e.status !== 'Archived')
}

const getDeptRoles = (deptId: string) => {
  return departmentStore.roles.filter((r) => r.departmentId === deptId)
}

const getDeptIcon = (iconName: string) => {
  switch (iconName) {
    case 'Code':
      return Code
    case 'GraduationCap':
      return GraduationCap
    case 'Briefcase':
      return Briefcase
    default:
      return Building2
  }
}
</script>
