# SATRIA AI WORKFORCE — Work History & Architecture Index

Daftar arsip dokumen spesifikasi, PRD, blueprint desain, rencana eksekusi teknis, dan laporan pengujian SATRIA AI Workforce dari Phase 0 hingga Phase 4.

---

## 📑 Master Architecture & Platform PRD

| Dokumen | Deskripsi |
|---|---|
| [00_PRD_MASTER_AGENTIC_AI_PLATFORM.md](./00_PRD_MASTER_AGENTIC_AI_PLATFORM.md) | Master Product Requirement Document (PRD) Platform Digital Workforce Satria AI |
| [00_SYSTEM_ANALYSIS_REPORT.md](./00_SYSTEM_ANALYSIS_REPORT.md) | Laporan analisis arsitektur awal sistem dan integrasi engine agentic |

---

## 🚀 Phase 0: Workspace Foundation & PWA Shell

| Dokumen | Deskripsi |
|---|---|
| [01_PHASE0_PRD_PWA_Workspace_UIUX_v2.md](./01_PHASE0_PRD_PWA_Workspace_UIUX_v2.md) | PRD PWA Workspace Foundation (Dark-first UI, Token Colors, Offline Banner, Toast) |
| [02_PHASE0_UIUX_BLUEPRINT.md](./02_PHASE0_UIUX_BLUEPRINT.md) | UI/UX Blueprint, token styling, komponen shell, dan tata letak aplikasi |
| [03_PHASE0_MASTER_EXECUTION_PLAN.md](./03_PHASE0_MASTER_EXECUTION_PLAN.md) | Rencana eksekusi dan checklist pengujian Phase 0 |

---

## 👥 Phase 1: Workforce Structure & Digital Employee Directory

| Dokumen | Deskripsi |
|---|---|
| [04_PHASE1_MASTER_WORKFORCE_BLUEPRINT.md](./04_PHASE1_MASTER_WORKFORCE_BLUEPRINT.md) | Blueprint struktur organisasi digital, 3 departemen, 12 role pekerja, 20+ skills, 12 tools |
| [05_PHASE1_EXECUTION_PLAN.md](./05_PHASE1_EXECUTION_PLAN.md) | Rencana eksekusi implementasi Employee Wizard, Registri Skill & Tool, dan CRUD Karyawan |

---

## 🎯 Phase 2: Task Assignment, Mock Runner & Review Flow

| Dokumen | Deskripsi |
|---|---|
| [06_PHASE2_PRD_TASK_ASSIGNMENT_AGENT_RUN.md](./06_PHASE2_PRD_TASK_ASSIGNMENT_AGENT_RUN.md) | PRD penugasan task, pencocokan skill (eligibility engine), dan alur review deliverables |
| [07_PHASE2_EXECUTION_PLAN.md](./07_PHASE2_EXECUTION_PLAN.md) | Rencana eksekusi MockAgentRunner, monitor /runs, /reviews, dan profile extension |

---

## ⚡ Phase 3: Real Agent Runtime (Hermes Adapter, Governance & Autonomy)

| Dokumen | Sub-Phase | Deskripsi |
|---|---|---|
| [08_PHASE3_REAL_AGENT_RUNTIME_EXECUTION_PLAN.md](./08_PHASE3_REAL_AGENT_RUNTIME_EXECUTION_PLAN.md) | 3.1 | Rencana arsitektur runtime interface contract (`AgentRuntimeAdapter`, `RuntimeFactory`) |
| [09_PHASE3_5_APPROVAL_GATE_EXECUTION_COMMANDS.md](./09_PHASE3_5_APPROVAL_GATE_EXECUTION_COMMANDS.md) | 3.5 | Human-in-the-loop Approval Gate, drawer interaktif, dan rejeksi lifecycle |
| [10_PHASE3_5_HARDENING_FULL_COMMANDS.md](./10_PHASE3_5_HARDENING_FULL_COMMANDS.md) | 3.5 | Penguatan Sandbox security, path traversal defense, dan permission matrix |
| [11_PHASE3_6_LIVE_TELEMETRY_COST_EXECUTION_COMMANDS.md](./11_PHASE3_6_LIVE_TELEMETRY_COST_EXECUTION_COMMANDS.md) | 3.6 | Observabilitas live telemetry, CostCalculator token pricing, dan cache savings |
| [12_PHASE3_6_HERMES_RUNTIME_HARDENING_PLAN.md](./12_PHASE3_6_HERMES_RUNTIME_HARDENING_PLAN.md) | 3.6 | Hardening koneksi Hermes Agent runtime & HTTP resilience |
| [13_PHASE3_6_REAL_HERMES_INTEGRATION_VALIDATION_PLAN.md](./13_PHASE3_6_REAL_HERMES_INTEGRATION_VALIDATION_PLAN.md) | 3.6 | Rencana validasi integrasi live Hermes Agent v0.20.1 |
| [14_PHASE3_6_REAL_HERMES_INTEGRATION_VALIDATION_REPORT.md](./14_PHASE3_6_REAL_HERMES_INTEGRATION_VALIDATION_REPORT.md) | 3.6 | Laporan hasil pengujian integrasi live Hermes gateway |
| [15_PHASE3_6R_NATIVE_HERMES_API_ALIGNMENT_PLAN.md](./15_PHASE3_6R_NATIVE_HERMES_API_ALIGNMENT_PLAN.md) | 3.6R | Rencana migrasi endpoint ke native Hermes Runs API protocol |
| [16_PHASE3_6R_NATIVE_HERMES_API_ALIGNMENT_REPORT.md](./16_PHASE3_6R_NATIVE_HERMES_API_ALIGNMENT_REPORT.md) | 3.6R | Laporan migrasi protocol gateway Hermes native |
| [17_PHASE3_7_RESULT_INGESTION_VERIFICATION_PLAN.md](./17_PHASE3_7_RESULT_INGESTION_VERIFICATION_PLAN.md) | 3.7 | Rencana implementasi Result Ingestor & Verification Engine |
| [18_PHASE3_7_EXECUTION_VERIFICATION_REVIEW_PIPELINE.md](./18_PHASE3_7_EXECUTION_VERIFICATION_REVIEW_PIPELINE.md) | 3.7 | Ringkasan eksekutif alur eksekusi ➔ ingest ➔ quality gate ➔ review |
| [19_PHASE3_7_RESULT_INGESTION_VERIFICATION_REPORT.md](./19_PHASE3_7_RESULT_INGESTION_VERIFICATION_REPORT.md) | 3.7 | Laporan uji verifikasi hasil eksekusi |
| [20_PHASE3_8_UX_PRESENTATION_VERIFICATION_REPORT.md](./20_PHASE3_8_UX_PRESENTATION_VERIFICATION_REPORT.md) | 3.8 | Laporan implementasi presentasi diff viewer dan visual evidence |
| [21_PHASE3_9_AUTONOMOUS_TASK_LOOP_PLAN.md](./21_PHASE3_9_AUTONOMOUS_TASK_LOOP_PLAN.md) | 3.9 | Blueprint FSM Autonomous Loop (Plan ➔ Execute ➔ Verify ➔ Retry) |
| [22_PHASE3_9_AUTONOMOUS_TASK_LOOP_REPORT.md](./22_PHASE3_9_AUTONOMOUS_TASK_LOOP_REPORT.md) | 3.9 | Laporan pengujian self-healing dan bounded retry governance |
| [23_PHASE3_11_AGENT_MEMORY_SUB_SYSTEM_REPORT.md](./23_PHASE3_11_AGENT_MEMORY_SUB_SYSTEM_REPORT.md) | 3.11 | Laporan Dynamic Agent Memory Subsystem & Semantic Recall Engine |

---

## 🛠️ Phase 4: Business Logic & UI Refinement

| Dokumen | Deskripsi |
|---|---|
| [24_PHASE4_BUSINESS_LOGIC_UI_REFINEMENT_SPEC.md](./24_PHASE4_BUSINESS_LOGIC_UI_REFINEMENT_SPEC.md) | Spesifikasi lengkap Domain Decoupling (Task vs Run), Sub-sistem Jadwal Otomatis (`/schedules`), Folder Path Wajib & Preflight Check, Active Work Command Center (`/work`), 4 Workers Spotlight Home, Owner Mid-Run Controls, Safe Delete, dan Navigasi Simple First |
| [25_PHASE4_1_AUDIT_CORRECTION_AND_SIMPLIFICATION_REPORT.md](./25_PHASE4_1_AUDIT_CORRECTION_AND_SIMPLIFICATION_REPORT.md) | Laporan audit menyeluruh dan koreksi logika bisnis Phase 4.1: Cancel vs Delete disentanglement, TaskStatus/ProjectStatus normalization, dynamic primary worker spotlight, trash/storage manager, dan 198 unit tests passing |
