# SATRIA AI WORKFORCE
## PHASE 3.5 — APPROVAL GATE & UI WIRING
### Execution Command Sheet

**Basis:** Phase 3 Master Execution Plan v1.1  
**Current State:** 3.1–3.4 implemented ✅  
**Next Step:** 3.5 Approval Gate & Human-in-the-Loop UI  
**Do Not Start Yet:** 3.6 Telemetry UI, 3.7 Result/Verification UI, Discord, Scheduler, Multi-Agent

---

# 0. OBJECTIVE

Menyelesaikan:

```text
Agent Runtime
   ↓
approval:required
   ↓
RunApprovalDrawer.vue
   ↓
User sees:
- requested action
- tool
- risk
- reason
- preview/diff
   ↓
Approve / Reject
   ↓
Hermes Runtime
   ├── Approve → resume
   └── Reject → abort/stop
```

Phase 3 Master Execution Plan saat ini menetapkan `RunApprovalDrawer.vue` pada `/runs/:id` sebagai pekerjaan berikutnya, dengan visual diff inspection dan approval flow. 

---

# 1. PRE-FLIGHT

## 1.1 Check repository

```bash
git status
git branch --show-current
git log -1 --oneline
```

Expected:

```text
Working tree clean / known changes documented
Current branch = Phase 3 branch
Latest commit = Phase 3 runtime implementation
```

## 1.2 Check current tests

```bash
npm run typecheck
npm run test:unit
npm run build
```

Expected:

```text
vue-tsc = 0 errors
Vitest = PASS
Production build = PASS
```

**STOP** jika salah satu gagal.

---

# 2. AUDIT EXISTING PHASE 3 CONTRACT

Cari:

```text
AgentRuntime
ApprovalRequest
RuntimeEventType
respondApproval()
HermesRuntimeAdapter
RunDetailPage.vue
AgentRunStore
```

Command:

```bash
git grep -n "ApprovalRequest"
git grep -n "approval:required"
git grep -n "respondApproval"
git grep -n "HermesRuntimeAdapter"
git grep -n "AgentRunStore"
git grep -n "RunDetailPage"
```

Expected sudah tersedia:

```text
ApprovalRequest
approval:required
approval:resolved
respondApproval()
```

Runtime contract yang ada harus dipakai. Jangan membuat kontrak approval kedua.

---

# 3. STEP 3.5.A — INSPECT APPROVAL EVENT

Pastikan runtime mengeluarkan event:

```text
approval:required
```

dengan:

```text
runId
approvalRequest.id
toolCall
reason
previewContent?
diffContent?
requestedAt
```

Contract Phase 3 menyediakan field tersebut.

---

# 4. STEP 3.5.B — CREATE APPROVAL UI

File target:

```text
src/components/workforce/RunApprovalDrawer.vue
```

Jika folder/file belum ada, buat.

Komponen harus menerima:

```text
runId
approvalRequest
open
```

dan menghasilkan action:

```text
approve
reject
```

---

# 5. APPROVAL DRAWER CONTENT

Drawer minimal:

```text
Approval Required

Requested Action
[filesystem.write]

Risk
HIGH

Reason
Agent wants to modify project file.

File
src/services/AuthService.ts

Preview / Diff
--------------------------------
- old code
+ new code
--------------------------------

[Reject]
[Approve]
```

Tidak perlu menampilkan chain-of-thought.

---

# 6. STEP 3.5.C — HIGH-RISK STATE

Pastikan UI hanya muncul ketika:

```text
approval:required
```

Untuk low-risk action:

```text
read
lint
test
```

drawer tidak muncul.

Untuk high-risk:

```text
write
git push
deploy
destructive mutation
```

drawer harus muncul sesuai sandbox policy.

---

# 7. STEP 3.5.D — WIRE TO RUN DETAIL

Target:

```text
src/pages/runs/RunDetailPage.vue
```

Flow:

```text
Runtime Event
    ↓
AgentRun Store
    ↓
approval request state
    ↓
RunDetailPage
    ↓
RunApprovalDrawer
```

Jangan memanggil Hermes langsung dari Vue page.

Page hanya berkomunikasi dengan store/service.

---

# 8. STEP 3.5.E — APPROVE ACTION

Ketika user klik:

```text
Approve
```

jalankan:

```text
agentRunStore.respondApproval(
  runId,
  approvalId,
  true
)
```

atau service yang sesuai dengan arsitektur existing.

Expected:

```text
Approval Drawer
 ↓
respondApproval(true)
 ↓
Hermes runtime
 ↓
tool continues
 ↓
approval:resolved
```

UI:

```text
Approval:
Approved
```

lalu drawer tertutup.

---

# 9. STEP 3.5.F — REJECT ACTION

Ketika user klik:

```text
Reject
```

jangan langsung silent cancel.

Minta alasan optional/required sesuai policy:

```text
Reject Action

Reason
[________________________]

[Cancel] [Reject Action]
```

Kemudian:

```text
respondApproval(
  runId,
  approvalId,
  false,
  feedback
)
```

Expected:

```text
approval:resolved
approved = false
runtime stops/aborts requested action
```

---

# 10. STEP 3.5.G — STATE TRANSITIONS

Valid flow:

```text
Running
   ↓
Approval Required
   ↓
Waiting
```

Approve:

```text
Waiting
   ↓
Running
   ↓
Tool Executed
```

Reject:

```text
Waiting
   ↓
Failed / Cancelled / policy-defined state
```

Gunakan state transition yang sudah ada.

Jangan menambahkan state baru hanya untuk UI kecuali memang diperlukan oleh runtime contract.

---

# 11. STEP 3.5.H — VISUAL DIFF

Untuk file modification, tampilkan:

```text
File Path

Original
---------
...

Modified
---------
...

Diff
---------
- ...
+ ...
```

Jika `diffContent` tersedia, gunakan langsung.

Jika tidak tersedia:

```text
No visual diff available.
```

Jangan membuat diff palsu.

---

# 12. STEP 3.5.I — APPROVAL TIMEOUT

UI harus dapat menangani:

```text
Approval Pending
```

Jika runtime mengembalikan:

```text
APPROVAL_TIMEOUT
```

tampilkan:

```text
Approval expired

The requested action was not executed.
```

Run masuk status sesuai runtime policy.

---

# 13. STEP 3.5.J — DUPLICATE APPROVAL PROTECTION

Satu approval request:

```text
approvalId
```

hanya boleh diselesaikan sekali.

Jika user double-click:

```text
Approve
Approve
```

hasil kedua harus diabaikan.

UI:

```text
Submitting...
```

dan tombol disabled sementara.

---

# 14. STEP 3.5.K — AUDIT EVENT

Setiap approval harus membuat event:

```text
approval:required
approval:resolved
```

Pastikan Activity/Audit mencatat:

```text
actor
runId
approvalId
decision
timestamp
feedback
```

Contoh:

```text
17:42
Satria approved filesystem.write
Run #run-1023-01
```

---

# 15. STEP 3.5.L — NOTIFICATION

Jika approval dibutuhkan:

```text
Approval required
Bima needs approval to modify:
src/services/AuthService.ts
```

Jika approved:

```text
Approval granted
Run #run-1023-01 resumed
```

Jika rejected:

```text
Approval rejected
Run #run-1023-01 stopped
```

Gunakan notification infrastructure existing.

---

# 16. STEP 3.5.M — ERROR HANDLING

Handle:

```text
AUTHENTICATION_ERROR
SANDBOX_VIOLATION
TOOL_EXECUTION_ERROR
APPROVAL_TIMEOUT
CONTEXT_LIMIT_EXCEEDED
NETWORK_FAILURE
RATE_LIMITED
EXECUTION_TIMEOUT
INTERNAL_ERROR
```

Approval UI tidak boleh menelan error.

Tampilkan error yang aman untuk user.

Jangan tampilkan secret/token/raw provider credential.

---

# 17. STEP 3.5.N — TESTS

Buat/ubah:

```text
src/test/runtimeApproval.spec.ts
```

Minimal tests:

### Test 1 — Approval required

```text
High-risk tool
→ approval:required
→ drawer visible
```

### Test 2 — Approve

```text
Approval
→ Approve
→ respondApproval(true)
→ approval resolved
→ runtime continues
```

### Test 3 — Reject

```text
Approval
→ Reject
→ respondApproval(false)
→ runtime does not execute tool
```

### Test 4 — Double click

```text
Approve twice
→ only one resolution
```

### Test 5 — Timeout

```text
Approval expires
→ safe failure state
```

### Test 6 — Audit

```text
Approval decision
→ activity/audit record created
```

---

# 18. RUN COMMANDS

After implementation:

```bash
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```

Expected:

```text
TypeScript = 0 errors
Unit/Integration = PASS
E2E = PASS
Production build = PASS
```

---

# 19. MANUAL QA

Open:

```text
/runs
```

Select a real/mock run capable of generating a high-risk request.

Open:

```text
/runs/:id
```

Trigger approval.

Verify:

```text
[ ] Approval drawer appears
[ ] Tool name correct
[ ] Risk correct
[ ] Reason correct
[ ] Diff visible if available
[ ] Approve works
[ ] Reject works
[ ] Drawer closes after resolution
[ ] Run state updates
[ ] Activity updates
[ ] Notification updates
[ ] No console error
```

---

# 20. SECURITY QA

Test:

```text
../
.env
id_rsa
credentials
```

Expected:

```text
DENIED
```

Test high-risk action:

```text
filesystem.write
```

Expected:

```text
Approval Required
```

Test low-risk:

```text
filesystem.read
test.run
```

Expected:

```text
No approval drawer
```

---

# 21. ACCEPTANCE CRITERIA

Phase 3.5 PASS jika:

- [ ] `approval:required` reaches UI.
- [ ] `RunApprovalDrawer.vue` opens correctly.
- [ ] Tool/risk/reason are shown.
- [ ] Diff/preview is shown when supplied.
- [ ] Approve resumes runtime.
- [ ] Reject prevents/aborts action.
- [ ] Approval cannot be resolved twice.
- [ ] Timeout is handled safely.
- [ ] Activity/audit records decision.
- [ ] Notification is emitted.
- [ ] Tests pass.
- [ ] Build passes.
- [ ] No critical console errors.

---

# 22. DO NOT MOVE TO 3.6 UNTIL

Semua berikut PASS:

```text
Approval Required ✅
Approve ✅
Reject ✅
Timeout ✅
Audit ✅
Notification ✅
Tests ✅
Build ✅
```

Setelah itu baru:

```text
PHASE 3.6
Live Telemetry & Cost Tracking UI
```

---

# 23. NEXT STEP AFTER 3.5

Sub-Phase 3.6 fokus:

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

Jangan dikerjakan bersamaan dengan 3.5.

---

# 24. RESULT REPORT TEMPLATE

Setelah selesai jalankan, kirim laporan dengan format:

```text
PHASE 3.5 — APPROVAL GATE

Status:
PASS / BLOCKED

Files Changed:
-

Commands:
-

Typecheck:
PASS / FAIL

Unit Tests:
PASS / FAIL

E2E:
PASS / FAIL

Build:
PASS / FAIL

Manual QA:
-

Approval Required:
PASS / FAIL

Approve:
PASS / FAIL

Reject:
PASS / FAIL

Timeout:
PASS / FAIL

Audit:
PASS / FAIL

Notification:
PASS / FAIL

Console Errors:
0 / ...

Problems:
-

Next:
3.6 / BLOCKED
```

---

# 25. STOP RULE

Jika ada:

```text
permission bypass
tool executes without approval
duplicate active run
approval resolves twice
secret appears in log/UI
reject still executes tool
cancelled run continues execution
```

**STOP. Jangan lanjut ke 3.6.**

Perbaiki dulu sampai PASS.

---

# 26. FINAL COMMAND

Mulai sekarang jalankan:

```bash
git status
git grep -n "approval:required"
git grep -n "ApprovalRequest"
git grep -n "respondApproval"
git grep -n "HermesRuntimeAdapter"

npm run typecheck
npm run test:unit
```

Setelah hasil baseline PASS, implementasikan:

```text
src/components/workforce/RunApprovalDrawer.vue
```

lalu wire ke:

```text
src/pages/runs/RunDetailPage.vue
```

melalui existing store/runtime contract.

**Jangan mengubah Hermes runtime contract kecuali ditemukan defect nyata saat wiring.**
