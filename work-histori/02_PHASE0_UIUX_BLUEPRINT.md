# SATRIA AI WORKFORCE — UI/UX BLUEPRINT
## PWA Workspace Visual System, Page Map, Content Structure & User Flow
### Phase 0 — Workspace Only / No AI Agent Runtime

**Version:** 1.0  
**Date:** 14 August 2026

---

# 1. DESIGN DIRECTION

## 1.1 Product Feel

SATRIA harus terasa seperti:

- premium digital workspace
- modern operations center
- professional productivity platform
- calm but technical
- dense enough for power users, but not cluttered

Referensi prinsip visual:

> Linear-like clarity + Notion-like workspace structure + modern enterprise command center.

Bukan meniru UI produk tertentu.

## 1.2 Visual Personality

**Keywords:**

`Calm / Precise / Premium / Technical / Focused / Fast`

Hindari:

- cyberpunk
- neon overload
- terlalu banyak gradient
- terlalu banyak glow
- dashboard "game"
- card berlebihan
- animasi yang terus bergerak

---

# 2. GLOBAL STYLING SYSTEM

## 2.1 Theme

Default: **Dark**

Light mode tersedia.

### Dark background

```text
App Background     #0B0D10
Surface            #11151A
Elevated Surface   #171C22
Border             #242B33
Primary Text       #F5F7FA
Secondary Text     #9AA4B2
Muted Text         #667180
Primary Accent     Emerald / Green
```

Warna di atas adalah starting point, bukan mandatory final hex.

## 2.2 Status Colors

```text
Success     Green
Warning     Amber
Error       Red
Info        Cyan
Neutral     Slate
```

Status selalu menggunakan:

**icon + text + color**

bukan color saja.

## 2.3 Typography

Recommended:

- Inter
- Geist
- Manrope

### Scale

```text
Display       36–40
H1            28–32
H2            22–24
H3            18–20
Body          14–16
Small         13
Caption       12
Mono          logs / IDs / technical info
```

## 2.4 Spacing

Base 4px.

```text
4
8
12
16
20
24
32
40
48
64
```

## 2.5 Radius

```text
Button       8–10
Input        8–10
Card         12–16
Modal        16
Pill         999
```

## 2.6 Shadows

Dark mode menggunakan contrast antar-surface lebih banyak daripada heavy shadow.

## 2.7 Grid

Desktop:

- 12-column content grid
- max content width 1440px
- minimum page padding 24px

Mobile:

- 4-column conceptual grid
- page padding 16px

---

# 3. GLOBAL APP SHELL

## 3.1 Desktop

```text
┌───────────────────────────────────────────────────────────────┐
│ TOPBAR                                                        │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│   SIDEBAR     │                 PAGE CONTENT                   │
│               │                                               │
│               │                                               │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

### Sidebar width

Expanded:
240–260px

Collapsed:
64–72px

### Topbar height

64px.

---

# 4. SIDEBAR STRUCTURE

```text
SATRIA
AI WORKFORCE

[ Workspace ▼ ]

OVERVIEW
  Home

WORK
  Tasks
  Projects
  Files
  Calendar

INSIGHTS
  Activity
  Reports

SYSTEM
  Notifications
  Settings
```

Future section:

`WORKFORCE` dapat ditambahkan setelah Phase 0, tanpa mengubah struktur utama.

## Sidebar footer

```text
● Online
Satria
Personal Workspace
```

Click membuka profile/account menu.

---

# 5. TOPBAR

Kiri:

- mobile menu / sidebar toggle
- breadcrumb
- current page

Tengah:

- global search

Kanan:

- connection status
- notifications
- theme toggle
- avatar

### Search

Shortcut:

`Ctrl + K`

Placeholder:

`Search workspace...`

---

# 6. MOBILE APP SHELL

Top:

```text
☰   SATRIA                    🔔
```

Bottom:

```text
Home | Workspace | Tasks | Activity | More
```

More:

```text
Projects
Files
Calendar
Reports
Settings
```

---

# 7. PAGE MAP

Halaman Phase 0:

1. Splash
2. Login
3. Onboarding
4. Overview / Home
5. Workspace
6. Tasks
7. Task Detail
8. Projects
9. Project Detail
10. Files
11. File Preview
12. Calendar
13. Activity
14. Reports
15. Notifications
16. Settings
17. Profile
18. Search / Command Center
19. Create Workspace
20. Create Project
21. Create Task

---

# 8. PAGE 01 — SPLASH

## Purpose

Brand introduction saat PWA pertama dibuka.

### Content

```text
SATRIA
AI WORKFORCE

Your Digital Workforce Command Center

[loading indicator]
```

Durasi sangat singkat.

Tidak menggunakan intro animation panjang.

---

# 9. PAGE 02 — LOGIN

## Layout

Desktop split:

```text
LEFT
Brand / message

RIGHT
Login form
```

### Left

```text
SATRIA AI WORKFORCE

One workspace.
All your work.

A calm command center for your digital operations.
```

### Right

```text
Welcome back

Email
[________________]

Password
[________________]

☐ Remember me

[ Sign in ]

or

[ Continue with Google ]

Forgot password?
```

Mobile:

single-column.

---

# 10. PAGE 03 — ONBOARDING

## Step 1

```text
Welcome to SATRIA

Let's create your first workspace.

[Continue]
```

## Step 2

Workspace name.

## Step 3

Workspace type:

```text
Personal
Development
Business
```

## Step 4

Basic preferences:

- timezone
- theme

## Step 5

Finish.

User langsung masuk Home.

---

# 11. PAGE 04 — HOME / OVERVIEW

Ini adalah halaman terpenting.

## Header

```text
Good morning, Satria

Friday, 14 August 2026

[ Search your workspace... ]
```

## Quick actions

```text
+ New Task
+ New Project
+ New Workspace
Upload File
```

## KPI

4–5 cards maksimal:

```text
Active Tasks
12

Due Today
4

Projects
6

Attention
2

Completed
18
```

## Main content

### Today

Menampilkan:

- deadline hari ini
- current work
- important items

### Current Work

```text
CRM SaaS                  82%
Marketing System          61%
Internal Operations       34%
```

### Projects

3–4 project cards.

### Recent Activity

Timeline singkat 5–8 event.

### Attention

Item yang perlu tindakan.

---

# 12. HOME LAYOUT

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Greeting + Search                                           │
├─────────────┬─────────────┬─────────────┬─────────────┐
│ Active      │ Due Today   │ Projects    │ Attention   │
├─────────────┴─────────────┴─────────────┴─────────────┤
│ Today / Current Work                  │ Attention        │
├───────────────────────────────────────┼──────────────────┤
│ Projects                              │ Recent Activity  │
└───────────────────────────────────────┴──────────────────┘
```

Mobile:

Semua section menjadi stacked.

---

# 13. PAGE 05 — WORKSPACE

Workspace adalah "ruangan utama".

### Header

```text
Development Workspace

Build, ship, and manage digital products.

[ + New ] [ More ]
```

### Summary

```text
Projects  8
Tasks     34
Files     142
Activity  76
```

### Main tabs

```text
Overview
Projects
Tasks
Files
Activity
```

### Workspace Overview

- current focus
- recent projects
- current tasks
- recently updated files
- activity

---

# 14. PAGE 06 — TASKS

## Header

```text
Tasks

[ + New Task ]

[Search] [Filter] [Sort]
```

## View switch

```text
List | Board | Calendar
```

Default: List.

## Filters

- status
- priority
- project
- assignee
- deadline
- tag

---

# 15. TASK LIST

Columns desktop:

```text
Task
Project
Status
Priority
Assignee
Due
Updated
```

Mobile:

card.

---

# 16. TASK BOARD

Kanban:

```text
BACKLOG     IN PROGRESS     BLOCKED     REVIEW      DONE
```

Each column scroll independently where appropriate.

Task card:

```text
Fix login UI

CRM SaaS
High

Due today
```

Progress only shown when task has measurable progress.

---

# 17. PAGE 07 — TASK DETAIL

## Header

```text
Fix authentication UI
CRM SaaS

[In Progress] [High]

[Edit] [More]
```

## Main layout

Left ~70%:

- description
- checklist
- attachments
- comments
- timeline

Right ~30%:

- project
- assignee
- deadline
- priority
- tags
- created
- updated

## Bottom

Activity history.

---

# 18. PAGE 08 — PROJECTS

## Header

```text
Projects

[ + New Project ]

[Search] [Filter]
```

Views:

- Grid
- List

## Project Card

```text
CRM SaaS

Backend platform

████████████░░ 82%

12 Tasks
4 Contributors

Updated 12m ago
```

---

# 19. PAGE 09 — PROJECT DETAIL

### Header

```text
CRM SaaS
Backend platform

[ Open Workspace ] [ More ]
```

### Tabs

```text
Overview
Tasks
Files
Calendar
Activity
```

### Overview sections

- progress
- status
- description
- milestones
- current work
- recent activity

---

# 20. PROJECT MILESTONES

Project can have milestones.

Example:

```text
MVP
███████████████ 100%

Beta
████████░░░░░░░ 62%

Launch
███░░░░░░░░░░░ 18%
```

---

# 21. PAGE 10 — FILES

## Header

```text
Files

[ Upload ]
```

Views:

- grid
- list

### Filters

- type
- project
- modified
- size

### File item

```text
API-SPEC.pdf
PDF
2.4 MB
Updated 8m ago
```

---

# 22. PAGE 11 — FILE PREVIEW

### Layout

Left:

file preview.

Right:

metadata:

- filename
- type
- size
- created
- modified
- project
- tags

Actions:

- download
- rename
- move
- archive

---

# 23. PAGE 12 — CALENDAR

Header:

```text
Calendar

[Today]
[Week] [Month]
```

Calendar contains:

- tasks due
- milestones
- manually scheduled work
- reminders

Color coding by project.

---

# 24. PAGE 13 — ACTIVITY

## Header

```text
Activity

All workspace activity
```

### Filters

- project
- task
- action
- date
- user

Timeline:

```text
10:42
Satria created task

10:51
CRM project updated

11:08
API-SPEC.pdf uploaded

11:22
Task marked complete
```

---

# 25. PAGE 14 — REPORTS

Reports should stay operational, not BI-heavy.

## KPI

```text
Tasks Completed
Overdue
Projects On Track
Activity Volume
```

## Charts

### Completion trend

Line chart.

### Task status

Bar / doughnut.

### Project progress

Horizontal bars.

### Activity

Timeline / bar.

---

# 26. PAGE 15 — NOTIFICATIONS

Use drawer on desktop.

Full page on mobile.

Categories:

```text
All
Tasks
Projects
Files
System
```

Notification item:

```text
Deadline approaching

"API documentation"

Due in 2 hours
10 minutes ago
```

---

# 27. PAGE 16 — SETTINGS

Sections:

### General

- workspace name
- timezone
- language

### Appearance

- dark/light
- density
- sidebar behavior

### Notifications

- push
- in-app
- email placeholder

### Shortcuts

Show keyboard shortcuts.

### About

- version
- PWA status

---

# 28. PAGE 17 — PROFILE

```text
Satria

[Avatar]

Display name
Email
Timezone
Language

[Edit Profile]
```

Account actions:

- change password
- logout

---

# 29. PAGE 18 — SEARCH / COMMAND CENTER

## Desktop

Modal centered.

```text
Search workspace...

Recent
Projects
Tasks
Files
Pages
```

Keyboard:

```text
↑ ↓ navigate
Enter open
Esc close
```

Commands:

```text
Create task
Create project
Switch workspace
Go to dashboard
```

Phase 0 = navigation/search only.

---

# 30. PAGE 19 — CREATE WORKSPACE

Modal or full-page wizard.

Fields:

- workspace name
- type
- icon
- description

Preview.

Buttons:

`Cancel` / `Create workspace`

---

# 31. PAGE 20 — CREATE PROJECT

Fields:

- project name
- description
- icon
- color/accent
- status
- deadline

Optional:

- template

---

# 32. PAGE 21 — CREATE TASK

Fields:

- title
- description
- project
- status
- priority
- assignee
- deadline
- tags
- checklist

CTA:

`Create Task`

---

# 33. CORE UX FLOW — FIRST TIME USER

```text
Open PWA
 ↓
Splash
 ↓
Login
 ↓
Onboarding
 ↓
Create Workspace
 ↓
Home
 ↓
Create Project
 ↓
Create Task
 ↓
View Task
 ↓
Return Home
```

---

# 34. CORE UX FLOW — DAILY USE

```text
Open PWA
 ↓
Home
 ↓
Read Today
 ↓
Open urgent task
 ↓
Update task
 ↓
Check project
 ↓
Return Home
 ↓
Review activity
```

Target:

Daily workflow harus dapat dilakukan tanpa lebih dari 2–3 navigation jumps untuk pekerjaan umum.

---

# 35. CORE UX FLOW — PROJECT

```text
Home
 ↓
Projects
 ↓
Project Detail
 ↓
Tasks
 ↓
Task Detail
 ↓
Update
 ↓
Activity
```

---

# 36. CORE UX FLOW — QUICK CREATE

```text
Any Page
 ↓
+ New
 ↓
Task / Project / Workspace
 ↓
Form
 ↓
Create
 ↓
Success Toast
 ↓
Open Created Item
```

---

# 37. CORE UX FLOW — SEARCH

```text
Ctrl + K
 ↓
Search
 ↓
Results
 ↓
Select item
 ↓
Open destination
```

---

# 38. CORE UX FLOW — MOBILE

```text
Home
 ↓
Bottom Navigation
 ↓
Workspace / Tasks / Activity
 ↓
Details
 ↓
Back
```

Bottom navigation selalu tersedia.

---

# 39. QUICK CREATE DESIGN

Global `+ New` button berada:

Desktop:
Topbar.

Mobile:
Floating action button atau header.

Menu:

```text
New Task
New Project
New Workspace
Upload File
```

---

# 40. EMPTY STATE DESIGN

Pattern:

```text
[Simple illustration / icon]

No projects yet

Create your first project
to organize your work.

[Create Project]
```

Tidak memakai ilustrasi besar yang mengganggu.

---

# 41. ERROR STATE

Pattern:

```text
Something went wrong

We couldn't load this workspace.

[Retry]
```

Untuk network:

```text
You're offline

Showing your last saved workspace.

[Retry]
```

---

# 42. LOADING

Gunakan skeleton:

```text
Title skeleton
Card skeleton
List skeleton
```

Hindari full screen spinner.

---

# 43. TOAST SYSTEM

Success:

`Project created`

Warning:

`Task has no deadline`

Error:

`Couldn't upload file`

Info:

`Changes saved locally`

Toast:

- non-blocking
- auto-dismiss
- accessible

---

# 44. MODAL RULE

Gunakan modal hanya untuk:

- create/edit
- confirmation
- quick action

Gunakan drawer untuk:

- detail yang perlu konteks page
- filters
- notifications

Jangan membuat semua halaman berupa modal.

---

# 45. DATA DENSITY

Default density:

Comfortable.

Power-user mode:

Compact.

Compact mode:

- smaller row height
- tighter padding
- more visible records

---

# 46. RESPONSIVE RULES

## Desktop

Sidebar + topbar + multi-column.

## Tablet

Sidebar collapsible.

## Mobile

Bottom nav + stacked content.

Task table berubah menjadi cards.

Project grid menjadi horizontal or 1-column.

Reports chart menjadi stacked.

---

# 47. MOBILE HOME

Urutan:

```text
Header
Greeting
Quick Actions
Today
Attention
Current Work
Projects
Activity
```

KPI disederhanakan menjadi horizontal scroll.

---

# 48. DESIGN DETAILS

## Buttons

Primary:

filled accent.

Secondary:

neutral surface.

Tertiary:

ghost.

Danger:

red.

## Inputs

Height:

40–44px desktop.

Mobile:

44–48px.

---

# 49. ICONOGRAPHY

Gunakan satu icon family.

Recommended:

Lucide.

Rules:

- stroke consistent
- no mixed icon styles
- icon + label for important navigation
- tooltip for icon-only buttons

---

# 50. ILLUSTRATION STYLE

Minimal.

Gunakan:

- abstract geometric forms
- simple line icons
- subtle workspace illustrations

Tidak memakai robot/cyborg AI imagery sebagai elemen utama.

---

# 51. MICRO-INTERACTIONS

Subtle:

- sidebar expand
- card hover
- progress movement
- drawer slide
- toast
- page transition

Duration:

100–250ms.

Reduced-motion mode wajib dihormati.

---

# 52. COMPONENT HIERARCHY

```text
AppShell
├── Sidebar
├── Topbar
│   └── GlobalSearch
│
└── Page
    ├── PageHeader
    ├── QuickActions
    ├── KPIGrid
    ├── Section
    │   ├── Cards
    │   ├── Table
    │   └── Timeline
    └── Footer / pagination
```

---

# 53. COMPONENT INVENTORY

## Navigation

- Sidebar
- Topbar
- BottomNav
- Breadcrumb
- Tabs

## Workspace

- WorkspaceSwitcher
- WorkspaceCard
- WorkspaceSummary

## Project

- ProjectCard
- ProjectHeader
- ProjectProgress
- Milestone

## Task

- TaskCard
- TaskTable
- TaskBoard
- TaskDetail
- StatusBadge
- PriorityBadge

## File

- FileCard
- FileRow
- FilePreview

## Activity

- ActivityTimeline
- ActivityItem

## Calendar

- CalendarGrid
- CalendarEvent

## System

- CommandPalette
- Notifications
- Modal
- Drawer
- Toast
- Skeleton
- EmptyState
- ErrorState

---

# 54. MOCK CONTENT STYLE

Jangan menggunakan dummy data seperti:

`Test 1`, `Project X`, `Task ABC`.

Gunakan data realistis.

Contoh:

```text
CRM SaaS
Marketing Automation
AI Workforce
Internal Operations
```

Task:

```text
Prepare authentication flow
Review API contract
Build landing page
Optimize database query
Prepare campaign report
```

Hal ini membuat prototype terasa seperti produk nyata.

---

# 55. PWA BEHAVIOR

Install prompt tidak dipaksa.

Setelah beberapa visits:

```text
Install SATRIA

Get faster access from your desktop.

[Install] [Not now]
```

Mobile:

gunakan browser native install UX bila tersedia.

---

# 56. OFFLINE UX

Saat offline:

Topbar:

`● Offline`

Banner hanya muncul saat status berubah.

Data terakhir tetap dapat dibaca.

Draft changes:

```text
Saved locally
Waiting for connection
```

---

# 57. PERFORMANCE

Target:

- First Contentful Paint cepat
- route transitions terasa instant
- lazy load page
- lazy load file previews
- virtualize large activity/task lists
- compress images
- use SVG icons

Target Lighthouse:

```text
Performance      ≥ 90
Accessibility    ≥ 90
Best Practices   ≥ 90
PWA              Pass
```

---

# 58. ACCESSIBILITY

Target:

- WCAG AA
- keyboard navigation
- focus visible
- semantic landmarks
- accessible form labels
- tooltip alternative
- contrast tested
- reduced motion

---

# 59. DEMO DATA

Workspace:

### Personal
12 tasks
4 projects
28 files

### Development
34 tasks
8 projects
142 files

### Business
21 tasks
6 projects
87 files

Activity:

50+ entries.

Notifications:

10+.

---

# 60. PHASE 0 NAVIGATION

```text
Home
Workspace
Tasks
Projects
Files
Calendar
Activity
Reports
Notifications
Settings
```

Tidak ada:

- Agents
- Skills
- Tools
- Memory
- Workflows
- AI runtime
- Hermes
- Discord

---

# 61. FUTURE-READY UI HOOKS

Setelah Phase 0 selesai, nav dapat berkembang:

```text
WORKFORCE
  Employees
  Skills
  Tools
  Runs

AUTOMATION
  Workflows
  Schedules

INTELLIGENCE
  Memory
  Knowledge
  Models
```

Namun semua itu **disembunyikan pada Phase 0**.

---

# 62. FINAL USER JOURNEY

### First Visit

```text
Landing
 ↓
Login
 ↓
Onboarding
 ↓
Workspace
 ↓
Home
```

### Daily

```text
Home
 ↓
Today
 ↓
Task
 ↓
Project
 ↓
Update
 ↓
Activity
```

### Management

```text
Workspace
 ↓
Projects
 ↓
Tasks
 ↓
Reports
```

---

# 63. PRODUCT STRUCTURE

```text
                  SATRIA AI WORKFORCE
                          │
                     PWA SHELL
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
     OVERVIEW          WORKSPACE          SYSTEM
        │                 │                  │
    Dashboard        Projects/Tasks      Activity
                     Files/Calendar      Reports
                                          Settings
```

---

# 64. PHASE 0 DEFINITION OF DONE

Phase 0 selesai bila:

1. Semua core screens tersedia.
2. Desktop responsive dan polished.
3. Mobile memiliki pengalaman yang benar-benar usable.
4. PWA dapat di-install.
5. Dark/light theme tersedia.
6. Navigation lengkap.
7. Mock data realistis.
8. Task/project creation berjalan.
9. Search/command palette berjalan untuk navigation.
10. Loading, empty, error, offline state tersedia.
11. Accessibility dasar terpenuhi.
12. Performance memenuhi target.
13. Tidak ada dependensi terhadap AI Agent.

---

# 65. FINAL DESIGN PRINCIPLE

> **The workspace should feel useful before the AI arrives.**

Jika user membuka SATRIA tanpa satu pun agent aktif, aplikasinya tetap harus terasa seperti **workspace produktivitas yang utuh**, bukan dashboard kosong yang menunggu AI.

Setelah fondasi ini stabil, barulah AI Workforce dimasukkan sebagai layer di atas workspace.

---

# 66. FINAL VISUAL MOCKUP

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ SATRIA      Search workspace...                      ● Online  🔔  S      │
├──────────────┬───────────────────────────────────────────────────────────┤
│              │                                                           │
│ HOME         │  Good morning, Satria                                   │
│              │  Friday, 14 August 2026                                  │
│ WORKSPACE    │                                                           │
│ TASKS        │  [ + New ] [ New Project ] [ Upload ]                   │
│ PROJECTS     │                                                           │
│ FILES        │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│ CALENDAR     │  │ 12     │ │ 4      │ │ 6      │ │ 2      │           │
│              │  │ Active │ │ Due    │ │Projects│ │Attention│           │
│ ACTIVITY     │  └────────┘ └────────┘ └────────┘ └────────┘           │
│ REPORTS      │                                                           │
│              │  TODAY                              ATTENTION            │
│ NOTIFICATIONS│  ┌──────────────────────────────┐  ┌─────────────────┐   │
│              │  │ Finish API Documentation     │  │ 2 tasks blocked│   │
│ SETTINGS     │  │ Due 14:00                    │  │ Review required│   │
│              │  │ CRM SaaS                     │  │ Deadline today │   │
│              │  └──────────────────────────────┘  └─────────────────┘   │
│              │                                                           │
│              │  CURRENT WORK                                             │
│              │  CRM SaaS                  ███████████████░ 82%          │
│              │  Marketing Automation      ███████████░░░░ 61%          │
│              │  Internal Operations       ██████░░░░░░░░░ 34%          │
│              │                                                           │
│              │  PROJECTS                                                  │
│              │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│              │  │ CRM SaaS   │ │ Marketing  │ │ Operations │            │
│              │  │ 82%         │ │ 61%        │ │ 34%        │            │
│              │  └────────────┘ └────────────┘ └────────────┘            │
│              │                                                           │
│              │  RECENT ACTIVITY                                           │
│              │  • API documentation updated                               │
│              │  • New task created                                        │
│              │  • Marketing project updated                               │
│              │                                                           │
└──────────────┴───────────────────────────────────────────────────────────┘
```
