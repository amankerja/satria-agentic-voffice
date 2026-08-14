<template>
  <div class="space-y-6">
    <!-- Back & Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-2">
        <router-link to="/workforce/departments" class="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-primary transition">
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Back to Departments</span>
        </router-link>

        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline flex items-center justify-center text-primary font-bold text-lg">
            <component :is="getDeptIcon(currentDepartment?.icon || 'Building2')" class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold text-on-surface">{{ currentDepartment?.name || 'Department' }}</h1>
              <UiBadge variant="success" size="sm" class="font-mono">{{ currentDepartment?.code }}</UiBadge>
            </div>
            <p class="text-xs text-muted mt-0.5">
              {{ currentDepartment?.description }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <router-link to="/workforce/employees/new">
          <UiButton size="sm" variant="primary" :icon="Plus">
            Add Employee
          </UiButton>
        </router-link>
      </div>
    </div>

    <!-- Department Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Allocated Workforce</span>
          <Users class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary mt-2">
          {{ deptEmployees.length }} <span class="text-xs font-normal text-muted">personnel</span>
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Configured Roles</span>
          <Briefcase class="w-4 h-4 text-secondary" />
        </div>
        <div class="text-2xl font-bold font-mono text-secondary mt-2">
          {{ deptRoles.length }} <span class="text-xs font-normal text-muted">defined roles</span>
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Operational Status</span>
          <CheckCircle2 class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-on-surface mt-2">
          100% <span class="text-xs font-normal text-muted">Ready</span>
        </div>
      </UiCard>
    </div>

    <!-- Main 2-Column Layout: Left = Employee Roster, Right = Roles & Responsibilities -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Employees List (2 cols) -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-on-surface">Department Workforce Roster</h2>
          <span class="text-xs font-mono text-muted">{{ deptEmployees.length }} Active</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="emp in deptEmployees"
            :key="emp.id"
            class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl p-4 space-y-3 transition shadow-sm flex flex-col justify-between"
          >
            <div class="space-y-2.5">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-3">
                  <img :src="emp.avatar" :alt="emp.name" class="w-10 h-10 rounded-full object-cover border border-outline shrink-0" />
                  <div>
                    <h3 class="text-sm font-bold text-on-surface">{{ emp.name }}</h3>
                    <div class="text-[11px] text-muted font-mono">{{ emp.roleName }}</div>
                  </div>
                </div>
                <UiBadge :variant="emp.status === 'Active' ? 'success' : 'neutral'" size="sm">
                  {{ emp.status }}
                </UiBadge>
              </div>

              <p class="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                {{ emp.description }}
              </p>

              <!-- Skills tags -->
              <div class="space-y-1 pt-1">
                <div class="text-[9px] font-mono text-muted uppercase">Assigned Skills:</div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="s in emp.skills.slice(0, 3)"
                    :key="s.skillId"
                    class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant text-on-surface-variant flex items-center gap-1"
                  >
                    <span class="text-primary font-bold">{{ s.priority }}</span>
                    <span>{{ s.skillName || s.skillId }}</span>
                  </span>
                  <span v-if="emp.skills.length > 3" class="text-[9px] font-mono text-muted self-center">
                    +{{ emp.skills.length - 3 }} more
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-outline-variant flex items-center justify-between">
              <span class="text-[10px] font-mono text-muted">Supervisor: {{ emp.supervisorName || 'Lead' }}</span>
              <router-link :to="`/workforce/employees/${emp.id}`" class="text-xs font-mono text-primary hover:underline">
                View Profile &rarr;
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Defined Roles & Responsibilities Summary (1 col) -->
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4 flex flex-col justify-between">
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-bold text-on-surface">Role Specifications</h3>
            <p class="text-xs text-muted">Tanggung jawab kerja dan fungsi spesialis</p>
          </div>

          <div class="space-y-3.5">
            <div
              v-for="role in deptRoles"
              :key="role.id"
              class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-on-surface">{{ role.name }}</span>
                <UiBadge variant="neutral" size="sm" class="font-mono text-[9px]">Role</UiBadge>
              </div>
              <p class="text-[11px] text-muted leading-relaxed">
                {{ role.description }}
              </p>

              <!-- Responsibilities Bullet points -->
              <div class="space-y-1 pt-1 border-t border-outline-variant/60">
                <div
                  v-for="(resp, idx) in role.responsibilities.slice(0, 3)"
                  :key="idx"
                  class="flex items-start gap-1.5 text-[10px] text-on-surface-variant font-mono"
                >
                  <span class="text-primary">&bull;</span>
                  <span class="line-clamp-1">{{ resp }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  Plus,
  Users,
  Briefcase,
  CheckCircle2,
  Code,
  GraduationCap,
  Building2
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiCard from '../../components/ui/UiCard.vue'
import { useDepartmentStore } from '../../stores/department'
import { useEmployeeStore } from '../../stores/employee'

const route = useRoute()
const departmentStore = useDepartmentStore()
const employeeStore = useEmployeeStore()

const deptId = computed(() => route.params.id as string)

onMounted(async () => {
  await Promise.all([
    departmentStore.fetchDepartments(),
    departmentStore.fetchAllRoles(),
    departmentStore.fetchDepartmentById(deptId.value),
    employeeStore.fetchEmployees()
  ])
})

const currentDepartment = computed(() => {
  return departmentStore.departments.find((d) => d.id === deptId.value)
})

const deptEmployees = computed(() => {
  return employeeStore.employees.filter((e) => e.departmentId === deptId.value && e.status !== 'Archived')
})

const deptRoles = computed(() => {
  return departmentStore.roles.filter((r) => r.departmentId === deptId.value)
})

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
