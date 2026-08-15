<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-on-surface flex items-center gap-2">
          <Clock class="w-5 h-5 text-primary" />
          <span>Recurring Schedules & Automated Jobs</span>
        </h1>
        <p class="text-xs text-muted mt-1">
          Automate routine execution loops, daily backups, regression suites, and weekly reporting without manual dispatch.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UiButton
          variant="secondary"
          size="sm"
          :icon="RefreshCw"
          @click="loadSchedules"
        >
          Refresh
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          :icon="Plus"
          @click="showCreateModal = true"
        >
          New Schedule
        </UiButton>
      </div>
    </div>

    <!-- Summary KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-mono text-muted uppercase">Total Schedules</div>
          <div class="text-2xl font-bold text-on-surface font-mono mt-1">{{ scheduleStore.schedules.length }}</div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
          <Clock class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-mono text-muted uppercase">Active & Enabled</div>
          <div class="text-2xl font-bold text-primary font-mono mt-1">
            {{ scheduleStore.schedules.filter((s) => s.enabled).length }}
          </div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <CheckCircle2 class="w-5 h-5" />
        </div>
      </div>

      <div class="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div class="text-[10px] font-mono text-muted uppercase">Timezone</div>
          <div class="text-sm font-bold text-on-surface font-mono mt-2">Asia/Jakarta (GMT+7)</div>
        </div>
        <div class="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-cyan-400">
          <Calendar class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Schedules Ledger -->
    <div class="space-y-3">
      <div v-if="scheduleStore.schedules.length === 0" class="p-12 text-center bg-surface-container-low border border-outline-variant rounded-2xl space-y-3">
        <Clock class="w-8 h-8 text-muted mx-auto" />
        <div class="text-sm font-bold text-on-surface">No Recurring Schedules Configured</div>
        <p class="text-xs text-muted max-w-md mx-auto">
          Create automated schedules to run tasks on daily, weekly, or monthly intervals.
        </p>
        <UiButton variant="primary" size="sm" :icon="Plus" @click="showCreateModal = true">
          Create First Schedule
        </UiButton>
      </div>

      <div
        v-for="sch in scheduleStore.schedules"
        :key="sch.id"
        class="bg-surface-container-low border border-outline-variant hover:border-outline rounded-2xl p-4.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-primary-container/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
            <Calendar class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-sm font-bold text-on-surface">{{ sch.name }}</h2>
              <span class="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded uppercase font-semibold">
                {{ sch.recurrence }} @ {{ sch.time }}
              </span>
              <span v-if="sch.projectName" class="text-[10px] font-mono text-muted bg-surface-container px-2 py-0.5 rounded">
                {{ sch.projectName }}
              </span>
            </div>

            <div class="text-xs text-muted mt-1">
              Template: <span class="text-on-surface font-medium">"{{ sch.taskTemplate.title }}"</span>
              &bull; Assigned: <span class="text-primary">{{ sch.taskTemplate.workerName || 'Auto Worker' }}</span>
            </div>

            <div v-if="sch.lastRunAt" class="text-[10px] font-mono text-muted mt-1">
              Last triggered: {{ sch.lastRunAt }}
            </div>
          </div>
        </div>

        <!-- Controls: Toggle Enable, Run Now, Safe Delete -->
        <div class="flex items-center gap-2 self-end sm:self-center">
          <button
            @click="handleToggle(sch.id)"
            :class="[
              'px-3 py-1 rounded-full text-xs font-mono font-bold transition border cursor-pointer',
              sch.enabled
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-surface-container-high border-outline text-muted'
            ]"
          >
            {{ sch.enabled ? 'Enabled' : 'Disabled' }}
          </button>

          <UiButton
            variant="secondary"
            size="sm"
            :icon="Play"
            :loading="triggeringId === sch.id"
            @click="handleRunNow(sch.id)"
          >
            Run Now
          </UiButton>

          <UiButton
            variant="ghost"
            size="sm"
            :icon="Trash2"
            class="text-error hover:bg-error/10"
            @click="handleDelete(sch.id)"
          />
        </div>
      </div>
    </div>

    <!-- Create Schedule Modal -->
    <CreateScheduleModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="loadSchedules"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Clock,
  Plus,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Play,
  Trash2
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import CreateScheduleModal from '../../components/schedules/CreateScheduleModal.vue'
import { useScheduleStore } from '../../stores/schedule'
import { useProjectStore } from '../../stores/project'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const scheduleStore = useScheduleStore()
const projectStore = useProjectStore()
const toast = useToast()

const showCreateModal = ref(false)
const triggeringId = ref<string | null>(null)

const loadSchedules = async () => {
  await Promise.all([
    scheduleStore.fetchSchedulesByWorkspace('ws-dev'),
    projectStore.fetchProjectsByWorkspace('ws-dev')
  ])
}

onMounted(() => {
  loadSchedules()
})

const handleToggle = async (id: string) => {
  try {
    const updated = await scheduleStore.toggleSchedule(id)
    toast.success(`Schedule is now ${updated?.enabled ? 'enabled' : 'disabled'}.`)
  } catch (err: any) {
    toast.error(err.message || 'Failed to toggle schedule.')
  }
}

const handleRunNow = async (id: string) => {
  triggeringId.value = id
  try {
    const result = await scheduleStore.triggerAndDispatchSchedule(id, true)
    if (result?.task) {
      toast.success(`Generated automated task "${result.task.title}". Execution dispatched.`)
      router.push(`/tasks/${result.task.id}`)
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to trigger schedule.')
  } finally {
    triggeringId.value = null
  }
}

const handleDelete = async (id: string) => {
  try {
    await scheduleStore.deleteSchedule(id, true, 'Deleted by user from Schedules page')
    toast.success('Schedule deleted.')
  } catch (err: any) {
    toast.error(err.message || 'Failed to delete schedule.')
  }
}
</script>
