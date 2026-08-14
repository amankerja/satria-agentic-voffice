<template>
  <div class="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
    <div class="w-full max-w-xl bg-surface-container-low border border-outline-variant rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <!-- Step Indicator Bar -->
      <div class="flex items-center justify-between text-xs font-mono text-muted border-b border-outline-variant pb-4">
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-[10px]">
            {{ currentStep }}
          </span>
          <span class="font-bold text-on-surface">STEP {{ currentStep }} OF 4</span>
        </div>
        <div class="text-[11px] text-primary">
          {{ stepTitles[currentStep - 1] }}
        </div>
      </div>

      <!-- STEP 1: WELCOME & VISION -->
      <div v-if="currentStep === 1" class="space-y-4">
        <div class="w-12 h-12 rounded-xl bg-primary-container/20 border border-primary-container flex items-center justify-center text-primary text-xl font-bold">
          <Sparkles class="w-6 h-6" />
        </div>
        <div class="space-y-1.5">
          <h2 class="text-xl font-bold text-on-surface">Welcome to SATRIA AI WORKFORCE</h2>
          <p class="text-xs text-on-surface-variant leading-relaxed">
            "Build the office first. Fill it with AI later." SATRIA adalah digital workforce command center untuk mengelola proyek, tugas, berkas, dan kalender pekerjaan Anda.
          </p>
        </div>

        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-2 text-xs text-muted font-mono">
          <div class="flex items-center gap-2 text-primary">
            <Check class="w-3.5 h-3.5" />
            <span>Dark-First Enterprise UI (Geist + JetBrains Mono)</span>
          </div>
          <div class="flex items-center gap-2 text-primary">
            <Check class="w-3.5 h-3.5" />
            <span>Mock Repository Data Layer (Zero backend runtime needed)</span>
          </div>
          <div class="flex items-center gap-2 text-primary">
            <Check class="w-3.5 h-3.5" />
            <span>Installable Offline PWA Support</span>
          </div>
        </div>
      </div>

      <!-- STEP 2: WORKSPACE NAME & INFO -->
      <div v-else-if="currentStep === 2" class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-on-surface">Create Your Workspace</h2>
          <p class="text-xs text-muted">Tentukan nama ruang kerja operasional Anda.</p>
        </div>

        <div class="space-y-3">
          <UiInput
            v-model="wsName"
            label="Workspace Name"
            placeholder="e.g. NextGen Core Workspace"
            required
          />
          <UiInput
            v-model="wsDescription"
            label="Description / Purpose"
            placeholder="e.g. Pusat operasional dan pengembangan aplikasi internal"
          />
        </div>
      </div>

      <!-- STEP 3: WORKSPACE TYPE -->
      <div v-else-if="currentStep === 3" class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-on-surface">Select Workspace Archetype</h2>
          <p class="text-xs text-muted">Pilih konfigurasi dan fokus operasional workspace.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="type in wsTypes"
            :key="type.id"
            @click="selectedType = type.id"
            :class="[
              'p-4 rounded-xl border cursor-pointer transition space-y-2',
              selectedType === type.id
                ? 'bg-on-primary/30 border-primary ring-1 ring-primary'
                : 'bg-surface-container-lowest border-outline-variant hover:border-outline'
            ]"
          >
            <component :is="type.icon" class="w-5 h-5 text-primary" />
            <div>
              <div class="text-xs font-bold text-on-surface">{{ type.name }}</div>
              <p class="text-[10px] text-muted mt-0.5">{{ type.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 4: SUMMARY & CONFIRMATION -->
      <div v-else-if="currentStep === 4" class="space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-on-surface">Workspace Ready to Launch!</h2>
          <p class="text-xs text-muted">Ringkasan konfigurasi ruang kerja baru Anda.</p>
        </div>

        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-3 text-xs font-mono">
          <div class="flex justify-between pb-2 border-b border-outline-variant">
            <span class="text-muted">NAME:</span>
            <span class="text-primary font-bold">{{ wsName }}</span>
          </div>
          <div class="flex justify-between pb-2 border-b border-outline-variant">
            <span class="text-muted">TYPE:</span>
            <span class="text-secondary">{{ selectedType }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">DESCRIPTION:</span>
            <span class="text-on-surface text-right truncate max-w-60">{{ wsDescription || 'Standard Workspace' }}</span>
          </div>
        </div>
      </div>

      <!-- Footer Navigation Buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-outline-variant">
        <button
          v-if="currentStep > 1"
          @click="currentStep--"
          class="px-3.5 py-2 text-xs font-medium rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition"
        >
          &larr; Previous
        </button>
        <div v-else></div>

        <UiButton
          v-if="currentStep < 4"
          variant="primary"
          size="md"
          :icon="ArrowRight"
          @click="currentStep++"
        >
          Next Step
        </UiButton>

        <UiButton
          v-else
          variant="primary"
          size="md"
          :icon="Check"
          :loading="creating"
          @click="handleFinish"
        >
          Launch Workspace
        </UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles, Check, ArrowRight, User, Terminal, Briefcase } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useToast } from '../../composables/useToast'
import type { WorkspaceType } from '../../types'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const toast = useToast()

const currentStep = ref(1)
const wsName = ref('Command Center Alpha')
const wsDescription = ref('Pusat komando operasional AI Workforce pertama.')
const selectedType = ref<WorkspaceType>('Development')
const creating = ref(false)

const stepTitles = [
  'Overview & Vision',
  'Workspace Details',
  'Choose Archetype',
  'Launch Confirmation'
]

const wsTypes: { id: WorkspaceType; name: string; desc: string; icon: any }[] = [
  { id: 'Personal', name: 'Personal', desc: 'Eksplorasi ide dan proyek mandiri', icon: User },
  { id: 'Development', name: 'Development', desc: 'API contracts, software & cloud infrastructure', icon: Terminal },
  { id: 'Business', name: 'Business & Ops', desc: 'Pemasaran, CRM automation, dan customer ops', icon: Briefcase }
]

const handleFinish = async () => {
  creating.value = true
  try {
    await workspaceStore.createWorkspace({
      name: wsName.value,
      type: selectedType.value,
      description: wsDescription.value
    })
    toast.show('Workspace Created!', `Selamat datang di ${wsName.value}.`, 'success')
    router.push('/workspace')
  } finally {
    creating.value = false
  }
}
</script>
