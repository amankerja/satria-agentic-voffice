# AGENTS.md — SATRIA AI WORKFORCE

## Product Identity

**SATRIA AI WORKFORCE** — PWA Web Workspace / "Your Digital Workforce Command Center"

SATRIA AI Workforce is an enterprise-grade agentic AI workforce operating layer with real autonomous execution runtime (Hermes Agent & Pilot Worker), safe tool sandboxing, verification quality gates, human-in-the-loop approvals, self-healing retries, and executive cost governance.

> "Build the office first. Fill it with digital workforce. Automate execution, verification, and governance."

## Status

- **Phase 0 (Workspace Foundation):** 100% Complete ✅
- **Phase 1 (Workforce Structure & Registry):** 100% Complete ✅
  - Sub-Phase 1.1: Data Foundation (Types, 3 Depts, 12 Roles, 12 Employees, 20+ Skills, 12 Tools, Repositories & Stores) ✅
  - Sub-Phase 1.2: Navigation & Shell (Router, Sidebar section, Command Palette search, Scaffold pages) ✅
  - Sub-Phase 1.3: Workforce Overview & Departments (5 KPI cards, Department breakdown cards, Department detail) ✅
  - Sub-Phase 1.4: Employee Directory & Full CRUD (Search/filter, 7-step Create Wizard, 6-tab Employee Detail, Archive/Restore) ✅
  - Sub-Phase 1.5: Skill & Tool Registries (Internal core & 11 external packages, copyable install commands, Tool access levels) ✅
  - Sub-Phase 1.6: QA & Validation (24 Vitest tests pass across 3 suites, vue-tsc 0 errors, production build OK) ✅
- **Phase 2 (Task Assignment, Mock Agent Runner & Review Workflow):** 100% Complete ✅
  - Sub-Phase 2.1: Data Foundation & Type System (Types, Repositories, Pinia Stores, Seed Data) ✅
  - Sub-Phase 2.2: Task Assignment & Skill Matcher (`AssignmentDrawer.vue`, Skill Eligibility Engine) ✅
  - Sub-Phase 2.3: Mock Agent Runner Engine (`MockAgentRunner.ts` reactive simulation service) ✅
  - Sub-Phase 2.4: Agent Run Monitor & Detail Pages (`/runs` and `/runs/:id`) ✅
  - Sub-Phase 2.5: Result, Verification & Review Workflow (`/reviews` & `ReviewDrawer.vue`) ✅
  - Sub-Phase 2.6: Employee Profile Extension (`Work` and `Runs` tabs in `EmployeeDetailPage.vue`) ✅
  - Sub-Phase 2.7: Workspace Dashboard, Activity & Command Palette (Ctrl+K) Integration ✅
  - Sub-Phase 2.8: QA & Validation (29 Vitest tests pass across 4 suites, vue-tsc 0 errors, production build OK) ✅
- **Phase 3 (Real Agent Runtime — Hermes Adapter, Autonomous Loop & Governance):** 100% Complete ✅
  - Sub-Phase 3.1: Runtime Architecture & Interface Contract (`src/runtime/types.ts`, `RuntimeFactory.ts`, `MockRuntimeAdapter.ts`) ✅
  - Sub-Phase 3.2: Native Hermes API Alignment & Protocol Gateway (`HermesClient.ts`, `HermesMapper.ts`, `HermesRuntimeAdapter.ts`, SSE stream parser, exponential backoff) ✅
  - Sub-Phase 3.3: Context Synthesis & Skill Loader (`SkillLoader.ts`, `ContextBuilder.ts`) ✅
  - Sub-Phase 3.4: Safe Tool Sandbox & Security Defense (`SandboxPolicy.ts`, Path Traversal & Symlink Defense, Read/Write/Admin policy) ✅
  - Sub-Phase 3.5: Approval Gate & Hardened Human-in-the-Loop (`RunApprovalDrawer.vue`, `RunDetailPage.vue`, `useAgentRunStore`, Retry/Rejection Lifecycle) ✅
  - Sub-Phase 3.6: Live Observability & Telemetry Engine (`modelPricing.ts`, `CostCalculator.ts`, `TelemetryMapper.ts`, `TelemetryError.ts`, `useHermesHealth.ts`, persistent topbar indicator) ✅
  - Sub-Phase 3.7: Result Ingestion & Quality Gate Verification Pipeline (`ResultIngestor.ts`, `VerificationEngine.ts`, `AcceptanceCriteriaRule.ts`, multi-evidence assertions) ✅
  - Sub-Phase 3.8: Unified Verification Presentation & Artifact Diff Viewers (`RunDetailPage.vue`, `ReviewsPage.vue`, `ReviewDrawer.vue`, visual diff syntax viewer) ✅
  - Sub-Phase 3.9: Autonomous Task Loop & Lifecycle Governance (`AutonomousTaskLoop.ts`, `TaskLifecycleMachine.ts`, `FailureClassifier.ts`, `FeedbackBuilder.ts`, `RetryPolicy.ts`) ✅
  - Sub-Phase 3.10: Cost & Governance Dashboard (Owner / Director View — PRD 5.1, `GovernanceAggregator.ts`, `useGovernanceStore`, `GovernanceDashboardPage.vue`, Multi-Department Spend & Token Trajectory, Quality Gate Assertion Matrix, Self-Healing Recovery Rate Ledger) ✅
  - Sub-Phase 3.11: Dynamic Agent Memory Subsystem (`DatabaseClient.ts` v3 object store, `MemoryRepository.ts` semantic recall engine, `canManageOrganizationMemory` RBAC, `MemoryRecallFormatter.ts`, `ContextBuilder.ts` memory prompt injection, `useMemoryStore`, `agentRunStore` pre-run recall & post-run learning loop, Employee Memory Tab & Run Memory Injected Panel) ✅
- **Phase 4 (Business Logic & UI Refinement — Full Spec Implementation):** 100% Complete ✅
  - Sub-Phase 4.1: Domain Status Decoupling (Separation of `Task` lifecycle vs `AgentRun` execution lifecycle) ✅
  - Sub-Phase 4.2: Automated Schedules Subsystem (`Schedule` domain model, `ScheduleRepository`, `useScheduleStore`, `SchedulesPage.vue`, recurring task instance generator) ✅
  - Sub-Phase 4.3: Mandatory Project Folder Path & Pre-Flight Validation (`Project.path` mandatory enforcement, pre-flight folder connection verification modal) ✅
  - Sub-Phase 4.4: Active Work Command Center & Computed Read Model (`ActiveWorkItem` model, `useActiveWorkStore`, `ActiveWorkPage.vue`, live step visualizer, folder path badges) ✅
  - Sub-Phase 4.5: 4 Workers Spotlight on Home (Raka - Backend/Planner, Bima - Automation/Backend, Maya - Marketing/Frontend, Dimas - QA/Security answering 6 core questions in one screen) ✅
  - Sub-Phase 4.6: Owner Mid-Run Controls (Stop run resets to Backlog, Change Worker mid-run with cascading run cancellation and restart, Add Directive mid-run, Cancel Task with active run cascade, Cancel Project with task & schedule cascade) ✅
  - Sub-Phase 4.7: Safe Delete & Soft Deletion Lifecycle (`deletedAt`, `deletedBy`, `deleteReason` audit trail on Task, Project, Schedule, Run) ✅
  - Sub-Phase 4.8: Simple First UI Navigation (Main: Home, Active Work, Tasks, Projects, Workers, Calendar, Reports, Settings; Collapsible Advanced: Runs, Schedules, Files, Reviews, Governance, Registries) ✅
  - Sub-Phase 4.9: QA & Validation (217 Vitest tests pass across 32 suites, vue-tsc 0 errors, ESLint 0 errors, production build verified) ✅
- **Phase 4.1 (Audit Corrections & Simplification):** 100% Complete ✅
  - Strict 3-way permanent separation contract: Cancel (`status = 'Cancelled'`), Archive (`status = 'Archived'`, `archivedAt`), Delete (`deletedAt`) — Cancel and Archive never set `deletedAt` ✅
  - Normalized `TaskStatus` to `'Draft' | 'Todo' | 'In Progress' | 'Waiting' | 'Review' | 'Done' | 'Cancelled' | 'Archived'` ✅
  - Decoupled `ProjectStatus` (`Draft`, `Active`, `Paused`, `Completed`, `Cancelled`, `Archived`) and `ProjectHealth` (`Healthy`, `At Risk`, `Critical`) ✅
  - Standardized Stop Run to set Task to `Todo` (clearing `activeRunId`), enabling Run Again / Change Worker / Cancel Task ✅
  - Removed all hard-coded production path fallbacks (dynamic Task override -> Project path -> FAIL) ✅
  - Removed all hard-coded production worker fallbacks (Worker -> Template -> Project Default -> Error) ✅
  - Implemented Scheduler Idempotency via `executionKey` (`schedule:id:timestamp` guarantees 1 Task & 1 Run per occurrence) ✅
  - Implemented Duplicate Run Protection & Execution Lock (`task.activeRunId` mutex rejects double-clicks and concurrent executions) ✅
  - Implemented Hermes Crash Recovery System (`HermesRecoveryService`, orphan run detection, probe status, safe bounded recovery before retry) ✅
  - Implemented Run State Persistence & Heartbeat Monitoring (`runId`, `taskId`, `status`, `runtime`, `workspacePath`, `startedAt`, `lastHeartbeatAt`, `attempt`, `parentRunId` persisted to IndexedDB; stale heartbeat threshold detection) ✅
  - Implemented Workspace Lock Subsystem (`WorkspaceLockService`, `workspacePath -> activeRunId`, conflict policies `wait`, `stop_existing`, `allow_concurrent` preventing file collision) ✅
  - Implemented Immutable Cost Ledger (`CostEntry`, `MockCostLedgerRepository`, `costLedgerStore` decoupled from mutable run telemetry) ✅
  - Implemented Reinforced Audit Trail (`AuditLogEntry`, `MockAuditLogRepository`, immutable logging of all Owner operations, read-only UI) ✅
  - Implemented Service-Level RBAC Permission Enforcement (`AuthorizationService`, `assertPermission`, `Owner` vs `Worker` vs `Viewer`) ✅
  - Implemented Full Workspace Backup & Restore Subsystem (`BackupService`, `SatriaBackupBundle` multi-entity JSON serialization, schema validation, and database state restoration) ✅
  - Dynamic primary workers spotlight on Home based on `isPrimary` / `workerType` ✅
  - Trash & Storage management tab under Settings with Restore & Permanent Delete actions ✅

Archived blueprints & execution plans in `work-histori/` (see `work-histori/INDEX.md`):
- `work-histori/INDEX.md` — Master historical index & documentation registry
- `work-histori/00_PRD_MASTER_AGENTIC_AI_PLATFORM.md`
- `work-histori/00_SYSTEM_ANALYSIS_REPORT.md`
- `work-histori/01_PHASE0_PRD_PWA_Workspace_UIUX_v2.md`
- `work-histori/02_PHASE0_UIUX_BLUEPRINT.md`
- `work-histori/03_PHASE0_MASTER_EXECUTION_PLAN.md`
- `work-histori/04_PHASE1_MASTER_WORKFORCE_BLUEPRINT.md`
- `work-histori/05_PHASE1_EXECUTION_PLAN.md`
- `work-histori/06_PHASE2_PRD_TASK_ASSIGNMENT_AGENT_RUN.md`
- `work-histori/07_PHASE2_EXECUTION_PLAN.md`
- `work-histori/08_PHASE3_REAL_AGENT_RUNTIME_EXECUTION_PLAN.md`
- `work-histori/09_PHASE3_5_APPROVAL_GATE_EXECUTION_COMMANDS.md`
- `work-histori/10_PHASE3_5_HARDENING_FULL_COMMANDS.md`
- `work-histori/11_PHASE3_6_LIVE_TELEMETRY_COST_EXECUTION_COMMANDS.md`
- `work-histori/12_PHASE3_6_HERMES_RUNTIME_HARDENING_PLAN.md`
- `work-histori/13_PHASE3_6_REAL_HERMES_INTEGRATION_VALIDATION_PLAN.md`
- `work-histori/14_PHASE3_6_REAL_HERMES_INTEGRATION_VALIDATION_REPORT.md`
- `work-histori/15_PHASE3_6R_NATIVE_HERMES_API_ALIGNMENT_PLAN.md`
- `work-histori/16_PHASE3_6R_NATIVE_HERMES_API_ALIGNMENT_REPORT.md`
- `work-histori/17_PHASE3_7_RESULT_INGESTION_VERIFICATION_PLAN.md`
- `work-histori/18_PHASE3_7_EXECUTION_VERIFICATION_REVIEW_PIPELINE.md`
- `work-histori/19_PHASE3_7_RESULT_INGESTION_VERIFICATION_REPORT.md`
- `work-histori/20_PHASE3_8_UX_PRESENTATION_VERIFICATION_REPORT.md`
- `work-histori/21_PHASE3_9_AUTONOMOUS_TASK_LOOP_PLAN.md`
- `work-histori/22_PHASE3_9_AUTONOMOUS_TASK_LOOP_REPORT.md`
- `work-histori/23_PHASE3_11_AGENT_MEMORY_SUB_SYSTEM_REPORT.md`
- `work-histori/24_PHASE4_BUSINESS_LOGIC_UI_REFINEMENT_SPEC.md`
- `work-histori/25_PHASE4_1_AUDIT_CORRECTION_AND_SIMPLIFICATION_REPORT.md`
- `work-histori/26_FINAL_PRODUCTION_QUALITY_GATE_AND_FAILURE_REPORT.md`

---

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # vue-tsc typecheck + vite production build
npm run preview      # preview production build
npm run typecheck    # vue-tsc --noEmit (strict mode)
npm run lint         # ESLint flat config validation (src/ & e2e/)
npm run format       # Prettier code formatting
npm run test:unit    # Vitest unit & integration test run (231 tests across 34 suites)
npm run test:e2e     # Playwright E2E smoke test suite (3 test journeys)
```

**Required order:** `typecheck` → `lint` → `test:unit` → `build`

---

## Key Paths

### Entry & Shell
- `src/main.ts` — entry point, mounts Pinia + Router
- `src/App.vue` — root component, wraps pages in AppShell (excludes `/login`, `/onboarding`)
- `src/layouts/AppShell.vue` — main layout shell (Sidebar + Topbar + BottomNav + Command Palette + Toast + Offline Banner)
- `index.html` — HTML entry with Geist & JetBrains Mono font loading via Google Fonts CDN

### Agent Runtime & Autonomy Engine (`src/runtime/`)
- `src/runtime/types.ts` — Runtime contract interfaces (`AgentRuntimeAdapter`, `RuntimeEvent`, `AgentRunInput`, `AgentRuntimeResult`, `ApprovalRequest`)
- `src/runtime/RuntimeFactory.ts` — Runtime mode switcher (`'hermes'` vs `'mock'`)
- `src/runtime/hermes/HermesClient.ts` — Native Hermes API client (SSE parser, HTTP retry, health check)
- `src/runtime/hermes/HermesRuntimeAdapter.ts` — Production adapter bridging Satria to Hermes Agent
- `src/runtime/autonomy/AutonomousTaskLoop.ts` — Finite State Machine governing plan → execute → verify → review → retry loop
- `src/runtime/autonomy/FailureClassifier.ts` — Failure categorization (`TRANSIENT_ERROR`, `TEST_FAILURE`, `SECURITY_VIOLATION`, `UNRECOVERABLE`)
- `src/runtime/autonomy/RetryPolicy.ts` — Bounded retry governance (Max 3 attempts, exponential backoff, circuit breaker)
- `src/runtime/verification/VerificationEngine.ts` — Automated Quality Gate asserting unit tests, typecheck, build, criteria, and sandbox boundaries
- `src/runtime/telemetry/CostCalculator.ts` — Multi-model token cost & cache savings calculator
- `src/runtime/telemetry/modelPricing.ts` — Model pricing table (Claude 3.5 Sonnet, GPT-4o, Hermes 3 70B/8B, Haiku, GPT-4o-mini)
- `src/runtime/governance/GovernanceAggregator.ts` — Owner/Director financial, quality, retry, and security aggregation engine

### State Management
- `src/stores/activeWork.ts` — Computed active work read model & 4-worker spotlight
- `src/stores/schedule.ts` — Automated recurring schedules CRUD, toggle & task instance trigger
- `src/stores/workspace.ts` — workspace CRUD, currentWorkspaceId, workspace switching
- `src/stores/project.ts` — projects by workspace, mandatory folder path, cascading project cancellation
- `src/stores/task.ts` — tasks CRUD, type ('project' | 'one_time' | 'recurring_instance'), cancel task with active run cascade, safe soft delete
- `src/stores/agentRun.ts` — Agent execution lifecycle, live runner, owner mid-run controls (stop run, change worker mid-run, add directive mid-run), retry attempts
- `src/stores/review.ts` — Human review hub, approvals, quality gate checklist
- `src/stores/governance.ts` — Executive governance metrics, budget cap configuration, department/model filters
- `src/stores/department.ts` — Phase 1 departments & roles directory
- `src/stores/employee.ts` — Digital employee CRUD, skills & tools assignment, status archive
- `src/stores/skill.ts` — Internal & external reusable skill package registry
- `src/stores/workforceTool.ts` — Toolset configuration and permission level registry
- `src/stores/theme.ts` — dark/light mode toggle, persists to `localStorage('satria_theme')`

### Data Layer
- `src/types/index.ts` — all TypeScript interfaces (`Task`, `AgentRun`, `Schedule`, `ActiveWorkItem`, `Project`, `Employee`, `Department`, etc.)
- `src/database/DatabaseClient.ts` — IndexedDB transactional persistence engine (v4) with `/api/db/sync`
- `src/database/initialSeed.ts` — Seed dataset with 12 employees, 3 departments, 4 projects with folder paths, 3 schedules, and quality gate verifications

### Composables
- `src/composables/useHermesHealth.ts` — Persistent runtime gateway health & latency probe
- `src/composables/useToast.ts` — Global toast notification state (with `.success()`, `.error()`, `.warning()`, `.info()` shortcuts)
- `src/composables/useNetwork.ts` — Reactive `navigator.onLine` detection
- `src/composables/usePwaInstall.ts` — PWA install prompt handling

### UI Components (`src/components/ui/`)
- `UiButton.vue` — Primary, Secondary, Ghost, Danger variants; sm/md/lg sizes; loading/disabled states; icon slot
- `UiInput.vue` — label, placeholder, error, hint, disabled, icon support
- `UiBadge.vue` — success/warning/error/info/neutral variants; dot indicator; icon slot
- `UiCard.vue` — header/default slots; hoverable; padding variants
- `UiModal.vue` — backdrop blur overlay; header/footer slots; close handler
- `UiDrawer.vue` — right-slide panel with accessible `role="dialog"` & `aria-modal="true"`; title + close; scroll content
- `UiToast.vue` — fixed bottom-right; icon + message + description; 4 variants
- `UiProgress.vue` — percentage bar with label
- `UiSkeleton.vue` — animated loading placeholder (configurable width/height)
- `UiEmptyState.vue` — title + description + action slot
- `UiErrorState.vue` — error display with icon and retry slot

### Layout Components (`src/components/layout/`)
- `Sidebar.vue` — Simple First menu (Home, Active Work, Tasks, Projects, Workers, Calendar, Reports, Settings) + Collapsible Advanced Section
- `Topbar.vue` — persistent Hermes Gateway health indicator, breadcrumb, search trigger (Ctrl+K), notifications, user avatar
- `BottomNav.vue` — mobile navigation (Home, Active Work, Tasks, Projects, More drawer)
- `CommandPalette.vue` — Ctrl+K modal search overlay for pages, employees, tasks, projects, governance

### Pages (`src/pages/`)
- `work/ActiveWorkPage.vue` — Dedicated Active Work Command Center (Live step visualizer, folder path badges, owner mid-run actions)
- `overview/HomePage.vue` — Command Center Overview: 4 Workers Spotlight, Active Work Feed, Attention Required, Today Tasks
- `tasks/TasksPage.vue` — Unified Task Management with List/Board view, scheduled instance badges, create task drawer
- `tasks/TaskDetailPage.vue` — Comprehensive Task Detail with live execution runner, deliverables, attempt history, audit log, and owner controls
- `schedules/SchedulesPage.vue` — Automated Recurring Schedules with trigger time, toggle switch, Run Now instant trigger
- `projects/ProjectsPage.vue` & `ProjectDetailPage.vue` — Project Workspace with folder path validation and connection test
- `governance/GovernanceDashboardPage.vue` — Executive Cost & Governance Dashboard (PRD 5.1): 4 Pillar KPIs, Quality Gate Matrix, Token Trajectory Chart, Employee ROI Ledger, Model Economics, Run Audit Trail
- `runs/RunsPage.vue` — Agent Execution Center: Live runs, operational statuses, runtime telemetry, inspect action
- `runs/RunDetailPage.vue` — Real-time execution monitor, step visualizer, Human-in-the-Loop approval gate, log stream, verification evidence, artifact diff viewer
- `reviews/ReviewsPage.vue` — Verification & Quality Review Hub with interactive decision drawer
- `workforce/AssignmentsPage.vue` — Cross-employee workload distribution, capacity matrix, unassigned backlog dispatch queue (Manager View)
- `workforce/WorkforceOverviewPage.vue` — KPI cards (computed active status), department cards, roster spotlight
- `workforce/EmployeesPage.vue` — Employee directory, filter pills, search input, employee cards
- `workforce/CreateEmployeePage.vue` — 7-step guided wizard
- `workforce/EmployeeDetailPage.vue` — 6-tab profile with Work & Runs tabs
- `reports/ReportsPage.vue` — Workspace analytics with direct switcher to Cost & Governance Dashboard
- `settings/SettingsPage.vue` — Appearance, Notifications, AI Runtime configuration (Hermes Base URL, API Key, Model selector)

---

## Testing & Quality Guarantees

- **Test Suite**: 195 Vitest unit & integration tests passing across 30 test suites (including 12 §86 business logic scenarios).
- **E2E Smoke Tests**: Playwright Golden Path test suite (`e2e/goldenPath.spec.ts`) validating end-to-end task assignment, execution dispatch, approval intercept, and deliverable review.
- **Strict Typecheck**: `vue-tsc --noEmit` passing with 0 errors.
- **Linting & Code Quality**: ESLint v9 Flat Config (`npm run lint`) passing with 0 errors.
- **Code Formatter**: Prettier configured (`.prettierrc`, `.prettierignore`, `npm run format`).
- **Production Bundle**: Vite + Tailwind v4 + PWA compilation verified.
- **Accessibility**: Authoritative status badges, `role="progressbar"`, `role="log"`, `role="listbox"`, `role="dialog"`, `role="status"` / `role="alert"`, `aria-live` support, and `prefers-reduced-motion` compliance.

---

## Design System Rules

### Visual Direction
- **Personality:** Calm, Precise, Premium, Technical, Focused, Fast
- **Reference:** Linear-like clarity + Notion-like workspace + modern enterprise command center
- **Avoid:** Continuous flashing animation, heavy gradients, glassmorphism overuse, card spam

### Color Palette (Dark-First)
| Token | Hex | Usage |
|---|---|---|
| Surface Base | `#0e1511` | App background, `<body>` |
| Container Lowest | `#09100c` | Inset panels, code blocks |
| Container Low | `#161d19` | Cards, sidebar, elevated surfaces |
| Container Mid | `#1a211d` | Hover states, secondary surfaces |
| Container High | `#242c27` | Borders, dividers, active backgrounds |
| Container Highest | `#2f3632` | Subtle highlights |
| Primary (Emerald) | `#4edea3` | Primary actions, active states, brand accent |
| Primary Container | `#10b981` | Filled buttons, strong accents |
| Secondary (Cyan) | `#4cd7f6` | Secondary data highlights, info badges |
| Tertiary (Coral) | `#ffb3af` | Warning indicators, attention items |
| Error | `#ffb4ab` | Error states, destructive actions |
| Amber | `#f59e0b` | Offline indicator, caution states, approval required |
| On-Surface | `#dde4dd` | Primary text |
| On-Surface Variant | `#bbcabf` | Secondary text, descriptions |
| Muted | `#86948a` | Metadata, timestamps, labels |
| Outline | `#3c4a42` | Strong borders |
| Outline Variant | `#242c27` | Hairline borders (1px solid) |

### Typography
- **Sans:** Geist (loaded via Google Fonts CDN) — UI text, headings, body
- **Mono:** JetBrains Mono — metrics, IDs (`run-101-01`, `tsk-101`), file extensions, tokens, costs, logs

---

## Known Gaps & Future Work

- Offline font bundling for local air-gapped deployments