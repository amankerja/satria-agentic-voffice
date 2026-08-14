<template>
  <UiDrawer
    :open="modelValue"
    @close="$emit('update:modelValue', false)"
    :title="review ? `Review Work: ${review.taskTitle}` : 'Task Review & Approval'"
  >
    <div v-if="review" class="space-y-6">
      <!-- Review Target Inset -->
      <div class="p-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono text-muted uppercase">Execution Target</span>
          <UiBadge :variant="getDecisionVariant(review.status)" size="sm" class="font-mono">
            {{ review.status }}
          </UiBadge>
        </div>
        <div class="text-sm font-bold text-on-surface">{{ review.taskTitle }}</div>
        <div class="flex items-center gap-2 text-xs text-muted font-mono">
          <span>Run ID: #{{ review.runId }}</span>
          <span>&bull;</span>
          <span>Submitted by: {{ review.employeeName }}</span>
        </div>
      </div>

      <!-- Generated Result Deliverable Output Box -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-on-surface">Deliverable Artifact & Output</label>
          <span class="text-[10px] font-mono text-primary flex items-center gap-1">
            <CheckCircle2 class="w-3 h-3 text-primary" /> Verified Output
          </span>
        </div>

        <div class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-xs max-h-56 overflow-y-auto leading-relaxed text-on-surface-variant whitespace-pre-wrap scrollbar-thin">
          {{ resultOutput || 'Deliverable output synthesized successfully. All code components and responsive layouts verified.' }}
        </div>
      </div>

      <!-- Acceptance Verification Checklist -->
      <div class="space-y-2.5 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <ClipboardCheck class="w-4 h-4 text-primary" />
            Acceptance Criteria Checklist
          </span>
          <span class="text-[10px] font-mono text-muted">
            {{ review.checklist.filter(c => c.completed).length }}/{{ review.checklist.length }} Verified
          </span>
        </div>

        <div class="space-y-1.5">
          <div
            v-for="(item, idx) in review.checklist"
            :key="idx"
            class="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface"
          >
            <Check class="w-3.5 h-3.5 text-primary shrink-0" />
            <span class="leading-tight">{{ item.item }}</span>
          </div>
        </div>
      </div>

      <!-- Reviewer Comment Box -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-on-surface">
          Reviewer Feedback & Notes
        </label>
        <textarea
          v-model="feedbackComment"
          rows="3"
          placeholder="Tuliskan catatan persetujuan, instruksi revisi, atau alasan penolakan..."
          class="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary rounded-xl p-3 text-xs text-on-surface placeholder-muted focus:outline-none transition resize-none"
        ></textarea>
      </div>

      <!-- Decision Actions -->
      <div class="pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-end gap-2.5">
        <UiButton variant="ghost" size="sm" @click="$emit('update:modelValue', false)">
          Cancel
        </UiButton>
        <UiButton
          variant="danger"
          size="sm"
          :disabled="loading"
          @click="handleDecision('Rejected')"
        >
          Reject
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          :disabled="loading"
          @click="handleDecision('Changes Requested')"
        >
          Request Changes
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :icon="CheckCircle2"
          :disabled="loading"
          @click="handleDecision('Approved')"
        >
          Approve & Complete Task
        </UiButton>
      </div>
    </div>
  </UiDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Check, CheckCircle2, ClipboardCheck } from '@lucide/vue'
import UiDrawer from '../ui/UiDrawer.vue'
import UiBadge from '../ui/UiBadge.vue'
import UiButton from '../ui/UiButton.vue'
import type { TaskReview, ReviewDecision } from '../../types'
import { useReviewStore } from '../../stores/review'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  modelValue: boolean
  review: TaskReview | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'decision', decision: ReviewDecision): void
}>()

const reviewStore = useReviewStore()
const toast = useToast()

const feedbackComment = ref<string>('')
const resultOutput = ref<string>('')
const loading = ref<boolean>(false)

watch(() => props.review, async (newReview) => {
  if (newReview) {
    feedbackComment.value = newReview.comment || ''
    const res = await reviewStore.fetchResultByRunId(newReview.runId)
    if (res) {
      resultOutput.value = res.output
    } else {
      resultOutput.value = 'Hasil pengerjaan run telah dipaketkan dan siap untuk ditinjau.'
    }
  }
})

const getDecisionVariant = (status?: ReviewDecision) => {
  switch (status) {
    case 'Approved':
      return 'success'
    case 'Changes Requested':
      return 'warning'
    case 'Rejected':
      return 'error'
    default:
      return 'neutral'
  }
}

const handleDecision = async (decision: ReviewDecision) => {
  if (!props.review) return
  loading.value = true
  try {
    await reviewStore.submitDecision(props.review.id, decision, feedbackComment.value.trim() || undefined)

    if (decision === 'Approved') {
      toast.show('Task Approved & Completed', `Pekerjaan "${props.review.taskTitle}" telah disetujui. Task status: Done.`, 'success')
    } else if (decision === 'Changes Requested') {
      toast.show('Changes Requested', 'Catatan revisi telah dikirimkan kepada tim pelaksana.', 'warning')
    } else {
      toast.show('Review Rejected', 'Hasil pengerjaan telah ditolak dengan catatan feedback.', 'error')
    }

    emit('decision', decision)
    emit('update:modelValue', false)
  } finally {
    loading.value = false
  }
}
</script>
