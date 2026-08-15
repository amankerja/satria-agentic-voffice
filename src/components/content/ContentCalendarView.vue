<template>
  <div class="rounded-2xl border border-surface-container-high/60 bg-surface-container-low p-6 space-y-6">
    <!-- Month Navigation Bar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h3 class="text-base font-bold text-surface-on font-mono">
          {{ monthYearLabel }}
        </h3>
        <span class="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs text-surface-muted font-medium">
          {{ scheduledThisMonth.length }} Terjadwal & Tayang
        </span>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="prevMonth"
          class="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2 text-surface-on hover:bg-surface-container-mid"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          @click="resetToCurrentMonth"
          class="rounded-lg border border-surface-container-high bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-surface-on hover:bg-surface-container-mid"
        >
          Bulan Ini
        </button>
        <button
          @click="nextMonth"
          class="rounded-lg border border-surface-container-high bg-surface-container-lowest p-2 text-surface-on hover:bg-surface-container-mid"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-px rounded-xl border border-surface-container-high/60 bg-surface-container-high/40 overflow-hidden">
      <!-- Day Names Header -->
      <div
        v-for="dayName in ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']"
        :key="dayName"
        class="bg-surface-container-lowest p-2.5 text-center text-xs font-bold text-surface-muted uppercase font-mono"
      >
        {{ dayName }}
      </div>

      <!-- Calendar Days -->
      <div
        v-for="(day, idx) in calendarDays"
        :key="idx"
        class="min-h-[110px] bg-surface-container-lowest p-2 flex flex-col justify-between transition-colors hover:bg-surface-container-low/80"
        :class="{ 'opacity-30': !day.isCurrentMonth, 'border-2 border-primary/40': day.isToday }"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-xs font-mono font-bold"
            :class="day.isToday ? 'rounded-full bg-primary px-1.5 py-0.5 text-surface-container-lowest' : 'text-surface-muted'"
          >
            {{ day.date.getDate() }}
          </span>
          <span v-if="day.items.length" class="text-[10px] text-surface-muted">
            {{ day.items.length }} post
          </span>
        </div>

        <!-- Items in Day -->
        <div class="mt-1 space-y-1 overflow-y-auto max-h-24">
          <div
            v-for="item in day.items"
            :key="item.id"
            @click="$emit('inspect', item)"
            class="cursor-pointer rounded border border-surface-container-high/80 bg-surface-container-low p-1.5 text-[11px] leading-tight hover:border-primary/50 transition-all truncate"
            :class="item.status === 'Published' ? 'border-l-2 border-l-emerald-400' : 'border-l-2 border-l-cyan-400'"
          >
            <p class="font-medium text-surface-on truncate">{{ item.title }}</p>
            <div class="flex items-center gap-1 text-[9px] text-surface-muted font-mono uppercase mt-0.5">
              <span>{{ item.status }}</span>
              <span>•</span>
              <span>{{ item.targetPlatforms.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContentItem } from '../../types'

const props = defineProps<{
  items: ContentItem[]
}>()

defineEmits<{
  (e: 'inspect', item: ContentItem): void
}>()

const currentDate = ref(new Date(2026, 7, 1)) // August 2026

const monthYearLabel = computed(() => {
  return currentDate.value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
})

const scheduledThisMonth = computed(() => {
  return props.items.filter((i) => {
    const targetDate = i.scheduledAt || i.publishedAt || i.createdAt
    if (!targetDate) return false
    const d = new Date(targetDate)
    return d.getMonth() === currentDate.value.getMonth() && d.getFullYear() === currentDate.value.getFullYear()
  })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; items: ContentItem[] }[] = []

  // Padding prev month
  const startDayOfWeek = firstDay.getDay()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    days.push({ date: d, isCurrentMonth: false, isToday: false, items: getItemsForDate(d) })
  }

  // Current month days
  const todayStr = new Date().toISOString().slice(0, 10)
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    const isToday = d.toISOString().slice(0, 10) === todayStr
    days.push({ date: d, isCurrentMonth: true, isToday, items: getItemsForDate(d) })
  }

  // Padding next month
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: d, isCurrentMonth: false, isToday: false, items: getItemsForDate(d) })
  }

  return days
})

function getItemsForDate(date: Date): ContentItem[] {
  const dStr = date.toISOString().slice(0, 10)
  return props.items.filter((item) => {
    const targetDate = item.scheduledAt || item.publishedAt || item.createdAt
    if (!targetDate) return false
    return targetDate.slice(0, 10) === dStr
  })
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function resetToCurrentMonth() {
  currentDate.value = new Date(2026, 7, 1)
}
</script>
