# ANTIGRAVITY IDE — PHASE 3.6R
# NATIVE HERMES RUNS API CONTRACT ALIGNMENT

## Project
SATRIA AI WORKFORCE / AI AGENTIC UI

## Phase
3.6R — Native Hermes Runs API Integration

## Objective
Replace the SATRIA `/v1/agent/*` adapter contract with the native Hermes v0.20.1 Runs API discovered during validation.

---

## 0. EXECUTION CONTRACT

Antigravity must:

1. Inspect the repository before editing.
2. Inspect the installed Hermes v0.20.1 source before assuming schemas.
3. Treat the installed Hermes source as the contract source of truth.
4. Do not invent endpoint fields or event shapes.
5. Preserve `AgentRuntime`, Mock Runtime, Phase 0–3.5 UI and state model.
6. Do not add Discord, Telegram, scheduler, multi-agent, graph memory, or autonomy.
7. Never expose secrets in source, logs, screenshots, or reports.
8. Make small changes and run validation after each logical change.
9. Stop on contract ambiguity instead of guessing.

---

# 1. BASELINE

Current reported baseline:

```text
Typecheck          PASS
17 test suites     PASS
103 tests          PASS
Production build   PASS
Hermes Agent       v0.20.1
Hermes health      PASS on 127.0.0.1:8642
```

Current blocker:

```text
SATRIA uses:
/v1/agent/run
/v1/agent/stream/:sessionId
/v1/agent/signal/:sessionId

Native Hermes uses:
/v1/runs
/v1/runs/{run_id}
/v1/runs/{run_id}/events
/v1/runs/{run_id}/approval
/v1/runs/{run_id}/stop
```

Verify these against the installed Hermes source before coding.

---

# 2. CREATE BRANCH

```powershell
git status
git branch --show-current
git checkout -b feat/phase-3-6r-native-hermes-api
```

If already created:

```powershell
git checkout feat/phase-3-6r-native-hermes-api
```

Baseline:

```powershell
git add .
git commit -m "chore: baseline before native Hermes API alignment"
```

---

# 3. INSPECT INSTALLED HERMES SOURCE

Expected Hermes home:

```powershell
$env:HERMES_HOME
```

Then:

```powershell
Get-ChildItem "$env:HERMES_HOME\hermes-agent" -Force
```

Find actual API routes:

```powershell
Get-ChildItem "$env:HERMES_HOME\hermes-agent" -Recurse -File -Include *.py |
Select-String -Pattern 'v1/runs|/events|/approval|/stop|/steer|/health'
```

Find schema/field definitions:

```powershell
Get-ChildItem "$env:HERMES_HOME\hermes-agent" -Recurse -File -Include *.py |
Select-String -Pattern 'run_id|status|session_id|approval|message.delta|run.completed|run.failed|run.cancelled'
```

Find auth/CORS:

```powershell
Get-ChildItem "$env:HERMES_HOME\hermes-agent" -Recurse -File -Include *.py |
Select-String -Pattern 'API_SERVER_KEY|Authorization|CORS|API_SERVER_CORS_ORIGINS'
```

Create an internal contract table:

```text
health:
create run:
get run:
events:
approval:
stop:
steer:
auth:
CORS:
run_id:
session_id:
terminal events:
telemetry event:
```

If any required schema is uncertain, STOP and report it.

---

# 4. INSPECT SATRIA CURRENT CONTRACT

```powershell
Get-Content src\runtime\hermes\hermesContract.ts
Get-Content src\runtime\hermes\HermesClient.ts
Get-Content src\runtime\hermes\HermesMapper.ts
Get-Content src\runtime\hermes\HermesRuntimeAdapter.ts
```

Search old endpoints:

```powershell
Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Select-String -Pattern '/v1/agent/run|/v1/agent/stream|/v1/agent/signal'
```

After migration there must be no production references to the old `/v1/agent/*` contract.

---

# 5. UPDATE `hermesContract.ts`

File:

```text
src/runtime/hermes/hermesContract.ts
```

Create endpoint builders based strictly on the verified Hermes source:

```ts
export const HERMES_ENDPOINTS = {
  health: '/health',
  runs: '/v1/runs',
  run: (runId: string) => `/v1/runs/${encodeURIComponent(runId)}`,
  events: (runId: string) =>
    `/v1/runs/${encodeURIComponent(runId)}/events`,
  approval: (runId: string) =>
    `/v1/runs/${encodeURIComponent(runId)}/approval`,
  stop: (runId: string) =>
    `/v1/runs/${encodeURIComponent(runId)}/stop`,
  steer: (runId: string) =>
    `/v1/runs/${encodeURIComponent(runId)}/steer`
} as const
```

Do not keep an endpoint that Hermes v0.20.1 does not expose unless explicitly documented as legacy compatibility.

---

# 6. NATIVE RESPONSE TYPES

Add verified native response types, for example:

```ts
export interface HermesCreateRunResponse {
  run_id: string
  status?: string
  session_id?: string
}

export interface HermesRunStatusResponse {
  run_id: string
  status: string
  session_id?: string
}

export interface HermesNativeEvent {
  type: string
  [key: string]: unknown
}
```

Adjust fields to the actual Hermes schema.

Never assume `session_id` exists unless verified.

---

# 7. SEPARATE IDENTIFIERS

Create:

```ts
export interface HermesExecutionRef {
  satriaRunId: string
  hermesRunId: string
  hermesSessionId?: string
  attempt: number
}
```

Rules:

```text
SATRIA runId != Hermes run_id
session_id is optional and independent
attempt is logical retry count
```

Do not use sessionId as the Hermes run ID unless Hermes explicitly defines it that way.

---

# 8. REWRITE `HermesClient.initiateRun()`

Change from:

```text
POST /v1/agent/run
```

to:

```text
POST /v1/runs
```

Use the request body schema from the installed Hermes source.

Validate:

```ts
const data = await res.json()

if (!data || typeof data.run_id !== 'string' || !data.run_id) {
  throw new Error('Invalid Hermes response: run_id is missing')
}
```

Return a normalized internal object:

```ts
{
  runId: data.run_id,
  status: data.status,
  sessionId: data.session_id
}
```

only if those fields are actually present.

---

# 9. ADD `getRunStatus()`

Add:

```ts
async getRunStatus(runId: string)
```

Use:

```text
GET /v1/runs/{run_id}
```

Purpose:

```text
SSE reconnect recovery
browser refresh recovery
ambiguous stream state
final status reconciliation
```

Validate the response.

---

# 10. REWRITE SSE

Replace:

```text
/v1/agent/stream/:sessionId
```

with:

```text
/v1/runs/{run_id}/events
```

Use:

```text
Hermes run_id
```

as the stream identifier.

Keep the existing reconnect/backoff implementation from the hardening work.

---

# 11. NATIVE EVENT VALIDATION

Before mapping:

```text
raw event
 ↓
object?
 ↓
type exists?
 ↓
known event?
```

Known event handlers should be derived from actual Hermes v0.20.1 source.

Expected categories may include:

```text
run lifecycle
message delta
approval request
tool event
usage/telemetry
```

Do not assume exact wire event names without verifying them.

Unknown event:

```text
log safely
ignore without crashing the run
```

---

# 12. MESSAGE DELTA HANDLING

If Hermes streams incremental output:

```text
message.delta
message.delta
message.delta
...
run.completed
```

accumulate chunks once.

Prevent:

```text
duplicate chunks
```

If Hermes supplies:

```text
event_id
sequence
```

use them for deduplication.

If not supplied, do not invent a false sequence mechanism.

---

# 13. TELEMETRY MAPPING

Telemetry must be derived from actual Hermes/provider payloads.

Possible fields:

```text
input/prompt tokens
output/completion tokens
cached tokens
total tokens
model
provider
duration
cost
```

If absent:

```text
null / unavailable
```

Never manufacture live usage from run progress.

Mock Runtime may continue to simulate telemetry only for mock tests.

---

# 14. COST SEMANTICS

Distinguish:

```text
provider-reported cost
estimated local cost
unavailable
```

If no authoritative cost exists:

```text
costSource = estimated
```

If pricing is unknown:

```text
estimatedCostUsd = null
```

UI must say:

```text
Cost unavailable
```

Do not label an estimate as actual provider billing.

---

# 15. REPLACE `sendSignal()`

Do not use:

```text
POST /v1/agent/signal/:sessionId
```

Create separate methods:

```ts
stopRun(hermesRunId)
respondApproval(hermesRunId, payload)
steerRun(hermesRunId, payload)
```

Use only endpoints confirmed in Hermes v0.20.1 source.

If native Hermes has no direct pause/resume equivalent, do not fake it.

Return a typed unsupported error when necessary.

---

# 16. STOP/CANCEL

Target:

```text
SATRIA cancel
 ↓
POST /v1/runs/{run_id}/stop
 ↓
native terminal state/event
 ↓
SATRIA run:cancelled
 ↓
cleanup
```

Do not mark success before the native call is accepted according to the verified API semantics.

---

# 17. APPROVAL

Target:

```text
Hermes approval event
 ↓
HermesMapper
 ↓
approval:required
 ↓
SATRIA UI
 ↓
Approve/Reject
 ↓
POST /v1/runs/{run_id}/approval
 ↓
Hermes continues/stops
```

Use the exact approval request schema found in Hermes source.

Do not use the old `/signal` endpoint.

---

# 18. STEER

If SATRIA does not currently expose steering:

```text
Do not create new UI.
```

Only provide the client method if needed later.

---

# 19. UPDATE `HermesRuntimeAdapter`

Internal state must retain:

```text
satriaRunId
hermesRunId
hermesSessionId?
attempt
```

Start:

```text
POST /v1/runs
 ↓
store Hermes run_id
 ↓
connect /events
```

Retry:

```text
same SATRIA logical run
 ↓
new attempt
 ↓
new Hermes run_id
```

Terminal event:

```text
close stream
cleanup execution
persist final state
```

---

# 20. SSE RECOVERY

On stream disconnect:

```text
DO NOT immediately run:failed
```

Use:

```text
disconnect
 ↓
reconnect with backoff
 ↓
GET /v1/runs/{run_id}
 ↓
still running?
 ├─ yes → reconnect
 └─ terminal → reconcile + cleanup
```

If run no longer exists:

```text
SESSION_NOT_FOUND / RUN_NOT_FOUND
```

according to actual runtime error taxonomy.

---

# 21. AUTHENTICATION

The real Hermes gateway may require:

```http
Authorization: Bearer <API_SERVER_KEY>
```

Ensure REST requests use the current configured key.

Do not print or commit the key.

Do not expose a permanent production secret via:

```text
VITE_HERMES_API_KEY
```

For production prefer:

```text
Browser
 ↓
SATRIA BFF/backend
 ↓
Hermes
```

For local development, a local-only key is acceptable if it is not committed.

---

# 22. LOCAL URL

Update local development to:

```env
VITE_HERMES_URL=http://127.0.0.1:8642
```

Use:

```powershell
Select-String -Path ".env*" -Pattern "^VITE_HERMES_URL="
```

Do not print API key values.

Do not use Apache port `8080` for Hermes if it is occupied by another service.

---

# 23. CORS

If direct browser → Hermes is used in local development, configure Hermes CORS only for the SATRIA development origin.

Do not use wildcard CORS in production.

If CORS/auth complexity becomes unsafe, implement BFF instead of weakening security.

---

# 24. UPDATE TESTS

## `HermesClient.spec.ts`

Replace old endpoint expectations with:

```text
POST /v1/runs
GET /v1/runs/:id
GET /v1/runs/:id/events
POST /v1/runs/:id/approval
POST /v1/runs/:id/stop
```

Tests:

```text
valid run_id
missing run_id
400
401
403
500
timeout
network failure
invalid payload
```

## `HermesMapper.spec.ts`

Use real payload fixtures extracted from Hermes v0.20.1 source.

Test:

```text
run lifecycle
message delta
approval event
tool event
telemetry/usage
completed
failed
cancelled
unknown event
malformed event
```

## `HermesRuntimeAdapter.spec.ts`

Test:

```text
start
duplicate start
completion
failure
cancel
approval
retry
reconnect
terminal cleanup
```

---

# 25. REMOVE OLD CONTRACT REFERENCES

Run:

```powershell
Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Select-String -Pattern '/v1/agent/run|/v1/agent/stream|/v1/agent/signal'
```

Expected:

```text
No production references
```

Any remaining reference must be intentionally documented as legacy test/compatibility code.

---

# 26. AUTOMATED VALIDATION

Run:

```powershell
npm run typecheck
npm run test:unit
npm run build
```

Do not remove or weaken tests to make them pass.

---

# 27. HERMES HEALTH

With Hermes v0.20.1 gateway running:

```powershell
Invoke-RestMethod http://127.0.0.1:8642/health
```

Expected:

```text
status = ok
version = 0.20.1
```

If the API requires authentication, use the configured local key without printing it.

---

# 28. NATIVE API SMOKE TEST

Before SATRIA UI execution, prove:

```text
POST /v1/runs
 ↓
run_id
 ↓
GET /v1/runs/{run_id}
 ↓
GET /v1/runs/{run_id}/events
```

The request body MUST come from the actual Hermes v0.20.1 source/schema.

Do not invent the payload.

---

# 29. REAL SATRIA RUN

Task:

```text
Title:
Real Hermes Telemetry Validation
```

Prompt:

```text
Analyze the backend project structure and produce a concise architecture summary.

Requirements:
- Do not modify files.
- Do not create files.
- Do not delete files.
- Do not execute destructive commands.
- Read only what is necessary.
- Return a concise architecture summary.
```

Employee:

```text
Backend API
```

Runtime:

```text
Hermes
```

---

# 30. REAL INTEGRATION ACCEPTANCE

PASS only when:

```text
SATRIA task
 ↓
HermesRuntimeAdapter
 ↓
POST /v1/runs
 ↓
real Hermes run_id
 ↓
GET /v1/runs/{run_id}/events
 ↓
real Hermes events
 ↓
HermesMapper
 ↓
RuntimeEvent
 ↓
AgentRun Store
 ↓
live Run Detail
 ↓
real telemetry
 ↓
completion
```

Required evidence:

```text
Runtime = Hermes
Provider = actual / unavailable
Model = actual / unavailable
Input tokens = actual / unavailable
Output tokens = actual / unavailable
Total tokens = actual / derived / unavailable
Cached tokens = actual / unavailable
Duration = recorded
Cost = provider / estimated / unavailable
Final status = correct
```

---

# 31. PERSISTENCE TEST

After completed:

```text
Ctrl+R
```

Return to:

```text
/runs/:id
```

Verify:

```text
model
provider
tokens
duration
cost status
final state
```

Telemetry disappearing after refresh = FAIL.

---

# 32. CANCEL TEST

Start a harmless run.

Click cancel.

Expected:

```text
native stop request
 ↓
terminal Hermes state/event
 ↓
SATRIA Cancelled
 ↓
stream cleanup
```

No execution may continue after cancellation.

---

# 33. APPROVAL TEST

Use a sandbox-only documentation write.

Expected:

```text
approval.request
 ↓
approval:required
 ↓
UI
```

Reject:

```text
tool does not execute
```

Approve:

```text
tool executes
run continues
```

---

# 34. RETRY TEST

Controlled retryable failure:

```text
attempt 1
 ↓
retryable failure
 ↓
attempt 2
 ↓
new Hermes run_id
```

Same logical SATRIA run.

No duplicate active Hermes runs.

Respect max retry.

---

# 35. FINAL SECURITY AUDIT

Search source without exposing secret values:

```powershell
Get-ChildItem src -Recurse -File -Include *.ts,*.tsx |
Select-String -Pattern 'API_SERVER_KEY|VITE_HERMES_API_KEY|Authorization|Bearer'
```

Check:

```text
No hardcoded key
No key in logs
No key in telemetry
No secret in request payload logging
```

---

# 36. FINAL TEST MATRIX

Antigravity must report:

```text
Native contract verified        PASS / FAIL
Health                           PASS / FAIL
Create run                       PASS / FAIL
Get run                          PASS / FAIL
SSE                              PASS / FAIL
Approval                         PASS / FAIL
Stop                             PASS / FAIL
Mapper                           PASS / FAIL
Runtime adapter                  PASS / FAIL
Telemetry                        PASS / FAIL
Persistence                      PASS / FAIL
Retry                            PASS / FAIL
Cancel                           PASS / FAIL
Typecheck                        PASS / FAIL
Tests                            PASS / FAIL
Build                            PASS / FAIL
Security                         PASS / FAIL
Real SATRIA run                  PASS / FAIL
```

---

# 37. STOP CONDITIONS

Stop immediately if:

```text
Hermes schema is uncertain
run endpoint returns unexpected schema
SSE event schema is unknown
authentication fails
Mock Runtime is used accidentally
telemetry is synthetic
live UI requires refresh
telemetry disappears after refresh
duplicate Hermes runs occur
cancelled run continues
rejected approval executes
retry loops
secret leaks
tests fail
build fails
```

---

# 38. COMMIT STRATEGY

After contract alignment:

```powershell
git add src/runtime/hermes
git commit -m "feat: align Hermes client with native runs API"
```

After tests:

```powershell
git add src/test
git commit -m "test: add native Hermes runs API contract coverage"
```

Final review:

```powershell
git status
git diff --stat
git diff
```

---

# 39. FREEZE

Only after all acceptance gates pass:

```powershell
git add .
git commit -m "feat: complete native Hermes runs API integration"
git tag phase-3.6r-hermes-native-api-stable
```

If remote exists:

```powershell
git push origin HEAD
git push origin phase-3.6r-hermes-native-api-stable
```

---

# 40. FINAL REPORT FILE

Create:

```text
PHASE_3_6R_NATIVE_HERMES_API_ALIGNMENT_REPORT.md
```

Include:

```text
1. Hermes version
2. Verified native endpoints
3. Request/response schemas
4. Event schemas
5. Files changed
6. Old endpoint references removed
7. Authentication
8. CORS/BFF decision
9. SSE behavior
10. Run ID/session ID mapping
11. Telemetry source
12. Test results
13. Build result
14. Real integration result
15. Known limitations
16. Freeze/tag status
```

---

# FINAL SUCCESS CRITERION

The integration is NOT successful because SATRIA can compile.

It is successful only when:

```text
SATRIA
  ↓
Native Hermes Runs API
  ↓
Real Hermes run
  ↓
Real Hermes events
  ↓
Real telemetry
  ↓
SATRIA run state
  ↓
Live UI
  ↓
Persisted result
```

is proven end-to-end.
