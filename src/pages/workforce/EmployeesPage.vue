<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Employee Directory</h1>
          <UiBadge variant="info" size="sm" class="font-mono">{{ filteredEmployees.length }} Workforce Members</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Daftar seluruh digital workforce employee, peran, kapabilitas skill, dan status operasional
        </p>
      </div>

      <div class="flex items-center gap-3">
        <router-link to="/workforce/employees/new">
          <UiButton size="sm" variant="primary" :icon="Plus">
            New Employee
          </UiButton>
        </router-link>
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <!-- Department Filter Pills -->
        <div role="tablist" aria-label="Department filters" class="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            v-for="dept in ['All', ...departmentNames]"
            :key="dept"
            role="tab"
            :aria-selected="selectedDept === dept"
            :aria-label="`Department: ${dept}`"
            @click="selectedDept = dept"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap',
              selectedDept === dept
                ? 'bg-surface-container-high text-primary font-bold border border-outline'
                : 'text-muted hover:text-on-surface hover:bg-surface-container'
            ]"
          >
            {{ dept }}
          </button>
        </div>

        <!-- Status Filter & Search -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <!-- Status select -->
          <select
            v-model="selectedStatus"
            aria-label="Filter by employee status"
            class="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>

          <!-- Search Input -->
          <div class="relative w-full sm:w-64">
            <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="text"
              aria-label="Search employees by name, role, or skill"
              placeholder="Search name, role, skill..."
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <UiEmptyState
      v-if="filteredEmployees.length === 0"
      title="No employees found"
      description="Tidak ada karyawan digital yang cocok dengan filter atau pencarian Anda."
    >
      <UiButton variant="secondary" size="sm" @click="resetFilters">
        Reset Filters
      </UiButton>
    </UiEmptyState>

    <!-- Employees Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="emp in filteredEmployees"
        :key="emp.id"
        class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl p-4.5 space-y-4 transition shadow-sm flex flex-col justify-between"
      >
        <div class="space-y-3.5">
          <!-- Card Top: Avatar, Name, Status -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3 truncate">
              <img
                :src="emp.avatar"
                :alt="emp.name"
                class="w-12 h-12 rounded-full object-cover border-2 border-outline shrink-0 shadow-sm"
              />
              <div class="truncate">
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-on-surface truncate">{{ emp.name }}</h3>
                </div>
                <div class="text-xs font-semibold text-primary truncate mt-0.5">{{ emp.roleName }}</div>
                <div class="text-[10px] font-mono text-muted truncate">{{ emp.departmentName }}</div>
              </div>
            </div>

            <UiBadge
              :variant="emp.status === 'Active' ? 'success' : emp.status === 'Archived' ? 'error' : 'neutral'"
              size="sm"
            >
              {{ emp.status }}
            </UiBadge>
          </div>

          <!-- Description -->
          <p class="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {{ emp.description }}
          </p>

          <!-- Skills Chips -->
          <div class="space-y-1.5 pt-1">
            <div class="text-[10px] font-mono text-muted uppercase">Skills Capability:</div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="s in emp.skills.slice(0, 3)"
                :key="s.skillId"
                class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant text-on-surface-variant flex items-center gap-1"
              >
                <span :class="['font-bold', s.priority === 'P0' ? 'text-primary' : s.priority === 'P1' ? 'text-secondary' : 'text-muted']">
                  {{ s.priority }}
                </span>
                <span class="truncate max-w-27.5">{{ s.skillName || s.skillId }}</span>
              </span>
              <span v-if="emp.skills.length > 3" class="text-[9px] font-mono text-muted self-center px-1">
                +{{ emp.skills.length - 3 }} more
              </span>
            </div>
          </div>
        </div>

        <!-- Footer: Supervisor & Detail Link -->
        <div class="pt-3 border-t border-outline-variant flex items-center justify-between">
          <div class="text-[10px] font-mono text-muted truncate max-w-40">
            <span>Supervisor: </span>
            <span class="text-on-surface font-semibold">{{ emp.supervisorName || 'Project Lead' }}</span>
          </div>


          <router-link
            :to="`/workforce/employees/${emp.id}`"
            class="text-xs font-mono text-primary hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Details</span>
            <span>&rarr;</span>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import { useDepartmentStore } from '../../stores/department'
import { useEmployeeStore } from '../../stores/employee'

const departmentStore = useDepartmentStore()
const employeeStore = useEmployeeStore()

const selectedDept = ref('All')
const selectedStatus = ref('All')
const searchQuery = ref('')

onMounted(async () => {
  await Promise.all([
    departmentStore.fetchDepartments(),
    employeeStore.fetchEmployees()
  ])
})

const departmentNames = computed(() => {
  return departmentStore.departments.map((d) => d.name)
})

const filteredEmployees = computed(() => {
  return employeeStore.employees.filter((emp) => {
    const matchDept = selectedDept.value === 'All' || emp.departmentName.toLowerCase() === selectedDept.value.toLowerCase()
    const matchStatus = selectedStatus.value === 'All' || emp.status === selectedStatus.value
    const query = searchQuery.value.toLowerCase().trim()
    const matchQuery =
      query === '' ||
      emp.name.toLowerCase().includes(query) ||
      emp.roleName.toLowerCase().includes(query) ||
      emp.departmentName.toLowerCase().includes(query) ||
      emp.skills.some((s) => (s.skillName || s.skillId).toLowerCase().includes(query))

    return matchDept && matchStatus && matchQuery
  })
})

const resetFilters = () => {
  selectedDept.value = 'All'
  selectedStatus.value = 'All'
  searchQuery.value = ''
}
</script>
