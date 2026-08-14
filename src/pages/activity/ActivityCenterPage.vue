<template>
  <div class="space-y-6">
    <!-- Header & Action Summary -->
    <div class="border-b border-outline-variant pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Activity Center</h1>
          <UiBadge variant="info" size="sm" class="font-mono">
            {{ activityStore.filteredActivities.length }} Events
          </UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Rekam jejak real-time seluruh aktivitas operasional di {{ workspaceStore.currentWorkspace?.name }}
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <!-- Live Audit Badge -->
        <div class="flex items-center gap-2 bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-mono text-primary">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>Live Stream</span>
        </div>

        <UiButton size="sm" variant="secondary" :icon="Filter" @click="resetFilters">
          Reset Filter
        </UiButton>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3.5 space-y-1">
        <div class="text-[10px] font-mono uppercase text-muted">Total Events</div>
        <div class="text-xl font-bold font-mono text-on-surface">{{ activityStore.activities.length }}</div>
      </div>
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3.5 space-y-1">
        <div class="text-[10px] font-mono uppercase text-muted">Completed Tasks</div>
        <div class="text-xl font-bold font-mono text-primary">{{ completedCount }}</div>
      </div>
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3.5 space-y-1">
        <div class="text-[10px] font-mono uppercase text-muted">Files Uploaded</div>
        <div class="text-xl font-bold font-mono text-secondary">{{ uploadedCount }}</div>
      </div>
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-3.5 space-y-1">
        <div class="text-[10px] font-mono uppercase text-muted">Active Actors</div>
        <div class="text-xl font-bold font-mono text-tertiary">4</div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="bg-surface-container-low p-3 rounded-xl border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-3">
      <!-- Action Filters -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <button
          v-for="act in actionFilters"
          :key="act.value"
          @click="activityStore.selectedAction = act.value"
          :class="[
            'px-2.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap',
            activityStore.selectedAction === act.value
              ? 'bg-surface-container-high text-primary font-semibold border border-outline'
              : 'text-muted hover:text-on-surface hover:bg-surface-container'
          ]"
        >
          {{ act.label }}
        </button>
      </div>

      <!-- Right: Target Type & Search -->
      <div class="flex items-center gap-2">
        <!-- Target Type Select -->
        <select
          v-model="activityStore.selectedTargetType"
          class="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="all">All Targets</option>
          <option value="task">Tasks</option>
          <option value="project">Projects</option>
          <option value="file">Files</option>
          <option value="workspace">Workspaces</option>
        </select>

        <!-- Search Bar -->
        <div class="relative w-44 sm:w-56">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            v-model="activityStore.searchQuery"
            type="text"
            placeholder="Search activity..."
            class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-on-surface placeholder-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <UiEmptyState
      v-if="activityStore.filteredActivities.length === 0"
      title="No activity events"
      description="Tidak ditemukan aktivitas yang sesuai dengan kriteria filter."
    >
      <UiButton size="sm" variant="secondary" @click="resetFilters">
        Reset Filter
      </UiButton>
    </UiEmptyState>

    <!-- GROUPED TIMELINE FEED -->
    <div v-else class="space-y-6">
      <div
        v-for="(logs, groupName) in activityStore.groupedActivities"
        :key="groupName"
        v-show="logs.length > 0"
        class="space-y-3"
      >
        <!-- Group Header -->
        <div class="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-wider">
          <span>{{ groupName }}</span>
          <div class="h-px flex-1 bg-outline-variant"></div>
          <span>{{ logs.length }} events</span>
        </div>

        <!-- Timeline Items Card List -->
        <div class="bg-surface-container-low border border-outline-variant rounded-xl divide-y divide-outline-variant overflow-hidden">
          <div
            v-for="log in logs"
            :key="log.id"
            class="p-3.5 hover:bg-surface-container transition flex items-start sm:items-center justify-between gap-3 text-xs"
          >
            <!-- Left: Actor Avatar & Action Summary -->
            <div class="flex items-start sm:items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center font-bold text-[10px] text-primary shrink-0 mt-0.5 sm:mt-0">
                {{ getActorInitials(log.actorName) }}
              </div>

              <div class="space-y-0.5">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-semibold text-on-surface">{{ log.actorName }}</span>
                  <UiBadge :variant="getActionBadgeVariant(log.action)" size="sm" class="font-mono text-[10px]">
                    {{ log.action }}
                  </UiBadge>
                  <span class="text-muted">{{ log.targetType }}</span>
                  <span class="font-semibold text-on-surface bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant">
                    {{ log.targetTitle }}
                  </span>
                </div>
                <div class="text-[10px] text-muted font-mono">
                  {{ log.projectId ? `Project: ${log.projectId}` : 'Workspace Scope' }}
                </div>
              </div>
            </div>

            <!-- Right: Timestamp Badge -->
            <div class="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <span class="text-[10px] font-mono text-muted bg-surface-container-lowest px-2 py-1 rounded border border-outline-variant">
                {{ log.timestamp }} &bull; {{ log.timeAgo }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { Filter, Search } from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useActivityStore } from '../../stores/activity'
import type { ActivityAction } from '../../types'

const workspaceStore = useWorkspaceStore()
const activityStore = useActivityStore()

const actionFilters: { label: string; value: ActivityAction | 'all' }[] = [
  { label: 'All Actions', value: 'all' },
  { label: 'Created', value: 'created' },
  { label: 'Updated', value: 'updated' },
  { label: 'Completed', value: 'completed' },
  { label: 'Uploaded', value: 'uploaded' },
  { label: 'Deleted', value: 'deleted' }
]

const loadActivities = () => {
  activityStore.fetchActivitiesByWorkspace(workspaceStore.currentWorkspaceId)
}

onMounted(() => {
  loadActivities()
})

watch(() => workspaceStore.currentWorkspaceId, () => {
  loadActivities()
})

const completedCount = computed(() => {
  return activityStore.activities.filter((a) => a.action === 'completed').length
})

const uploadedCount = computed(() => {
  return activityStore.activities.filter((a) => a.action === 'uploaded').length
})

const getActorInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`
  return name.slice(0, 2).toUpperCase()
}

const getActionBadgeVariant = (action: ActivityAction) => {
  switch (action) {
    case 'completed': return 'success'
    case 'created': return 'info'
    case 'updated': return 'warning'
    case 'uploaded': return 'info'
    case 'deleted': return 'error'
    default: return 'neutral'
  }
}

const resetFilters = () => {
  activityStore.selectedAction = 'all'
  activityStore.selectedTargetType = 'all'
  activityStore.selectedProjectId = 'all'
  activityStore.searchQuery = ''
}
</script>
