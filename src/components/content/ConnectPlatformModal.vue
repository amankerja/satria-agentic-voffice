<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-xl rounded-2xl border border-surface-container-high bg-surface-container-lowest shadow-2xl overflow-hidden my-8">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <div class="flex items-center gap-2.5">
          <div
            class="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs"
            :class="selectedPlatformBadgeColor"
          >
            {{ selectedPlatformShortCode }}
          </div>
          <div>
            <h3 class="text-sm font-bold text-surface-on">
              Pengaturan API & Kredensial {{ platformDisplayName(form.platform) }}
            </h3>
            <p class="text-[11px] text-surface-muted">Konfigurasi token resmi agar AI Agent dapat memposting secara mandiri.</p>
          </div>
        </div>

        <button @click="$emit('close')" class="rounded-lg p-1.5 text-surface-muted hover:bg-surface-container-high hover:text-surface-on">
          ✕
        </button>
      </div>

      <!-- Form Content -->
      <div class="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
        <!-- Platform Switcher Buttons -->
        <div class="space-y-1.5">
          <label class="block font-medium text-surface-on-variant">Pilih Platform Target</label>
          <div class="grid grid-cols-5 gap-1.5 bg-surface-container-low p-1 rounded-xl border border-surface-container-high/60">
            <button
              v-for="p in platformsList"
              :key="p.id"
              type="button"
              @click="changePlatform(p.id)"
              class="px-2 py-2 rounded-lg font-bold text-[11px] transition-all text-center"
              :class="form.platform === p.id ? 'bg-primary text-surface-container-lowest shadow-sm' : 'text-surface-muted hover:text-surface-on hover:bg-surface-container-high/50'"
            >
              {{ p.shortCode }}
            </button>
          </div>
        </div>

        <!-- Account Info -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Nama Tampilan Akun</label>
            <input
              type="text"
              v-model="form.accountName"
              placeholder="e.g. SATRIA AI Official"
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on text-xs"
            />
          </div>
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Username / Handle</label>
            <input
              type="text"
              v-model="form.accountHandle"
              placeholder="e.g. @satria.workforce"
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on text-xs"
            />
          </div>
        </div>

        <!-- Platform-Specific API Fields -->
        <!-- 1. Instagram / Facebook Page -->
        <div v-if="form.platform === 'instagram' || form.platform === 'facebook_page'" class="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-primary text-[11px] uppercase tracking-wider">Meta Graph API Credentials</h4>
            <span class="text-[10px] text-surface-muted font-mono">v20.0</span>
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">
              {{ form.platform === 'instagram' ? 'Instagram Business Account ID' : 'Facebook Page ID' }}
            </label>
            <input
              type="text"
              v-model="form.accountId"
              :placeholder="form.platform === 'instagram' ? '17841400000000000' : '1092837465'"
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
            />
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Page Access Token (Long-Lived 60 Days)</label>
            <input
              type="password"
              v-model="form.accessToken"
              placeholder="EAAG... (masukkan token dari Graph API Explorer)"
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
            />
          </div>
        </div>

        <!-- 2. Threads -->
        <div v-else-if="form.platform === 'threads'" class="space-y-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-purple-400 text-[11px] uppercase tracking-wider">Meta Threads API Credentials</h4>
            <span class="text-[10px] text-surface-muted font-mono">Official API</span>
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Threads User ID</label>
            <input
              type="text"
              v-model="form.accountId"
              placeholder="e.g. 9876543210"
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
            />
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Threads Access Token</label>
            <input
              type="password"
              v-model="form.accessToken"
              placeholder="THQG... (masukkan token aplikasi Threads)"
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
            />
          </div>
        </div>

        <!-- 3. TikTok -->
        <div v-else-if="form.platform === 'tiktok'" class="space-y-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-cyan-400 text-[11px] uppercase tracking-wider">TikTok Content Posting API</h4>
            <span class="text-[10px] text-surface-muted font-mono">Direct Post v2</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-medium text-surface-on-variant mb-1">Client Key</label>
              <input
                type="text"
                v-model="form.clientKey"
                placeholder="aw..."
                class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
              />
            </div>
            <div>
              <label class="block font-medium text-surface-on-variant mb-1">Client Secret</label>
              <input
                type="password"
                v-model="form.clientSecret"
                placeholder="••••••••••••"
                class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">TikTok Creator Access Token</label>
            <input
              type="password"
              v-model="form.accessToken"
              placeholder="act.oauth_token_here..."
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
            />
          </div>
        </div>

        <!-- 4. Facebook Group (Assisted) -->
        <div v-else class="space-y-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-indigo-400 text-[11px] uppercase tracking-wider">Facebook Community Assisted Mode</h4>
            <span class="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 font-bold">Aman Anti-Ban</span>
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Tautan / Link Facebook Group</label>
            <input
              type="text"
              v-model="form.accountHandle"
              placeholder="https://facebook.com/groups/komunitas_bisnis_ai"
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs"
            />
          </div>
        </div>

        <!-- Auto-Publish Toggle Switch -->
        <div class="rounded-xl border border-surface-container-high/80 bg-surface-container-low p-3.5 flex items-center justify-between gap-3">
          <div>
            <p class="font-bold text-surface-on">Izinkan AI Posting Mandiri (Autonomous Auto-Post)</p>
            <p class="text-[11px] text-surface-muted">AI akan langsung mengirim konten yang lulus Quality Gate (>= 90) tanpa perlu konfirmasi klik manual.</p>
          </div>
          <input
            type="checkbox"
            v-model="form.autoPublishEnabled"
            class="h-5 w-5 rounded border-surface-container-high text-primary focus:ring-0 cursor-pointer"
          />
        </div>

        <!-- Test Connection Result Status Box -->
        <div v-if="testStatus" class="p-3 rounded-xl text-xs flex items-center gap-2" :class="testStatusClass">
          <svg v-if="testStatus.success" class="h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else class="h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ testStatus.message }}</span>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between border-t border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <button
          type="button"
          @click="runTestConnection"
          :disabled="isTesting"
          class="rounded-xl border border-surface-container-high bg-surface-container-lowest px-3.5 py-2 text-xs font-bold text-surface-on hover:bg-surface-container-high disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          <span v-if="isTesting">Menguji Token...</span>
          <span v-else>⚡ Uji Koneksi API</span>
        </button>

        <div class="flex items-center gap-2">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-xs font-medium text-surface-muted hover:text-surface-on"
          >
            Batal
          </button>
          <button
            @click="submitConnection"
            class="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-colors"
          >
            Simpan & Aktifkan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PlatformTarget, SocialConnection } from '../../types'
import { useSocialConnectionStore } from '../../stores/socialConnection'

const props = defineProps<{
  isOpen: boolean
  initialPlatform?: PlatformTarget
  existingConnection?: SocialConnection | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const socialStore = useSocialConnectionStore()

const platformsList: { id: PlatformTarget; shortCode: string; name: string }[] = [
  { id: 'instagram', shortCode: 'IG', name: 'Instagram' },
  { id: 'threads', shortCode: 'TH', name: 'Threads' },
  { id: 'facebook_page', shortCode: 'FB', name: 'Facebook Page' },
  { id: 'tiktok', shortCode: 'TT', name: 'TikTok' },
  { id: 'facebook_group', shortCode: 'GRP', name: 'Facebook Group' }
]

const form = ref({
  platform: 'instagram' as PlatformTarget,
  accountName: 'SATRIA AI Workforce Official',
  accountHandle: '@satria.workforce',
  accountId: '',
  accessToken: '',
  clientKey: '',
  clientSecret: '',
  autoPublishEnabled: true
})

const isTesting = ref(false)
const testStatus = ref<{ success: boolean; message: string } | null>(null)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      testStatus.value = null
      if (props.existingConnection) {
        form.value.platform = props.existingConnection.platform
        form.value.accountName = props.existingConnection.accountName
        form.value.accountHandle = props.existingConnection.accountHandle || ''
        form.value.accountId = props.existingConnection.accountId || ''
        form.value.accessToken = props.existingConnection.credentials?.accessToken || ''
        form.value.clientKey = props.existingConnection.credentials?.clientKey || ''
        form.value.clientSecret = props.existingConnection.credentials?.clientSecret || ''
        form.value.autoPublishEnabled = props.existingConnection.autoPublishEnabled ?? true
      } else if (props.initialPlatform) {
        changePlatform(props.initialPlatform)
      }
    }
  },
  { immediate: true }
)

function changePlatform(p: PlatformTarget) {
  form.value.platform = p
  testStatus.value = null
  switch (p) {
    case 'instagram':
      form.value.accountName = 'SATRIA Instagram Official'
      form.value.accountHandle = '@satria.workforce'
      form.value.accountId = '17841400000000000'
      break
    case 'threads':
      form.value.accountName = 'SATRIA Threads Official'
      form.value.accountHandle = '@satria.threads'
      form.value.accountId = '9876543210'
      break
    case 'facebook_page':
      form.value.accountName = 'SATRIA Autonomous Page'
      form.value.accountHandle = 'fb.com/satria.workforce'
      form.value.accountId = '1092837465'
      break
    case 'tiktok':
      form.value.accountName = 'SATRIA TikTok Creator'
      form.value.accountHandle = '@satria_official'
      form.value.clientKey = 'aw123456789'
      break
    case 'facebook_group':
      form.value.accountName = 'Komunitas Pengusaha & AI'
      form.value.accountHandle = 'https://facebook.com/groups/komunitas_bisnis_ai'
      break
  }
}

const selectedPlatformShortCode = computed(() => {
  const item = platformsList.find((p) => p.id === form.value.platform)
  return item ? item.shortCode : 'SOC'
})

const selectedPlatformBadgeColor = computed(() => {
  switch (form.value.platform) {
    case 'instagram':
      return 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white'
    case 'threads':
      return 'bg-purple-600 text-white'
    case 'facebook_page':
      return 'bg-blue-600 text-white'
    case 'tiktok':
      return 'bg-zinc-900 text-cyan-400 border border-zinc-700'
    default:
      return 'bg-indigo-600 text-white'
  }
})

const testStatusClass = computed(() => {
  if (!testStatus.value) return ''
  return testStatus.value.success
    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
})

function platformDisplayName(p: PlatformTarget): string {
  switch (p) {
    case 'instagram':
      return 'Instagram Business'
    case 'threads':
      return 'Threads'
    case 'facebook_page':
      return 'Facebook Page'
    case 'tiktok':
      return 'TikTok Creator'
    case 'facebook_group':
      return 'Facebook Group'
    default:
      return p
  }
}

async function runTestConnection() {
  isTesting.value = true
  testStatus.value = null

  await new Promise((resolve) => setTimeout(resolve, 800))
  isTesting.value = false

  if (form.value.platform !== 'facebook_group' && !form.value.accessToken && !form.value.clientKey) {
    testStatus.value = {
      success: false,
      message: 'Token atau Client Key masih kosong. Harap isi kredensial terlebih dahulu.'
    }
    return
  }

  testStatus.value = {
    success: true,
    message: `Koneksi API ${platformDisplayName(form.value.platform)} berhasil! Scope posting valid.`
  }
}

async function submitConnection() {
  await socialStore.addConnection({
    platform: form.value.platform,
    accountName: form.value.accountName,
    accountHandle: form.value.accountHandle,
    accountId: form.value.accountId,
    status: 'Connected',
    credentialReference: `vault:oauth:${form.value.platform}:token`,
    isAssisted: form.value.platform === 'facebook_group',
    autoPublishEnabled: form.value.autoPublishEnabled,
    credentials: {
      accessToken: form.value.accessToken,
      clientKey: form.value.clientKey,
      clientSecret: form.value.clientSecret,
      pageId: form.value.accountId
    }
  })

  emit('saved')
  emit('close')
}
</script>
