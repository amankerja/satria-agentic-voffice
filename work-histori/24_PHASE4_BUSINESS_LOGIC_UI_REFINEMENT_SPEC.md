# SATRIA AI AGENTIC WORKFORCE
## MASTER REFINEMENT DOCUMENT — BUSINESS LOGIC, WORKFLOW & SIMPLE UI
### Re-design Direction: Simple Work Management for 4 Employees + Hermes/Agent Runtime

**Version:** 1.0  
**Date:** 15 August 2026  
**Status:** Design refinement / implementation blueprint  
**Reference:** Existing `AI AGENTIC UI` codebase, Phase 0–3.x history, current Task/Project/Assignment/Agent Run architecture

---

# 1. TUJUAN DOKUMEN

Dokumen ini menjadi acuan utama untuk memperbaiki:

1. logika bisnis aplikasi;
2. hubungan Project → Task → Assignment → Run;
3. pengelolaan pekerjaan untuk tim kecil (4 karyawan);
4. pekerjaan sekali jalan, pekerjaan project, dan pekerjaan berulang/terjadwal;
5. kemampuan owner untuk mengubah atau membatalkan pekerjaan di tengah jalan;
6. monitoring pekerjaan manusia/digital employee/Hermes;
7. penyimpanan project/task pada folder/path tertentu;
8. detail execution yang dapat dilihat dari web;
9. laporan biaya, project, pekerjaan, dan penggunaan agent;
10. penghapusan/arsip entity yang sudah dibatalkan atau tidak jadi dikerjakan;
11. penyederhanaan UI agar tidak terasa seperti enterprise software yang terlalu rumit.

Dokumen ini bukan sekadar redesign visual. Ini adalah **revisi business logic + information architecture + UX + execution lifecycle**.

---

# 2. MASALAH UTAMA PADA STRUKTUR SEKARANG

Fondasi teknis saat ini sudah bagus:

```text
Project
  ↓
Task
  ↓
Assignment
  ↓
Agent Run
  ↓
Result
  ↓
Verification
  ↓
Review
```

Namun dari sudut pandang owner, pekerjaan terasa tersebar.

Saat owner bertanya:

> "Empat orang saya sekarang sedang mengerjakan apa?"

jawabannya seharusnya dapat dilihat dalam satu layar.

Saat owner bertanya:

> "Task ini siapa yang mengerjakan, lokasinya di folder mana, sedang berjalan di Hermes atau tidak, terakhir berubah apa, hasilnya apa?"

jawabannya juga harus tersedia dari satu detail pekerjaan.

Saat owner berkata:

> "Batalkan pekerjaan ini."

sistem harus mampu menghentikan execution, membereskan state, dan menandai seluruh history dengan jelas.

---

# 3. PRINSIP PRODUK BARU

## 3.1 Simple First

Jangan memaksa owner memahami:

- Assignment;
- Runtime;
- Telemetry;
- Verification Engine;
- Memory;
- Skill matching;
- Provider;
- Model routing;

untuk melakukan pekerjaan sederhana.

Semua itu tetap ada, tetapi berada di balik detail.

### Prinsip:

```text
Simple surface
      ↓
Advanced detail only when needed
```

---

# 4. MODEL BISNIS UTAMA

Gunakan 5 konsep utama yang mudah dipahami:

```text
PROJECT
  = kumpulan pekerjaan yang memiliki tujuan

TASK
  = satu pekerjaan yang harus dilakukan

WORKER
  = orang / digital employee yang mengerjakan

RUN
  = proses eksekusi nyata

SCHEDULE
  = aturan kapan task dijalankan
```

`Assignment` tetap ada di backend/domain, tetapi **jangan dijadikan konsep utama di navigasi UI**.

UI cukup mengatakan:

```text
Dikerjakan oleh: Raka
```

bukan:

```text
Assignment #asg-1023
```

Assignment hanya muncul pada detail/advanced view.

---

# 5. TIPE PEKERJAAN

Sistem harus membedakan tipe pekerjaan.

## 5.1 One-time Task

Pekerjaan satu kali.

Contoh:

```text
Perbaiki login API
Buat laporan biaya Agustus
Upload 10 produk
```

Lifecycle:

```text
Created
→ Assigned
→ Running
→ Completed
```

---

## 5.2 Project Task

Pekerjaan yang merupakan bagian dari project.

Contoh:

```text
Project: Launch Website
  ├── UI
  ├── Backend
  ├── Testing
  └── Deployment
```

---

## 5.3 Recurring Task

Pekerjaan berulang.

Contoh:

```text
Backup database setiap hari
Laporan marketing setiap Senin
Posting konten setiap hari
Cek biaya setiap tanggal 30
```

Recurring task terdiri dari:

```text
Task Template
+
Schedule
```

Jangan membuat satu Task raksasa yang terus berubah.

Gunakan:

```text
Recurring Definition
    ↓
Task Instance
    ↓
Run
```

Contoh:

```text
"Generate laporan marketing mingguan"

Schedule:
Every Monday 08:00

↓ otomatis

Task #2026-08-17
Task #2026-08-24
Task #2026-08-31
```

---

# 6. PROJECT LIFECYCLE

```text
Draft
  ↓
Active
  ↓
Paused
  ↓
Completed
```

Exception:

```text
Active → Cancelled
Draft  → Archived
```

Project tidak dihapus permanen hanya karena tidak dipakai.

Gunakan:

```text
Archive
```

untuk project lama.

---

# 7. TASK LIFECYCLE BARU

Gunakan state yang mudah dipahami:

```text
Draft
↓
Todo
↓
In Progress
↓
Waiting
↓
Review
↓
Done
```

Exception:

```text
Todo → Cancelled
In Progress → Cancelled
Waiting → Cancelled
Review → Cancelled
```

Failure runtime tidak perlu menjadi status task utama.

Contoh:

```text
Task:
In Progress

Run:
Failed

Task tetap:
In Progress
```

Kemudian owner dapat:

```text
Retry
Change Instruction
Change Worker
Cancel
```

---

# 8. RUN LIFECYCLE

Run adalah execution attempt.

```text
Queued
↓
Starting
↓
Running
↓
Waiting
↓
Verifying
↓
Completed
```

Exception:

```text
Running → Failed
Running → Cancelled
Waiting → Cancelled
```

Retry membuat run baru:

```text
Task
 ├── Run #1 Failed
 └── Run #2 Running
```

History run tidak ditimpa.

---

# 9. KONSEP PALING PENTING: TASK ≠ RUN

Jangan membuat kesalahan:

```text
Task = satu execution
```

Yang benar:

```text
TASK
  tujuan bisnis

RUN
  percobaan eksekusi
```

Contoh:

```text
Task:
"Perbaiki bug login"

Run #1
  gagal test

Run #2
  diperbaiki

Run #3
  berhasil
```

Task tetap satu.

---

# 10. OWNER CONTROL

Owner harus dapat mengubah pekerjaan kapan saja.

## 10.1 Edit Task Sebelum Berjalan

Owner dapat mengubah:

- judul;
- deskripsi;
- priority;
- worker;
- project;
- due date;
- folder/path;
- acceptance criteria;
- schedule;
- instruction.

---

## 10.2 Edit Task Saat Berjalan

Saat Run aktif:

```text
Edit Task
```

membuka dua pilihan:

### A. Update Next Step

Perubahan berlaku setelah current step selesai.

### B. Stop & Apply Change

```text
Cancel Current Run
+
Update Task
+
Create New Run
```

Default untuk perubahan besar.

---

# 11. CANCEL / STOP / DELETE

Ini harus dibedakan.

## Stop Run

Menghentikan execution saat ini.

```text
Run → Cancelled
Task → tetap In Progress / Todo
```

## Cancel Task

Pekerjaan tidak perlu dilanjutkan.

```text
Task → Cancelled
Active Run → Cancelled
Schedule → Disabled
```

## Delete

Menghapus entity dari active workspace.

Delete hanya diperbolehkan:

- Draft;
- Cancelled;
- Failed yang sudah tidak diperlukan;
- test/mock data;
- orphaned run.

Untuk task/project yang sudah selesai gunakan:

```text
Archive
```

bukan delete permanen.

---

# 12. DELETE RUN

Owner harus dapat:

```text
Delete Run
```

untuk run yang:

```text
Cancelled
Failed
```

terutama:

- percobaan yang tidak relevan;
- mock/test run;
- run duplikat;
- task yang dibatalkan.

Namun sebelum delete:

```text
Delete Run
→ confirmation
→ remove from active history
→ audit record tetap disimpan
```

Jangan benar-benar kehilangan audit trail.

---

# 13. SOFT DELETE RECOMMENDATION

Gunakan:

```text
deletedAt
deletedBy
deleteReason
```

pada:

- Task;
- Project;
- Assignment;
- Run;
- Artifact;
- Schedule.

UI biasa tidak menampilkan deleted data.

Admin/Owner dapat membuka:

```text
Trash / Archived
```

untuk restore atau permanent purge.

---

# 14. PROJECT SETUP WAJIB SEBELUM TASK AGENTIC

Sebelum project baru dijalankan oleh agent, lakukan:

```text
Create Project
       ↓
Project Setup
       ↓
Workspace Path
       ↓
Repository / Folder
       ↓
Runtime Access
       ↓
Default Worker
       ↓
Project Rules
       ↓
Ready
```

---

# 15. PROJECT SETUP SCREEN

Saat membuat project:

```text
Create New Project

Project Name
[ Website Company              ]

Description
[                              ]

Project Folder
[ C:/Projects/company-website ]
                    [Browse]

Repository
[ https://github.com/...       ]

Branch
[ main                        ]

Default Worker
[ Raka                        ]

[ Test Connection ]

✓ Path exists
✓ Agent can access path
✓ Repository detected
✓ Runtime available

[ Create Project ]
```

---

# 16. PROJECT PATH

Path harus menjadi properti project:

```text
project.path
```

Contoh:

```text
C:/Projects/website
D:/SATRIA/projects/marketing
/home/satria/projects/api
```

Saat task dijalankan:

```text
Task
 ↓
Project
 ↓
Project.path
 ↓
workspacePath
 ↓
Hermes
```

Jangan hard-code:

```text
C:/Projects/AI AGENTIC UI
```

Fallback boleh ada hanya untuk development.

---

# 17. PATH OVERRIDE PER TASK

Task tertentu boleh memiliki path khusus:

```text
project.path
       ↓
task.pathOverride (optional)
```

Contoh:

```text
Project:
Marketing Automation
Path:
/projects/marketing

Task:
Edit landing page
Path:
/projects/marketing/landing-page
```

Default tetap project path.

---

# 18. PROJECT CONTEXT

Selain path, project dapat memiliki:

```text
Repository
Branch
Environment
Default instructions
Important files
Rules
Credentials reference
Tools allowed
```

Tetapi UI default hanya menampilkan:

```text
Folder
Repository
Worker
Rules
```

Advanced details berada di:

```text
Project → Settings → Advanced
```

---

# 19. SCHEDULE SYSTEM

Schedule harus menjadi entity terpisah.

```text
Schedule
  ↓
Task Template
  ↓
Task Instance
  ↓
Run
```

Field:

```text
id
name
taskTemplateId
frequency
timezone
nextRunAt
enabled
startDate
endDate
```

Frequency:

```text
Once
Daily
Weekly
Monthly
Custom Cron
```

---

# 20. CONTOH SCHEDULE

```text
Schedule:
Daily Backup

Every:
Day

Time:
23:00

Worker:
Bima

Project:
Infrastructure

Task:
Backup database

Status:
Active

Next Run:
15 Aug 2026 23:00
```

---

# 21. SCHEDULE DARI PROJECT

Project dapat mempunyai beberapa scheduled tasks:

```text
Marketing Project
 ├── Daily content generation
 ├── Monday performance report
 ├── Friday analytics
 └── Monthly cost report
```

Jangan membuat fitur scheduler menjadi aplikasi terpisah.

Tampilkan schedule di:

```text
Project → Schedules
```

dan:

```text
Calendar
```

---

# 22. HOME DASHBOARD BARU

Home harus menjawab 6 pertanyaan.

```text
Apa yang sedang berjalan?
Siapa yang sedang bekerja?
Apa yang terlambat?
Apa yang selesai?
Apa yang gagal?
Apa yang perlu saya lakukan?
```

---

# 23. HOME LAYOUT

Gunakan layout sederhana:

```text
------------------------------------------------
SATRIA
------------------------------------------------

[ 4 Workers ] [ 7 Active ] [ 2 Waiting ] [ 3 Review ]

ACTIVE WORK
------------------------------------------------
Raka     Fix login API             82%   Running
Bima     Backup automation         45%   Running
Maya     Marketing report          Waiting
Deni     Landing page              Review
------------------------------------------------

NEEDS ATTENTION
------------------------------------------------
⚠ Run gagal — Fix payment API
⚠ 2 task overdue
✓ 3 task selesai hari ini
------------------------------------------------

TODAY
------------------------------------------------
08:00 Marketing report
10:30 Deploy website
14:00 Cost report
------------------------------------------------
```

---

# 24. WORKER VIEW

Karena hanya 4 karyawan, gunakan kartu sederhana:

```text
Raka
Backend Engineer

● Working
Fix authentication API
82%

Bima
Automation

● Working
Daily backup
45%

Maya
Marketing

○ Waiting
Weekly report

Deni
QA

◷ Review
Landing page
```

Satu layar harus menjawab:

> siapa sedang melakukan apa?

---

# 25. "ACTIVE WORK" MENJADI KONSEP UTAMA

Buat halaman:

```text
Active Work
```

Bukan hanya:

```text
Runs
```

Karena owner berpikir dalam bahasa bisnis.

Active Work menampilkan:

```text
Task
Worker
Project
Status
Progress
Current Step
Runtime
Started
```

---

# 26. ACTIVE WORK DETAIL

Contoh:

```text
Fix authentication API

Project:
Company API

Worker:
Raka

Status:
Running

Progress:
82%

Runtime:
Hermes

Folder:
C:/Projects/company-api

Current:
Running tests

Started:
19:32

Latest activity:
19:46 Test suite started
```

Action:

```text
[ Pause ]
[ Stop ]
[ Edit ]
[ Open Folder ]
[ View Run ]
```

---

# 27. DETAIL TASK

Task detail menjadi pusat informasi.

Layout:

```text
HEADER
------------------------------------------------
Fix authentication API
Running · High

Project: Company API
Worker: Raka
Path: C:/Projects/company-api

[Edit] [Stop] [Cancel]
------------------------------------------------

OVERVIEW
Description
Acceptance Criteria
Checklist

CURRENT WORK
Run #3
82%
Running tests

RESULT
Latest result
Artifacts
Diff

HISTORY
Run #1
Run #2
Run #3

ACTIVITY
...
```

---

# 28. AI / HERMES DETAIL

User meminta setiap pekerjaan dapat dilihat detailnya.

Jangan membuat chat/log AI sebagai halaman utama.

Gunakan tab:

```text
Overview
Execution
Result
Files
History
```

Execution menampilkan:

```text
Runtime: Hermes
Model: ...
Provider: ...
Current step
Tool calls
Events
Verification
Telemetry
```

---

# 29. JANGAN MENAMPILKAN CHAIN-OF-THOUGHT

Jangan menyimpan/menampilkan private reasoning.

Yang boleh ditampilkan:

```text
Action
Tool
Input summary
Output summary
Status
Timestamp
Error
Verification
```

Contoh:

```text
19:41
Hermes executed:
npm test

Result:
18 passed, 0 failed

19:42
Verification:
PASSED
```

---

# 30. RUN DETAIL

Struktur:

```text
RUN #3

Status
Progress

Execution timeline
------------------------------------------------
✓ Initialized
✓ Loaded project context
✓ Prepared workspace
✓ Edited files
✓ Ran tests
● Verifying
------------------------------------------------

TOOLS
npm test
git diff

RESULT
...

VERIFICATION
✓ Typecheck
✓ Tests
✓ Build

TELEMETRY
Duration
Tokens
Cost

ARTIFACTS
...
```

---

# 31. REPORTS — PENYEDERHANAAN

Reports jangan dibuat sebagai dashboard statistik besar.

Gunakan kategori:

```text
Work Report
Project Report
Cost Report
Agent Report
Schedule Report
Activity Report
```

---

# 32. WORK REPORT

Menjawab:

> pekerjaan tim saya seperti apa?

Isi:

```text
Total tasks
Completed
Running
Waiting
Cancelled
Failed
Overdue
```

Tambahkan:

```text
By Worker
By Project
By Status
```

---

# 33. PROJECT REPORT

Contoh:

```text
Website Project

Progress          72%
Tasks             18
Completed         13
Running           2
Waiting           1
Cancelled         2

Estimated Cost    $12.40
AI Cost           $8.90
Human/External    $3.50

Recent activity
...
```

---

# 34. COST REPORT

Harus sangat mudah dibaca.

```text
AI COST — AUGUST 2026

Total
$42.80

Hermes
$28.20

Other Providers
$14.60

By Project
Website         $18.40
Marketing       $12.20
Automation      $8.70
Other           $3.50
```

Tambahkan:

```text
Cost per task
Cost per worker
Cost per project
Daily trend
Monthly trend
```

---

# 35. AGENT REPORT

Menjawab:

> agent mana yang paling aktif dan paling efektif?

```text
Raka
24 runs
19 completed
3 failed
2 cancelled

Success rate
79%

Total runtime
6h 22m

Estimated cost
$14.20
```

Jangan membuat ranking hanya berdasarkan jumlah task. Tampilkan konteks.

---

# 36. SCHEDULE REPORT

```text
Scheduled jobs
Active
Paused
Failed
Next execution
Last execution
```

Contoh:

```text
Daily backup      Active     Next 23:00
Weekly report     Active     Mon 08:00
Content post      Paused     -
```

---

# 37. FILES & ARTIFACTS

Files page sekarang terlalu umum bila digabung dengan execution output.

Pisahkan konsep:

```text
Project Files
```

dan:

```text
Task Artifacts
```

Project Files:

```text
source code
documents
assets
configuration
```

Task Artifacts:

```text
result
report
generated file
diff
export
```

---

# 38. ARTIFACT DETAIL

Saat membuka artifact:

```text
Created by:
Raka

Task:
Fix authentication API

Run:
#3

Path:
C:/Projects/company-api/src/auth.ts

Changed:
19:43

Verification:
Passed
```

---

# 39. NAVIGASI BARU

Sidebar jangan menampilkan terlalu banyak menu.

Gunakan:

```text
HOME

WORK
  Active Work
  Tasks
  Calendar

PROJECTS

WORKERS

REPORTS

ACTIVITY

SETTINGS
```

Menu lanjutan:

```text
Runs
Schedules
Files
Governance
Skills
Tools
Memory
```

masuk ke:

```text
Advanced
```

atau dibuka dari detail.

---

# 40. SARAN STRUKTUR ROUTE

```text
/
  Home

/work
  Active Work

/tasks
/tasks/:id

/calendar

/projects
/projects/:id

/workers
/workers/:id

/reports

/activity

/settings
```

Advanced:

```text
/runs
/runs/:id
/schedules
/files
/governance
/skills
/tools
```

---

# 41. PROJECT PAGE

Project list cukup:

```text
PROJECTS

Website
72%
18 tasks
2 running

Marketing
48%
26 tasks
4 scheduled

Automation
91%
12 tasks
1 running
```

Action:

```text
[ New Project ]
```

---

# 42. PROJECT DETAIL

```text
Website

72% complete

Path
C:/Projects/company-api

Worker
Raka

TASKS
------------------------------------------------
✓ Setup project
✓ Build auth
● Fix login
○ Testing
○ Deployment
------------------------------------------------

SCHEDULED
Weekly report

FILES
24

COST
$18.40
```

---

# 43. CREATE TASK UI

Jangan gunakan form sangat panjang.

Step 1:

```text
What needs to be done?

[ Fix authentication API ]
```

Step 2:

```text
Project
[ Company API ]

Worker
[ Raka ]

When
[ Now ]

Priority
[ High ]
```

Step 3 optional:

```text
Instructions
[ ... ]

Folder
[ Use project folder ]

Checklist
[ ... ]
```

Button:

```text
Create Task
```

---

# 44. CREATE RECURRING TASK

Toggle:

```text
Repeat:
[ OFF ]
```

Jika ON:

```text
Every
[ Week ]

Day
[ Monday ]

Time
[ 08:00 ]

Timezone
[ Asia/Makassar ]
```

---

# 45. TASK ACTIONS

Context menu:

```text
Open
Edit
Duplicate
Change Worker
Change Project
Run Now
Schedule
Pause
Stop
Cancel
Archive
Delete
```

Tidak semua action ditampilkan sekaligus.

Gunakan state-aware action.

---

# 46. STATE-AWARE ACTION RULE

### Draft/Todo

```text
Edit
Assign
Run
Schedule
Cancel
Delete
```

### Running

```text
Edit
Stop
Change Worker
Cancel
Open Run
```

### Waiting

```text
Resume
Edit
Stop
Cancel
```

### Review

```text
Approve
Request Changes
Cancel
```

### Done

```text
View
Duplicate
Archive
```

### Cancelled

```text
Restore
Archive
Delete
```

---

# 47. CHANGE WORKER MID-RUN

Owner memilih:

```text
Change Worker
```

Dialog:

```text
Current:
Raka

New:
Bima

What should happen?

○ Continue after current run stops
● Stop current run and restart
```

Default:

```text
Stop current run and restart
```

History:

```text
Run #1 Raka — Cancelled
Run #2 Bima — Running
```

---

# 48. CHANGE INSTRUCTIONS MID-RUN

Gunakan:

```text
Add instruction
```

Bukan mengedit history prompt lama.

Contoh:

```text
New instruction:

"Jangan ubah migration.
Fokus hanya controller dan service."
```

Audit:

```text
Instruction added by Owner
20:03
```

---

# 49. RUNTIME VISIBILITY

Owner harus selalu dapat mengetahui:

```text
Is task actually running?
Where is it running?
What runtime?
What step?
```

Tampilkan badge:

```text
● Hermes
```

atau:

```text
○ Local
```

atau:

```text
○ Not Running
```

---

# 50. "ACTIVE RUNTIME" PANEL

Home dapat memiliki panel kecil:

```text
RUNTIME

Hermes
● Healthy

3 Active Runs

Raka   Fix auth
Bima   Backup
Maya   Report

[Open Runtime]
```

Tidak perlu membuka technical dashboard hanya untuk mengetahui agent aktif.

---

# 51. RUNTIME FAILURE

Jika Hermes mati:

```text
⚠ Runtime unavailable

3 tasks cannot continue.

[View affected work]
[Retry after recovery]
```

Jangan menyamarkan sebagai task biasa.

---

# 52. ACTIVE WORK DATA MODEL

Tambahkan computed read model:

```text
ActiveWorkItem
```

Field:

```text
taskId
taskTitle
projectId
projectName
workerId
workerName
taskStatus
runId
runStatus
progress
currentStep
runtime
path
startedAt
lastActivityAt
```

Tujuannya:

```text
Home
Active Work
Worker detail
Project detail
```

menggunakan satu source of truth.

---

# 53. DOMAIN MODEL YANG DIREKOMENDASIKAN

```text
Workspace
│
├── Workers
│
├── Projects
│    │
│    ├── Tasks
│    │    ├── Runs
│    │    ├── Results
│    │    └── Artifacts
│    │
│    └── Schedules
│         └── Task Instances
│
└── Reports / Activity
```

Assignment tetap ada secara internal:

```text
Task
 ↓
Assignment
 ↓
Run
```

tetapi tidak menjadi pusat navigasi.

---

# 54. TASK DATA MODEL REVISI

Task disarankan memiliki:

```ts
interface Task {
  id: string
  workspaceId: string
  projectId?: string

  title: string
  description: string

  type: 'one_time' | 'project' | 'recurring_instance'

  status:
    | 'draft'
    | 'todo'
    | 'in_progress'
    | 'waiting'
    | 'review'
    | 'done'
    | 'cancelled'

  priority: 'low' | 'medium' | 'high' | 'urgent'

  workerId?: string

  dueDate?: string

  scheduleId?: string

  parentTaskId?: string

  dependencyTaskIds?: string[]

  pathOverride?: string

  acceptanceCriteria?: string[]

  checklist: ChecklistItem[]

  activeRunId?: string

  latestRunId?: string

  createdAt: string
  updatedAt: string

  cancelledAt?: string
  cancelledBy?: string
  cancelReason?: string

  deletedAt?: string
  deletedBy?: string
  deleteReason?: string
}
```

---

# 55. PROJECT DATA MODEL REVISI

Tambahkan:

```ts
interface Project {
  ...
  path: string

  defaultWorkerId?: string

  repositoryUrl?: string
  branch?: string

  runtimeProfile?: string

  status:
    | 'draft'
    | 'active'
    | 'paused'
    | 'completed'
    | 'cancelled'
    | 'archived'
}
```

---

# 56. SCHEDULE DATA MODEL

```ts
interface Schedule {
  id: string

  projectId?: string

  taskTemplate: {
    title: string
    description: string
    workerId?: string
    priority: TaskPriority
    instructions?: string
  }

  recurrence:
    | 'once'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'cron'

  cronExpression?: string

  timezone: string

  enabled: boolean

  nextRunAt?: string
  lastRunAt?: string

  createdAt: string
  updatedAt: string
}
```

---

# 57. RUN DATA MODEL REVISI

Tetap gunakan model existing tetapi tambahkan:

```ts
runtimeName?: string
runtimeStatus?: 'healthy' | 'degraded' | 'offline'

workspacePath?: string

triggerType:
  | 'manual'
  | 'schedule'
  | 'retry'
  | 'dependency'

parentRunId?: string

cancelledAt?: string
cancelledBy?: string
cancelReason?: string

deletedAt?: string
deletedBy?: string
deleteReason?: string
```

---

# 58. EXECUTION CONTEXT

Sebelum Run dimulai, sistem membuat immutable snapshot:

```text
Execution Context
```

Berisi:

```text
Task
Worker
Project
Path
Instructions
Acceptance Criteria
Runtime
Schedule trigger
Relevant memory
Tools allowed
```

Tujuannya agar Run tetap reproducible.

---

# 59. "SETUP BEFORE START"

Sebelum execution, tampilkan mini preflight:

```text
READY TO RUN

Task
Fix authentication API

Worker
Raka

Project
Company API

Folder
C:/Projects/company-api

Runtime
Hermes

Access
✓ Read
✓ Write
✓ Execute

Criteria
✓ 4 criteria

[ Start Work ]
```

Ini harus sederhana.

---

# 60. RUN PRE-FLIGHT VALIDATION

System check:

```text
Project exists
Path exists
Worker active
Runtime healthy
Permission available
No conflicting run
Required configuration exists
```

Jika salah:

```text
Cannot start
Reason:
Folder does not exist
```

---

# 61. CONFLICT PROTECTION

Jangan menjalankan dua Run yang bentrok pada folder yang sama tanpa izin.

Contoh:

```text
Project:
Website

Run #4:
Deploy

Run #5:
Refactor backend
```

Jika keduanya mengakses path yang sama:

```text
Conflict detected
```

Owner memilih:

```text
Wait
Stop existing run
Allow concurrent
```

Default:

```text
Wait
```

---

# 62. ACTIVE WORK FILTER

Filter:

```text
All
Running
Waiting
Review
Overdue
Failed
Scheduled
```

Tambahan:

```text
Worker
Project
Runtime
```

---

# 63. SEARCH

Global search harus menemukan:

```text
Project
Task
Worker
Run
Artifact
Schedule
```

Contoh:

```text
"authentication"
```

hasil:

```text
Task
Project
Run #3
Artifact auth.ts
```

---

# 64. ACTIVITY

Activity tetap dipertahankan, tetapi lebih berguna bila berorientasi business events:

```text
Raka started "Fix auth API"
Owner changed worker to Bima
Hermes completed run #4
Marketing report generated
Project folder changed
Task cancelled
```

---

# 65. REPORT FILTER

Semua laporan memiliki filter:

```text
Date
Project
Worker
Task type
Status
```

Opsional:

```text
Runtime
```

---

# 66. REPORT EXPORT

Semua report dapat:

```text
Export CSV
Export PDF
```

Namun tombol export tidak boleh mendominasi UI.

---

# 67. OWNER OVERVIEW

Owner dashboard khusus tidak perlu berbeda page.

Home sudah cukup jika memiliki:

```text
Active Work
Attention
Today
Performance
```

---

# 68. WORKER VIEW

Klik worker:

```text
Raka

CURRENT
Fix authentication API

TODAY
3 tasks

THIS WEEK
12 completed

RUNS
19

SUCCESS
84%

COST
$7.20
```

---

# 69. PROJECT VIEW

Klik project:

```text
Website

72%

ACTIVE
2

WAITING
1

REVIEW
1

SCHEDULED
3

COST
$18.40

PATH
C:/Projects/website
```

---

# 70. MINIMAL UI RULES

Setiap halaman harus bisa menjawab:

```text
What?
Who?
Where?
When?
Status?
What next?
```

Jangan memaksa user membuka 5 halaman.

---

# 71. WHAT NOT TO SHOW BY DEFAULT

Hide/secondary:

```text
Raw tokens
Provider IDs
Internal runtime contracts
Memory IDs
Assignment IDs
Repository internals
Low-level event payload
Failure classifier code
Retry policy internals
Sandbox internals
```

Semua tetap tersedia di advanced detail.

---

# 72. ADVANCED MODE

Tambahkan toggle:

```text
Simple
Advanced
```

Simple:

```text
Task
Worker
Project
Status
Progress
Result
```

Advanced:

```text
Run
Runtime
Telemetry
Memory
Verification
Tools
Events
Audit
```

Default:

```text
Simple
```

---

# 73. MOBILE / RESPONSIVE

Mobile navigation:

```text
Home
Work
Projects
Workers
More
```

Desktop navigation:

```text
Home
Work
Projects
Workers
Reports
Activity
Settings
```

---

# 74. SPRINT / IMPLEMENTATION PRIORITY

## PRIORITY 1 — Core Business Flow

- [ ] Simplify Home
- [ ] Add Active Work
- [ ] Simplify Task creation
- [ ] Project setup/path
- [ ] Worker visibility
- [ ] Task detail as central page
- [ ] Stop/Cancel/Edit actions
- [ ] Run history

## PRIORITY 2 — Scheduling

- [ ] Schedule entity
- [ ] Recurring task
- [ ] Calendar integration
- [ ] Scheduled task history

## PRIORITY 3 — Reports

- [ ] Work report
- [ ] Project report
- [ ] Cost report
- [ ] Agent report

## PRIORITY 4 — Cleanup

- [ ] Soft delete
- [ ] Trash
- [ ] Archive
- [ ] Run cleanup
- [ ] Artifact cleanup

## PRIORITY 5 — Advanced Agent Visibility

- [ ] Hermes status
- [ ] Tool events
- [ ] Verification
- [ ] Telemetry
- [ ] Memory references

---

# 75. OLD → NEW UI MAPPING

## Existing

```text
Overview
Calendar
Files
Projects
Tasks
Runs
Reviews
Workforce
Governance
Notifications
Settings
```

## Proposed

```text
Home
Work
Projects
Workers
Reports
Activity
Settings
```

Advanced:

```text
Runs
Schedules
Files
Reviews
Governance
Skills
Tools
Memory
```

---

# 76. IMPLEMENTATION RULE

Jangan membuat ulang aplikasi dari nol.

Gunakan fondasi yang sudah ada:

```text
Pinia stores
Repositories
RuntimeFactory
HermesClient
VerificationEngine
ResultIngestor
Activity
Notification
Workspace
Project
Task
Employee
```

Fokus perubahan:

```text
Domain refinement
+
Read model
+
UI simplification
+
Lifecycle correctness
```

---

# 77. REFACTOR AREA DARI CODE SAAT INI

Beberapa bagian yang harus diperiksa:

### `Task`
Saat ini task terlalu cepat menggabungkan:

```text
assignee
activeRun
assignment
```

Perjelas ownership:

```text
Task
  ↓
Assignment
  ↓
Run
```

UI tetap menyederhanakan menjadi:

```text
Worker: Raka
```

---

### `AgentRun`
Saat ini sudah menjadi pusat runtime.

Pertahankan:

```text
telemetry
logs
verification
memory
runtime
```

namun jadikan advanced detail.

---

### `Project.path`
Sudah ada dan harus dijadikan first-class configuration.

Jangan menggunakan hard-coded fallback untuk production.

---

### `Task status`
Status business dan status runtime harus dipisahkan.

```text
Task Status
```

vs

```text
Run Status
```

---

# 78. REQUIRED ACTION MATRIX

| Entity | Edit | Stop | Cancel | Archive | Delete |
|---|---:|---:|---:|---:|---:|
| Project | ✓ | - | ✓ | ✓ | limited |
| Task | ✓ | - | ✓ | ✓ | ✓ if safe |
| Schedule | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assignment | ✓ | - | ✓ | - | limited |
| Run | limited | ✓ | ✓ | ✓ | ✓ if failed/cancelled |
| Artifact | metadata | - | - | ✓ | ✓ if safe |

---

# 79. DELETE RULES

## Safe Delete

Allowed:

```text
Draft
Cancelled
Failed
Test data
Duplicate
Orphan
```

## Archive Instead

Use archive for:

```text
Completed Project
Completed Task
Successful Run history
Important Artifact
```

## Protected

Do not delete automatically:

```text
Audit
approved result
financial evidence
cost record
security event
```

---

# 80. "WHAT IS RUNNING IN HERMES?"

Tambahkan global indicator:

```text
SATRIA

● Hermes Healthy
3 active runs
```

Click:

```text
Active Runtime
```

opens:

```text
Hermes
3 active

Raka — Fix API — 82%
Bima — Backup — 45%
Maya — Report — Waiting
```

---

# 81. GLOBAL COMMANDS

Command palette:

```text
New Task
New Project
Show Active Work
Show Running
Show Waiting
Show Failed
Show Scheduled
Show Reports
Search anything
```

Advanced:

```text
Open Hermes
Open Runs
Open Governance
```

---

# 82. BUSINESS EXAMPLE END-TO-END

Owner membuat:

```text
Project:
Marketing Automation

Path:
/projects/marketing
```

Kemudian membuat:

```text
Task:
Generate weekly marketing report
```

Memilih:

```text
Worker:
Maya
```

Schedule:

```text
Every Monday 08:00
```

System menyimpan:

```text
Schedule
  ↓
Task Template
```

Senin:

```text
Task Instance #1
  ↓
Assignment
  ↓
Run #1
  ↓
Hermes
  ↓
Result
  ↓
Review
  ↓
Done
```

Minggu berikutnya:

```text
Task Instance #2
```

Bukan mengubah Task #1.

---

# 83. BUSINESS EXAMPLE — CHANGE MID-RUN

Task:

```text
Build landing page
Worker:
Raka
```

Run aktif:

```text
82%
```

Owner melihat hasil sementara lalu berkata:

```text
"Jangan lanjut desain bagian pricing.
Fokus hero section."
```

System:

```text
Owner adds instruction
        ↓
Current Run continues / stops depending on change type
        ↓
New execution context
        ↓
Audit recorded
```

Jika perubahan besar:

```text
Stop Run #1
Create Run #2
```

---

# 84. BUSINESS EXAMPLE — CANCEL

Owner membatalkan project.

System:

```text
Project Cancelled
        ↓
Find active tasks
        ↓
Stop active runs
        ↓
Disable schedules
        ↓
Tasks → Cancelled
        ↓
Audit
```

Tidak boleh ada Hermes process yang tertinggal.

---

# 85. BUSINESS EXAMPLE — DELETE

Mock test membuat:

```text
Run #999
Failed
```

Owner:

```text
Delete
```

System:

```text
deletedAt
deletedBy
deleteReason
```

Run hilang dari UI utama.

Audit:

```text
Run #999 deleted by Owner
Reason:
Test run
```

---

# 86. TEST SCENARIOS WAJIB

## Scenario 1
Create Project → path valid → create task → run.

## Scenario 2
Create Task → assign worker → change worker before start.

## Scenario 3
Run active → edit instruction.

## Scenario 4
Run active → stop.

## Scenario 5
Run failed → retry.

## Scenario 6
Task cancelled → active run cancelled automatically.

## Scenario 7
Recurring schedule → task instance generated.

## Scenario 8
Project cancelled → schedules disabled.

## Scenario 9
Cancelled run → delete.

## Scenario 10
Completed project → archive, not delete.

## Scenario 11
Home shows all active work across workers.

## Scenario 12
Run shows real project path.

---

# 87. ACCEPTANCE CRITERIA UTAMA

Implementasi dianggap berhasil bila owner dapat melakukan ini tanpa memahami internal agent architecture:

```text
1. Buat project.
2. Tentukan folder.
3. Buat task.
4. Pilih worker.
5. Jalankan sekarang atau jadwalkan.
6. Lihat progress.
7. Buka detail.
8. Lihat Hermes/runtime.
9. Ubah instruksi.
10. Ganti worker.
11. Stop run.
12. Cancel task.
13. Retry.
14. Lihat hasil.
15. Lihat file/artifact.
16. Lihat biaya.
17. Lihat history.
18. Hapus cancelled/failed run.
19. Archive pekerjaan lama.
20. Melihat semua pekerjaan aktif dalam satu layar.
```

---

# 88. DESIGN PRINCIPLE FINAL

SATRIA tidak boleh terasa seperti:

```text
"AI Runtime Management Console"
```

SATRIA harus terasa seperti:

```text
"WORK MANAGER YANG PUNYA 4 DIGITAL WORKERS"
```

UI utama:

```text
Apa pekerjaannya?
Siapa yang mengerjakan?
Di project mana?
Di folder mana?
Kapan?
Sedang apa?
Hasilnya apa?
```

Advanced layer:

```text
Hermes
Runtime
Tools
Memory
Verification
Telemetry
Audit
```

---

# 89. TARGET INFORMATION ARCHITECTURE FINAL

```text
SATRIA
│
├── HOME
│   ├── Active Work
│   ├── Attention
│   ├── Today
│   └── Runtime
│
├── WORK
│   ├── Active Work
│   ├── Tasks
│   └── Calendar
│
├── PROJECTS
│   ├── Project List
│   └── Project Detail
│       ├── Tasks
│       ├── Schedules
│       ├── Files
│       ├── Cost
│       └── Settings
│
├── WORKERS
│   ├── 4 Workers
│   └── Worker Detail
│       ├── Current Work
│       ├── History
│       ├── Runs
│       └── Performance
│
├── REPORTS
│   ├── Work
│   ├── Project
│   ├── Cost
│   ├── Agent
│   └── Schedule
│
├── ACTIVITY
│
└── SETTINGS
    └── ADVANCED
        ├── Runs
        ├── Runtime
        ├── Files
        ├── Governance
        ├── Skills
        ├── Tools
        └── Memory
```

---

# 90. FINAL PRODUCT FLOW

Alur utama yang menjadi dasar seluruh implementasi:

```text
CREATE PROJECT
      ↓
PROJECT SETUP
      ↓
PATH / REPOSITORY / DEFAULT WORKER
      ↓
CREATE TASK
      ↓
ONE-TIME / PROJECT / RECURRING
      ↓
SELECT WORKER
      ↓
PREFLIGHT
      ↓
RUN NOW / SCHEDULE
      ↓
ACTIVE WORK
      ↓
HERMES / AGENT RUNTIME
      ↓
PROGRESS + EVENTS
      ↓
RESULT
      ↓
VERIFICATION
      ↓
REVIEW
      ↓
DONE
```

Kontrol owner dapat masuk kapan saja:

```text
EDIT
CHANGE WORKER
ADD INSTRUCTION
STOP
CANCEL
RETRY
ARCHIVE
DELETE SAFE DATA
```

Dan semua kejadian menghasilkan:

```text
ACTIVITY
AUDIT
HISTORY
```

---

# 91. HASIL AKHIR YANG DIHARAPKAN

Dengan rancangan ini, owner cukup membuka Home dan dapat langsung mengetahui:

```text
4 workers

Raka
→ Fix API
→ 82%
→ Hermes
→ /projects/api

Bima
→ Database Backup
→ 45%
→ Hermes
→ /projects/infrastructure

Maya
→ Weekly Marketing Report
→ Waiting

Deni
→ QA Landing Page
→ Review
```

Tanpa harus masuk ke:

```text
Assignment page
Run page
Telemetry page
Governance page
Workforce page
```

kecuali memang ingin melihat detail teknis.

**Kesimpulan desain:**
Sederhanakan permukaan UI, bukan sistem di belakangnya.

Backend/runtime tetap boleh kompleks:
```text
Task
Assignment
Run
Hermes
Verification
Memory
Telemetry
Artifacts
Audit
```

Tetapi pengalaman owner harus sesederhana:
```text
WORK → WHO → WHERE → STATUS → RESULT → CONTROL
```

---

# 92. IMPLEMENTATION COMMAND FOR AI CODER

Gunakan dokumen ini sebagai specification untuk melakukan refactor terhadap source code yang sudah ada.

Aturan:

1. Jangan menghapus runtime/Hermes/verification yang sudah bekerja.
2. Jangan membuat ulang architecture dari nol.
3. Reuse existing repositories, Pinia stores, runtime adapters, verification engine, activity, notification, dan project/task/employee domain.
4. Prioritaskan perubahan UX dan business orchestration.
5. Pisahkan domain Task Status dan Run Status.
6. Jadikan Project Path sebagai konfigurasi first-class.
7. Tambahkan Schedule domain.
8. Tambahkan Active Work read model.
9. Tambahkan safe delete + soft delete + archive.
10. Pastikan perubahan task/worker/path saat runtime tercatat sebagai audit/event.
11. Pastikan cancel task menghentikan active run dan schedule yang relevan.
12. Pastikan run retry membuat Run baru.
13. Pastikan task detail menjadi pusat informasi pekerjaan.
14. Jangan menampilkan chain-of-thought.
15. Default UI harus Simple; Advanced hanya bila dibutuhkan.
16. Jangan menambah halaman hanya demi memindahkan data yang sebenarnya dapat ditampilkan pada detail drawer/tab.
17. Pertahankan responsiveness.
18. Setelah implementasi, jalankan typecheck, unit test, integration test, dan E2E journey untuk seluruh lifecycle.

---

# 93. DEFINITION OF DONE

Refactor dinyatakan selesai apabila:

```text
✓ Home menjawab "apa yang sedang dikerjakan sekarang?"
✓ Semua 4 worker terlihat statusnya.
✓ Task dapat dibuat dengan form singkat.
✓ Project wajib punya path sebelum agentic execution.
✓ Task dapat dijalankan manual atau terjadwal.
✓ Recurring task menghasilkan task instance baru.
✓ Owner dapat edit task.
✓ Owner dapat ganti worker.
✓ Owner dapat menambah instruksi di tengah jalan.
✓ Owner dapat stop run.
✓ Owner dapat cancel task.
✓ Cancel task menghentikan active run.
✓ Retry membuat run baru.
✓ Run detail menunjukkan runtime/Hermes.
✓ Run detail menunjukkan project path.
✓ Result/artifact dapat dibuka.
✓ Report biaya mudah dibaca.
✓ Report project mudah dibaca.
✓ Active work terlihat dalam satu halaman.
✓ Cancelled/failed run dapat dihapus dengan aman.
✓ Completed project/task menggunakan archive.
✓ Audit trail tetap tersedia.
✓ No hardcoded production workspace path.
✓ Task dan Run state tidak tercampur.
✓ UI default tetap sederhana.
```

---

## END OF SPECIFICATION
