import { ref, onMounted } from 'vue'

const deferredPrompt = ref<any>(null)
const canInstall = ref<boolean>(false)
const isInstalled = ref<boolean>(false)

export function usePwaInstall() {
  onMounted(() => {
    // Check if already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      isInstalled.value = true
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      deferredPrompt.value = null
      canInstall.value = false
      isInstalled.value = true
    })
  })

  async function promptInstall() {
    if (!deferredPrompt.value) return false
    deferredPrompt.value.prompt()
    const choiceResult = await deferredPrompt.value.userChoice
    if (choiceResult.outcome === 'accepted') {
      canInstall.value = false
      deferredPrompt.value = null
      return true
    }
    return false
  }

  return {
    canInstall,
    isInstalled,
    promptInstall
  }
}
