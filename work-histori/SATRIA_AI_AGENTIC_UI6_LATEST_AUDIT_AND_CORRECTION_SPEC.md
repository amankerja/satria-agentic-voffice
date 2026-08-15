# SATRIA AI AGENTIC WORKFORCE
## LATEST SOURCE AUDIT + CORRECTION SPEC
### Based on `AI AGENTIC UI(6).zip`
**Date:** 15 August 2026  
**Purpose:** Menilai implementasi terbaru terhadap `PHASE4_BUSINESS_LOGIC_UI_REFINEMENT_SPEC.md`, menemukan benturan logic/UI, lalu menetapkan perbaikan implementasi berikutnya.

---

# 1. EXECUTIVE SUMMARY

Versi `AI AGENTIC UI(6)` sudah jauh lebih dekat dengan target.

Yang **sudah benar dan dipertahankan**:

- `Active Work` sudah menjadi read-model lintas Task + Run + Project + Worker.
- Project sudah memiliki `path` sebagai konsep first-class.
- Create Project sudah mewajibkan folder path.
- Create Task sudah mengenal `pathOverride`.
- Sudah ada Preflight sebelum execution.
- Sudah ada `Change Worker` saat task berjalan.
- Sudah ada `Add Instruction Mid-Run`.
- Sudah ada Stop Run.
- Sudah ada Cancel Task.
- Sudah ada Archive.
- Sudah ada Safe Delete.
- Schedule sudah dipisahkan dari Task Instance.
- Run detail sudah memiliki telemetry/runtime/verification.
- Advanced navigation sudah memindahkan Runs/Schedules/Files/Reviews/Governance ke area lanjutan.

**Kesimpulan:** jangan rewrite aplikasi.

Yang diperlukan sekarang adalah **Phase 4.1 — Business Logic Correction & UX Simplification**.

Ada beberapa masalah yang lebih penting daripada visual:

1. `Cancel Project` saat ini sekaligus memberi `deletedAt`, sehingga cancel bercampur dengan delete.
2. `Stop Run` mengubah Task menjadi `Backlog`; ini perlu distandarkan menjadi semantic state yang jelas.
3. Task masih memakai `Backlog / Blocked`, sementara rancangan baru membutuhkan `Todo / Waiting`.
4. `Active Work` memakai fallback hard-coded `C:/Projects/AI AGENTIC UI`; ini tidak boleh ada pada production.
5. Home mengatakan `All 12 Employees`, tetapi spotlight hanya mengambil 4 worker tetap.
6. Sidebar masih menempatkan 9 menu utama sehingga konsep "simple" belum sepenuhnya tercapai.
7. Schedule saat ini membuat Task Instance saat `Run Now`, tetapi engine scheduler nyata belum terlihat sebagai orchestration layer yang otomatis membuat instance + execution.
8. `Assignment` masih terlalu sering muncul di UI dan domain flow sehingga perlu ditegaskan sebagai internal orchestration entity.
9. `Task.status` dan `AgentRun.status` masih terlalu mudah bercampur.
10. Delete/Archive/Cancel masih belum memiliki policy yang konsisten lintas Project, Task, Schedule, Run.

---

# 2. WHAT IS ALREADY GOOD

## 2.1 Active Work Read Model

`src/stores/activeWork.ts` sudah melakukan hal yang tepat:

```text
Task
+
AgentRun
+
Project
+
Employee
↓
ActiveWorkItem
```

Pertahankan pola ini.

Ini menjadi sumber utama untuk:

- Home;
- Active Work;
- Worker detail;
- runtime overview.

---

# 3. CORRECTION #1 — CANCEL ≠ DELETE

## CURRENT PROBLEM

Pada `project.ts`:

```ts
status: 'Cancelled',
deletedAt: now,
deletedBy: 'Owner',
deleteReason: reason
```

Artinya:

```text
Cancel Project
=
Cancel
+
Delete
```

Ini salah secara bisnis.

Project yang dibatalkan harus tetap dapat ditemukan dalam:

```text
Projects
→ Cancelled
```

dan dapat direstore / diaudit.

## NEW RULE

```text
Cancel
≠
Archive
≠
Delete
```

### Cancel

```text
status = Cancelled
cancelledAt
cancelledBy
cancelReason
```

Tidak mengisi:

```text
deletedAt
```

### Archive

```text
archivedAt
status = Archived
```

### Delete

```text
deletedAt
deletedBy
deleteReason
```

---

# 4. CORRECTION #2 — PROJECT CANCEL CASCADE

Saat:

```text
Project → Cancel
```

maka:

```text
Active Run
  ↓
Cancelled

Task
  ↓
Cancelled

Schedule
  ↓
Disabled
```

Tetapi:

```text
Project
  ↓
tetap ada
  ↓
status = Cancelled
```

Jangan soft-delete project ketika cancel.

---

# 5. CORRECTION #3 — TASK STATUS SEMANTICS

Current:

```text
Backlog
In Progress
Blocked
Review
Done
Cancelled
Draft
```

Masalahnya:

`Blocked` terlalu ambiguous.

Gunakan:

```text
Draft
Todo
In Progress
Waiting
Review
Done
Cancelled
```

## Mapping compatibility

Agar tidak mematahkan code lama:

```text
Backlog → Todo
Blocked → Waiting
```

Lakukan migrasi data.

---

# 6. CORRECTION #4 — RUN STATUS vs TASK STATUS

Wajib dipisahkan.

## Task

Menjawab:

> pekerjaan ini secara bisnis berada pada tahap apa?

```text
Draft
Todo
In Progress
Waiting
Review
Done
Cancelled
```

## Run

Menjawab:

> execution attempt sedang berada di tahap apa?

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

Contoh yang valid:

```text
Task:
In Progress

Run:
Failed
```

Artinya:

> execution terakhir gagal, tetapi pekerjaan masih harus dikerjakan.

---

# 7. CORRECTION #5 — STOP RUN SEMANTICS

Saat owner menekan:

```text
Stop Run
```

jangan otomatis memutuskan bahwa task selesai atau gagal.

Default:

```text
Run → Cancelled
Task → Todo
```

Kemudian owner dapat:

```text
Run Again
Edit
Change Worker
Cancel Task
```

Jika user memilih:

```text
Stop and Keep Task Active
```

hasil:

```text
Run = Cancelled
Task = Todo
```

Jika:

```text
Stop and Cancel Task
```

hasil:

```text
Run = Cancelled
Task = Cancelled
```

---

# 8. CORRECTION #6 — HARD-CODED PATH

Saat ini terdapat fallback seperti:

```ts
'C:/Projects/AI AGENTIC UI'
```

Ini tidak boleh digunakan sebagai production execution path.

## NEW RULE

Resolution:

```text
Task.pathOverride
       ↓
Project.path
       ↓
Workspace.defaultPath (optional)
       ↓
ERROR
```

Tidak boleh:

```text
↓
hard-coded project directory
```

Jika path tidak tersedia:

```text
Preflight FAIL
```

UI:

```text
Cannot start task

Workspace folder is not configured.
```

---

# 9. PROJECT SETUP CONTRACT

Project baru harus memiliki:

```text
Name
Description
Path
Default Worker
Repository
Branch
Runtime Profile
```

Minimal untuk execution:

```text
Path
+
Runtime
```

Project status:

```text
Draft
Active
Paused
Completed
Cancelled
Archived
```

Hapus status:

```text
On Track
At Risk
```

dari `ProjectStatus`.

Status tersebut adalah **health indicator**, bukan lifecycle state.

Gunakan dua field:

```text
status
health
```

Contoh:

```text
status = Active
health = At Risk
```

---

# 10. CORRECTION #7 — WORKER MODEL

Home saat ini menunjukkan:

```text
All 12 Employees
```

tetapi spotlight mengambil:

```ts
['emp-raka', 'emp-bima', 'emp-maya', 'emp-dimas']
```

Ini membuat UI dan data model tidak konsisten.

Karena user menggunakan 4 worker utama:

## Default Home

Tampilkan tepat:

```text
4 Workers
```

Jika sistem memang memiliki employee tambahan, tampilkan:

```text
Other Employees
```

di Worker Directory.

Jangan menampilkan "12 Employees" jika Home hanya mengelola 4 worker utama.

---

# 11. CORRECTION #8 — DYNAMIC WORKER SPOTLIGHT

Jangan hard-code ID:

```ts
const keyWorkerIds = [...]
```

Gunakan worker dengan role:

```text
isPrimaryWorker
```

atau:

```ts
employee.workerType = 'digital_worker'
employee.isPrimary = true
```

Dengan begitu worker dapat ditambah/diganti tanpa mengubah code.

---

# 12. CORRECTION #9 — SIDEBAR

Current primary:

```text
Home
Active Work
Tasks
Projects
Workers
Calendar
Reports
Activity
Settings
```

Ini masih terlalu banyak untuk konsep sederhana.

## Recommended

```text
Home
Work
Projects
Workers
Reports
Settings
```

### Work

Menjadi parent untuk:

```text
Active
Tasks
Calendar
```

### Projects

Menjadi pusat:

```text
Project
Tasks
Schedules
Files
```

### Reports

Menjadi:

```text
Work
Projects
Costs
Agents
```

### Activity

Dapat dipindahkan ke:

```text
Home → Activity
```

atau:

```text
Reports → Activity
```

---

# 13. RECOMMENDED ROUTES

Tetap support route lama agar tidak merusak link.

## Primary

```text
/
 /work
 /projects
 /workers
 /reports
 /settings
```

## Secondary

```text
/work/tasks
/work/calendar

/projects/:id
/tasks/:id

/workers/:id
```

## Advanced

```text
/advanced/runs
/advanced/schedules
/advanced/files
/advanced/reviews
/advanced/governance
/advanced/skills
/advanced/tools
```

Route lama:

```text
/runs
/schedules
/files
/reviews
...
```

boleh dipertahankan sebagai redirect.

---

# 14. CORRECTION #10 — TASK PAGE

Current Tasks Command Center masih terasa seperti aplikasi task management generik.

Task page harus fokus pada:

```text
What needs to be done?
Who?
Project?
Status?
When?
```

Recommended header:

```text
Tasks

[ All ] [ Active ] [ Waiting ] [ Review ] [ Done ]

                         + New Task
```

Task row:

```text
Fix authentication API

Raka · Company API
● Running
82%

/projects/company-api
```

Jangan memenuhi row dengan terlalu banyak metadata.

---

# 15. TASK DETAIL AS SINGLE SOURCE OF TRUTH

Task detail harus menjadi pusat.

## HEADER

```text
Fix authentication API

In Progress
High Priority

Raka
Company API

[ Edit ]
[ Stop ]
[ Cancel ]
[ More ]
```

## SUMMARY

```text
Where
C:/Projects/company-api

Runtime
Hermes

Progress
82%

Due
Today
```

## MAIN

```text
Current Work
Result
Files
History
```

## ADVANCED

```text
Execution
Telemetry
Verification
Activity
Assignment
```

---

# 16. CORRECTION #11 — ASSIGNMENT

Assignment tetap disimpan di backend.

Tetapi UI default:

```text
Worker: Raka
```

bukan:

```text
Assignment #asg-...
```

Assignment hanya dibutuhkan untuk:

```text
run
audit
worker change
history
```

---

# 17. MID-RUN CHANGE WORKER

Current implementation sudah mengarah benar.

Pertahankan dua mode:

### Option A

```text
Stop current run
+
Restart with new worker
```

### Option B

```text
Keep current run
+
Use new worker on next run
```

History:

```text
Run #1
Raka
Cancelled

Run #2
Bima
Running
```

---

# 18. MID-RUN INSTRUCTION

Current `AddInstructionModal` sudah tepat secara konsep.

Jangan overwrite instruction lama.

Gunakan:

```text
Execution directives
```

sebagai event:

```text
Instruction Added
actor
timestamp
instruction summary
```

Run context baru mengetahui directive tersebut.

---

# 19. CORRECTION #12 — SCHEDULE ORCHESTRATION

Saat ini:

```text
Run Now
→ triggerScheduleInstance()
→ create Task
```

Ini baru manual triggering.

Sistem production harus memiliki:

```text
Scheduler Service
```

Flow:

```text
Schedule
 ↓
Due?
 ↓
Create Task Instance
 ↓
Resolve Worker
 ↓
Resolve Project Path
 ↓
Preflight
 ↓
Create Run
 ↓
Start Runtime
```

Bukan hanya membuat Task Instance.

---

# 20. RECURRING TASK MODEL

Gunakan:

```text
Schedule
  ↓
Task Template
  ↓
Task Instance
  ↓
Run
```

Contoh:

```text
Every Monday 08:00

Schedule: Weekly Marketing Report
        ↓
Task #2026-08-17
        ↓
Run #1
        ↓
Done

Next Monday
        ↓
Task #2026-08-24
```

Jangan mengubah task lama.

---

# 21. SCHEDULE FAILURE

Jika scheduled run gagal:

```text
Task Instance:
In Progress / Waiting

Run:
Failed
```

Schedule tetap:

```text
Enabled
```

unless owner memilih:

```text
Disable schedule
```

Jangan otomatis mematikan seluruh schedule hanya karena satu execution gagal.

---

# 22. CONFLICT DETECTION

Sebelum Run:

```text
Task
 ↓
Path
 ↓
Current active runs
 ↓
Conflict check
```

Contoh:

```text
/path/company-api
```

sedang digunakan oleh:

```text
Run #12
```

Run baru harus:

```text
Wait
Stop Existing
Allow Concurrent
```

Default:

```text
Wait
```

---

# 23. PRE-FLIGHT

Current preflight modal sudah baik.

Tetapi output harus menjadi:

```text
READY

Project       Company API
Worker        Raka
Folder        /projects/company-api
Runtime       Hermes

✓ Folder
✓ Worker
✓ Runtime
✓ Permissions
✓ Conflict Check

[ Start Work ]
```

Jika fail:

```text
NOT READY

Folder does not exist

[ Fix Project ]
```

---

# 24. ACTIVE WORK = CORE SCREEN

`ActiveWorkPage.vue` adalah bagian terpenting dari aplikasi.

Pertahankan field:

```text
Worker
Task
Project
Status
Progress
Current Step
Runtime
Folder
Last Activity
```

Action:

```text
Open
Edit
Change Worker
Stop
Cancel
```

Jangan tambahkan terlalu banyak action langsung pada card.

---

# 25. HOME = OWNER OVERVIEW

Home harus fokus pada:

```text
WHAT IS HAPPENING NOW?
```

Recommended:

```text
ACTIVE WORK
-----------------------------------
Raka   Fix API              82% Running
Bima   Backup               45% Running
Maya   Marketing Report          Waiting
Deni   Landing QA            Review

ATTENTION
-----------------------------------
2 overdue
1 failed run
1 review waiting

TODAY
-----------------------------------
3 completed
```

Worker spotlight boleh tetap ada, tetapi jangan mengalahkan Active Work.

---

# 26. HOME ORDER

Urutan komponen:

```text
1. Header + New Task
2. Active Work
3. Needs Attention
4. Workers
5. Today
6. Runtime Status
```

Jangan menaruh technical/runtime content terlalu tinggi.

---

# 27. QUICK DISPATCH BAR

`QuickDispatchBar` berguna untuk expert user, tetapi jangan menjadi pusat Home.

Recommended:

```text
New Task
```

cukup menjadi tombol utama.

Quick dispatch:

```text
Advanced shortcut
```

atau:

```text
Command Palette
```

---

# 28. REPORTS

Reports page harus dikelompokkan:

```text
Work
Projects
Costs
Agents
Schedules
```

## Work

```text
Completed
Running
Waiting
Review
Cancelled
Overdue
```

## Project

```text
Progress
Task count
Completion
Cost
```

## Costs

```text
By Project
By Worker
By Runtime
By Provider
```

## Agents

```text
Runs
Success
Failure
Duration
Cost
```

## Schedule

```text
Active
Disabled
Next Run
Last Run
Failure count
```

---

# 29. COST DATA

Jangan hanya memakai:

```text
AgentRun.telemetry.estimatedCostUsd
```

untuk business reporting.

Cost ledger sebaiknya immutable:

```text
CostEntry
 id
 runId
 taskId
 projectId
 workerId
 provider
 model
 tokens
 costUsd
 timestamp
```

Report membaca:

```text
CostEntry
```

bukan menghitung ulang dari mutable run object.

---

# 30. DELETE POLICY

## Task

Delete allowed:

```text
Draft
Cancelled
Failed/Test
Duplicate
```

Archive:

```text
Done
```

## Project

Delete allowed:

```text
Draft
Cancelled
```

Archive:

```text
Completed
```

## Run

Delete allowed:

```text
Cancelled
Failed
Test
```

Never delete silently:

```text
successful production evidence
financial record
audit event
security event
```

---

# 31. TRASH / ARCHIVE

Tambahkan area:

```text
Settings
 → Storage
   → Trash
   → Archive
```

atau:

```text
More → Trash
```

Trash menampilkan:

```text
Task
Project
Run
Schedule
```

Action:

```text
Restore
Permanent Delete
```

Permanent delete memerlukan confirmation.

---

# 32. SOFT DELETE CONTRACT

Entity yang mendukung deletion:

```ts
deletedAt?: string
deletedBy?: string
deleteReason?: string
```

Entity yang mendukung cancel:

```ts
cancelledAt?: string
cancelledBy?: string
cancelReason?: string
```

Entity yang mendukung archive:

```ts
archivedAt?: string
```

Jangan menggunakan satu field untuk tiga konsep tersebut.

---

# 33. PROJECT STATUS REFACTOR

Current:

```ts
'Active'
'On Track'
'At Risk'
'Completed'
'Archived'
'Cancelled'
'Draft'
```

Change:

```ts
type ProjectStatus =
  | 'Draft'
  | 'Active'
  | 'Paused'
  | 'Completed'
  | 'Cancelled'
  | 'Archived'

type ProjectHealth =
  | 'Healthy'
  | 'At Risk'
  | 'Critical'
```

---

# 34. TASK STATUS REFACTOR

Recommended:

```ts
type TaskStatus =
  | 'Draft'
  | 'Todo'
  | 'In Progress'
  | 'Waiting'
  | 'Review'
  | 'Done'
  | 'Cancelled'
```

---

# 35. MIGRATION MAP

Existing:

```text
Backlog → Todo
Blocked → Waiting
```

Do not alter raw historical Run status.

Run status remains separate.

---

# 36. ACTIVE WORK QUERY

Current inclusion rule includes:

```ts
Backlog && workerId
```

This can make an assigned but untouched task appear as active work.

Change to:

```text
Active Work =
Task.status in
[
  In Progress,
  Waiting,
  Review
]
OR
Task.activeRunId exists
```

Todo tasks should appear under:

```text
Tasks
```

not:

```text
Active Work
```

Exception:

```text
Scheduled task due soon
```

can appear in "Upcoming".

---

# 37. WORKER STATUS

Worker status should derive from work.

```text
Running
Waiting
Review
Idle
Offline
```

Do not use:

```text
Completed
```

as worker availability state.

`Completed` belongs to Task/Run.

---

# 38. RUNTIME STATUS

Global runtime:

```text
Healthy
Degraded
Offline
```

Task runtime badge:

```text
Hermes
Local
Remote
```

Example:

```text
● Hermes · Running
```

---

# 39. NO CHAIN-OF-THOUGHT

Execution detail may show:

```text
Action
Tool
Input summary
Output summary
Verification
Error
Timestamp
```

Do not display private reasoning.

---

# 40. FILE WORKSPACE

Project Files:

```text
Project source
Assets
Documents
Configuration
```

Task Artifacts:

```text
Generated file
Report
Diff
Export
Evidence
```

Keep the concepts separate.

---

# 41. DATA MODEL FINAL

## Project

```ts
interface Project {
  id: string
  workspaceId: string

  name: string
  description: string

  status: ProjectStatus
  health: ProjectHealth

  path: string

  defaultWorkerId?: string
  repositoryUrl?: string
  branch?: string
  runtimeProfile?: string

  createdAt: string
  updatedAt: string

  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string

  archivedAt?: string

  deletedAt?: string
  deletedBy?: string
  deleteReason?: string
}
```

## Task

```ts
interface Task {
  id: string
  workspaceId: string
  projectId: string

  title: string
  description: string

  type: 'one_time' | 'project' | 'recurring_instance'

  status: TaskStatus
  priority: TaskPriority

  workerId?: string

  pathOverride?: string

  scheduleId?: string
  parentTaskId?: string

  acceptanceCriteria?: string[]
  checklist: ChecklistItem[]

  activeRunId?: string
  latestRunId?: string

  dueDate?: string

  createdAt: string
  updatedAt: string

  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string

  archivedAt?: string

  deletedAt?: string
  deletedBy?: string
  deleteReason?: string
}
```

---

# 42. BUSINESS EVENT MODEL

Important owner actions harus menjadi event:

```text
TaskCreated
TaskUpdated
TaskCancelled
TaskArchived
TaskDeleted

RunStarted
RunStopped
RunCancelled
RunFailed
RunCompleted

WorkerChanged
InstructionAdded

ProjectCreated
ProjectCancelled
ProjectArchived

ScheduleCreated
ScheduleDisabled
ScheduleTriggered
```

Dengan ini Activity dan Audit tidak perlu menebak dari perubahan state.

---

# 43. ACTION MATRIX

| State | Edit | Run | Stop | Cancel | Archive | Delete |
|---|---:|---:|---:|---:|---:|---:|
| Draft | ✓ | ✓ | - | ✓ | - | ✓ |
| Todo | ✓ | ✓ | - | ✓ | - | limited |
| In Progress | ✓ | - | ✓ | ✓ | - | - |
| Waiting | ✓ | ✓ | ✓ | ✓ | - | - |
| Review | ✓ | ✓ | - | ✓ | - | - |
| Done | limited | ✓ | - | - | ✓ | - |
| Cancelled | limited | ✓/Restore | - | - | ✓ | ✓ |

---

# 44. OWNER FLOW

## New Project

```text
New Project
 ↓
Name
 ↓
Folder
 ↓
Default Worker
 ↓
Repository optional
 ↓
Create
```

## New Task

```text
New Task
 ↓
What?
 ↓
Project
 ↓
Worker
 ↓
When
 ↓
Optional instruction/path
 ↓
Create
```

## Start

```text
Task
 ↓
Preflight
 ↓
Start
 ↓
Active Work
```

---

# 45. OWNER CONTROL FLOW

### Edit

```text
Task
→ Edit
→ Save
→ next execution uses new snapshot
```

### Change Worker

```text
Task
→ Change Worker
→ Stop + Restart
OR
→ Next Run
```

### Add Instruction

```text
Task
→ Add Instruction
→ Runtime event
```

### Cancel

```text
Task
→ Cancel
→ Cancel active run
→ Task Cancelled
```

---

# 46. PROJECT CANCEL FLOW

```text
Project Cancel
 ↓
Confirm reason
 ↓
Find Active Tasks
 ↓
Cancel Active Runs
 ↓
Cancel Tasks
 ↓
Disable Schedules
 ↓
Project = Cancelled
 ↓
Audit Event
```

Project remains visible.

---

# 47. PROJECT ARCHIVE FLOW

```text
Project Completed
 ↓
Archive
 ↓
Project = Archived
 ↓
Visible in Archive
```

Archive should never trigger execution cancellation.

---

# 48. TESTS THAT MUST BE ADDED

## Lifecycle

- [ ] Cancel Project does NOT set `deletedAt`.
- [ ] Cancel Task does NOT set `deletedAt`.
- [ ] Archive does NOT set `deletedAt`.
- [ ] Delete does set `deletedAt`.
- [ ] Stop Run keeps Task reusable.
- [ ] Retry creates a new Run.
- [ ] Change Worker creates correct history.
- [ ] Project cancel disables schedules.
- [ ] Project cancel cancels active runs.
- [ ] Completed project can be archived.
- [ ] Cancelled task can be deleted safely.

## Path

- [ ] Project requires path.
- [ ] Task uses pathOverride if present.
- [ ] Task falls back to Project.path.
- [ ] Missing path causes preflight failure.
- [ ] No production code uses hard-coded project path.

## Active Work

- [ ] Todo task is not Active Work.
- [ ] In Progress task is Active Work.
- [ ] Waiting task is Active Work.
- [ ] Review task is Active Work.
- [ ] Cancelled task is not Active Work.

## Schedule

- [ ] Schedule creates Task Instance.
- [ ] Due schedule creates Run when policy says auto-run.
- [ ] Failed instance does not disable schedule.
- [ ] Disabled schedule does not create new instance.

---

# 49. STATIC AUDIT RESULT OF AI AGENTIC UI(6)

## GOOD

```text
✓ ActiveWork read model
✓ Project path field
✓ Mandatory project path UI
✓ Preflight
✓ Worker switching
✓ Mid-run instructions
✓ Stop Run UI
✓ Cancel Task UI
✓ Archive
✓ Soft delete fields
✓ Schedule domain
✓ Run telemetry
✓ Advanced navigation
```

## MUST FIX

```text
⚠ Cancel Project = delete semantic
⚠ Project status mixes lifecycle + health
⚠ Task status uses Backlog/Blocked
⚠ Stop Run returns Task to Backlog
⚠ Hard-coded workspace path fallback
⚠ Worker spotlight hard-coded IDs
⚠ Home claims 12 employees while spotlight shows 4
⚠ Sidebar still too crowded
⚠ Active Work includes assigned Backlog task
⚠ Scheduler orchestration not represented as a real runtime service
⚠ Assignment remains too visible conceptually
⚠ No clean unified Cancel/Delete/Archive policy
```

---

# 50. IMPLEMENTATION ORDER

## PHASE 4.1 — BUSINESS LOGIC FIX

1. Fix Cancel vs Delete.
2. Fix Project status/health.
3. Normalize Task statuses.
4. Separate Task and Run lifecycle.
5. Remove hard-coded path fallback.
6. Correct Active Work query.
7. Correct Worker state.
8. Fix Project cascade.

## PHASE 4.2 — UI SIMPLIFICATION

1. Rebuild Home information hierarchy.
2. Reduce sidebar.
3. Simplify Tasks page.
4. Make Task Detail the central workspace.
5. Move advanced runtime data behind tabs/drawers.
6. Reduce direct action density.

## PHASE 4.3 — SCHEDULER

1. Scheduler service.
2. Schedule due detection.
3. Task instance creation.
4. Preflight.
5. Run creation.
6. Runtime execution.
7. Failure policy.
8. Retry policy.

## PHASE 4.4 — STORAGE & GOVERNANCE

1. Trash.
2. Archive.
3. Soft delete.
4. Audit events.
5. Immutable cost ledger.
6. Restore policy.

## PHASE 4.5 — E2E

Owner journey:

```text
Create Project
→ Set Folder
→ Create Task
→ Assign Worker
→ Preflight
→ Run
→ Monitor
→ Modify
→ Stop
→ Retry
→ Complete
→ Report
→ Archive/Delete
```

---

# 51. FINAL TARGET EXPERIENCE

User membuka SATRIA:

```text
HOME

ACTIVE WORK
-----------------------------------
Raka   Fix API                82%
Bima   Backup                 45%
Maya   Weekly Report          Waiting
Deni   Landing QA             Review

NEEDS ATTENTION
-----------------------------------
1 failed
2 waiting
1 overdue

WORKERS
-----------------------------------
Raka   Working
Bima   Working
Maya   Waiting
Deni   Review
```

Klik:

```text
Fix API
```

langsung terlihat:

```text
Worker
Project
Folder
Runtime
Progress
Current Step
Result
Files
History

[Edit]
[Add Instruction]
[Change Worker]
[Stop]
[Cancel]
```

Itulah bentuk yang harus dipertahankan.

---

# 52. FINAL PRINCIPLE

SATRIA bukan:

```text
AI Runtime Administration System
```

SATRIA adalah:

```text
Simple Work Management
+
4 Workers
+
Hermes Runtime
```

User harus berpikir:

```text
Saya punya pekerjaan.
Saya kasih ke siapa?
Dikerjakan di mana?
Sedang apa?
Hasilnya apa?
```

bukan:

```text
Assignment apa?
Run ID berapa?
Provider apa?
Runtime object apa?
```

Detail teknis tetap ada, tetapi hanya ketika user membutuhkannya.

---

# 53. NOTE ON VALIDATION

Static review terhadap source `AI AGENTIC UI(6)` sudah dilakukan.

Perintah:

```bash
npm run typecheck
```

belum dapat dijalankan di environment review karena dependency lokal (`node_modules`, termasuk `vue-tsc`) belum terpasang pada extracted archive.

Artinya dokumen ini adalah:

```text
source-level business/UI audit
```

bukan klaim bahwa seluruh test suite runtime sudah lulus pada archive ini.

Setelah dependencies terpasang, wajib jalankan:

```bash
npm install
npm run typecheck
npm run lint
npm run test:unit
npm run test:e2e
```

dan kemudian ulangi lifecycle tests pada Section 48.

---

# 54. FINAL DEFINITION OF DONE

Phase 4.1 dianggap selesai jika:

```text
✓ Cancel != Delete
✓ Archive != Delete
✓ Project health != Project lifecycle
✓ Task status != Run status
✓ No hard-coded production path
✓ Active Work hanya menampilkan active work
✓ Worker list dinamis
✓ Home konsisten dengan jumlah worker
✓ Sidebar sederhana
✓ Task Detail menjadi pusat pekerjaan
✓ Scheduler dapat membuat task instance + execution sesuai policy
✓ Owner dapat mengubah pekerjaan di tengah jalan
✓ Owner dapat menghentikan pekerjaan
✓ Owner dapat membatalkan pekerjaan
✓ Owner dapat retry
✓ Owner dapat archive
✓ Owner dapat delete cancelled/failed data dengan aman
✓ Audit trail tetap tersedia
✓ Cost data dapat direkonsiliasi
✓ E2E lifecycle lulus
```

---

## END
