<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1.5">
        <router-link to="/workforce/employees" class="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-primary transition">
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Back to Employee Directory</span>
        </router-link>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Create New Digital Employee</h1>
          <UiBadge variant="success" size="sm" class="font-mono">Step {{ currentStep }} of 7</UiBadge>
        </div>
        <p class="text-xs text-muted">
          Form terpandu untuk mendaftarkan karyawan digital baru ke dalam SATRIA AI Workforce
        </p>
      </div>
    </div>

    <!-- Step Progress Bar -->
    <div class="bg-surface-container-low p-4 rounded-xl border border-outline-variant space-y-2.5">
      <div class="flex items-center justify-between text-xs font-mono">
        <span class="text-primary font-bold">Step {{ currentStep }}: {{ steps[currentStep - 1].title }}</span>
        <span class="text-muted">{{ Math.round((currentStep / 7) * 100) }}% Completed</span>
      </div>

      <!-- Segmented Bar -->
      <div class="grid grid-cols-7 gap-1.5">
        <div
          v-for="s in 7"
          :key="s"
          :class="[
            'h-2 rounded-full transition-all duration-200',
            s <= currentStep ? 'bg-primary-container' : 'bg-surface-container-highest'
          ]"
        ></div>
      </div>
    </div>

    <!-- Wizard Steps Card Form -->
    <UiCard padding="lg">
      <!-- STEP 1: IDENTITY -->
      <div v-if="currentStep === 1" class="space-y-5">
        <div>
          <h2 class="text-base font-bold text-on-surface">1. Employee Identity</h2>
          <p class="text-xs text-muted">Tentukan nama dan identitas dasar karyawan digital</p>
        </div>

        <div class="space-y-4">
          <UiInput
            v-model="form.name"
            label="Employee Name"
            placeholder="e.g. Kevin Pratama"
            required
          />

          <UiInput
            v-model="form.avatar"
            label="Avatar Image URL (Optional)"
            placeholder="https://images.unsplash.com/..."
          />

          <div>
            <label class="block text-xs font-medium text-on-surface-variant mb-1">Role Description / Bio</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Deskripsi singkat spesialisasi dan lingkup kerja karyawan..."
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-xs text-on-surface focus:outline-none focus:border-primary"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- STEP 2: DEPARTMENT & ROLE -->
      <div v-else-if="currentStep === 2" class="space-y-5">
        <div>
          <h2 class="text-base font-bold text-on-surface">2. Department & Role Assignment</h2>
          <p class="text-xs text-muted">Pilih divisi kerja dan jabatan spesialis</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-on-surface-variant mb-1">Target Department *</label>
            <select
              v-model="form.departmentId"
              @change="onDepartmentChange"
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="" disabled>Pilih Departemen</option>
              <option v-for="dept in departmentStore.departments" :key="dept.id" :value="dept.id">
                {{ dept.name }} ({{ dept.code }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-on-surface-variant mb-1">Employee Role *</label>
            <select
              v-model="form.roleId"
              @change="onRoleChange"
              :disabled="!form.departmentId"
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="" disabled>Pilih Role Spesialis</option>
              <option v-for="r in availableRoles" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- STEP 3: RESPONSIBILITIES -->
      <div v-else-if="currentStep === 3" class="space-y-5">
        <div>
          <h2 class="text-base font-bold text-on-surface">3. Responsibilities Review</h2>
          <p class="text-xs text-muted">Tinjau tanggung jawab tugas utama untuk role ini</p>
        </div>

        <div class="space-y-3">
          <div
            v-for="(resp, idx) in form.responsibilities"
            :key="idx"
            class="p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg flex items-center justify-between text-xs"
          >
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-primary shrink-0" />
              <span class="text-on-surface">{{ resp }}</span>
            </div>
            <button @click="removeResponsibility(idx)" class="text-muted hover:text-tertiary text-xs">
              &times;
            </button>
          </div>

          <div class="flex gap-2 pt-2">
            <input
              v-model="customResp"
              type="text"
              placeholder="Add custom responsibility..."
              @keyup.enter="addResponsibility"
              class="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            <UiButton size="sm" variant="secondary" @click="addResponsibility">Add</UiButton>
          </div>
        </div>
      </div>

      <!-- STEP 4: SKILLS ASSIGNMENT -->
      <div v-else-if="currentStep === 4" class="space-y-5">
        <div>
          <h2 class="text-base font-bold text-on-surface">4. Skills Assignment</h2>
          <p class="text-xs text-muted">Alokasikan skill internal dan external packages dengan prioritas (P0/P1/P2)</p>
        </div>

        <div class="space-y-4">
          <!-- Currently Assigned Skills -->
          <div class="space-y-2">
            <div class="text-xs font-semibold text-on-surface">Assigned Skills ({{ form.skills.length }})</div>
            <div v-if="form.skills.length === 0" class="text-xs text-muted italic">
              Belum ada skill yang dipilih. Silakan pilih dari registry di bawah.
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div
                v-for="s in form.skills"
                :key="s.skillId"
                class="p-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg flex items-center justify-between text-xs"
              >
                <div class="truncate">
                  <div class="font-semibold text-on-surface truncate">{{ s.skillName }}</div>
                  <div class="text-[10px] font-mono text-muted">Priority: {{ s.priority }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <select
                    v-model="s.priority"
                    class="bg-surface-container border border-outline-variant rounded text-[10px] font-mono px-1.5 py-0.5 text-primary"
                  >
                    <option value="P0">P0 (Essential)</option>
                    <option value="P1">P1 (Useful)</option>
                    <option value="P2">P2 (Optional)</option>
                  </select>
                  <button @click="removeSkill(s.skillId)" class="text-muted hover:text-tertiary">
                    &times;
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Skill Selection -->
          <div class="pt-3 border-t border-outline-variant space-y-2">
            <div class="text-xs font-semibold text-on-surface">Add Skill from Registry</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              <div
                v-for="sk in unassignedSkills"
                :key="sk.id"
                @click="assignSkill(sk)"
                class="p-2 bg-surface-container-lowest hover:bg-surface-container border border-outline-variant hover:border-primary rounded-lg cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div class="truncate">
                  <div class="font-medium text-on-surface truncate">{{ sk.name }}</div>
                  <div class="text-[9px] font-mono text-muted">{{ sk.category }} &bull; {{ sk.sourceType }}</div>
                </div>
                <Plus class="w-4 h-4 text-primary shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 5: TOOLS ASSIGNMENT -->
      <div v-else-if="currentStep === 5" class="space-y-5">
        <div>
          <h2 class="text-base font-bold text-on-surface">5. Tools Allocation</h2>
          <p class="text-xs text-muted">Tentukan perlengkapan tool yang dapat diakses oleh karyawan</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="tool in toolStore.tools"
            :key="tool.id"
            @click="toggleTool(tool.id)"
            :class="[
              'p-3 rounded-xl border cursor-pointer transition flex items-start gap-3',
              form.toolIds.includes(tool.id)
                ? 'bg-surface-container-low border-primary ring-1 ring-primary'
                : 'bg-surface-container-lowest border-outline-variant hover:border-outline'
            ]"
          >
            <input
              type="checkbox"
              :checked="form.toolIds.includes(tool.id)"
              class="w-4 h-4 rounded border-outline bg-surface-container-lowest text-primary mt-0.5"
              @click.stop="toggleTool(tool.id)"
            />
            <div class="truncate">
              <div class="text-xs font-semibold text-on-surface truncate">{{ tool.name }}</div>
              <div class="text-[10px] text-muted line-clamp-1">{{ tool.description }}</div>
              <div class="text-[9px] font-mono text-secondary mt-1 uppercase">{{ tool.category }} &bull; {{ tool.permissionLevel }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 6: SUPERVISOR SELECTION -->
      <div v-else-if="currentStep === 6" class="space-y-5">
        <div>
          <h2 class="text-base font-bold text-on-surface">6. Supervisor / Reporting Line</h2>
          <p class="text-xs text-muted">Tentukan atasan langsung atau penanggung jawab koordinasi</p>
        </div>

        <div class="space-y-3">
          <div
            @click="form.supervisorId = undefined; form.supervisorName = 'Project Owner'"
            :class="[
              'p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between',
              !form.supervisorId
                ? 'bg-surface-container-low border-primary ring-1 ring-primary'
                : 'bg-surface-container-lowest border-outline-variant'
            ]"
          >
            <div>
              <div class="text-xs font-bold text-on-surface">Project Owner / None (Direct)</div>
              <div class="text-[10px] text-muted">Melapor langsung ke pemilik workspace</div>
            </div>
            <span v-if="!form.supervisorId" class="text-xs font-mono text-primary font-bold">Selected</span>
          </div>

          <div
            v-for="emp in employeeStore.employees"
            :key="emp.id"
            @click="form.supervisorId = emp.id; form.supervisorName = `${emp.name} (${emp.roleName})`"
            :class="[
              'p-3 rounded-xl border cursor-pointer transition flex items-center justify-between',
              form.supervisorId === emp.id
                ? 'bg-surface-container-low border-primary ring-1 ring-primary'
                : 'bg-surface-container-lowest border-outline-variant hover:border-outline'
            ]"
          >
            <div class="flex items-center gap-3">
              <img :src="emp.avatar" :alt="emp.name" class="w-8 h-8 rounded-full object-cover border border-outline" />
              <div>
                <div class="text-xs font-bold text-on-surface">{{ emp.name }}</div>
                <div class="text-[10px] text-muted font-mono">{{ emp.roleName }} &bull; {{ emp.departmentName }}</div>
              </div>
            </div>
            <span v-if="form.supervisorId === emp.id" class="text-xs font-mono text-primary font-bold">Selected</span>
          </div>
        </div>
      </div>

      <!-- STEP 7: REVIEW & CONFIRMATION -->
      <div v-else-if="currentStep === 7" class="space-y-5">
        <div>
          <h2 class="text-base font-bold text-on-surface">7. Review & Confirmation</h2>
          <p class="text-xs text-muted">Periksa kembali ringkasan profil sebelum mendaftarkan karyawan baru</p>
        </div>

        <div class="space-y-4 text-xs font-mono">
          <div class="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant space-y-3">
            <div class="flex items-center gap-3 pb-3 border-b border-outline-variant">
              <img
                :src="form.avatar || defaultAvatar"
                :alt="form.name"
                class="w-12 h-12 rounded-full object-cover border-2 border-primary"
              />
              <div>
                <div class="text-sm font-bold text-on-surface">{{ form.name || 'Unnamed Employee' }}</div>
                <div class="text-xs text-primary font-semibold">{{ form.roleName || 'No Role' }}</div>
                <div class="text-[10px] text-muted">{{ form.departmentName || 'No Department' }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span class="text-muted">SUPERVISOR:</span>
                <div class="text-on-surface font-semibold mt-0.5">{{ form.supervisorName || 'Project Owner' }}</div>
              </div>
              <div>
                <span class="text-muted">INITIAL STATUS:</span>
                <div class="text-primary font-semibold mt-0.5">Active</div>
              </div>
            </div>

            <div class="pt-2 border-t border-outline-variant">
              <span class="text-muted">ASSIGNED SKILLS ({{ form.skills.length }}):</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="s in form.skills"
                  :key="s.skillId"
                  class="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] border border-outline-variant"
                >
                  <span class="text-primary font-bold">{{ s.priority }}</span> {{ s.skillName }}
                </span>
              </div>
            </div>

            <div class="pt-2 border-t border-outline-variant">
              <span class="text-muted">ASSIGNED TOOLS ({{ form.toolIds.length }}):</span>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="tid in form.toolIds"
                  :key="tid"
                  class="px-2 py-0.5 rounded bg-surface-container text-secondary text-[10px] border border-outline-variant"
                >
                  {{ getToolName(tid) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Step Controls in Card Footer -->
      <div class="pt-6 border-t border-outline-variant flex items-center justify-between">
        <UiButton
          v-if="currentStep > 1"
          variant="ghost"
          size="sm"
          :icon="ArrowLeft"
          @click="currentStep--"
        >
          Previous Step
        </UiButton>
        <div v-else></div>

        <UiButton
          v-if="currentStep < 7"
          variant="primary"
          size="sm"
          :icon="ArrowRight"
          :disabled="!canProceed"
          @click="currentStep++"
        >
          Next Step
        </UiButton>

        <UiButton
          v-else
          variant="primary"
          size="sm"
          :icon="CheckCircle2"
          :loading="isSubmitting"
          @click="submitEmployee"
        >
          Confirm & Create Employee
        </UiButton>
      </div>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Plus
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiInput from '../../components/ui/UiInput.vue'
import { useDepartmentStore } from '../../stores/department'
import { useEmployeeStore } from '../../stores/employee'
import { useSkillStore } from '../../stores/skill'
import { useWorkforceToolStore } from '../../stores/workforceTool'
import { useToast } from '../../composables/useToast'
import type { EmployeeSkillAssignment, Skill } from '../../types'

const router = useRouter()
const departmentStore = useDepartmentStore()
const employeeStore = useEmployeeStore()
const skillStore = useSkillStore()
const toolStore = useWorkforceToolStore()
const toast = useToast()

const currentStep = ref(1)
const isSubmitting = ref(false)
const customResp = ref('')

const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'

const steps = [
  { step: 1, title: 'Identity' },
  { step: 2, title: 'Department & Role' },
  { step: 3, title: 'Responsibilities' },
  { step: 4, title: 'Skills' },
  { step: 5, title: 'Tools' },
  { step: 6, title: 'Supervisor' },
  { step: 7, title: 'Review & Create' }
]

const form = ref({
  name: '',
  avatar: defaultAvatar,
  description: '',
  departmentId: '',
  departmentName: '',
  roleId: '',
  roleName: '',
  responsibilities: [] as string[],
  skills: [] as EmployeeSkillAssignment[],
  toolIds: [] as string[],
  supervisorId: undefined as string | undefined,
  supervisorName: 'Project Owner'
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

const availableRoles = computed(() => {
  if (!form.value.departmentId) return []
  return departmentStore.roles.filter((r) => r.departmentId === form.value.departmentId)
})

const unassignedSkills = computed(() => {
  const assignedIds = form.value.skills.map((s) => s.skillId)
  return skillStore.skills.filter((sk) => !assignedIds.includes(sk.id))
})

const canProceed = computed(() => {
  if (currentStep.value === 1) return form.value.name.trim().length > 0
  if (currentStep.value === 2) return form.value.departmentId && form.value.roleId
  return true
})

const onDepartmentChange = () => {
  const dept = departmentStore.departments.find((d) => d.id === form.value.departmentId)
  form.value.departmentName = dept ? dept.name : ''
  form.value.roleId = ''
  form.value.roleName = ''
  form.value.responsibilities = []
}

const onRoleChange = () => {
  const role = departmentStore.roles.find((r) => r.id === form.value.roleId)
  if (role) {
    form.value.roleName = role.name
    form.value.responsibilities = [...role.responsibilities]
  }
}

const addResponsibility = () => {
  if (!customResp.value.trim()) return
  form.value.responsibilities.push(customResp.value.trim())
  customResp.value = ''
}

const removeResponsibility = (idx: number) => {
  form.value.responsibilities.splice(idx, 1)
}

const assignSkill = (skill: Skill) => {
  form.value.skills.push({
    skillId: skill.id,
    skillName: skill.name,
    priority: 'P1',
    assignedAt: new Date().toISOString().split('T')[0]
  })
}

const removeSkill = (skillId: string) => {
  form.value.skills = form.value.skills.filter((s) => s.skillId !== skillId)
}

const toggleTool = (toolId: string) => {
  if (form.value.toolIds.includes(toolId)) {
    form.value.toolIds = form.value.toolIds.filter((id) => id !== toolId)
  } else {
    form.value.toolIds.push(toolId)
  }
}

const getToolName = (toolId: string) => {
  const t = toolStore.tools.find((item) => item.id === toolId)
  return t ? t.name : toolId
}

const submitEmployee = async () => {
  isSubmitting.value = true
  try {
    const created = await employeeStore.createEmployee({
      name: form.value.name,
      avatar: form.value.avatar || defaultAvatar,
      description: form.value.description || `Specialist ${form.value.roleName} pada departemen ${form.value.departmentName}.`,
      departmentId: form.value.departmentId,
      departmentName: form.value.departmentName,
      roleId: form.value.roleId,
      roleName: form.value.roleName,
      status: 'Active',
      supervisorId: form.value.supervisorId,
      supervisorName: form.value.supervisorName,
      skills: form.value.skills,
      toolIds: form.value.toolIds,
      permissions: ['task:read', 'task:update']
    })

    toast.show('Employee Created Successfully', `${created.name} (${created.roleName}) telah terdaftar di workforce.`, 'success')
    router.push(`/workforce/employees/${created.id}`)
  } finally {
    isSubmitting.value = false
  }
}
</script>
