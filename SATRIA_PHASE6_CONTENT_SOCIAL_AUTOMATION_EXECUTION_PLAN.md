# SATRIA AI WORKFORCE — PHASE 6
## CONTENT, DATA ANALYSIS & SOCIAL AUTOMATION
### Execution Blueprint

**Baseline:** UI(10) / Controlled Internal Release  
**Goal:** Menjadikan SATRIA mampu menerima pekerjaan data → analisis → membuat dokumen/konten → review → approval → publikasi.

---

# 1. TUJUAN PHASE 6

Jangan membuat bot terpisah untuk:

- review data;
- membuat laporan;
- membuat konten;
- membuat visual;
- publishing.

Semua harus menjadi bagian dari SATRIA Workforce.

Target:

```text
DATA
 ↓
ANALYSIS
 ↓
DOCUMENT / CONTENT
 ↓
REVIEW
 ↓
APPROVAL
 ↓
PUBLISH
 ↓
REPORT
```

---

# 2. JANGAN MENGUBAH CORE ENGINE

UI(10) yang sudah ada tetap menjadi fondasi.

Pertahankan:

```text
Project
Task
AgentRun
Worker
Schedule
Preflight
Workspace Lock
Retry
Recovery
Audit
Observability
Security
```

Phase 6 hanya menambahkan domain baru di atas core tersebut.

---

# 3. DOMAIN BARU

Tambahkan:

```text
Content
ContentWorkflow
ContentItem
MediaAsset
Publication
SocialConnection
Approval
DataReview
AnalysisDocument
```

Struktur:

```text
Project
│
├── Tasks
├── Schedules
├── Content
├── Data Reviews
├── Documents
└── Publications
```

---

# 4. CONTENT ITEM

ContentItem merupakan produk konten yang akan didistribusikan.

Contoh:

```text
Judul:
5 Kesalahan UMKM Saat Mengelola Stok

Caption:
...

Media:
image-001.png

Target:
Instagram
TikTok
Facebook

Status:
Review
```

Model:

```ts
interface ContentItem {
  id: string
  projectId: string

  title: string
  caption?: string

  mediaAssetIds: string[]

  targetPlatforms: PlatformTarget[]

  status:
    | 'Draft'
    | 'Review'
    | 'Approved'
    | 'Scheduled'
    | 'Publishing'
    | 'Published'
    | 'Failed'
    | 'Cancelled'

  approvalRequired: boolean

  scheduledAt?: string

  createdBy: string
  createdAt: string
  updatedAt: string
}
```

---

# 5. PLATFORM TARGET

Jangan menempelkan logic platform langsung ke ContentItem.

Gunakan:

```ts
type PlatformTarget =
  | 'instagram'
  | 'tiktok'
  | 'facebook_page'
  | 'facebook_group'
```

Setiap platform memiliki publication record sendiri.

---

# 6. PUBLICATION

Satu ContentItem dapat memiliki beberapa publication:

```text
ContentItem #101
│
├── Instagram Publication
├── TikTok Publication
└── Facebook Page Publication
```

Model:

```ts
interface Publication {
  id: string

  contentItemId: string
  platform: PlatformTarget

  connectionId?: string

  status:
    | 'Pending'
    | 'Approved'
    | 'Scheduled'
    | 'Publishing'
    | 'Published'
    | 'Failed'
    | 'Cancelled'
    | 'Assisted'

  scheduledAt?: string

  externalId?: string
  externalUrl?: string

  error?: string

  createdAt: string
  updatedAt: string
}
```

---

# 7. SOCIAL CONNECTION

Credential jangan dimasukkan ke Task atau ContentItem.

Gunakan:

```ts
interface SocialConnection {
  id: string

  platform:
    | 'instagram'
    | 'tiktok'
    | 'facebook_page'

  accountName: string
  accountId?: string

  status:
    | 'Connected'
    | 'Expired'
    | 'Revoked'
    | 'Error'

  credentialReference: string

  createdAt: string
  updatedAt: string
}
```

Token harus berada di secure credential store.

Jangan pernah disimpan di:

```text
Task
ContentItem
Run logs
Activity
Artifact
```

---

# 8. CONTENT WORKFLOW

Workflow utama:

```text
Research
 ↓
Analyze
 ↓
Generate
 ↓
Visual
 ↓
Quality Check
 ↓
Review
 ↓
Approval
 ↓
Schedule
 ↓
Publish
 ↓
Verify
```

Tidak semua proyek harus menggunakan semua step.

---

# 9. WORKFLOW TEMPLATE

Tambahkan:

```text
Content Workflow Template
```

Contoh:

```text
Daily Marketing Content

1. Research topic
2. Generate angle
3. Generate caption
4. Generate image
5. Quality check
6. Owner review
7. Publish
```

Template dapat digunakan oleh Schedule.

---

# 10. RECURRING CONTENT

Contoh:

```text
Schedule:
Daily Content

Every:
Day

Time:
08:00

Worker:
Maya

Project:
Marketing Automation
```

Saat due:

```text
Schedule
 ↓
Workflow Instance
 ↓
Research Task
 ↓
Generate Task
 ↓
Visual Task
 ↓
Review Task
 ↓
Publication Task
```

Jangan membuat satu Task besar untuk seluruh pipeline.

---

# 11. WORKFLOW INSTANCE

Gunakan:

```ts
interface WorkflowInstance {
  id: string

  workflowTemplateId: string
  projectId: string
  scheduleId?: string

  status:
    | 'Pending'
    | 'Running'
    | 'Waiting'
    | 'Review'
    | 'Completed'
    | 'Failed'
    | 'Cancelled'

  currentStepId?: string

  startedAt?: string
  completedAt?: string

  createdAt: string
}
```

---

# 12. DATA REVIEW MODULE

SATRIA harus dapat menerima:

```text
CSV
XLSX
JSON
Database query
API response
```

Workflow:

```text
Input Data
 ↓
Validation
 ↓
Profiling
 ↓
Analysis
 ↓
Findings
 ↓
Recommendation
 ↓
Report
```

---

# 13. DATA REVIEW OUTPUT

Output harus terstruktur:

```text
Summary
Key Metrics
Anomalies
Trends
Findings
Risks
Recommendations
Source References
```

Contoh:

```text
Revenue:
+12%

Orders:
-4%

Finding:
Revenue naik tetapi order turun.

Possible cause:
Average order value meningkat.

Recommendation:
Review pricing / product mix.
```

---

# 14. DATA REVIEW ARTIFACTS

Simpan:

```text
analysis.md
analysis.docx
analysis.pdf
summary.json
source-reference.json
```

Semua menjadi Artifact.

---

# 15. DOCUMENT GENERATION

Worker dapat membuat:

```text
DOCX
PDF
Markdown
XLSX
CSV
PPTX
```

Namun output harus melalui:

```text
Generate
 ↓
Validate
 ↓
Artifact
 ↓
Review
```

---

# 16. DOCUMENT VALIDATION

Minimal:

```text
File exists
File readable
Expected format
Expected sections
No empty output
No secrets
No malformed links
```

Untuk financial/business reports:

```text
Source references present
```

---

# 17. CONTENT GENERATION

Input:

```text
Brand
Audience
Topic
Goal
Platform
Tone
CTA
Restrictions
```

Output:

```text
Title
Hook
Caption
Body
CTA
Hashtags
Visual prompt
```

---

# 18. PLATFORM ADAPTATION

Jangan menggunakan satu caption untuk semua platform.

Buat:

```text
Content Master
```

kemudian:

```text
Instagram version
TikTok version
Facebook version
```

Contoh:

```text
Master:
"5 kesalahan..."

Instagram:
visual + caption + hashtags

TikTok:
short hook + spoken script + on-screen text

Facebook:
longer explanation + CTA
```

---

# 19. APPROVAL GATE

Default untuk production:

```text
Generate
 ↓
Quality Check
 ↓
Human Approval
 ↓
Publish
```

UI:

```text
CONTENT REVIEW

Preview
Caption
Media
Platforms

[ Reject ]
[ Request Changes ]
[ Approve ]
```

---

# 20. APPROVAL POLICY

Tambahkan:

```text
Auto
Review
Strict
```

### Auto

Konten trusted dapat publish otomatis.

### Review

Owner approval diperlukan.

### Strict

Setiap platform harus disetujui.

Default:

```text
Review
```

---

# 21. QUALITY CHECK

Sebelum approval:

```text
Brand compliance
Language quality
Duplicate detection
Sensitive content
Broken links
Missing media
Platform requirements
Security scan
```

Output:

```text
✓ Brand
✓ Grammar
✓ Media
✓ Security
✓ Platform
```

---

# 22. INSTAGRAM CONNECTOR

Gunakan official Meta API.

Flow:

```text
OAuth
 ↓
Secure Credential Store
 ↓
Instagram Professional Account
 ↓
Content Container
 ↓
Publish
 ↓
Verify
```

Jangan menggunakan browser automation untuk Instagram jika official API tersedia dan memenuhi kebutuhan.

---

# 23. TIKTOK CONNECTOR

Gunakan official TikTok Content Posting API.

Support minimal:

```text
Creator info
Upload
Draft
Direct Post (subject to API/app approval)
Publish status
```

Untuk awal:

```text
Generate
 ↓
Upload / Draft
 ↓
Human Approval
 ↓
Publish
```

Direct Post hanya diaktifkan setelah aplikasi memenuhi requirement platform.

---

# 24. FACEBOOK PAGE CONNECTOR

Untuk Facebook Page gunakan official Meta API.

Flow:

```text
OAuth
 ↓
Page connection
 ↓
Create post
 ↓
Publish
 ↓
Verify
```

---

# 25. FACEBOOK GROUP

Jangan menjadikan browser login automation sebagai core connector.

Gunakan:

```text
Assisted Publishing
```

Flow:

```text
SATRIA Generate
 ↓
Approve
 ↓
Copy/Export
 ↓
Owner opens group
 ↓
Owner publishes
```

---

# 26. PUBLICATION RUN

Publishing harus menjadi Run tersendiri.

```text
ContentItem
 ↓
Publication
 ↓
Publication Run
 ↓
Connector
 ↓
Platform
 ↓
Verify
```

Jangan menggunakan Run generation content untuk publication.

---

# 27. PUBLICATION FAILURE

Contoh:

```text
Instagram
→ Published

TikTok
→ Failed

Facebook
→ Pending
```

Jangan membuat seluruh ContentItem menjadi Failed.

Status publication berdiri sendiri.

---

# 28. RETRY PUBLICATION

Retry:

```text
Publication Run #1 Failed
        ↓
Publication Run #2
parentRunId = #1
```

Jangan membuat ContentItem duplikat.

---

# 29. IDEMPOTENCY

Publishing wajib menggunakan:

```text
publicationId
+
platform
+
contentVersion
```

sebagai idempotency context.

Target:

```text
Double click Publish
↓
Tidak membuat dua post
```

---

# 30. CONTENT VERSIONING

Setiap perubahan besar:

```text
Content v1
Content v2
Content v3
```

Approval berlaku terhadap version tertentu.

Contoh:

```text
v2 approved
```

Jika caption diubah:

```text
v3 Draft
```

Approval v2 tidak otomatis berlaku untuk v3.

---

# 31. CONTENT CALENDAR

Tambahkan Calendar mode:

```text
August 2026

Mon 17
Marketing post
09:00

Tue 18
Product post
12:00

Wed 19
Video
19:00
```

Filter:

```text
Platform
Project
Status
Worker
```

---

# 32. CONTENT DASHBOARD

Home tidak perlu menjadi penuh.

Buat:

```text
Marketing / Content
```

dengan:

```text
Draft
Review
Approved
Scheduled
Published
Failed
```

---

# 33. NEW SIDEBAR

Setelah Phase 6:

```text
Home
Work
Projects
Workers
Content
Reports
Settings
```

Content menjadi satu menu utama.

Submenu:

```text
Content
 ├── Calendar
 ├── Drafts
 ├── Review
 ├── Scheduled
 ├── Published
 └── Connections
```

---

# 34. CONTENT DETAIL PAGE

```text
CONTENT

5 Kesalahan UMKM...

STATUS
Review

MEDIA
[ Preview ]

INSTAGRAM
Caption
Hashtags

TIKTOK
Script
Caption

FACEBOOK
Caption

PUBLICATION
Instagram   Review
TikTok      Review
Facebook    Assisted

[ Approve ]
[ Reject ]
```

---

# 35. DATA ANALYSIS PAGE

```text
ANALYSIS

Sales August 2026

Source
sales.xlsx

Status
Completed

Summary
...

Findings
...

Recommendations
...

Artifacts
[DOCX]
[PDF]
[CSV]
```

---

# 36. WORKER SPECIALIZATION

Tetapkan skill profile:

```text
Worker A
Data Analyst

Worker B
Content Writer

Worker C
Designer

Worker D
Publishing / QA
```

Tidak harus hard-coded.

Gunakan:

```text
skills
```

dan capability matching.

---

# 37. TASK DISPATCH

Owner cukup:

```text
Create Task

"Review sales data and make report"

Worker:
Auto
```

SATRIA memilih worker berdasarkan:

```text
required skill
availability
project default
priority
current workload
```

Owner tetap dapat override:

```text
Worker: Raka
```

---

# 38. AUTOMATIC WORKFLOW EXAMPLE

User membuat:

```text
"Setiap hari buat konten marketing dan analisis penjualan."
```

SATRIA mengubahnya menjadi:

```text
Schedule
Daily 08:00
        ↓
Workflow
        ↓
Review Sales Data
        ↓
Generate Findings
        ↓
Generate Content Idea
        ↓
Generate Caption
        ↓
Generate Visual
        ↓
Quality Check
        ↓
Owner Review
        ↓
Publish
```

---

# 39. CONTENT PROJECT EXAMPLE

```text
Project:
Marketing Automation

Path:
/projects/marketing

Workers:
Maya
Deni

Schedules:
Daily Content
Weekly Analysis
Monthly Report
```

---

# 40. SECURITY RULES

Credential:

```text
Never in prompt
Never in log
Never in artifact
Never in frontend state
Never in ContentItem
```

Publishing connector menerima:

```text
connectionId
```

dan mengambil credential dari secure store.

---

# 41. AUDIT EVENTS

Tambahkan:

```text
ContentCreated
ContentEdited
ContentApproved
ContentRejected
ContentScheduled
PublicationStarted
PublicationCompleted
PublicationFailed
ConnectionCreated
ConnectionRevoked
```

---

# 42. REPORTING

Tambahkan:

```text
Content Report
Publication Report
Platform Performance
Automation Cost
```

Contoh:

```text
August

Generated:
31

Approved:
26

Published:
23

Failed:
3

Instagram:
12

TikTok:
7

Facebook:
4
```

---

# 43. QUALITY GATE PHASE 6

## Core

- [ ] ContentItem domain
- [ ] Publication domain
- [ ] Approval
- [ ] MediaAsset
- [ ] Content versioning

## Workflow

- [ ] Content workflow template
- [ ] Workflow instance
- [ ] Schedule integration
- [ ] Worker dispatch

## Data

- [ ] CSV/XLSX review
- [ ] Findings
- [ ] Document generation
- [ ] Artifact validation

## Social

- [ ] Instagram connector
- [ ] Facebook Page connector
- [ ] TikTok connector
- [ ] Facebook Group assisted workflow

## Security

- [ ] OAuth
- [ ] Credential isolation
- [ ] Sanitization
- [ ] Permission
- [ ] Audit

---

# 44. IMPLEMENTATION ORDER

Jangan implementasi semua connector sekaligus.

## Phase 6.1 — Content Core

```text
ContentItem
MediaAsset
ContentVersion
Approval
Publication
```

## Phase 6.2 — Data Analysis

```text
DataReview
AnalysisResult
DocumentArtifact
```

## Phase 6.3 — Content Workflow

```text
WorkflowTemplate
WorkflowInstance
Schedule
Worker dispatch
```

## Phase 6.4 — Instagram

```text
OAuth
Create media
Publish
Verify
Retry
```

## Phase 6.5 — Facebook Page

```text
OAuth
Publish
Verify
Retry
```

## Phase 6.6 — TikTok

```text
OAuth
Creator info
Upload
Draft
Direct Post if approved
```

## Phase 6.7 — Facebook Group

```text
Assisted publishing
```

## Phase 6.8 — E2E

```text
Data
→ Analysis
→ Document
→ Content
→ Approval
→ Publication
→ Verification
```

---

# 45. JANGAN MELAKUKAN INI

Jangan:

```text
❌ buat bot browser login Instagram
❌ simpan password sosial media
❌ simpan token di localStorage
❌ membuat ContentItem sekaligus Run sekaligus Publication dalam satu entity
❌ langsung publish AI-generated content tanpa approval default
❌ membuat satu generic publisher untuk semua platform
❌ mengandalkan hard-coded account ID
❌ menghapus publication history
```

---

# 46. DEFINITION OF DONE

Phase 6 selesai apabila owner dapat melakukan:

```text
✓ Upload data
✓ Minta SATRIA mereview
✓ Mendapat findings
✓ Generate DOCX/PDF
✓ Create content dari hasil analisis
✓ Generate image/video
✓ Preview
✓ Approve
✓ Schedule
✓ Publish ke platform yang tersedia
✓ Melihat publication status
✓ Retry publication
✓ Melihat history
✓ Melihat cost
```

Dan semua activity tercatat:

```text
Task
Run
Workflow
Content
Publication
Audit
```

---

# 47. REKOMENDASI OPERASIONAL

Untuk versi pertama yang digunakan nyata:

```text
AUTOMATIC
Data review
Document generation
Content generation
Quality checks

REVIEW REQUIRED
New content
New campaign
Public-facing content

AUTOMATIC PUBLISH
Hanya setelah connector + approval policy terbukti aman

ASSISTED
Facebook Groups
Platform tanpa official publishing support
```

---

# 48. NEXT ACTION

Mulai sekarang:

```text
1. Bekukan UI(10)
2. Buat branch:
   phase-6-content-social
3. Implement Content Core
4. Implement Approval
5. Implement Data Review
6. Implement Document Generation
7. Implement Content Workflow
8. Integrasikan Instagram
9. Integrasikan Facebook Page
10. Integrasikan TikTok setelah requirement terpenuhi
11. Facebook Group tetap Assisted
12. Jalankan E2E
```

Jangan mengubah core `Task / AgentRun / Hermes` kecuali integrasi membutuhkan extension yang benar-benar diperlukan.

---

# 49. TARGET AKHIR

```text
                         SATRIA
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
       DATA               CONTENT             WORK
        │                   │                   │
     Review               Generate            Execute
        │                   │                   │
     Analysis             Approve              Hermes
        │                   │                   │
    Documents          Publication              │
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                         REPORTS
```

SATRIA berubah dari:

```text
Task Manager + AI Runtime
```

menjadi:

```text
AI WORKFORCE ORCHESTRATOR
```

dengan kemampuan:

```text
ANALYZE
CREATE
REVIEW
APPROVE
PUBLISH
MONITOR
REPORT
```

---

## END OF PHASE 6 SPECIFICATION
