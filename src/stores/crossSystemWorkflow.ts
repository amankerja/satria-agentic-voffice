import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CrossSystemWorkflowState } from '../types'
import { CrossSystemWorkflowEngine } from '../services/integrations/CrossSystemWorkflowEngine'
import { useIntegrationStore } from './integration'
import { useToast } from '../composables/useToast'

export const useCrossSystemWorkflowStore = defineStore('crossSystemWorkflow', () => {
  const integrationStore = useIntegrationStore()
  const toast = useToast()

  const workflow = ref<CrossSystemWorkflowState>(CrossSystemWorkflowEngine.createInitialState())
  const isExecuting = ref(false)
  const isWaitingApproval = ref(false)
  let approvalResolver: ((val: boolean) => void) | null = null

  const isCompleted = computed(() => workflow.value.status === 'Completed')
  const progressPercent = computed(() => {
    const total = workflow.value.steps.length
    if (total === 0) return 0
    const done = workflow.value.steps.filter((s) => s.status === 'Completed').length
    return Math.round((done / total) * 100)
  })

  async function startWorkflow() {
    await integrationStore.loadAll()

    const ghConn = integrationStore.getConnectionByProvider('github')
    const gmConn = integrationStore.getConnectionByProvider('gmail')

    if (!ghConn || !gmConn) {
      toast.error('Koneksi GitHub dan Gmail wajib terhubung untuk menjalankan alur lintas sistem.')
      return
    }

    workflow.value = CrossSystemWorkflowEngine.createInitialState()
    isExecuting.value = true
    isWaitingApproval.value = false

    try {
      await CrossSystemWorkflowEngine.executeWorkflow(
        workflow.value,
        { github: ghConn, gmail: gmConn },
        (_step, _index) => {
          // Reactive update triggers in UI
        },
        async () => {
          isWaitingApproval.value = true
          toast.warning('Otorisasi Diperlukan: Manager approval dibutuhkan sebelum email dikirim.')
          return new Promise<boolean>((resolve) => {
            approvalResolver = resolve
          })
        }
      )

      if (workflow.value.status === 'Completed') {
        toast.success('Alur Agentic Lintas Sistem (Email → GitHub → Test → PR → Email) Selesai 100%!')
      }
    } catch (err: any) {
      toast.error('Eksekusi alur gagal: ' + (err.message || 'Error'))
    } finally {
      isExecuting.value = false
      isWaitingApproval.value = false
    }
  }

  function approvePendingStep() {
    if (approvalResolver) {
      approvalResolver(true)
      approvalResolver = null
      isWaitingApproval.value = false
      toast.success('Approval disetujui. Melanjutkan pengiriman email balasan...')
    }
  }

  function rejectPendingStep() {
    if (approvalResolver) {
      approvalResolver(false)
      approvalResolver = null
      isWaitingApproval.value = false
      toast.info('Approval ditolak. Alur dihentikan.')
    }
  }

  function resetWorkflow() {
    workflow.value = CrossSystemWorkflowEngine.createInitialState()
    isExecuting.value = false
    isWaitingApproval.value = false
    approvalResolver = null
  }

  return {
    workflow,
    isExecuting,
    isWaitingApproval,
    isCompleted,
    progressPercent,
    startWorkflow,
    approvePendingStep,
    rejectPendingStep,
    resetWorkflow
  }
})
