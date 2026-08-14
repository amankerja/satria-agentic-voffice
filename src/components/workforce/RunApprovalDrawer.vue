<template>
  <UiDrawer
    :open="open"
    title="Human-in-the-Loop Gate"
    @close="handleClose"
  >
    <div v-if="approvalRequest" class="space-y-5">
      <!-- Error Display -->
      <div v-if="errorMessage" class="p-3 bg-error/15 border border-error/30 rounded-xl text-xs text-error font-medium flex items-center justify-between">
        <span>{{ errorMessage }}</span>
        <button @click="errorMessage = null" aria-label="Dismiss error" class="text-error hover:underline text-[11px]">Dismiss</button>
      </div>

      <!-- Warning Risk Header Card -->
      <div class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
        <div class="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <ShieldAlert class="w-4 h-4 shrink-0" />
          <span>High-Risk Tool Authorization Required</span>
        </div>
        <p class="text-xs text-on-surface-variant leading-relaxed">
          {{ approvalRequest.reason || 'This action requires explicit human confirmation before executing against the workspace.' }}
        </p>
      </div>

      <!-- Tool Call Metadata Key-Value Table -->
      <div class="p-3.5 bg-surface-container-low border border-outline-variant rounded-xl font-mono text-xs space-y-2">
        <div class="flex items-center justify-between border-b border-outline-variant pb-2">
          <span class="text-muted text-[10px] uppercase">Requested Tool</span>
          <div class="flex items-center gap-1.5 font-bold text-primary">
            <Terminal class="w-3.5 h-3.5" />
            <span>{{ approvalRequest.toolCall.toolName }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between border-b border-outline-variant pb-2">
          <span class="text-muted text-[10px] uppercase">Target Scope</span>
          <span class="text-on-surface truncate max-w-60" :title="targetFilePath">
            {{ targetFilePath }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-muted text-[10px] uppercase">Requested At</span>
          <span class="text-muted text-[11px]">{{ formattedTimestamp }}</span>
        </div>
      </div>

      <!-- Visual Diff / Content Previewer -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-on-surface flex items-center gap-1.5">
            <FileCode class="w-4 h-4 text-primary" />
            Visual Diff & Payload Preview
          </label>
          <span class="text-[10px] font-mono text-muted">
            {{ approvalRequest.diffContent ? 'Unified Git Diff' : 'Structured Payload' }}
          </span>
        </div>

        <div
          v-if="approvalRequest.diffContent"
          class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed scrollbar-thin"
        >
          <div
            v-for="(line, lIdx) in parsedDiffLines"
            :key="lIdx"
            :class="[
              'px-2 py-0.5 rounded font-mono whitespace-pre',
              line.startsWith('+') && !line.startsWith('+++')
                ? 'bg-primary-container/20 text-primary font-bold'
                : line.startsWith('-') && !line.startsWith('---')
                ? 'bg-error/20 text-error'
                : line.startsWith('@@')
                ? 'bg-secondary/15 text-secondary font-bold'
                : 'text-on-surface-variant'
            ]"
          >
            {{ line }}
          </div>
        </div>

        <div
          v-else-if="approvalRequest.previewContent"
          class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-[11px] max-h-60 overflow-y-auto leading-relaxed text-on-surface-variant whitespace-pre-wrap scrollbar-thin"
        >
          {{ approvalRequest.previewContent }}
        </div>

        <div
          v-else
          class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-center text-xs text-muted font-mono"
        >
          No visual diff available for this tool call.
        </div>
      </div>

      <!-- Rejection Feedback Form (Conditional) -->
      <div v-if="showRejectForm" class="p-4 bg-surface-container-low border border-error/30 rounded-xl space-y-2.5 animate-fadeIn">
        <label class="block text-xs font-bold text-error">
          Rejection Feedback (Optional)
        </label>
        <textarea
          v-model="rejectReason"
          rows="2"
          :disabled="submitting"
          aria-label="Rejection feedback reason"
          placeholder="Explain why this action is rejected to help the agent plan an alternative..."
          class="w-full bg-surface-container-lowest border border-outline-variant focus:border-error rounded-lg p-2.5 text-xs text-on-surface placeholder-muted focus:outline-none transition resize-none font-mono disabled:opacity-50"
        ></textarea>
        <div class="flex justify-end gap-2 pt-1">
          <UiButton size="sm" variant="ghost" @click="showRejectForm = false" :disabled="submitting">
            Cancel
          </UiButton>
          <UiButton size="sm" variant="danger" :disabled="submitting" :loading="submitting" @click="handleReject">
            {{ submitting ? 'Rejecting...' : 'Confirm Rejection' }}
          </UiButton>
        </div>
      </div>

      <!-- Main Action Buttons -->
      <div v-if="!showRejectForm" class="pt-4 border-t border-outline-variant flex items-center justify-end gap-3">
        <UiButton
          variant="danger"
          size="sm"
          :disabled="submitting"
          @click="showRejectForm = true"
        >
          Reject Action
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :icon="CheckCircle2"
          :disabled="submitting"
          :loading="submitting"
          @click="handleApprove"
        >
          {{ submitting ? 'Approving...' : 'Approve & Execute' }}
        </UiButton>
      </div>
    </div>

    <div v-else class="py-12 text-center text-muted text-xs font-mono">
      No pending approval request found for this run.
    </div>
  </UiDrawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShieldAlert, Terminal, FileCode, CheckCircle2 } from '@lucide/vue'
import UiDrawer from '../ui/UiDrawer.vue'
import UiButton from '../ui/UiButton.vue'
import type { ApprovalRequest } from '../../runtime/types'

const props = defineProps<{
  open: boolean
  runId: string
  approvalRequest?: ApprovalRequest | null
  onApproveAsync?: (approvalId: string) => Promise<boolean | void>
  onRejectAsync?: (approvalId: string, feedback?: string) => Promise<boolean | void>
  onApprove?: (approvalId: string) => Promise<boolean | void>
  onReject?: (approvalId: string, feedback?: string) => Promise<boolean | void>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'approve', approvalId: string): void
  (e: 'reject', approvalId: string, feedback?: string): void
}>()

const submitting = ref<boolean>(false)
const showRejectForm = ref<boolean>(false)
const rejectReason = ref<string>('')
const errorMessage = ref<string | null>(null)

const targetFilePath = computed(() => {
  if (!props.approvalRequest) return 'Workspace'
  const params = props.approvalRequest.toolCall.parameters || {}
  return params.path || params.filePath || params.file || 'Workspace Root'
})

const formattedTimestamp = computed(() => {
  if (!props.approvalRequest?.requestedAt) return 'Just now'
  return new Date(props.approvalRequest.requestedAt).toLocaleTimeString()
})

const parsedDiffLines = computed(() => {
  if (!props.approvalRequest?.diffContent) return []
  return props.approvalRequest.diffContent.split('\n')
})

function handleClose() {
  if (!submitting.value) {
    showRejectForm.value = false
    errorMessage.value = null
    emit('close')
  }
}

async function handleApprove() {
  if (submitting.value || !props.approvalRequest) return
  submitting.value = true
  errorMessage.value = null

  try {
    const handler = props.onApproveAsync || props.onApprove
    if (handler) {
      await handler(props.approvalRequest.id)
    } else {
      emit('approve', props.approvalRequest.id)
    }
    showRejectForm.value = false
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to submit approval authorization.'
  } finally {
    submitting.value = false
  }
}

async function handleReject() {
  if (submitting.value || !props.approvalRequest) return
  submitting.value = true
  errorMessage.value = null

  try {
    const feedback = rejectReason.value.trim() || undefined
    const handler = props.onRejectAsync || props.onReject
    if (handler) {
      await handler(props.approvalRequest.id, feedback)
    } else {
      emit('reject', props.approvalRequest.id, feedback)
    }
    showRejectForm.value = false
    rejectReason.value = ''
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to submit rejection decision.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.15s ease-out;
}
</style>
