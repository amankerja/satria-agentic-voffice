<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h3 class="text-base font-bold text-surface-on">Koneksi & Kredensial Distribusi Sosial</h3>
        <p class="text-xs text-surface-muted">Kelola kredensial API resmi Instagram, Threads, Facebook Page, TikTok, dan Facebook Group langsung dari Web UI.</p>
      </div>

      <button
        @click="openConnectModal(undefined)"
        class="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Tambah / Konfigurasi Akun</span>
      </button>
    </div>

    <!-- Platform Cards Grid (5 Platforms) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <div
        v-for="platform in platformsList"
        :key="platform.id"
        class="rounded-2xl border border-surface-container-high/60 bg-surface-container-low p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div
              class="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm"
              :class="platform.badgeColor"
            >
              {{ platform.shortCode }}
            </div>
            <div>
              <h4 class="text-xs font-bold text-surface-on">{{ platform.name }}</h4>
              <p class="text-[10px] text-surface-muted truncate max-w-[110px]">{{ platform.type }}</p>
            </div>
          </div>

          <span
            v-if="getConnection(platform.id)"
            class="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            :class="getConnection(platform.id)?.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
          >
            {{ getConnection(platform.id)?.status }}
          </span>
        </div>

        <!-- Connection Details -->
        <div v-if="getConnection(platform.id)" class="space-y-1.5 text-xs bg-surface-container-lowest/60 p-3 rounded-xl border border-surface-container-high/40">
          <p class="font-bold text-surface-on truncate">{{ getConnection(platform.id)?.accountName }}</p>
          <p class="text-surface-muted text-[11px] truncate">{{ getConnection(platform.id)?.accountHandle }}</p>
          <div class="flex items-center justify-between pt-1 border-t border-surface-container-high/40 text-[10px]">
            <span class="text-surface-muted">
              {{ getConnection(platform.id)?.expiresAt ? formatDate(getConnection(platform.id)?.expiresAt) : 'OAuth Connected' }}
            </span>
            <span class="text-emerald-400 font-medium">
              ⚡ Auto-Post
            </span>
          </div>
        </div>
        <div v-else class="text-xs text-surface-muted bg-surface-container-lowest/40 p-3 rounded-xl border border-dashed border-surface-container-high text-center">
          Belum dikonfigurasi
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 border-t border-surface-container-high/40 flex items-center justify-between gap-2">
          <button
            v-if="!getConnection(platform.id) || getConnection(platform.id)?.status !== 'Connected'"
            @click="openConnectModal(platform.id)"
            class="w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
          >
            Setting API & Token
          </button>
          <div v-else class="w-full flex items-center gap-2">
            <button
              @click="openConnectModal(platform.id, getConnection(platform.id))"
              class="flex-1 rounded-xl bg-surface-container-high px-2.5 py-1.5 text-xs font-medium text-surface-on hover:bg-surface-container-highest transition-colors truncate"
            >
              Ubah API
            </button>
            <button
              @click="disconnectPlatform(getConnection(platform.id)!.id)"
              class="rounded-xl border border-rose-500/30 px-2 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Putus Koneksi"
            >
              Putus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Connect Platform Modal -->
    <ConnectPlatformModal
      :is-open="showConnectModal"
      :initial-platform="selectedPlatformForModal"
      :existing-connection="selectedExistingConnection"
      @close="showConnectModal = false"
      @saved="socialStore.loadConnections"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SocialConnection, PlatformTarget } from '../../types'
import { useSocialConnectionStore } from '../../stores/socialConnection'
import ConnectPlatformModal from './ConnectPlatformModal.vue'

const props = defineProps<{
  connections: SocialConnection[]
}>()

const socialStore = useSocialConnectionStore()

const platformsList: { id: PlatformTarget; name: string; type: string; shortCode: string; badgeColor: string }[] = [
  { id: 'instagram', name: 'Instagram', type: 'Feed & Reels API', shortCode: 'IG', badgeColor: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white' },
  { id: 'threads', name: 'Threads', type: 'Official Threads API', shortCode: 'TH', badgeColor: 'bg-purple-600 text-white' },
  { id: 'facebook_page', name: 'Facebook Page', type: 'Meta Graph API', shortCode: 'FB', badgeColor: 'bg-blue-600 text-white' },
  { id: 'tiktok', name: 'TikTok', type: 'Creator Posting API', shortCode: 'TT', badgeColor: 'bg-zinc-900 text-cyan-400 border border-zinc-700' },
  { id: 'facebook_group', name: 'Facebook Group', type: 'Assisted Community', shortCode: 'GRP', badgeColor: 'bg-indigo-600 text-white' }
]

const showConnectModal = ref(false)
const selectedPlatformForModal = ref<PlatformTarget | undefined>(undefined)
const selectedExistingConnection = ref<SocialConnection | null>(null)

function getConnection(platform: PlatformTarget): SocialConnection | undefined {
  return props.connections.find((c) => c.platform === platform)
}

function formatDate(isoStr?: string): string {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })
}

function openConnectModal(platform?: PlatformTarget, existing?: SocialConnection) {
  selectedPlatformForModal.value = platform || 'instagram'
  selectedExistingConnection.value = existing || null
  showConnectModal.value = true
}

async function disconnectPlatform(id: string) {
  if (confirm('Yakin ingin memutuskan koneksi akun ini?')) {
    await socialStore.disconnect(id)
  }
}
</script>
