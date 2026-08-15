<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Header & Quick Actions -->
    <div class="border-b border-outline-variant pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Notifications Center</h1>
          <UiBadge v-if="notificationStore.unreadCount > 0" variant="warning" size="sm" class="font-mono">
            {{ notificationStore.unreadCount }} Unread
          </UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Pemberitahuan sistem, deadline tugas, update proyek, dan log peringatan
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <UiButton
          size="sm"
          variant="secondary"
          :icon="CheckCheck"
          :disabled="notificationStore.unreadCount === 0"
          @click="notificationStore.markAllAsRead(workspaceStore.currentWorkspaceId)"
        >
          Mark All Read
        </UiButton>
      </div>
    </div>

    <!-- Filter Pills & Unread Toggle Bar -->
    <div class="bg-surface-container-low p-3 rounded-xl border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <!-- Category Tabs -->
      <div role="tablist" aria-label="Notification category tabs" class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="cat in categories"
          :key="cat"
          role="tab"
          :aria-selected="notificationStore.filterCategory === cat"
          :aria-label="`Category: ${cat}`"
          @click="notificationStore.filterCategory = cat"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap',
            notificationStore.filterCategory === cat
              ? 'bg-surface-container-high text-primary font-semibold border border-outline'
              : 'text-muted hover:text-on-surface hover:bg-surface-container'
          ]"
        >
          {{ cat }}
        </button>
      </div>

      <!-- Unread Only Toggle -->
      <label class="flex items-center gap-2 cursor-pointer text-xs text-on-surface-variant select-none">
        <input
          type="checkbox"
          v-model="notificationStore.onlyUnread"
          aria-label="Filter only unread notifications"
          class="w-3.5 h-3.5 rounded border-outline bg-surface-container-lowest text-primary focus:ring-0 cursor-pointer"
        />
        <span>Only Unread</span>
      </label>
    </div>

    <!-- EMPTY STATE -->
    <UiEmptyState
      v-if="notificationStore.filteredNotifications.length === 0"
      title="No notifications"
      description="Tidak ada notifikasi aktif yang sesuai dengan kriteria filter saat ini."
    >
      <UiButton size="sm" variant="secondary" @click="resetFilters">
        Reset Filter
      </UiButton>
    </UiEmptyState>

    <!-- NOTIFICATIONS LIST -->
    <div v-else class="space-y-3">
      <div
        v-for="item in notificationStore.filteredNotifications"
        :key="item.id"
        :class="[
          'p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3',
          item.read
            ? 'bg-surface-container-low/80 border-outline-variant opacity-80 hover:opacity-100 hover:bg-surface-container-low'
            : 'bg-surface-container-low border-outline ring-1 ring-inset ring-primary/20 shadow-sm'
        ]"
      >
        <!-- Left: Category Icon & Content -->
        <div class="flex items-start gap-3.5">
          <!-- Icon -->
          <div
            :class="[
              'w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5',
              item.priority === 'critical'
                ? 'bg-error-container/30 border-error/40 text-error'
                : item.priority === 'important'
                ? 'bg-on-tertiary/30 border-tertiary-container/40 text-tertiary'
                : 'bg-surface-container-lowest border-outline-variant text-primary'
            ]"
          >
            <component :is="getCategoryIcon(item.category)" class="w-4 h-4" />
          </div>

          <!-- Content Details -->
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-on-surface">{{ item.title }}</span>
              <UiBadge :variant="getPriorityBadgeVariant(item.priority)" size="sm" class="font-mono text-[9px] uppercase">
                {{ item.priority }}
              </UiBadge>
              <span v-if="!item.read" class="w-2 h-2 rounded-full bg-primary" title="Unread"></span>
            </div>

            <p class="text-xs text-on-surface-variant leading-relaxed">
              {{ item.message }}
            </p>

            <div class="text-[10px] text-muted font-mono flex items-center gap-2">
              <span>{{ item.category }}</span>
              <span>&bull;</span>
              <span>{{ item.timeAgo }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant w-full sm:w-auto justify-end">
          <router-link
            v-if="item.link"
            :to="item.link"
            @click="notificationStore.markAsRead(item.id)"
            class="text-xs font-mono text-primary hover:text-primary-container bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant hover:border-primary transition flex items-center gap-1"
          >
            <span>Open</span>
            <ExternalLink class="w-3 h-3" />
          </router-link>

          <button
            v-if="!item.read"
            @click="notificationStore.markAsRead(item.id)"
            class="p-2 text-muted hover:text-primary hover:bg-surface-container-high rounded-lg transition"
            title="Mark as Read"
          >
            <Check class="w-3.5 h-3.5" />
          </button>

          <button
            @click="notificationStore.deleteNotification(item.id)"
            class="p-2 text-muted hover:text-error hover:bg-surface-container-high rounded-lg transition"
            title="Dismiss"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import {
  CheckCheck,
  Check,
  Trash2,
  ExternalLink,
  CheckSquare,
  Folder,
  FileText,
  Bell
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useNotificationStore } from '../../stores/notification'
import type { NotificationPriority } from '../../types'

const workspaceStore = useWorkspaceStore()
const notificationStore = useNotificationStore()

const categories = ['All', 'Tasks', 'Projects', 'Files', 'System']

const loadNotifications = () => {
  notificationStore.fetchNotificationsByWorkspace(workspaceStore.currentWorkspaceId)
}

onMounted(() => {
  loadNotifications()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadNotifications()
})

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Tasks': return CheckSquare
    case 'Projects': return Folder
    case 'Files': return FileText
    default: return Bell
  }
}

const getPriorityBadgeVariant = (priority: NotificationPriority) => {
  switch (priority) {
    case 'critical': return 'error'
    case 'important': return 'warning'
    default: return 'neutral'
  }
}

const resetFilters = () => {
  notificationStore.filterCategory = 'All'
  notificationStore.onlyUnread = false
}
</script>
