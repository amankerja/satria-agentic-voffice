<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Back & Top Header Bar -->
    <div class="border-b border-outline-variant pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="space-y-2">
        <router-link to="/workforce/employees" class="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-primary transition">
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Back to Employee Directory</span>
        </router-link>

        <div class="flex items-center gap-4">
          <img
            :src="employee?.avatar || defaultAvatar"
            :alt="employee?.name"
            class="w-14 h-14 rounded-full object-cover border-2 border-primary shrink-0 shadow-md"
          />
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold text-on-surface">{{ employee?.name || 'Employee Profile' }}</h1>
              <UiBadge
                :variant="employee?.status === 'Active' ? 'success' : employee?.status === 'Archived' ? 'error' : 'neutral'"
                size="sm"
                class="font-mono"
              >
                {{ employee?.status }}
              </UiBadge>
              <span
                :class="[
                  'px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1',
                  currentWorkState === 'Running' ? 'bg-primary-container/20 text-primary animate-pulse' : 'bg-surface-container-high text-on-surface-variant'
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="currentWorkState === 'Running' ? 'bg-primary' : 'bg-muted'"></span>
                {{ currentWorkState }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs font-mono text-muted mt-0.5">
              <span class="text-primary font-bold">{{ employee?.roleName }}</span>
              <span>&bull;</span>
              <span class="text-secondary">{{ employee?.departmentName }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UiButton
          v-if="employee?.status !== 'Archived'"
          size="sm"
          variant="secondary"
          :icon="Archive"
          @click="handleArchive"
        >
          Archive
        </UiButton>
        <UiButton
          v-else
          size="sm"
          variant="secondary"
          :icon="CheckCircle2"
          @click="handleRestore"
        >
          Restore to Active
        </UiButton>
      </div>
    </div>

    <!-- 8 Tabs Navigation -->
    <div class="flex items-center gap-1 border-b border-outline-variant overflow-x-auto scrollbar-none pb-px">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap flex items-center gap-2',
          activeTab === tab.id
            ? 'border-primary text-primary font-bold bg-surface-container/50'
            : 'border-transparent text-muted hover:text-on-surface hover:bg-surface-container-low/50'
        ]"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
        <span v-if="tab.count !== undefined" class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-container-high">
          {{ tab.count }}
        </span>
      </button>
    </div>

    <!-- TAB CONTENTS -->

    <!-- TAB 1: OVERVIEW -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <UiCard padding="lg">
        <template #header>
          <div class="space-y-0.5">
            <h2 class="text-sm font-bold text-on-surface">Personnel Profile & Metadata</h2>
            <p class="text-xs text-muted">Ringkasan peran dan hubungan struktural</p>
          </div>
        </template>

        <div class="space-y-5">
          <div>
            <span class="text-[10px] font-mono uppercase text-muted">About & Bio</span>
            <p class="text-xs text-on-surface-variant mt-1 leading-relaxed bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant">
              {{ employee?.description }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div class="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
              <div class="text-[10px] text-muted">DEPARTMENT</div>
              <div class="font-bold text-on-surface mt-1">{{ employee?.departmentName }}</div>
            </div>
            <div class="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
              <div class="text-[10px] text-muted">SUPERVISOR / LEAD</div>
              <div class="font-bold text-primary mt-1">{{ employee?.supervisorName || 'Project Owner' }}</div>
            </div>
            <div class="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
              <div class="text-[10px] text-muted">JOINED WORKFORCE</div>
              <div class="font-bold text-muted mt-1">{{ employee?.createdAt?.split('T')[0] || '2026-08-01' }}</div>
            </div>
          </div>

          <!-- Granted Permissions -->
          <div class="space-y-2 pt-2 border-t border-outline-variant">
            <span class="text-[10px] font-mono uppercase text-muted">System Permissions:</span>
            <div class="flex flex-wrap gap-1.5 font-mono text-[10px]">
              <span
                v-for="perm in employee?.permissions || []"
                :key="perm"
                class="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant text-secondary"
              >
                {{ perm }}
              </span>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- TAB 2: RESPONSIBILITIES -->
    <div v-else-if="activeTab === 'responsibilities'" class="space-y-4">
      <UiCard padding="lg">
        <template #header>
          <div class="space-y-0.5">
            <h2 class="text-sm font-bold text-on-surface">Role Responsibilities Checklist</h2>
            <p class="text-xs text-muted">Rincian lingkup tugas operasional dan acceptance criteria</p>
          </div>
        </template>

        <div class="space-y-2.5">
          <div
            v-for="(resp, idx) in currentRole?.responsibilities || defaultResponsibilities"
            :key="idx"
            class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-start gap-3 text-xs"
          >
            <CheckCircle2 class="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div class="space-y-0.5">
              <div class="font-semibold text-on-surface">{{ resp }}</div>
              <div class="text-[10px] text-muted font-mono">Standard operational duty</div>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- TAB 3: SKILLS -->
    <div v-else-if="activeTab === 'skills'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-on-surface">Assigned Capabilities & Packages</h2>
          <p class="text-xs text-muted">Skill internal dan reusable package yang dialokasikan ke {{ employee?.name }}</p>
        </div>

        <UiButton size="sm" variant="primary" :icon="Plus" @click="openAddSkillModal = true">
          Assign Skill
        </UiButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="s in employee?.skills"
          :key="s.skillId"
          class="p-4 bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl space-y-3 shadow-sm transition flex flex-col justify-between"
        >
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="text-xs font-bold text-on-surface">{{ s.skillName || s.skillId }}</h3>
                <span class="text-[10px] font-mono text-muted">{{ getSkillCategory(s.skillId) }}</span>
              </div>
              <span
                :class="[
                  'text-[10px] font-mono font-bold px-2 py-0.5 rounded',
                  s.priority === 'P0' ? 'bg-primary-container text-on-primary' : s.priority === 'P1' ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-surface-container-high text-muted'
                ]"
              >
                {{ s.priority }} ({{ s.priority === 'P0' ? 'Essential' : s.priority === 'P1' ? 'Useful' : 'Optional' }})
              </span>
            </div>

            <!-- Install command if external -->
            <div v-if="getSkillInstallCmd(s.skillId)" class="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-mono text-[10px] text-muted flex items-center justify-between gap-2">
              <span class="truncate">{{ getSkillInstallCmd(s.skillId) }}</span>
              <button
                @click="copyText(getSkillInstallCmd(s.skillId)!)"
                class="text-primary hover:underline shrink-0 text-[9px]"
              >
                Copy
              </button>
            </div>
          </div>

          <div class="pt-2 border-t border-outline-variant flex items-center justify-between text-xs font-mono">
            <span class="text-[10px] text-muted">Assigned: {{ s.assignedAt }}</span>
            <button
              @click="handleRemoveSkill(s.skillId)"
              class="text-[10px] text-tertiary hover:underline font-sans"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: TOOLS -->
    <div v-else-if="activeTab === 'tools'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-on-surface">Allocated Workforce Tools</h2>
          <p class="text-xs text-muted">Perlengkapan alat kerja digital yang dapat dioperasikan oleh {{ employee?.name }}</p>
        </div>

        <UiButton size="sm" variant="primary" :icon="Plus" @click="openAddToolModal = true">
          Allocate Tool
        </UiButton>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="toolId in employee?.toolIds"
          :key="toolId"
          class="p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-2.5 flex flex-col justify-between"
        >
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-on-surface">{{ getTool(toolId)?.name || toolId }}</span>
              <Wrench class="w-3.5 h-3.5 text-secondary" />
            </div>
            <p class="text-[11px] text-on-surface-variant leading-relaxed">
              {{ getTool(toolId)?.description }}
            </p>
          </div>

          <div class="pt-2 border-t border-outline-variant flex items-center justify-between font-mono text-[10px]">
            <span class="text-primary uppercase">{{ getTool(toolId)?.permissionLevel }} access</span>
            <button
              @click="handleRemoveTool(toolId)"
              class="text-tertiary hover:underline font-sans"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 5: WORK (ACTIVE ASSIGNMENTS & QUEUE) -->
    <div v-else-if="activeTab === 'work'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-on-surface">Assigned Work Queue</h2>
          <p class="text-xs text-muted">Daftar paket pekerjaan dan penugasan yang dialokasikan</p>
        </div>
        <router-link to="/tasks">
          <UiButton size="sm" variant="primary">Assign New Task</UiButton>
        </router-link>
      </div>

      <div v-if="employeeAssignments.length === 0" class="p-8 text-center bg-surface-container-low border border-outline-variant rounded-xl space-y-2">
        <Briefcase class="w-8 h-8 text-muted mx-auto" />
        <div class="text-xs font-bold text-on-surface">No Assigned Tasks</div>
        <p class="text-[11px] text-muted">Karyawan ini belum memiliki tugas yang ditugaskan.</p>
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="asg in employeeAssignments"
          :key="asg.id"
          class="p-4 bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
        >
          <div class="space-y-1 truncate">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-primary">#{{ asg.id }}</span>
              <UiBadge :variant="asg.status === 'Completed' ? 'success' : asg.status === 'In Progress' ? 'info' : 'neutral'" size="sm">
                {{ asg.status }}
              </UiBadge>
              <span class="text-[10px] font-mono text-muted">Priority: {{ asg.priority }}</span>
            </div>
            <div class="text-sm font-bold text-on-surface truncate">{{ asg.taskTitle }}</div>
            <p v-if="asg.instructions" class="text-xs text-on-surface-variant line-clamp-1 italic">
              "{{ asg.instructions }}"
            </p>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <router-link :to="`/tasks?id=${asg.taskId}`">
              <UiButton size="sm" variant="secondary">View Task</UiButton>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 6: RUNS (EXECUTION RUNS HISTORY) -->
    <div v-else-if="activeTab === 'runs'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-on-surface">Agent Execution Telemetry & Runs</h2>
          <p class="text-xs text-muted">Riwayat eksekusi, simulasi run, dan checkpoint kinerja</p>
        </div>
        <router-link to="/runs">
          <UiButton size="sm" variant="secondary">Open All Runs</UiButton>
        </router-link>
      </div>

      <div v-if="employeeRuns.length === 0" class="p-8 text-center bg-surface-container-low border border-outline-variant rounded-xl space-y-2">
        <PlayCircle class="w-8 h-8 text-muted mx-auto" />
        <div class="text-xs font-bold text-on-surface">No Execution Runs Yet</div>
        <p class="text-[11px] text-muted">Belum ada telemetry run yang dijalankan oleh karyawan ini.</p>
      </div>

      <div v-else class="space-y-2.5">
        <div
          v-for="rn in employeeRuns"
          :key="rn.id"
          class="p-4 bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
        >
          <div class="space-y-1.5 truncate">
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-primary">#{{ rn.id }}</span>
              <UiBadge :variant="rn.status === 'Completed' ? 'success' : rn.status === 'Running' ? 'info' : rn.status === 'Failed' ? 'error' : 'neutral'" size="sm">
                {{ rn.status }}
              </UiBadge>
              <span class="text-[10px] font-mono text-muted">Attempt {{ rn.attempt }}/3 &bull; {{ rn.progress }}%</span>
            </div>
            <div class="text-sm font-bold text-on-surface truncate">{{ rn.taskTitle }}</div>
            <div class="text-[10px] font-mono text-muted flex items-center gap-2">
              <span>Step: {{ rn.currentStep }}</span>
              <span>&bull;</span>
              <span>{{ rn.durationSeconds ? `${rn.durationSeconds}s duration` : 'In progress' }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <router-link :to="`/runs/${rn.id}`">
              <UiButton size="sm" variant="secondary">Inspect Run &rarr;</UiButton>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 7: ACTIVITY -->
    <div v-else-if="activeTab === 'activity'" class="space-y-4">
      <UiCard padding="lg">
        <div class="text-center py-10 space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline flex items-center justify-center text-primary mx-auto">
            <Activity class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-on-surface">Runtime Activity Stream</h3>
            <p class="text-xs text-muted max-w-md mx-auto mt-1">
              Log aktivitas dan telemetry penugasan aktif terhubung secara otomatis ke sistem audit workspace.
            </p>
          </div>
          <UiBadge variant="success" size="sm" class="font-mono">Telemetry Active</UiBadge>
        </div>
      </UiCard>
    </div>

    <!-- TAB 8: SETTINGS -->
    <div v-else-if="activeTab === 'settings'" class="space-y-6">
      <UiCard padding="lg">
        <template #header>
          <div class="space-y-0.5">
            <h2 class="text-sm font-bold text-on-surface">Employee Configuration & Status</h2>
            <p class="text-xs text-muted">Kelola nama tampilan, deskripsi tugas, dan status kepegawaian</p>
          </div>
        </template>

        <div class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UiInput v-model="editForm.name" label="Display Name" required />
            <div>
              <label class="block text-xs font-medium text-on-surface-variant mb-1">Employment Status</label>
              <select
                v-model="editForm.status"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-on-surface-variant mb-1">Description / Specialty</label>
            <textarea
              v-model="editForm.description"
              rows="3"
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-xs text-on-surface focus:outline-none focus:border-primary"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-outline-variant">
            <UiButton variant="primary" size="sm" :icon="Save" @click="handleSaveSettings">
              Save Changes
            </UiButton>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- MODAL: ADD SKILL -->
    <UiModal :open="openAddSkillModal" title="Assign Skill from Registry" @close="openAddSkillModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Select Skill</label>
          <select
            v-model="newSkillForm.skillId"
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="" disabled>Pilih Skill</option>
            <option v-for="sk in unassignedSkills" :key="sk.id" :value="sk.id">
              {{ sk.name }} ({{ sk.category }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Priority Level</label>
          <select
            v-model="newSkillForm.priority"
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="P0">P0 (Essential - Core capability)</option>
            <option value="P1">P1 (Useful - High impact)</option>
            <option value="P2">P2 (Optional - Contextual)</option>
          </select>
        </div>
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openAddSkillModal = false">Cancel</UiButton>
        <UiButton variant="primary" :disabled="!newSkillForm.skillId" @click="confirmAddSkill">
          Assign Skill
        </UiButton>
      </template>
    </UiModal>

    <!-- MODAL: ALLOCATE TOOL -->
    <UiModal :open="openAddToolModal" title="Allocate Workforce Tool" @close="openAddToolModal = false">
      <div class="space-y-3 max-h-80 overflow-y-auto">
        <div
          v-for="t in unassignedTools"
          :key="t.id"
          @click="selectToolToAssign(t.id)"
          class="p-3 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant hover:border-primary rounded-xl cursor-pointer transition flex items-center justify-between text-xs"
        >
          <div>
            <div class="font-bold text-on-surface">{{ t.name }}</div>
            <div class="text-[10px] text-muted">{{ t.description }}</div>
          </div>
          <Plus class="w-4 h-4 text-primary shrink-0" />
        </div>
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openAddToolModal = false">Close</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  User,
  CheckCircle2,
  Sparkles,
  Wrench,
  Activity,
  Settings,
  Archive,
  Save,
  Plus,
  Briefcase,
  PlayCircle
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiModal from '../../components/ui/UiModal.vue'
import { useDepartmentStore } from '../../stores/department'
import { useEmployeeStore } from '../../stores/employee'
import { useSkillStore } from '../../stores/skill'
import { useWorkforceToolStore } from '../../stores/workforceTool'
import { useAssignmentStore } from '../../stores/assignment'
import { useAgentRunStore } from '../../stores/agentRun'
import { useToast } from '../../composables/useToast'
import type { EmploymentStatus, SkillPriority } from '../../types'

const route = useRoute()
const departmentStore = useDepartmentStore()
const employeeStore = useEmployeeStore()
const skillStore = useSkillStore()
const toolStore = useWorkforceToolStore()
const assignmentStore = useAssignmentStore()
const agentRunStore = useAgentRunStore()
const toast = useToast()

const activeTab = ref('overview')
const openAddSkillModal = ref(false)
const openAddToolModal = ref(false)

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'

const empId = computed(() => route.params.id as string)

const employee = computed(() => {
  return employeeStore.employees.find((e) => e.id === empId.value)
})

const employeeAssignments = computed(() => {
  return assignmentStore.assignments.filter((a) => a.employeeId === empId.value)
})

const employeeRuns = computed(() => {
  return agentRunStore.runs.filter((r) => r.employeeId === empId.value)
})

const currentWorkState = computed(() => {
  if (employeeRuns.value.some((r) => r.status === 'Running')) return 'Running'
  if (employeeRuns.value.some((r) => r.status === 'Waiting')) return 'Waiting'
  if (employeeAssignments.value.some((a) => a.status === 'In Progress')) return 'Running'
  return employee.value?.workState || 'Idle'
})

const currentRole = computed(() => {
  if (!employee.value) return null
  return departmentStore.roles.find((r) => r.id === employee.value?.roleId)
})

const defaultResponsibilities = [
  'Menjalankan tugas dan paket pekerjaan sesuai instruksi sprint',
  'Menjaga standar kualitas output dan kepatuhan arsitektur',
  'Melaporkan progres berkala dan mengoordinasikan handoff pekerjaan'
]

const editForm = ref({
  name: '',
  description: '',
  status: 'Active' as EmploymentStatus
})

const newSkillForm = ref({
  skillId: '',
  priority: 'P1' as SkillPriority
})

onMounted(async () => {
  await Promise.all([
    departmentStore.fetchDepartments(),
    departmentStore.fetchAllRoles(),
    employeeStore.fetchEmployees(),
    skillStore.fetchSkills(),
    toolStore.fetchTools(),
    assignmentStore.fetchAssignments(),
    agentRunStore.fetchRuns()
  ])

  if (employee.value) {
    editForm.value.name = employee.value.name
    editForm.value.description = employee.value.description
    editForm.value.status = employee.value.status
  }
})

const tabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'responsibilities', label: 'Responsibilities', icon: CheckCircle2, count: currentRole.value?.responsibilities.length || 3 },
  { id: 'skills', label: 'Skills', icon: Sparkles, count: employee.value?.skills.length || 0 },
  { id: 'tools', label: 'Tools', icon: Wrench, count: employee.value?.toolIds.length || 0 },
  { id: 'work', label: 'Work', icon: Briefcase, count: employeeAssignments.value.length },
  { id: 'runs', label: 'Runs', icon: PlayCircle, count: employeeRuns.value.length },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings }
])

const unassignedSkills = computed(() => {
  const currentAssigned = employee.value?.skills.map((s) => s.skillId) || []
  return skillStore.skills.filter((s) => !currentAssigned.includes(s.id))
})

const unassignedTools = computed(() => {
  const currentTools = employee.value?.toolIds || []
  return toolStore.tools.filter((t) => !currentTools.includes(t.id))
})

const getSkillCategory = (skillId: string) => {
  const sk = skillStore.skills.find((s) => s.id === skillId)
  return sk ? `${sk.category} • ${sk.sourceType}` : 'General'
}

const getSkillInstallCmd = (skillId: string) => {
  const sk = skillStore.skills.find((s) => s.id === skillId)
  return sk?.installCommand
}

const getTool = (toolId: string) => {
  return toolStore.tools.find((t) => t.id === toolId)
}

const copyText = (txt: string) => {
  navigator.clipboard.writeText(txt)
  toast.show('Command Copied', txt, 'info', 1500)
}

const handleArchive = async () => {
  if (!employee.value) return
  await employeeStore.archiveEmployee(employee.value.id)
  toast.show('Employee Archived', `${employee.value.name} telah diarsipkan.`, 'warning')
}

const handleRestore = async () => {
  if (!employee.value) return
  await employeeStore.updateEmployeeStatus(employee.value.id, 'Active')
  toast.show('Employee Restored', `${employee.value.name} kembali berstatus Active.`, 'success')
}

const handleRemoveSkill = async (skillId: string) => {
  if (!employee.value) return
  await employeeStore.removeSkill(employee.value.id, skillId)
  toast.show('Skill Removed', 'Skill telah dicopot dari karyawan.', 'info')
}

const confirmAddSkill = async () => {
  if (!employee.value || !newSkillForm.value.skillId) return
  const sk = skillStore.skills.find((s) => s.id === newSkillForm.value.skillId)
  await employeeStore.assignSkill(employee.value.id, {
    skillId: newSkillForm.value.skillId,
    skillName: sk?.name,
    priority: newSkillForm.value.priority,
    assignedAt: new Date().toISOString().split('T')[0]
  })
  openAddSkillModal.value = false
  newSkillForm.value.skillId = ''
  toast.show('Skill Assigned', `${sk?.name} berhasil dialokasikan.`, 'success')
}

const selectToolToAssign = async (toolId: string) => {
  if (!employee.value) return
  const updatedToolIds = [...(employee.value.toolIds || []), toolId]
  await employeeStore.updateEmployee(employee.value.id, { toolIds: updatedToolIds })
  openAddToolModal.value = false
  toast.show('Tool Allocated', 'Tool berhasil ditambahkan ke profil karyawan.', 'success')
}

const handleRemoveTool = async (toolId: string) => {
  if (!employee.value) return
  const updatedToolIds = employee.value.toolIds.filter((tid) => tid !== toolId)
  await employeeStore.updateEmployee(employee.value.id, { toolIds: updatedToolIds })
  toast.show('Tool Removed', 'Tool telah dicopot.', 'info')
}

const handleSaveSettings = async () => {
  if (!employee.value) return
  await employeeStore.updateEmployee(employee.value.id, {
    name: editForm.value.name,
    description: editForm.value.description,
    status: editForm.value.status
  })
  toast.show('Changes Saved', 'Profil karyawan berhasil diperbarui.', 'success')
}
</script>
