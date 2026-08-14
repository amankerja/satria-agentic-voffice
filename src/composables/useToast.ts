import { ref } from 'vue'

export type ToastVariant = 'success' | 'warning' | 'error' | 'info'

interface ToastState {
  visible: boolean
  message: string
  description?: string
  variant: ToastVariant
}

const state = ref<ToastState>({
  visible: false,
  message: '',
  description: '',
  variant: 'success'
})

let timer: any = null

export function useToast() {
  function show(message: string, description?: string, variant: ToastVariant = 'success', duration = 3000) {
    if (timer) clearTimeout(timer)
    state.value = {
      visible: true,
      message,
      description,
      variant
    }
    timer = setTimeout(() => {
      state.value.visible = false
    }, duration)
  }

  function hide() {
    if (timer) clearTimeout(timer)
    state.value.visible = false
  }

  return {
    toastState: state,
    show,
    hide
  }
}
