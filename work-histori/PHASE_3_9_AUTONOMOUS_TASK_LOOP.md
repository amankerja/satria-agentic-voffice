# PHASE 3.9 — AUTONOMOUS TASK LOOP
## SATRIA AI WORKFORCE / AI AGENTIC UI

### OBJECTIVE

Implementasikan orchestration layer di atas lifecycle existing tanpa mengganti Task Store, Assignment Store, AgentRun Store, Hermes Runtime, VerificationEngine, ResultIngestor, atau Review Store.

Target:

Task
→ AutonomousTaskLoop
→ Assignment
→ agentRunStore.startRunFromAssignment()
→ Hermes
→ Result Ingestion
→ Verification
→ Quality Gate
→ Review
→ Done / Retry / Blocked

---

# 1. HARD ARCHITECTURE RULES

1. `agentRunStore.retryRun(runId)` adalah SINGLE SOURCE OF TRUTH untuk retry.
2. AutonomousTaskLoop DILARANG memanggil `HermesRuntimeAdapter.retry()` secara langsung.
3. Jangan membuat retry mechanism kedua.
4. Jangan mengganti lifecycle yang sudah ada.
5. Jangan menambah TaskStatus baru kecuali ada bukti kuat bahwa domain existing tidak cukup.
6. Retry maksimum = 3 attempts.
7. Tidak boleh infinite loop.
8. Satu task hanya boleh memiliki satu autonomous loop aktif.
9. High-risk approval tetap membutuhkan human approval.
10. Jangan mengotomatisasi final review menjadi Approved tanpa policy eksplisit.
11. Jangan mengubah Hermes API contract.
12. Jangan membuat persistence layer baru.

---

# 2. CREATE AUTONOMY MODULE

Buat hanya file yang belum ada:

src/runtime/autonomy/
├── AutonomousTaskLoop.ts
├── TaskLifecycleMachine.ts
├── RetryPolicy.ts
├── FailureClassifier.ts
└── FeedbackBuilder.ts

---

# 3. TASK LIFECYCLE MACHINE

Buat internal lifecycle state:

```ts
type AutonomousState =
  | 'Idle'
  | 'Planning'
  | 'Executing'
  | 'Verifying'
  | 'AwaitingReview'
  | 'Retrying'
  | 'Completed'
  | 'Blocked'
  | 'Failed'
  | 'Cancelled'