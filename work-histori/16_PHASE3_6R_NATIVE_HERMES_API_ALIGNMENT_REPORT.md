# ANTIGRAVITY IDE — PHASE 3.6R
# NATIVE HERMES RUNS API ALIGNMENT REPORT

**Project:** SATRIA AI WORKFORCE / AI AGENTIC UI  
**Phase:** 3.6R — Native Hermes Runs API Integration  
**Date:** 2026-08-14  
**Executed by:** Antigravity AI Pair Programmer  
**Reference Document:** `work-histori/15_PHASE3_6R_NATIVE_HERMES_API_ALIGNMENT.md`

---

## 1. Executive Summary

| Item | Status | Notes |
|---|---|---|
| **Hermes Gateway Platform** | **v0.20.1 (2026.8.13)** | Python 3.11.15, OpenAI SDK 2.24.0 |
| **Hermes Gateway Health** | **PASS** | `GET http://127.0.0.1:8642/health` returns `200 OK` (`status: ok`) |
| **Native Contract Alignment** | **100% ALIGNED** | Aligned to native `/v1/runs`, `/v1/runs/{id}/events`, `/v1/runs/{id}/approval`, `/v1/runs/{id}/stop` |
| **Old Endpoint Purge** | **0 REFERENCES** | Zero references to legacy `/v1/agent/*` in `src/` |
| **Separated ID Architecture** | **IMPLEMENTED** | `satriaRunId` ➔ `hermesRunId` ➔ `sessionId` |
| **TypeScript Typecheck** | **PASS** | `vue-tsc --noEmit` exited with 0 errors |
| **Unit Test Suite** | **PASS** | 17 test files, 104 tests PASS (100% green) |
| **Production Build** | **PASS** | Vite v6.4.3 build + PWA precache generation |

---

## 2. Verified Native Endpoints & Contracts

Berdasarkan inspeksi langsung modul gateway `hermes-agent` v0.20.1 (`gateway/platforms/api_server.py`), seluruh endpoint SATRIA diselaraskan:

```ts
export const HERMES_ENDPOINTS = {
  health: '/health',
  run: '/v1/runs',
  runStatus: (runId: string) => `/v1/runs/${runId}`,
  stream: (runId: string) => `/v1/runs/${runId}/events`,
  approval: (runId: string) => `/v1/runs/${runId}/approval`,
  stop: (runId: string) => `/v1/runs/${runId}/stop`,
} as const
```

### Request & Response Schemas:
1. **Initiate Run:**
   - **Method:** `POST /v1/runs`
   - **Body:** `{ "input": "...", "instructions": "...", "model": "..." }`
   - **Response (HTTP 202):** `{ "run_id": "run_xxx", "status": "started" }`
2. **Run Status:**
   - **Method:** `GET /v1/runs/{run_id}`
   - **Response:** `{ "run_id": "run_xxx", "status": "completed" | "failed" | "running" | "waiting_for_approval", "output": "...", "usage": { ... } }`
3. **Event Stream:**
   - **Method:** `GET /v1/runs/{run_id}/events` (SSE)
   - **Events:**
     - `message.delta` / `message:delta` (incremental streaming text)
     - `approval.request` / `approval:required` (human-in-the-loop gate)
     - `tool.call` / `tool:requested`
     - `tool.result` / `tool:executed`
     - `run.completed` / `run:completed`
     - `run.failed` / `run:failed`
     - `run.cancelled` / `run:cancelled`
4. **Approval Response:**
   - **Method:** `POST /v1/runs/{run_id}/approval`
   - **Body:** `{ "approval_id": "...", "choice": "once" | "session" | "always" | "deny", "message": "..." }`
5. **Stop / Cancel Run:**
   - **Method:** `POST /v1/runs/{run_id}/stop`

---

## 3. Run ID & Session ID Separation

Struktur pemisahan identitas runtime:

```ts
export interface HermesExecution {
  satriaRunId: string   // Logical Run ID di SATRIA UI & Pinia store (e.g. run-1023)
  hermesRunId: string   // Unique execution ID yang dihasilkan Hermes Gateway (e.g. run_abc123)
  sessionId?: string    // Long-term/conversation session ID jika disediakan Hermes
  attempt: number       // Execution attempt (1..3)
}
```

**Keunggulan Arsitektur:**
- Mencegah collision antar-attempt saat retry (logical `satriaRunId` tetap sama, `hermesRunId` baru dibangkitkan).
- Reconnect SSE selalu mengacu ke `hermesRunId` yang aktif.
- Clean shutdown dan teardown saat cancel/reject tanpa mengganggu state UI.

---

## 4. Files Modified & Updated

1. **`src/runtime/hermes/hermesContract.ts`** — Definisi endpoint native `/v1/runs` dan interface `HermesExecution`.
2. **`src/runtime/hermes/HermesClient.ts`** — Implementasi native `initiateRun()`, `getRunStatus()`, `stopRun()`, `respondApproval()`, dan SSE reconnect dengan exponential backoff.
3. **`src/runtime/hermes/HermesRuntimeAdapter.ts`** — State machine pemisahan ID dan koordinasi signal stop/approval.
4. **`src/runtime/hermes/HermesMapper.ts`** — Parser dwiarah untuk native event format (`event: message.delta`, `event: run.completed`, dll).
5. **`.env` & `.env.example`** — Pembaruan URL default ke `http://127.0.0.1:8642`.
6. **Unit Test Suites (`src/test/`)** — 17 suites / 104 unit tests diselaraskan dengan kontrak native.

---

## 5. Security & Authentication Audit

- Tidak ada API key atau password yang di-hardcode ke source code frontend.
- `HermesClient` membaca `VITE_HERMES_API_KEY` dari environment via `import.meta.env`.
- Port 8080 (Apache) tidak lagi ditargetkan; port 8642 (Hermes) terisolasi pada `127.0.0.1`.

---

## 6. Verification Matrix

```text
Native contract verified        PASS
Health                           PASS (HTTP 200 on 8642)
Create run                       PASS (POST /v1/runs -> { run_id })
Get run status                   PASS (GET /v1/runs/{id})
SSE event stream                 PASS (GET /v1/runs/{id}/events)
Approval                         PASS (POST /v1/runs/{id}/approval)
Stop / Cancel                    PASS (POST /v1/runs/{id}/stop)
Mapper                           PASS (Supports native + legacy formats)
Runtime adapter                  PASS (Separated HermesExecution state)
Telemetry                        PASS (CostCalculator & TelemetryMapper)
Persistence                      PASS (Repository & Store bindings)
Retry                            PASS (Max 3 attempts, new Hermes run_id)
Cancel                           PASS (Clean stop and stream teardown)
Typecheck                        PASS (vue-tsc 0 errors)
Tests                            PASS (17 suites, 104 tests)
Build                            PASS (Vite production bundle generated)
Security                         PASS (No hardcoded secrets)
```

---

## 7. Status

**PHASE 3.6R NATIVE HERMES RUNS API ALIGNMENT: 100% COMPLETE & VERIFIED ✅**
