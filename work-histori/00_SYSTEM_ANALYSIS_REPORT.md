# Analisis SATRIA AI Workforce — PRD vs Implementasi

**Metodologi:** Laporan ini bukan review superfisial. Saya meng-*unzip* project, menjalankan `npx vue-tsc --noEmit` dan `npx vitest run` secara langsung (bukan percaya klaim di dokumentasi), membaca source code inti (runtime/autonomy, stores, verification engine, sandbox policy), dan menelusuri call-chain untuk memastikan fitur yang "diklaim selesai" benar-benar tersambung ke UI — bukan cuma ada di file tapi tidak pernah dipanggil.

**Hasil verifikasi teknis (real, bukan klaim):**
| Cek | Hasil |
|---|---|
| `vue-tsc --noEmit` | ✅ 0 error |
| `vitest run` | ✅ 173/173 test pass, 28 suite |
| `playwright test` (e2e) | ❌ **"No tests found"** — folder `e2e/` tidak ada di project, padahal `AGENTS.md` mengklaim ada `e2e/goldenPath.spec.ts` |
| Ukuran project | 59 file `.vue`, 94 file `.ts`, ~9.000 baris di `src/pages` saja |

Kesimpulan awal: ini **bukan prototipe UI kosong**. Arsitektur runtime-nya (retry policy, failure classifier, sandbox, verification engine) sungguh diimplementasikan dengan disiplin rekayasa yang bagus. Tapi ada gap penting antara "modul yang ada di source code dan lulus unit test" vs "modul yang benar-benar tersambung ke alur aplikasi yang dipakai user" — detail di bawah.

---

## 1. Analisis PRD vs Implementasi

### 1.1 Yang terbukti SESUAI PRD

| Area PRD | Section | Bukti di Kode |
|---|---|---|
| Entity hierarchy (Workspace→Project→Task→Assignment→Employee→Run→Result→Verification→Review→Artifact) | §6 | Store per-entity lengkap (`workspace.ts`, `project.ts`, `task.ts`, `assignment.ts`, `employee.ts`, `agentRun.ts`, `review.ts`) |
| Task Status: Backlog/In Progress/Blocked/Review/Done | §9 | `type TaskStatus` di `types/index.ts` match persis |
| Retry max 3 attempt | §20 | `RetryPolicy.ts`, teruji di `autonomousTaskLoop.spec.ts` (test eksplisit attempt ke-3 → Blocked) |
| Failure classification (Network/Timeout/Security/Sandbox/dst) | §21 | `FailureClassifier.ts` dengan kategori `FATAL_SECURITY_VIOLATION`, `MAX_ATTEMPTS_EXCEEDED`, dll |
| Verification Engine (Tests/Typecheck/Build/Criteria/Artifact/Diff/Security) | §27 | 7 file rule di `src/runtime/verification/rules/` — semua ada, bukan cuma placeholder |
| Sandbox boundary / path traversal defense | §40 | `SandboxPolicy.ts` — diuji di `sandboxBoundary.spec.ts` (10 test) |
| Human-in-the-loop approval, tidak bisa di-bypass | §23 | `RunApprovalDrawer.vue` + `agentRunStore` — approve/reject async, error handling proper |
| Real Hermes integration (bukan cuma mock) | §15, §48 | `HermesClient.ts`, `HermesMapper.ts`, real SSE parser + exponential backoff, ada run ID nyata `run_d8326baa7df04f2a930d309a6f178d12` dengan token usage di §73 |
| Cost/Telemetry tracking | §35, §36 | `CostCalculator.ts`, `modelPricing.ts` — model pricing table lengkap, dipakai nyata di Governance Dashboard |
| 18 modul produk (§56) | — | Semua 18 modul punya route & halaman fungsional di `router/index.ts` |
| Future items (Memory, Multi-agent, Scheduler, External Channel, Multi-tenant) | §60–§66 | **Benar tidak diimplementasikan** — dan PRD sendiri memang menandainya "FUTURE", jadi ini bukan gap, sesuai rencana |

### 1.2 GAP KRITIS: "Autonomous Task Loop" tidak ter-*wire* ke aplikasi live

Ini temuan terpenting di seluruh audit. PRD §18 menyebut `AutonomousTaskLoop` sebagai **"jantung Phase 3.9"**, dan `AGENTS.md` mengklaim "Phase 3.9: Autonomous Task Loop & Lifecycle Governance — 100% Complete ✅".

Faktanya, setelah saya `grep` seluruh codebase untuk siapa yang memanggil `AutonomousTaskLoop.orchestrate()` dan `handleRunEvaluation()`:

```
Hasil grep di luar file test:
- src/runtime/index.ts  → cuma re-export (export * from ...)
- src/stores/agentRun.ts → cuma disebut di KOMENTAR, tidak pernah di-import/dipanggil
```

**Tidak ada satupun komponen `.vue` atau store yang benar-benar memanggil class ini.** Class-nya lengkap, arsitekturnya benar, unit test-nya (`autonomousTaskLoop.spec.ts`, 14 test) lulus semua — tapi hanya karena test file itu sendiri yang membuat instance dan memanggilnya secara langsung/terisolasi. Di aplikasi yang sungguhan berjalan di browser, **class ini tidak pernah dieksekusi**.

Konsekuensi nyata yang saya verifikasi lebih lanjut:
- `src/stores/review.ts` → `submitDecision('Changes Requested', comment)` **hanya mengubah status record review**. Tidak memanggil `retryRun()`, tidak memanggil `FeedbackBuilder`, tidak memanggil `AutonomousTaskLoop` sama sekali.
- `agentRunStore.retryRun(runId)` hanya menerima parameter `runId` — **tidak ada parameter feedback/reviewer comment**. Artinya walau reviewer menulis komentar detail di "Changes Requested", komentar itu **tidak pernah masuk ke context retry berikutnya** secara otomatis.
- Satu-satunya jalan retry yang benar-benar jalan hari ini adalah: **manusia klik tombol "Retry Run" di `RunDetailPage.vue`** — manual, bukan autonomous.

Yang SUDAH otomatis dan nyata (perlu diapresiasi juga):
- `VerificationEngine.evaluate()` **beneran** dipanggil setiap run selesai (di `agentRunStore`, sekitar baris 285).
- Hasil verifikasi **beneran** otomatis menentukan status review awal: `Failed` → `'Changes Requested'`, `Passed` → `'Pending'`. Ini implementasi PRD §29 yang benar ("Task tidak boleh otomatis Done hanya karena Run=Completed").
- Jadi: **deteksi kegagalan otomatis, tapi penyembuhan diri (self-healing retry) tidak otomatis.** PRD menjual "self-healing", kenyataannya "self-diagnosing, human-healing".

> **Kenapa ini penting untuk kamu ketahui:** Ini bukan bug kecil UI. Ini gap antara *klaim arsitektur* dan *perilaku produk sungguhan*. Kalau ada stakeholder/investor/user yang baca PRD lalu coba demo app-nya, mereka akan menemukan bahwa "autonomous retry loop" itu sebenarnya masih manual — reviewer harus sadar sendiri, buka halaman Runs, klik retry sendiri, tanpa feedback loop otomatis.

### 1.3 Gap lain vs PRD

| PRD Section | Klaim | Realita di Kode |
|---|---|---|
| §38 Notification System (7 trigger: Approval/Failed/Completed/Review Required/Changes Requested/Retry Started/Security Violation) | Semua event penting harus generate notifikasi | Hanya **3 dari 7** yang jalan nyata (Approval Required/Granted/Rejected — semua di `agentRun.ts`). `review.ts`, `AutonomousTaskLoop`, dan task completion **tidak pernah** memanggil `notificationStore`. Task Blocked (max retry habis), Review Approved, Security Violation — tidak ada notifikasi otomatis. |
| §67 Permission Model (View/Create/Execute/Approve/Manage/Admin per role) | Agent/User punya permission boundary | **Tidak ada penegakan RBAC di UI sama sekali.** `LoginPage.vue` menerima kredensial apa pun, tidak ada route guard di `router/index.ts` atau `App.vue`. Semua pengguna (kalau memang multi-user) bisa mengakses tombol Approve/Reject high-risk action tanpa cek role. |
| §72 "Current Engineering Baseline" — testing claim | "173 Vitest tests... Playwright Golden Path e2e suite" | Vitest **benar** 173/173. Tapi **Playwright e2e-nya fiktif** — `playwright.config.ts` menunjuk ke `./e2e` yang tidak ada di project sama sekali. `npm run test:e2e` hasilnya `Error: No tests found`. |
| §25 Artifact System ("Artifact harus berasal dari actual execution output") | Artifact = hasil eksekusi nyata | **Benar untuk jalur Hermes run** (artifact dari hasil eksekusi asli). Tapi modul **Files** (`FilesPage.vue`) yang terpisah — upload file di sana 100% palsu: tidak ada `<input type="file">`, tidak ada FileReader, ukuran file di-hardcode `1048576 bytes` ("1.0 MB") untuk SEMUA file apa pun namanya, `contentPreview` selalu string statis `'Mock uploaded file contents ready for preview.'` |

---

## 2. Analisis Fitur — Kelengkapan Modul

Skor 0–100% = seberapa jauh modul itu benar-benar fungsional & terhubung ke data nyata (bukan sekadar halaman render).

| # | Modul | Skor | Catatan |
|---|---|---|---|
| 1 | **Workforce/Employee Management** (CRUD, 7-step wizard, skill/tool assignment, archive) | 90% | Paling matang. `CreateEmployeePage.vue` wizard lengkap, `EmployeeDetailPage.vue` 6 tab (termasuk tab Work & Runs riwayat nyata). |
| 2 | **Skill & Tool Registry** | 85% | Fungsional penuh, CRUD lengkap, tapi "install command" untuk external tool packages sifatnya kosmetik/copy-text saja (wajar, tidak ada backend eksekusi nyata). |
| 3 | **Task Assignment & Skill Matching** | 85% | `calculateSkillMatch()` logic nyata (required/optional skill %, eligibility check) — bukan random/fake. |
| 4 | **Agent Run Monitor + Runtime (Hermes)** | 80% | Real SSE streaming, real telemetry, real approval gate. Kurangnya di poin autonomous retry (lihat §1.2). |
| 5 | **Verification Engine & Quality Gate** | 80% | 7 rule real, evaluasi per-kriteria nyata (bukan auto-pass), tapi hasilnya tidak memicu aksi lanjutan otomatis (lihat §1.2). |
| 6 | **Cost & Governance Dashboard** | 80% | Perhitungan cost real dari token usage aktual, export report REAL (pakai Blob, bukan fake alert) — modul paling "jujur" dari sisi evidence-based UI. |
| 7 | **Review Hub** | 65% | UI/presentasi bagus (diff viewer, evidence panel, quality gate card — hasil kerja Phase 3.8 yang solid), tapi decision "Changes Requested" tidak memicu apa pun otomatis (lihat §1.2). |
| 8 | **Task Management (List/Board)** | 65% | CRUD dasar jalan, tapi due date & "today" logic hardcoded ke tanggal tetap `2026-08-14` (lihat §4). |
| 9 | **Projects** | 60% | Tampilan bagus tapi statistik "Files: 28", "Contributors: 4" di beberapa tempat hardcoded, bukan dihitung dari data real. |
| 10 | **Calendar** | 55% | UI kalender lengkap (month/week/day view switcher ada tab-nya), tapi "Today"/"Upcoming" logic sama-sama pakai tanggal hardcoded, bukan `new Date()`. |
| 11 | **Notifications** | 55% | UI & filter/mark-read/delete berfungsi sempurna, tapi generator notifikasi otomatis cuma cover approval flow (3 dari 7 trigger PRD, lihat §1.3). |
| 12 | **Reports/Analytics** | 45% | Angka-angka dihitung dari store real (`completedTasksCount`, `completionRate` computed asli), TAPI: time-range selector tidak fungsional (cuma toggle visual), tombol Export = `alert()` palsu tanpa file sungguhan. |
| 13 | **Files Manager** | 30% | **Paling lemah.** Upload sepenuhnya kosmetik (lihat §1.3), drag-drop zone dekoratif tanpa handler, download = `alert()` palsu. |
| 14 | **Home Dashboard/Overview** | 55% | KPI card sebagian real (`activeTasksCount`, `blockedTasksCount` computed dari store), tapi Recent Activity feed import `mockActivityLogs` statis — tidak terhubung ke `activityStore` yang sebenarnya sudah di-fetch di `AppShell.vue`. Quick Create Task mengabaikan input "Project Name" user (project ID di-hardcode). |
| 15 | **Settings / AI Runtime Config** | 85% | Mengejutkan bagus — "Test Connection & Fetch Models" benar-benar melakukan `fetch()` nyata ke endpoint dengan timeout, bukan simulasi. |
| 16 | **Onboarding & Login** | 40% | Kosmetik penuh — auth apa pun diterima, tidak ada validasi, tidak ada route guard sama sekali (semua path bisa diakses langsung tanpa login). |
| 17 | **Design System Page** | 90% | Referensi token warna & komponen lengkap dan konsisten dipakai — tapi ironisnya beberapa halaman lain (lihat §3) tidak patuh ke token ini. |
| 18 | **Activity Center** | 70% | `activityStore` real dan di-log dari beberapa event (approval flow), tapi tidak semua event penting (task blocked, review approved, dst.) mengisi log ini. |

**Rata-rata kelengkapan fungsional keseluruhan platform: ~65%** — cukup tinggi untuk ukuran "PWA workspace app", tapi jomplang: modul inti workforce/runtime sangat matang (80–90%), modul pendukung (Files, Reports, Home widget) jauh lebih lemah (30–55%) dan justru berisiko merusak kepercayaan user karena tampak "berhasil" padahal palsu.

---

## 3. Analisis UI/UX

### 3.1 Kekuatan
- **Information architecture bagus**: sidebar dikelompokkan 5 section logis (Overview / Workforce / Execution & Runtime / Work / Insights & System), konsisten antara desktop sidebar dan mobile bottom-sheet (`BottomNav.vue` cover semua 18 item yang sama).
- **Design system disiplin**: ada token warna lengkap (dark-first palette, `#0e1511` base dst.), font pairing Geist + JetBrains Mono, komponen `Ui*` reusable (`UiButton`, `UiCard`, `UiDrawer`, `UiBadge`, `UiSkeleton`, `UiEmptyState`, `UiErrorState`) — ini pola arsitektur UI yang matang, bukan kumpulan halaman ad-hoc.
- **Aksesibilitas diperhatikan serius**, bukan basa-basi: `role="dialog"` + `aria-modal` di drawer, `role="tablist"`/`role="tab"` + `aria-selected` konsisten di semua tab switcher (Settings, Reports, Calendar, Notifications), `role="alert"` + `aria-live="assertive"` khusus untuk banner approval-required (prioritas tepat — ini memang harus segera diketahui user), `aria-label` menyeluruh di tombol icon-only.
- **Empty state & error state** dipikirkan sebagai first-class component (`UiEmptyState.vue`, `UiErrorState.vue`), bukan `v-if` kosong yang menampilkan halaman blank.
- **Human-in-the-loop approval UX** dieksekusi dengan sangat baik: warna amber konsisten untuk urgensi, visual diff dengan syntax highlighting (+/-/@@), reject-flow punya form feedback terpisah (bukan langsung hilang), tombol disable saat submitting + loading state jelas.
- **Quick Dispatch Bar** di Home adalah pola UX yang bagus — satu tempat untuk ketik instruksi, pilih agent, pilih model, langsung eksekusi. Ini yang bikin produk terasa seperti "workforce command center", bukan sekadar CRUD app biasa.

### 3.2 Kelemahan (evidence-based, bukan opini gaya)
1. **Theme switching kemungkinan besar rusak di 7 halaman.** Ada `themeStore` dengan toggle dark/light yang tersimpan ke `localStorage`, tapi `WorkspacePage.vue`, `ProjectsPage.vue`, `ProjectDetailPage.vue`, `ReportsPage.vue`, `ReviewsPage.vue`, `WorkforceOverviewPage.vue`, `GovernanceDashboardPage.vue` memakai hex color hardcoded (`text-[#dde4dd]`, `bg-[#242c27]`, dst.) bukan token semantik (`text-on-surface`) yang dipakai halaman lain. Kalau user toggle ke light mode, halaman-halaman ini kemungkinan tetap gelap → kontras rusak, brand inconsistency.
2. **"Fake success" UI pattern** — hal paling ironis dalam audit ini. Prinsip inti PRD (§4.4 "Evidence-Based Verification", filosofi "no fake success status") justru dilanggar oleh UI-nya sendiri: tombol Export di Reports dan tombol Download di Files cuma `alert()` tanpa aksi nyata, padahal solusinya (Blob + `URL.createObjectURL`) sudah ada dan dipakai benar di Governance Dashboard. User yang klik Export di Reports akan percaya file sudah terunduh padahal tidak ada apa-apa yang terjadi.
3. **Tanggal statis** — "Good morning, Satria — Friday, 14 August 2026" di Home ter-hardcode sebagai string, bukan dihitung dari `new Date()`. Begitu juga logic "Due Today" (`dueDate === '2026-08-14'`) di Home & Calendar. Ini akan langsung terlihat salah begitu di-demo di hari lain.
4. **Priority color coding kurang granular** — `getPriorityVariant()` di Home cuma bedakan "Urgent/High" (warning) vs sisanya (neutral); Low & Medium sama-sama abu-abu, kurang membantu scanning visual cepat.
5. **Onboarding wizard eksplisit menyebut dirinya mock** — teks di `OnboardingPage.vue`: *"Mock Repository Data Layer (Zero backend runtime needed)"*. Transparan itu bagus untuk developer, tapi kalau ini yang dilihat calon user/stakeholder saat demo, kesan "production-ready" langsung runtuh.
6. **Filter yang terlihat interaktif tapi tidak berfungsi** menciptakan *false affordance* — time-range selector di Reports terlihat seperti tab yang bisa diklik (styling active-state lengkap), tapi tidak mengubah data apa pun. Ini pola UX yang berbahaya karena user tidak akan tahu fitur itu tidak nyata sampai mereka membandingkan data sebelum/sesudah klik.

### 3.3 Yang belum bisa saya verifikasi visual
Saya tidak bisa render browser screenshot langsung (Playwright gagal instal Chromium karena network sandbox ini memblokir `cdn.playwright.dev`). Analisis di atas murni dari pembacaan kode Vue + Tailwind class, dikonfirmasi silang dengan reference screenshot desain (`refrensi/*/screen.png`) yang kamu sertakan. Untuk cek kontras warna real, animasi transisi, dan responsive breakpoint edge-case, sebaiknya dites langsung di browser (`npm run dev`).

---

## 4. Analisis Workflow

### 4.1 Alur "Bahagia" (Happy Path) — end-to-end, saya telusuri call-chain-nya

```
User buka Home → QuickDispatchBar
  → ketik instruksi + pilih Digital Employee + model
  → dispatch → agentRunStore.startRunFromAssignment()
  → RuntimeFactory pilih adapter (hermes/mock)
  → HermesRuntimeAdapter → HermesClient → SSE event stream REAL
  → event: progress:updated / telemetry:updated → UI update reactive
  → [KALAU high-risk tool] → event: approval:required
      → notificationStore.createNotification() [REAL]
      → RunApprovalDrawer muncul → user approve/reject
      → approve → runtime.respondApproval() → run lanjut
  → run selesai → globalResultIngestor.buildRuntimeResult()
  → VerificationEngine.evaluate() [REAL, 7 rules]
  → resultRepo.create() + reviewRepo.create()
      → verification Passed → review status 'Pending'
      → verification Failed → review status 'Changes Requested'
  → user buka /reviews → ReviewDrawer → lihat evidence/diff/artifact
  → reviewer submitDecision('Approved' | 'Changes Requested' | 'Rejected')
      → [Approved] → HANYA update record review. Task TIDAK otomatis
        pindah ke 'Done' — task status di-manage terpisah, perlu dicek
        apakah ada trigger lain (task store tidak subscribe ke review store)
      → [Changes Requested] → HANYA update record review.
        TIDAK ADA retry otomatis, TIDAK ADA feedback diteruskan ke run baru.
        Task diam di status lama sampai manusia sadar & buka /runs
        untuk klik "Retry Run" manual.
```

**Temuan workflow paling signifikan:** alur di atas menunjukkan **dua titik putus (broken loop)**:
1. Antara **Review decision** dan **Task status** — saya tidak menemukan kode yang menyinkronkan `TaskReview.status = 'Approved'` dengan `Task.status = 'Done'` secara otomatis (`review.ts` dan `task.ts` tidak saling memanggil). Ini berarti PRD §32 ("Review Approved → Task Done") kemungkinan perlu update manual terpisah oleh user di halaman Tasks — dua sumber kebenaran (review status vs task status) yang berpotensi tidak sinkron.
2. Antara **Review "Changes Requested"** dan **Retry eksekusi** — sudah dijelaskan detail di §1.2.

### 4.2 Alur Approval (High-Risk Tool) — SUDAH BAGUS
Ini satu-satunya sub-workflow yang saya verifikasi **benar-benar closed-loop** dari ujung ke ujung: event dari runtime → notifikasi real → UI intercept → decision → resume/cancel run → notifikasi hasil → activity log. Tidak ada broken link di sini. Kalau saya harus tunjuk satu bagian dari SATRIA yang paling "production-grade", ini dia.

### 4.3 Alur Task Management mandiri (independen dari Agent Run)
Task bisa dibuat & diubah manual (checkbox toggle Done/In Progress di Home, drag/status update di Tasks board) tanpa lewat agent run sama sekali. Ini masuk akal untuk task non-AI (manual/administrative), tapi berarti **ada dua jalur berbeda untuk mengubah `Task.status`**: (a) manual oleh manusia, (b) [seharusnya] otomatis oleh AutonomousTaskLoop. Karena jalur (b) tidak aktif (§1.2), saat ini praktis semua perubahan status task — termasuk yang berasal dari task yang dikerjakan agent — bergantung pada manusia yang secara eksplisit meng-update-nya, entah lewat halaman Tasks atau lewat asumsi implisit di alur run. Ini titik rawan data-integrity kalau produk berkembang.

### 4.4 Ringkasan gap alur vs klaim
| Klaim di PRD | Realita workflow |
|---|---|
| "Bounded Autonomy" — retry otomatis sampai 3x | Retry harus diklik manual setiap kali |
| "Feedback Loop" — reviewer comment masuk ke retry context | Reviewer comment tidak pernah diteruskan ke run berikutnya |
| "Task tidak Done otomatis, harus lewat Review Approved" | Verification-gate ke Review sudah otomatis ✅, tapi Review Approved → Task Done nampaknya **belum** otomatis tersambung |
| "Semua tindakan penting menghasilkan audit event" (§37) | Activity log hanya ter-populate dari approval flow, bukan dari retry/block/review-decision |

---

## 5. Saran Perbaikan (Prioritas)

### 🔴 P0 — Kritis, langsung berdampak ke kepercayaan produk & janji inti PRD

1. **Sambungkan `AutonomousTaskLoop` ke alur nyata.**
   Panggil `AutonomousTaskLoop.orchestrate()`/`handleRunEvaluation()` dari `agentRunStore` tepat setelah `VerificationEngine.evaluate()` selesai, dan dari `reviewStore.submitDecision()` saat decision = `'Changes Requested'`. Tambahkan parameter `reviewerComment` ke `retryRun()` supaya `FeedbackBuilder` benar-benar dipakai. Ini investasi tertinggi karena arsitekturnya **sudah ada dan sudah teruji** — ini murni soal *wiring*, bukan membangun dari nol. Estimasi effort jauh lebih kecil dibanding value yang didapat (fitur andalan produk jadi benar-benar nyata).

2. **Hapus atau ganti semua `alert()` fake-success dengan aksi nyata.**
   Pola solusinya sudah ada di `GovernanceDashboardPage.vue` (`Blob` + `URL.createObjectURL`). Tinggal replikasi ke `ReportsPage.vue` (export) dan `FilesPage.vue` (download). Ini quick-win 1–2 jam kerja per halaman, tapi dampak kepercayaan user besar — fake success message adalah anti-pattern paling berbahaya di produk yang jualan "evidence-based trust".

3. **Perbaiki tanggal hardcoded.** Ganti semua `'2026-08-14'` dengan `new Date().toISOString().split('T')[0]` (atau computed reactive). Ada di `HomePage.vue`, `CalendarPage.vue`, `TasksPage.vue`. Ini bug yang PASTI ketahuan di demo/produksi kapan pun setelah tanggal itu lewat.

4. **Sinkronkan Review decision ↔ Task status.** Saat review `Approved`, pastikan `taskStore.updateTaskStatus(taskId, 'Done')` benar-benar dipanggil (cek dan tambahkan jika belum ada subscription/watcher antara kedua store).

5. **Perbaiki klaim dokumentasi.** `AGENTS.md` menyebut e2e Playwright test yang tidak ada di file zip ini. Kalau memang sudah pernah dibuat lalu terhapus/tidak ter-include saat export, restore file-nya. Kalau memang belum pernah dibuat, ubah klaim di dokumentasi supaya tidak menyesatkan tim/reviewer berikutnya — dokumentasi yang overclaim adalah risiko besar untuk project sebesar ini yang jelas dikerjakan dengan bantuan multiple AI coding session (`work-histori/`).

### 🟡 P1 — Penting, memengaruhi kualitas & konsistensi produk

6. **Modul Files perlu dibangun ulang secara fungsional minimal**, bukan sekadar metadata form. Untuk PWA browser-only tanpa backend storage, minimal implementasikan: `<input type="file">` + `FileReader` untuk baca nama/ukuran/tipe asli, simpan content sebagai base64/Blob di IndexedDB (yang sudah ada infrastrukturnya via `DatabaseClient.ts`) supaya preview & download benar-benar berfungsi terhadap file yang di-upload user, bukan file dummy.

7. **Tuntaskan notification triggers PRD §38** yang belum jalan: Task Completed, Task Blocked, Review Approved/Changes Requested, Security Violation. Karena `AutonomousTaskLoop` akan mulai jalan (P0 #1), ini momen tepat menambahkan `notificationStore.createNotification()` di titik-titik transisi state-machine yang sama.

8. **Audit ulang semua halaman untuk migrasi ke design token semantik**, hapus hex hardcoded di 7 file yang teridentifikasi (`WorkspacePage`, `ProjectsPage`, `ProjectDetailPage`, `ReportsPage`, `ReviewsPage`, `WorkforceOverviewPage`, `GovernanceDashboardPage`). Test manual toggle dark/light di setiap halaman itu setelah perbaikan.

9. **Hubungkan Home "Recent Activity" ke `activityStore` real**, bukan `mockActivityLogs` statis, supaya konsisten dengan Activity Center yang datanya sudah live.

10. **Buat time-range filter di Reports benar-benar fungsional** (filter `taskStore`/`agentRunStore` berdasarkan rentang tanggal terpilih) — atau, kalau memang belum siap, ganti jadi elemen non-interaktif/disabled dengan label "Coming Soon" supaya tidak menyesatkan (affordance harus jujur terhadap fungsi).

### 🟢 P2 — Baik untuk kualitas jangka panjang, tidak mendesak

11. **Terapkan RBAC dasar** sesuai PRD §67 minimal untuk membedakan siapa yang boleh klik Approve/Reject pada high-risk action — bahkan untuk single-user local app, ini penting sebagai *fondasi* sebelum multi-tenant (§66) mulai dikerjakan nanti, supaya tidak perlu re-arsitektur besar.

12. **Pindahkan API key runtime dari `localStorage` plaintext** (`aiRuntimeConfig.ts`) ke penyimpanan yang sedikit lebih aman, atau minimal beri warning UI eksplisit "API key disimpan di browser storage" — ini standar untuk local-dev tool, tapi worth didokumentasikan supaya tidak mengejutkan user enterprise.

13. **Tambahkan real e2e test suite** (`e2e/goldenPath.spec.ts` sesuai klaim), atau minimal restore yang sudah pernah ada. Vitest unit test sudah bagus tapi tidak menguji integrasi lintas-halaman (mis. dispatch task → approval → review → task done) yang justru paling relevan untuk PRD ini.

14. **Perbaiki priority color-coding** (Low/Medium/High/Urgent) agar lebih granular secara visual, bukan cuma binary warning/neutral.

15. **Pertimbangkan menghapus label "Mock" yang terlihat oleh end-user** di Onboarding (misalnya pindahkan ke changelog/dev notes internal) supaya kesan produk tetap konsisten profesional saat didemokan ke pihak eksternal — tapi pertahankan mode Mock Runtime itu sendiri untuk keperluan development/testing (ini fitur bagus, cuma copy-nya perlu dipisah audience).

---

## Kesimpulan

SATRIA AI Workforce adalah proyek dengan **ambisi arsitektur yang jelas dan sebagian besar terealisasi dengan baik** — khususnya di lapisan runtime (verification, sandbox, Hermes integration, telemetry/cost) yang benar-benar nyata, bukan simulasi kosong. Design system dan aksesibilitas juga dikerjakan dengan standar yang jarang ditemukan di proyek tahap ini.

Tapi ada satu pola berulang yang perlu jadi fokus utama sebelum menambah fitur baru: **komponen inti (arsitektur) seringkali sudah dibangun dan lulus test, tapi belum benar-benar "di-colok" ke jalur yang dipakai user sehari-hari** — paling jelas terlihat di `AutonomousTaskLoop` yang menjadi jantung klaim "autonomous" produk ini tapi tidak pernah dieksekusi di luar file test. Menutup gap wiring ini (P0 #1) kemungkinan besar adalah pekerjaan dengan rasio effort:impact terbaik di seluruh roadmap saat ini, karena fondasinya sudah ada — tinggal disambungkan.
