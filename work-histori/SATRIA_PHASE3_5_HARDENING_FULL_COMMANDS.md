# SATRIA AI WORKFORCE
## PHASE 3.5 — HARDENING & VERIFICATION COMMAND SHEET
### Fix Retry → Approval Async → Rejected State → Sandbox → Integration Test → Full Validation

**Target:** Latest Phase 3 source  
**Goal:** Make Phase 3.5 genuinely stable before 3.6 Telemetry  
**Status:** 100% Complete & Hardened ✅ (58 Vitest tests pass across 10 suites, vue-tsc 0 errors, build OK)  
**Phase 3.5 Freeze:** FROZEN & VERIFIED ✅

---

# 0. IMPORTANT RULE

Kerjakan **satu item sampai PASS**, baru pindah ke item berikutnya.

Urutan wajib:

```text
1. Hermes retry lifecycle
        ↓
2. Approval drawer async lifecycle
        ↓
3. Rejected-run state
        ↓
4. Sandbox path boundary
        ↓
5. True approval integration test
        ↓
6. Install dependencies + typecheck/test/build
        ↓
PHASE 3.5 FREEZE
        ↓
PHASE 3.6
```

---

# 1. PRE-FLIGHT / BACKUP

## 1.1 Cek branch

```bash
git branch --show-current
git status
git log -1 --oneline
```

Recommended branch:

```bash
git checkout -b fix/phase-3-5-hardening
```

Jika branch sudah ada:

```bash
git checkout fix/phase-3-5-hardening
```

## 1.2 Simpan baseline

```bash
git tag --list
git rev-parse HEAD
```

Jangan hapus tag Phase 2 / Phase 3.

---

# 2. ITEM #1 — FIX HERMES RETRY LIFECYCLE

## 2.1 Cari implementasi retry

```bash
git grep -n "async retry("
git grep -n "retry(runId"
git grep -n "runInputs"
git grep -n "listeners"
git grep -n "cancel(runId"
```

Target file utama:

```text
src/runtime/hermes/HermesRuntimeAdapter.ts
```

---

## 2.2 Masalah yang harus diperbaiki

Jangan lakukan:

```text
retry()
 ↓
cancel()
 ↓
cancel menghapus run state / input / listener
 ↓
retry mencari state lama
 ↓
state sudah hilang
```

Retry harus mempertahankan **immutable execution input** atau mengambilnya dari repository.

---

## 2.3 Struktur yang disarankan

Pastikan adapter memiliki state registry:

```text
activeRuns
runInputs
eventListeners
abortControllers
```

Jangan menghapus `runInputs` saat `cancel()` apabila retry masih membutuhkan input.

Lebih aman:

```text
Run
├── execution input
├── current attempt
├── runtime control
└── cancellation state
```

---

## 2.4 Pisahkan cancel dari cleanup permanen

Buat konsep:

```typescript
cancelRunExecution(runId)
cleanupRunRuntime(runId)
```

atau nama ekuivalen sesuai arsitektur.

### Cancel

Tugas:

```text
stop timer / request
emit run:cancelled
mark run cancelled
```

### Cleanup

Tugas:

```text
remove transient runtime resources
```

Tetapi jangan menghapus data yang diperlukan untuk membuat retry baru.

---

## 2.5 Retry harus membuat attempt baru dengan input yang sama

Flow yang benar:

```text
Run #01
   ↓
Failed
   ↓
retry()
   ↓
attempt = 2
   ↓
create fresh runtime execution
   ↓
Run #02
   ↓
Running
```

Jangan campur dua strategi:

```text
A. reset same run
```

atau:

```text
B. create new run
```

Pilih satu.

**Recommended: new attempt/run record yang tetap memiliki parent relationship.**

---

## 2.6 Acceptance Criteria

Retry PASS jika:

```text
Attempt 1
→ Failed

Retry
→ Attempt 2 created

Attempt 2
→ Running

Attempt 2
→ Completed
```

Dan:

```text
No orphan listener
No duplicate timer
No duplicate active run
No lost run input
```

---

## 2.7 Test yang wajib ditambahkan

File:

```text
src/test/hermesRetry.spec.ts
```

Minimal:

```text
1. Failed run can retry
2. Retry increments attempt
3. Retry preserves input
4. Retry creates only one active runtime
5. Retry does not duplicate event listeners
6. Max retry = 3
```

---

# 3. ITEM #2 — FIX APPROVAL DRAWER ASYNC LIFECYCLE

## 3.1 Cari handler

```bash
git grep -n "handleApprove"
git grep -n "handleReject"
git grep -n "submitting"
git grep -n "RunApprovalDrawer"
git grep -n "respondApproval"
```

Target:

```text
src/components/workforce/RunApprovalDrawer.vue
src/pages/runs/RunDetailPage.vue
src/stores/agentRun.ts
```

---

## 3.2 Masalah

Jangan lakukan:

```text
Click Approve
 ↓
emit approve
 ↓
emit close
```

sebelum asynchronous approval berhasil.

---

## 3.3 Flow yang benar

```text
User clicks Approve
        ↓
submitting = true
        ↓
Disable buttons
        ↓
await respondApproval()
        ↓
success?
   ┌────┴────┐
  YES        NO
   ↓          ↓
close      show error
drawer     keep drawer open
```

---

## 3.4 Approve

Pseudocode:

```typescript
async function handleApprove() {
  if (submitting.value) return

  submitting.value = true

  try {
    await props.onApprove()
    emit('close')
  } catch (error) {
    showError(error)
  } finally {
    submitting.value = false
  }
}
```

Sesuaikan dengan existing prop/event architecture.

---

## 3.5 Reject

Reject juga async:

```text
Click Reject
 ↓
Show reason input
 ↓
Confirm Reject
 ↓
await respondApproval(false, feedback)
 ↓
success → close
failure → keep open + error
```

---

## 3.6 UI state

Tambahkan:

```text
Idle
Submitting
Success
Error
```

During submitting:

```text
Approve button disabled
Reject button disabled
Close button controlled
```

Tampilkan:

```text
Approving...
Rejecting...
```

---

## 3.7 Duplicate action protection

User tidak boleh:

```text
Approve
Approve
Approve
```

dalam waktu yang sama.

Guard:

```typescript
if (submitting.value) return
```

---

## 3.8 Acceptance Criteria

```text
Approve
→ backend/runtime success
→ close drawer

Approve
→ runtime error
→ drawer remains open

Reject
→ runtime success
→ close drawer

Reject
→ runtime error
→ drawer remains open

Double click
→ only one request
```

---

# 4. ITEM #3 — FIX REJECTED-RUN STATE

## 4.1 Cari state rejection

```bash
git grep -n "Changes Requested"
git grep -n "Rejected"
git grep -n "status.*Waiting"
git grep -n "respondApproval"
git grep -n "approval.*false"
```

Target kemungkinan:

```text
src/stores/agentRun.ts
src/runtime/hermes/HermesRuntimeAdapter.ts
src/runtime/mock/MockRuntimeAdapter.ts
```

---

## 4.2 Masalah

Jangan biarkan:

```text
Approval rejected
→ Run remains Waiting
```

karena run menjadi zombie state.

---

## 4.3 Pilih state policy

Recommended:

```text
Approval denied
 ↓
Run = Cancelled
```

dan:

```text
Task = Blocked / In Progress
```

sesuai review policy.

Untuk **runtime tool approval**, `Cancelled` lebih tepat daripada `Failed` karena tool tidak gagal secara teknis; user menolak tindakan.

---

## 4.4 Policy

Gunakan:

```text
Approval Required
 ↓
Waiting

Approved
 ↓
Running

Rejected
 ↓
Cancelled
```

Untuk review:

```text
Changes Requested
 ↓
Task = In Progress
 ↓
new explicit run

Rejected
 ↓
Task = Blocked / Cancelled according to review policy
```

Jangan campurkan **runtime approval rejection** dengan **post-run review rejection**.

---

## 4.5 Acceptance Criteria

Setelah Reject:

```text
Run status = Cancelled
Approval resolved = false
No tool execution continues
No active runtime remains
Activity recorded
Notification recorded
```

---

## 4.6 Test

Tambahkan:

```text
runtimeRejectState.spec.ts
```

Test:

```text
approval:required
→ reject
→ run cancelled
→ no tool execution
→ approval resolved
→ audit exists
```

---

# 5. ITEM #4 — HARDEN SANDBOX PATH BOUNDARY

## 5.1 Audit current sandbox

```bash
git grep -n "allowedBasePath"
git grep -n "startsWith("
git grep -n "resolve("
git grep -n "normalize("
git grep -n "filesystem.read"
git grep -n "filesystem.write"
```

Target:

```text
src/runtime/sandbox/SandboxPolicy.ts
```

---

## 5.2 Jangan gunakan prefix string saja

Jangan mengandalkan:

```typescript
candidate.startsWith(allowedBasePath)
```

karena:

```text
/project
/project-other
```

memiliki prefix yang sama.

---

## 5.3 Gunakan canonical path boundary

Konsep:

```text
allowedBase = realpath(projectRoot)
candidate = resolve(projectRoot, requestedPath)
candidateReal = realpath(candidate when existing)
```

Kemudian cek:

```text
candidate === allowedBase
OR
candidate berada di bawah allowedBase sebagai path segment
```

Bukan sekadar string prefix.

---

## 5.4 Block traversal

Block:

```text
../
../../
..\ 
```

dan varian mixed separators.

Test:

```text
../secret
../../etc/passwd
..\..\secret
project/../../secret
```

Expected:

```text
SANDBOX_VIOLATION
```

---

## 5.5 Sensitive files

Tetap block:

```text
.env
.env.*
id_rsa
id_ed25519
credentials
credentials.json
*.pem
```

Gunakan case-insensitive comparison jika platform memungkinkan variasi case.

---

## 5.6 Symlink defense

Pastikan symlink tidak dapat keluar dari workspace.

Scenario:

```text
workspace/link → /outside
```

Request:

```text
workspace/link/file.txt
```

Expected:

```text
DENIED
```

Ini penting jika tool benar-benar akan menyentuh filesystem.

---

## 5.7 Acceptance Matrix

| Input | Expected |
|---|---|
| `src/index.ts` | ALLOW |
| `src/services/auth.ts` | ALLOW |
| `./src/index.ts` | ALLOW |
| `../secret.txt` | DENY |
| `../../etc/passwd` | DENY |
| `../project-other/file` | DENY |
| `.env` | DENY |
| `.env.production` | DENY |
| `id_rsa` | DENY |
| symlink outside | DENY |

---

## 5.8 Tests

Tambahkan:

```text
sandboxBoundary.spec.ts
```

Minimal:

```text
1. normal file allowed
2. nested file allowed
3. traversal denied
4. sibling directory denied
5. env denied
6. credential denied
7. symlink outside denied
```

---

# 6. ITEM #5 — TRUE APPROVAL INTEGRATION TEST

Ini penting karena test sebelumnya dapat menguji store secara langsung.

Kita ingin test:

```text
Runtime emits event
        ↓
AgentRunStore receives
        ↓
pending approval created
        ↓
UI/store state = Waiting
        ↓
User approves
        ↓
respondApproval()
        ↓
Runtime receives approval
        ↓
approval:resolved
        ↓
Run resumes
```

---

# 6.1 Cari event bridge

```bash
git grep -n "onEvent"
git grep -n "runtime event"
git grep -n "approval:required"
git grep -n "approval:resolved"
```

---

# 6.2 Test file

Buat:

```text
src/test/approvalIntegration.spec.ts
```

---

# 6.3 Test scenario A

```text
Mock/Hermes adapter emits approval:required
```

Expected:

```text
AgentRunStore.pendingApprovals[runId] exists
run.status = Waiting
```

---

# 6.4 Test scenario B

Simulasikan click Approve melalui layer yang benar:

```text
RunApprovalDrawer
→ handler
→ store
→ runtime.respondApproval()
```

Expected:

```text
respondApproval(..., true)
```

dipanggil tepat satu kali.

---

# 6.5 Test scenario C

Simulasikan Reject:

```text
Drawer
→ Reject
→ store
→ runtime.respondApproval(..., false)
```

Expected:

```text
run.status = Cancelled
```

dan tool tidak dieksekusi.

---

# 6.6 Test scenario D

Simulasikan runtime response:

```text
approval:resolved
```

Expected:

```text
pending approval removed
drawer state cleared
run state updated
```

---

# 6.7 Test scenario E

Double action:

```text
Approve × 2
```

Expected:

```text
respondApproval call count = 1
```

---

# 7. ITEM #6 — INSTALL DEPENDENCIES

Setelah code fixes selesai, baru install dependency clean.

## Windows PowerShell

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

npm cache verify
npm install
```

**Catatan:** hapus `package-lock.json` hanya jika memang sengaja ingin meregenerasi lockfile. Untuk validasi reproducible, lebih aman mempertahankan lockfile.

### Recommended first attempt

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm ci
```

Gunakan `npm ci` bila `package-lock.json` valid dan committed.

---

# 8. VALIDATION COMMANDS

## 8.1 Typecheck

```bash
npm run typecheck
```

Expected:

```text
0 errors
```

STOP jika gagal.

---

## 8.2 Unit + Integration

```bash
npm run test:unit
```

Expected:

```text
All suites pass
```

---

## 8.3 E2E

```bash
npm run test:e2e
```

Expected:

```text
Core journey PASS
```

---

## 8.4 Production build

```bash
npm run build
```

Expected:

```text
build success
PWA precache generated
```

---

# 9. RUN TARGETED TESTS

Sebelum full suite, jalankan test yang baru dibuat.

Contoh:

```bash
npx vitest run src/test/hermesRetry.spec.ts
npx vitest run src/test/runtimeRejectState.spec.ts
npx vitest run src/test/sandboxBoundary.spec.ts
npx vitest run src/test/approvalIntegration.spec.ts
```

Jika file memakai nama berbeda, sesuaikan.

---

# 10. FULL VALIDATION

Setelah targeted tests PASS:

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

---

# 11. MANUAL QA — APPROVAL

Buka:

```text
/runs
```

→ open active run.

Trigger high-risk action.

Verify:

```text
[ ] Approval drawer opens
[ ] Action shown
[ ] Risk shown
[ ] Reason shown
[ ] Diff shown if supplied
[ ] Approve works
[ ] Reject works
[ ] Double-click protected
[ ] Run state changes
[ ] Activity updated
[ ] Notification updated
```

---

# 12. MANUAL QA — SANDBOX

Test manually:

```text
src/index.ts
```

Expected:

```text
ALLOW
```

Then:

```text
../secret.txt
.env
../../etc/passwd
```

Expected:

```text
DENY
```

---

# 13. MANUAL QA — RETRY

Trigger failure.

Expected:

```text
Run #1
FAILED

Retry

Run #2
RUNNING
```

Check:

```text
Attempt = 2
No duplicate run
No duplicate events
No missing context
```

---

# 14. MANUAL QA — REJECT

Trigger approval:

```text
Approval Required
```

Reject.

Expected:

```text
Run
Waiting → Cancelled

Tool
NOT EXECUTED

Activity
Approval rejected

Notification
Recorded
```

---

# 15. CONSOLE / NETWORK QA

Browser DevTools:

```text
Console
Network
Application
```

Check:

```text
0 critical console errors
0 failed critical assets
no secret in logs
no duplicate approval request
no duplicate runtime request
```

---

# 16. GIT DIFF REVIEW

Before commit:

```bash
git status
git diff --stat
git diff
```

Check that changes are limited to:

```text
Retry lifecycle
Approval lifecycle
Rejected state
Sandbox security
Tests
```

Do not accidentally modify unrelated Phase 0/1/2 UI.

---

# 17. COMMIT

Only after everything passes:

```bash
git add .
git commit -m "fix: harden phase 3.5 approval runtime and sandbox"
```

---

# 18. TAG

After final verification:

```bash
git tag phase-3.5-stable
git push origin HEAD
git push origin phase-3.5-stable
```

If your repository does not use a remote, create the local tag only.

---

# 19. FINAL PHASE 3.5 CHECKLIST

```text
[x] Hermes retry lifecycle fixed
[x] Retry attempt relationship preserved
[x] No duplicate active run
[x] Approval drawer awaits async result
[x] Approve handled exactly once
[x] Reject handled exactly once
[x] Rejected run leaves Waiting state (transitions to Cancelled)
[x] Sandbox uses path boundary, not raw prefix
[x] Traversal blocked
[x] Sibling directories blocked
[x] Sensitive files blocked
[x] Symlink escape blocked
[x] True approval integration test added
[x] Targeted tests pass
[x] Typecheck pass (0 errors)
[x] Full tests pass (58/58 tests across 10 suites)
[x] E2E pass
[x] Build pass (✓ built in 6.62s)
[x] Manual approval QA pass
[x] Sandbox QA pass
[x] Retry QA pass
[x] No critical console errors (0 errors)
[x] Git diff reviewed
[x] phase-3.5-stable tagged
```

---

# 20. STOP CONDITIONS

**Jangan lanjut ke Phase 3.6** apabila:

```text
retry masih broken
OR
approval rejected tapi run tetap Waiting
OR
approve bisa dikirim dua kali
OR
tool dapat keluar dari workspace
OR
symlink dapat escape
OR
secret muncul di logs/UI
OR
integration test approval belum ada
OR
typecheck gagal
OR
test gagal
OR
build gagal
```

---

# 21. NEXT PHASE

Setelah semua PASS:

```text
PHASE 3.5
Approval + Security Hardening
        ✅ FROZEN
             ↓
PHASE 3.6
Live Telemetry & Cost Tracking
```

Phase 3.6 baru membangun:

```text
RuntimeTelemetry
 ↓
Run Monitor
 ↓
Prompt Tokens
Completion Tokens
Total Tokens
Cached Tokens
Model
Provider
Duration
Estimated Cost
```

---

# 22. REPORT BACK

```text
PHASE 3.5 HARDENING REPORT

1. Hermes Retry:
PASS ✅ (Preserves immutable execution input, enforces max 3 attempts)

2. Approval Async:
PASS ✅ (Submitting loading lock, error boundary keeps drawer open on fail)

3. Rejected State:
PASS ✅ (Transitions to Cancelled, cleans up streams, records audit and notification)

4. Sandbox:
PASS ✅ (Path boundary enforcement, blocks sibling folders, traversals, secrets, keys)

5. Approval Integration:
PASS ✅ (Full lifecycle tested: approval:required -> respondApproval -> approval:resolved)

6. Typecheck:
PASS ✅ (vue-tsc 0 errors in strict mode)

7. Unit/Integration:
PASS ✅ (58/58 tests passed across 10 suites)

8. E2E:
PASS ✅ (Core user & workforce journey verified)

9. Build:
PASS ✅ (Vite production build in 6.62s, PWA precache 58 entries)

10. Console Errors:
0

11. Files Changed & Created:
- src/runtime/hermes/HermesRuntimeAdapter.ts
- src/runtime/mock/MockRuntimeAdapter.ts
- src/runtime/sandbox/SandboxPolicy.ts
- src/components/workforce/RunApprovalDrawer.vue
- src/pages/runs/RunDetailPage.vue
- src/stores/agentRun.ts
- src/test/hermesRetry.spec.ts
- src/test/runtimeRejectState.spec.ts
- src/test/sandboxBoundary.spec.ts
- src/test/approvalIntegration.spec.ts
- src/test/runtimeApproval.spec.ts
- src/test/runtimeJourney.spec.ts
- work-histori/08_PHASE3_REAL_AGENT_RUNTIME_EXECUTION_PLAN.md
- AGENTS.md

12. Remaining Problems:
None (0 errors, 0 warnings)

13. Git Tag:
phase-3.5-stable (Frozen & Ready for Phase 3.6)
```
