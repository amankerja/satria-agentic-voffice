<template>
  <div class="space-y-6">
    <!-- Header & Quick Actions -->
    <div class="border-b border-outline-variant pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Workforce Command Center</h1>
          <UiBadge variant="success" size="sm" class="font-mono">{{ employeeStore.activeEmployees.length }} Active Workforce</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Pusat tata kelola struktur organisasi digital: Department, Employee, Skill Registry, dan Tool Registry
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link to="/workforce/skills">
          <UiButton size="sm" variant="secondary" :icon="Sparkles">
            Skill Registry
          </UiButton>
        </router-link>
        <router-link to="/workforce/employees/new">
          <UiButton size="sm" variant="primary" :icon="Plus">
            New Employee
          </UiButton>
        </router-link>
      </div>
    </div>

    <!-- 5 High-Level Workforce KPI Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Total Workforce</span>
          <Users class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary mt-1.5">
          {{ employeeStore.employees.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          Digital Personnel
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Active Status</span>
          <UserCheck class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary mt-1.5">
          {{ employeeStore.activeEmployees.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          {{ operationalPercentage }}% Operational ({{ employeeStore.activeEmployees.length }}/{{ employeeStore.employees.length }})
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Departments</span>
          <Building2 class="w-4 h-4 text-secondary" />
        </div>
        <div class="text-2xl font-bold font-mono text-secondary mt-1.5">
          {{ departmentStore.departments.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          Coding, Trainer, Side Hustle
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Skill Registry</span>
          <Sparkles class="w-4 h-4 text-[#f59e0b]" />
        </div>
        <div class="text-2xl font-bold font-mono text-on-surface mt-1.5">
          {{ skillStore.skills.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          {{ skillStore.externalSkills.length }} External Packages
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-mono text-muted uppercase">Workforce Tools</span>
          <Wrench class="w-4 h-4 text-tertiary" />
        </div>
        <div class="text-2xl font-bold font-mono text-tertiary mt-1.5">
          {{ toolStore.tools.length }}
        </div>
        <div class="text-[10px] text-on-surface-variant font-mono mt-0.5">
          Configured Toolsets
        </div>
      </UiCard>
    </div>

    <!-- Departments Summary Grid (3 Departments) -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-on-surface">Department Structure</h2>
          <p class="text-xs text-muted">Pemetaan alokasi peran spesialis di setiap divisi kerja</p>
        </div>
        <router-link to="/workforce/departments" class="text-xs font-mono text-primary hover:underline flex items-center gap-1">
          <span>View All Departments</span>
          <span>&rarr;</span>
        </router-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="dept in departmentStore.departments"
          :key="dept.id"
          class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl p-4.5 space-y-4 transition shadow-sm flex flex-col justify-between"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-surface-container-high border border-outline flex items-center justify-center text-primary font-bold text-xs">
                  <component :is="getDeptIcon(dept.icon)" class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-on-surface">{{ dept.name }}</h3>
                  <span class="text-[10px] font-mono text-muted">{{ dept.code }}</span>
                </div>
              </div>
              <UiBadge variant="success" size="sm" class="font-mono">
                {{ getDeptEmployees(dept.id).length }} Employees
              </UiBadge>
            </div>

            <p class="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
              {{ dept.description }}
            </p>

            <!-- Roles / Employees pills -->
            <div class="space-y-1.5 pt-1">
              <div class="text-[10px] font-mono uppercase text-muted">Specialist Roles:</div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="emp in getDeptEmployees(dept.id)"
                  :key="emp.id"
                  class="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant text-[10px] font-mono text-on-surface-variant flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span class="font-medium text-on-surface">{{ emp.name }}</span>
                  <span class="text-muted text-[9px]">({{ emp.roleName }})</span>
                </span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-outline-variant flex items-center justify-between">
            <span class="text-[11px] font-mono text-muted">{{ getDeptRoles(dept.id).length }} Defined Roles</span>
            <router-link
              :to="`/workforce/departments/${dept.id}`"
              class="text-xs font-mono text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage Department</span>
              <span>&rarr;</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Digital Organization Hierarchy Chart (Blueprint Matrix) -->
    <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-bold text-on-surface">Organization Relationship & Workflow Matrix</h3>
          <p class="text-xs text-muted">Alur delegasi pekerjaan: Request &rarr; Planner &rarr; Specialist &rarr; QC &rarr; Security</p>
        </div>
        <UiBadge variant="neutral" size="sm" class="font-mono">Hierarchical Structure</UiBadge>
      </div>

      <div class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-x-auto">
        <div class="min-w-160 flex items-center justify-between gap-3 text-center text-xs font-mono">
          <!-- Stage 1: Request -->

          <div class="flex-1 p-3 bg-surface-container-low border border-outline-variant rounded-xl space-y-1">
            <div class="text-[10px] text-muted uppercase">01. INTAKE</div>
            <div class="font-bold text-on-surface">Project Request</div>
            <div class="text-[10px] text-on-surface-variant">User / Requirement</div>
          </div>

          <div class="text-primary font-bold text-sm">&rarr;</div>

          <!-- Stage 2: Planning -->
          <div class="flex-1 p-3 bg-primary-container/10 border border-primary-container/40 rounded-xl space-y-1">
            <div class="text-[10px] text-primary uppercase">02. PLANNING</div>
            <div class="font-bold text-primary">Raka (Planner)</div>
            <div class="text-[10px] text-on-surface-variant">Task Decomposition</div>
          </div>

          <div class="text-primary font-bold text-sm">&rarr;</div>

          <!-- Stage 3: Execution -->
          <div class="flex-1 p-3 bg-surface-container-low border border-outline-variant rounded-xl space-y-1">
            <div class="text-[10px] text-secondary uppercase">03. EXECUTION</div>
            <div class="font-bold text-secondary">Maya & Bima</div>
            <div class="text-[10px] text-on-surface-variant">Frontend & Backend API</div>
          </div>

          <div class="text-primary font-bold text-sm">&rarr;</div>

          <!-- Stage 4: QC & Security -->
          <div class="flex-1 p-3 bg-surface-container-low border border-outline-variant rounded-xl space-y-1">
            <div class="text-[10px] text-tertiary uppercase">04. VALIDATION</div>
            <div class="font-bold text-tertiary">Dimas & Ardi</div>
            <div class="text-[10px] text-on-surface-variant">QC & Security Audit</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Workforce Roster Quick Table -->
    <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-on-surface">Workforce Roster Spotlight</h3>
          <p class="text-xs text-muted">12 karyawan digital aktif dalam 3 departemen kerja</p>
        </div>
        <router-link to="/workforce/employees" class="text-xs font-mono text-primary hover:underline">
          Open Employee Directory &rarr;
        </router-link>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <router-link
          v-for="emp in employeeStore.employees.slice(0, 8)"
          :key="emp.id"
          :to="`/workforce/employees/${emp.id}`"
          class="p-3 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant hover:border-outline rounded-xl transition flex items-center gap-3 group"
        >
          <img
            :src="emp.avatar"
            :alt="emp.name"
            class="w-10 h-10 rounded-full object-cover border border-outline shrink-0"
          />
          <div class="truncate">
            <div class="text-xs font-bold text-on-surface group-hover:text-primary transition truncate">
              {{ emp.name }}
            </div>
            <div class="text-[10px] text-muted truncate">{{ emp.roleName }}</div>
            <div class="text-[9px] font-mono text-secondary truncate">{{ emp.departmentName }}</div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  Users,
  UserCheck,
  Building2,
  Sparkles,
  Wrench,
  Plus,
  Code,
  GraduationCap,
  Briefcase
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiCard from '../../components/ui/UiCard.vue'
import { useDepartmentStore } from '../../stores/department'
import { useEmployeeStore } from '../../stores/employee'
import { useSkillStore } from '../../stores/skill'
import { useWorkforceToolStore } from '../../stores/workforceTool'

const departmentStore = useDepartmentStore()
const employeeStore = useEmployeeStore()
const skillStore = useSkillStore()
const toolStore = useWorkforceToolStore()

const operationalPercentage = computed(() => {
  const total = employeeStore.employees.length
  if (total === 0) return 100
  return Math.round((employeeStore.activeEmployees.length / total) * 100)
})

onMounted(async () => {
  await Promise.all([
    departmentStore.fetchDepartments(),
    departmentStore.fetchAllRoles(),
    employeeStore.fetchEmployees(),
    skillStore.fetchSkills(),
    toolStore.fetchTools()
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
