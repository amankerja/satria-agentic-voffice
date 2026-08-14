# SATRIA AI WORKFORCE
## PHASE 3.6 — LIVE TELEMETRY & COST TRACKING
### Execution Command Sheet

**Basis:** Phase 3 Master Execution Plan v1.1  
**Current State:** Phase 3.5 Stable ✅  
**Next Step:** 3.6 Live Telemetry & Cost Tracking  
**Do NOT start:** Discord, scheduler, multi-agent, graph memory

---

# 0. OBJECTIVE

Phase 3.6 membuat telemetry dari runtime nyata terlihat di SATRIA.

Target:

```text
Hermes Runtime
   ↓
RuntimeTelemetry
   ↓
Runtime Events
   ↓
AgentRunStore
   ↓
Runs Overview / Run Detail
   ↓
User sees:
- Runtime
- Provider
- Model
- Prompt Tokens
- Completion Tokens
- Total Tokens
- Cached Tokens
- Duration
- Estimated Cost
```

Runtime contract Phase 3 sudah memiliki:

```text
promptTokens
completionTokens
totalTokens
cachedTokens
model
provider
durationMs
estimatedCostUsd
```

---

# 1. HARD BOUNDARIES

Phase 3.6 hanya menangani:

- telemetry contract
- runtime telemetry events
- store persistence/state
- run monitor UI
- cost calculation display
- duration
- token accounting
- error/fallback behavior
- tests
- QA

Jangan mengubah:

- task state machine
- assignment model
- Hermes protocol
- sandbox policy
- approval policy
- Phase 0 design system

Jangan menambahkan:

- Discord
- scheduler
- multi-agent
- autonomous cron
- graph memory
- new LLM provider just for testing

---

# 2. PRE-FLIGHT

```powershell
git status
git branch --show-current
git log -1 --oneline
git tag --list
```

Expected:

```text
phase-3.5-stable
```

Create branch:

```powershell
git checkout -b feat/phase-3-6-telemetry
```

Run baseline:

```powershell
npm run typecheck
npm run test:unit
npm run build
```

STOP if baseline fails.

---

# 3. STEP 3.6.A — AUDIT CURRENT TELEMETRY CONTRACT

Cari:

```powershell
git grep -n "RuntimeTelemetry"
git grep -n "promptTokens"
git grep -n "completionTokens"
git grep -n "totalTokens"
git grep -n "cachedTokens"
git grep -n "estimatedCostUsd"
git grep -n "telemetry"
git grep -n "CostCalculator"
```

Expected:
- telemetry types already exist
- runtime event already supports telemetry
- cost calculator already exists

Do not create a second telemetry model unless a defect is found.

---

# 4. STEP 3.6.B — DEFINE SOURCE OF TRUTH

Telemetry source must be:

```text
Runtime / Provider Response
        ↓
RuntimeTelemetry
```

NOT:

```text
UI hardcoded
```

NOT:

```text
estimated from progress
```

NOT:

```text
random mock values
```

For real Hermes runs, values must originate from actual runtime/provider response.

---

# 5. STEP 3.6.C — TELEMETRY NORMALIZATION

Create/confirm:

```text
src/runtime/telemetry/
├── TelemetryMapper.ts
├── CostCalculator.ts
└── TelemetryError.ts
```

Normalize:

```text
provider
model
promptTokens
completionTokens
cachedTokens
totalTokens
durationMs
estimatedCostUsd
```

Rules:

```text
totalTokens =
promptTokens
+ completionTokens
```

unless provider gives an authoritative total.

If provider does not return cached tokens:

```text
cachedTokens = 0
```

If provider does not return cost:

```text
estimatedCostUsd = calculated value
```

Do not invent provider data.

---

# 6. STEP 3.6.D — COST CALCULATOR

Cost calculation must use model pricing configuration, not UI constants.

Structure:

```typescript
ModelPricing {
  provider
  model
  inputPer1M
  outputPer1M
  cachedInputPer1M?
  currency
  effectiveFrom
}
```

Calculation:

```text
input cost
+
output cost
+
cached input adjustment
=
estimated cost
```

Keep pricing isolated from UI.

---

# 7. STEP 3.6.E — REAL TELEMETRY EVENT

When a model/runtime response arrives:

```text
model response
 ↓
TelemetryMapper
 ↓
RuntimeTelemetry
 ↓
RuntimeEvent
```

Event may be:

```text
telemetry:updated
```

If adding a new event, update the existing runtime event union rather than creating an unrelated event bus.

Payload:

```text
runId
timestamp
telemetry
```

---

# 8. STEP 3.6.F — LIVE TELEMETRY UPDATE

During a run:

```text
Run started
 ↓
Model request
 ↓
Telemetry arrives
 ↓
Store updates
 ↓
UI updates
```

Run Monitor should not require page refresh.

Use the existing event bridge.

---

# 9. STEP 3.6.G — STORE DESIGN

Add telemetry to the existing AgentRun state or a dedicated runtime telemetry store.

Preferred:

```text
AgentRun
   └── telemetry?
```

or a normalized:

```text
runTelemetry[runId]
```

Do not duplicate the same telemetry object in multiple unrelated stores.

Required selectors:

```text
getRunTelemetry(runId)
getRunCost(runId)
getRunDuration(runId)
getRunTokenUsage(runId)
```

---

# 10. STEP 3.6.H — RUN DETAIL UI

Target:

```text
src/pages/runs/RunDetailPage.vue
```

Add a compact telemetry card:

```text
Runtime
Hermes

Provider
Anthropic

Model
<model-id>

Tokens
32,410

Prompt
24,100

Completion
8,310

Cached
0

Duration
08m 42s

Estimated Cost
$0.18
```

Do not dominate the page.

Telemetry should support the execution monitor, not replace it.

---

# 11. STEP 3.6.I — RUN OVERVIEW UI

Target:

```text
src/pages/runs/RunsPage.vue
```

Optional compact columns:

```text
Run
Employee
Status
Model
Duration
Tokens
Cost
```

For mobile:

```text
Run Card
Status
Duration
Tokens
Cost
```

Do not force a wide table on mobile.

---

# 12. STEP 3.6.J — DASHBOARD KPI

Do not add too many metrics to Home.

Preferred additions:

```text
Runs Today
Total Tokens Today
Estimated Cost Today
Average Run Duration
```

Only show if data is meaningful.

Avoid making cost KPI prominent if there is insufficient data.

---

# 13. STEP 3.6.K — LIVE DURATION

During active run:

```text
startedAt
 ↓
now
 ↓
elapsed duration
```

When completed:

```text
completedAt - startedAt
```

Do not trust client-side ticking as the final recorded duration.

Use runtime timestamps as source of truth.

---

# 14. STEP 3.6.L — TELEMETRY EDGE CASES

Handle:

### Provider returns no usage

```text
Tokens
Unavailable
```

Do NOT display zero unless zero is actually known.

### Provider returns incomplete data

Show:

```text
Partial usage data
```

### Cost unavailable

Show:

```text
Cost unavailable
```

### Provider error

Telemetry UI must not crash the run monitor.

---

# 15. STEP 3.6.M — PRIVACY / SECURITY

Never show:

```text
API key
Bearer token
Authorization header
raw provider credentials
secret environment values
```

Telemetry logs may include:

```text
provider
model
request ID
usage
duration
cost
```

Do not log raw prompts/responses unless explicitly allowed by policy.

---

# 16. STEP 3.6.N — COST ROUNDING

Internal storage:

```text
high precision number
```

UI:

```text
$0.18
```

Do not round before calculation.

Use consistent currency formatting.

---

# 17. STEP 3.6.O — MODEL PRICING REGISTRY

Create or confirm:

```text
src/runtime/telemetry/modelPricing.ts
```

Example:

```text
Provider
Model
Input price
Output price
Cached input price
Effective date
```

Rules:

1. Unknown model must not silently use random pricing.
2. Unknown model → `Cost unavailable`.
3. Pricing changes must be versionable.

---

# 18. STEP 3.6.P — TESTS

Create:

```text
src/test/telemetry.spec.ts
src/test/costCalculator.spec.ts
```

Minimum tests:

### Test 1 — telemetry mapping

```text
provider response
→ normalized RuntimeTelemetry
```

### Test 2 — total tokens

```text
prompt + completion
→ total
```

### Test 3 — cached token handling

```text
cached input
→ cachedTokens captured
```

### Test 4 — cost calculation

```text
tokens + model pricing
→ correct estimatedCostUsd
```

### Test 5 — unknown pricing

```text
unknown model
→ cost unavailable
```

### Test 6 — live update

```text
telemetry:updated
→ store updated
→ UI state updated
```

### Test 7 — no telemetry

```text
missing usage
→ UI remains stable
```

### Test 8 — duration

```text
start/end timestamps
→ duration
```

---

# 19. STEP 3.6.Q — INTEGRATION TEST

Create:

```text
src/test/telemetryIntegration.spec.ts
```

Flow:

```text
Mock/Hermes Runtime
 ↓
model response telemetry
 ↓
runtime event
 ↓
AgentRunStore
 ↓
Run Detail state
```

Expected:

```text
tokens updated
duration updated
cost updated
model visible
provider visible
```

---

# 20. STEP 3.6.R — REAL RUNTIME TEST

After unit/integration tests pass, execute one real Hermes run.

Use the safe Backend API pilot.

Task:

```text
Analyze backend repository
and produce architecture summary.
```

Expected:

```text
Runtime: Hermes
Provider: actual provider
Model: actual model
Prompt tokens: actual / provider-reported
Completion tokens: actual / provider-reported
Total tokens: actual / derived
Duration: actual
Cost: actual or explicitly unavailable
```

---

# 21. STEP 3.6.S — MANUAL QA

Open:

```text
/runs
```

Then:

```text
/runs/:id
```

Verify:

```text
[ ] Runtime shown
[ ] Provider shown
[ ] Model shown
[ ] Prompt tokens shown
[ ] Completion tokens shown
[ ] Total tokens shown
[ ] Cached tokens shown when available
[ ] Duration updates
[ ] Cost displayed/calculated
[ ] No page refresh required
[ ] No console errors
```

---

# 22. STEP 3.6.T — REFRESH / NAVIGATION TEST

During a run:

```text
Run Detail
 ↓
Navigate elsewhere
 ↓
Return to Run Detail
```

Expected:

```text
Telemetry state still consistent
```

After completed run:

```text
Refresh
```

Expected:

```text
Persisted telemetry reloads correctly
```

If using mock repository persistence, ensure it survives navigation according to existing app architecture.

---

# 23. STEP 3.6.U — RESPONSIVE QA

Desktop:

```text
1280
1440
1600
```

Mobile:

```text
360
390
430
```

Check:

```text
No horizontal overflow
Telemetry cards readable
Numbers not clipped
Cost readable
Model text truncates safely
```

---

# 24. STEP 3.6.V — PERFORMANCE

Do not re-render the entire dashboard for every telemetry tick.

Use:

```text
run-scoped reactive updates
```

Avoid:

```text
global store mutation every 100ms
```

Suggested update frequency:

```text
250–1000ms
```

depending on the runtime event frequency.

---

# 25. STEP 3.6.W — QA COMMANDS

Run:

```powershell
npm run typecheck
npm run test:unit
npm run build
```

Expected:

```text
Typecheck = PASS
All tests = PASS
Build = PASS
```

Optional targeted:

```powershell
npx vitest run src/test/telemetry.spec.ts
npx vitest run src/test/costCalculator.spec.ts
npx vitest run src/test/telemetryIntegration.spec.ts
```

---

# 26. GIT REVIEW

```powershell
git status
git diff --stat
git diff
```

Expected changed areas:

```text
runtime/telemetry
AgentRun telemetry state
RunsPage
RunDetailPage
tests
```

Avoid unrelated Phase 0/1/2 refactors.

---

# 27. COMMIT

After everything passes:

```powershell
git add .
git commit -m "feat: add live runtime telemetry and cost tracking"
```

---

# 28. TAG

After final manual QA:

```powershell
git tag phase-3.6-stable
```

If remote:

```powershell
git push origin HEAD
git push origin phase-3.6-stable
```

---

# 29. ACCEPTANCE CRITERIA

Phase 3.6 PASS when:

- [ ] Runtime telemetry contract is used as source of truth.
- [ ] Real runtime telemetry reaches Run Monitor.
- [ ] Provider shown.
- [ ] Model shown.
- [ ] Prompt tokens shown.
- [ ] Completion tokens shown.
- [ ] Total tokens shown.
- [ ] Cached tokens handled safely.
- [ ] Duration shown.
- [ ] Cost calculated from versioned pricing.
- [ ] Unknown pricing handled safely.
- [ ] Missing telemetry handled gracefully.
- [ ] No sensitive credentials exposed.
- [ ] Live updates work without refresh.
- [ ] Navigation/refresh retains correct state.
- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Responsive QA passes.

---

# 30. DO NOT MOVE TO 3.7 UNTIL

```text
Telemetry contract      ✅
Runtime telemetry       ✅
Cost calculation        ✅
Run Detail UI           ✅
Run Overview UI         ✅
Integration test        ✅
Real Hermes test        ✅
Typecheck               ✅
Tests                   ✅
Build                   ✅
Manual QA               ✅
```

Then:

```text
PHASE 3.6
✅ FROZEN

      ↓

PHASE 3.7
RESULT INGESTION & VERIFICATION
```

---

# 31. PHASE 3.7 PREVIEW

Next phase will focus on:

```text
Hermes output
 ↓
RunResult
 ↓
Verification Engine
 ↓
Quality Gate
 ↓
Review
 ↓
Task Completion
```

Do not implement the new verification logic inside Phase 3.6 unless needed for telemetry stability.

---

# 32. REPORT BACK

After execution:

```text
PHASE 3.6 — TELEMETRY REPORT

Baseline:
PASS / FAIL

Telemetry Contract:
PASS / FAIL

Telemetry Mapping:
PASS / FAIL

Cost Calculator:
PASS / FAIL

Run Detail:
PASS / FAIL

Runs Overview:
PASS / FAIL

Dashboard:
PASS / FAIL

Integration Test:
PASS / FAIL

Real Hermes Run:
PASS / FAIL

Typecheck:
PASS / FAIL

Tests:
PASS / FAIL

Build:
PASS / FAIL

Console Errors:
0 / ...

Unknown Pricing:
Handled / Not handled

Remaining Problems:
...

Git Tag:
phase-3.6-stable / not yet
```

---

# 33. FIRST COMMANDS NOW

Run only these first:

```powershell
git status
git branch --show-current
git log -1 --oneline
git tag --list

npm run typecheck
npm run test:unit
npm run build
```

Then inspect telemetry:

```powershell
git grep -n "RuntimeTelemetry"
git grep -n "promptTokens"
git grep -n "estimatedCostUsd"
git grep -n "CostCalculator"
git grep -n "telemetry"
```

**Do not begin UI changes until the current telemetry implementation has been audited.**
