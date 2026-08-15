<template>
  <UiModal
    :open="open"
    title="Add Instruction Mid-Run"
    @close="$emit('close')"
  >
    <div class="space-y-4 p-1">
      <p class="text-xs text-muted">
        Send additional requirements, guidance, or revision directives to the active agent execution loop for <span class="text-on-surface font-semibold">"{{ taskTitle }}"</span>.
      </p>

      <div>
        <label class="block text-xs font-semibold text-on-surface mb-1.5">
          Directive / Additional Instruction <span class="text-primary">*</span>
        </label>
        <textarea
          v-model="instruction"
          rows="4"
          required
          placeholder="e.g. Ensure that unit tests cover edge cases for network timeout and write documentation in Indonesian."
          class="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface placeholder-muted focus:border-primary outline-none resize-none transition"
        ></textarea>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-4 border-t border-outline-variant flex items-center justify-end gap-2.5">
        <UiButton variant="ghost" size="sm" @click="$emit('close')">
          Cancel
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :loading="loading"
          :disabled="!instruction.trim()"
          @click="handleSend"
        >
          Send Instruction
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UiModal from '../ui/UiModal.vue'
import UiButton from '../ui/UiButton.vue'
import { useAgentRunStore } from '../../stores/agentRun'
import { useToast } from '../../composables/useToast'

const props = defineProps<{
  open: boolean
  runId: string
  taskTitle: string
}>()

const emit = defineEmits(['close', 'sent'])

const agentRunStore = useAgentRunStore()
const toast = useToast()

const instruction = ref('')
const loading = ref(false)

const handleSend = async () => {
  if (!instruction.value.trim()) return

  loading.value = true
  try {
    await agentRunStore.addInstructionMidRun(props.runId, instruction.value.trim())
    toast.success('Instruction successfully injected into agent execution stream.')
    instruction.value = ''
    emit('sent')
    emit('close')
  } catch (err: any) {
    toast.error(err.message || 'Failed to inject instruction.')
  } finally {
    loading.value = false
  }
}
</script>
