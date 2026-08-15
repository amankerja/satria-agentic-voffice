<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div class="relative w-full max-w-xl bg-surface-container-lowest h-full border-l border-surface-container-high shadow-2xl flex flex-col justify-between overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <div>
          <h3 class="text-sm font-bold text-surface-on">Buat Konten & Kampanye Baru</h3>
          <p class="text-xs text-surface-muted">Distribusikan otomatis ke berbagai media sosial bisnis.</p>
        </div>
        <button @click="$emit('close')" class="rounded-lg p-1.5 text-surface-muted hover:bg-surface-container-high hover:text-surface-on">
          ✕
        </button>
      </div>

      <!-- Scrollable Form Body -->
      <div class="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
        <!-- Project & Policy -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Proyek Terkait</label>
            <select
              v-model="form.projectId"
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-2 text-surface-on text-xs"
            >
              <option value="prj-marketing">Marketing & Digital Business</option>
              <option value="prj-satria-ui">SATRIA AI Workforce UI</option>
              <option value="prj-internal-ops">Training & Safety Operations</option>
              <option value="prj-crm-saas">CRM SaaS Backend Engine</option>
            </select>
          </div>

          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Kebijakan Approval</label>
            <select
              v-model="form.approvalPolicy"
              class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3 py-2 text-surface-on text-xs"
            >
              <option value="Review">Review (Wajib Lead Approval)</option>
              <option value="Auto">Auto (Publikasi Otomatis)</option>
              <option value="Strict">Strict (2-Stage Approval)</option>
            </select>
          </div>
        </div>

        <!-- Target Platforms Checkboxes -->
        <div class="space-y-1.5">
          <label class="block font-medium text-surface-on-variant">Platform Tujuan Distribusi</label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="p in availablePlatforms"
              :key="p.id"
              class="flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer transition-all text-xs"
              :class="form.targetPlatforms.includes(p.id) ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-surface-container-high bg-surface-container-low text-surface-on-variant'"
            >
              <input
                type="checkbox"
                :value="p.id"
                v-model="form.targetPlatforms"
                class="rounded border-surface-container-high text-primary focus:ring-0"
              />
              <span>{{ p.label }}</span>
            </label>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label class="block font-medium text-surface-on-variant mb-1">Judul Utama Konten</label>
          <input
            type="text"
            v-model="form.title"
            placeholder="e.g. 5 Langkah Mengurangi Biaya Operasional dengan AI"
            class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on text-xs"
          />
        </div>

        <!-- Master Caption -->
        <div>
          <label class="block font-medium text-surface-on-variant mb-1">Deskripsi / Master Copy</label>
          <textarea
            v-model="form.caption"
            rows="4"
            placeholder="Tuliskan isi utama konten, konteks, dan poin-poin penjelasan..."
            class="w-full rounded-xl bg-surface-container-low border border-surface-container-high px-3.5 py-2 text-surface-on text-xs"
          ></textarea>
        </div>

        <!-- Platform Adaptation Sub-form -->
        <div v-if="form.targetPlatforms.includes('tiktok')" class="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
          <h4 class="font-bold text-rose-400 uppercase text-[11px]">Adaptasi Khusus TikTok</h4>
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Opening Hook (0-3 detik)</label>
            <input
              type="text"
              v-model="form.tiktokHook"
              placeholder="e.g. Stop buang waktu 4 jam cuma buat rekap data!"
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs"
            />
          </div>
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Script Video / Voiceover</label>
            <textarea
              v-model="form.tiktokScript"
              rows="3"
              placeholder="Tuliskan naskah narasi video..."
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs font-mono"
            ></textarea>
          </div>
        </div>

        <div v-if="form.targetPlatforms.includes('instagram')" class="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h4 class="font-bold text-primary uppercase text-[11px]">Adaptasi Khusus Instagram</h4>
          <div>
            <label class="block font-medium text-surface-on-variant mb-1">Hashtags (pisahkan dengan spasi)</label>
            <input
              type="text"
              v-model="form.igHashtags"
              placeholder="#SatriaAI #AutomasiBisnis #Produktif"
              class="w-full rounded-lg bg-surface-container-lowest border border-surface-container-high px-3 py-1.5 text-surface-on text-xs"
            />
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-end gap-3 border-t border-surface-container-high/60 px-6 py-4 bg-surface-container-low">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-xs font-medium text-surface-muted hover:text-surface-on"
        >
          Batal
        </button>
        <button
          @click="submitCreate"
          :disabled="!isFormValid"
          class="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-surface-container-lowest hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Simpan & Evaluasi Gate
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PlatformTarget } from '../../types'
import { useContentStore } from '../../stores/content'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const contentStore = useContentStore()

const availablePlatforms: { id: PlatformTarget; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook_page', label: 'Facebook Page' },
  { id: 'facebook_group', label: 'Facebook Group' }
]

const form = ref({
  projectId: 'prj-marketing',
  approvalPolicy: 'Review' as 'Auto' | 'Review' | 'Strict',
  targetPlatforms: ['instagram', 'facebook_page'] as PlatformTarget[],
  title: '',
  caption: '',
  tiktokHook: '',
  tiktokScript: '',
  igHashtags: '#SatriaWorkforce #AIAutomation'
})

const isFormValid = computed(() => {
  return form.value.title.trim().length >= 4 && form.value.targetPlatforms.length > 0
})

async function submitCreate() {
  if (!isFormValid.value) return

  const hashtags = form.value.igHashtags
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.startsWith('#'))

  await contentStore.createContent({
    projectId: form.value.projectId,
    projectName: 'Marketing & Digital Business',
    title: form.value.title,
    caption: form.value.caption,
    targetPlatforms: form.value.targetPlatforms,
    approvalPolicy: form.value.approvalPolicy,
    platformVersions: {
      instagram: {
        caption: form.value.caption,
        hashtags: hashtags.length ? hashtags : ['#SatriaAI', '#Workforce']
      },
      tiktok: {
        hook: form.value.tiktokHook || form.value.title,
        script: form.value.tiktokScript || form.value.caption
      },
      facebook_page: {
        caption: form.value.caption,
        cta: 'Kunjungi https://satria.workforce.ai untuk informasi lebih lanjut.'
      }
    }
  })

  emit('created')
  emit('close')
}
</script>
