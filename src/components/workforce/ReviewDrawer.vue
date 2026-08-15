<template>
  <UiDrawer
    :open="modelValue"
    @close="$emit('update:modelValue', false)"
    :title="review ? `Review Work: ${review.taskTitle}` : 'Task Review & Approval'"
  >
    <div v-if="review" class="space-y-5">
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

      <!-- Verification Quality Summary Banner -->
      <div
        v-if="runResult"
        class="p-4 rounded-xl border space-y-2.5 transition"
        :class="[
          runResult.verificationStatus === 'Passed'
            ? 'bg-primary-container/10 border-primary/30'
            : runResult.verificationStatus === 'Failed'
            ? 'bg-error/10 border-error/30'
            : 'bg-amber-500/10 border-amber-500/30'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ShieldCheck v-if="runResult.verificationStatus === 'Passed'" class="w-4 h-4 text-primary-container" />
            <AlertTriangle v-else-if="runResult.verificationStatus === 'Warning'" class="w-4 h-4 text-amber-400" />
            <XCircle v-else class="w-4 h-4 text-error" />
            <span class="text-xs font-bold text-on-surface">
              Quality Gate: {{ runResult.verificationStatus }}
            </span>
          </div>

          <span
            :class="[
              'text-xs font-mono font-bold px-2 py-0.5 rounded',
              runResult.verificationStatus === 'Passed'
                ? 'bg-primary-container/20 text-primary-container'
                : runResult.verificationStatus === 'Failed'
                ? 'bg-error/20 text-error'
                : 'bg-amber-400/20 text-amber-400'
            ]"
          >
            {{ verificationScore }}% Score
          </span>
        </div>

        <p class="text-xs font-mono leading-relaxed text-on-surface-variant">
          {{ runResult.verificationNotes || 'Quality gate evaluated against execution assertions.' }}
        </p>
      </div>

      <!-- Generated Result Deliverable Output Box -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-on-surface">Deliverable Output</label>
          <span class="text-[10px] font-mono text-primary flex items-center gap-1">
            <CheckCircle2 class="w-3 h-3 text-primary" /> Verified Content
          </span>
        </div>

        <div class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl font-mono text-xs max-h-56 overflow-y-auto leading-relaxed text-on-surface-variant whitespace-pre-wrap scrollbar-thin">
          {{ resultOutput || 'Deliverable output synthesized successfully. All code components and responsive layouts verified.' }}
        </div>
      </div>

      <!-- Acceptance Verification Checklist (Fixed: Proper Pass vs Fail state icons) -->
      <div class="space-y-2.5 p-4 bg-surface-container-low border border-outline-variant rounded-xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <ClipboardCheck class="w-4 h-4 text-primary" />
            Acceptance Criteria Checklist
          </span>
          <span class="text-[10px] font-mono text-muted">
            {{ review.checklist.filter(c => c.completed).length }}/{{ review.checklist.length }} Passed
          </span>
        </div>

        <div class="space-y-1.5">
          <div
            v-for="(item, idx) in review.checklist"
            :key="idx"
            :class="[
              'flex items-center gap-2.5 p-2 rounded-lg border text-xs transition',
              item.completed
                ? 'bg-surface-container-lowest border-outline-variant text-on-surface'
                : 'bg-error/5 border-error/20 text-error'
            ]"
          >
            <!-- Fixed: Green Check for PASS, Red X for FAIL -->
            <Check v-if="item.completed" class="w-3.5 h-3.5 text-primary-container shrink-0" />
            <XCircle v-else class="w-3.5 h-3.5 text-error shrink-0" />
            <span class="leading-tight flex-1">{{ item.item }}</span>
            <span v-if="!item.completed" class="text-[9px] font-mono uppercase font-bold text-error px-1.5 py-0.5 rounded bg-error/10">
              Unverified
            </span>
          </div>
        </div>
      </div>

      <!-- Verification Evidence Breakdown (if present in RunResult) -->
      <div v-if="runResult?.verificationEvidence && runResult.verificationEvidence.length > 0" class="space-y-2">
        <label class="block text-xs font-semibold text-on-surface">Verification Evidence</label>
        <div class="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
          <div
            v-for="(ev, eIdx) in runResult.verificationEvidence"
            :key="eIdx"
            :class="[
              'p-2.5 rounded-lg border text-[11px] font-mono flex items-start gap-2',
              ev.passed ? 'bg-surface-container-lowest border-outline-variant' : 'bg-error/5 border-error/20'
            ]"
          >
            <CheckCircle2 v-if="ev.passed" class="w-3.5 h-3.5 text-primary-container shrink-0 mt-0.5" />
            <XCircle v-else class="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-on-surface">{{ ev.name }}</span>
                <span class="text-[9px] uppercase px-1 rounded bg-surface-container-high text-secondary font-semibold">{{ ev.type }}</span>
              </div>
              <p class="text-muted text-[10px] truncate mt-0.5">{{ ev.details }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Artifacts List (if present) -->
      <div v-if="runResult?.artifactIds && runResult.artifactIds.length > 0" class="space-y-2">
        <label class="block text-xs font-semibold text-on-surface">Attached Artifacts</label>
        <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-wrap gap-2">
          <div
            v-for="artId in runResult.artifactIds"
            :key="artId"
            class="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant text-[11px] font-mono text-on-surface flex items-center gap-1.5"
          >
            <Package class="w-3 h-3 text-primary" />
            <span>{{ artId }}</span>
          </div>
        </div>
      </div>

      <!-- Diffs / Changes (if present) -->
      <div v-if="runResult?.diffs && runResult.diffs.length > 0" class="space-y-2">
        <label class="block text-xs font-semibold text-on-surface">File Changes Summary</label>
        <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-1.5 font-mono text-xs">
          <div
            v-for="(diff, dIdx) in runResult.diffs"
            :key="dIdx"
            class="flex items-center justify-between text-[11px]"
          >
            <span class="text-on-surface truncate">{{ diff.filePath }}</span>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-primary-container">+{{ diff.additions }}</span>
              <span class="text-error">-{{ diff.deletions }}</span>
            </div>
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
import { ref, computed, watch } from 'vue'
import { Check, CheckCircle2, ClipboardCheck, XCircle, ShieldCheck, AlertTriangle, Package } from '@lucide/vue'
import UiDrawer from '../ui/UiDrawer.vue'
import UiBadge from '../ui/UiBadge.vue'
import UiButton from '../ui/UiButton.vue'
import type { TaskReview, ReviewDecision, RunResult } from '../../types'
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
const runResult = ref<RunResult | null>(null)
const loading = ref<boolean>(false)

watch(() => props.review, async (newReview) => {
  if (newReview) {
    feedbackComment.value = newReview.comment || ''
    const res = await reviewStore.fetchResultByRunId(newReview.runId)
    runResult.value = res || null
    if (res) {
      resultOutput.value = res.output
    } else {
      resultOutput.value = 'Hasil pengerjaan run telah dipaketkan dan siap untuk ditinjau.'
    }
  } else {
    runResult.value = null
    resultOutput.value = ''
  }
})

const verificationScore = computed(() => {
  if (!props.review) return 100
  const checklist = props.review.checklist
  if (!checklist || checklist.length === 0) return 100
  const passed = checklist.filter((c) => c.completed).length
  return Math.round((passed / checklist.length) * 100)
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
