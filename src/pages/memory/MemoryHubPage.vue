<template>
  <div class="space-y-6 max-w-7xl mx-auto pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/80 pb-5">
      <div>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Brain class="w-4 h-4" />
          </div>
          <h1 class="text-xl font-bold text-surface-on font-mono tracking-tight">Hierarchical Agent Memory</h1>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            5-Tier Matrix
          </span>
        </div>
        <p class="text-xs text-surface-muted mt-1">
          Memori bertingkat otonom: <span class="text-purple-400 font-mono">Run</span> → <span class="text-cyan-400 font-mono">Task</span> → <span class="text-blue-400 font-mono">Project</span> → <span class="text-emerald-400 font-mono">Employee</span> → <span class="text-amber-400 font-mono">Workspace</span>. Menghemat token prompt dengan semantic recall berbobot.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="showSimulator = !showSimulator"
          class="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-mono font-bold flex items-center gap-1.5 transition"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ showSimulator ? 'Tutup Simulator' : 'Recall Simulator' }}</span>
        </button>
        <button
          @click="openAddModal = true"
          class="px-3.5 py-1.5 rounded-lg bg-primary text-surface-base hover:bg-primary/90 text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Tambah Memori</span>
        </button>
      </div>
    </div>

    <!-- 5-Tier Overview Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div
        v-for="t in tierStats"
        :key="t.tier"
        @click="selectedTier = t.tier"
        class="p-3.5 rounded-xl border transition-all cursor-pointer"
        :class="[
          selectedTier === t.tier
            ? 'border-primary bg-surface-container-high/60 ring-1 ring-primary/40'
            : 'border-surface-container-high/80 bg-surface-container-low hover:border-surface-container-high'
        ]"
      >
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono uppercase font-bold" :class="t.colorClass">{{ t.label }}</span>
          <component :is="t.icon" class="w-3.5 h-3.5" :class="t.colorClass" />
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-xl font-bold font-mono text-surface-on">{{ t.count }}</span>
          <span class="text-[10px] text-surface-muted">items</span>
        </div>
        <p class="text-[10px] text-surface-muted truncate mt-1">{{ t.description }}</p>
      </div>
    </div>

    <!-- Recall Simulator Drawer/Panel -->
    <div v-if="showSimulator" class="p-4 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-4">
      <div class="flex items-center justify-between border-b border-purple-500/20 pb-3">
        <div class="flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-purple-400" />
          <h3 class="text-xs font-bold font-mono text-purple-300">Semantic Recall & Prompt Synthesis Simulator</h3>
        </div>
        <span class="text-[10px] font-mono text-purple-400">Budget: ~1500 Tokens Max</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="md:col-span-2">
          <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Simulasi Query / Judul Task</label>
          <input
            v-model="simQuery"
            type="text"
            placeholder="Contoh: Fix JWT concurrency bug in satria-api auth handler"
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-purple-500 focus:outline-none"
            @keyup.enter="runSimulation"
          />
        </div>
        <div>
          <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Target Digital Worker</label>
          <select
            v-model="simWorkerId"
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-purple-500 focus:outline-none"
          >
            <option value="">Semua Worker</option>
            <option value="emp-bima">Bima (Backend Engineer)</option>
            <option value="emp-maya">Maya (Frontend / UI)</option>
            <option value="emp-dimas">Dimas (QA / Security)</option>
            <option value="emp-raka">Raka (Planner / Lead)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end">
        <button
          @click="runSimulation"
          :disabled="isSimulating"
          class="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <Search class="w-3.5 h-3.5" />
          <span>{{ isSimulating ? 'Memproses Recall...' : 'Jalankan Recall Semantik' }}</span>
        </button>
      </div>

      <!-- Simulation Results -->
      <div v-if="simResult" class="mt-4 pt-3 border-t border-purple-500/20 space-y-3">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-purple-300 font-bold">Hasil Recall: {{ simResult.totalItemsRecalled }} items ditemukan</span>
          <span class="text-emerald-400 font-bold">Estimasi Token: ~{{ simResult.totalTokenEstimate }} tokens</span>
        </div>

        <div class="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-high font-mono text-[11px] text-surface-on whitespace-pre-wrap max-h-56 overflow-y-auto">
          {{ simResult.injectedPromptSection || 'Tidak ada memori yang memenuhi ambang relevansi.' }}
        </div>
      </div>
    </div>

    <!-- Filters & Search Bar -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
        <button
          @click="selectedTier = 'All'"
          class="px-3 py-1 rounded-lg text-xs font-mono transition"
          :class="selectedTier === 'All' ? 'bg-primary text-surface-base font-bold' : 'text-surface-muted hover:bg-surface-container-low'"
        >
          Semua Tier ({{ memoryStore.memories.length }})
        </button>
        <button
          v-for="t in tierStats"
          :key="t.tier"
          @click="selectedTier = t.tier"
          class="px-3 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap"
          :class="selectedTier === t.tier ? 'bg-primary text-surface-base font-bold' : 'text-surface-muted hover:bg-surface-container-low'"
        >
          {{ t.label }} ({{ t.count }})
        </button>
      </div>

      <div class="relative w-full sm:w-64">
        <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input
          v-model="memoryStore.searchQuery"
          type="text"
          placeholder="Cari judul, tag, worker..."
          class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-low border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
        />
      </div>
    </div>

    <!-- Memories Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      <div
        v-for="mem in displayedMemories"
        :key="mem.id"
        class="p-4 rounded-xl border border-surface-container-high/80 bg-surface-container-low hover:border-surface-container-high transition flex flex-col justify-between"
      >
        <div class="space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span
                class="px-2 py-0.5 rounded text-[9px] font-mono font-bold"
                :class="getTierBadgeClass(mem.tier)"
              >
                {{ mem.tier || 'EMPLOYEE' }}
              </span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-surface-container-high text-surface-muted">
                {{ mem.type }}
              </span>
              <span v-if="mem.pinned" class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                PINNED
              </span>
            </div>

            <span class="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
              {{ Math.round((mem.confidence || 0.9) * 100) }}% Conf
            </span>
          </div>

          <div>
            <h4 class="text-xs font-bold text-surface-on font-mono leading-tight">{{ mem.title }}</h4>
            <p class="text-[11px] text-surface-muted mt-1 line-clamp-3 leading-relaxed">{{ mem.content }}</p>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-surface-container-high/60 flex items-center justify-between text-[10px] font-mono text-surface-muted">
          <div class="flex items-center gap-1 truncate">
            <span v-if="mem.employeeName" class="text-surface-on font-bold">{{ mem.employeeName }}</span>
            <span v-else-if="mem.projectName" class="text-cyan-400 font-bold">{{ mem.projectName }}</span>
            <span v-else class="text-amber-400 font-bold">Global Workspace</span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span>{{ mem.accessCount || 0 }}x recalled</span>
            <button
              @click="deleteMemory(mem.id)"
              class="hover:text-rose-400 transition"
              title="Hapus memori"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="displayedMemories.length === 0"
      class="p-12 text-center rounded-2xl border border-surface-container-high/80 bg-surface-container-low"
    >
      <Brain class="w-8 h-8 mx-auto text-surface-muted mb-2 opacity-50" />
      <p class="text-xs font-mono text-surface-muted">Tidak ada memori pada tier ini yang cocok dengan pencarian.</p>
    </div>

    <!-- Add Memory Modal -->
    <UiModal :open="openAddModal" @close="openAddModal = false">
      <template #header>
        <div class="flex items-center gap-2">
          <Brain class="w-4 h-4 text-primary" />
          <h3 class="text-sm font-bold font-mono text-surface-on">Tambah Hierarchical Agent Memory</h3>
        </div>
      </template>

      <div class="space-y-3.5 py-2">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Hierarchy Tier</label>
            <select
              v-model="newForm.tier"
              class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
            >
              <option value="WORKSPACE">WORKSPACE (Global SOP & Policy)</option>
              <option value="EMPLOYEE">EMPLOYEE (Worker Experience)</option>
              <option value="PROJECT">PROJECT (Codebase Architecture)</option>
              <option value="TASK">TASK (Task History & Deliverables)</option>
              <option value="RUN">RUN (Live Scratchpad Trace)</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Tipe Memori</label>
            <select
              v-model="newForm.type"
              class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
            >
              <option value="procedural">procedural (SOP / Cara Kerja)</option>
              <option value="semantic">semantic (Fakta / Standar)</option>
              <option value="episodic">episodic (Histori Kejadian)</option>
              <option value="feedback">feedback (Arahan Supervisor)</option>
              <option value="architecture">architecture (Desain Sistem)</option>
            </select>
          </div>
        </div>

        <div v-if="newForm.tier === 'EMPLOYEE'">
          <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Digital Worker Pemilik</label>
          <select
            v-model="newForm.employeeId"
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
          >
            <option value="emp-bima">Bima Wicaksono (Backend)</option>
            <option value="emp-maya">Maya Salsabila (Frontend)</option>
            <option value="emp-dimas">Dimas Anggara (QA/Security)</option>
            <option value="emp-raka">Raka Pratama (Planner)</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Judul / Pattern</label>
          <input
            v-model="newForm.title"
            type="text"
            placeholder="Contoh: JWT Refresh Token Mutex Locking"
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Isi Pelajaran / Knowledge</label>
          <textarea
            v-model="newForm.content"
            rows="3"
            placeholder="Tuliskan detail instruksi, snippet, atau pola solusi yang perlu diingat AI..."
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-[10px] font-mono text-surface-muted uppercase mb-1">Tags (Pisahkan koma)</label>
          <input
            v-model="newForm.tags"
            type="text"
            placeholder="backend, auth, jwt, security"
            class="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs text-surface-on font-mono focus:border-primary focus:outline-none"
          />
        </div>

        <div class="flex items-center gap-2 pt-1">
          <input id="pinMem" v-model="newForm.pinned" type="checkbox" class="rounded bg-surface-container-lowest border-surface-container-high text-primary focus:ring-0" />
          <label for="pinMem" class="text-xs text-surface-muted font-mono">Pin memori ini agar tidak terhapus oleh siklus decay</label>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <button
            @click="openAddModal = false"
            class="px-3 py-1.5 rounded-lg text-xs font-mono text-surface-muted hover:text-surface-on"
          >
            Batal
          </button>
          <button
            @click="saveNewMemory"
            :disabled="!newForm.title || !newForm.content"
            class="px-4 py-1.5 rounded-lg bg-primary text-surface-base font-bold font-mono text-xs hover:bg-primary/90 disabled:opacity-50"
          >
            Simpan Memori
          </button>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Brain,
  Plus,
  Sparkles,
  Search,
  Building,
  User,
  FolderCode,
  CheckCircle2,
  Zap,
  Trash2
} from '@lucide/vue'
import UiModal from '../../components/ui/UiModal.vue'
import { useMemoryStore } from '../../stores/memory'
import type { MemoryHierarchyTier, MemoryType, HierarchicalRecallContext } from '../../types'

const memoryStore = useMemoryStore()
const selectedTier = ref<MemoryHierarchyTier | 'All'>('All')
const openAddModal = ref(false)
const showSimulator = ref(false)

const simQuery = ref('Fix JWT concurrency bug in satria-api auth handler')
const simWorkerId = ref('emp-bima')
const isSimulating = ref(false)
const simResult = ref<HierarchicalRecallContext | null>(null)

const newForm = ref<{
  tier: MemoryHierarchyTier
  type: MemoryType
  employeeId: string
  title: string
  content: string
  tags: string
  pinned: boolean
}>({
  tier: 'WORKSPACE',
  type: 'procedural',
  employeeId: 'emp-bima',
  title: '',
  content: '',
  tags: '',
  pinned: false
})

onMounted(() => {
  memoryStore.fetchMemories('ws-dev')
})

const tierStats = computed(() => [
  {
    tier: 'WORKSPACE' as MemoryHierarchyTier,
    label: 'Workspace',
    count: memoryStore.memories.filter((m) => m.tier === 'WORKSPACE').length,
    icon: Building,
    colorClass: 'text-amber-400',
    description: 'SOP & Kebijakan Global'
  },
  {
    tier: 'EMPLOYEE' as MemoryHierarchyTier,
    label: 'Employee',
    count: memoryStore.memories.filter((m) => m.tier === 'EMPLOYEE').length,
    icon: User,
    colorClass: 'text-emerald-400',
    description: 'Pola Solusi Tiap Worker'
  },
  {
    tier: 'PROJECT' as MemoryHierarchyTier,
    label: 'Project',
    count: memoryStore.memories.filter((m) => m.tier === 'PROJECT').length,
    icon: FolderCode,
    colorClass: 'text-cyan-400',
    description: 'Arsitektur Codebase'
  },
  {
    tier: 'TASK' as MemoryHierarchyTier,
    label: 'Task',
    count: memoryStore.memories.filter((m) => m.tier === 'TASK').length,
    icon: CheckCircle2,
    colorClass: 'text-blue-400',
    description: 'Hasil Deliverable Task'
  },
  {
    tier: 'RUN' as MemoryHierarchyTier,
    label: 'Run Trace',
    count: memoryStore.memories.filter((m) => m.tier === 'RUN').length,
    icon: Zap,
    colorClass: 'text-purple-400',
    description: 'Scratchpad Eksekusi Aktif'
  }
])

const displayedMemories = computed(() => {
  return memoryStore.filteredMemories.filter((m) => {
    if (selectedTier.value === 'All') return true
    return m.tier === selectedTier.value
  })
})

function getTierBadgeClass(tier?: MemoryHierarchyTier): string {
  switch (tier) {
    case 'WORKSPACE':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'EMPLOYEE':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'PROJECT':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
    case 'TASK':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'RUN':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    default:
      return 'bg-surface-container-high text-surface-muted'
  }
}

async function runSimulation() {
  if (!simQuery.value.trim()) return
  isSimulating.value = true
  try {
    simResult.value = await memoryStore.recallHierarchical({
      workspaceId: 'ws-dev',
      queryText: simQuery.value,
      employeeId: simWorkerId.value || undefined,
      projectId: 'prj-satria-ui',
      limit: 6
    })
  } finally {
    isSimulating.value = false
  }
}

async function saveNewMemory() {
  if (!newForm.value.title.trim() || !newForm.value.content.trim()) return
  const tagList = newForm.value.tags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  await memoryStore.createMemory({
    workspaceId: 'ws-dev',
    tier: newForm.value.tier,
    scope: newForm.value.tier === 'WORKSPACE' ? 'global' : newForm.value.tier === 'PROJECT' ? 'project' : 'employee',
    employeeId: newForm.value.tier === 'EMPLOYEE' ? newForm.value.employeeId : undefined,
    type: newForm.value.type,
    title: newForm.value.title,
    content: newForm.value.content,
    tags: tagList.length > 0 ? tagList : ['experience'],
    confidence: 0.98,
    importance: 5,
    pinned: newForm.value.pinned,
    source: 'manual_entry'
  })

  openAddModal.value = false
  newForm.value.title = ''
  newForm.value.content = ''
  newForm.value.tags = ''
}

async function deleteMemory(id: string) {
  await memoryStore.deleteMemory(id)
}
</script>
