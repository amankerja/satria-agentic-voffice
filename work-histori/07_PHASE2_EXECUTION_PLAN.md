# SATRIA AI WORKFORCE
## PHASE 2 — MASTER EXECUTION PLAN
### Task, Assignment, Mock Agent Runner & Review Workflow

**Version:** 1.1 (Reviewed & Executed)  
**Date:** 14 August 2026  
**Base PRD:** `06_PHASE2_PRD_TASK_ASSIGNMENT_AGENT_RUN.md`  
**Depends On:** Phase 0 (Workspace Foundation ✅) + Phase 1 (Workforce Structure & Registry ✅)  
**Status:** 100% Complete & Verified ✅ (Phase 2 Stable)  
**Runtime Rule:** Mock Agent Runner only. Real AI / Hermes / LLM / Discord / Vector Memory are reserved for Phase 3+.

---

> ### 🎯 Phase 2 North Star
> *"Turn the workforce registry into a reliable work execution ledger — before connecting real intelligence."*  
> **Core Loop:** `Task → Assignment → Agent Run (Mock Runner) → Verification → Result → Review → Completion`

---

## 1. SUB-PHASE BREAKDOWN & SCOPE

| Sub-Phase | Module | Core Scope & Deliverables | Status |
|:---:|---|---|:---:|
| **2.1** | **Data Foundation & Types** | TypeScript interfaces (`Assignment`, `AgentRun`, `RunResult`, `Review`), Repositories, Stores, Seed Dataset (30+ tasks, 15+ assignments, 20+ runs, 10+ reviews) | **100% Complete ✅** |
| **2.2** | **Task Assignment & Skill Matcher** | Assignment state machine, Skill Matching & Eligibility calculation, Assignment Drawer UI, Task list/board assignment indicators | **100% Complete ✅** |
| **2.3** | **Mock Agent Runner Engine** | Reactive simulation engine (`MockAgentRunner`), step transitions (`Initializing` → `Working` → `Verifying` → `Completing`), retry/pause/cancel controls | **100% Complete ✅** |
| **2.4** | **Agent Run Monitor & Detail UI** | Dedicated `/runs` overview, `/runs/:id` interactive live execution monitor, real-time progress bar, timeline log stream, action buttons | **100% Complete ✅** |
| **2.5** | **Result, Verification & Review System** | Result artifacts viewer, verification status badge, `/reviews` page, Review Drawer (Approve / Request Changes / Reject) with feedback | **100% Complete ✅** |
| **2.6** | **Employee Profile Extension** | Add `Work` and `Runs` tabs to Employee Detail profile, real-time Work State pill (`Idle`, `Running`, `Waiting`, `Review`) | **100% Complete ✅** |
| **2.7** | **Dashboard, Activity & Command Palette** | Home KPI integration (Active Runs, Pending Reviews), execution events in Activity feed & Notifications, Ctrl+K quick actions | **100% Complete ✅** |
| **2.8** | **QA, Test Suites & Build Validation** | Unit tests for state machine & repositories, user journey tests for execution loop, strict `vue-tsc` typechecking, build verify (29/29 tests pass) | **100% Complete ✅** |

---

## 2. SUB-PHASE 2.1 — DATA FOUNDATION & TYPE SYSTEM

> **Goal:** Establish strict TypeScript data contracts and state stores for execution entities before building UI.

### 2.1.A — TypeScript Interfaces (`src/types/index.ts`)

```typescript
// ==========================================
// PHASE 2: TASK EXECUTION & RUN MODELS
// ==========================================

// Priority Scale
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' // P0 Critical, P1 High, P2 Medium, P3 Low

// Enhanced Task Status
export type TaskStatus =
  | 'draft'
  | 'backlog'
  | 'planned'
  | 'assigned'
  | 'ready'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'blocked'
  | 'failed'
  | 'cancelled'

export interface Task {
  id: string
  workspaceId: string
  projectId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  requiredSkillIds: string[]
  optionalSkillIds: string[]
  tags: string[]
  checklist: { item: string; completed: boolean }[]
  deadline?: string
  createdBy: string
  parentTaskId?: string
  dependencyTaskIds?: string[]
  createdAt: string
  updatedAt: string
}

// Assignment Lifecycle States
export type AssignmentStatus = 
  | 'Unassigned' 
  | 'Assigned' 
  | 'Accepted' 
  | 'Rejected' 
  | 'Queued' 
  | 'In Progress' 
  | 'Waiting' 
  | 'Completed' 
  | 'Failed' 
  | 'Cancelled'

export interface TaskAssignment {
  id: string                  // 'asg-101'
  taskId: string
  taskTitle: string           // denormalized
  employeeId: string
  employeeName: string        // denormalized
  employeeAvatar: string
  employeeRole: string
  assignedBy: string          // user / planner
  skillIds: string[]
  priority: TaskPriority
  status: AssignmentStatus
  instructions?: string
  acceptedAt?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// Agent Run Execution States
export type AgentRunStatus = 
  | 'Queued' 
  | 'Starting' 
  | 'Running' 
  | 'Waiting' 
  | 'Verifying' 
  | 'Completed' 
  | 'Failed' 
  | 'Cancelled'

export type RunStep = 
  | 'Initializing' 
  | 'Loading Task & Context' 
  | 'Preparing Workspace' 
  | 'Working' 
  | 'Verifying' 
  | 'Completing'

export interface RunLogEntry {
  id: string
  timestamp: string
  step: RunStep
  message: string
  level: 'info' | 'warn' | 'error' | 'success'
}

export interface AgentRun {
  id: string                  // 'run-1023-01'
  assignmentId: string
  taskId: string
  taskTitle: string
  employeeId: string
  employeeName: string
  employeeAvatar: string
  employeeRole: string
  status: AgentRunStatus
  attempt: number             // 1, 2, 3 (max 3)
  currentStep: RunStep
  progress: number            // 0 - 100
  logs: RunLogEntry[]
  startedAt: string
  completedAt?: string
  durationSeconds?: number
  outputSummary?: string
  error?: string
  createdAt: string
  updatedAt: string
}

// Run Result & Verification
export type VerificationStatus = 'Passed' | 'Failed' | 'Warning' | 'Pending'

export interface RunResult {
  id: string                  // 'res-101'
  runId: string
  taskId: string
  assignmentId: string
  summary: string
  output: string
  status: 'success' | 'failure' | 'partial'
  artifactIds: string[]
  verificationStatus: VerificationStatus
  verificationNotes?: string
  createdAt: string
  updatedAt: string
}

// Review & Approval Workflow
export type ReviewDecision = 'Approved' | 'Changes Requested' | 'Rejected' | 'Pending'

export interface TaskReview {
  id: string                  // 'rev-101'
  runId: string
  taskId: string
  taskTitle: string
  assignmentId: string
  employeeId: string
  employeeName: string
  reviewer: string
  status: ReviewDecision
  comment?: string
  checklist: { item: string; completed: boolean }[]
  decisionAt?: string
  createdAt: string
  updatedAt: string
}

// Employee Work State (separated from Employment Status)
export type EmployeeWorkState = 'Idle' | 'Assigned' | 'Running' | 'Waiting' | 'Review'

// Skill Match Eligibility Calculation Result
export interface SkillMatchResult {
  requiredMatchPercentage: number
  optionalMatchPercentage: number
  matchedRequiredSkills: string[]
  missingRequiredSkills: string[]
  matchedOptionalSkills: string[]
  missingOptionalSkills: string[]
  isEligible: boolean
  warning?: string
}
```

### 2.1.B — Mock Seed Dataset (`src/mocks/mockData.ts`)

Seed minimum records:
- **Tasks:** 30+ tasks spanning Coding, Trainer, and Side Hustle projects.
- **Assignments:** 15+ assignments with various statuses (`Assigned`, `In Progress`, `Completed`, `Waiting`).
- **Agent Runs:** 20+ runs with simulated progress, step logs, and duration metrics.
- **Run Results:** 10+ results with verification notes and mock generated outputs.
- **Reviews:** 10+ reviews (Pending, Approved, Changes Requested).

### 2.1.C — Repositories (`src/repositories/index.ts`)

Create and export:
- `MockAssignmentRepository`
- `MockAgentRunRepository`
- `MockRunResultRepository`
- `MockReviewRepository`

### 2.1.D — Pinia State Stores (`src/stores/`)

- `src/stores/assignment.ts` — assignment CRUD, active assignments, eligibility checker
- `src/stores/agentRun.ts` — runs registry, active running runner list, retry/pause/cancel actions
- `src/stores/review.ts` — pending reviews, review approvals, feedback submission

---

## 3. SUB-PHASE 2.2 — TASK ASSIGNMENT & SKILL MATCHING ENGINE

> **Goal:** Allow users to assign tasks to digital employees with automatic skill matching & eligibility validation.

### 2.2.A — Skill Eligibility Calculator

Create a reactive composable or store utility `calculateSkillMatch(employeeId, requiredSkillIds)`:
1. Fetch employee's assigned skills.
2. Compare **required** and **optional** skills separately.
3. Compute:
   - `requiredMatchPercentage = matchedRequired / totalRequired * 100` (or 100% when no required skills).
   - `optionalMatchPercentage = matchedOptional / totalOptional * 100` (or 100% when no optional skills).
4. Flag eligibility:
   - All required skills matched + Active employee: 🟢 **Ready / Fully Eligible**
   - Any required skill missing: 🔴 **Ineligible / Required Skill Mismatch**
   - Optional skills missing while all required skills match: 🟡 **Ready with Optional Skill Warnings**
5. Show missing required skills separately from missing optional skills.

### 2.2.B — Assignment Drawer Component (`src/components/workforce/AssignmentDrawer.vue`)

- **Employee Selector:** Dropdown showing avatar, role, department, and current work state (`Idle`, `Running`).
- **Required/Optional Skills Tags:** Separate required and optional skill pills with visual match badges (✅ Matched / ⚠️ Missing / 🔴 Required Missing).
- **Eligibility Indicator Box:** Live calculation card showing Required Match %, Optional Match %, Role fit, and warnings.
- **Custom Instructions Box:** Multi-line text for context or run constraints.
- **Priority Selector:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low).
- **Actions:** `Cancel` and `Confirm Assignment` (triggers toast & updates task status).

---

## 4. SUB-PHASE 2.3 — MOCK AGENT RUNNER SIMULATION ENGINE

> **Goal:** Build a robust, reactive state machine that simulates realistic agent execution without calling external LLM APIs.

### 2.3.A — Runner Architecture (`src/services/mockAgentRunner.ts`)

```typescript
export interface RunnerOptions {
  runId: string
  tickIntervalMs?: number // default 800ms
  autoComplete?: boolean   // default true
  simulateFailure?: boolean
}

export class MockAgentRunner {
  private timer: any = null
  private progress: number = 0
  private status: AgentRunStatus = 'Queued'
  private currentStep: RunStep = 'Initializing'

  start(runId: string, onUpdate: (run: Partial<AgentRun>) => void): void
  pause(runId: string): void
  resume(runId: string): void
  cancel(runId: string): void
  retry(runId: string): void
}
```

### 2.3.A.1 — Run Preconditions & Idempotency

Before `start(runId)`:
- Assignment status must be `Queued` or `Accepted`.
- Task must be `assigned`, `ready`, or `in_progress`.
- The same assignment cannot have more than one active run.
- Starting an already active run must be idempotent (no duplicate timer/event stream).

On terminal states (`Completed`, `Failed`, `Cancelled`):
- The runner must stop all timers.
- No further progress events may be emitted.
- A retry creates a new run attempt or resets the same run according to the chosen repository contract; **do not mix both strategies**.

### 2.3.B — Step & Progress Choreography

Simulate step execution:
1. `Initializing` (0% &rarr; 15%): Setting up context and workspace environment.
2. `Loading Task & Context` (15% &rarr; 35%): Reading requirements, files, and skill instructions.
3. `Working` (35% &rarr; 75%): Synthesizing code/content, producing draft output.
4. `Verifying` (75% &rarr; 90%): Running QA lint/checks, verifying against acceptance criteria.
5. `Completing` (90% &rarr; 100%): Packaging run result, creating review request.

### 2.3.C — State Actions & Error Simulation

- **Max Retries:** 3 attempts.
- **Retry Action:** Increments `attempt` counter, resets progress to 0%, logs retry reason, restarts runner.
- **Cancel Action:** Sets status to `Cancelled`, stops timer, adds cancellation log.
- **Pause/Resume Action:** Pauses progress ticks, stores the prior step, updates status to `Waiting`, and resumes from the same state. `Waiting` is not the same as failure.

---

## 5. SUB-PHASE 2.4 — AGENT RUN MONITOR & DETAIL UI

> **Goal:** Provide dedicated UI pages to monitor live and historical agent runs.

### 2.4.A — Runs Overview Page (`src/pages/runs/RunsPage.vue` & route `/runs`)

- **Header:** *"Agent Execution Center"* + Active Runs KPI Counter Badge.
- **Filter Tabs:** All | Running (🟢) | Waiting (🟡) | Completed (✅) | Failed (🔴) | Cancelled.
- **Search Bar:** Search by task title, run ID, or employee name.
- **Run Cards Grid / Table:**
  - Run ID (`#run-1023-01`), Attempt pill, Task title, Employee chip (avatar + role).
  - Animated progress bar with percentage.
  - Current step badge.
  - Duration counter (`durationSeconds`).
  - Action button: `Inspect Run →`.

### 2.4.B — Live Run Detail Page (`src/pages/runs/RunDetailPage.vue` & route `/runs/:id`)

- **Header:** Run ID, Task Title, Status Pill, Attempt badge, Created timestamp.
- **Top Control Bar:**
  - `Pause` / `Resume` button.
  - `Cancel Run` button (with modal confirmation).
  - `Retry Run` button (enabled if status is `Failed` or `Cancelled`).
- **Live Progress Stage:** Large progress bar with smooth transition, active step highlighter.
- **Execution Log Stream (Timeline):** Monospace terminal-like stream with timestamps, step tags, and status icons.
- **Result Preview Card:** Displays generated output once execution reaches `Completed`.
- **Handoff to Review Action:** Direct button to open Review drawer when run finishes.

---

## 6. SUB-PHASE 2.5 — RESULT, VERIFICATION & REVIEW SYSTEM

> **Goal:** Close the loop with result verification, human-in-the-loop review, and task completion.

### 2.5.A — Review Hub Page (`src/pages/reviews/ReviewsPage.vue` & route `/reviews`)

- **Summary Cards:** Pending Reviews, Approved Today, Changes Requested.
- **Review List:**
  - Task title, Run ID, Employee name, Verification badge (`Passed` / `Warning` / `Failed`).
  - Quick action: `Review Work →`.

### 2.5.B — Review Drawer / Modal (`src/components/workforce/ReviewDrawer.vue`)

- **Output Summary:** Markdown render of the generated result.
- **Verification Checklist:** Automated acceptance checklist items.
- **Review Feedback Box:** Text area for comments or adjustment requests.
- **Decision Buttons:**
  - 🟢 **Approve:** Marks review as `Approved`, updates Task status to `Completed`, creates completion activity.
  - 🟡 **Request Changes:** Marks review as `Changes Requested`, creates a follow-up task/assignment or reopens the current assignment according to policy. **Do not auto-retry silently.** A new run requires an explicit user/system action.
  - 🔴 **Reject:** Marks review as `Rejected`. Task moves to `blocked` or `cancelled` only according to an explicit review policy; do not auto-cancel by default.

---

### 2.5.C — Review Policy & State Transition Rules

Use explicit transitions:

```text
Run Completed
  ↓
Result Pending Review
  ↓
Review
  ├── Approved → Task Completed
  ├── Changes Requested → Task In Progress / Assigned
  └── Rejected → Task Blocked or Cancelled (policy-driven)
```

Rules:
- Approval is the only default path to `Completed`.
- `Changes Requested` does not automatically spawn an unlimited retry loop.
- Each follow-up run must have a visible parent run / attempt relationship.
- Rejection requires an explicit reason.
- All review decisions create an activity/audit event.


## 7. SUB-PHASE 2.6 — EMPLOYEE PROFILE EXTENSION & WORK STATE

> **Goal:** Link execution state back to the workforce digital personnel profiles.

### 2.6.A — Extended Employee Detail Tabs (`src/pages/workforce/EmployeeDetailPage.vue`)

Update tabs to 8 tabs:
1. `Overview`
2. `Responsibilities`
3. `Skills`
4. `Tools`
5. `Work` *(New in Phase 2)* — Shows current active assignment, pending tasks, and task queue.
6. `Runs` *(New in Phase 2)* — Historical log of agent runs executed by this employee with success rate %.
7. `Activity`
8. `Settings`

### 2.6.B — Real-time Work State Badge

Separate **Employment Status** from **Work State**:
- `Active` & `Idle` &rarr; ⚪ Ready for Work
- `Active` & `Running` &rarr; 🟢 Currently Executing Run #...
- `Active` & `Waiting` &rarr; 🟡 Awaiting Input / Paused
- `Active` & `Review` &rarr; 🔵 Result Under Review

---

## 8. SUB-PHASE 2.7 — DASHBOARD, ACTIVITY & COMMAND PALETTE

> **Goal:** Ensure all Phase 2 execution events surface across the entire workspace.

### 2.7.A — Workspace Overview KPI Updates (`src/pages/overview/HomePage.vue`)

Add Phase 2 operational metrics:
- **Active Runs:** Currently executing agent runners.
- **Pending Reviews:** Finished runs waiting for approval.
- **Completed Today:** Tasks closed via approved runs.
- **Run Success Rate:** % of runs completed without fatal failure.

### 2.7.B — Global Activity Feed & Notifications

Trigger automatic events for:
- `task.assigned` &rarr; Notification: *"Maya assigned to Task: UI Shell Refactor"*
- `run.started` &rarr; Activity: *"Run #1023-01 started by Maya"*
- `run.completed` &rarr; Notification: *"Run #1023-01 completed. Review required."*
- `review.approved` &rarr; Activity: *"Task completed after review approval."*

### 2.7.C — Command Palette (Ctrl+K) Integration

Index new Phase 2 commands:
- *"Show Active Runs"*
- *"Show Pending Reviews"*
- *"Assign Task..."*
- *"Inspect Run..."*

---

## 9. SUB-PHASE 2.8 — QA, VALIDATION & TESTING CONTRACT

> **Goal:** Validate type-safety, reactive state transitions, and responsive UI polish.

### 2.8.A — Unit & Integration Test Suites (`src/test/`)

Add `src/test/executionJourney.spec.ts` & `src/test/mockRunner.spec.ts`:
1. **Skill Matching Test:** Verifies 100% vs 50% match calculation.
2. **Assignment Lifecycle Test:** Unassigned &rarr; Assigned &rarr; In Progress &rarr; Completed.
3. **Mock Agent Runner Test:** Verifies step progression, progress increments, and retry count limit (max 3).
4. **Review & Approval Test:** Verifies approving a review transitions the task to `completed`.
5. **Employee Work State Test:** Verifies employee state updates to `Running` during active run and reverts to `Idle` upon completion.
6. **Run Idempotency Test:** Starting an already-active run does not create duplicate timers or duplicate progress events.
7. **Review Transition Test:** Approve / Changes Requested / Reject follow the explicit review policy without hidden auto-actions.
8. **Dependency Test:** Blocked tasks cannot become Ready until dependencies are completed.

### 2.8.B — QA Commands & Thresholds

```bash
# 1. Strict TypeScript check
npm run typecheck   # Must return 0 errors

# 2. Complete unit & journey tests
npm run test:unit    # All unit/integration suites must pass
npm run test:e2e      # Core Task → Assignment → Run → Review journey must pass

# 3. Production PWA build verification
npm run build       # Zero build errors, PWA service worker precache verified
```

---

## 10. PHASE 2 FREEZE / BASELINE GATE

Before declaring Phase 2 complete:

### Functional
- Core loop passes end-to-end:
  `Task → Assignment → Mock Run → Verification → Result → Review → Completion`
- Retry, pause/resume, cancel, and review state transitions are deterministic.
- No duplicate active run for one assignment.

### Data Integrity
- No hard-coded execution state inside page components.
- Repository/store remains the source of truth.
- Task, assignment, run, result, review relations remain consistent after refresh/navigation.

### UX
- User can always see:
  `Task → Employee → Run → Status → Result → Review`.
- No dead ends.
- No hidden automatic retry/cancel behavior.

### Verification
- `vue-tsc` = 0 errors.
- Unit/integration tests = 100% pass.
- E2E core journey = pass.
- Production build = pass.
- No critical console errors.

### Handoff
- Git tag: `phase-2-stable`.
- Mock runtime interface frozen for Phase 3.
- Phase 3 must replace the runner behind the interface, not rewrite the task/run UI.

## 10. STRICT PHASE 2 BOUNDARIES & NON-GOALS

The following items are strictly **OUT OF SCOPE for Phase 2** and must **NOT** be implemented:
- ❌ External LLM API calls (OpenAI, Claude, Gemini, Ollama).
- ❌ Hermes Agent Runtime integration.
- ❌ Discord bot / webhook execution.
- ❌ Real terminal / shell command execution on host machine.
- ❌ Persistent vector database / graph memory retrieval.
- ❌ Real external payment/transaction automation.

---

## 11. DEFINITION OF DONE (DOD) — PHASE 2

Phase 2 is considered complete when:
- [x] Data models and stores for Task, Assignment, AgentRun, RunResult, and Review are fully operational. ✅
- [x] Users can assign employees to tasks with automated skill matching eligibility feedback. ✅
- [x] Users can trigger, observe, pause, resume, cancel, and retry simulated agent runs via `MockAgentRunner`. ✅
- [x] Dedicated `/runs` and `/runs/:id` execution monitor pages display real-time progress and logs. ✅
- [x] Dedicated `/reviews` page and Review Drawer allow approving, rejecting, or requesting changes on run results. ✅
- [x] Employee profile features `Work` and `Runs` tabs with real-time work state indicators. ✅
- [x] Dashboard, Activity Center, and Command Palette reflect execution metrics. ✅
- [x] `npm run typecheck` returns 0 errors. ✅
- [x] All Vitest unit and integration test suites pass 100% (29 tests across 4 suites). ✅
- [x] `npm run build` passes with full PWA precache generation. ✅
- [x] Phase 2 is tagged/frozen as `phase-2-stable`. ✅

