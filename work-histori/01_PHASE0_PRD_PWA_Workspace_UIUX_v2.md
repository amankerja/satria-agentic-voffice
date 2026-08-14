# PRD — SATRIA AI WORKFORCE
## PWA Web Workspace / Workshop UI-UX
### Phase 0 — Visual Workspace Only

**Version:** 2.0  
**Date:** 14 August 2026  
**Status:** UI/UX Foundation — No Agent Runtime

---

# 1. Executive Summary

**SATRIA AI WORKFORCE** adalah sebuah **PWA web workspace** yang menjadi "kantor digital" untuk mengelola pekerjaan berbasis AI di masa depan.

Pada fase ini, produk **hanya membangun wadah / workspace / workshop visual**.

Tidak ada implementasi:

- AI Agent runtime
- LLM
- orchestration
- memory engine
- tool execution
- autonomous workflow
- Hermes Agent integration
- Discord integration
- real AI execution

Fokus utama fase ini:

> **Membangun pengalaman UI/UX yang terasa seperti sebuah digital headquarters / AI operations workspace yang modern, profesional, cepat, dan siap diisi oleh agent pada fase berikutnya.**

---

# 2. Product Vision

## Tagline

**SATRIA AI WORKFORCE**  
**Your Digital Workforce Command Center**

## Konsep

Bayangkan kombinasi:

- AI operations dashboard
- digital company workspace
- project management
- mission control
- employee workspace
- personal productivity OS

Tetapi untuk tahap ini, semuanya masih berupa **wadah visual dan mock data**.

---

# 3. Product Goal

MVP UI harus membuat pengguna merasa:

> "Ini adalah kantor tempat seluruh pekerjaan digital saya akan dikelola."

Pengguna harus dapat:

- melihat workspace
- melihat ringkasan aktivitas
- melihat pekerjaan
- melihat proyek
- melihat resource
- melihat activity
- membuat project
- membuat task
- mengatur workspace
- berpindah workspace
- melihat status sistem

Tanpa bergantung pada agent runtime.

---

# 4. Design Philosophy

## 4.1 Core Principle

**Calm, premium, operational.**

UI harus terlihat:

- premium
- modern
- profesional
- minimal
- technical
- data-rich
- mudah dipindai
- tidak ramai

## 4.2 Hindari

- neon berlebihan
- cyberpunk
- dashboard seperti game
- terlalu banyak glassmorphism
- terlalu banyak gradient
- terlalu banyak border
- animasi berlebihan
- card spam

## 4.3 Visual Direction

Arah visual:

**Apple-like simplicity + Linear-like productivity + modern AI operations console.**

Bukan meniru desain produk tertentu, tetapi mengambil prinsip:

- clean hierarchy
- strong spacing
- focused typography
- subtle surfaces
- clear state
- fast interaction

---

# 5. Target User

### Primary

Owner / developer / operator yang akan menggunakan SATRIA sebagai pusat pekerjaan digital.

### Secondary

Tim kecil yang kelak akan menggunakan workspace bersama.

---

# 6. Platform

Target:

- Desktop Browser
- Tablet
- Mobile Browser
- Installable PWA

Desktop adalah primary experience.

Mobile adalah operational companion.

---

# 7. Responsive Breakpoints

### Mobile
360–767px

### Tablet
768–1199px

### Desktop
1200–1599px

### Large Desktop
1600px+

Desktop layout harus memanfaatkan ruang lebar tetapi tetap memiliki max content width agar tidak terasa kosong.

---

# 8. PWA Product Requirements

## Wajib

- manifest.json
- service worker
- installable
- standalone mode
- icons
- splash / launch experience
- offline shell
- responsive
- theme color
- browser install support

## Offline Phase 0

Tanpa backend:

- UI tetap terbuka
- mock data tetap tersedia
- navigation tetap berjalan
- draft dapat disimpan lokal
- theme preference tersimpan

---

# 9. Brand System

## Brand

**SATRIA AI WORKFORCE**

## Brand Personality

- Smart
- Calm
- Precise
- Reliable
- Technical
- Human-friendly

## Logo Area

Header/sidebar harus memiliki:

**SATRIA**

small descriptor:

**AI WORKFORCE**

Jangan memakai logo besar yang memakan ruang.

---

# 10. Color System

## Base

Gunakan neutral dark-first system.

### Background
Deep neutral gray / near-black.

### Surface
Layered neutral surfaces.

### Primary
Emerald / green.

### Secondary
Muted cyan / slate.

### Success
Green.

### Warning
Amber.

### Error
Red.

### Text

Primary:
high contrast.

Secondary:
muted gray.

Tertiary:
low contrast but still accessible.

---

# 11. Theme

## Dark Mode — Default

Untuk:

- command center
- technical workspace
- monitoring
- long sessions

## Light Mode

Untuk:

- office usage
- documentation
- daytime use

User dapat switch theme.

---

# 12. Typography

Recommended:

**Inter / Geist / Manrope**

## Typography hierarchy

Display:
32–40px

Page title:
24–30px

Section:
18–22px

Body:
14–16px

Caption:
12–13px

Technical:
Monospace

---

# 13. Spacing System

Gunakan spacing scale konsisten.

Base:

4px

Scale:

4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64

Gunakan whitespace sebagai elemen desain utama.

---

# 14. Radius

Gunakan radius moderat.

Small:
8px

Medium:
12px

Large:
16px

Pills:
999px

Jangan semua komponen menggunakan radius besar.

---

# 15. Shadow & Elevation

Gunakan elevation sangat halus.

Layer:

- base
- surface
- elevated
- modal

Hindari shadow berat.

Dark mode lebih banyak menggunakan surface contrast daripada shadow.

---

# 16. Global Layout

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR                                                       │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│ SIDEBAR       │              WORKSPACE                       │
│               │                                              │
│               │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

---

# 17. Sidebar

## Primary Navigation

### Overview
Dashboard utama.

### Workspace
Ruang kerja utama.

### Tasks
Seluruh pekerjaan.

### Projects
Project aktif.

### Files
Dokumen/artifact workspace.

### Activity
Riwayat aktivitas.

### Calendar
Jadwal / timeline kerja.

### Reports
Ringkasan performa workspace.

### Settings
Pengaturan.

---

# 18. Sidebar Secondary

Di bawah primary nav:

### Workspace

```text
Personal
Development
Business
```

User dapat:

- switch
- create
- rename

---

# 19. Sidebar State

### Expanded

Menampilkan:

icon + label.

### Collapsed

Menampilkan:

icon only.

Tooltip wajib tersedia.

State tersimpan di local storage.

---

# 20. Mobile Navigation

Bottom navigation:

```text
Home
Workspace
Tasks
Activity
More
```

More berisi:

- Projects
- Files
- Calendar
- Reports
- Settings

---

# 21. Topbar

Topbar berisi:

Left:

- breadcrumb
- page title

Center:

- command/search

Right:

- connection indicator
- notifications
- theme
- profile

---

# 22. Global Command Bar

Shortcut:

**Ctrl + K**

Mobile:

search button.

Placeholder:

> Search workspace, projects, tasks...

Phase 0 tidak menjalankan AI.

Command bar digunakan untuk:

- navigate
- search
- create item
- switch workspace

Contoh:

```text
Go to Projects
Create Task
Open CRM Project
Search "login"
Switch to Development
```

---

# 23. Overview Dashboard

Dashboard bukan sekadar kumpulan card.

Struktur:

```text
Greeting
Command bar
Today overview
Workspace health
Current work
Recent projects
Activity
Quick actions
```

---

# 24. Dashboard Header

Contoh:

```text
Good morning, Satria

Friday, 14 August 2026

[ Search your workspace... ]
```

Di bawahnya:

quick actions:

- New Task
- New Project
- Open Workspace
- Upload File

---

# 25. KPI / Summary

Gunakan 4–5 metric saja.

### Active Tasks
Pekerjaan aktif.

### Due Today
Deadline hari ini.

### Projects
Project berjalan.

### Activity
Aktivitas hari ini.

### Attention
Item yang membutuhkan perhatian.

Setiap KPI dapat diklik.

---

# 26. Today Workspace

Section utama:

**Today**

Berisi:

- tasks due today
- recent activity
- upcoming schedule
- important items

Tujuannya menjawab:

> "Apa yang perlu saya perhatikan sekarang?"

---

# 27. Workspace Health

Jangan menggunakan istilah health yang terlalu teknis.

Contoh:

```text
Workspace Status

Tasks
Healthy

Projects
On Track

Storage
42%

Activity
Normal
```

Gunakan status:

- Good
- Attention
- Warning

---

# 28. Current Work

Tampilkan pekerjaan yang sedang berjalan.

Mock:

```text
Website redesign
██████████████░░ 82%

CRM API
██████████░░░░░ 61%

Marketing campaign
██████░░░░░░░░░ 34%
```

Pada fase ini semua data adalah mock/manual.

---

# 29. Project Showcase

Gunakan project cards.

Card:

```text
CRM SaaS
Backend platform

Progress 72%

12 tasks
4 contributors

Updated 12 min ago
```

Visual:

- project icon
- title
- description
- progress
- task count
- last update

---

# 30. Project Page

Header:

```text
CRM SaaS
Backend platform

[Open] [More]
```

Tabs:

- Overview
- Tasks
- Files
- Activity
- Calendar

---

# 31. Project Overview

Isi:

### Progress

progress bar.

### Summary

description.

### Key Metrics

- tasks
- completed
- overdue
- activity

### Recent Work

list.

---

# 32. Task System

Task adalah unit pekerjaan manusia pada Phase 0.

Task tidak perlu terhubung ke AI.

## Task fields

- title
- description
- status
- priority
- project
- assignee
- deadline
- tags
- created_at
- updated_at

---

# 33. Task Views

Sediakan:

### List View

Untuk scanning cepat.

### Board View

Kanban.

### Calendar View

Deadline / timeline.

User dapat switch view.

---

# 34. Task Status

```text
Backlog
In Progress
Blocked
Review
Done
```

Gunakan status warna yang konsisten.

---

# 35. Task Card

```text
Fix authentication UI

CRM SaaS

In Progress

████████░░ 76%

Due today

Satria
```

Actions:

- open
- edit
- duplicate
- archive

---

# 36. Task Detail

Panel:

- title
- description
- project
- status
- priority
- deadline
- assignee
- checklist
- comments
- activity

Future AI fields dapat ditambahkan nanti tetapi **jangan ditampilkan pada Phase 0**.

---

# 37. Workspace Page

Halaman Workspace adalah halaman inti.

Konsep:

> satu ruang kerja yang berisi seluruh aset pekerjaan.

Isi:

```text
Workspace Header
 ↓
Summary
 ↓
Projects
 ↓
Tasks
 ↓
Files
 ↓
Activity
```

---

# 38. Workspace Switcher

User dapat memiliki:

```text
Personal
Development
Business
Sandbox
```

Dropdown:

```text
Current Workspace
SATRIA Personal

Switch Workspace

Personal
Development
Business

+ New Workspace
```

---

# 39. Files

File manager ringan.

View:

- Grid
- List

Kategori:

- Documents
- Images
- Exports
- Archives

Card / row:

- filename
- type
- size
- modified
- location

---

# 40. Activity Center

Timeline:

```text
10:32
Created task "Fix login UI"

10:41
Uploaded API specification

11:05
Updated CRM project

11:20
Completed task "Landing page"
```

Filter:

- type
- project
- date

---

# 41. Calendar

Phase 0 calendar visual.

View:

- day
- week
- month

Menampilkan:

- deadlines
- scheduled work
- reminders

Tidak ada autonomous scheduling.

---

# 42. Reports

Phase 0 menampilkan workspace metrics.

Contoh:

- tasks completed
- overdue tasks
- projects progress
- activity volume
- productivity trend

Visual:

- bar chart
- line chart
- progress indicators

Jangan membuat dashboard analytics terlalu kompleks.

---

# 43. Notifications

Notification drawer:

```text
Updates

Project updated
New task assigned
Deadline approaching
File uploaded
```

Priority:

- normal
- important
- critical

---

# 44. Empty States

Setiap page harus memiliki empty state.

Contoh:

```text
No projects yet

Create your first workspace project
to organize your work.

[Create Project]
```

Empty state tidak boleh terasa seperti error.

---

# 45. Loading States

Gunakan skeleton.

Hindari spinner besar di tengah layar kecuali full-page transition.

---

# 46. Offline State

Banner kecil:

```text
You're offline
Showing the latest saved workspace.
```

Jangan menghalangi aplikasi.

---

# 47. Quick Create

Tombol global:

**+ New**

Menu:

```text
New Task
New Project
New Workspace
Upload File
```

Mobile menggunakan floating action button bila cocok.

---

# 48. Workspace Preferences

User dapat mengatur:

- theme
- compact mode
- start page
- sidebar behavior
- default task view
- notification preferences
- timezone

---

# 49. Settings Structure

```text
Settings
├── General
├── Appearance
├── Workspace
├── Notifications
├── Keyboard Shortcuts
├── Security
└── About
```

Untuk Phase 0, backend security setting hanya placeholder UI bila belum diperlukan.

---

# 50. Profile

Profile:

- avatar
- display name
- email
- timezone
- language
- theme

---

# 51. Onboarding

First launch:

### Step 1
Welcome.

### Step 2
Create first workspace.

### Step 3
Choose workspace type:

- Personal
- Development
- Business

### Step 4
Show dashboard tour.

### Step 5
Finish.

Tidak perlu membuat agent.

---

# 52. Design System Components

Komponen minimum:

### Navigation
- Sidebar
- Topbar
- Breadcrumb
- Bottom navigation

### Controls
- Button
- Input
- Search
- Select
- Checkbox
- Switch
- Tabs
- Segmented control

### Data
- Card
- Table
- List
- Timeline
- Progress
- Badge
- Avatar

### Feedback
- Toast
- Alert
- Modal
- Drawer
- Tooltip
- Skeleton
- Empty state

### Workspace
- ProjectCard
- TaskCard
- FileItem
- ActivityItem
- CalendarItem
- KPI

---

# 53. Layout Components

Komponen layout:

```text
AppShell
Sidebar
Topbar
PageHeader
PageContainer
Section
CardGrid
SplitPane
Drawer
Modal
BottomNav
```

Semua page harus menggunakan layout system yang sama.

---

# 54. Interaction Rules

## Click behavior

Cards dapat clickable jika memang memiliki detail.

## Hover

Gunakan subtle surface change.

## Active

Harus terlihat jelas.

## Destructive

Delete/archive harus memakai confirmation.

---

# 55. Animation Rules

Animation harus:

- cepat
- halus
- fungsional

Durasi:

100–250ms.

Gunakan animation untuk:

- modal
- drawer
- page transition ringan
- progress
- toast

Tidak gunakan:

- full-screen flashy animation
- constant background movement
- excessive pulse

---

# 56. Accessibility

Minimal:

- WCAG AA target
- keyboard navigation
- focus ring
- aria labels
- semantic HTML
- sufficient contrast
- reduced motion

---

# 57. Performance

Target:

Lighthouse:

- Performance ≥ 90
- Accessibility ≥ 90
- Best Practices ≥ 90

PWA installable.

UI initial load cepat.

Gunakan:

- route-based lazy loading
- image optimization
- code splitting
- virtual list untuk data besar

---

# 58. Frontend Stack

## Recommended

Vue 3  
TypeScript  
Vite  
Vue Router  
Pinia  
Tailwind CSS  
Reka UI / Headless UI  
vite-plugin-pwa  
Vitest  
Playwright

Tidak perlu backend AI pada Phase 0.

---

# 59. Data Layer

Phase 0 menggunakan:

**Mock Repository Pattern**

Interface:

```text
WorkspaceRepository
ProjectRepository
TaskRepository
FileRepository
ActivityRepository
CalendarRepository
NotificationRepository
```

Mock data:

```text
src/mocks/
```

Tujuannya agar nanti mudah diganti dengan API.

---

# 60. Folder Structure

```text
src/
├── app/
├── layouts/
│   ├── AppShell
│   └── AuthLayout
│
├── pages/
│   ├── overview/
│   ├── workspace/
│   ├── tasks/
│   ├── projects/
│   ├── files/
│   ├── activity/
│   ├── calendar/
│   ├── reports/
│   ├── settings/
│   └── auth/
│
├── components/
│   ├── ui/
│   ├── workspace/
│   ├── project/
│   ├── task/
│   ├── activity/
│   └── calendar/
│
├── stores/
├── composables/
├── repositories/
├── mocks/
├── types/
├── router/
├── pwa/
└── assets/
```

---

# 61. Mock Dataset

Minimal:

## Workspaces

- Personal
- Development
- Business

## Projects

- SATRIA AI Workforce
- CRM SaaS
- Marketing System
- Internal Operations

## Tasks

20+ tasks.

Beragam:

- Backlog
- In Progress
- Blocked
- Review
- Done

## Files

20+ file records.

## Activities

50+ timeline records.

## Notifications

10+ records.

---

# 62. Required Screens

## Authentication

1. Splash
2. Login
3. Create Account
4. Forgot Password
5. Onboarding

## Main

6. Overview
7. Workspace
8. Tasks
9. Task Detail
10. Projects
11. Project Detail
12. Files
13. Activity
14. Calendar
15. Reports
16. Notifications
17. Settings
18. Profile

---

# 63. Critical Screens for First Demo

Untuk demo pertama jangan membangun 18 halaman sekaligus.

Urutan prioritas:

### Priority 1

1. App Shell
2. Overview
3. Workspace
4. Projects
5. Tasks

### Priority 2

6. Task Detail
7. Project Detail
8. Activity

### Priority 3

9. Files
10. Calendar
11. Reports
12. Settings

---

# 64. First Demo Flow

User membuka SATRIA.

```text
Login
 ↓
Onboarding
 ↓
Create Personal Workspace
 ↓
Overview
 ↓
See today's work
 ↓
Open project
 ↓
Open task
 ↓
Update task
 ↓
Return dashboard
```

Demo ini harus terasa lengkap meskipun seluruh data masih mock.

---

# 65. No-Agent Rule

Fase ini secara eksplisit **tidak menampilkan fitur agent**.

Jangan menampilkan:

- AI employee
- Agent runtime
- Model selection
- Skill agent
- Tool agent
- Memory agent
- Hermes
- Discord
- orchestration
- autonomous execution

Alasannya:

> UI pertama harus menyelesaikan fondasi workspace sebelum konsep workforce AI dimasukkan.

Nanti menu **Workforce** dapat ditambahkan pada Phase 1 setelah workspace foundation stabil.

---

# 66. Navigation Evolution

### Phase 0

```text
Overview
Workspace
Tasks
Projects
Files
Activity
Calendar
Reports
Settings
```

### Future Phase 1

Tambahkan:

```text
Workforce
Agents
Skills
Tools
Approvals
```

### Future Phase 2+

Tambahkan:

```text
Workflows
Memory
Runs
Automation
```

Nav harus dirancang supaya mudah berkembang tanpa redesign besar.

---

# 67. Acceptance Criteria

Phase 0 selesai apabila:

### AC-01
UI desktop lengkap dan konsisten.

### AC-02
UI mobile responsive.

### AC-03
PWA dapat di-install.

### AC-04
Sidebar dan navigation berfungsi.

### AC-05
Workspace switcher berfungsi dengan mock data.

### AC-06
Dashboard menampilkan data mock yang realistis.

### AC-07
Task dapat dibuat, diedit, dipindahkan status.

### AC-08
Project dapat dibuat dan dibuka.

### AC-09
File dapat ditampilkan.

### AC-10
Activity timeline tampil.

### AC-11
Calendar tampil.

### AC-12
Search / Ctrl+K berfungsi.

### AC-13
Dark/light theme berfungsi.

### AC-14
Loading / empty / offline / error states tersedia.

### AC-15
Tidak ada ketergantungan terhadap AI runtime.

---

# 68. Quality Gate

Sebelum Phase 0 dianggap selesai:

### Visual QA

- alignment
- spacing
- typography
- responsive
- status colors
- no layout overflow

### UX QA

- navigation intuitive
- task flow mudah
- no dead-end
- clear CTA
- mobile usable

### PWA QA

- install
- launch
- offline
- manifest
- service worker

### Accessibility QA

- keyboard
- focus
- contrast
- semantic elements

### Performance QA

- lighthouse
- route loading
- asset optimization

---

# 69. Future Integration Contract

UI harus siap menerima data dari backend menggunakan konsep:

```text
Workspace
Project
Task
File
Activity
Notification
User
```

Jangan membuat UI bergantung pada bentuk data mock yang terlalu spesifik.

---

# 70. Product Boundary

Phase 0 product boundary:

```text
                SATRIA AI WORKFORCE

┌──────────────────────────────────────────────┐
│                                              │
│          WORKSPACE / DIGITAL OFFICE          │
│                                              │
│   Projects    Tasks    Files    Activity     │
│                                              │
│   Calendar    Reports   Settings             │
│                                              │
└──────────────────────────────────────────────┘

             AI LAYER = NOT YET
```

---

# 71. Future Architecture Hook

Setelah UI shell selesai:

```text
PWA UI
   ↓
API
   ↓
Workspace Backend
   ↓
Task Engine
   ↓
Agent Runtime
   ↓
AI / Tools / Memory
```

UI tidak perlu dirombak.

---

# 72. Final Visual Target

```text
┌──────────────────────────────────────────────────────────────────────┐
│ SATRIA                                  🔍 Search    🔔   S         │
├───────────────┬──────────────────────────────────────────────────────┤
│               │                                                      │
│ Overview      │  Good morning, Satria                               │
│               │  Friday, 14 August                                  │
│ Workspace     │                                                      │
│               │  ┌────────────────────────────────────────────────┐  │
│ Tasks         │  │ Search your workspace...                      │  │
│               │  └────────────────────────────────────────────────┘  │
│ Projects      │                                                      │
│               │  Today                                               │
│ Files         │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│               │  │ 12      │ │ 4       │ │ 4       │ │ 2       │ │
│ Activity      │  │ Tasks   │ │ Due     │ │Projects │ │Attention│ │
│               │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
│ Calendar      │                                                      │
│               │  Current Work                                       │
│ Reports       │  ┌───────────────────────────────────────────────┐  │
│               │  │ CRM SaaS                  ███████████░ 82%   │  │
│ Settings      │  │ Marketing System         ████████░░░ 61%     │  │
│               │  │ Internal Operations      █████░░░░░░ 34%      │  │
│               │  └───────────────────────────────────────────────┘  │
│               │                                                      │
│               │  Recent Projects                                     │
│               │  [ CRM SaaS ] [ Marketing ] [ Operations ]          │
│               │                                                      │
│               │  Recent Activity                                     │
│               │  • Task updated                                      │
│               │  • Project created                                   │
│               │  • File uploaded                                     │
│               │                                                      │
└───────────────┴──────────────────────────────────────────────────────┘
```

---

# 73. Definition of Done

Phase 0 "SATRIA AI WORKFORCE PWA" selesai apabila pengguna dapat membuka, menginstall, dan menggunakan sebuah workspace digital yang terasa utuh untuk mengatur project, task, file, calendar, activity, dan laporan—tanpa membutuhkan AI Agent sama sekali.

Setelah titik ini tercapai, barulah konsep **Workforce / AI Employees** dimasukkan sebagai layer berikutnya.

---

# 74. Product North Star

> **"Build the office first. Fill it with AI later."**

SATRIA Phase 0 bukan tentang membuat AI pintar.

SATRIA Phase 0 adalah tentang membuat **tempat kerja digital yang begitu rapi sehingga ketika AI Agent nanti masuk, mereka langsung mempunyai kantor, meja kerja, project, task, histori, dan sistem kerja yang jelas.**
