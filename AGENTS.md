# AGENTS.md — SATRIA AI WORKFORCE

## Product Identity

**SATRIA AI WORKFORCE** — PWA Web Workspace / "Your Digital Workforce Command Center"

Phase 0 (Workspace Foundation) and Phase 1 (Workforce Structure & Registry) are complete. The workspace is a fully functional dark-first enterprise UI with mock data. No AI agent runtime, no LLM, no backend — everything runs on Mock Repository Pattern with in-memory data.

> "Build the office first. Fill it with digital workforce. Automate execution later."

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
- **Phase 3 (Real Agent Runtime — Hermes Adapter & Pilot Worker):** Sub-Phases 3.1–3.5 100% Hardened & Verified ✅
  - Sub-Phase 3.1: Runtime Architecture & Interface Contract (`src/runtime/types.ts`, `RuntimeFactory.ts`, `MockRuntimeAdapter.ts`) ✅
  - Sub-Phase 3.2: Hermes Adapter & Protocol Gateway (`HermesClient.ts`, `HermesMapper.ts`, `HermesRuntimeAdapter.ts`) ✅
  - Sub-Phase 3.3: Context Synthesis & Skill Loader (`SkillLoader.ts`, `ContextBuilder.ts`) ✅
  - Sub-Phase 3.4: Safe Tool Sandbox & Telemetry (`SandboxPolicy.ts`, `CostCalculator.ts`, `VerificationEngine.ts`) ✅
  - Sub-Phase 3.5: Approval Gate & Hardened Human-in-the-Loop (`RunApprovalDrawer.vue`, `RunDetailPage.vue`, `useAgentRunStore`, Retry/Rejection Lifecycle, Sandbox Boundary & Symlink Defense) ✅
  - Sub-Phase 3.6: Observability Dashboard & Live Telemetry UI (Next Step ⏳)
  - QA & Validation: 61 Vitest tests pass across 10 suites, vue-tsc 0 errors, production build OK ✅

Archived blueprints & execution plans in `work-histori/`:
- `work-histori/01_PHASE0_PRD_PWA_Workspace_UIUX_v2.md`
- `work-histori/02_PHASE0_UIUX_BLUEPRINT.md`
- `work-histori/03_PHASE0_MASTER_EXECUTION_PLAN_SiapBekerja.md`
- `work-histori/04_PHASE1_MASTER_WORKFORCE_BLUEPRINT.md`
- `work-histori/05_PHASE1_EXECUTION_PLAN.md`
- `work-histori/06_PHASE2_PRD_TASK_ASSIGNMENT_AGENT_RUN.md`
- `work-histori/07_PHASE2_EXECUTION_PLAN.md`
- `work-histori/08_PHASE3_REAL_AGENT_RUNTIME_EXECUTION_PLAN.md`

---

## Commands

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # vue-tsc typecheck + vite production build
npm run preview      # preview production build
npm run typecheck    # vue-tsc --noEmit (strict mode)
npm run test:unit    # vitest run (29 tests across 4 suites)
```

**Required order:** `typecheck` → `test:unit` → `build`

---

## Key Paths

### Entry & Shell
- `src/main.ts` — entry point, mounts Pinia + Router
- `src/App.vue` — root component, wraps pages in AppShell (excludes `/login`, `/onboarding`)
- `src/layouts/AppShell.vue` — main layout shell (Sidebar + Topbar + BottomNav + Command Palette + Toast + Offline Banner)
- `index.html` — HTML entry with Geist & JetBrains Mono font loading via Google Fonts CDN

### Design System
- `src/assets/main.css` — Tailwind v4 `@theme` block with all design tokens (CSS custom properties), `prefers-reduced-motion`, `:focus-visible` ring, scrollbar styling
- `vite.config.ts` — Vite + `@tailwindcss/vite` + VitePWA config (manifest, workbox runtime caching)

### Routing
- `src/router/index.ts` — all lazy-loaded routes including `/workforce/*`, `/login`, `/onboarding`, catch-all `/:pathMatch(.*)*` → NotFoundPage

### State Management
- `src/stores/workspace.ts` — workspace CRUD, currentWorkspaceId, workspace switching
- `src/stores/project.ts` — projects by workspace
- `src/stores/task.ts` — tasks CRUD, status updates
- `src/stores/file.ts` — files by workspace, category filtering, search
- `src/stores/activity.ts` — activity logs, date grouping, multi-level filtering
- `src/stores/notification.ts` — notifications, unread count, mark read/dismiss
- `src/stores/theme.ts` — dark/light mode toggle, persists to `localStorage('satria_theme')`
- `src/stores/settings.ts` — user profile and workspace preferences
- `src/stores/department.ts` — Phase 1 departments & roles directory
- `src/stores/employee.ts` — Phase 1 digital employee CRUD, skills & tools assignment, status archive
- `src/stores/skill.ts` — Phase 1 internal & external reusable skill package registry
- `src/stores/workforceTool.ts` — Phase 1 toolset configuration and permission level registry

### Data Layer
- `src/types/index.ts` — all TypeScript interfaces (`Workspace`, `Project`, `Task`, `WorkspaceFile`, `ActivityLog`, `NotificationItem`, `Department`, `EmployeeRole`, `Employee`, `Skill`, `WorkforceTool`, etc.)
- `src/repositories/index.ts` — Mock Repository classes (`MockWorkspaceRepository`, `MockProjectRepository`, `MockTaskRepository`, `MockFileRepository`, `MockActivityRepository`, `MockNotificationRepository`, `MockUserRepository`, `MockDepartmentRepository`, `MockEmployeeRoleRepository`, `MockEmployeeRepository`, `MockSkillRepository`, `MockWorkforceToolRepository`)
- `src/mocks/mockData.ts` — realistic seed dataset (3 departments, 12 employee roles, 12 active employees, 20+ skills, 12 tools, 20+ tasks, 20 files, 22 activity logs, 10 notifications)

### Composables
- `src/composables/useToast.ts` — global toast notification state (success/warning/error/info, auto-dismiss)
- `src/composables/useNetwork.ts` — reactive `navigator.onLine` detection with dismissible offline warning
- `src/composables/usePwaInstall.ts` — PWA install prompt handling (`beforeinstallprompt`, `appinstalled`)

### UI Components (`src/components/ui/`)
- `UiButton.vue` — Primary, Secondary, Ghost, Danger variants; sm/md/lg sizes; loading/disabled states; icon slot
- `UiInput.vue` — label, placeholder, error, hint, disabled, icon support
- `UiBadge.vue` — success/warning/error/info/neutral variants; dot indicator; icon slot
- `UiCard.vue` — header/default slots; hoverable; padding variants
- `UiModal.vue` — backdrop blur overlay; header/footer slots; close handler
- `UiDrawer.vue` — right-slide panel; title + close; scroll content
- `UiToast.vue` — fixed bottom-right; icon + message + description; 4 variants
- `UiProgress.vue` — percentage bar with label
- `UiSkeleton.vue` — animated loading placeholder (configurable width/height)
- `UiEmptyState.vue` — title + description + action slot
- `UiErrorState.vue` — error display with icon and retry slot
- `UiOfflineBanner.vue` — sticky amber banner when offline, dismissible

### Layout Components (`src/components/layout/`)
- `Sidebar.vue` — expand/collapse (w-62.5 / w-17), workspace selector, nav links with active state, Workforce section, notification counter
- `Topbar.vue` — breadcrumb, search trigger (Ctrl+K), online/offline indicator, PWA install button, notification badge, user avatar
- `BottomNav.vue` — mobile sticky bottom navigation (visible < md breakpoint)
- `CommandPalette.vue` — Ctrl+K modal search overlay for pages, employees, tasks, projects, workspace switching

### Pages (`src/pages/`)
- `workforce/WorkforceOverviewPage.vue` — 5 KPI cards, 3 department overview cards, workflow hierarchy matrix, roster spotlight
- `workforce/DepartmentsPage.vue` — department directory, metrics, role breakdown
- `workforce/DepartmentDetailPage.vue` — department details, allocated employees, role specifications & responsibilities
- `workforce/EmployeesPage.vue` — employee directory, department & status filter pills, search input, employee cards
- `workforce/CreateEmployeePage.vue` — 7-step guided wizard (Identity → Department/Role → Responsibilities → Skills → Tools → Supervisor → Review)
- `workforce/EmployeeDetailPage.vue` — 6-tab profile (Overview, Responsibilities, Skills + Add Modal, Tools + Add Modal, Activity, Settings)
- `workforce/SkillsPage.vue` — skill registry, source repository & install command copy, custom skill registration modal
- `workforce/ToolsPage.vue` — toolset registry, permission access levels, tool registration modal
- `auth/LoginPage.vue` — dark split login with demo credentials pre-filled
- `auth/OnboardingPage.vue` — 4-step wizard (Welcome → Name → Archetype → Launch)
- `overview/HomePage.vue` — 4 KPI cards, Today Focus tasks, Current Work progress, Recent Activity feed
- `workspace/WorkspacePage.vue` — workspace summary stats, project cards grid
- `projects/ProjectsPage.vue` — project directory with progress bars
- `projects/ProjectDetailPage.vue` — milestones, task breakdown, progress detail
- `tasks/TasksPage.vue` — List/Board view switcher, filter/search, interactive Task Detail Drawer (checklist + comments), create modal
- `files/FilesPage.vue` — category pills, grid/table view, file preview drawer (code syntax + image render), upload modal
- `activity/ActivityCenterPage.vue` — grouped timeline (Today/Yesterday/Earlier), multi-level type/target filtering
- `calendar/CalendarPage.vue` — month/week/day view, deadline grid plotting, agenda sidebar
- `reports/ReportsPage.vue` — KPI metrics, SVG velocity trend chart, status breakdown, project health table
- `notifications/NotificationsPage.vue` — tabs, unread toggle, priority badges, mark read/dismiss
- `settings/SettingsPage.vue` — General, Appearance (dark/light toggle), Workspace, Notifications, Shortcuts, About
- `DesignSystemPage.vue` — full component showcase with dark/light and mobile simulation
- `NotFoundPage.vue` — 404 catch-all with "Return Home" action

### Testing
- `src/test/repositories.spec.ts` — 11 unit tests for Workspace & Workforce Mock Repository CRUD operations
- `src/test/userJourney.spec.ts` — 7 integrated demo user journey tests
- `src/test/workforceJourney.spec.ts` — 6 comprehensive workforce journey tests (overview, department filter, employee wizard, skills assignment, archive/restore, skill registration)


---

## Architecture Rules

### NO-AGENT RULE (Phase 0 Absolute Constraint)
No AI agent runtime, LLM calls, orchestration engine, memory engine, tool execution, Hermes integration, Discord integration, or autonomous workflow. All data is mock. This rule applies to the entire codebase until Phase 1+ begins.

### Tailwind v4
Loaded via `@tailwindcss/vite` plugin (NOT PostCSS). Design tokens defined as CSS custom properties inside `@theme {}` block in `src/assets/main.css`. Do NOT use `tailwind.config.js` — it does not exist and is not needed.

### TypeScript Strict Mode
`tsconfig.json` has `strict: true`, `bundler` moduleResolution, `noEmit: true`. All components use `<script setup lang="ts">`. All props use `defineProps<{}>()` with explicit types.

### Path Alias
`@/` resolves to `src/` via Vite config. Use `@/` in imports when appropriate, but relative imports (`../../`) are also acceptable within the existing codebase.

### Store Pattern
Every Pinia store uses `defineStore` with Composition API (`setup()` function style). Stores call Mock Repository methods — they never import `mockData` directly. Theme store persists to `localStorage('satria_theme')`.

### Mock Repository Pattern
`src/repositories/index.ts` exports classes with async methods that operate on the arrays in `src/mocks/mockData.ts`. Stores are the only consumers of repositories. Pages and components only interact with stores.

### PWA Configuration
`vite-plugin-pwa` with `registerType: 'autoUpdate'`, `generateSW` mode. Workbox runtime caching for Google Fonts (CacheFirst, 1 year) and Unsplash images (StaleWhileRevalidate, 30 days). Precaches all built JS/CSS/HTML/icons.

---

## Design System Rules

### Visual Direction
- **Personality:** Calm, Precise, Premium, Technical, Focused, Fast
- **Reference:** Linear-like clarity + Notion-like workspace + modern enterprise command center
- **Avoid:** Cyberpunk, neon overload, heavy gradients, glassmorphism, game dashboards, card spam, continuous animation

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
| Amber | `#f59e0b` | Offline indicator, caution states |
| On-Surface | `#dde4dd` | Primary text |
| On-Surface Variant | `#bbcabf` | Secondary text, descriptions |
| Muted | `#86948a` | Metadata, timestamps, labels |
| Outline | `#3c4a42` | Strong borders |
| Outline Variant | `#242c27` | Hairline borders (1px solid) |

### Typography
- **Sans:** Geist (loaded via Google Fonts CDN) — all UI text, headings, body
- **Mono:** JetBrains Mono — metrics, IDs (`tsk-101`, `ws-dev`), file extensions, dates, code, logs
- **Scale:** Display 36–40px / H1 28–32px / H2 22–24px / Body 14–16px / Caption 12px / Micro 10–11px

### Spacing & Radius
- **Spacing base:** 4px (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64`)
- **Controls (Button/Input):** `border-radius: 8–10px`
- **Cards/Containers:** `border-radius: 12–16px`
- **Pills/Badges:** `border-radius: 9999px`

### Icons
- **Library:** Lucide Icons (`@lucide/vue`) — stroke-based, 1.5–2px stroke weight
- **Sizes:** 16px (inline), 20px (standard), 24px (large)
- **Rule:** No emoji as structural icons. Consistent stroke style within same hierarchy level.

### Elevation
- Tonal surface layering instead of box-shadow
- Hairline borders (`1px solid $outline-variant`) for separation
- Only floating elements (modals, drawers, toasts) use shadow

### Responsive Breakpoints
| Breakpoint | Range | Layout |
|---|---|---|
| Mobile | 360–767px | Sidebar hidden, BottomNav visible, single-column |
| Tablet | 768–1199px | Sidebar collapsed, 2-column adaptive |
| Desktop | 1200–1599px | Sidebar expanded, full layout |
| Large Desktop | 1600px+ | `max-w-[1600px]` content container |

### Accessibility
- `:focus-visible` ring: 2px solid `#4edea3`, offset 2px (defined in `main.css`)
- `prefers-reduced-motion: reduce` globally disables animations (defined in `main.css`)
- WCAG AA text contrast: primary text `#dde4dd` on `#0e1511` = 13.8:1
- Status always conveyed via icon + text + color (never color alone)

---

## Integrated Demo User Journey

The full flow implemented across all pages:

```
LOGIN (/login) → ONBOARDING (/onboarding) → WORKSPACE (/workspace) → HOME (/) → TASKS (/tasks) → TASK DETAIL (Drawer) → PROJECT DETAIL (/projects/:id) → CTRL+K (Command Palette) → ACTIVITY (/activity) → HOME / OFFLINE TEST
```

---

## Known Gaps & Future Work

- No ESLint/Prettier config (lint script missing from `package.json`)
- No Playwright E2E browser tests (only Vitest unit/integration tests)
- Fonts (Geist, JetBrains Mono) loaded from CDN — not bundled locally
- Light mode is functional but not fully polished across all pages
- Phase 1+ will introduce actual AI agent runtime, LLM integration, and real backend