# SATRIA AI WORKFORCE
## PHASE 1 — EXECUTION PLAN
### Workforce Structure: Departments → Employees → Skills → Tools

**Version:** 1.0  
**Date:** 14 August 2026  
**Base Blueprint:** `SATRIA_AI_WORKFORCE_MASTER_WORKFORCE_BLUEPRINT_Phase1(1).md`  
**Baseline:** Phase 0 Frozen ✅ (Workspace UI selesai, typecheck 0 error, 13 tests pass, production build OK)

---

> **Prinsip Inti Phase 1**
> "Build the workforce structure. No AI runtime. No agent execution."
> Phase 0 = Office. Phase 1 = Fill with employees. Phase 2+ = Intelligence.

---

## RINGKASAN PHASE

| Sub-Phase | Nama | Scope Utama | Estimasi |
|:---:|---|---|:---:|
| 1.1 | Data Foundation | Types, Mock Data, Repositories, Stores | Medium |
| 1.2 | Navigation & Shell | Sidebar link, Router, Page scaffolding | Small |
| 1.3 | Workforce Overview & Departments | Overview page, Department list & detail | Medium |
| 1.4 | Employee Directory & CRUD | Directory, Create, Edit, Archive, Detail | Large |
| 1.5 | Skill & Tool Registry | Skill CRUD, Tool CRUD, Skill Assignment | Medium |
| 1.6 | QA, Polish & Validation | Typecheck, Tests, Build, Responsive check | Small |

---

## PHASE 1.1 — DATA FOUNDATION

> **Tujuan:** Membangun seluruh lapisan data sebelum ada UI. Semua data bersifat mock/in-memory mengikuti pola Phase 0.

### 1.1.A — TypeScript Types

**File Target:** `src/types/index.ts` (tambahkan, jangan replace yang sudah ada)

Tambahkan interface berikut:

```typescript
// Department
interface Department {
  id: string               // 'dept-coding', 'dept-trainer', 'dept-side-hustle'
  name: string             // 'Coding', 'Trainer', 'Side Hustle'
  code: string             // 'CODING', 'TRAINER', 'SIDE_HUSTLE'
  description: string
  icon: string             // Lucide icon name
  status: 'active' | 'inactive'
  employeeCount: number
  createdAt: string
  updatedAt: string
}

// Role
interface EmployeeRole {
  id: string               // 'role-planner', 'role-uiux', dst
  departmentId: string
  name: string             // 'Asisten Manager / Planner'
  description: string
  responsibilities: string[]
  status: 'active' | 'inactive'
}

// Skill
type SkillPriority = 'P0' | 'P1' | 'P2'
type SkillStatus = 'Registered' | 'Available' | 'Installed' | 'Active'
type SkillSourceType = 'internal' | 'external'

interface Skill {
  id: string
  name: string
  slug: string
  category: string
  description: string
  sourceType: SkillSourceType
  sourceRepository?: string
  sourceUrl?: string
  installCommand?: string
  version: string
  status: SkillStatus
  compatibleDepartments: string[]
  compatibleRoles: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Tool
type ToolStatus = 'available' | 'unavailable' | 'deprecated'

interface WorkforceTool {
  id: string
  name: string
  category: string
  description: string
  status: ToolStatus
  permissionLevel: 'read' | 'write' | 'admin'
}

// Employee Skill Assignment
interface EmployeeSkillAssignment {
  skillId: string
  priority: SkillPriority
  assignedAt: string
}

// Employee
type EmploymentStatus = 'Active' | 'Inactive' | 'Draft' | 'Archived'

interface Employee {
  id: string               // 'emp-raka', 'emp-maya', dst
  name: string             // 'Raka', 'Maya', dst
  avatar: string           // URL atau initials
  departmentId: string
  roleId: string
  roleName: string         // denormalized untuk kemudahan display
  departmentName: string   // denormalized
  description: string
  status: EmploymentStatus
  supervisorId?: string
  skills: EmployeeSkillAssignment[]
  toolIds: string[]
  permissions: string[]
  createdAt: string
  updatedAt: string
}
```

### 1.1.B — Mock Seed Data

**File Target:** `src/mocks/mockData.ts` (tambahkan ekspor baru)

Seed data yang harus dibuat:

- **3 Departments:** Coding, Trainer, Side Hustle
- **12 Roles** (sesuai blueprint):
  - Coding: Planner, UI/UX Frontend, Backend API, Quality Control, Security Control
  - Trainer: Admin, Researcher Materi, Pembuat Materi
  - Side Hustle: CS, Marketing, R&D, Pembuat Konten
- **12 Employees** dengan nama placeholder:
  - Raka (Planner), Maya (UI/UX), Bima (Backend), Dimas (QC), Ardi (Security)
  - Naya (Admin), Rina (Researcher), Mila (Pembuat Materi)
  - Citra (CS), Alya (Marketing), Rafi (R&D), Salsa (Konten)
- **Skill Registry** (internal core + 11 external packages)
- **Tool Registry** (per category)

### 1.1.C — Mock Repositories

**File Target:** `src/repositories/index.ts` (tambahkan class baru)

```
MockDepartmentRepository
MockEmployeeRoleRepository
MockEmployeeRepository
MockSkillRepository
MockWorkforceToolRepository
```

Setiap repository: `findAll()`, `findById()`, `findBy()`, `create()`, `update()`, `delete()`

### 1.1.D — Pinia Stores (baru)

- `src/stores/department.ts`
- `src/stores/employee.ts`
- `src/stores/skill.ts`
- `src/stores/workforceTool.ts`

**Checklist 1.1:**
- [x] Types ditambahkan ke `src/types/index.ts`
- [x] Mock data 3 departments seed
- [x] Mock data 12 roles seed
- [x] Mock data 12 employees seed (dengan skill assignments)
- [x] Skill registry seed (internal + 11 external packages)
- [x] Tool registry seed
- [x] 5 Repository classes baru dibuat
- [x] 4 Pinia stores baru dibuat
- [x] `npm run typecheck` → 0 errors


---

## PHASE 1.2 — NAVIGATION & SHELL

> **Tujuan:** Menambahkan navigasi Workforce ke sidebar dan membuat halaman-halaman kosong (scaffolding).

### 1.2.A — Router

**File Target:** `src/router/index.ts`

Tambahkan 8 lazy-loaded routes di bawah `/workforce`:
- `/workforce` → WorkforceOverviewPage
- `/workforce/departments` → DepartmentsPage
- `/workforce/departments/:id` → DepartmentDetailPage
- `/workforce/employees` → EmployeesPage
- `/workforce/employees/new` → CreateEmployeePage
- `/workforce/employees/:id` → EmployeeDetailPage
- `/workforce/skills` → SkillsPage
- `/workforce/tools` → ToolsPage

### 1.2.B — Sidebar Navigation

**File Target:** `src/components/layout/Sidebar.vue`

Tambahkan section **WORKFORCE** dengan icon `Users`. Sub-nav:
- Overview, Employees, Departments, Skills, Tools

### 1.2.C — Page Scaffolding

Buat 8 halaman kosong di `src/pages/workforce/` dengan:
- `<h1>` dengan judul halaman
- `UiSkeleton` loading placeholder

**Checklist 1.2:**
- [x] 8 routes ditambahkan
- [x] Sidebar section Workforce muncul dan active state bekerja
- [x] 8 halaman scaffold dapat diakses tanpa error
- [x] `npm run typecheck` → 0 errors


---

## PHASE 1.3 — WORKFORCE OVERVIEW & DEPARTMENTS

> **Tujuan:** Halaman Overview (KPI + department cards) dan Departments (list + detail).

### 1.3.A — WorkforceOverviewPage

```
Header: "Workforce Command Center"

KPI Cards (5):
  Total Employees | Active | Departments | Skills | Tools

Department Summary Cards (3 — clickable link ke detail):
  CODING (5 employees) | TRAINER (3) | SIDE HUSTLE (4)
  + list nama role di tiap department

Org Chart section (opsional)
```

### 1.3.B — DepartmentsPage

Grid 3 kartu: nama, kode, deskripsi, employee count, status badge, link ke detail.

### 1.3.C — DepartmentDetailPage

- Header: department name, kode, status
- Stats: employee count, role count
- Employee mini cards dalam department
- Role list dengan responsibilities summary

**Checklist 1.3:**
- [x] KPI cards menampilkan data real dari store
- [x] Department cards clickable
- [x] Department detail menampilkan employee list yang benar
- [x] Responsive di mobile


---

## PHASE 1.4 — EMPLOYEE DIRECTORY & CRUD

> **Tujuan:** Inti fitur Workforce — Employee Directory dengan full CRUD.

### 1.4.A — EmployeesPage (Directory)

```
Header + "New Employee" button

Filter Bar:
  - Department tabs: All | Coding | Trainer | Side Hustle
  - Status filter: All | Active | Draft | Archived
  - Search input (nama, role)

Employee Cards Grid:
  - Avatar circle, Name, Role, Department badge, Status badge
  - Skills preview (3 pills + "+N more")
  - Supervisor name
  - Click → Employee Detail

Empty State:
  UiEmptyState + "Create First Employee" button
```

### 1.4.B — CreateEmployeePage (Multi-step Wizard)

7 langkah sesuai blueprint:

```
Step 1: Identity (Name, Avatar, Description)
Step 2: Department & Role (dropdown, filtered)
Step 3: Responsibilities (auto dari role, dapat custom)
Step 4: Skills (search + assign + set priority P0/P1/P2)
Step 5: Tools (search + assign)
Step 6: Supervisor (optional dropdown)
Step 7: Review + Create
```

Progress indicator step di atas form.

### 1.4.C — EmployeeDetailPage (6 Tab)

```
Header: Avatar, Name, Role, Department, Status, Edit/Archive buttons

Tabs:
1. Overview    — deskripsi, department, role, supervisor, timestamps
2. Responsibilities — list dari role, styled checklist
3. Skills      — cards dengan priority, source badge, install command, remove/add
4. Tools       — list dengan category, permission, remove/add
5. Activity    — placeholder (Phase 2)
6. Settings    — edit name/desc, change status, archive dengan konfirmasi
```

**Checklist 1.4:**
- [x] 12 employees muncul di directory
- [x] Filter & search berfungsi
- [x] Multi-step create wizard berfungsi end-to-end
- [x] Employee baru tersimpan dan muncul di directory
- [x] Employee detail 6 tab berfungsi
- [x] Edit status berfungsi
- [x] Archive employee berfungsi
- [x] Skill assignment dari detail berfungsi
- [x] Toast notifications pada setiap aksi
- [x] Responsive di mobile


---

## PHASE 1.5 — SKILL & TOOL REGISTRY

> **Tujuan:** Halaman manajemen Skill Registry dan Tool Registry.

### 1.5.A — SkillsPage

```
Header + total count + "+ Add Skill" button

Filter: Category | Source (Internal/External) | Status | Search

Skill Cards:
  - Name, category badge, source badge (Internal/External)
  - Source repository (monospace)
  - Install command (copyable code snippet)
  - Status indicator
  - "Used by N employees"
  - Compatible departments tags
```

### 1.5.B — ToolsPage

```
Header + total count + "+ Add Tool" button

Filter: Category | Status | Search

Tool Cards:
  - Name, category, description
  - Permission level badge
  - Status badge
  - "Used by N employees"
```

**Checklist 1.5:**
- [x] Semua skills registry tampil (internal + external)
- [x] Install command copyable ke clipboard
- [x] Filter & search berfungsi
- [x] Add skill ke registry berfungsi
- [x] Tool registry tampil dan berfungsi
- [x] "Used by N" count akurat


---

## PHASE 1.6 — QA, POLISH & VALIDATION

> **Tujuan:** Validasi penuh sebelum Phase 1 dianggap selesai.

### 1.6.A — TypeScript

```bash
npm run typecheck
```
Target: **0 errors**

### 1.6.B — Unit Tests

Tambah ke `src/test/repositories.spec.ts` (6+ test baru):
- `MockDepartmentRepository.findAll()` returns 3
- `MockEmployeeRepository.findAll()` returns 12
- `MockEmployeeRepository.findBy('departmentId', 'dept-coding')` returns 5
- `MockSkillRepository.findAll()` returns all skills
- `create()` adds employee
- `update()` updates status

Buat `src/test/workforceJourney.spec.ts` (5+ test baru):
- Overview menampilkan 12 employees dan 3 departments
- Filter Coding → 5 karyawan
- Create Employee → muncul di directory
- Assign skill → tampil di detail
- Archive → status berubah

```bash
npm run test:unit
```
Target: **semua test pass** (13 lama + 11+ baru)

### 1.6.C — Responsive Check

- [x] 360px (mobile) — semua halaman Workforce
- [x] 768px (tablet)
- [x] 1200px+ (desktop)

### 1.6.D — States Check

Setiap halaman Workforce harus punya:
- [x] `UiSkeleton` saat loading
- [x] `UiEmptyState` saat data kosong
- [x] `UiErrorState` jika store error

### 1.6.E — Production Build

```bash
npm run build
```
Target: **sukses, 0 TS errors, PWA precache OK** (Achieved ✅)


---

## DEFINITION OF DONE — PHASE 1

```
SATRIA
├── Workspace ✅ (Phase 0)
└── Workforce ✅ (Phase 1)
    ├── 3 Departments (Coding, Trainer, Side Hustle)
    ├── 12 Employee Roles seeded
    ├── 12 Employees dengan nama & assignments
    ├── Skill Registry
    │   ├── Internal Core Skills
    │   └── External Reusable Packages (11 skills)
    ├── Tool Registry
    ├── Supervisor Relations
    └── Full CRUD UI (Create, Read, Update, Archive)
```

---

## BATAS PHASE 1 — TIDAK BOLEH DIBANGUN

- ❌ Agent runtime / Hermes
- ❌ LLM / model provider integration
- ❌ Memory engine
- ❌ Discord integration
- ❌ Tool execution / autonomous task running
- ❌ Multi-agent orchestration
- ❌ Runtime status (hanya Employment Status)
- ❌ Skill installation execution (hanya registry display)

---

## URUTAN PENGERJAAN

```
1.1 Data Foundation
    ↓
1.2 Navigation & Shell
    ↓
1.3 Overview & Departments
    ↓
1.4 Employee CRUD  ← terbesar
    ↓
1.5 Skill & Tool Registry
    ↓
1.6 QA & Validation
```

> Jangan loncat dari 1.1 ke UI sebelum types dan stores selesai.

---

*File ini adalah kontrak implementasi Phase 1. Setiap sub-phase harus diselesaikan dan di-checklist sebelum lanjut ke sub-phase berikutnya.*
