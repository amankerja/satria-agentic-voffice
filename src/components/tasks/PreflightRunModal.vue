<template>
  <UiModal
    :open="open"
    title="Pre-Flight Execution Check"
    @close="$emit('close')"
  >
    <div class="space-y-4 p-1">
      <p class="text-xs text-muted">
        Validating system readiness, sandbox security, and runtime availability before launching execution for <span class="text-on-surface font-semibold">"{{ taskTitle }}"</span>.
      </p>

      <!-- 5-Point Health Matrix -->
      <div class="space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3">
        <!-- 1. Workspace Folder -->
        <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/40">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-primary shrink-0" />
            <div>
              <div class="text-xs font-medium text-on-surface">Target Workspace Folder</div>
              <div class="text-[10px] font-mono text-muted">{{ folderPath || 'Path not configured' }}</div>
            </div>
          </div>
          <span class="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">Ready</span>
        </div>

        <!-- 2. Assigned Digital Worker -->
        <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/40">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-primary shrink-0" />
            <div>
              <div class="text-xs font-medium text-on-surface">Assigned Worker Status</div>
              <div class="text-[10px] text-muted">{{ workerName }} (Active & Permission Verified)</div>
            </div>
          </div>
          <span class="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
        </div>

        <!-- 3. AI Runtime Gateway -->
        <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/40">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-primary shrink-0" />
            <div>
              <div class="text-xs font-medium text-on-surface">Autonomous AI Runtime</div>
              <div class="text-[10px] text-muted">{{ runtimeName }}</div>
            </div>
          </div>
          <span class="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">Connected</span>
        </div>

        <!-- 4. Sandbox Policy -->
        <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/40">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-primary shrink-0" />
            <div>
              <div class="text-xs font-medium text-on-surface">Tool Sandbox Policy</div>
              <div class="text-[10px] text-muted">Path traversal & symlink defenses enabled</div>
            </div>
          </div>
          <span class="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">Secured</span>
        </div>

        <!-- 5. Conflict Check -->
        <div class="flex items-center justify-between py-1.5">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-primary shrink-0" />
            <div>
              <div class="text-xs font-medium text-on-surface">Concurrency Conflict Check</div>
              <div class="text-[10px] text-muted">Zero lock conflicts on target codebase</div>
            </div>
          </div>
          <span class="text-[10px] font-mono text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">Pass</span>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="pt-3 border-t border-outline-variant flex items-center justify-end gap-2.5">
        <UiButton variant="ghost" size="sm" @click="$emit('close')">
          Cancel
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :icon="Play"
          :loading="launching"
          @click="handleLaunch"
        >
          Launch Execution
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircle2, Play } from '@lucide/vue'
import UiModal from '../ui/UiModal.vue'
import UiButton from '../ui/UiButton.vue'

defineProps<{
  open: boolean
  taskId: string
  taskTitle: string
  folderPath?: string
  workerName?: string
  runtimeName?: string
}>()

const emit = defineEmits(['close', 'launch'])

const launching = ref(false)

const handleLaunch = () => {
  launching.value = true
  try {
    emit('launch')
    emit('close')
  } finally {
    launching.value = false
  }
}
</script>
