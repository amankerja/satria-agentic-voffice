<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-on-surface">Workspace Settings & Profile</h1>
        <p class="text-xs text-muted mt-1">
          Kelola preferensi antarmuka, API runtime AI, model LLM, profil akun, dan konfigurasi database
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
                <option value="/">Home Dashboard</option>
                <option value="/tasks">Tasks Center</option>
                <option value="/projects">Projects Directory</option>
                <option value="/workforce/overview">Workforce Command Center</option>
              </select>
            </div>
          </div>
        </UiCard>

        <!-- 2. AI RUNTIME & MODEL CONFIGURATION TAB (NEW) -->
        <UiCard v-else-if="activeTab === 'aiRuntime'" padding="lg">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="space-y-0.5">
                <h2 class="text-sm font-bold text-on-surface flex items-center gap-2">
                  <Cpu class="w-4 h-4 text-primary" />
                  <span>AI Agent Runtime & Model Configuration</span>
                </h2>
                <p class="text-xs text-muted">
                  Atur Base URL API, API Key, Provider, dan pilih Model LLM yang digunakan oleh agent secara dinamis
                </p>
              </div>

              <!-- Live Ping Badge -->
              <UiBadge
                :variant="aiStore.connectionStatus === 'success' ? 'success' : aiStore.connectionStatus === 'error' ? 'error' : 'neutral'"
                size="sm"
                class="font-mono"
              >
                <span v-if="aiStore.isTesting" class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                  Pinging...
                </span>
                <span v-else-if="aiStore.connectionStatus === 'success'" class="flex items-center gap-1">
                  ● Connected ({{ aiStore.latencyMs }}ms)
                </span>
                <span v-else-if="aiStore.connectionStatus === 'error'" class="flex items-center gap-1">
                  ● Offline / Disconnected
                </span>
                <span v-else>● Ready</span>
              </UiBadge>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Runtime Mode Selection Banner -->
            <div class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-on-surface flex items-center gap-2">
                    <span>Execution Runtime Engine</span>
                  </div>
                  <p class="text-[11px] text-muted mt-0.5">Pilih engine eksekusi agent yang aktif di workspace ini</p>
                </div>

                <div class="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg border border-outline-variant">
                  <button
                    type="button"
                    @click="agentRunStore.setRuntimeMode('hermes')"
                    :class="[
                      'px-3 py-1.5 rounded-md text-xs font-medium transition',
                      agentRunStore.runtimeMode === 'hermes'
                        ? 'bg-primary-container text-surface-base font-bold shadow-sm'
                        : 'text-muted hover:text-on-surface'
                    ]"
                  >
                    Hermes Gateway (Real)
                  </button>
                  <button
                    type="button"
                    @click="agentRunStore.setRuntimeMode('mock')"
                    :class="[
                      'px-3 py-1.5 rounded-md text-xs font-medium transition',
                      agentRunStore.runtimeMode === 'mock'
                        ? 'bg-primary-container text-surface-base font-bold shadow-sm'
                        : 'text-muted hover:text-on-surface'
                    ]"
                  >
                    Mock Simulation
                  </button>
                </div>
              </div>
            </div>

            <!-- API Endpoints & Auth Grid -->
            <div class="space-y-4">
              <div class="text-xs font-bold uppercase font-mono tracking-wider text-muted">
                1. Gateway & LLM Server Endpoints
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <UiInput
                    v-model="aiStore.hermesBaseUrl"
                    label="Hermes Gateway Base URL"
                    placeholder="/hermes-api atau http://127.0.0.1:8642"
                    hint="URL backend gateway Hermes (Default: /hermes-api via Vite proxy)"
                  />
                </div>

                <div>
                  <UiInput
                    v-model="aiStore.hermesApiKey"
                    label="Hermes API Key"
                    type="password"
                    placeholder="satria-local-dev"
                    hint="API Key otentikasi yang diset di $env:API_SERVER_KEY"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <UiInput
                    v-model="aiStore.llmBaseUrl"
                    label="Local / Upstream LLM Base URL"
                    placeholder="http://localhost:20128/v1"
                    hint="Endpoint server OpenAI-compatible atau local LLM proxy"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-on-surface-variant mb-1">Provider Type</label>
                  <select
                    v-model="aiStore.selectedProvider"
                    class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                  >
                    <option value="custom">custom (Localhost / LM Studio / Proxy)</option>
                    <option value="nous">nous (NousResearch Inference Portal)</option>
                    <option value="openai">openai (Official OpenAI API)</option>
                    <option value="openrouter">openrouter (OpenRouter Multi-Model)</option>
                    <option value="anthropic">anthropic (Anthropic Claude Native)</option>
                    <option value="gemini">gemini (Google AI Studio / Gemini)</option>
                  </select>
                </div>
              </div>

              <!-- Connection Test & Model Discovery Action -->
              <div class="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="text-xs space-y-0.5">
                  <div class="font-bold text-on-surface flex items-center gap-2">
                    <Radio class="w-3.5 h-3.5 text-primary" />
                    <span>Test Connection & Discover Models</span>
                  </div>
                  <div class="text-muted text-[11px]">
                    {{ aiStore.connectionMessage || 'Ping gateway dan tarik daftar model yang aktif secara otomatis.' }}
                  </div>
                </div>

                <UiButton
                  size="sm"
                  variant="secondary"
                  :loading="aiStore.isTesting"
                  :icon="RefreshCw"
                  @click="handleTestConnection"
                >
                  {{ aiStore.isTesting ? 'Fetching...' : 'Test & Fetch Models' }}
                </UiButton>
              </div>
            </div>

            <!-- Model Selection & Combo Box -->
            <div class="space-y-4 pt-2 border-t border-outline-variant">
              <div class="text-xs font-bold uppercase font-mono tracking-wider text-muted flex items-center justify-between">
                <span>2. Model Selection (Combo & Custom)</span>
                <span class="text-[10px] text-primary">{{ aiStore.availableModels.length }} models available</span>
              </div>

              <!-- Combo Model Dropdown -->
              <div>
                <label class="block text-xs font-medium text-on-surface-variant mb-1">
                  Pilih Model dari Daftar Terdeteksi (Combo Dropdown)
                </label>
                <select
                  v-model="aiStore.selectedModel"
                  class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                >
                  <option v-for="m in aiStore.availableModels" :key="m" :value="m">
                    {{ m }}
                  </option>
                </select>
              </div>

              <!-- Custom Model Input Override -->
              <div>
                <UiInput
                  v-model="aiStore.selectedModel"
                  label="Atau Ketik Model ID Kustom Secara Manual"
                  placeholder="Contoh: fast-work-free, gemini/gemini-2.5-flash, 1/qwen-3.7-max"
                  hint="Model ID ini yang akan dikirimkan saat eksekusi task agent."
                />
              </div>

              <!-- Popular Quick Presets -->
              <div class="space-y-1.5">
                <span class="text-[11px] font-mono text-muted">Quick Presets:</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="preset in quickModelPresets"
                    :key="preset"
                    type="button"
                    @click="aiStore.setModel(preset)"
                    :class="[
                      'px-2.5 py-1 rounded-lg text-[11px] font-mono transition border',
                      aiStore.selectedModel === preset
                        ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                        : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary/50'
                    ]"
                  >
                    {{ preset }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Hyperparameters: Temperature & Max Tokens -->
            <div class="space-y-4 pt-2 border-t border-outline-variant">
              <div class="text-xs font-bold uppercase font-mono tracking-wider text-muted">
                3. Sampling Parameters
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Temperature -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <label class="font-medium text-on-surface-variant">Temperature</label>
                    <span class="font-mono font-bold text-primary">{{ aiStore.temperature }}</span>
                  </div>
                  <input
                    type="range"
                    v-model.number="aiStore.temperature"
                    min="0"
                    max="1"
                    step="0.05"
                    class="w-full accent-primary bg-surface-container-lowest cursor-pointer"
                  />
                  <div class="flex justify-between text-[10px] font-mono text-muted">
                    <span>0.0 (Strict & Precise)</span>
                    <span>1.0 (Creative)</span>
                  </div>
                </div>

                <!-- Max Tokens -->
                <div>
                  <UiInput
                    v-model.number="aiStore.maxTokens"
                    label="Max Generation Tokens"
                    type="number"
                    min="256"
                    max="128000"
                    step="256"
                    hint="Batas maksimum token per turn respons agent (Default: 4096)"
                  />
                </div>
              </div>
            </div>

            <!-- Save Action Button -->
            <div class="pt-3 border-t border-outline-variant flex items-center justify-between">
              <span class="text-[11px] text-muted">
                Perubahan model dan URL akan langsung aktif untuk semua eksekusi run berikutnya.
              </span>
              <UiButton size="sm" variant="primary" :icon="Save" @click="saveAllSettings">
                Simpan Konfigurasi AI
              </UiButton>
            </div>
          </div>
        </UiCard>

        <!-- 3. APPEARANCE TAB -->
        <UiCard v-else-if="activeTab === 'appearance'" padding="lg">
          <template #header>
            <div class="space-y-0.5">
              <h2 class="text-sm font-bold text-on-surface">Appearance & Theme</h2>
              <p class="text-xs text-muted">Kustomisasi tema warna, mode gelap, dan kepadatan tata letak</p>
            </div>
          </template>

          <div class="space-y-5">
            <div>
              <label class="block text-xs font-medium text-on-surface-variant mb-2">Color Theme</label>
              <div class="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  @click="setTheme('dark')"
                  :class="[
                    'flex items-center gap-3 p-3 rounded-xl border text-xs font-medium transition',
                    themeStore.currentTheme === 'dark'
                      ? 'bg-surface-container-low border-primary text-primary font-bold shadow-sm'
                      : 'bg-surface-container-lowest border-outline-variant text-muted hover:text-on-surface'
                  ]"
                >
                  <Moon class="w-4 h-4" />
                  <span>Dark Mode (Emerald)</span>
                </button>

                <button
                  type="button"
                  @click="setTheme('light')"
                  :class="[
                    'flex items-center gap-3 p-3 rounded-xl border text-xs font-medium transition',
                    themeStore.currentTheme === 'light'
                      ? 'bg-surface-container-low border-primary text-primary font-bold shadow-sm'
                      : 'bg-surface-container-lowest border-outline-variant text-muted hover:text-on-surface'
                  ]"
                >
                  <Sun class="w-4 h-4" />
                  <span>Light Mode</span>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-outline-variant">
              <div>
                <div class="text-xs font-semibold text-on-surface">Compact Mode</div>
                <p class="text-[10px] text-muted">Kurangi padding dan ukuran kartu untuk densitas data lebih tinggi</p>
              </div>
              <input type="checkbox" v-model="settingsForm.compactMode" class="w-4 h-4 rounded border-outline bg-surface-container-lowest text-primary" />
            </div>
          </div>
        </UiCard>

        <!-- 4. WORKSPACE PREFERENCES TAB -->
        <UiCard v-else-if="activeTab === 'workspace'" padding="lg">
          <template #header>
            <div class="space-y-0.5">
              <h2 class="text-sm font-bold text-on-surface">Workspace Defaults & Storage</h2>
              <p class="text-xs text-muted">Pengaturan default view, auto-save interval, dan status database</p>
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-on-surface-variant mb-1">Default Task View Mode</label>
              <select
                v-model="settingsForm.defaultTaskView"
                class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="list">List View (Compact Hierarchy)</option>
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

            <!-- Real Database Persistence Status & Reset -->
            <div class="pt-4 border-t border-outline-variant space-y-3">
              <div class="flex items-center justify-between">
                <div class="space-y-0.5">
                  <div class="text-xs font-semibold text-on-surface flex items-center gap-2">
                    <Database class="w-3.5 h-3.5 text-primary" />
                    <span>Real Persistent Database (IndexedDB + Disk Sync)</span>
                  </div>
                  <p class="text-[10px] text-muted">
                    Data tersimpan permanen di IndexedDB browser & tersinkronisasi ke file <code class="text-primary font-mono">data/database.json</code> pada disk.
                  </p>
                </div>
                <UiBadge variant="success" size="sm" class="font-mono">Real DB Active</UiBadge>
              </div>

              <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex items-center justify-between gap-4">
                <div class="text-[11px] text-muted space-y-0.5">
                  <div class="text-on-surface font-medium">Reset Database ke Default Seed</div>
                  <div>Kembalikan database ke data seeder bersih (12 karyawan & 1 contoh task per project).</div>
                </div>
                <UiButton size="sm" variant="danger" :icon="RotateCcw" @click="handleResetStorage">
                  Reset Database
                </UiButton>
              </div>
            </div>
          </div>
        </UiCard>

        <!-- 5. NOTIFICATIONS TAB -->
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

        <!-- 6. KEYBOARD SHORTCUTS TAB -->
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

        <!-- 7. ABOUT TAB -->
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
                <UiBadge variant="success" size="sm" class="font-mono">v0.1.0 Phase 3</UiBadge>
              </div>
              <p class="text-on-surface-variant leading-relaxed">
                "Your Digital Workforce Command Center" — PWA Digital Workspace untuk orkestrasi dan eksekusi AI Agent secara otonom dengan real database, dynamic model switching, dan full observability.
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
                <div class="text-muted">RUNTIME</div>
                <div class="text-on-surface font-semibold mt-0.5">Hermes + Mock</div>
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
  Cpu,
  Palette,
  Briefcase,
  Bell,
  Keyboard,
  Info,
  Save,
  Moon,
  Sun,
  Database,
  RotateCcw,
  RefreshCw,
  Radio
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import { useSettingsStore } from '../../stores/settings'
import { useThemeStore } from '../../stores/theme'
import { useAgentRunStore } from '../../stores/agentRun'
import { useAiRuntimeConfigStore } from '../../stores/aiRuntimeConfig'
import { useToast } from '../../composables/useToast'
import { clearAllMockStorage } from '../../utils/mockStorage'
import { dbClient } from '../../database/DatabaseClient'

const toast = useToast()

const settingsStore = useSettingsStore()
const themeStore = useThemeStore()
const agentRunStore = useAgentRunStore()
const aiStore = useAiRuntimeConfigStore()

const activeTab = ref('aiRuntime')
const saveSuccess = ref(false)

const tabs = [
  { id: 'aiRuntime', label: 'AI Runtime & Models', icon: Cpu },
  { id: 'general', label: 'General & Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'workspace', label: 'Workspace Prefs', icon: Briefcase },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'about', label: 'About SATRIA', icon: Info }
]

const quickModelPresets = [
  'fast-work-free',
  'gemini/gemini-2.5-flash',
  'kc/anthropic/claude-sonnet-4-20250514',
  '1/qwen-3.7-max',
  'kr/deepseek-3.2',
  'kc/deepseek/deepseek-chat',
  'hermes-3-llama-3.1-70b'
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
  aiStore.initConfig()
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

const handleTestConnection = async () => {
  const result = await aiStore.testConnectionAndFetchModels()
  if (result.ok) {
    toast.show(result.message, undefined, 'success')
  } else {
    toast.show(result.message, undefined, 'error')
  }
}

const saveAllSettings = async () => {
  await aiStore.saveConfig()

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
  toast.show('Semua pengaturan dan konfigurasi AI Runtime berhasil disimpan!', undefined, 'success')
  setTimeout(() => {
    saveSuccess.value = false
  }, 2500)
}

const handleResetStorage = async () => {
  if (confirm('Apakah Anda yakin ingin mereset database ke data seeder default (12 karyawan & 1 contoh task per project)? Halaman akan dimuat ulang.')) {
    clearAllMockStorage()
    await dbClient.resetToDefaults()
    try {
      await fetch('/api/db/reset', { method: 'POST' })
    } catch {
      // ignore
    }
    toast.show('Database berhasil direset ke seed default', undefined, 'success')
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }
}
</script>
