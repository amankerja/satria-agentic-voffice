<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Skill Registry</h1>
          <UiBadge variant="info" size="sm" class="font-mono">{{ filteredSkills.length }} Skills</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Katalog kapabilitas keahlian internal dan paket reusable external skills
        </p>
      </div>

      <UiButton size="sm" variant="primary" :icon="Plus" @click="openAddModal = true">
        Register New Skill
      </UiButton>
    </div>

    <!-- Filter & Search Bar -->
    <div class="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant space-y-3">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <!-- Category Filter Pills -->
        <div role="tablist" aria-label="Skill categories" class="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            v-for="cat in ['All', ...categories]"
            :key="cat"
            role="tab"
            :aria-selected="selectedCategory === cat"
            :aria-label="`Category: ${cat}`"
            @click="selectedCategory = cat"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap',
              selectedCategory === cat
                ? 'bg-surface-container-high text-primary font-bold border border-outline'
                : 'text-muted hover:text-on-surface hover:bg-surface-container'
            ]"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Source, Status & Search -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <select
            v-model="selectedSource"
            aria-label="Filter by skill source"
            class="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="All">All Sources</option>
            <option value="internal">Internal Core</option>
            <option value="external">External Packages</option>
          </select>

          <select
            v-model="selectedStatus"
            aria-label="Filter by skill status"
            class="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Available">Available</option>
            <option value="Registered">Registered</option>
          </select>

          <div class="relative w-full sm:w-60">
            <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="text"
              aria-label="Search skills by name, repository, or tag"
              placeholder="Search skill, repo, tag..."
              class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <UiEmptyState
      v-if="filteredSkills.length === 0"
      title="No skills found"
      description="Tidak ada skill yang cocok dengan kriteria filter atau pencarian Anda."
    >
      <UiButton variant="secondary" size="sm" @click="resetFilters">
        Reset Filters
      </UiButton>
    </UiEmptyState>

    <!-- Skills Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="skill in filteredSkills"
        :key="skill.id"
        class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-xl p-4.5 space-y-4 transition shadow-sm flex flex-col justify-between"
      >
        <div class="space-y-3">
          <!-- Top: Title & Source Badge -->
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <Sparkles class="w-4 h-4 text-primary shrink-0" />
                <h3 class="text-sm font-bold text-on-surface">{{ skill.name }}</h3>
              </div>
              <div class="text-[10px] font-mono text-muted mt-0.5">{{ skill.category }} &bull; v{{ skill.version }}</div>
            </div>

            <span
              :class="[
                'text-[10px] font-mono px-2 py-0.5 rounded border',
                skill.sourceType === 'internal'
                  ? 'bg-surface-container text-on-surface-variant border-outline-variant'
                  : 'bg-secondary/10 text-secondary border-secondary/30'
              ]"
            >
              {{ skill.sourceType === 'internal' ? 'Internal' : 'External' }}
            </span>
          </div>

          <p class="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {{ skill.description }}
          </p>

          <!-- Source Repository info if external -->
          <div v-if="skill.sourceRepository" class="space-y-1">
            <div class="text-[9px] font-mono text-muted uppercase">Repository Package:</div>
            <a
              :href="skill.sourceUrl || '#'"
              target="_blank"
              class="text-[11px] font-mono text-primary hover:underline block truncate"
            >
              {{ skill.sourceRepository }}
            </a>
          </div>

          <!-- Install Command Snippet -->
          <div v-if="skill.installCommand" class="space-y-1">
            <div class="text-[9px] font-mono text-muted uppercase">Installation Command:</div>
            <div class="p-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-mono text-[10px] text-muted flex items-center justify-between gap-2">
              <span class="truncate">{{ skill.installCommand }}</span>
              <button
                @click="copyCommand(skill.installCommand)"
                class="text-primary hover:underline text-[9px] font-sans font-semibold shrink-0"
              >
                Copy
              </button>
            </div>
          </div>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1 pt-1">
            <span
              v-for="tag in skill.tags"
              :key="tag"
              class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-container-lowest text-muted border border-outline-variant"
            >
              #{{ tag }}
            </span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="pt-3 border-t border-outline-variant flex items-center justify-between text-xs font-mono">
          <span class="text-[10px] text-muted">
            Used by <strong class="text-on-surface">{{ getUsedByCount(skill.id) }}</strong> personnel
          </span>
          <UiBadge
            :variant="skill.status === 'Active' ? 'success' : skill.status === 'Available' ? 'info' : 'neutral'"
            size="sm"
          >
            {{ skill.status }}
          </UiBadge>
        </div>
      </div>
    </div>

    <!-- MODAL: REGISTER NEW SKILL -->
    <UiModal :open="openAddModal" title="Register New Skill" @close="openAddModal = false">
      <div class="space-y-3.5">
        <UiInput v-model="newForm.name" label="Skill Name" placeholder="e.g. Performance Profiler" required />
        <UiInput v-model="newForm.category" label="Category" placeholder="e.g. Engineering / Quality" required />
        
        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Source Type</label>
          <select
            v-model="newForm.sourceType"
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="internal">Internal Core</option>
            <option value="external">External Package</option>
          </select>
        </div>

        <div v-if="newForm.sourceType === 'external'" class="space-y-3">
          <UiInput v-model="newForm.sourceRepository" label="Source Repository" placeholder="e.g. github-user/skill-repo" />
          <UiInput v-model="newForm.installCommand" label="Install Command" placeholder="e.g. npx skills add https://..." />
        </div>

        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Skill Description</label>
          <textarea
            v-model="newForm.description"
            rows="3"
            placeholder="Deskripsi kapabilitas dan tujuan penggunaan skill..."
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
          ></textarea>
        </div>
      </div>
      <template #footer>
        <UiButton variant="ghost" @click="openAddModal = false">Cancel</UiButton>
        <UiButton variant="primary" :disabled="!newForm.name || !newForm.category" @click="handleRegisterSkill">
          Register Skill
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Sparkles } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import { useSkillStore } from '../../stores/skill'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'
import type { SkillSourceType, SkillStatus } from '../../types'

const skillStore = useSkillStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const selectedCategory = ref('All')
const selectedSource = ref('All')
const selectedStatus = ref('All')
const searchQuery = ref('')
const openAddModal = ref(false)

const newForm = ref({
  name: '',
  category: '',
  description: '',
  sourceType: 'internal' as SkillSourceType,
  sourceRepository: '',
  installCommand: '',
  version: '1.0.0',
  status: 'Available' as SkillStatus
})

onMounted(async () => {
  await Promise.all([
    skillStore.fetchSkills(),
    employeeStore.fetchEmployees()
  ])
})

const categories = computed(() => {
  const cats = new Set(skillStore.skills.map((s) => s.category))
  return Array.from(cats)
})

const filteredSkills = computed(() => {
  return skillStore.skills.filter((sk) => {
    const matchCat = selectedCategory.value === 'All' || sk.category === selectedCategory.value
    const matchSource = selectedSource.value === 'All' || sk.sourceType === selectedSource.value
    const matchStatus = selectedStatus.value === 'All' || sk.status === selectedStatus.value
    const query = searchQuery.value.toLowerCase().trim()
    const matchQuery =
      query === '' ||
      sk.name.toLowerCase().includes(query) ||
      sk.category.toLowerCase().includes(query) ||
      (sk.sourceRepository && sk.sourceRepository.toLowerCase().includes(query)) ||
      sk.tags.some((t) => t.toLowerCase().includes(query))

    return matchCat && matchSource && matchStatus && matchQuery
  })
})

const getUsedByCount = (skillId: string) => {
  return employeeStore.employees.filter((e) => e.skills.some((s) => s.skillId === skillId)).length
}

const copyCommand = (cmd: string) => {
  navigator.clipboard.writeText(cmd)
  toast.show('Command Copied', cmd, 'info', 1500)
}

const resetFilters = () => {
  selectedCategory.value = 'All'
  selectedSource.value = 'All'
  selectedStatus.value = 'All'
  searchQuery.value = ''
}

const handleRegisterSkill = async () => {
  if (!newForm.value.name || !newForm.value.category) return
  await skillStore.createSkill({
    name: newForm.value.name,
    slug: newForm.value.name.toLowerCase().replace(/\s+/g, '-'),
    category: newForm.value.category,
    description: newForm.value.description || 'Custom registered skill.',
    sourceType: newForm.value.sourceType,
    sourceRepository: newForm.value.sourceRepository || undefined,
    installCommand: newForm.value.installCommand || undefined,
    version: newForm.value.version,
    status: newForm.value.status,
    compatibleDepartments: [],
    compatibleRoles: [],
    tags: ['Custom', newForm.value.category]
  })

  openAddModal.value = false
  newForm.value.name = ''
  newForm.value.category = ''
  newForm.value.description = ''
  newForm.value.sourceRepository = ''
  newForm.value.installCommand = ''
  toast.show('Skill Registered', 'Skill baru berhasil didaftarkan ke registry.', 'success')
}
</script>
