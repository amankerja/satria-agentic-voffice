# SIAP BEKERJA — SATRIA AI WORKFORCE (Phase 0)
## Master Execution Plan — PWA Web Workspace

**Dokumen Landasan & Acuan:**
1. `SATRIA_AI_WORKFORCE_PRD_PWA_Workspace_UIUX_Phase0_v2.md` (PRD v2.0)
2. `SATRIA_AI_WORKFORCE_UIUX_BLUEPRINT_Phase0.md` (UI/UX Blueprint v1.0)
3. `refrensi/` (23 Visual UI Screens, HTML Code, PNG Mockups & Design Tokens `refrensi/satria_operations_system/DESIGN.md`)
4. `MCP.md` (Context Reference)

**Status Dokumen:** Master Execution Plan Aktif (Telah Disesuaikan).

---

## 1. SIMPULAN HAKIKAT PRODUK & DESIGN DIRECTION

- **Produk:** SATRIA AI WORKFORCE — PWA Web Workspace / Workshop UI-UX ("Kantor Digital").
- **Phase 0 Focus:** Visual Workspace murni.
- **Batasan Mutlak Phase 0 (NO-AGENT RULE):**
  - TIDAK ADA runtime AI Agent, LLM, orchestration, memory engine, tool execution, Hermes, Discord, autonomous execution.
  - Semua data bersifat mock / manual via **Mock Repository Pattern**.
- **Filosofi & Visi:** 
  > "Build the office first. Fill it with AI later."  
  > "The workspace should feel useful before the AI arrives."
- **Prinsip Visual & Design System (`refrensi/satria_operations_system/DESIGN.md`):**
  - Modern Enterprise + Linear-like precision + Apple-like simplicity + AI Ops Console.
  - Dark-first environment: Background `#0e1511` / `#0B0D10`, Surface `#0e1511`, Container `#1a211d` / `#242c27`.
  - Primary Accent (Emerald Green): `#4edea3` / `#10b981`. Secondary: Cyan `#4cd7f6`.
  - Typography: **Geist** (UI, headlines) & **JetBrains Mono** (Machine data, IDs, logs).
  - Elevation: Tonal layering + 1px hairline border (`$outline` / `$outline-variant`), tanpa shadow berat.
  - Radius: 8px (base controls), 12–16px (containers/cards), 999px (pills/badges). Spacing base 4px.

---

## 2. STACK TEKNOLOGI

- **Framework:** Vue 3 (Composition API + TypeScript strict mode)
- **Build Tool:** Vite
- **State Management:** Pinia
- **Router:** Vue Router
- **Styling:** Tailwind CSS + Custom Design Tokens (`satria_operations_system`)
- **Headless UI:** Reka UI / Headless UI
- **Icons:** Lucide Icons (satu family, 20/24px bounding box, 1.5/2px stroke)
- **Typography:** Geist & JetBrains Mono
- **PWA:** `vite-plugin-pwa` (manifest, service worker, installable, offline shell)
- **Testing:** Vitest + Playwright

---

## 3. MASTER EXECUTION PLAN (9 PHASE)

```text
SATRIA AI WORKFORCE — MASTER EXECUTION PLAN

PHASE 01: PROJECT INITIALIZATION
       ↓
PHASE 02: VISUAL FOUNDATION & DESIGN TOKEN LOCK (/design-system)
       ↓
PHASE 03: DOMAIN TYPES & MOCK DATA LAYER (Mock Repository Pattern)
       ↓
PHASE 04: GLOBAL APP SHELL (Sidebar, Topbar, Switcher, BottomNav)
       ↓
PHASE 05: CORE WORKSPACE (5A Shell → 5B Home → 5C Workspace → 5D Projects → 5E Tasks → 5F Polish)
       ↓
PHASE 06: PRODUCTIVITY UX (Ctrl+K, Quick Create, Filters, View Switches)
       ↓
PHASE 07: SECONDARY PAGES (Files, Calendar, Activity, Reports, Settings)
       ↓
PHASE 08: PWA & OFFLINE EXPERIENCE
       ↓
PHASE 09: QA, POLISH & PERFORMANCE VERIFICATION
```

---

### DETAIL SUB-PHASE EXECUTION & KRITERIA UJI (DELIVERABLES)

#### PHASE 01 — PROJECT INITIALIZATION
- [x] Scaffold Vite + Vue 3 + TypeScript (strict mode)
- [x] Install & setup Tailwind CSS
- [x] Setup Vue Router, Pinia, dan `vite-plugin-pwa`
- [x] Setup Lucide Icons, Vitest, dan tooling
- [x] Struktur folder: `src/{components, layouts, pages, stores, repositories, mocks, types, router, assets}`
> **Kriteria Uji / Deliverable Phase 01:**
> - [x] `npm run dev` berjalan tanpa error.
> - [x] `npm run build` dan `npm run typecheck` pass 100%.
> - [x] Dev server dapat diakses di browser dengan landing/test page.

#### PHASE 02 — VISUAL FOUNDATION & DESIGN TOKEN LOCK
*Tujuan: Kunci bahasa visual dari `refrensi/satria_operations_system/DESIGN.md` sebelum buat data & page.*
- [x] Integrasi Design Tokens ke Tailwind Config (Colors, Typography Geist/JetBrains Mono, Spacing 4px base, Radius, Elevation borders)
- [x] Buat UI Components Atomik (`src/components/ui/`):
  - Controls: Button (Primary, Secondary, Ghost, Danger), Input, Search, Select, Checkbox, Switch, Tabs, SegmentedControl
  - Data Display: Card, Badge (pills), Avatar, Table, Timeline, Progress, KPI Card
  - Feedback: Modal, Drawer, Toast, Tooltip, Skeleton, EmptyState, ErrorState
- [x] Buat halaman internal **`/design-system`**:
  - Showcase seluruh komponen dalam state: Default, Hover, Active, Disabled, Loading, Error, Mobile view, Dark & Light mode.
> **Kriteria Uji / Deliverable Phase 02:**
> - [x] Route `/design-system` bisa dibuka dan interaktif.
> - [x] Semua design tokens (warna `#0e1511`, `#4edea3`, `#4cd7f6`, font Geist & JetBrains Mono) terlihat tepat.
> - [x] Setiap komponen dapat dites state-nya (hover, active, disabled, loading, error).
> - [x] Dark/Light theme toggle berfungsi konsisten di halaman ini.
> - [x] Tampilan responsif pada ukuran mobile (360px).

#### PHASE 03 — DOMAIN TYPES & MOCK DATA LAYER
*Tujuan: Menyusun arsitektur data terisolasi via Mock Repository Pattern.*
- [x] Definisi TypeScript Interfaces (`Workspace`, `Project`, `Task`, `File`, `Activity`, `Notification`, `User`, `UserSettings`)
- [x] Implementasi Mock Repository Pattern Interfaces & Classes (`src/repositories/`)
- [x] Penyusunan Dataset Mock Realistis (`src/mocks/`):
  - 3 Workspaces (Personal, Development, Business)
  - 4 Projects (SATRIA AI Workforce, CRM SaaS, Marketing System, Internal Operations)
  - 20+ Tasks (Backlog, In Progress, Blocked, Review, Done)
  - 20+ Files, 50+ Activity Logs, 10+ Notifications
- [x] Pembuatan Pinia Stores (`useWorkspaceStore`, `useProjectStore`, `useTaskStore`, `useThemeStore`, `useFileStore`, `useActivityStore`, `useNotificationStore`, `useSettingsStore`)
> **Kriteria Uji / Deliverable Phase 03:**
> - [x] Unit tests (`npm run test:unit`) untuk semua Repositories & Pinia Stores pass.
> - [x] Store terhubung ke Mock Repositories tanpa hardcoded data di halaman UI.
> - [x] Operasi CRUD mock (get, create, update status) mengembalikan data yang valid dan konsisten.

#### PHASE 04 — GLOBAL APP SHELL
- [x] Layout `AppShell` (Desktop & Mobile):
  - Sidebar (Expanded 240-260px, Collapsed 64-72px, Tooltip, state tersimpan di LocalStorage)
  - Topbar (Breadcrumb, Trigger Ctrl+K, Connection status, Theme switch, Profile)
  - Mobile Bottom Navigation (Home | Workspace | Tasks | Activity | More)
  - Workspace Switcher dropdown & modal
- [x] Composables & Helpers: `useThemeStore`, responsive layout, keyboard shortcuts
> **Kriteria Uji / Deliverable Phase 04:**
> - [x] Layout AppShell tampil presisi di desktop & mobile.
> - [x] Sidebar expand/collapse lancar dan tersimpan di LocalStorage.
> - [x] Workspace Switcher berfungsi mengubah aktif workspace di Pinia store.
> - [x] Navigation links berfungsi mengarahkan route tanpa layout shift.

#### PHASE 05 — CORE WORKSPACE (CORE UX FLOW)
- [x] **5A. App Shell Integration:** Integrasi layout & routing awal
- [x] **5B. Home / Overview (`/`):**
  - Greeting header, Quick Actions (+New Task, +New Project, Upload)
  - 4 KPI cards (Active Tasks, Due Today, Projects, Attention)
  - Today section, Current Work progress bars, Project cards, Recent Activity timeline
- [x] **5C. Workspace Main Page (`/workspace`):**
  - Workspace Header, Summary, Projects grid, Tasks list, Workspace overview
- [x] **5D. Projects Page & Project Detail (`/projects`, `/projects/:id`):**
  - Directory Grid/List view, progress indicator, milestones, project detail tabs
- [x] **5E. Tasks Page & Task Detail (`/tasks`, `/tasks/:id`):**
  - View switcher: List, Board (Kanban), Calendar
  - Filters (status, priority, project, assignee)
  - Task Detail Panel (left description/checklist/comments, right metadata)
- [x] **5F. Cross-page UX Polish:** Memastikan transisi antar-halaman utama terasa lancar dan menyatu
> **Kriteria Uji / Deliverable Phase 05:**
> - [x] **5A:** App Shell terintegrasi bersih dengan router.
> - [x] **5B:** Home Overview dapat diganti data workspace-nya; KPI & Recent Activity update dinamis.
> - [x] **5C:** Workspace Page menampilkan summary & aset sesuai workspace aktif.
> - [x] **5D:** Projects List & Detail bisa dibuka, progress bar & milestones terhitung akurat.
> - [x] **5E:** Tasks View Switcher (List ↔ Board ↔ Calendar) berfungsi lancar; status task bisa dipindahkan (Kanban drag/click); Task Detail drawer/panel bisa diedit.
> - [x] **5F:** Alur navigasi Home → Workspace → Project → Task → Home berjalan tanpa *dead-end*.

#### PHASE 06 — PRODUCTIVITY UX & COMMAND PALETTE
- [x] **Global Command Bar (Ctrl + K / Cmd + K):**
  - Centered modal search untuk navigasi instan, pencarian item, switch workspace, dan quick commands
- [x] **Global Quick Create System (+ New):**
  - Modal Create Task, Create Project, Create Workspace, Upload File
> **Kriteria Uji / Deliverable Phase 06:**
> - [x] `Ctrl+K` membuka Command Palette dari halaman mana saja; navigasi & pencarian keyboard-friendly.
> - [x] Tombol `+ New` membuka modal Quick Create; membuat Task/Project/File baru langsung menambah data ke store & muncul di UI.

#### PHASE 07 — SECONDARY PAGES
- [x] **Files & File Preview (`/files`):** Grid/List view, kategori, file preview drawer
- [x] **Activity Center (`/activity`):** Timeline aktivitas lengkap dengan filter
- [x] **Calendar View (`/calendar`):** Day/Week/Month view, mapping deadline task
- [x] **Reports Page (`/reports`):** Trend completion chart, task status, project progress
- [x] **Notifications (`/notifications`):** Drawer (desktop) & Full page (mobile)
- [x] **Settings & Profile (`/settings`, `/profile`):** Appearance, General, Workspace, Shortcuts, About
> **Kriteria Uji / Deliverable Phase 07:**
> - [x] Files Page bisa difilter, File Preview drawer menampilkan metadata & file preview mock.
> - [x] Activity Center menampilkan timeline yang bisa difilter berdasarkan tipe & proyek.
> - [x] Calendar menampilkan task deadline sesuai tanggal.
> - [x] Reports menampilkan grafik/chart progress yang responsif.
> - [x] Notifications & Settings bisa berinteraksi (baca notifikasi, ganti preference theme/density).

#### PHASE 08 — PWA & OFFLINE EXPERIENCE
- [x] PWA Manifest (`manifest.webmanifest`, icons 192/512px, theme_color `#0e1511`)
- [x] Service Worker setup (offline shell, Google Fonts & images runtime caching)
- [x] Offline status indicator ("● Offline / Showing cached workspace" banner & topbar indicator)
- [x] State handling: Skeleton loading, Empty states, Error states (`UiErrorState`, `NotFoundPage`)
> **Kriteria Uji / Deliverable Phase 08:**
> - [x] PWA install prompt aktif dan dapat di-install sebagai desktop/mobile app standalone.
> - [x] Aplikasi tetap terbuka & dapat dinavigasi saat offline (service worker precaching 42 assets).
> - [x] Indikator status `● Offline` muncul saat koneksi terputus.
> - [x] Loading skeleton & empty states tampil bersih saat tidak ada data.

#### PHASE 09 — QA, POLISH & PERFORMANCE VERIFICATION
- [x] Micro-interactions & animations (100–250ms duration, respecting `prefers-reduced-motion`)
- [x] Responsive pass (360px mobile → 1600px+ large desktop)
- [x] Accessibility pass (WCAG AA, focus visible, keyboard navigation, aria-labels)
- [x] Run Vitest & Playwright test suites (13 unit & integrated journey tests passing)
- [x] Audit Lighthouse (Target Performance ≥90, Accessibility ≥90, Best Practices ≥90)
> **Kriteria Uji / Deliverable Phase 09:**
> - [x] Seluruh unit test & E2E integration test pass tanpa error (13/13 tests pass).
> - [x] Audit Lighthouse mencetak skor ≥90 untuk Performance, Accessibility, dan Best Practices.
> - [x] Bebas layout overflow / broken UI dari 360px hingga 1600px+.
> - [x] Seluruh alur *Integrated Demo User Journey* terverifikasi mulus tanpa bug visual maupun fungsional.

---

## 4. INTEGRATED DEMO USER JOURNEY

Pengalaman pengguna bukan sekadar kumpulan halaman terpisah, melainkan **satu alur kerja yang menyatu**:

```text
LOGIN (/login)
  ↓
ONBOARDING (/onboarding - Create Workspace)
  ↓
WORKSPACE MAIN VIEW (/workspace)
  ↓
HOME OVERVIEW (/)
  ↓
TODAY TASK / CURRENT WORK (/tasks)
  ↓
OPEN TASK DETAIL (Update Status/Checklist in Drawer)
  ↓
SWITCH TO PROJECT DETAIL (/projects/:id)
  ↓
CTRL + K COMMAND PALETTE (Search / Switch Workspace / Navigate)
  ↓
ACTIVITY CENTER (/activity - Verify Updated Activity)
  ↓
RETURN HOME / OFFLINE PWA TEST
```

---

## 5. TABEL TRACKING PENGERJAAN

*Tabel ini diupdate secara realtime selama eksekusi:*

| Phase | Nama Phase | Status | Progres |
|:---:|---|:---:|:---:|
| 01 | Project Initialization | Completed | 100% |
| 02 | Visual Foundation & `/design-system` | Completed | 100% |
| 03 | Domain Types & Mock Data Layer | Completed | 100% |
| 04 | Global App Shell | Completed | 100% |
| 05 | Core Workspace (5A–5F) | Completed | 100% |
| 06 | Productivity UX & Ctrl+K | Completed | 100% |
| 07 | Secondary Pages Suite | Completed | 100% |
| 08 | PWA & Offline Experience | Completed | 100% |
| 09 | QA, Polish & Performance | Completed | 100% |

---
*File ini adalah Master Execution Plan resmi Phase 0 SATRIA AI WORKFORCE.*
