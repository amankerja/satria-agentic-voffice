import { ref, onMounted, onUnmounted } from 'vue'

const isOnline = ref<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
const isOfflineWarningDismissed = ref<boolean>(false)

export function useNetwork() {
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
    if (!navigator.onLine) {
      isOfflineWarningDismissed.value = false
    }
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  return {
    isOnline,
    isOfflineWarningDismissed,
    dismissWarning: () => {
      isOfflineWarningDismissed.value = true
    }
  }
}
