# SATRIA AI WORKFORCE
## PHASE 2 — TASK, ASSIGNMENT & AGENT RUN FOUNDATION
### From Workforce Registry → Executable Work Units

**Version:** 1.0 (Executed & Verified)  
**Date:** 14 August 2026  
**Status:** 100% Complete & Verified ✅ (Phase 2 Stable)  
**Depends On:** Phase 0 Workspace + Phase 1 Workforce Registry  
**Runtime:** Reactive Mock Agent Runner (`MockAgentRunner.ts`) Operational  
**Hermes:** Reserved for later integration (Phase 3+)  
**Discord:** Reserved for later integration (Phase 3+)

---

# 1. PURPOSE

Phase 0 membangun Workspace / Office.  
Phase 1 membangun Workforce / Employees.  
Phase 2 membangun jembatan:

```text
Task → Assignment → Agent Run → Result
```

Phase 2 membuat SATRIA mampu mengetahui pekerjaan apa, siapa yang ditugaskan, project mana, skill apa yang diperlukan, status execution, progress, result, review, dan activity.

**Phase 2 belum menjalankan AI nyata.**

Tidak ada:
- Hermes execution
- LLM calls
- Discord command
- autonomous execution
- real tool execution
- persistent agent memory

Semua execution menggunakan **Mock Agent Runner** untuk membuktikan workflow dan UI.

---

# 2. ARCHITECTURAL BASIS

Master Workforce Blueprint menetapkan handoff:

```text
Employee
   ↓
Task
   ↓
Assignment
   ↓
Agent Run
   ↓
Runtime
   ↓
Model
```

Hermes, model provider, 9Router, Discord, memory, tool execution, agent runtime, dan multi-agent orchestration ditempatkan setelah layer ini. fileciteturn2file0L1531-L1558

Prinsip tetap:

> Role First, Runtime Later.

Employee tidak boleh terikat permanen pada Hermes/model/provider. fileciteturn2file0L61-L81

---

# 3. PHASE 2 GOAL

User harus dapat:

```text
Create Task
 ↓
Select Project
 ↓
Assign Employee
 ↓
Select Required Skills
 ↓
Set Priority / Deadline
 ↓
Create Assignment
 ↓
Start Run
 ↓
Observe Run Status
 ↓
Mock Execution
 ↓
Verification
 ↓
Result
 ↓
Task Completed
 ↓
Activity Updated
```

---

# 4. NON-GOALS

Belum dibangun:

- real LLM execution
- Hermes integration
- Discord integration
- model router
- real browser/terminal execution
- real memory retrieval
- graph memory
- autonomous scheduler
- multi-agent runtime
- external API execution
- transaction automation

---

# 5. CORE CONCEPTS

## Task
Pekerjaan yang harus diselesaikan.

## Assignment
Keputusan bahwa task diberikan kepada employee tertentu.

```text
Task + Employee + Required Skills + Priority + Deadline
= Assignment
```

## Agent Run
Satu execution attempt untuk menjalankan assignment.

```text
Assignment #1023
   ├── Run #1023-01
   └── Run #1023-02  (jika retry)
```

## Result
Output dari satu run:

- summary
- output
- artifacts
- verification
- errors
- duration

---

# 6. DATA HIERARCHY

```text
Workspace
   ↓
Project
   ↓
Task
   ↓
Assignment
   ↓
Agent Run
   ↓
Result
```

Workforce relation:

```text
Employee
   ↓
Assignment
   ↓
Agent Run
```

Skill relation:

```text
Skill
   ↓
Assignment
   ↓
Agent Run
```

---

# 7. TASK LIFECYCLE

```text
Draft
 ↓
Backlog
 ↓
Planned
 ↓
Assigned
 ↓
Ready
 ↓
Running
 ↓
Review
 ↓
Completed
```

Exceptions:

```text
Running → Blocked → Ready
Running → Failed → Retry → Running
Backlog/Planned/Running → Cancelled
```

---

# 8. ASSIGNMENT STATES

```text
Unassigned
Assigned
Accepted
Rejected
Queued
In Progress
Waiting
Completed
Failed
Cancelled
```

Phase 2 menggunakan mock assignment/acceptance flow.

---

# 9. AGENT RUN STATES

```text
Queued
Starting
Running
Waiting
Verifying
Completed
Failed
Cancelled
```

Future runtime states seperti Thinking, Tool Calling, Awaiting Approval belum diwajibkan.

---

# 10. DATA MODELS

## Task

```text
id
workspace_id
project_id
title
description
status
priority
assignee_id
skill_ids[]
tags[]
checklist[]
deadline
created_by
created_at
updated_at
```

Optional:

```text
parent_task_id
milestone_id
estimated_duration
```

## Assignment

```text
id
task_id
employee_id
assigned_by
skill_ids[]
priority
status
instructions
accepted_at
started_at
completed_at
created_at
updated_at
```

## AgentRun

```text
id
assignment_id
task_id
employee_id
status
attempt
current_step
progress
started_at
completed_at
duration
output_summary
error
created_at
updated_at
```

Future-only fields:

```text
runtime
model
provider
input_tokens
output_tokens
cost
tool_calls
memory_refs
```

## RunResult

```text
id
run_id
summary
output
status
artifact_ids[]
verification_status
created_at
updated_at
```

---

# 11. SUBTASK & DEPENDENCY

Parent task dapat memiliki subtask:

```text
Parent Task
 ├── Subtask A
 ├── Subtask B
 └── Subtask C
```

Fields:

```text
parent_task_id
sequence
dependency_ids[]
```

Dependency:

```text
Task A → Task B → Task C
```

Task B tidak boleh Ready sebelum A selesai.

---

# 12. PRIORITY

```text
P0 Critical
P1 High
P2 Medium
P3 Low
```

Mengikuti visual/status system Phase 0 dan Phase 1.

---

# 13. ASSIGNMENT VALIDATION

Sebelum assignment, SATRIA memeriksa:

1. Employee Active?
2. Employee sesuai workspace/project context?
3. Required skills tersedia?
4. Employee memiliki skill?
5. Permission sesuai?
6. Task belum selesai?
7. Tidak ada duplicate/conflicting assignment?

Jika gagal:

```text
Assignment blocked
+ reason
```

---

# 14. SKILL MATCHING

Contoh:

```text
Task: Build Laravel API

Required:
Laravel
PHP
REST API
Testing

Employee: Backend API

Laravel      ✅
PHP          ✅
REST API     ✅
Testing      ✅

Skill Match: 100%
Eligible: YES
```

Jika match 75%, tampilkan warning. Automated recommendation bukan requirement Phase 2.

---

# 15. ELIGIBILITY

UI dapat menampilkan:

```text
Skill Match
Role Match
Department Match
Availability

Eligibility:
READY
```

Ini merupakan decision-support; belum autonomous assignment.

---

# 16. TASK ASSIGNMENT FLOW

```text
Create Task
 ↓
Select Project
 ↓
Select Employee
 ↓
Eligibility Check
 ↓
Confirm Skills
 ↓
Set Instructions
 ↓
Review
 ↓
Create Assignment
```

---

# 17. START RUN FLOW

```text
Assignment Ready
 ↓
Start Run
 ↓
Create AgentRun
 ↓
Queued
 ↓
Mock Runner
 ↓
Progress
 ↓
Verification
 ↓
Result
```

---

# 18. MOCK AGENT RUNNER

Gunakan:

```text
MockAgentRunner
```

Simulasi:

```text
0% → 10% → 25% → 50% → 75% → 90% → 100%
```

Steps:

```text
Initializing
Loading task
Preparing context
Working
Verifying
Completing
```

Tujuan:

- menguji realtime UI
- state machine
- activity
- result
- retry/cancel

---

# 19. RUN TIMELINE

Contoh:

```text
10:31 Assignment accepted
10:32 Run started
10:33 Preparing task context
10:36 Working
10:39 Verification started
10:40 Verification passed
10:41 Run completed
```

Jangan menampilkan chain-of-thought.

---

# 20. RETRY / CANCEL / PAUSE

Failure:

```text
Run #01 FAILED
 ↓
Retry
 ↓
Run #02 RUNNING
```

Default:

```text
max_retries = 3
```

Actions per state:

```text
Queued → Start / Cancel
Running → Pause / Cancel
Failed → Retry
Completed → Review
```

Pause/resume dapat disediakan bila didukung Mock Runner.

---

# 21. VERIFICATION & REVIEW

Flow:

```text
Execution
 ↓
Verification
 ↓
Result
 ↓
Review
 ↓
Approve / Request Changes / Reject
```

Verification status:

```text
Passed
Failed
Warning
```

Review fields:

```text
reviewer
status
comment
checklist
decision
```

---

# 22. ACTIVITY & NOTIFICATION

Execution events:

```text
task.created
task.assigned
assignment.created
run.started
run.progressed
run.failed
run.completed
result.created
review.requested
review.completed
task.completed
```

Notifications:

```text
Task assigned
Assignment accepted
Run started
Run completed
Run failed
Review requested
Task completed
```

Gunakan Activity/Notification infrastructure yang sudah ada dari Phase 0.

---

# 23. DASHBOARD INTEGRATION

Tambahkan secara non-destructive:

```text
Active Tasks
Running Runs
Pending Reviews
Completed Today
Failed Runs
```

KPI Phase 0 tetap dipertahankan.

---

# 24. WORKFORCE INTEGRATION

Employee profile mulai menampilkan:

```text
Assigned Tasks
Current Assignment
Recent Runs
Completed Work
```

Pisahkan:

```text
Employment Status
Active / Inactive / Draft / Archived
```

dari:

```text
Work State
Idle / Assigned / Running / Waiting / Review
```

---

# 25. EMPLOYEE PROFILE EXTENSION

Tab baru:

```text
Overview
Responsibilities
Skills
Tools
Projects
Work
Runs
Activity
Settings
```

Belum menampilkan:

- LLM
- Model
- Memory
- Runtime internals
- Agent trace

---

# 26. TASK UI — PHASE 2

Task page:

```text
List
Board
Calendar
Runs
```

Task detail menampilkan:

```text
Assignment
Current Employee
Required Skills
Eligibility
Run History
Latest Result
Review
```

---

# 27. ASSIGNMENT DRAWER

```text
Employee
[ Backend API ▼ ]

Required Skills
✓ Laravel
✓ PHP
✓ REST API
✓ Testing

Eligibility
100% Ready

Instructions
[____________________]

[Assign]
```

---

# 28. RUN DETAIL

Route:

```text
/runs/:id
```

Sections:

```text
Run Header
Status
Progress
Assignment
Timeline
Verification
Result
Activity
```

Mock:

```text
RUN #1023-01
Fix authentication API
Raka · Backend API
🟢 Running

██████████████░░ 82%

Current step:
Running verification
```

---

# 29. REPOSITORIES

Tambahkan:

```text
TaskRepository
AssignmentRepository
AgentRunRepository
RunResultRepository
ReviewRepository
```

Mock implementations:

```text
MockTaskRepository
MockAssignmentRepository
MockAgentRunRepository
MockRunResultRepository
MockReviewRepository
```

---

# 30. STORES

Tambahkan modular store:

```text
useTaskExecutionStore
useAssignmentStore
useAgentRunStore
useReviewStore
```

Jika existing task store sudah menangani task domain, execution state dapat dipisahkan agar boundary tetap bersih.

---

# 31. SERVICES / API CONTRACT

Frontend bekerja terhadap abstraction:

```text
TaskService
AssignmentService
RunService
ReviewService
```

Phase 2:

```text
MockTaskService
MockAssignmentService
MockRunService
MockReviewService
```

Future:

```text
ApiTaskService
ApiAssignmentService
ApiRunService
ApiReviewService
```

---

# 32. ROUTES

Minimal:

```text
/tasks
/tasks/:id

/runs
/runs/:id

/reviews
/reviews/:id

/workforce/employees/:id/work
/workforce/employees/:id/runs
```

---

# 33. COMMAND PALETTE

Ctrl+K dapat mengenali:

```text
Create Task
Assign Task
Start Run
Show Running Runs
Show Failed Runs
Show Reviews
Open Employee Work
Open Run
```

Execution tetap mock.

---

# 34. QUICK CREATE

Existing:

```text
New Task
New Project
New Workspace
Upload File
```

Tambahkan:

```text
New Assignment
```

Run dibuat dari Assignment, bukan langsung dari Quick Create.

---

# 35. SCHEDULER PREPARATION

Phase 2 tidak mengaktifkan production scheduler.

Task contract boleh disiapkan:

```text
schedule
scheduled_at
recurrence
timezone
```

Future:

```text
Schedule
 ↓
Trigger
 ↓
Task
 ↓
Assignment
 ↓
Run
```

---

# 36. EVENT CONTRACT PREPARATION

Gunakan generic event:

```text
event
event_type
entity_type
entity_id
payload
created_at
```

Contoh:

```text
task.completed
assignment.created
run.failed
review.approved
```

Future orchestrator dapat menjadi event consumer.

---

# 37. PERMISSIONS & AUDIT

Roles:

```text
Owner
Admin
Operator
Viewer
```

Audit actions:

```text
created task
assigned employee
started run
paused run
cancelled run
retried run
approved result
rejected result
completed task
```

Audit fields:

```text
actor
action
entity
entity_id
timestamp
metadata
```

---

# 38. USAGE PLACEHOLDER

Sediakan UI placeholder:

```text
Duration
Tokens
Cost
```

Phase 2 tidak mengklaim angka AI nyata.

Field AI usage siap dipakai Phase 3.

---

# 39. MOCK DATA

Minimum seed:

```text
Tasks: 30+
Assignments: 15+
Runs: 20+
Reviews: 10+
```

Pastikan state mencakup:

- queued
- running
- waiting
- completed
- failed
- cancelled

---

# 40. TEST PLAN

## Unit
- repository
- state transition
- skill validation
- eligibility
- dependencies
- retry rules

## Integration
```text
Create Task
→ Assign Employee
→ Start Run
→ Progress
→ Complete
→ Result
→ Activity
```

## E2E

### A
Task → Assignment → Run → Completion

### B
Run → Failure → Retry → Success

### C
Task → Review → Approval → Complete

Target:

```text
Typecheck: 0 errors
Unit: 100% pass
Integration: 100% pass
E2E: 100% pass
```

---

# 41. UX REQUIREMENTS

User harus selalu tahu:

1. Task apa?
2. Siapa yang ditugaskan?
3. Statusnya apa?
4. Sedang berjalan atau tidak?
5. Run keberapa?
6. Hasilnya apa?
7. Perlu review atau tidak?

---

# 42. DESIGN RULE

Phase 2 wajib mewarisi design system Phase 0/1.

Tidak membuat design language baru.

Gunakan token, typography, surface, border, badge, modal, drawer, spacing, responsive rules yang sudah locked.

---

# 43. RUN STATUS VISUAL

Suggested:

```text
Queued      Neutral
Starting    Cyan
Running     Emerald
Waiting     Amber
Verifying   Cyan
Completed   Green
Failed      Red
Cancelled   Slate
```

Selalu gunakan icon + text + color.

---

# 44. PHASE 2 SUB-PHASES

## 2.1 Data Foundation
Types, repositories, stores, mock dataset.

## 2.2 Task Assignment
Assignment, skill validation, eligibility, UI.

## 2.3 Agent Run
Run model, state machine, mock runner, progress, retry/cancel.

## 2.4 Result & Review
Result, verification, review, approval.

## 2.5 Activity & Notifications
Events, notifications, audit.

## 2.6 Workspace Integration
Dashboard, employee profile, task, project, activity.

## 2.7 Command Center
Ctrl+K, quick actions.

## 2.8 QA
Tests, responsive, accessibility, performance.

---

# 45. DETAILED EXECUTION ORDER

```text
2.1 Types + Mock Data
        ↓
2.2 Task Assignment
        ↓
2.3 Run State Machine
        ↓
2.4 Mock Agent Runner
        ↓
2.5 Result + Review
        ↓
2.6 Activity + Notifications
        ↓
2.7 Dashboard Integration
        ↓
2.8 Employee Integration
        ↓
2.9 Ctrl+K / Quick Actions
        ↓
2.10 Tests + QA
```

---

# 46. ACCEPTANCE CRITERIA

## Task
- [ ] create/edit/archive task
- [ ] project relation
- [ ] required skills
- [ ] dependencies

## Assignment
- [ ] assign employee
- [ ] skill match
- [ ] assignment status
- [ ] cancel assignment

## Run
- [ ] create run from assignment
- [ ] lifecycle works
- [ ] mock progress
- [ ] cancel
- [ ] retry
- [ ] timeline

## Result
- [ ] result generated
- [ ] verification
- [ ] review
- [ ] task completion

## Integration
- [ ] dashboard reads execution state
- [ ] employee profile shows work
- [ ] activity records events
- [ ] notifications record events
- [ ] Ctrl+K recognizes Phase 2 entities

## Quality
- [ ] typecheck
- [ ] unit
- [ ] integration
- [ ] E2E
- [ ] responsive
- [ ] accessibility

---

# 47. DEFINITION OF DONE

```text
SATRIA AI WORKFORCE

Workspace ✅
Workforce ✅

Tasks ✅
Assignments ✅
Agent Runs ✅
Results ✅
Reviews ✅
Activity ✅
Notifications ✅

AI Runtime ⏳
Hermes ⏳
LLM ⏳
Discord ⏳
Memory ⏳
```

User sudah dapat mensimulasikan:

> “Saya memberi pekerjaan kepada employee → employee menjalankan sebuah run → saya melihat progress → hasil muncul → saya review → task selesai.”

---

# 48. PHASE 3 HANDOFF

Setelah Phase 2 stabil:

```text
MockAgentRunner
      ↓ replace
Agent Runtime Adapter
      ↓
Hermes
      ↓
Model
      ↓
Skills
      ↓
Tools
```

Runtime interface:

```text
AgentRuntime
├── start()
├── pause()
├── resume()
├── cancel()
├── retry()
├── getStatus()
└── getResult()
```

Mock runtime Phase 2 harus mengikuti interface tersebut.

---

# 49. FUTURE HERMES ADAPTER

```text
SATRIA
  ↓
Assignment
  ↓
AgentRun
  ↓
AgentRuntime Interface
  ↓
HermesAdapter
  ↓
Hermes
```

SATRIA tidak bergantung langsung pada internal Hermes.

---

# 50. FUTURE DISCORD ADAPTER

```text
Discord
   ↓
Discord Adapter
   ↓
SATRIA Command API
   ↓
Task / Assignment / Run
```

Discord tidak langsung menjalankan employee.

---

# 51. FUTURE SCHEDULER

```text
Schedule
  ↓
Trigger
  ↓
Task
  ↓
Assignment
  ↓
Agent Run
```

Scheduler production datang setelah runtime stabil.

---

# 52. SECURITY BOUNDARY

Phase 2 tidak memberi shell/browser/external side effects.

Mock run hanya boleh:

```text
Read mock task
Write mock state
Create mock result
Create activity
```

Tidak boleh:

- execute shell
- modify production server
- send external message
- make transaction
- access credentials

---

# 53. FINAL ARCHITECTURE AFTER PHASE 2

```text
                         SATRIA PWA
                             │
                    ┌────────┴─────────┐
                    │                  │
                 WORKSPACE          WORKFORCE
                    │                  │
                    └────────┬─────────┘
                             │
                           TASK
                             │
                       ASSIGNMENT
                             │
                         AGENT RUN
                             │
                    ┌────────┴─────────┐
                    │                  │
                 MOCK RUNNER       FUTURE RUNTIME
                                       │
                                     Hermes
```

---

# 54. PHASE 2 NORTH STAR

> **Turn the workforce registry into a reliable work execution ledger — before connecting real intelligence.**

Phase 2 harus membuat SATRIA mampu menjawab:

> **“Siapa mengerjakan apa, dalam project mana, dengan skill apa, statusnya apa, run keberapa, dan apa hasilnya?”**

Phase 2 belum menjawab:

> “Model AI apa yang berpikir?”

> “Hermes bagaimana menjalankan?”

> “Discord bagaimana mengirim command?”

Pertanyaan tersebut menjadi scope Phase 3.

---

# 55. IMPLEMENTATION & VERIFICATION RECORD

**Executed On:** 14 August 2026  
**Implementation Plan:** `07_PHASE2_EXECUTION_PLAN.md`  
**Quality Verification Results:**
- **TypeScript Strict (`vue-tsc --noEmit`):** 0 Errors ✅
- **Vitest Unit & Integration Suites (`npm run test:unit`):** 29/29 Tests Passed across 4 Suites ✅
  - `src/test/executionJourney.spec.ts` (5 tests)
  - `src/test/workforceJourney.spec.ts` (6 tests)
  - `src/test/userJourney.spec.ts` (7 tests)
  - `src/test/repositories.spec.ts` (11 tests)
- **Production Build & PWA Precache (`npm run build`):** 100% Successful (634.03 KiB precache, 71 entries) ✅
- **Delivered Components & Pages:**
  - `src/components/workforce/AssignmentDrawer.vue` (Skill matcher & drawer assignment)
  - `src/services/mockAgentRunner.ts` (6-stage reactive simulation engine)
  - `src/pages/runs/RunsPage.vue` (`/runs` overview dashboard)
  - `src/pages/runs/RunDetailPage.vue` (`/runs/:id` interactive live execution monitor)
  - `src/components/workforce/ReviewDrawer.vue` (Human-in-the-loop review & approval drawer)
  - `src/pages/reviews/ReviewsPage.vue` (`/reviews` verification hub)
  - `src/pages/workforce/EmployeeDetailPage.vue` (Extended with `Work` and `Runs` tabs)
  - `src/stores/assignment.ts`, `src/stores/agentRun.ts`, `src/stores/review.ts`
  - `src/repositories/index.ts` (Added 4 mock repositories for Phase 2)

