<template>
  <div class="space-y-6">
    <!-- Header & Executive Controls -->
    <div class="border-b border-outline-variant pb-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      <div>
        <div class="flex flex-wrap items-center gap-2.5">
          <h1 class="text-2xl font-bold text-on-surface">Cost & Governance Dashboard</h1>
          <UiBadge variant="success" size="sm" class="font-mono flex items-center gap-1.5" role="status" aria-live="polite">
            <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Owner / Director View (PRD 5.1)
          </UiBadge>
          <UiBadge variant="info" size="sm" class="font-mono">
            Compliance Score: {{ governanceStore.summary.compositeComplianceScore }}%
          </UiBadge>
        </div>
        <p class="text-xs text-muted mt-1">
          Executive command center for LLM token economics, quality gate verification, self-healing retries, and workforce governance.
        </p>
      </div>

      <!-- Filter Controls & Actions -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Time Range Selector -->
        <div class="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant">
          <button
            v-for="range in timeRanges"
            :key="range"
            @click="governanceStore.setTimeRange(range)"
            :class="[
              'px-2.5 py-1 rounded-md text-xs font-medium transition',
              governanceStore.activeTimeRange === range
                ? 'bg-surface-container-high text-primary font-semibold'
                : 'text-muted hover:text-on-surface'
            ]"
          >
            {{ range }}
          </button>
        </div>

        <!-- Department Filter -->
        <select
          :value="governanceStore.selectedDepartmentId"
          @change="onDepartmentChange"
          aria-label="Filter by department"
          class="bg-surface-container-low text-on-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-primary outline-none"
        >
          <option value="all">All Departments</option>
          <option
            v-for="dept in departmentStore.departments"
            :key="dept.id"
            :value="dept.id"
          >
            {{ dept.name }}
          </option>
        </select>

        <!-- Model Filter -->
        <select
          :value="governanceStore.selectedModel"
          @change="onModelChange"
          aria-label="Filter by model"
          class="bg-surface-container-low text-on-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-primary outline-none"
        >
          <option value="all">All Models</option>
          <option
            v-for="model in availableModelOptions"
            :key="model"
            :value="model"
          >
            {{ model }}
          </option>
        </select>

        <!-- Budget Cap Modal Trigger -->
        <UiButton size="sm" variant="secondary" :icon="Sliders" @click="showBudgetModal = true">
          Budget Cap
        </UiButton>

        <!-- Export Report -->
        <UiButton size="sm" variant="secondary" :icon="Download" @click="exportGovernanceReport">
          Export Audit
        </UiButton>
      </div>
    </div>

    <!-- Executive Health Ribbon -->
    <div class="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-on-surface">Executive Governance Status:</span>
            <UiBadge
              :variant="governanceStore.summary.financials.budgetStatus === 'healthy' ? 'success' : 'warning'"
              size="sm"
            >
              {{ governanceStore.summary.financials.budgetStatus.toUpperCase() }}
            </UiBadge>
          </div>
          <p class="text-xs text-muted mt-0.5">
            {{ governanceStore.summary.verification.passRate }}% verification pass-rate,
            {{ governanceStore.summary.reliability.retryRate }}% retry-rate,
            0 sandbox security violations.
          </p>
        </div>
      </div>

      <!-- Quick Budget Indicator -->
      <div class="flex items-center gap-4 text-xs font-mono border-t md:border-t-0 md:border-l border-outline-variant pt-3 md:pt-0 md:pl-5">
        <div>
          <div class="text-[10px] uppercase text-muted">Monthly Budget Burn</div>
          <div class="text-sm font-bold text-primary">
            {{ governanceStore.summary.financials.formattedTotalCost }} / ${{ governanceStore.summary.financials.budgetCapUsd.toFixed(2) }}
            <span class="text-[11px] text-muted font-normal">({{ governanceStore.summary.financials.budgetUsedPercentage }}%)</span>
          </div>
        </div>
        <div class="w-24">
          <UiProgress :value="governanceStore.summary.financials.budgetUsedPercentage" color="#4edea3" />
        </div>
      </div>
    </div>

    <!-- 4 High-Level Governance Pillar Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Pillar 1: Financial Governance -->
      <UiCard padding="md" class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Financial & Token Spend</span>
          <Coins class="w-4 h-4 text-primary" />
        </div>
        <div>
          <div class="text-2xl font-bold font-mono text-primary">
            {{ governanceStore.summary.financials.formattedTotalCost }}
          </div>
          <div class="text-[11px] text-on-surface-variant font-mono mt-0.5 flex items-center justify-between">
            <span>{{ governanceStore.summary.financials.formattedTotalTokens }} tokens</span>
            <span class="text-secondary" title="Estimated savings from token caching">
              Saved {{ governanceStore.summary.financials.formattedCacheSavings }}
            </span>
          </div>
        </div>
        <div class="pt-2 border-t border-outline-variant flex items-center justify-between text-[10px] font-mono text-muted">
          <span>Avg/Task: {{ governanceStore.summary.financials.formattedAvgCostPerTask }}</span>
          <span>Burn: ${{ governanceStore.summary.financials.budgetBurnRateDailyUsd }}/day</span>
        </div>
      </UiCard>

      <!-- Pillar 2: Quality Gate & Verification -->
      <UiCard padding="md" class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Verification Pass Rate</span>
          <CheckCircle2 class="w-4 h-4 text-secondary" />
        </div>
        <div>
          <div class="text-2xl font-bold font-mono text-secondary">
            {{ governanceStore.summary.verification.passRate }}%
          </div>
          <div class="text-[11px] text-on-surface-variant font-mono mt-0.5 flex items-center justify-between">
            <span>{{ governanceStore.summary.verification.passedCount }} Passed, {{ governanceStore.summary.verification.warningCount }} Warning</span>
            <span>Score: {{ governanceStore.summary.verification.qualityScoreAvg }}/100</span>
          </div>
        </div>
        <div class="pt-2 border-t border-outline-variant flex items-center justify-between text-[10px] font-mono text-muted">
          <span>1st-Time Pass: {{ governanceStore.summary.verification.firstTimePassRate }}%</span>
          <span class="text-primary">Strict Quality Gate</span>
        </div>
      </UiCard>

      <!-- Pillar 3: Reliability & Retry Rate -->
      <UiCard padding="md" class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Reliability & Retry Rate</span>
          <RotateCcw class="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <div class="text-2xl font-bold font-mono text-on-surface">
            {{ governanceStore.summary.reliability.retryRate }}%
          </div>
          <div class="text-[11px] text-on-surface-variant font-mono mt-0.5 flex items-center justify-between">
            <span>{{ governanceStore.summary.reliability.retryCount }} of {{ governanceStore.summary.reliability.totalRuns }} retried</span>
            <span class="text-primary font-bold">Self-Heal: {{ governanceStore.summary.reliability.selfHealingSuccessRate }}%</span>
          </div>
        </div>
        <div class="pt-2 border-t border-outline-variant flex items-center justify-between text-[10px] font-mono text-muted">
          <span>Unrecoverable Fail: {{ governanceStore.summary.reliability.unrecoverableFailureRate }}%</span>
          <span>Avg Dur: {{ governanceStore.summary.reliability.formattedAvgDuration }}</span>
        </div>
      </UiCard>

      <!-- Pillar 4: Security & Human Approval -->
      <UiCard padding="md" class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono text-muted uppercase">Human-in-the-Loop & Safety</span>
          <Lock class="w-4 h-4 text-primary" />
        </div>
        <div>
          <div class="text-2xl font-bold font-mono text-primary">
            {{ governanceStore.summary.security.approvalRate }}%
          </div>
          <div class="text-[11px] text-on-surface-variant font-mono mt-0.5 flex items-center justify-between">
            <span>{{ governanceStore.summary.security.approvedCount }} Approved / {{ governanceStore.summary.security.totalApprovalsRequested }} Reviews</span>
            <span class="text-primary">100% Boundary Safe</span>
          </div>
        </div>
        <div class="pt-2 border-t border-outline-variant flex items-center justify-between text-[10px] font-mono text-muted">
          <span>Violations: {{ governanceStore.summary.security.securityViolationsCount }}</span>
          <span>Risk Actions: {{ governanceStore.summary.security.highRiskToolInvocationsCount }}</span>
        </div>
      </UiCard>
    </div>

    <!-- Evidence Quality Gate Assertion Matrix -->
    <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
            <Layers class="w-4 h-4 text-primary" />
            Quality Gate Evidence Matrix
          </h3>
          <p class="text-xs text-muted">
            Aggregated pass rates across mandatory automated verification dimensions before task completion.
          </p>
        </div>
        <div class="text-xs font-mono text-muted">
          Total Evaluated Runs: <span class="text-on-surface font-bold">{{ governanceStore.summary.verification.totalEvaluatedRuns }}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
        <!-- Automated Test Suite -->
        <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-on-surface">Unit & Integration Tests</span>
            <CheckCircle2 class="w-3.5 h-3.5 text-primary" />
          </div>
          <div class="text-lg font-bold font-mono text-primary">
            {{ governanceStore.summary.verification.evidencePassRates.testSuite.rate }}%
          </div>
          <UiProgress :value="governanceStore.summary.verification.evidencePassRates.testSuite.rate" color="#4edea3" />
          <div class="text-[10px] font-mono text-muted">vitest test execution</div>
        </div>

        <!-- TypeScript Strict Typecheck -->
        <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-on-surface">TypeScript Strict Mode</span>
            <CheckCircle2 class="w-3.5 h-3.5 text-primary" />
          </div>
          <div class="text-lg font-bold font-mono text-primary">
            {{ governanceStore.summary.verification.evidencePassRates.typecheck.rate }}%
          </div>
          <UiProgress :value="governanceStore.summary.verification.evidencePassRates.typecheck.rate" color="#4edea3" />
          <div class="text-[10px] font-mono text-muted">vue-tsc 0 errors</div>
        </div>

        <!-- Production Build -->
        <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-on-surface">Production Bundle</span>
            <CheckCircle2 class="w-3.5 h-3.5 text-primary" />
          </div>
          <div class="text-lg font-bold font-mono text-primary">
            {{ governanceStore.summary.verification.evidencePassRates.buildBundle.rate }}%
          </div>
          <UiProgress :value="governanceStore.summary.verification.evidencePassRates.buildBundle.rate" color="#4edea3" />
          <div class="text-[10px] font-mono text-muted">vite build compilation</div>
        </div>

        <!-- Acceptance Criteria -->
        <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-on-surface">Acceptance Criteria</span>
            <CheckCircle2 class="w-3.5 h-3.5 text-secondary" />
          </div>
          <div class="text-lg font-bold font-mono text-secondary">
            {{ governanceStore.summary.verification.evidencePassRates.acceptanceCriteria.rate }}%
          </div>
          <UiProgress :value="governanceStore.summary.verification.evidencePassRates.acceptanceCriteria.rate" color="#4cd7f6" />
          <div class="text-[10px] font-mono text-muted">Deliverable assertion</div>
        </div>

        <!-- Security Sandbox Boundary -->
        <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-on-surface">Sandbox Boundary</span>
            <ShieldCheck class="w-3.5 h-3.5 text-primary" />
          </div>
          <div class="text-lg font-bold font-mono text-primary">
            {{ governanceStore.summary.verification.evidencePassRates.securitySandbox.rate }}%
          </div>
          <UiProgress :value="governanceStore.summary.verification.evidencePassRates.securitySandbox.rate" color="#4edea3" />
          <div class="text-[10px] font-mono text-muted">Zero traversal/leak</div>
        </div>
      </div>
    </div>

    <!-- Charts & Analytics Section: Spend Velocity + Department Cost Share -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 7-Day Token & Spend Trajectory Chart (2 cols) -->
      <div class="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
              <TrendingUp class="w-4 h-4 text-primary" />
              Token & Cost Trajectory Trend
            </h3>
            <p class="text-xs text-muted">Daily token volume consumption (k-tokens) vs Dollar spend trajectory</p>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono">
            <span class="flex items-center gap-1.5 text-primary">
              <span class="w-2.5 h-2.5 rounded-sm bg-primary"></span>
              Token Volume (k)
            </span>
            <span class="flex items-center gap-1.5 text-secondary">
              <span class="w-2.5 h-2.5 rounded-sm bg-secondary"></span>
              Cost ($ USD)
            </span>
          </div>
        </div>

        <!-- SVG Technical Chart -->
        <div class="h-56 w-full pt-4">
          <svg class="w-full h-full" viewBox="0 0 700 200" fill="none" preserveAspectRatio="none">
            <!-- Grid Lines -->
            <line x1="0" y1="40" x2="700" y2="40" stroke="var(--color-outline-variant)" stroke-dasharray="4 4" />
            <line x1="0" y1="90" x2="700" y2="90" stroke="var(--color-outline-variant)" stroke-dasharray="4 4" />
            <line x1="0" y1="140" x2="700" y2="140" stroke="var(--color-outline-variant)" stroke-dasharray="4 4" />
            <line x1="0" y1="180" x2="700" y2="180" stroke="var(--color-outline-variant)" />

            <!-- Token Area Curve -->
            <path
              d="M 20 160 Q 120 130, 220 120 T 420 80 T 620 35 L 680 40 L 680 180 L 20 180 Z"
              fill="rgba(78, 222, 163, 0.12)"
            />
            <path
              d="M 20 160 Q 120 130, 220 120 T 420 80 T 620 35 L 680 40"
              stroke="#4edea3"
              stroke-width="2.5"
              fill="none"
            />

            <!-- Cost Line Curve -->
            <path
              d="M 20 170 Q 120 150, 220 135 T 420 100 T 620 55 L 680 60"
              stroke="#4cd7f6"
              stroke-width="2"
              stroke-dasharray="2 2"
              fill="none"
            />

            <!-- Data Dots -->
            <circle cx="220" cy="120" r="4" fill="#10b981" />
            <circle cx="420" cy="80" r="4" fill="#10b981" />
            <circle cx="620" cy="35" r="5" fill="#4edea3" stroke="#003824" stroke-width="2" />
          </svg>
        </div>

        <!-- Chart Timeline Labels -->
        <div class="flex items-center justify-between text-[10px] font-mono text-muted pt-1 border-t border-outline-variant">
          <span v-for="point in governanceStore.summary.dailyTrend" :key="point.date">
            {{ point.label }}
          </span>
        </div>
      </div>

      <!-- Department Cost Allocation Breakdown (1 col) -->
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-5 space-y-4 flex flex-col justify-between">
        <div>
          <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
            <Building2 class="w-4 h-4 text-secondary" />
            Department Cost Share
          </h3>
          <p class="text-xs text-muted">Spend and token allocation per department</p>
        </div>

        <div class="space-y-4">
          <div
            v-for="dept in governanceStore.summary.departmentSummaries"
            :key="dept.departmentId"
            class="space-y-1.5"
          >
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-on-surface font-medium">{{ dept.departmentName }}</span>
              <span class="text-primary font-bold">{{ dept.formattedCost }} ({{ dept.costPercentage }}%)</span>
            </div>
            <div class="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant">
              <div
                class="h-full bg-primary rounded-full transition-all duration-300"
                :style="{ width: `${Math.max(4, dept.costPercentage)}%` }"
              ></div>
            </div>
            <div class="flex items-center justify-between text-[10px] font-mono text-muted">
              <span>{{ dept.formattedTokens }} tokens &bull; {{ dept.totalRuns }} runs</span>
              <span class="text-secondary">Pass Rate: {{ dept.passRate }}%</span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-outline-variant flex items-center justify-between text-xs font-mono text-muted">
          <span>Global Spend</span>
          <span class="text-primary font-bold">{{ governanceStore.summary.financials.formattedTotalCost }}</span>
        </div>
      </div>
    </div>

    <!-- Multi-Tab Governance Ledgers: Employee ROI / Model Economics / Run Audit -->
    <div class="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
      <!-- Tabs Navigation -->
      <div class="flex items-center justify-between border-b border-outline-variant px-5 pt-3 bg-surface-container-lowest">
        <div class="flex items-center gap-6">
          <button
            @click="activeLedgerTab = 'employees'"
            :class="[
              'pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2',
              activeLedgerTab === 'employees'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-on-surface'
            ]"
          >
            <Users class="w-4 h-4" />
            Digital Employee ROI Ledger
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-container-high text-on-surface-variant">
              {{ governanceStore.summary.employeeSummaries.length }}
            </span>
          </button>

          <button
            @click="activeLedgerTab = 'models'"
            :class="[
              'pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2',
              activeLedgerTab === 'models'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-on-surface'
            ]"
          >
            <Cpu class="w-4 h-4" />
            Model Economics & Latency
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-container-high text-on-surface-variant">
              {{ governanceStore.summary.modelEconomics.length }}
            </span>
          </button>

          <button
            @click="activeLedgerTab = 'audit'"
            :class="[
              'pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2',
              activeLedgerTab === 'audit'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-on-surface'
            ]"
          >
            <ShieldCheck class="w-4 h-4" />
            Execution Governance Audit Log
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-container-high text-on-surface-variant">
              {{ agentRunStore.runs.length }}
            </span>
          </button>

          <button
            @click="activeLedgerTab = 'router'"
            :class="[
              'pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2',
              activeLedgerTab === 'router'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-on-surface'
            ]"
          >
            <Boxes class="w-4 h-4" />
            Dynamic Model Router & Department Caps
            <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-primary/20 text-primary font-bold">
              {{ governanceStore.modelRouterPolicy }}
            </span>
          </button>
        </div>

        <div class="hidden sm:flex items-center text-xs font-mono text-muted pb-3">
          Auto-synchronized with IndexedDB & Hermes Telemetry
        </div>
      </div>

      <!-- Tab 1: Digital Employee ROI Ledger -->
      <div v-if="activeLedgerTab === 'employees'" class="p-5">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="border-b border-outline-variant text-muted text-[10px] uppercase">
                <th class="pb-3 pl-2">Digital Employee</th>
                <th class="pb-3">Department & Role</th>
                <th class="pb-3 text-center">Total Runs</th>
                <th class="pb-3 text-right">Tokens Used</th>
                <th class="pb-3 text-right">Total Cost ($)</th>
                <th class="pb-3 text-center">Pass Rate</th>
                <th class="pb-3 text-center">Retry Rate</th>
                <th class="pb-3 text-center">Efficiency Rating</th>
                <th class="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr
                v-for="emp in governanceStore.summary.employeeSummaries"
                :key="emp.employeeId"
                class="hover:bg-surface-container transition group"
              >
                <td class="py-3 pl-2">
                  <div class="flex items-center gap-2.5">
                    <img
                      :src="emp.employeeAvatar"
                      :alt="emp.employeeName"
                      class="w-7 h-7 rounded-full object-cover border border-outline-variant"
                    />
                    <div>
                      <div class="font-bold text-on-surface font-sans text-xs">{{ emp.employeeName }}</div>
                      <div class="text-[10px] text-muted">{{ emp.employeeId }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-3">
                  <div class="text-on-surface font-sans text-xs">{{ emp.employeeRole }}</div>
                  <div class="text-[10px] text-muted">{{ emp.departmentName }}</div>
                </td>
                <td class="py-3 text-center font-bold text-on-surface">
                  {{ emp.totalRuns }}
                </td>
                <td class="py-3 text-right text-on-surface-variant">
                  {{ emp.formattedTokens }}
                </td>
                <td class="py-3 text-right font-bold text-primary">
                  {{ emp.formattedCost }}
                </td>
                <td class="py-3 text-center">
                  <UiBadge
                    :variant="emp.passRate >= 90 ? 'success' : emp.passRate >= 70 ? 'warning' : 'error'"
                    size="sm"
                  >
                    {{ emp.passRate }}%
                  </UiBadge>
                </td>
                <td class="py-3 text-center">
                  <span :class="emp.retryRate > 0 ? 'text-amber-500 font-bold' : 'text-muted'">
                    {{ emp.retryRate }}%
                  </span>
                </td>
                <td class="py-3 text-center">
                  <div class="inline-flex items-center gap-1.5">
                    <span class="font-bold text-primary">{{ emp.efficiencyScore }}</span>
                    <span class="text-[10px] text-muted">/100</span>
                  </div>
                </td>
                <td class="py-3 text-right pr-2">
                  <router-link
                    :to="`/workforce/employees/${emp.employeeId}`"
                    class="text-[11px] text-primary hover:underline"
                  >
                    Profile &rarr;
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: Model Economics Ledger -->
      <div v-if="activeLedgerTab === 'models'" class="p-5">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="border-b border-outline-variant text-muted text-[10px] uppercase">
                <th class="pb-3 pl-2">Model & Provider</th>
                <th class="pb-3 text-right">Prompt / 1M</th>
                <th class="pb-3 text-right">Completion / 1M</th>
                <th class="pb-3 text-center">Calls</th>
                <th class="pb-3 text-right">Total Tokens</th>
                <th class="pb-3 text-right">Total Cost ($)</th>
                <th class="pb-3 text-center">Avg Latency</th>
                <th class="pb-3 text-center pr-2">Pass Rate</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr
                v-for="m in governanceStore.summary.modelEconomics"
                :key="m.model"
                class="hover:bg-surface-container transition"
              >
                <td class="py-3 pl-2">
                  <div class="font-bold text-on-surface font-sans text-xs">{{ m.model }}</div>
                  <div class="text-[10px] text-muted">{{ m.provider }}</div>
                </td>
                <td class="py-3 text-right text-muted">
                  ${{ m.promptCostPer1M.toFixed(2) }}
                </td>
                <td class="py-3 text-right text-muted">
                  ${{ m.completionCostPer1M.toFixed(2) }}
                </td>
                <td class="py-3 text-center font-bold text-on-surface">
                  {{ m.totalCalls }}
                </td>
                <td class="py-3 text-right text-on-surface-variant">
                  {{ m.formattedTokens }}
                </td>
                <td class="py-3 text-right font-bold text-primary">
                  {{ m.formattedCost }}
                </td>
                <td class="py-3 text-center text-muted">
                  {{ m.avgDurationSeconds }}s
                </td>
                <td class="py-3 text-center pr-2">
                  <UiBadge :variant="m.passRate >= 90 ? 'success' : 'warning'" size="sm">
                    {{ m.passRate }}%
                  </UiBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 3: Execution Governance Audit Log -->
      <div v-if="activeLedgerTab === 'audit'" class="p-5">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-mono">
            <thead>
              <tr class="border-b border-outline-variant text-muted text-[10px] uppercase">
                <th class="pb-3 pl-2">Run ID & Task</th>
                <th class="pb-3">Digital Employee</th>
                <th class="pb-3">Model</th>
                <th class="pb-3 text-center">Attempt</th>
                <th class="pb-3 text-center">Status</th>
                <th class="pb-3 text-center">Quality Gate</th>
                <th class="pb-3 text-right">Cost ($)</th>
                <th class="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              <tr
                v-for="run in agentRunStore.runs"
                :key="run.id"
                class="hover:bg-surface-container transition group"
              >
                <td class="py-3 pl-2">
                  <div class="font-bold text-on-surface font-sans text-xs line-clamp-1">{{ run.taskTitle }}</div>
                  <div class="text-[10px] text-muted">{{ run.id }} &bull; {{ run.taskId }}</div>
                </td>
                <td class="py-3">
                  <div class="flex items-center gap-2">
                    <img
                      :src="run.employeeAvatar"
                      :alt="run.employeeName"
                      class="w-5 h-5 rounded-full object-cover border border-outline-variant"
                    />
                    <span class="font-sans text-xs text-on-surface">{{ run.employeeName }}</span>
                  </div>
                </td>
                <td class="py-3 text-muted text-[11px]">
                  {{ run.telemetry?.model || 'mock-agent' }}
                </td>
                <td class="py-3 text-center">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-[10px] font-mono border',
                      run.attempt > 1
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold'
                        : 'bg-surface-container-high text-muted border-outline-variant'
                    ]"
                  >
                    Attempt #{{ run.attempt }}
                  </span>
                </td>
                <td class="py-3 text-center">
                  <UiBadge
                    :variant="run.status === 'Completed' ? 'success' : run.status === 'Failed' ? 'error' : 'neutral'"
                    size="sm"
                  >
                    {{ run.status }}
                  </UiBadge>
                </td>
                <td class="py-3 text-center">
                  <UiBadge
                    :variant="run.status === 'Completed' ? 'success' : run.status === 'Failed' ? 'error' : 'neutral'"
                    size="sm"
                  >
                    {{ run.status === 'Completed' ? 'Passed' : run.status === 'Failed' ? 'Failed' : 'Evaluating' }}
                  </UiBadge>
                </td>
                <td class="py-3 text-right font-bold text-primary">
                  ${{ (run.telemetry?.estimatedCostUsd ?? 0).toFixed(4) }}
                </td>
                <td class="py-3 text-right pr-2">
                  <router-link
                    :to="`/runs/${run.id}`"
                    class="text-[11px] text-primary hover:underline"
                  >
                    Inspect &rarr;
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 4: Dynamic Model Router & Department Caps -->
      <div v-if="activeLedgerTab === 'router'" class="p-5 space-y-6">
        <!-- 1. Optimization Policy Selector -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
                <Boxes class="w-4 h-4 text-primary" />
                Multi-Model Optimization Policy
              </h3>
              <p class="text-xs text-muted mt-0.5">
                Pilih strategi routing runtime otomatis untuk menyeimbangkan performa, akurasi penalaran, dan biaya token API.
              </p>
            </div>
            <UiBadge variant="info" size="sm" class="font-mono">
              ACTIVE: {{ governanceStore.modelRouterPolicy }}
            </UiBadge>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              v-for="pol in routerPolicies"
              :key="pol.id"
              @click="governanceStore.setModelRouterPolicy(pol.id)"
              :class="[
                'p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2',
                governanceStore.modelRouterPolicy === pol.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                  : 'border-outline-variant bg-surface-container hover:border-outline'
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-on-surface font-mono">{{ pol.label }}</span>
                <component :is="pol.icon" class="w-4 h-4" :class="pol.colorClass" />
              </div>
              <p class="text-[11px] text-muted leading-relaxed">{{ pol.description }}</p>
              <div class="text-[10px] font-mono font-bold" :class="pol.colorClass">{{ pol.targetModels }}</div>
            </div>
          </div>
        </div>

        <!-- 2. Department Spending Budgets & Hard Cap Enforcer -->
        <div class="space-y-3 pt-2 border-t border-outline-variant">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
                <Building2 class="w-4 h-4 text-secondary" />
                Department Cost Budgets & Hard Cap Governance
              </h3>
              <p class="text-xs text-muted mt-0.5">
                Alokasi batas pengeluaran bulanan per departemen untuk mencegah pemborosan token tidak terkontrol.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <input
                id="hardCapToggle"
                v-model="governanceStore.hardCapEnabled"
                type="checkbox"
                class="rounded bg-surface-container text-primary focus:ring-0"
              />
              <label for="hardCapToggle" class="text-xs font-mono text-on-surface">Hard Cap Enforcer (Pause on Cap)</label>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              v-for="dept in departmentBudgetsList"
              :key="dept.id"
              class="p-3.5 rounded-xl bg-surface-container border border-outline-variant space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-on-surface">{{ dept.name }}</span>
                <span class="text-[10px] font-mono text-muted">{{ dept.id }}</span>
              </div>
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-muted">Alokasi Bulanan:</span>
                <div class="flex items-center gap-1">
                  <span class="text-muted">$</span>
                  <input
                    type="number"
                    :value="dept.budget"
                    @input="(e: any) => governanceStore.setDepartmentBudget(dept.id, Number(e.target.value))"
                    class="w-16 px-1.5 py-0.5 bg-surface-container-lowest border border-outline-variant rounded text-right text-xs font-mono text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-[10px] font-mono text-muted">
                  <span>Burn Rate: {{ dept.usedFormatted }}</span>
                  <span>{{ dept.usedPercent }}%</span>
                </div>
                <UiProgress :value="dept.usedPercent" :color="dept.usedPercent > 80 ? '#f59e0b' : '#4edea3'" />
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Model Router Simulator -->
        <div class="space-y-3 pt-2 border-t border-outline-variant">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-on-surface flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-purple-400" />
              Interactive Model Routing Simulator
            </h3>
            <span class="text-[10px] font-mono text-muted">Uji keputusan model router sebelum dispatch</span>
          </div>

          <div class="p-4 rounded-xl bg-surface-container border border-outline-variant space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="md:col-span-2">
                <label class="block text-[10px] font-mono text-muted uppercase mb-1">Judul Task / Instruksi</label>
                <input
                  v-model="simTaskTitle"
                  type="text"
                  placeholder="Contoh: Fix JWT concurrency mutex in auth controller with unit tests"
                  class="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface font-mono focus:border-primary focus:outline-none"
                  @keyup.enter="runSimRoute"
                />
              </div>
              <div>
                <label class="block text-[10px] font-mono text-muted uppercase mb-1">Execution Mode</label>
                <select
                  v-model="simTaskMode"
                  class="w-full px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface font-mono focus:border-primary focus:outline-none"
                >
                  <option value="ENGINEERING_EXECUTION">ENGINEERING_EXECUTION (Coding / Git)</option>
                  <option value="EMAIL_INTELLIGENCE">EMAIL_INTELLIGENCE (Data / Mail)</option>
                  <option value="CROSS_SYSTEM">CROSS_SYSTEM (Multi-App Orchestration)</option>
                  <option value="STANDARD_EXECUTION">STANDARD_EXECUTION (General)</option>
                </select>
              </div>
            </div>

            <!-- Decision Result Banner -->
            <div v-if="simDecision" class="p-3 rounded-lg bg-surface-container-lowest border border-purple-500/30 space-y-2 text-xs font-mono">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 pb-2">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                    {{ simDecision.selectedModel }}
                  </span>
                  <span class="text-muted">Provider: {{ simDecision.selectedProvider }}</span>
                  <span class="text-secondary">Category: {{ simDecision.taskCategory }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-emerald-400 font-bold">Est Cost: ${{ simDecision.estimatedCostPer1kTokens }}/1k tokens</span>
                  <span class="text-amber-400">Est Latency: ~{{ simDecision.estimatedLatencyMs }}ms</span>
                </div>
              </div>
              <p class="text-[11px] text-on-surface-variant font-sans leading-relaxed">
                {{ simDecision.reason }}
              </p>
              <div v-if="simDecision.fallbackModel" class="text-[10px] text-muted">
                Fallback Model: <span class="text-on-surface">{{ simDecision.fallbackModel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Budget Cap Configuration Modal -->
    <UiModal
      :open="showBudgetModal"
      title="Configure Monthly Spend & Budget Governance"
      @close="showBudgetModal = false"
    >
      <div class="space-y-4">
        <p class="text-xs text-muted">
          Define financial governance caps for your digital workforce. When token consumption reaches 90% of the threshold, notifications and automated pauses are triggered.
        </p>

        <div>
          <label class="block text-xs font-medium text-on-surface mb-1 font-mono">Monthly Budget Cap ($ USD)</label>
          <input
            v-model.number="tempBudgetCap"
            type="number"
            min="1"
            step="5"
            class="w-full bg-surface-container text-on-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-mono focus:border-primary outline-none"
          />
        </div>

        <div class="p-3 bg-surface-container-lowest border border-outline-variant rounded-lg space-y-1 text-xs font-mono">
          <div class="flex justify-between text-muted">
            <span>Current Spend:</span>
            <span class="text-primary font-bold">{{ governanceStore.summary.financials.formattedTotalCost }}</span>
          </div>
          <div class="flex justify-between text-muted">
            <span>New Cap:</span>
            <span class="text-on-surface font-bold">${{ Number(tempBudgetCap || 50).toFixed(2) }} USD</span>
          </div>
          <div class="flex justify-between text-muted">
            <span>Projected Month-End Spend:</span>
            <span class="text-secondary">${{ governanceStore.summary.financials.projectedMonthEndCostUsd.toFixed(2) }} USD</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2.5">
          <UiButton variant="ghost" size="sm" @click="showBudgetModal = false">Cancel</UiButton>
          <UiButton variant="primary" size="sm" @click="saveBudgetCap">Save Budget Cap</UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ShieldCheck,
  Coins,
  CheckCircle2,
  RotateCcw,
  Lock,
  Layers,
  TrendingUp,
  Building2,
  Users,
  Cpu,
  Sliders,
  Download,
  Boxes,
  Sparkles,
  Zap
} from '@lucide/vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiProgress from '../../components/ui/UiProgress.vue'
import UiModal from '../../components/ui/UiModal.vue'
import { useGovernanceStore } from '../../stores/governance'
import { useDepartmentStore } from '../../stores/department'
import { useAgentRunStore } from '../../stores/agentRun'
import { useEmployeeStore } from '../../stores/employee'
import { useToast } from '../../composables/useToast'
import type { ModelOptimizationPolicy, ModelRoutingDecision, SatriaExecutionMode } from '../../types'

const governanceStore = useGovernanceStore()
const departmentStore = useDepartmentStore()
const agentRunStore = useAgentRunStore()
const employeeStore = useEmployeeStore()
const toast = useToast()

const timeRanges = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'All Time'] as const
const activeLedgerTab = ref<'employees' | 'models' | 'audit' | 'router'>('employees')
const showBudgetModal = ref(false)
const tempBudgetCap = ref(governanceStore.budgetCapUsd)

const simTaskTitle = ref('Fix JWT concurrency mutex in auth controller with unit tests')
const simTaskMode = ref<SatriaExecutionMode>('ENGINEERING_EXECUTION')

const routerPolicies = [
  {
    id: 'BALANCED' as ModelOptimizationPolicy,
    label: 'Balanced Policy (Default)',
    icon: Boxes,
    colorClass: 'text-primary',
    description: 'Routing cerdas otomatis: Claude 3.5 untuk coding, GPT-4o-mini untuk ekstraksi data, Hermes untuk filter.',
    targetModels: 'Claude 3.5 Sonnet / GPT-4o-mini'
  },
  {
    id: 'COST_OPTIMIZED' as ModelOptimizationPolicy,
    label: 'Cost-Optimized Policy',
    icon: Coins,
    colorClass: 'text-emerald-400',
    description: 'Prioritas efisiensi biaya maksimal. Memangkas biaya token hingga 90% menggunakan model ringan.',
    targetModels: 'GPT-4o-mini / Hermes-3 8B'
  },
  {
    id: 'QUALITY_FIRST' as ModelOptimizationPolicy,
    label: 'Quality-First Policy',
    icon: Sparkles,
    colorClass: 'text-purple-400',
    description: 'Mengutamakan akurasi penalaran frontier model untuk pekerjaan zero-defect critical path.',
    targetModels: 'Claude 3.5 Sonnet / GPT-4o'
  },
  {
    id: 'LOW_LATENCY' as ModelOptimizationPolicy,
    label: 'Low-Latency Policy',
    icon: Zap,
    colorClass: 'text-cyan-400',
    description: 'Optimal untuk workflow interaktif sub-300ms SLA dan asistensi real-time.',
    targetModels: 'Claude 3 Haiku / GPT-4o-mini'
  }
]

onMounted(async () => {
  await governanceStore.loadAllData()
  tempBudgetCap.value = governanceStore.budgetCapUsd
})

const availableModelOptions = computed(() => {
  const models = new Set<string>()
  for (const r of agentRunStore.runs) {
    if (r.telemetry?.model) models.add(r.telemetry.model)
  }
  return Array.from(models)
})

const departmentBudgetsList = computed(() => {
  const depts = [
    { id: 'dept-eng', name: 'Engineering & QA' },
    { id: 'dept-side-hustle', name: 'Side Hustle Operations' },
    { id: 'dept-trainer', name: 'Workforce Trainer & Benchmarks' }
  ]

  return depts.map((d) => {
    const budget = governanceStore.departmentBudgets[d.id] || 20.0
    // Estimate used from runs matching department employees
    const deptEmployeeIds = new Set(
      employeeStore.employees.filter((e) => e.departmentId === d.id).map((e) => e.id)
    )
    const deptRuns = agentRunStore.runs.filter((r) => deptEmployeeIds.has(r.employeeId))
    const used = deptRuns.reduce((sum, r) => sum + (r.telemetry?.estimatedCostUsd || 0.005), 0)
    const usedPercent = Math.min(100, Math.round((used / budget) * 100))
    return {
      id: d.id,
      name: d.name,
      budget,
      used,
      usedFormatted: `$${used.toFixed(3)}`,
      usedPercent
    }
  })
})

const simDecision = computed<ModelRoutingDecision>(() => {
  return governanceStore.routeModelForTask({
    title: simTaskTitle.value,
    executionMode: simTaskMode.value
  })
})

const onDepartmentChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  governanceStore.setDepartmentFilter(target.value)
}

const onModelChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  governanceStore.setModelFilter(target.value)
}

const saveBudgetCap = () => {
  governanceStore.setBudgetCap(tempBudgetCap.value)
  showBudgetModal.value = false
  toast.show('Budget Cap Updated', `Monthly workforce budget cap configured to $${tempBudgetCap.value.toFixed(2)} USD.`, 'success')
}

const runSimRoute = () => {
  // Triggers reactivity
}

const exportGovernanceReport = () => {
  const data = governanceStore.summary
  const reportSummary = [
    `SATRIA AI WORKFORCE - COST & GOVERNANCE AUDIT REPORT`,
    `Generated: ${new Date().toISOString()}`,
    `Filter: ${data.filter.range} | Department: ${data.filter.departmentId || 'All'} | Model: ${data.filter.model || 'All'}`,
    `----------------------------------------------------`,
    `Total Spend: ${data.financials.formattedTotalCost} / Budget Cap: $${data.financials.budgetCapUsd}`,
    `Total Tokens: ${data.financials.formattedTotalTokens}`,
    `Verification Pass Rate: ${data.verification.passRate}% (Quality Score: ${data.verification.qualityScoreAvg}/100)`,
    `Retry Rate: ${data.reliability.retryRate}% (Self-Healing Success Rate: ${data.reliability.selfHealingSuccessRate}%)`,
    `Security Violations: ${data.security.securityViolationsCount} (100% Boundary Compliant)`,
    `Human Approvals: ${data.security.approvedCount}/${data.security.totalApprovalsRequested} (${data.security.approvalRate}%)`
  ].join('\n')

  const blob = new Blob([reportSummary], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `satria-governance-audit-${new Date().toISOString().split('T')[0]}.txt`
  a.click()
  URL.revokeObjectURL(url)

  toast.show('Audit Report Exported', 'Executive governance report downloaded.', 'success')
}
</script>
