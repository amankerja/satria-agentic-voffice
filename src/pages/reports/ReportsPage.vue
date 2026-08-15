<template>
  <div class="space-y-6">
    <!-- Header & Time Range Controls -->
    <div class="border-b border-outline-variant pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Workspace Reports & Analytics</h1>
          <UiBadge variant="success" size="sm" class="font-mono">Live Metrics</UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Analisis produktivitas, velocity pengerjaan task, dan progres milestone di {{ workspaceStore.currentWorkspace?.name }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Time Range Selector -->
        <div role="tablist" aria-label="Report time range selector" class="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
          <button
            v-for="range in timeRanges"
            :key="range"
            role="tab"
            :aria-selected="selectedRange === range"
            :aria-label="`Time range: ${range}`"
            @click="selectedRange = range"
            :class="[
              'px-3 py-1.5 rounded-md text-xs font-medium transition',
              selectedRange === range ? 'bg-surface-container-high text-primary font-semibold' : 'text-muted hover:text-on-surface'
            ]"
          >
            {{ range }}
          </button>
        </div>

        <UiButton size="sm" variant="secondary" :icon="Download" @click="exportReport">
          Export
        </UiButton>
      </div>
    </div>

    <!-- Executive Cost & Governance Dashboard Switcher Banner -->
    <div class="p-4 bg-surface-container-low border border-primary/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-bold text-on-surface">Executive Cost & Governance Dashboard (PRD 5.1)</div>
          <p class="text-[11px] text-muted">Aggregated LLM token burn, CostCalculator economics, verification pass-rates, and retry rates for Owners/Directors.</p>
        </div>
      </div>
      <router-link to="/governance">
        <UiButton size="sm" variant="primary" :icon="ShieldCheck">
          View Cost & Governance &rarr;
        </UiButton>
      </router-link>
    </div>

    <!-- 4 High Level Executive KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Task Completion Rate</span>
          <CheckCircle2 class="w-4 h-4 text-primary" />
        </div>
        <div class="text-2xl font-bold font-mono text-primary mt-2">
          {{ completionRate }}%
        </div>
        <div class="text-[11px] text-on-surface-variant mt-1 font-mono">
          {{ completedTasksCount }} of {{ taskStore.tasks.length }} tasks resolved
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Active Projects</span>
          <FolderGit2 class="w-4 h-4 text-secondary" />
        </div>
        <div class="text-2xl font-bold font-mono text-secondary mt-2">
          {{ projectStore.projects.length }}
        </div>
        <div class="text-[11px] text-on-surface-variant mt-1 font-mono">
          Avg. Progress: {{ averageProjectProgress }}%
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Blocked / At Risk</span>
          <AlertTriangle class="w-4 h-4 text-tertiary-container" />
        </div>
        <div class="text-2xl font-bold font-mono text-tertiary-container mt-2">
          {{ blockedCount }}
        </div>
        <div class="text-[11px] text-on-surface-variant mt-1 font-mono">
          Requires immediate intervention
        </div>
      </UiCard>

      <UiCard padding="md">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Activity Velocity</span>
          <TrendingUp class="w-4 h-4 text-[#f59e0b]" />
        </div>
        <div class="text-2xl font-bold font-mono text-on-surface mt-2">
          24.8 <span class="text-xs font-normal text-muted">ops/day</span>
        </div>
        <div class="text-[11px] text-primary mt-1 font-mono">
          &uarr; 14.2% from last week
        </div>
      </UiCard>
    </div>

    <!-- Charts Section: Velocity Line/Bar Chart + Task Status Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 7-Day Completion Velocity Chart (2 cols) -->
      <div class="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-on-surface">Daily Output & Velocity Trend</h3>
            <p class="text-xs text-muted">Jumlah task yang diselesaikan dan aktivitas per hari</p>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono">
            <span class="flex items-center gap-1.5 text-primary">
              <span class="w-2.5 h-2.5 rounded-sm bg-primary"></span>
              Completed Tasks
            </span>
            <span class="flex items-center gap-1.5 text-secondary">
              <span class="w-2.5 h-2.5 rounded-sm bg-secondary"></span>
              Activity Events
            </span>
          </div>
        </div>

        <!-- SVG Technical Chart Representation -->
        <div class="h-56 w-full pt-4">
          <svg class="w-full h-full" viewBox="0 0 700 200" fill="none" preserveAspectRatio="none">
            <!-- Grid Lines -->
            <line x1="0" y1="40" x2="700" y2="40" stroke="var(--color-outline-variant)" stroke-dasharray="4 4" />
            <line x1="0" y1="90" x2="700" y2="90" stroke="var(--color-outline-variant)" stroke-dasharray="4 4" />
            <line x1="0" y1="140" x2="700" y2="140" stroke="var(--color-outline-variant)" stroke-dasharray="4 4" />
            <line x1="0" y1="180" x2="700" y2="180" stroke="var(--color-outline-variant)" />

            <!-- Activity Area Gradient Curve -->
            <path
              d="M 20 160 Q 120 120, 220 130 T 420 80 T 620 50 L 680 70 L 680 180 L 20 180 Z"
              fill="rgba(76, 215, 246, 0.08)"
            />
            <path
              d="M 20 160 Q 120 120, 220 130 T 420 80 T 620 50 L 680 70"
              stroke="#4cd7f6"
              stroke-width="2"
              fill="none"
            />

            <!-- Completed Tasks Area Gradient Curve -->
            <path
              d="M 20 170 Q 120 140, 220 110 T 420 95 T 620 40 L 680 45 L 680 180 L 20 180 Z"
              fill="rgba(78, 222, 163, 0.12)"
            />
            <path
              d="M 20 170 Q 120 140, 220 110 T 420 95 T 620 40 L 680 45"
              stroke="#4edea3"
              stroke-width="2.5"
              fill="none"
            />

            <!-- Data Dots -->
            <circle cx="220" cy="110" r="4" fill="#10b981" />
            <circle cx="420" cy="95" r="4" fill="#10b981" />
            <circle cx="620" cy="40" r="5" fill="#4edea3" stroke="#003824" stroke-width="2" />
          </svg>
        </div>

        <!-- Chart X-Axis Labels -->
        <div class="flex items-center justify-between text-[10px] font-mono text-muted pt-1 border-t border-outline-variant">
          <span
            v-for="(day, idx) in chartDays"
            :key="day"
            :class="idx === chartDays.length - 1 ? 'text-primary font-bold' : ''"
          >
            {{ day }}
          </span>
        </div>
      </div>

      <!-- Task Status Breakdown (1 col) -->
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-bold text-on-surface">Task Status Breakdown</h3>
          <p class="text-xs text-muted">Distribusi status pengerjaan unit kerja</p>
        </div>

        <div class="space-y-3.5">
          <div v-for="item in statusBreakdown" :key="item.status" class="space-y-1.5">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-on-surface-variant">{{ item.status }}</span>
              <span :class="item.textColor">{{ item.count }} ({{ item.percentage }}%)</span>
            </div>
            <div class="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="item.bgClass"
                :style="{ width: `${item.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-outline-variant flex items-center justify-between text-xs font-mono text-muted">
          <span>Total Tracked Tasks</span>
          <span class="text-on-surface font-bold">{{ taskStore.tasks.length }}</span>
        </div>
      </div>
    </div>

    <!-- Projects Health & Milestone Progress Table -->
    <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-bold text-on-surface">Projects Health & Progress</h3>
          <p class="text-xs text-muted">Status kemajuan proyek dan milestone roadmap</p>
        </div>
        <router-link to="/projects" class="text-xs font-mono text-primary hover:underline">
          View Projects Directory &rarr;
        </router-link>
      </div>

      <div class="space-y-3">
        <div
          v-for="project in projectStore.projects"
          :key="project.id"
          class="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-3"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-on-surface">{{ project.name }}</span>
                <UiBadge
                  :variant="project.status === 'Active' ? 'success' : project.status === 'Completed' ? 'info' : 'warning'"
                  size="sm"
                >
                  {{ project.status }}
                </UiBadge>
              </div>
              <p class="text-xs text-muted mt-0.5">{{ project.description }}</p>
            </div>

            <div class="text-right font-mono shrink-0">
              <span class="text-base font-bold text-primary">{{ project.progress }}%</span>
              <div class="text-[10px] text-muted">{{ project.completedTaskCount }} / {{ project.taskCount }} tasks</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <UiProgress :value="project.progress" :color="project.health === 'At Risk' || project.health === 'Critical' ? '#fc7c78' : '#10b981'" />

          <!-- Milestones Chips -->
          <div v-if="project.milestones.length > 0" class="flex flex-wrap items-center gap-2 pt-1">
            <span class="text-[10px] font-mono uppercase text-muted">Milestones:</span>
            <div
              v-for="m in project.milestones"
              :key="m.id"
              :class="[
                'text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1 border',
                m.completed
                  ? 'bg-on-primary/40 text-primary border-primary-container/30'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
              ]"
            >
              <span>{{ m.completed ? '✓' : '○' }}</span>
              <span>{{ m.title }}</span>
              <span class="opacity-60 text-[9px]">({{ m.dueDate }})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Download,
  CheckCircle2,
  FolderGit2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiProgress from '../../components/ui/UiProgress.vue'
import { useWorkspaceStore } from '../../stores/workspace'
import { useProjectStore } from '../../stores/project'
import { useTaskStore } from '../../stores/task'
import { useToast } from '../../composables/useToast'

const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const toast = useToast()

const selectedRange = ref('Last 7 Days')
const timeRanges = ['Last 7 Days', 'Last 30 Days', 'This Quarter']

onMounted(() => {
  const wsId = workspaceStore.currentWorkspaceId
  projectStore.fetchProjectsByWorkspace(wsId)
  taskStore.fetchTasksByWorkspace(wsId)
})

const filteredTasks = computed(() => {
  if (selectedRange.value === 'This Quarter') return taskStore.tasks
  const now = new Date().getTime()
  const days = selectedRange.value === 'Last 7 Days' ? 7 : 30
  const cutoff = now - days * 24 * 60 * 60 * 1000
  return taskStore.tasks.filter((t) => {
    if (!t.createdAt) return true
    return new Date(t.createdAt).getTime() >= cutoff
  })
})

const completedTasksCount = computed(() => {
  return filteredTasks.value.filter((t) => t.status === 'Done').length
})

const completionRate = computed(() => {
  if (filteredTasks.value.length === 0) return 0
  return Math.round((completedTasksCount.value / filteredTasks.value.length) * 100)
})

const blockedCount = computed(() => {
  return filteredTasks.value.filter((t) => t.status === 'Waiting' || t.priority === 'Urgent').length
})

const averageProjectProgress = computed(() => {
  if (projectStore.projects.length === 0) return 0
  const total = projectStore.projects.reduce((acc, p) => acc + p.progress, 0)
  return Math.round(total / projectStore.projects.length)
})

const chartDays = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label =
      i === 0
        ? `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} (Today)`
        : `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`
    days.push(label)
  }
  return days
})

const statusBreakdown = computed(() => {
  const total = filteredTasks.value.length || 1
  const statuses = [
    { status: 'Done', bgClass: 'bg-primary-container', textColor: 'text-primary' },
    { status: 'In Progress', bgClass: 'bg-secondary', textColor: 'text-secondary' },
    { status: 'Review', bgClass: 'bg-cyan-500', textColor: 'text-cyan-400' },
    { status: 'Waiting', bgClass: 'bg-amber-500', textColor: 'text-amber-400' },
    { status: 'Todo', bgClass: 'bg-muted', textColor: 'text-muted' }
  ]

  return statuses.map((s) => {
    const count = filteredTasks.value.filter((t) => t.status === s.status).length
    const percentage = Math.round((count / total) * 100)
    return {
      ...s,
      count,
      percentage
    }
  })
})

const exportReport = () => {
  const reportPayload = {
    workspace: workspaceStore.currentWorkspace?.name || 'Satria Workforce Workspace',
    exportedAt: new Date().toISOString(),
    selectedRange: selectedRange.value,
    metrics: {
      totalTasks: filteredTasks.value.length,
      completedTasks: completedTasksCount.value,
      completionRate: `${completionRate.value}%`,
      blockedTasks: blockedCount.value,
      activeProjectsCount: projectStore.projects.length,
      averageProjectProgress: `${averageProjectProgress.value}%`
    },
    projects: projectStore.projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      tasksCount: p.taskCount,
      completedTaskCount: p.completedTaskCount
    })),
    tasks: filteredTasks.value.map((t) => ({
      id: t.id,
      title: t.title,
      projectName: t.projectName,
      status: t.status,
      priority: t.priority,
      assignee: t.assigneeName || 'Unassigned',
      dueDate: t.dueDate,
      createdAt: t.createdAt
    }))
  }

  const blob = new Blob([JSON.stringify(reportPayload, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `SATRIA_Analytics_Report_${selectedRange.value.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  toast.show(
    'Analytics Report Exported',
    `Laporan analitik ${selectedRange.value} berhasil diunduh dalam format JSON.`,
    'success'
  )
}
</script>
