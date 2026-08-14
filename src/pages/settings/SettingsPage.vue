<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Workspace Settings & Profile</h1>
        <p class="text-xs text-muted mt-1">
          Kelola preferensi antarmuka, profil akun, pintasan keyboard, dan konfigurasi workspace
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UiButton size="sm" variant="primary" :icon="Save" @click="saveAllSettings">
          {{ saveSuccess ? 'Saved!' : 'Save Changes' }}
        </UiButton>
      </div>
    </div>

    <!-- Main Grid: Left Tabs Sidebar & Right Content Panel -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- Left Sub-Navigation Tabs -->
      <div class="space-y-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left',
            activeTab === tab.id
              ? 'bg-surface-container-low text-primary font-semibold border border-outline-variant shadow-sm'
              : 'text-muted hover:text-on-surface hover:bg-surface-container-low/60'
          ]"
        >
          <component :is="tab.icon" class="w-4 h-4 shrink-0" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Right Tab Panels Content -->
      <div class="md:col-span-3 space-y-6">
        <!-- 1. GENERAL / PROFILE TAB -->
        <UiCard v-if="activeTab === 'general'" padding="lg">
          <template #header>
            <div class="space-y-0.5">
              <h2 class="text-sm font-bold text-on-surface">Profile & General Information</h2>
              <p class="text-xs text-muted">Informasi identitas akun dan pengaturan regional</p>
            </div>
          </template>

          <div class="space-y-5">
            <!-- Avatar Section -->
            <div class="flex items-center gap-4 pb-4 border-b border-outline-variant">
              <div class="w-16 h-16 rounded-full bg-primary-container/20 border-2 border-primary-container flex items-center justify-center font-bold text-lg text-primary overflow-hidden">
                <img v-if="profileForm.avatarUrl" :src="profileForm.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                <span v-else>SU</span>
              </div>
              <div class="space-y-1">
                <div class="text-xs font-semibold text-on-surface">Profile Avatar</div>
                <p class="text-[10px] text-muted">Format JPG, PNG atau GIF (Max 2MB)</p>
                <div class="flex gap-2 pt-1">
                  <UiButton size="sm" variant="secondary">Change Avatar</UiButton>
                </div>
              </div>
            </div>

            <!-- Form Inputs -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UiInput v-model="profileForm.displayName" label="Display Name" required />
              <UiInput v-model="profileForm.email" label="Email Address" type="email" required />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-on-surface-variant mb-1">Timezone</label>
                <select
                  v-model="profileForm.timezone"
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Asia/Jakarta (GMT+7)">Asia/Jakarta (GMT+7)</option>
                  <option value="Asia/Singapore (GMT+8)">Asia/Singapore (GMT+8)</option>
                  <option value="UTC (GMT+0)">UTC (GMT+0)</option>
                  <option value="America/New_York (GMT-5)">America/New_York (GMT-5)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-on-surface-variant mb-1">Language</label>
                <select
                  v-model="profileForm.language"
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="English (US)">English (US)</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Japanese (日本語)">Japanese (日本語)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-on-surface-variant mb-1">Default Landing Page</label>
              <select
                v-model="settingsForm.startPage"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="/">Home Overview</option>
                <option value="/workspace">Workspace View</option>
                <option value="/tasks">Tasks Command Center</option>
                <option value="/projects">Projects Directory</option>
              </select>
            </div>
          </div>
        </UiCard>

        <!-- 2. APPEARANCE TAB -->
        <UiCard v-else-if="activeTab === 'appearance'" padding="lg">
          <template #header>
            <div class="space-y-0.5">
              <h2 class="text-sm font-bold text-on-surface">Appearance & Design Tokens</h2>
              <p class="text-xs text-muted">Tema warna antarmuka, kontras, dan kerapatan tampilan</p>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Theme Mode Selection -->
            <div class="space-y-2">
              <label class="block text-xs font-medium text-on-surface-variant">Interface Theme</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div
                  @click="setTheme('dark')"
                  :class="[
                    'p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-2',
                    themeStore.currentTheme === 'dark'
                      ? 'bg-surface-container-low border-primary ring-1 ring-primary'
                      : 'bg-surface-container-lowest border-outline-variant hover:border-outline'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <Moon class="w-4 h-4 text-primary" />
                    <span v-if="themeStore.currentTheme === 'dark'" class="text-[10px] text-primary font-mono">Active</span>
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-on-surface">Dark Mode (Default)</div>
                    <p class="text-[10px] text-muted">#0e1511 Dark Operations Console</p>
                  </div>
                </div>

                <div
                  @click="setTheme('light')"
                  :class="[
                    'p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-2',
                    themeStore.currentTheme === 'light'
                      ? 'bg-surface-container-low border-primary ring-1 ring-primary'
                      : 'bg-surface-container-lowest border-outline-variant hover:border-outline'
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <Sun class="w-4 h-4 text-[#f59e0b]" />
                    <span v-if="themeStore.currentTheme === 'light'" class="text-[10px] text-primary font-mono">Active</span>
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-on-surface">Light Mode</div>
                    <p class="text-[10px] text-muted">Clean high-contrast daytime layout</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- UI Density / Compact Mode Toggle -->
            <div class="pt-4 border-t border-outline-variant flex items-center justify-between">
              <div class="space-y-0.5">
                <div class="text-xs font-semibold text-on-surface">Compact Mode</div>
                <p class="text-[10px] text-muted">Mengurangi padding tabel dan kartu untuk kerapatan data maksimal</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="settingsForm.compactMode" class="sr-only peer" />
                <div class="w-9 h-5 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
              </label>
            </div>
          </div>
        </UiCard>

        <!-- 3. WORKSPACE PREFERENCES TAB -->
        <UiCard v-else-if="activeTab === 'workspace'" padding="lg">
          <template #header>
            <div class="space-y-0.5">
              <h2 class="text-sm font-bold text-on-surface">Workspace Preferences</h2>
              <p class="text-xs text-muted">Perilaku navigasi, view task bawaan, dan sinkronisasi data</p>
            </div>
          </template>

          <div class="space-y-5">
            <div>
              <label class="block text-xs font-medium text-on-surface-variant mb-1">Default Task Center View</label>
              <select
                v-model="settingsForm.defaultTaskView"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="list">List View (Dense Row)</option>
                <option value="board">Board View (Kanban Columns)</option>
                <option value="calendar">Calendar View (Deadlines)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-on-surface-variant mb-1">Auto-Save State Interval (Seconds)</label>
              <input
                v-model.number="settingsForm.autoSaveInterval"
                type="number"
                min="5"
                max="120"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </UiCard>

        <!-- 4. NOTIFICATIONS TAB -->
        <UiCard v-else-if="activeTab === 'notifications'" padding="lg">
          <template #header>
            <div class="space-y-0.5">
              <h2 class="text-sm font-bold text-on-surface">Notification Preferences</h2>
              <p class="text-xs text-muted">Pemberitahuan real-time untuk task blocked, update status, dan file upload</p>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <div class="text-xs font-semibold text-on-surface">In-App Notifications</div>
                <p class="text-[10px] text-muted">Tampilkan pop-up toast dan badge merah pada topbar</p>
              </div>
              <input type="checkbox" v-model="settingsForm.inAppNotifications" class="w-4 h-4 rounded border-outline bg-surface-container-lowest text-primary" />
            </div>

            <div class="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <div class="text-xs font-semibold text-on-surface">Email Digest & Alerts</div>
                <p class="text-[10px] text-muted">Kirimkan ringkasan tugas harian ke email Anda</p>
              </div>
              <input type="checkbox" v-model="settingsForm.emailNotifications" class="w-4 h-4 rounded border-outline bg-surface-container-lowest text-primary" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold text-on-surface">Sound Notifications</div>
                <p class="text-[10px] text-muted">Bunyikan audio feedback saat task diselesaikan</p>
              </div>
              <input type="checkbox" v-model="settingsForm.soundEnabled" class="w-4 h-4 rounded border-outline bg-surface-container-lowest text-primary" />
            </div>
          </div>
        </UiCard>

        <!-- 5. KEYBOARD SHORTCUTS TAB -->
        <UiCard v-else-if="activeTab === 'shortcuts'" padding="lg">
          <template #header>
            <div class="space-y-0.5">
              <h2 class="text-sm font-bold text-on-surface">Keyboard Shortcuts Cheatsheet</h2>
              <p class="text-xs text-muted">Pintasan cepat untuk power users</p>
            </div>
          </template>

          <div class="space-y-3 font-mono text-xs">
            <div
              v-for="sc in keyboardShortcuts"
              :key="sc.combo"
              class="flex items-center justify-between p-3 bg-surface-container-lowest border border-outline-variant rounded-xl"
            >
              <span class="text-on-surface-variant font-sans">{{ sc.action }}</span>
              <kbd class="px-2.5 py-1 bg-surface-container-low border border-outline rounded-md text-primary font-bold">
                {{ sc.combo }}
              </kbd>
            </div>
          </div>
        </UiCard>

        <!-- 6. ABOUT TAB -->
        <UiCard v-else-if="activeTab === 'about'" padding="lg">
          <template #header>
            <div class="space-y-0.5">
              <h2 class="text-sm font-bold text-on-surface">About SATRIA AI Workforce</h2>
              <p class="text-xs text-muted">Spesifikasi arsitektur sistem & versi release</p>
            </div>
          </template>

          <div class="space-y-4 text-xs">
            <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant space-y-2">
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-primary">SATRIA AI WORKFORCE</span>
                <UiBadge variant="success" size="sm" class="font-mono">v0.1.0 Phase 0</UiBadge>
              </div>
              <p class="text-on-surface-variant leading-relaxed">
                "Build the office first. Fill it with AI later." PWA Digital Workspace untuk manajemen operasional proyek, tugas, berkas, dan metrik kinerja tanpa agent runtime.
              </p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
              <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                <div class="text-muted">FRAMEWORK</div>
                <div class="text-on-surface font-semibold mt-0.5">Vue 3 + Vite</div>
              </div>
              <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                <div class="text-muted">STYLING</div>
                <div class="text-on-surface font-semibold mt-0.5">Tailwind CSS v4</div>
              </div>
              <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                <div class="text-muted">STATE</div>
                <div class="text-on-surface font-semibold mt-0.5">Pinia Store</div>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  User,
  Palette,
  Briefcase,
  Bell,
  Keyboard,
  Info,
  Save,
  Moon,
  Sun
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import { useSettingsStore } from '../../stores/settings'
import { useThemeStore } from '../../stores/theme'

const settingsStore = useSettingsStore()
const themeStore = useThemeStore()

const activeTab = ref('general')
const saveSuccess = ref(false)

const tabs = [
  { id: 'general', label: 'General & Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'workspace', label: 'Workspace Prefs', icon: Briefcase },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'about', label: 'About SATRIA', icon: Info }
]

const profileForm = ref({
  displayName: 'Satria Utama',
  email: 'satria@workforce.ai',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  timezone: 'Asia/Jakarta (GMT+7)',
  language: 'English (US)'
})

const settingsForm = ref({
  startPage: '/',
  compactMode: false,
  defaultTaskView: 'list',
  autoSaveInterval: 30,
  inAppNotifications: true,
  emailNotifications: true,
  soundEnabled: false
})

const keyboardShortcuts = [
  { action: 'Open Command Center Palette', combo: 'Ctrl + K / Cmd + K' },
  { action: 'Quick Create New Item (+)', combo: 'Ctrl + N' },
  { action: 'Switch to Home Overview', combo: 'G then H' },
  { action: 'Switch to Tasks Center', combo: 'G then T' },
  { action: 'Switch to Projects Directory', combo: 'G then P' },
  { action: 'Close Drawer / Modal', combo: 'Escape' }
]

onMounted(async () => {
  themeStore.initTheme()
  await settingsStore.fetchSettings()
  if (settingsStore.user) {
    profileForm.value.displayName = settingsStore.user.displayName
    profileForm.value.email = settingsStore.user.email
    profileForm.value.timezone = settingsStore.user.timezone
    profileForm.value.language = settingsStore.user.language
  }
  if (settingsStore.settings) {
    settingsForm.value.startPage = settingsStore.settings.startPage || '/'
    settingsForm.value.compactMode = settingsStore.settings.compactMode || false
    settingsForm.value.defaultTaskView = settingsStore.settings.defaultTaskView || 'list'
  }
})

const setTheme = (theme: 'dark' | 'light') => {
  themeStore.setTheme(theme)
}

const saveAllSettings = async () => {
  await settingsStore.updateProfile({
    displayName: profileForm.value.displayName,
    email: profileForm.value.email,
    timezone: profileForm.value.timezone,
    language: profileForm.value.language
  })

  await settingsStore.updateSettings({
    startPage: settingsForm.value.startPage,
    compactMode: settingsForm.value.compactMode,
    defaultTaskView: settingsForm.value.defaultTaskView as any,
    autoSaveInterval: settingsForm.value.autoSaveInterval,
    inAppNotifications: settingsForm.value.inAppNotifications,
    emailNotifications: settingsForm.value.emailNotifications,
    soundEnabled: settingsForm.value.soundEnabled
  })

  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 2500)
}
</script>
