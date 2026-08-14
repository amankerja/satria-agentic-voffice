# AI AGENTIC UI — Rencana Perbaikan Runtime Hermes & Telemetry

## Tujuan
Perbaiki runtime Hermes agar siap production: koneksi tervalidasi, timeout, SSE reconnect, lifecycle run konsisten, approval aman, telemetry akurat, dan test lengkap.

> Catatan: endpoint Hermes yang terlihat di source (`/health`, `/v1/agent/run`, `/v1/agent/signal/:sessionId`, `/v1/agent/stream/:sessionId`) belum terbukti sebagai kontrak resmi server Hermes. Verifikasi kontrak server terlebih dahulu.

---

## 1. Baseline

```powershell
git status
git checkout -b fix/hermes-runtime-hardening
git add .
git commit -m "chore: baseline before Hermes runtime hardening"

Get-Content package.json
npm test
npm run build
```

Jika script berbeda, gunakan script yang tersedia di `package.json`.

**Jangan refactor besar sebelum baseline test/build diketahui.**

---

## 2. Verifikasi Kontrak Hermes

Source saat ini mengasumsikan:

```text
GET  /health
POST /v1/agent/run
POST /v1/agent/signal/:sessionId
GET  /v1/agent/stream/:sessionId
```

Buat satu sumber endpoint:

`src/runtime/hermes/hermesContract.ts`

```ts
export const HERMES_ENDPOINTS = {
  health: '/health',
  run: '/v1/agent/run',
  signal: (sessionId: string) => `/v1/agent/signal/${sessionId}`,
  stream: (sessionId: string) => `/v1/agent/stream/${sessionId}`
} as const
```

Validasi response run; jangan langsung `return await res.json()`.

```ts
const data = await res.json()

if (!data || typeof data.sessionId !== 'string' || !data.sessionId) {
  throw new Error('Invalid Hermes run response: sessionId is missing')
}

return { sessionId: data.sessionId }
```

---

## 3. Hardening HermesClient

File:

```text
src/runtime/hermes/HermesClient.ts
```

### Masalah
`timeoutMs` sudah ada tetapi `initiateRun()` dan `sendSignal()` belum menggunakannya.

Buat helper:

```ts
private async fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = this.config.timeoutMs
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}
```

Gunakan untuk `healthCheck`, `initiateRun`, dan `sendSignal`.

---

## 4. Hardening SSE

Current implementation menutup `EventSource` ketika error:

```ts
eventSource.onerror = (err) => {
  onError(err)
  eventSource.close()
}
```

Tambahkan:

- connection state
- reconnect
- exponential backoff
- maximum reconnect
- cleanup timer
- cleanup EventSource
- deduplication event jika Hermes menyediakan sequence/event ID

Contoh backoff:

```text
1s → 2s → 4s → 8s → ... → maksimum 30s
```

Cleanup harus menghentikan timer dan menutup EventSource.

Jika stream memerlukan Authorization header, native `EventSource` tidak mendukung custom header. Gunakan backend gateway, fetch-based SSE client, atau short-lived stream token. Jangan menaruh secret permanen di URL.

---

## 5. Satukan State Hermes Run

Saat ini ada:

```ts
activeStreams
sessionMap
runInputs
listeners
```

Lebih aman gunakan satu state:

```ts
interface HermesRunState {
  runId: string
  sessionId?: string
  status:
    | 'starting'
    | 'running'
    | 'paused'
    | 'waiting_approval'
    | 'completed'
    | 'failed'
    | 'cancelled'
  input: AgentRunInput
  listener: (event: RuntimeEvent) => void
  closeStream?: () => void
}
```

Kemudian:

```ts
private runs = new Map<string, HermesRunState>()
```

---

## 6. Cegah Duplicate Run

Sebelum `initiateRun()`:

```ts
if (this.runs.has(runId)) {
  throw new AgentRuntimeError(
    'CONFLICT',
    `Run ${runId} is already active.`,
    runId
  )
}
```

Target:

```text
runId sama
  ↓
POST dua kali?  NO
```

---

## 7. Perbaiki Start Lifecycle

Target:

```text
start()
 ↓
register state
 ↓
emit run:started
 ↓
build payload
 ↓
POST /v1/agent/run
 ↓
validate sessionId
 ↓
save sessionId
 ↓
connect SSE
 ↓
running
```

Jika gagal:

```text
failed
 ↓
cleanup
 ↓
run:failed
```

Jangan meninggalkan state/stream yang menggantung.

---

## 8. Buat Central Cleanup

Buat:

```ts
private cleanupRun(runId: string): void
```

Yang membersihkan:

```text
stream
session
listener
active state
```

Jika retry membutuhkan input, pisahkan data retry dari active execution state supaya Map tidak tumbuh tanpa batas.

---

## 9. Perbaiki Cancel

Target:

```text
send cancel
 ↓
state = cancelled
 ↓
emit run:cancelled
 ↓
close stream
 ↓
cleanup
```

Jangan hanya menutup stream tanpa memberitahu Store/UI.

---

## 10. Perbaiki Pause / Resume

### Pause

```text
session tersedia?
 ↓
send pause
 ↓
state = paused
 ↓
emit run:paused
```

Jika session tidak ada, return error; jangan berpura-pura pause berhasil.

### Resume

Setelah signal berhasil, update state kembali ke `running` dan emit event internal yang konsisten.

---

## 11. Perbaiki Retry

Definisikan:

```ts
const MAX_RETRIES = 3
```

Dokumentasikan apakah `attempt` berarti attempt saat ini atau jumlah retry.

Target:

```text
attempt 1 → gagal
attempt 2 → gagal
attempt 3 → gagal
STOP
```

Jangan retry semua error.

### Retryable

```text
network failure
timeout
temporary 5xx
stream disconnect
```

### Tidak otomatis retry

```text
400
401
403
invalid payload
permission denied
approval rejected
unknown tool
```

---

## 12. Approval Flow

Target:

```text
Hermes
 ↓
approval:required
 ↓
UI
 ↓
approve/reject
 ↓
respondApproval()
 ↓
Hermes continue/stop
```

Jika reject, jangan hanya `stopExecutionStreams()`. Pastikan status final dikirim ke Store/UI.

Keputusan security harus berada di trusted runtime/backend; frontend bukan security boundary.

---

## 13. Tool Permission

Saat ini mapper hanya mengirim:

```ts
name
category
permissionLevel
```

Buat kategori permission yang jelas:

```text
read-only
write
execute
network
deploy
destructive
```

High-risk jangan hanya berdasarkan nama:

```ts
raw.toolName === 'filesystem.write'
```

Gunakan tool registry/policy.

---

## 14. HermesMapper

File:

```text
src/runtime/hermes/HermesMapper.ts
```

### Masalah

Model production hard-coded:

```ts
model: 'hermes-3-llama-3.1-70b'
```

Jangan hard-code model production di mapper.

Gunakan runtime configuration atau konfigurasi Hermes.

Selain itu `raw: any` terlalu longgar. Tambahkan validation sebelum mapping.

Minimal:

```ts
if (!raw || typeof raw !== 'object' || typeof raw.type !== 'string') {
  // reject/ignore safely
}
```

Untuk event penting, validasi field wajib.

---

## 15. Terminal Event

Definisikan:

```text
run:completed
run:failed
run:cancelled
```

Setelah terminal event:

```text
close stream
cleanup active execution
persist final state
```

Jangan menunggu SSE error untuk cleanup.

---

## 16. Event Ordering

Jika Hermes mendukung:

```text
eventId
sequence
timestamp
```

simpan sequence terakhir.

Jika event lama datang setelah reconnect:

```text
sequence <= lastSequence
 ↓
ignore
```

Ini mencegah duplicate/out-of-order event.

---

## 17. Telemetry

Pertahankan contract:

```ts
export interface RuntimeTelemetry {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cachedTokens: number
  model: string
  provider: string
  durationMs: number
  estimatedCostUsd: number | null
}
```

Alur:

```text
Hermes telemetry
 ↓
TelemetryMapper
 ↓
RuntimeTelemetry
 ↓
Store
 ↓
UI
```

Hermes tidak boleh membuat telemetry palsu. Mock boleh mensimulasikan telemetry.

---

## 18. Cost Calculation

Current formula menambahkan:

```text
promptCost + completionCost + cachedCost
```

Ini harus diverifikasi terhadap arti `cachedTokens` dari provider Hermes.

Jika cached token adalah bagian dari prompt yang mendapat tarif berbeda, model yang benar umumnya perlu membedakan:

```text
uncached input tokens
cached input tokens
output tokens
```

Jangan ubah formula sebelum kontrak telemetry/provider Hermes dipastikan.

---

## 19. Estimated vs Actual Cost

UI harus membedakan:

```text
Estimated Cost
```

dan:

```text
Actual/Provider Cost
```

Jika provider mengirim cost:

```text
costSource = provider
```

Jika dihitung lokal:

```text
costSource = estimated
```

Jika model tidak dikenal:

```text
estimatedCostUsd = null
```

dan UI:

```text
Cost unavailable
```

Jika perlu, tambahkan optional fields tanpa memutus data lama:

```ts
inputTokens?: number
outputTokens?: number
cacheReadTokens?: number
cacheWriteTokens?: number
requestId?: string
traceId?: string
costCurrency?: string
costSource?: 'provider' | 'estimated' | 'unknown'
```

---

## 20. RuntimeTelemetry Duplikat

Ada indikasi `RuntimeTelemetry` didefinisikan di:

```text
src/runtime/types.ts
src/types/index.ts
```

Tentukan satu source of truth. Jangan mempertahankan dua interface identik dalam jangka panjang.

---

## 21. RuntimeFactory

Current default:

```ts
private static currentDefaultMode: RuntimeMode = 'mock'
```

Untuk production jangan diam-diam fallback ke mock.

Target:

```text
development → mock boleh
production → Hermes explicit
Hermes gagal → tampilkan error
```

Jangan membuat user mengira task benar-benar dieksekusi jika sebenarnya mock.

---

## 22. Health Check

Sebelum Hermes run:

```text
checkHealth()
 ↓
healthy?
 ├─ YES → start
 └─ NO  → fail fast
```

Health check bisa menjadi preflight atau saat user memilih Hermes.

---

## 23. Environment & Secret

Current:

```env
VITE_HERMES_URL=http://localhost:8080
VITE_HERMES_API_KEY=
```

Penting: variable `VITE_*` pada aplikasi browser dapat masuk ke bundle frontend.

Jangan menyimpan secret jangka panjang di:

```env
VITE_HERMES_API_KEY=SECRET
```

Untuk production lebih aman:

```text
Browser
 ↓
Backend/Gateway
 ↓
Hermes
```

Backend menyimpan credential Hermes.

---

## 24. CORS

Production jangan memakai wildcard jika credential/session sensitif.

Gunakan allowlist origin aplikasi.

Contoh konsep:

```text
https://your-app-domain.com
```

---

## 25. Workspace Security

Payload mengirim:

```ts
workspace: {
  path: input.workspacePath
}
```

Backend/Hermes harus memvalidasi:

```text
workspacePath
 ↓
normalize
 ↓
resolve
 ↓
allowed root check
 ↓
reject path traversal
```

Contoh:

```text
/workspace/projects/project-a   → VALID
/workspace/projects/../secrets  → REJECT
```

---

## 26. Context Security

Audit:

```text
ContextBuilder.build(input)
```

Pastikan prompt/payload tidak memasukkan:

```text
API key
password
token
credential
private secret
data sensitif yang tidak diperlukan
```

ke Hermes, telemetry, atau log.

---

## 27. Error Classification

Jangan semua error menjadi `NETWORK_FAILURE`.

Pisahkan minimal:

```text
NETWORK_FAILURE
TIMEOUT
AUTHENTICATION_FAILURE
AUTHORIZATION_FAILURE
VALIDATION_FAILURE
HERMES_API_ERROR
SESSION_NOT_FOUND
STREAM_FAILURE
APPROVAL_ERROR
INTERNAL_ERROR
```

---

## 28. Store `agentRun`

File:

```text
src/stores/agentRun.ts
```

Audit seluruh event:

```text
run:started
step:changed
log:emitted
progress:updated
telemetry:updated
tool:requested
tool:executed
approval:required
approval:resolved
run:completed
run:failed
run:cancelled
run:paused
```

Setiap event harus:

1. update memory state
2. persist jika diperlukan
3. tidak menimpa data valid dengan `undefined`
4. membuat status final pada terminal event

---

## 29. Test HermesClient

Wajib test:

### Health

```text
200
500
network error
timeout
invalid JSON
```

### Run

```text
valid sessionId
missing sessionId
400
401
500
timeout
network error
```

### Signal

```text
pause
resume
cancel
approval
404 session
500
timeout
```

---

## 30. Test SSE

Wajib:

```text
connect
message
malformed JSON
error
reconnect
multiple reconnect
manual close
terminal event
cleanup
```

Target utama:

> Tidak ada EventSource atau reconnect timer yang tertinggal setelah run selesai.

---

## 31. Test Runtime Lifecycle

Buat test:

```text
start → completed
start → failed
start → cancel
start → pause → resume → completed
start → approval → approve → completed
start → approval → reject
start → failure → retry
retry → max attempts
duplicate runId
```

---

## 32. Test Telemetry

Pertahankan test yang sudah ada dan tambah:

```text
missing telemetry
malformed telemetry
unknown model
provider cost
estimated cost
cached tokens
duration
```

Pastikan persistence:

```text
Hermes event
 ↓
Mapper
 ↓
Store
 ↓
Repository
 ↓
reload
 ↓
telemetry tetap ada
```

---

## 33. Contract Test Mock vs Hermes

Interface:

```ts
AgentRuntime
```

harus dipenuhi oleh:

```text
MockRuntimeAdapter
HermesRuntimeAdapter
```

Buat contract test bersama untuk keduanya.

---

## 34. Logging

Gunakan structured logging:

```ts
{
  runId,
  sessionId,
  eventType,
  timestamp,
  component
}
```

Jangan log:

```text
API key
Authorization header
password
credential
secret
full sensitive prompt
```

---

# Urutan Implementasi yang Disarankan

Kerjakan satu per satu:

```text
1. Baseline test/build
2. Verifikasi API contract Hermes
3. HermesClient timeout + validation
4. SSE reconnect + cleanup
5. HermesRuntimeAdapter state machine
6. lifecycle cleanup
7. pause/resume/cancel/retry
8. approval flow
9. event validation
10. telemetry/cost correctness
11. RuntimeTelemetry deduplication
12. RuntimeFactory production behavior
13. security hardening
14. integration tests
15. production build
```

---

# File Prioritas

```text
src/runtime/hermes/HermesClient.ts
src/runtime/hermes/HermesRuntimeAdapter.ts
src/runtime/hermes/HermesMapper.ts
src/runtime/types.ts
src/runtime/telemetry/TelemetryMapper.ts
src/runtime/telemetry/CostCalculator.ts
src/runtime/telemetry/modelPricing.ts
src/runtime/RuntimeError.ts
src/stores/agentRun.ts
src/runtime/RuntimeFactory.ts
```

Tambahkan bila diperlukan:

```text
src/runtime/hermes/hermesContract.ts
src/runtime/hermes/hermesSchemas.ts
src/runtime/hermes/SseClient.ts
src/runtime/hermes/HermesRunState.ts
```

Test:

```text
src/test/HermesClient.spec.ts
src/test/HermesRuntimeAdapter.spec.ts
src/test/HermesMapper.spec.ts
src/test/hermesStream.spec.ts
src/test/runtimeContract.spec.ts
```

---

# Definition of Done

## Runtime
- [ ] Hermes health check
- [ ] run berhasil dibuat
- [ ] sessionId tervalidasi
- [ ] SSE tersambung
- [ ] event tervalidasi dan dipetakan
- [ ] terminal event diproses
- [ ] stream ditutup
- [ ] state dibersihkan

## Lifecycle
- [ ] start
- [ ] pause
- [ ] resume
- [ ] cancel
- [ ] retry
- [ ] approval
- [ ] completed
- [ ] failed

## Reliability
- [ ] timeout
- [ ] reconnect
- [ ] backoff
- [ ] duplicate event protection
- [ ] duplicate run protection

## Telemetry
- [ ] input/prompt tokens
- [ ] output/completion tokens
- [ ] total tokens
- [ ] cached tokens
- [ ] model
- [ ] provider
- [ ] duration
- [ ] estimated vs provider cost

## Security
- [ ] credential aman
- [ ] CORS aman
- [ ] SSE authentication aman
- [ ] tool permission server-side
- [ ] high-risk approval
- [ ] workspace validation
- [ ] secret tidak masuk log

## Testing
- [ ] unit test
- [ ] integration test
- [ ] lifecycle test
- [ ] SSE test
- [ ] telemetry test
- [ ] security test
- [ ] production build

---

# Prioritas P0 Jika Waktu Terbatas

1. **Verifikasi kontrak API Hermes sebenarnya.**
2. **Perbaiki timeout `HermesClient`.**
3. **Validasi `sessionId`.**
4. **Implementasikan SSE reconnect + cleanup.**
5. **Satukan state Hermes run.**
6. **Perbaiki lifecycle cancel/complete/fail.**
7. **Perbaiki retry semantics.**
8. **Validasi event Hermes.**
9. **Jangan expose production secret melalui `VITE_*`.**
10. **Bedakan estimated cost dengan actual/provider cost.**

---

# Arsitektur Target

```text
                    AI AGENTIC UI
                          |
                          v
                   RuntimeFactory
                          |
                    +-----+-----+
                    |           |
                   Mock       Hermes
                                |
                                v
                       HermesRuntimeAdapter
                                |
                         +------+------+
                         |             |
                         v             v
                    HermesClient   Telemetry
                         |             |
                  +------+-----+       v
                  |            |    Mapper
                health        run     |
                               |       v
                               v  RuntimeTelemetry
                             Hermes     |
                               |         v
                               v    agentRun Store
                              SSE         |
                               |          v
                               +-------> UI
```

## Kesimpulan

Fondasi source sudah mencakup runtime abstraction, Mock runtime, Hermes adapter/client, mapper, telemetry, cost calculator, store integration, dan tests.

Fokus perbaikan sekarang bukan menambah UI, tetapi **production hardening pada koneksi Hermes, lifecycle run, SSE reliability, authentication/security, event validation, dan telemetry correctness**.

Kerjakan bertahap:

```text
HermesClient
  ↓
SSE
  ↓
HermesRuntimeAdapter
  ↓
HermesMapper
  ↓
Telemetry
  ↓
Store
  ↓
Tests
```

Setiap tahap harus lulus test sebelum lanjut ke tahap berikutnya.
