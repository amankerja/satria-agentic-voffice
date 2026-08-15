<template>
  <div :class="['min-h-screen transition-colors duration-200', isLight ? 'bg-slate-50 text-slate-900' : 'bg-surface text-on-surface']">
    <!-- Topbar Banner -->
    <header :class="['sticky top-0 z-40 border-b px-6 py-4 flex items-center justify-between backdrop-blur-md', isLight ? 'bg-white/80 border-slate-200' : 'bg-surface/80 border-outline-variant']">
      <div class="flex items-center gap-3">
        <span class="font-bold text-primary tracking-wider text-lg">SATRIA</span>
        <span class="text-xs px-2 py-0.5 rounded border border-primary-container/30 bg-on-primary text-primary font-mono">Design System v1.0</span>
      </div>
      <div class="flex items-center gap-3">
        <button @click="isMobileView = !isMobileView" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-on-surface transition">
          {{ isMobileView ? 'Full View' : 'Simulasi Mobile' }}
        </button>
        <button @click="isLight = !isLight" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-on-surface transition">
          Mode: {{ isLight ? 'Light' : 'Dark' }}
        </button>
        <router-link to="/" class="text-xs text-primary hover:underline font-medium">&larr; Home</router-link>
      </div>
    </header>

    <main :class="['p-6 transition-all mx-auto', isMobileView ? 'max-w-97.5 border-x border-outline-variant shadow-2xl my-4 rounded-2xl bg-surface' : 'max-w-7xl']">
      <div class="space-y-10">
        <!-- Section Header -->
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-primary">Satria Operations Design Tokens & Components</h1>
          <p class="text-sm text-on-surface-variant mt-1">Landasan Bahasa Visual SATRIA AI WORKFORCE (Phase 02 Lock)</p>
        </div>

        <!-- Token Colors -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-outline-variant pb-2 text-on-surface">1. Color Tokens Palette</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div class="p-3 rounded-lg border border-outline-variant bg-surface">
              <div class="font-bold text-on-surface">Surface Base</div>
              <div class="text-muted">#0E1511 / #0B0D10</div>
            </div>
            <div class="p-3 rounded-lg border border-outline-variant bg-surface-container-low">
              <div class="font-bold text-on-surface">Container Low</div>
              <div class="text-muted">#161D19</div>
            </div>
            <div class="p-3 rounded-lg border border-outline-variant bg-surface-container">
              <div class="font-bold text-on-surface">Container Mid</div>
              <div class="text-muted">#1A211D</div>
            </div>
            <div class="p-3 rounded-lg border border-outline-variant bg-surface-container-high">
              <div class="font-bold text-on-surface">Container High</div>
              <div class="text-muted">#242C27</div>
            </div>
            <div class="p-3 rounded-lg border border-primary-container bg-on-primary text-primary">
              <div class="font-bold">Primary Emerald</div>
              <div>#4EDEA3 / #10B981</div>
            </div>
            <div class="p-3 rounded-lg border border-secondary-container bg-on-secondary text-secondary">
              <div class="font-bold">Secondary Cyan</div>
              <div>#4CD7F6</div>
            </div>
          </div>
        </section>

        <!-- Typography -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-outline-variant pb-2 text-on-surface">2. Typography Scale (Geist & JetBrains Mono)</h2>
          <div class="space-y-3 bg-surface-container-low p-5 rounded-xl border border-outline-variant">
            <p class="text-3xl font-semibold text-on-surface">Display (38px Geist): Your Digital Workforce Command Center</p>
            <p class="text-2xl font-semibold text-on-surface">H1 (30px Geist): Workspace Operations</p>
            <p class="text-xl font-medium text-on-surface">H2 (22px Geist): Projects & Active Tasks</p>
            <p class="text-base font-normal text-on-surface">Body LG (16px Geist): Standard interface body text with clean line height.</p>
            <p class="text-xs text-on-surface-variant">Caption (12px Geist): Metadata, timestamps, and secondary info labels.</p>
            <p class="text-xs font-mono text-primary">Machine Data (13px JetBrains Mono): SYSTEM_LOG_ID #8921-X39 // STATUS: OK</p>
          </div>
        </section>

        <!-- Buttons -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-outline-variant pb-2 text-on-surface">3. UiButton States</h2>
          <div class="flex flex-wrap items-center gap-4 bg-surface-container-low p-5 rounded-xl border border-outline-variant">
            <UiButton variant="primary" :icon="Plus">Primary</UiButton>
            <UiButton variant="secondary" :icon="Filter">Secondary</UiButton>
            <UiButton variant="ghost">Ghost</UiButton>
            <UiButton variant="danger" :icon="Trash2">Danger</UiButton>
            <UiButton variant="primary" loading>Loading</UiButton>
            <UiButton variant="primary" disabled>Disabled</UiButton>
            <UiButton variant="primary" size="sm">Small</UiButton>
            <UiButton variant="primary" size="lg">Large</UiButton>
          </div>
        </section>

        <!-- Inputs -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-outline-variant pb-2 text-on-surface">4. UiInput States</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low p-5 rounded-xl border border-outline-variant">
            <UiInput v-model="inputText" label="Default Input" placeholder="Ketik kata kunci..." :icon="Search" />
            <UiInput v-model="inputText" label="Input with Error" error="Nilai tidak boleh kosong" :icon="Search" />
            <UiInput v-model="inputText" label="Input Disabled" disabled hint="Field ini terkunci" :icon="Search" />
          </div>
        </section>

        <!-- Badges -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-outline-variant pb-2 text-on-surface">5. UiBadge Status Indicators</h2>
          <div class="flex flex-wrap items-center gap-3 bg-surface-container-low p-5 rounded-xl border border-outline-variant">
            <UiBadge variant="success" :icon="CheckCircle2">Success / Healthy</UiBadge>
            <UiBadge variant="warning" :icon="AlertTriangle">Warning / Due Soon</UiBadge>
            <UiBadge variant="error" :icon="XCircle">Error / Cancelled</UiBadge>
            <UiBadge variant="info" :icon="Info">Info / In Progress</UiBadge>
            <UiBadge variant="neutral" dot>Neutral / Todo</UiBadge>
          </div>
        </section>

        <!-- Cards & Progress -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-outline-variant pb-2 text-on-surface">6. UiCard & UiProgress</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UiCard hoverable>
              <template #header>
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-on-surface">CRM SaaS Platform</span>
                  <UiBadge variant="info">In Progress</UiBadge>
                </div>
              </template>
              <p class="text-xs text-on-surface-variant mb-4">Backend & Frontend architecture modernization</p>
              <UiProgress :value="82" label="Overall Progress" />
            </UiCard>

            <UiCard>
              <template #header>
                <span class="font-semibold text-on-surface">Workspace Metrics</span>
              </template>
              <div class="grid grid-cols-2 gap-3 font-mono text-center">
                <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                  <div class="text-2xl font-bold text-primary">12</div>
                  <div class="text-xs text-muted">Active Tasks</div>
                </div>
                <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                  <div class="text-2xl font-bold text-secondary">4</div>
                  <div class="text-xs text-muted">Projects</div>
                </div>
              </div>
            </UiCard>
          </div>
        </section>

        <!-- Skeleton, Empty State & Error State -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-outline-variant pb-2 text-on-surface">7. Skeleton, Empty & Error States</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UiCard>
              <div class="space-y-3">
                <UiSkeleton width="w-1/2" height="h-5" />
                <UiSkeleton width="w-full" height="h-10" />
                <UiSkeleton width="w-3/4" height="h-4" />
              </div>
            </UiCard>
            <UiEmptyState title="Belum Ada Proyek Ditambahkan" description="Buat proyek baru untuk mulai mengorganisir pekerjaan Anda.">
              <UiButton size="sm" :icon="Plus">Buat Proyek</UiButton>
            </UiEmptyState>
            <UiErrorState title="Koneksi Timeout" description="Gagal menghubungkan ke repository mock.">
              <UiButton size="sm" variant="secondary">Coba Lagi</UiButton>
            </UiErrorState>
          </div>
        </section>

        <!-- Modals, Drawers & Toast Triggers -->
        <section class="space-y-4">
          <h2 class="text-xl font-semibold border-b border-outline-variant pb-2 text-on-surface">8. Modals, Drawers & Toast Controls</h2>
          <div class="flex flex-wrap gap-3 bg-surface-container-low p-5 rounded-xl border border-outline-variant">
            <UiButton @click="showModal = true" variant="secondary">Buka Modal Test</UiButton>
            <UiButton @click="showDrawer = true" variant="secondary">Buka Drawer Test</UiButton>
            <UiButton @click="triggerToast" variant="primary">Trigger Toast Notification</UiButton>
          </div>
        </section>
      </div>
    </main>

    <!-- Modal Component Test -->
    <UiModal :open="showModal" title="Uji Coba UiModal" @close="showModal = false">
      <p class="text-sm text-on-surface-variant">Ini adalah komponen modal standar yang digunakan untuk pembuatan item baru atau dialog konfirmasi.</p>
      <template #footer>
        <UiButton variant="ghost" @click="showModal = false">Batal</UiButton>
        <UiButton variant="primary" @click="showModal = false">Simpan</UiButton>
      </template>
    </UiModal>

    <!-- Drawer Component Test -->
    <UiDrawer :open="showDrawer" title="Detail Item Drawer" @close="showDrawer = false">
      <p class="text-sm text-on-surface-variant">Drawer kanan digunakan untuk melihat rincian task, preview dokumen, atau panel notifikasi.</p>
    </UiDrawer>

    <!-- Toast Component Test -->
    <UiToast v-if="showToast" message="Design Tokens Locking OK" description="Semua elemen visual Phase 02 telah terverifikasi." variant="success" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Filter, Trash2, Search, CheckCircle2, AlertTriangle, XCircle, Info } from '@lucide/vue'
import UiButton from '../components/ui/UiButton.vue'
import UiInput from '../components/ui/UiInput.vue'
import UiBadge from '../components/ui/UiBadge.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import UiModal from '../components/ui/UiModal.vue'
import UiDrawer from '../components/ui/UiDrawer.vue'
import UiToast from '../components/ui/UiToast.vue'
import UiSkeleton from '../components/ui/UiSkeleton.vue'
import UiEmptyState from '../components/ui/UiEmptyState.vue'
import UiErrorState from '../components/ui/UiErrorState.vue'

const isLight = ref(false)
const isMobileView = ref(false)
const inputText = ref('')
const showModal = ref(false)
const showDrawer = ref(false)
const showToast = ref(false)

const triggerToast = () => {
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>
