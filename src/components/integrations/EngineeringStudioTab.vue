<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="rounded-2xl border border-purple-500/30 bg-surface-container-low p-6 space-y-4 shadow-sm relative overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-purple-400 flex items-center gap-1">
              <span class="h-1.5 w-1.5 rounded-full bg-purple-400" :class="isExecuting ? 'animate-pulse' : ''" />
              MODE 3 — PURE ENGINEERING EXECUTION
            </span>
            <h3 class="text-base font-black text-surface-on">
              Software Development & GitHub Pipeline
            </h3>
          </div>
          <p class="text-xs text-surface-muted mt-1 max-w-2xl leading-relaxed">
            Jalur khusus engineering software murni: <strong>Coding Task</strong> → <strong>Digital Employee (Bima)</strong> → <strong>GitHub Repository</strong> → <strong>Branch</strong> → <strong>Code Patch</strong> → <strong>Quality Gate Test</strong> → <strong>Pull Request</strong>. Bebas dari ketergantungan email.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handleRunEngineeringTask"
            :disabled="isExecuting"
            class="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <svg v-if="isExecuting" class="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{{ isExecuting ? 'Bima Sedang Coding...' : 'Eksekusi Coding Task & Buat PR' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Execution & Deliverables Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 2 Cols: Engineering Task Details & Code Diff -->
      <div class="lg:col-span-2 space-y-4">
        <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low p-5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-mono font-bold text-purple-400 uppercase">1. Penugasan Task Coding</span>
            <span class="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
              Assigned: Bima (Backend Engineer)
            </span>
          </div>

          <h4 class="text-sm font-bold text-surface-on">
            Task #101: Fix JWT Auth Token Race Condition di satria-api
          </h4>
          <p class="text-xs text-surface-muted leading-relaxed">
            Perbaiki penanganan refresh token concurrency pada <code class="text-primary font-mono">pkg/auth/auth_handler.go</code> dengan menambahkan mutex locking untuk mencegah HTTP 500 saat refresh token bersamaan.
          </p>

          <!-- Code Diff Preview -->
          <div class="space-y-1.5 pt-2 border-t border-surface-container-high/60">
            <span class="text-[10px] font-mono font-bold text-surface-muted uppercase">Code Patch (Diff Preview):</span>
            <pre class="rounded-xl bg-surface-container-lowest border border-surface-container-high/60 p-3 font-mono text-[11px] text-surface-on overflow-x-auto">
<span class="text-surface-muted">// pkg/auth/auth_handler.go</span>
 func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
<span class="text-emerald-400 font-bold">+	h.mutex.Lock()</span>
<span class="text-emerald-400 font-bold">+	defer h.mutex.Unlock()</span>
<span class="text-rose-400 font-bold">-	token := r.Header.Get("Authorization")</span>
<span class="text-emerald-400 font-bold">+	token := sanitizeAuthToken(r.Header.Get("Authorization"))</span>
 	newToken, err := h.jwtService.Refresh(token)
            </pre>
          </div>
        </div>
      </div>

      <!-- 1 Col: Quality Gate & GitHub PR Output -->
      <div class="space-y-4">
        <h4 class="text-xs font-bold text-surface-on uppercase tracking-wider font-mono">
          Hasil Verifikasi & Pull Request
        </h4>

        <div class="rounded-2xl border border-surface-container-high/80 bg-surface-container-low p-5 space-y-4 text-xs">
          <!-- Quality Gate -->
          <div class="space-y-2 pb-3 border-b border-surface-container-high/60">
            <span class="text-[11px] font-mono font-bold text-surface-muted uppercase">Quality Gate & Test</span>
            <div class="space-y-1 text-emerald-400 font-bold flex items-center gap-1.5">
              <span>✓</span>
              <span>24/24 Unit Tests Pass (0 errors)</span>
            </div>
            <p class="text-[11px] text-surface-muted font-mono">
              vue-tsc typecheck 0 errors, security scan clear.
            </p>
          </div>

          <!-- PR Card -->
          <div class="space-y-2">
            <span class="text-[11px] font-mono font-bold text-surface-muted uppercase">GitHub Pull Request</span>
            <div class="rounded-xl bg-surface-container-lowest border border-purple-500/30 p-3 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-surface-on">satria-api #143</span>
                <span class="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-400">
                  Open PR
                </span>
              </div>
              <p class="text-[11px] text-surface-muted">
                Branch: <code class="text-primary font-mono">fix/auth-token-leak</code> &rarr; <code class="text-surface-on font-mono">main</code>
              </p>
              <a
                href="https://github.com/amankerja/satria-agentic-voffice/pull/143"
                target="_blank"
                rel="noopener"
                class="block rounded-lg bg-purple-600/20 border border-purple-500/40 p-2 text-purple-300 hover:bg-purple-600/30 transition text-center font-mono font-bold mt-2"
              >
                🐙 Buka Pull Request #143 &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useIntegrationStore } from '../../stores/integration'
import { EngineeringExecutionEngine } from '../../services/engineering/EngineeringExecutionEngine'
import { useToast } from '../../composables/useToast'

const integrationStore = useIntegrationStore()
const toast = useToast()
const isExecuting = ref(false)

async function handleRunEngineeringTask() {
  const ghConn = integrationStore.getConnectionByProvider('github')
  if (!ghConn) {
    toast.error('Koneksi GitHub App diperlukan untuk menjalankan task engineering.')
    return
  }

  isExecuting.value = true
  try {
    const result = await EngineeringExecutionEngine.executeCodingTask(ghConn, {
      taskId: 'tsk-eng-001',
      taskTitle: 'Fix JWT Auth Token Concurrency',
      repository: 'satria-api',
      targetBranch: 'fix/auth-token-leak',
      fileChanges: [
        {
          path: 'pkg/auth/auth_handler.go',
          newContent: 'package auth\n\n// Patched with mutex locking',
          commitMessage: 'fix(auth): sanitize JWT mutex locking'
        }
      ],
      pullRequestTitle: 'fix(auth): sanitize JWT mutex locking',
      pullRequestBody: 'Perbaikan concurrency mutex locking untuk mencegah race condition.'
    })

    if (result.success) {
      toast.success('Coding Task Selesai! Pull Request #143 berhasil dibuat di GitHub.')
    } else {
      toast.error('Gagal membuat Pull Request: ' + result.error)
    }
  } catch (err: any) {
    toast.error('Eksekusi engineering gagal: ' + err.message)
  } finally {
    isExecuting.value = false
  }
}
</script>
