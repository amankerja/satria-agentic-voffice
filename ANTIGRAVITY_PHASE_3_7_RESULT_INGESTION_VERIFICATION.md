# ANTIGRAVITY IDE — PHASE 3.7
# RESULT INGESTION & VERIFICATION — IMPLEMENTATION PLAN

## Project
SATRIA AI WORKFORCE / AI AGENTIC UI

## Phase
3.7 — Result Ingestion & Verification

## Goal

Mengubah alur:

```text
Hermes completed
    ↓
hardcoded "Passed"
    ↓
Review
```

menjadi:

```text
Real Hermes result
    ↓
Result Ingestion
    ↓
Artifacts / Diff / Output / Telemetry
    ↓
Verification Engine
    ↓
Acceptance Criteria + Tests + Typecheck + Build + Security
    ↓
Quality Gate
    ↓
RunResult persisted
    ↓
Human Review
    ↓
Approved / Changes Requested / Rejected
```

---

# 0. EXECUTION RULES

Antigravity wajib:

1. Inspect source terlebih dahulu.
2. Reuse komponen Phase 2, 3.6, dan 3.6R yang sudah ada.
3. Jangan membuat arsitektur baru jika komponen existing dapat diperluas.
4. Jangan mengganti Hermes Runtime yang sudah stable.
5. Jangan menambah Discord, Telegram, scheduler, multi-agent orchestration, graph memory, atau fitur di luar Phase 3.7.
6. Jangan hardcode `verificationStatus = 'Passed'`.
7. Jangan membuat `artifactIds` palsu untuk real Hermes run.
8. Jangan membuat checklist review selalu `completed: true`.
9. Jangan menganggap Hermes selesai = task selesai.
10. Jalankan test setelah setiap perubahan logis.
11. Jika informasi source tidak cukup, STOP dan audit file terkait sebelum coding.
12. Jangan menghapus test yang gagal hanya agar suite hijau.
13. Jangan mengekspos credential/secret pada report.

---

# 1. BASELINE YANG SUDAH DITEMUKAN

Source saat ini sudah memiliki:

```text
RunResult                         ✅
MockRunResultRepository           ✅
TaskReview                         ✅
MockReviewRepository              ✅
Review Store                       ✅
Acceptance Criteria                ✅
VerificationEngine                 ✅
AgentRuntimeResult                 ✅
run:completed handler              ✅
```

Namun ada implementasi yang masih simulatif:

```ts
verificationStatus: 'Passed'
```

```ts
artifactIds: ['art-result-' + targetRun.id]
```

```ts
verificationNotes:
  'Automated verification check passed with zero linting/logic warnings.'
```

dan checklist review yang selalu `true`.

Semua itu harus diganti menjadi hasil nyata.

---

# 2. STEP A — BASELINE TEST

Jalankan:

```powershell
npm run typecheck
npm run test:unit
npm run build
```

Gate:

```text
Typecheck PASS
Tests PASS
Build PASS
```

Jika baseline gagal:

```text
STOP
```

---

# 3. STEP B — INSPECT EXISTING RUNTIME RESULT FLOW

Jalankan:

```powershell
(Get-Content src\runtime\hermes\HermesRuntimeAdapter.ts)[1..220]
```

Lalu:

```powershell
Get-ChildItem src\runtime\hermes -Recurse -File -Include *.ts |
Select-String -Pattern "output|artifact|diff|AgentRuntimeResult|tool:executed|message.delta"
```

Dan:

```powershell
Get-Content src\runtime\types.ts
```

Tujuan:

```text
Hermes events
    ↓
output accumulator?
    ↓
artifact collector?
    ↓
diff collector?
    ↓
AgentRuntimeResult?
```

Jika sudah ada aggregator, reuse.

Jika belum ada, lanjutkan ke Step C.

---

# 4. STEP C — DEFINISIKAN RESULT INGESTION CONTRACT

Jangan membuat model kedua jika `AgentRuntimeResult` bisa digunakan.

Audit:

```ts
AgentRuntimeResult
```

Target minimal:

```ts
interface AgentRuntimeResult {
  runId: string
  status: 'Completed' | 'Failed' | 'Cancelled'
  summary: string
  output: string
  artifactIds: string[]
  diffs?: {
    filePath: string
    original: string
    modified: string
  }[]
  verificationNotes: string
  telemetry: RuntimeTelemetry
  error?: string
}
```

Jika type tersebut sudah cukup:

```text
REUSE IT
```

Jangan membuat model duplicate.

---

# 5. STEP D — BUAT `ResultIngestor` HANYA JIKA BELUM ADA

Jika source audit membuktikan result aggregation belum tersedia, buat:

```text
src/runtime/results/ResultIngestor.ts
```

Tanggung jawab:

```text
raw Hermes result/events
        ↓
normalized AgentRuntimeResult
```

Jangan melakukan verification di class ini.

`ResultIngestor` hanya menjawab:

> Apa yang dihasilkan agent?

---

# 6. STEP E — RESULT INGESTION

Result harus mengumpulkan:

```text
output
artifacts
diffs
telemetry
errors
```

Contoh:

```text
Hermes
 ↓
message.delta
 ↓
output accumulator
```

Artifact:

```text
tool/file event
 ↓
artifact collector
 ↓
artifact ID
```

Diff:

```text
file changed
 ↓
diff collector
 ↓
diff record
```

Telemetry:

```text
telemetry event
 ↓
existing TelemetryMapper
```

Jangan membuat telemetry kedua.

---

# 7. STEP F — ARTIFACT RULE

Real run:

```text
No artifact
```

harus menghasilkan:

```ts
artifactIds: []
```

Bukan:

```ts
artifactIds: ['art-result-' + runId]
```

Artifact ID hanya boleh dibuat jika artifact benar-benar ada.

Minimal metadata:

```text
artifactId
filePath
type
size
createdAt
```

Gunakan repository/file store yang sudah ada bila memungkinkan.

---

# 8. STEP G — DIFF RULE

Jika agent mengubah file, collect:

```ts
{
  filePath,
  original,
  modified
}
```

Jika tidak ada perubahan:

```text
diffs = []
```

Jangan membuat diff sintetis.

---

# 9. STEP H — UPDATE `RunResult`

File:

```text
src/types/index.ts
```

Tambahkan evidence secara backward-compatible.

Contoh:

```ts
export interface VerificationEvidence {
  type:
    | 'test'
    | 'typecheck'
    | 'build'
    | 'artifact'
    | 'diff'
    | 'security'
    | 'criteria'
  name: string
  passed: boolean
  details: string
  command?: string
}
```

Lalu:

```ts
verificationEvidence?: VerificationEvidence[]
```

Jangan membuat perubahan breaking untuk seed/mocks lama.

---

# 10. STEP I — UPGRADE `VerificationEngine`

File:

```text
src/runtime/verification/VerificationEngine.ts
```

Current API terlalu sederhana:

```ts
evaluate(
  testOutput?,
  testExitCode?,
  diffsCount?,
  criteriaPassed?
)
```

Ganti menjadi input terstruktur.

Target konsep:

```ts
export interface VerificationInput {
  testOutput?: string
  testExitCode?: number

  typecheckPassed?: boolean
  buildPassed?: boolean
  securityPassed?: boolean

  acceptanceCriteria: {
    name: string
    passed: boolean
    details: string
  }[]

  artifactChecks?: VerificationCheck[]
  diffCount?: number
}
```

Kemudian:

```ts
VerificationEngine.evaluate(input)
```

Jangan lagi menggunakan boolean generik:

```text
criteriaPassed = true
```

sebagai satu-satunya bukti.

---

# 11. STEP J — HARD GATES

Verification status:

```text
Passed
Warning
Failed
Pending
```

Contoh rule:

```text
Security FAIL
    → Failed

Mandatory acceptance criterion FAIL
    → Failed / Changes Requested

Tests FAIL
    → Failed

Typecheck FAIL
    → Failed

Build FAIL
    → Failed

Non-critical warning
    → Warning

Semua mandatory checks PASS
    → Passed
```

Score tidak boleh mengesampingkan hard gate.

---

# 12. STEP K — ACCEPTANCE CRITERIA

Task sudah memiliki:

```ts
acceptanceCriteria?: string[]
```

Gunakan criteria tersebut.

Contoh:

```text
Criterion 1 → PASS
Criterion 2 → PASS
Criterion 3 → FAIL
```

Hasil harus merefleksikan tiap criterion, bukan satu boolean global.

---

# 13. STEP L — EVIDENCE

Setiap verification check harus memiliki evidence.

Contoh:

```text
Typecheck
PASS
"vue-tsc --noEmit exited with code 0"
```

```text
Tests
PASS
"104 tests passed"
```

```text
Build
PASS
"Vite production build succeeded"
```

```text
Artifact
PASS
"src/api/auth.ts exists"
```

```text
Security
PASS
"No forbidden files changed"
```

Simpan ke:

```ts
verificationEvidence
```

---

# 14. STEP M — UPDATE `agentRun.ts`

File:

```text
src/stores/agentRun.ts
```

Current logic:

```text
run:completed
 ↓
hardcoded RunResult
 ↓
verificationStatus = Passed
 ↓
Review
```

Target:

```text
run:completed
 ↓
collect runtime result
 ↓
ResultIngestor
 ↓
VerificationEngine
 ↓
RunResult
 ↓
persist
 ↓
create Review
```

---

# 15. STEP N — REMOVE HARDCODED RESULT

Hapus logic seperti:

```ts
artifactIds: ['art-result-' + targetRun.id]
```

Hapus:

```ts
verificationStatus: 'Passed'
```

Hapus success text seperti:

```text
All acceptance assertions passed.
```

kecuali memang dihasilkan oleh verification engine dan didukung evidence.

---

# 16. STEP O — REVIEW CHECKLIST DINAMIS

Current checklist tidak boleh selalu `true`.

Target:

```text
Acceptance Criteria
→ verification.checks

Code Standards
→ typecheck/test/build

Security
→ security check
```

Jangan tampilkan visual compliance untuk backend task jika tidak relevan.

Checklist harus task-aware.

---

# 17. STEP P — REVIEW LIFECYCLE

Target:

```text
Run Completed
 ↓
Verification
 ↓
Quality Gate
 ↓
Review Pending
```

Jika PASS:

```text
Review Pending
 ↓
Approved
 ↓
Task Done
```

Jika verification gagal:

```text
Verification Failed
 ↓
Changes Requested
```

---

# 18. STEP Q — TASK STATUS SEPARATION

Jangan:

```text
Hermes Completed = Task Done
```

Gunakan:

```text
Run Completed
    ↓
Verification
    ↓
Review
    ↓
Task Completed
```

Run status dan Task status harus tetap terpisah.

---

# 19. STEP R — CHANGES REQUESTED

Jika review:

```text
Changes Requested
```

Simpan:

```text
review feedback
previousRunId
parentRunId
attempt
```

Jangan menimpa result lama.

Target:

```text
Run 1
 ↓
Changes Requested
 ↓
Run 2
 ↓
Verification
```

History tetap utuh.

---

# 20. STEP S — RETRY LINK

Retry harus terhubung:

```text
logical task
 ↓
attempt 1
 ↓
attempt 2
 ↓
attempt 3
```

Jika model/domain sudah memiliki attempt support, reuse.

---

# 21. STEP T — VERIFICATION RULES

Implementasikan rules terpisah jika memungkinkan:

```text
src/runtime/verification/rules/
```

Contoh:

```text
AcceptanceCriteriaRule.ts
TestResultRule.ts
TypecheckRule.ts
BuildRule.ts
ArtifactRule.ts
DiffRule.ts
SecurityRule.ts
```

Jangan memaksa semua rules berlaku untuk semua task.

---

# 22. STEP U — TEST RULES

Tambahkan:

```text
src/test/VerificationEngine.spec.ts
src/test/ResultIngestion.spec.ts
src/test/verificationRules.spec.ts
src/test/qualityGate.spec.ts
```

Minimal:

```text
1. all criteria pass
2. criterion failure
3. test failure
4. typecheck failure
5. build failure
6. security failure
7. no artifacts
8. real artifact
9. diff exists
10. no diff
11. evidence persistence
12. quality gate pass
13. quality gate warning
14. quality gate fail
```

---

# 23. STEP V — INTEGRATION TEST

Tambahkan:

```text
src/test/resultVerificationIntegration.spec.ts
```

Flow:

```text
Hermes completion fixture
 ↓
ResultIngestor
 ↓
VerificationEngine
 ↓
RunResult
 ↓
Review
```

Expected:

```text
Completed
→ Verification report
→ Review Pending
```

---

# 24. STEP W — REAL HERMES VALIDATION

Setelah tests pass, gunakan real Hermes.

Task aman:

```text
Title:
Verification Engine Smoke Test
```

Prompt:

```text
Inspect the current project runtime architecture.

Do not modify files.
Do not create files.
Do not delete files.

Return:
1. RuntimeFactory role
2. HermesRuntimeAdapter role
3. HermesClient role
4. Telemetry layer role
5. VerificationEngine role
```

Acceptance criteria:

```text
1. RuntimeFactory identified
2. HermesRuntimeAdapter identified
3. HermesClient identified
4. Telemetry identified
5. VerificationEngine identified
```

Runtime:

```text
Hermes
```

Expected:

```text
Real Hermes
 ↓
Real output
 ↓
ResultIngestion
 ↓
Verification
 ↓
RunResult
 ↓
Review
```

---

# 25. STEP X — VERIFY NO FALSE POSITIVE

Real run must NOT create:

```text
artifactIds:
['art-result-...']
```

unless actual artifact exists.

Real run must NOT automatically become:

```text
verificationStatus = Passed
```

without verification evidence.

Real run must not show:

```text
All acceptance assertions passed
```

unless every mandatory criterion is actually checked.

---

# 26. STEP Y — PERSISTENCE

After result creation:

```text
refresh
 ↓
RunResult remains
 ↓
Verification evidence remains
 ↓
Review remains
```

Verify all three survive reload.

---

# 27. STEP Z — REVIEW UI

Use existing Review page/store.

Required visible information:

```text
Run
Summary
Output
Artifacts
Verification Status
Verification Score
Evidence
Acceptance Criteria
Review Status
Reviewer
Comment
```

Do not redesign the full UI in this phase.

---

# 28. ACTIVITY / AUDIT

Create activity entries for:

```text
Run completed
Verification completed
Quality gate passed/failed
Review created
Review approved
Changes requested
Review rejected
Retry requested
```

Use existing Activity Store where available.

---

# 29. FINAL TYPECHECK / TEST / BUILD

Run:

```powershell
npm run typecheck
npm run test:unit
npm run build
```

Required:

```text
Typecheck PASS
All tests PASS
Build PASS
```

---

# 30. FINAL REAL-RUN GATE

Run exactly one real Hermes validation.

Required:

```text
Real Hermes execution             PASS
Result ingestion                  PASS
Artifact handling                 PASS
Diff handling                     PASS
Acceptance criteria               PASS
Verification evidence             PASS
Quality gate                      PASS
RunResult persisted               PASS
Review created                    PASS
Review survives refresh           PASS
No hardcoded Passed               PASS
No fake artifact IDs              PASS
```

---

# 31. SOURCE AUDIT AFTER IMPLEMENTATION

Search:

```powershell
Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Select-String -Pattern "verificationStatus:\s*'Passed'|All acceptance assertions passed|art-result-"
```

Expected:

```text
No real-runtime success logic remains.
```

Seed/mock fixtures may legitimately contain sample values; document those separately.

Search review hardcoding:

```powershell
Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Select-String -Pattern "completed:\s*true"
```

Review only production review logic; do not blindly modify test fixtures.

---

# 32. DEFINITION OF DONE

Phase 3.7 is complete only when:

```text
[ ] Real output ingested
[ ] Real artifacts ingested
[ ] Real diffs ingested
[ ] Acceptance criteria checked
[ ] Test results checked
[ ] Typecheck checked
[ ] Build checked
[ ] Security checked
[ ] Verification evidence stored
[ ] Quality Gate implemented
[ ] RunResult created from real evidence
[ ] Review created from verification result
[ ] Review checklist dynamic
[ ] Changes Requested supported
[ ] Retry linked to previous run
[ ] Evidence persists after refresh
[ ] Activity/audit recorded
[ ] Unit tests pass
[ ] Integration tests pass
[ ] Real Hermes run passes
[ ] No false-positive verification
```

---

# 33. EXECUTION ORDER FOR ANTIGRAVITY

Antigravity must execute exactly in this order:

```text
1. Baseline
   ↓
2. Audit HermesRuntimeAdapter result aggregation
   ↓
3. Audit existing RunResult
   ↓
4. Audit VerificationEngine
   ↓
5. Implement ResultIngestion only if missing
   ↓
6. Remove hardcoded result generation
   ↓
7. Upgrade VerificationEngine input contract
   ↓
8. Add verification evidence
   ↓
9. Add real artifact/diff checks
   ↓
10. Connect completion → ingestion → verification
   ↓
11. Make Review checklist dynamic
   ↓
12. Add tests
   ↓
13. Typecheck
   ↓
14. Test suite
   ↓
15. Build
   ↓
16. Real Hermes smoke run
   ↓
17. Persistence verification
   ↓
18. Freeze
```

---

# 34. STOP CONDITIONS

STOP if:

```text
real result cannot be extracted
OR
artifact schema is unknown
OR
diff source is unknown
OR
verification input is ambiguous
OR
hardcoded Passed remains in real execution
OR
fake artifacts remain
OR
review can be approved without verification
OR
tests fail
OR
build fails
OR
real Hermes result cannot reach RunResult
```

---

# 35. FINAL REPORT

Create:

```text
PHASE_3_7_RESULT_INGESTION_VERIFICATION_REPORT.md
```

Include:

```text
1. Existing components reused
2. Files changed
3. Result ingestion flow
4. Artifact flow
5. Diff flow
6. Verification rules
7. Quality Gate logic
8. Evidence model
9. Review lifecycle
10. Test results
11. Real Hermes validation
12. Persistence result
13. Known limitations
14. Freeze status
```

---

# FINAL SUCCESS CRITERION

Do not declare Phase 3.7 complete because:

```text
Hermes says "done"
```

Declare complete only when:

```text
REAL HERMES
    ↓
REAL RESULT
    ↓
REAL VERIFICATION
    ↓
REAL EVIDENCE
    ↓
QUALITY GATE
    ↓
REAL REVIEW
    ↓
TASK DECISION
```

is proven end-to-end.
