<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-base font-bold text-surface-on">Credential Vault & Isolasi Kunci Keamanan</h3>
        <p class="text-xs text-surface-muted">Penyimpanan kredensial terisolasi dengan enkripsi dan jaminan zero-leakage ke konteks prompt model.</p>
      </div>

      <button
        @click="showRotateModal = true"
        class="rounded-xl bg-surface-container-high hover:bg-surface-container-highest px-3.5 py-1.5 text-xs font-bold text-surface-on transition flex items-center gap-1.5"
      >
        <span>🔄 Rotasi Kunci</span>
      </button>
    </div>

    <!-- Security Guarantee Banner -->
    <div class="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
      <div class="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
        🛡️
      </div>
      <div class="text-xs text-surface-on space-y-1">
        <h4 class="font-bold">Zero-Leakage Security Guarantee</h4>
        <p class="text-surface-muted leading-relaxed">
          Kredensial pada vault ini hanya didekripsi saat pemanggilan resmi adapter external. Token rahasia <strong>tidak akan pernah</strong> diekspos ke model prompt, logs, atau UI browser secara plain-text.
        </p>
      </div>
    </div>

    <!-- Credentials Table -->
    <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-container-lowest border-b border-surface-container-high text-surface-muted uppercase font-mono text-[10px] tracking-wider">
            <tr>
              <th class="py-3.5 px-4 font-bold">Layanan Provider</th>
              <th class="py-3.5 px-4 font-bold">Tipe Kunci</th>
              <th class="py-3.5 px-4 font-bold">Nilai Masked (Aman)</th>
              <th class="py-3.5 px-4 font-bold">Status</th>
              <th class="py-3.5 px-4 font-bold">Terakhir Dirotasi</th>
              <th class="py-3.5 px-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-container-high/60 text-surface-on">
            <tr
              v-for="cred in credentials"
              :key="cred.id"
              class="hover:bg-surface-container-lowest/80 transition-colors font-mono"
            >
              <td class="py-3 px-4 font-bold text-xs uppercase text-primary">
                {{ cred.provider }}
              </td>
              <td class="py-3 px-4 text-surface-muted">
                {{ cred.keyType }}
              </td>
              <td class="py-3 px-4 font-bold text-cyan-400">
                {{ cred.maskedValue }}
              </td>
              <td class="py-3 px-4">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  :class="cred.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'"
                >
                  {{ cred.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-surface-muted text-[11px]">
                {{ formatDate(cred.lastRotatedAt) }}
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  v-if="cred.status === 'Active'"
                  @click="handleRevoke(cred.connectionId)"
                  class="rounded-lg border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 transition"
                >
                  Cabut Izin
                </button>
                <span v-else class="text-surface-muted text-[11px] italic">Dicabut</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Rotate Modal -->
    <div
      v-if="showRotateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      @click.self="showRotateModal = false"
    >
      <div class="w-full max-w-md rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 space-y-4 shadow-2xl">
        <h3 class="text-sm font-bold text-surface-on">Rotasi Kredensial Layanan</h3>
        <p class="text-xs text-surface-muted">Masukkan token baru untuk diperbarui ke dalam Credential Vault.</p>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Pilih Koneksi</label>
            <select v-model="rotateForm.connectionId" class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-2 text-surface-on">
              <option value="conn-github-01">GitHub App (conn-github-01)</option>
              <option value="conn-gmail-01">Gmail OAuth (conn-gmail-01)</option>
              <option value="conn-slack-01">Slack (conn-slack-01)</option>
            </select>
          </div>
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Token Rahasia Baru</label>
            <input
              type="password"
              v-model="rotateForm.newSecret"
              placeholder="e.g. ghs_new_secret_key..."
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-2 text-surface-on font-mono text-xs"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-high/60">
          <button @click="showRotateModal = false" class="px-4 py-2 text-xs font-medium text-surface-muted hover:text-surface-on">
            Batal
          </button>
          <button
            @click="submitRotate"
            class="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-surface-container-lowest hover:bg-primary/90"
          >
            Simpan & Masking
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CredentialVault, type StoredCredential } from '../../services/integrations/CredentialVault'
import { useToast } from '../../composables/useToast'

const toast = useToast()
const credentials = ref<StoredCredential[]>(CredentialVault.listCredentials())
const showRotateModal = ref(false)

const rotateForm = ref({
  connectionId: 'conn-github-01',
  newSecret: ''
})

function formatDate(isoStr?: string): string {
  if (!isoStr) return '-'
  return new Date(isoStr).toLocaleString('id-ID')
}

function handleRevoke(connectionId: string) {
  if (confirm('Apakah Anda yakin ingin mencabut kredensial ini? Kredensial akan langsung dinonaktifkan.')) {
    CredentialVault.revokeSecret(connectionId)
    credentials.value = CredentialVault.listCredentials()
    toast.info('Kredensial berhasil dicabut.')
  }
}

function submitRotate() {
  if (!rotateForm.value.newSecret) {
    toast.error('Token rahasia baru wajib diisi.')
    return
  }

  CredentialVault.rotateSecret(rotateForm.value.connectionId, rotateForm.value.newSecret)
  credentials.value = CredentialVault.listCredentials()
  showRotateModal.value = false
  rotateForm.value.newSecret = ''
  toast.success('Kredensial berhasil dirotasi dan dienkripsi ke vault.')
}
</script>
