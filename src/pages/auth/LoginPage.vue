<template>
  <div class="min-h-screen bg-surface text-on-surface flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
    <div class="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <!-- Brand Header -->
      <div class="text-center space-y-2">
        <div class="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center font-bold text-on-primary text-xl mx-auto shadow-lg">
          S
        </div>
        <div>
          <h1 class="text-2xl font-bold text-on-surface tracking-tight">SATRIA AI WORKFORCE</h1>
          <p class="text-xs text-muted font-mono mt-0.5">Your Digital Workforce Command Center</p>
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <UiInput
          v-model="email"
          label="Email Address"
          type="email"
          placeholder="satria@workforce.ai"
          :icon="Mail"
          required
        />

        <UiInput
          v-model="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          :icon="Lock"
          required
        />

        <div class="flex items-center justify-between text-xs text-muted">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="rememberMe"
              class="w-3.5 h-3.5 rounded border-outline bg-surface-container-lowest text-primary focus:ring-0 cursor-pointer"
            />
            <span>Remember me</span>
          </label>
          <a href="#" class="text-primary hover:underline" @click.prevent>Forgot password?</a>
        </div>

        <UiButton
          type="submit"
          variant="primary"
          size="lg"
          class="w-full"
          :loading="loading"
          :icon="ArrowRight"
        >
          Sign In to Workspace
        </UiButton>
      </form>

      <!-- Quick Bypass / Demo Mode Link -->
      <div class="pt-4 border-t border-outline-variant text-center space-y-3">
        <p class="text-xs text-muted">
          First time here?
          <router-link to="/onboarding" class="text-primary font-semibold hover:underline ml-1">
            Start Onboarding Wizard &rarr;
          </router-link>
        </p>

        <div class="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-[11px] font-mono text-muted flex items-center justify-between">
          <span>Demo Account:</span>
          <span class="text-primary">satria@workforce.ai</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Mail, Lock, ArrowRight } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const toast = useToast()

const email = ref('satria@workforce.ai')
const password = ref('password123')
const rememberMe = ref(true)
const loading = ref(false)

const handleLogin = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    toast.show('Welcome Back, Satria', 'Berhasil masuk ke Digital Workspace.', 'success')
    router.push('/')
  }, 600)
}
</script>
