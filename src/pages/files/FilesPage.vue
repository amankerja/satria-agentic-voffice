<template>
  <div class="space-y-6">
    <!-- Header & Storage KPI -->
    <div class="border-b border-outline-variant pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Files Manager</h1>
          <UiBadge variant="info" size="sm" class="font-mono">
            {{ fileStore.filteredFiles.length }} Assets
          </UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Pusat penyimpanan dokumen, blueprint, konfigurasi, dan arsip di {{ workspaceStore.currentWorkspace?.name }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Storage Usage Pill -->
        <div class="hidden sm:flex items-center gap-2 bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-mono text-on-surface-variant">
          <HardDrive class="w-3.5 h-3.5 text-primary" />
          <span>{{ fileStore.totalSizeFormatted }} used</span>
        </div>

        <!-- Upload File Button -->
        <UiButton size="sm" variant="primary" :icon="UploadCloud" @click="openUploadModal = true">
          Upload File
        </UiButton>
      </div>
    </div>

    <!-- Filters, Search & View Switcher Bar -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
      <!-- Category Pills -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="fileStore.selectedCategory = cat"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap flex items-center gap-1.5',
            fileStore.selectedCategory === cat
              ? 'bg-surface-container-high text-primary font-semibold border border-outline'
              : 'text-muted hover:text-on-surface hover:bg-surface-container'
          ]"
        >
          <component :is="getCategoryIcon(cat)" class="w-3.5 h-3.5" />
          <span>{{ cat }}</span>
          <span class="text-[10px] opacity-70 font-mono">({{ getCategoryCount(cat) }})</span>
        </button>
      </div>

      <!-- Right: Search & View Switcher -->
      <div class="flex items-center gap-2.5">
        <!-- Search Input -->
        <div class="relative flex-1 sm:w-64">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            v-model="fileStore.searchQuery"
            type="text"
            placeholder="Search filename or project..."
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
          />
          <button
            v-if="fileStore.searchQuery"
            @click="fileStore.searchQuery = ''"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-on-surface"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- View Switcher -->
        <div class="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-outline-variant">
          <button
            @click="viewMode = 'grid'"
            :class="['p-1.5 rounded text-xs transition', viewMode === 'grid' ? 'bg-surface-container-high text-primary' : 'text-muted hover:text-on-surface']"
            title="Grid View"
          >
            <LayoutGrid class="w-3.5 h-3.5" />
          </button>
          <button
            @click="viewMode = 'list'"
            :class="['p-1.5 rounded text-xs transition', viewMode === 'list' ? 'bg-surface-container-high text-primary' : 'text-muted hover:text-on-surface']"
            title="List View"
          >
            <List class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <UiEmptyState
      v-if="fileStore.filteredFiles.length === 0"
      title="No files found"
      description="Tidak ada file yang sesuai dengan filter atau kata kunci pencarian."
    >
      <UiButton size="sm" variant="secondary" @click="resetFilters">
        Reset Filter
      </UiButton>
    </UiEmptyState>

    <!-- GRID VIEW -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="file in fileStore.filteredFiles"
        :key="file.id"
        @click="fileStore.openPreview(file)"
        class="bg-surface-container-low hover:bg-surface-container border border-outline-variant hover:border-outline rounded-xl p-4 cursor-pointer transition flex flex-col justify-between group space-y-3 shadow-sm"
      >
        <!-- File Top Card Header -->
        <div class="flex items-start justify-between gap-2">
          <div class="w-10 h-10 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition">
            <component :is="getFileIcon(file.extension)" class="w-5 h-5" />
          </div>
          <UiBadge variant="neutral" size="sm" class="font-mono uppercase text-[10px]">
            .{{ file.extension }}
          </UiBadge>
        </div>

        <!-- File Details -->
        <div>
          <h3 class="text-xs font-semibold text-on-surface group-hover:text-primary transition line-clamp-1">
            {{ file.name }}
          </h3>
          <p v-if="file.projectName" class="text-[10px] text-muted font-mono mt-0.5 truncate">
            {{ file.projectName }}
          </p>
          <p v-if="file.description" class="text-[11px] text-on-surface-variant line-clamp-2 mt-1.5 leading-relaxed">
            {{ file.description }}
          </p>
        </div>

        <!-- Thumbnail Image if available -->
        <div v-if="file.url" class="w-full h-24 rounded-lg overflow-hidden border border-outline-variant bg-surface-container-lowest">
          <img :src="file.url" :alt="file.name" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
        </div>

        <!-- Card Footer -->
        <div class="flex items-center justify-between pt-2 border-t border-outline-variant text-[10px] font-mono text-muted">
          <span>{{ file.sizeFormatted }}</span>
          <span>{{ file.updatedAt }}</span>
        </div>
      </div>
    </div>

    <!-- LIST / TABLE VIEW -->
    <div v-else-if="viewMode === 'list'" class="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-container-lowest text-muted font-mono text-[11px] uppercase border-b border-outline-variant">
            <tr>
              <th class="py-3 px-4">Filename</th>
              <th class="py-3 px-4 hidden sm:table-cell">Category</th>
              <th class="py-3 px-4 hidden md:table-cell">Project</th>
              <th class="py-3 px-4">Size</th>
              <th class="py-3 px-4 hidden lg:table-cell">Uploaded By</th>
              <th class="py-3 px-4 text-right">Modified</th>
              <th class="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant">
            <tr
              v-for="file in fileStore.filteredFiles"
              :key="file.id"
              @click="fileStore.openPreview(file)"
              class="hover:bg-surface-container cursor-pointer transition"
            >
              <td class="py-3 px-4 flex items-center gap-3">
                <div class="w-7 h-7 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary shrink-0">
                  <component :is="getFileIcon(file.extension)" class="w-4 h-4" />
                </div>
                <div class="truncate">
                  <div class="font-semibold text-on-surface hover:text-primary transition truncate max-w-xs sm:max-w-md">
                    {{ file.name }}
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 hidden sm:table-cell">
                <UiBadge variant="neutral" size="sm">{{ file.category }}</UiBadge>
              </td>
              <td class="py-3 px-4 hidden md:table-cell text-on-surface-variant font-mono text-[11px]">
                {{ file.projectName || '—' }}
              </td>
              <td class="py-3 px-4 font-mono text-on-surface-variant text-[11px]">
                {{ file.sizeFormatted }}
              </td>
              <td class="py-3 px-4 hidden lg:table-cell text-muted">
                {{ file.uploadedBy || 'Satria Utama' }}
              </td>
              <td class="py-3 px-4 text-right font-mono text-muted text-[11px]">
                {{ file.updatedAt }}
              </td>
              <td class="py-3 px-4 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    @click="fileStore.openPreview(file)"
                    class="p-1.5 text-muted hover:text-primary hover:bg-surface-container-high rounded transition"
                    title="Preview"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDeleteFile(file.id)"
                    class="p-1.5 text-muted hover:text-error hover:bg-surface-container-high rounded transition"
                    title="Delete"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- FILE PREVIEW DRAWER -->
    <UiDrawer
      :open="fileStore.isPreviewOpen"
      :title="fileStore.selectedFile?.name || 'File Preview'"
      @close="fileStore.closePreview()"
    >
      <div v-if="fileStore.selectedFile" class="space-y-5 text-xs text-on-surface">
        <!-- File Header Card -->
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-3">
          <div class="w-12 h-12 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center text-primary shrink-0">
            <component :is="getFileIcon(fileStore.selectedFile.extension)" class="w-6 h-6" />
          </div>
          <div class="truncate">
            <div class="font-bold text-sm text-on-surface truncate">{{ fileStore.selectedFile.name }}</div>
            <div class="text-[11px] font-mono text-primary mt-0.5">{{ fileStore.selectedFile.sizeFormatted }} &bull; {{ fileStore.selectedFile.category }}</div>
          </div>
        </div>

        <!-- Visual Preview Zone -->
        <div class="space-y-2">
          <span class="text-[10px] font-mono uppercase text-muted tracking-wider">Preview</span>
          
          <!-- Image Preview -->
          <div v-if="fileStore.selectedFile.url" class="rounded-xl overflow-hidden border border-outline-variant bg-surface-container-lowest">
            <img :src="fileStore.selectedFile.url" :alt="fileStore.selectedFile.name" class="w-full max-h-64 object-cover" />
          </div>

          <!-- Code / Text Preview -->
          <div v-else-if="fileStore.selectedFile.contentPreview" class="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant font-mono text-[11px] text-on-surface-variant overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
{{ fileStore.selectedFile.contentPreview }}
          </div>

          <!-- Default Generic Preview Fallback -->
          <div v-else class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant text-center space-y-2">
            <FileText class="w-8 h-8 mx-auto text-muted" />
            <p class="text-xs text-on-surface-variant">Preview visual tidak tersedia untuk format .{{ fileStore.selectedFile.extension }}</p>
          </div>
        </div>

        <!-- Description -->
        <div v-if="fileStore.selectedFile.description" class="space-y-1">
          <span class="text-[10px] font-mono uppercase text-muted tracking-wider">Description</span>
          <p class="text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-outline-variant leading-relaxed">
            {{ fileStore.selectedFile.description }}
          </p>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 gap-3 font-mono">
          <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
            <div class="text-[10px] text-muted">PROJECT</div>
            <div class="font-semibold text-secondary mt-0.5 truncate">{{ fileStore.selectedFile.projectName || 'Global' }}</div>
          </div>
          <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
            <div class="text-[10px] text-muted">UPLOADED BY</div>
            <div class="font-semibold text-on-surface mt-0.5">{{ fileStore.selectedFile.uploadedBy || 'Satria Utama' }}</div>
          </div>
          <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
            <div class="text-[10px] text-muted">LAST MODIFIED</div>
            <div class="font-semibold text-on-surface-variant mt-0.5">{{ fileStore.selectedFile.updatedAt }}</div>
          </div>
          <div class="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
            <div class="text-[10px] text-muted">FILE SIZE</div>
            <div class="font-semibold text-primary mt-0.5">{{ fileStore.selectedFile.sizeFormatted }}</div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <UiButton
            variant="danger"
            size="sm"
            :icon="Trash2"
            @click="handleDeleteFile(fileStore.selectedFile!.id)"
          >
            Delete
          </UiButton>
          <div class="flex items-center gap-2">
            <UiButton
              variant="secondary"
              size="sm"
              :icon="Copy"
              @click="copyFileLink"
            >
              {{ copied ? 'Copied!' : 'Copy Link' }}
            </UiButton>
            <UiButton
              variant="primary"
              size="sm"
              :icon="Download"
              @click="simulateDownload"
            >
              Download
            </UiButton>
          </div>
        </div>
      </template>
    </UiDrawer>

    <!-- UPLOAD FILE MODAL -->
    <UiModal :open="openUploadModal" title="Upload New File" @close="openUploadModal = false">
      <div class="space-y-4 text-xs">
        <!-- Drag & Drop Zone -->
        <div class="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-6 text-center space-y-2 bg-surface-container-lowest transition cursor-pointer">
          <UploadCloud class="w-8 h-8 mx-auto text-primary" />
          <div class="font-semibold text-on-surface">Drag and drop your file here, or browse</div>
          <p class="text-[10px] text-muted">Support PDF, PNG, JPG, JSON, SQL, ZIP (Max 50MB)</p>
        </div>

        <UiInput v-model="newFileName" label="Filename with Extension" placeholder="e.g. system_architecture_v2.pdf" required />
        
        <div>
          <label class="block text-xs font-medium text-on-surface-variant mb-1">Category</label>
          <select v-model="newFileCategory" class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary">
            <option value="Documents">Documents</option>
            <option value="Images">Images</option>
            <option value="Code">Code</option>
            <option value="Exports">Exports</option>
            <option value="Archives">Archives</option>
          </select>
        </div>

        <UiInput v-model="newFileProject" label="Associated Project Name" placeholder="e.g. SATRIA AI Workforce UI" />
        <UiInput v-model="newFileDescription" label="Description / Summary" placeholder="Brief explanation about this file..." />
      </div>

      <template #footer>
        <UiButton variant="ghost" @click="openUploadModal = false">Cancel</UiButton>
        <UiButton variant="primary" :icon="UploadCloud" @click="handleUpload">Confirm Upload</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  UploadCloud,
  Search,
  X,
  LayoutGrid,
  List,
  FileText,
  Image,
  Code,
  Archive,
  Download,
  Trash2,
  Copy,
  Eye,
  HardDrive,
  FolderOpen
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiDrawer from '../../components/ui/UiDrawer.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useFileStore } from '../../stores/file'
import type { FileCategory } from '../../types'

const workspaceStore = useWorkspaceStore()
const fileStore = useFileStore()

const viewMode = ref<'grid' | 'list'>('grid')
const openUploadModal = ref(false)
const copied = ref(false)

const newFileName = ref('')
const newFileCategory = ref<FileCategory>('Documents')
const newFileProject = ref('SATRIA AI Workforce UI')
const newFileDescription = ref('')

const categories: (FileCategory | 'All')[] = ['All', 'Documents', 'Images', 'Code', 'Exports', 'Archives']

const loadFiles = () => {
  fileStore.fetchFilesByWorkspace(workspaceStore.currentWorkspaceId)
}

onMounted(() => {
  loadFiles()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadFiles()
})

const getCategoryCount = (cat: FileCategory | 'All') => {
  if (cat === 'All') return fileStore.files.length
  return fileStore.files.filter((f) => f.category === cat).length
}

const getCategoryIcon = (cat: FileCategory | 'All') => {
  switch (cat) {
    case 'Documents': return FileText
    case 'Images': return Image
    case 'Code': return Code
    case 'Exports': return Download
    case 'Archives': return Archive
    default: return FolderOpen
  }
}

const getFileIcon = (ext: string) => {
  const e = ext.toLowerCase()
  if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(e)) return Image
  if (['ts', 'js', 'json', 'css', 'html', 'sql', 'yml', 'yaml', 'txt'].includes(e)) return Code
  if (['zip', 'tar', 'gz', 'rar'].includes(e)) return Archive
  return FileText
}

const resetFilters = () => {
  fileStore.selectedCategory = 'All'
  fileStore.searchQuery = ''
}

const handleDeleteFile = async (id: string) => {
  await fileStore.deleteFile(id)
}

const copyFileLink = () => {
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const simulateDownload = () => {
  alert(`Mengunduh ${fileStore.selectedFile?.name}...`)
}

const handleUpload = async () => {
  if (!newFileName.value.trim()) return
  const ext = newFileName.value.split('.').pop() || 'txt'
  await fileStore.uploadFile({
    workspaceId: workspaceStore.currentWorkspaceId,
    name: newFileName.value,
    extension: ext,
    category: newFileCategory.value,
    projectName: newFileProject.value,
    sizeBytes: 1048576,
    sizeFormatted: '1.0 MB',
    uploadedBy: 'Satria Utama',
    description: newFileDescription.value || 'Uploaded file document.',
    contentPreview: 'Mock uploaded file contents ready for preview.'
  })

  newFileName.value = ''
  newFileDescription.value = ''
  openUploadModal.value = false
}
</script>
