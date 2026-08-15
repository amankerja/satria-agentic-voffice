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
          <div class="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs bg-primary/10 text-primary border border-primary/20">
            {{ form.providerId === 'github' ? 'GH' : form.providerId === 'gmail' ? 'GM' : 'INT' }}
          </div>
          <div>
            <h3 class="text-sm font-bold text-surface-on">
              Hubungkan Layanan {{ providerTitle }}
            </h3>
            <p class="text-[11px] text-surface-muted">Otorisasi integrasi resmi dengan Least Privilege & Credential Isolation.</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-surface-muted hover:text-surface-on">✕</button>
      </div>

      <!-- Form Body -->
      <div class="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
        <!-- Provider Selector -->
        <div>
          <label class="block font-medium text-surface-on-variant mb-1">Pilih Platform Provider</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="p in availableProviders"
              :key="p.id"
              type="button"
              @click="selectProvider(p.id)"
              class="p-2.5 rounded-xl border text-center font-bold transition-all"
              :class="form.providerId === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-surface-container-high bg-surface-container-low text-surface-muted hover:text-surface-on'"
            >
              {{ p.name }}
            </button>
          </div>
        </div>

        <!-- Display Name & Account -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Nama Tampilan Koneksi</label>
            <input
              type="text"
              v-model="form.displayName"
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on text-xs"
            />
          </div>
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">
              {{ form.providerId === 'github' ? 'GitHub Organization / User' : 'Email Address' }}
            </label>
            <input
              type="text"
              v-model="form.accountLabel"
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on text-xs"
            />
          </div>
        </div>

        <!-- GitHub Specific: Repositories Picker -->
        <div v-if="form.providerId === 'github'" class="space-y-2 rounded-xl border border-surface-container-high bg-surface-container-low p-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-surface-on text-[11px] uppercase tracking-wider">Repository Scope (Selected Only)</h4>
            <span class="text-[10px] text-primary font-mono font-bold">Least Privilege</span>
          </div>

          <div class="space-y-1.5 pt-1">
            <label v-for="repo in ['satria-api', 'satria-web', 'satria-core-runtime', 'sandbox-project']" :key="repo" class="flex items-center gap-2 text-surface-on cursor-pointer">
              <input
                type="checkbox"
                :value="repo"
                v-model="form.selectedRepos"
                class="h-4 w-4 rounded border-surface-container-high text-primary focus:ring-0 cursor-pointer"
              />
              <span class="font-mono text-[11px]">{{ repo }}</span>
            </label>
          </div>
        </div>

        <!-- Gmail Specific: Recipient Domain Rules -->
        <div v-else-if="form.providerId === 'gmail'" class="space-y-2 rounded-xl border border-surface-container-high bg-surface-container-low p-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-surface-on text-[11px] uppercase tracking-wider">Recipient Security Policy</h4>
            <span class="text-[10px] text-amber-400 font-mono font-bold">Approval Enforced</span>
          </div>

          <p class="text-[11px] text-surface-muted">
            Daftar domain yang diizinkan untuk dikirimi email oleh AI setelah melewati persetujuan manajer:
          </p>
          <input
            type="text"
            v-model="form.allowedDomains"
            placeholder="e.g. clientcorp.com, satria.workforce.ai, vendor.id"
            class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
          />
        </div>

        <!-- Credential Mock/OAuth Prompt -->
        <div class="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3">
          <svg class="h-5 w-5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p class="text-[11px] text-surface-on leading-relaxed">
            Kredensial disimpan secara terisolasi pada Credential Vault SATRIA dan tidak akan pernah diekspos ke model context atau prompt.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-2 border-t border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <button @click="$emit('close')" class="px-4 py-2 text-xs font-medium text-surface-muted hover:text-surface-on">
          Batal
        </button>
        <button
          @click="submitConnection"
          class="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 transition-colors"
        >
          Otorisasi & Simpan
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { IntegrationProviderType } from '../../types'
import { useIntegrationStore } from '../../stores/integration'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const integrationStore = useIntegrationStore()

const availableProviders: { id: IntegrationProviderType; name: string }[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'gmail', name: 'Gmail' },
  { id: 'slack', name: 'Slack' },
  { id: 'google_drive', name: 'Drive' }
]

const form = ref({
  providerId: 'github' as IntegrationProviderType,
  displayName: 'Satria Workforce Organization (GitHub App)',
  accountLabel: 'satria-workforce',
  selectedRepos: ['satria-api', 'satria-web', 'satria-core-runtime'],
  allowedDomains: 'clientcorp.com, satria.workforce.ai, vendorpartner.id'
})

const providerTitle = computed(() => {
  const p = availableProviders.find((x) => x.id === form.value.providerId)
  return p ? p.name : 'Integration'
})

function selectProvider(p: IntegrationProviderType) {
  form.value.providerId = p
  if (p === 'github') {
    form.value.displayName = 'Satria Workforce Organization (GitHub App)'
    form.value.accountLabel = 'satria-workforce'
  } else if (p === 'gmail') {
    form.value.displayName = 'Operations & Support Mailbox'
    form.value.accountLabel = 'support@satria.workforce.ai'
  } else if (p === 'slack') {
    form.value.displayName = 'Satria Engineering Slack'
    form.value.accountLabel = '#satria-alerts'
  } else {
    form.value.displayName = 'Satria Enterprise Shared Drive'
    form.value.accountLabel = 'drive.google.com/satria-docs'
  }
}

async function submitConnection() {
  await integrationStore.addConnection({
    providerId: form.value.providerId,
    workspaceId: 'ws-dev',
    displayName: form.value.displayName,
    accountLabel: form.value.accountLabel,
    status: 'Connected',
    scopes: form.value.providerId === 'github' ? ['repo', 'pull_requests:write', 'issues:write'] : ['gmail.readonly', 'gmail.send'],
    metadata: {
      repositories: form.value.selectedRepos,
      allowedRecipientDomains: form.value.allowedDomains.split(',').map((s) => s.trim())
    },
    credentials: {
      accessToken: 'vault_authenticated_token'
    },
    lastValidatedAt: new Date().toISOString()
  })

  emit('created')
  emit('close')
}
</script>
