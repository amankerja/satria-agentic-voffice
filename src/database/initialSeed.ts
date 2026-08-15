import type {
  Workspace,
  Project,
  Task,
  WorkspaceFile,
  ActivityLog,
  NotificationItem,
  UserProfile,
  UserSettings,
  Department,
  EmployeeRole,
  Skill,
  WorkforceTool,
  Employee,
  TaskAssignment,
  AgentRun,
  RunResult,
  TaskReview,
  AgentMemoryItem,
  Schedule
} from '../types'

export const initialUserSettings: UserSettings = {
  theme: 'dark',
  compactMode: false,
  startPage: '/',
  sidebarCollapsed: false,
  defaultTaskView: 'list',
  emailNotifications: true,
  inAppNotifications: true,
  soundEnabled: false,
  autoSaveInterval: 30,
  timezone: 'Asia/Jakarta (GMT+7)',
  language: 'English (US)'
}

export const initialUser: UserProfile = {
  id: 'usr-001',
  displayName: 'Satria Utama',
  email: 'satria@workforce.ai',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  timezone: 'Asia/Jakarta (GMT+7)',
  language: 'English (US)',
  compactMode: false,
  theme: 'dark',
  settings: initialUserSettings
}

export const initialWorkspaces: Workspace[] = [
  {
    id: 'ws-personal',
    name: 'Personal Workspace',
    type: 'Personal',
    description: 'Ruang kerja pribadi untuk eksplorasi ide, riset, dan side-project mandiri.',
    projectCount: 1,
    taskCount: 3,
    fileCount: 2,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'ws-dev',
    name: 'Development Workspace',
    type: 'Development',
    description: 'Pusat pengembangan perangkat lunak, microservices, API contract, dan infrastruktur cloud.',
    projectCount: 2,
    taskCount: 5,
    fileCount: 4,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-08-14T11:20:00Z'
  },
  {
    id: 'ws-business',
    name: 'Business & Ops Workspace',
    type: 'Business',
    description: 'Operasional bisnis, analisis pasar, kampanye pemasaran, dan customer support.',
    projectCount: 1,
    taskCount: 4,
    fileCount: 2,
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-08-14T09:15:00Z'
  }
]

export const initialDepartments: Department[] = [
  {
    id: 'dept-coding',
    name: 'Coding',
    code: 'CODING',
    description: 'Pusat perancangan sistem, pengembangan frontend, backend REST API, quality control, dan security review.',
    icon: 'Code',
    status: 'active',
    employeeCount: 5,
    roleCount: 5,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'dept-trainer',
    name: 'Trainer',
    code: 'TRAINER',
    description: 'Pengelolaan administrasi pelatihan, riset keselamatan kerja/K3 tambang, serta pembuatan materi PDF/PPT.',
    icon: 'GraduationCap',
    status: 'active',
    employeeCount: 3,
    roleCount: 3,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'dept-side-hustle',
    name: 'Side Hustle',
    code: 'SIDE_HUSTLE',
    description: 'Operasional bisnis digital, riset produk laris, copywriting & strategi marketing, produksi konten, dan customer service.',
    icon: 'Briefcase',
    status: 'active',
    employeeCount: 4,
    roleCount: 4,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  }
]

export const initialEmployeeRoles: EmployeeRole[] = [
  // Coding Roles
  {
    id: 'role-planner',
    departmentId: 'dept-coding',
    name: 'Asisten Manager / Planner',
    description: 'Menerima dan memecah project requirement menjadi sub-tasks, mengoordinasikan specialist, dan memantau handoff ke QA/Security.',
    responsibilities: [
      'Menerima project request & memahami target deliverable',
      'Dekomposisi pekerjaan menjadi task atomic yang testable',
      'Penentuan prioritas pengerjaan & alokasi ke specialist',
      'Koordinasi alur handoff Frontend/Backend ke QC',
      'Monitoring progress sprint & handoff ke stakeholder'
    ],
    status: 'active'
  },
  {
    id: 'role-uiux',
    departmentId: 'dept-coding',
    name: 'UI/UX Frontend',
    description: 'Membangun antarmuka pengguna web responsif, komponen desain semantik, aksesibilitas WCAG, dan integrasi visual data.',
    responsibilities: [
      'Implementasi layout & komponen antarmuka Vue 3 + Tailwind v4',
      'Menjaga konsistensi token desain semantik & accessibility',
      'Integrasi data contracts ke visual presentation layer',
      'Optimasi performa rendering & responsive mobile view',
      'Handoff hasil implementasi frontend ke Quality Control'
    ],
    status: 'active'
  },
  {
    id: 'role-backend',
    departmentId: 'dept-coding',
    name: 'Backend API',
    description: 'Merancang API service, skema database, business logic, integrasi sistem, dan optimasi performa backend.',
    responsibilities: [
      'Membangun endpoint REST API & validasi request payload',
      'Desain skema database relasional & migrasi data',
      'Implementasi mekanisme autentikasi & middleware keamanan',
      'Optimasi query database & penanganan caching',
      'Penyusunan dokumentasi teknis API endpoint'
    ],
    status: 'active'
  },
  {
    id: 'role-qc',
    departmentId: 'dept-coding',
    name: 'Quality Control',
    description: 'Melakukan pengujian fungsionalitas, regression testing, validasi acceptance criteria, dan pelaporan defect.',
    responsibilities: [
      'Penyusunan test plan & skenario uji komprehensif',
      'Eksekusi pengujian fungsionalitas, integrasi & UI',
      'Identifikasi bug, issue regresi & anomali alur kerja',
      'Verifikasi pemenuhan acceptance criteria sebelum rilis',
      'Penyusunan laporan QA Approval & rekomendasi fix'
    ],
    status: 'active'
  },
  {
    id: 'role-security',
    departmentId: 'dept-coding',
    name: 'Security Control',
    description: 'Melakukan audit keamanan kode sumber, verifikasi izin akses, validasi input sanitization, dan evaluasi risiko sistem.',
    responsibilities: [
      'Review keamanan arsitektur kode sumber & endpoint API',
      'Evaluasi mekanisme kontrol akses, otentikasi & permission',
      'Pemeriksaan kepatuhan standar keamanan OWASP Top 10',
      'Audit penanganan data sensitif, API secret & credential',
      'Penyusunan Security Review findings & risk remediation plan'
    ],
    status: 'active'
  },

  // Trainer Roles
  {
    id: 'role-admin-trainer',
    departmentId: 'dept-trainer',
    name: 'Admin Trainer',
    description: 'Mengelola administrasi pelatihan, penyebaran undangan, pengelolaan jadwal, dan distribusi materi serta sertifikat.',
    responsibilities: [
      'Distribusi undangan pelatihan & pencatatan konfirmasi peserta',
      'Pengelolaan kalender jadwal pelatihan & reminder sesi',
      'Pengiriman modul pelatihan & materi bahan ajar ke peserta',
      'Penerbitan serta distribusi sertifikat kelulusan training',
      'Rekapitulasi arsip data administrasi pelatihan'
    ],
    status: 'active'
  },
  {
    id: 'role-researcher',
    departmentId: 'dept-trainer',
    name: 'Researcher Materi',
    description: 'Melakukan riset regulasi terbaru, penelusuran studi kasus keselamatan kerja (K3), dan kurasi data referensi training.',
    responsibilities: [
      'Riset regulasi K3 & standar keselamatan industri pertambangan',
      'Penelusuran studi kasus insiden & berita keselamatan kerja',
      'Evaluasi validitas serta kredibilitas sumber referensi',
      'Sintesis informasi menjadi ringkasan poin utama bahan ajar',
      'Handoff outline riset terstruktur ke Pembuat Materi'
    ],
    status: 'active'
  },
  {
    id: 'role-creator',
    departmentId: 'dept-trainer',
    name: 'Pembuat Materi',
    description: 'Mengolah data hasil riset menjadi modul dokumen pelatihan format PDF dan slide presentasi format PPT yang komunikatif.',
    responsibilities: [
      'Penyusunan modul pelatihan komprehensif dalam format PDF',
      'Desain slide presentasi visual berstandar tinggi dalam PPT',
      'Transformasi konsep teknis rumit menjadi infografis sederhana',
      'Penyusunan lembar evaluasi & kuis pemahaman materi',
      'Handoff berkas materi siap pakai ke Admin Trainer'
    ],
    status: 'active'
  },

  // Side Hustle Roles
  {
    id: 'role-cs',
    departmentId: 'dept-side-hustle',
    name: 'Customer Service',
    description: 'Menangani komunikasi calon pembeli, follow-up prospek penjualan, serta penanganan keluhan dan bantuan produk.',
    responsibilities: [
      'Merespons pertanyaan calon pelanggan seputar produk secara cepat',
      'Melakukan follow-up prospek hangat untuk meningkatkan closing rate',
      'Menangani pertanyaan kendala produk & eskalasi isu ke tim terkait',
      'Mencatat feedback pelanggan untuk bahan evaluasi tim produk',
      'Memelihara riwayat hubungan baik dengan database pelanggan'
    ],
    status: 'active'
  },
  {
    id: 'role-marketing',
    departmentId: 'dept-side-hustle',
    name: 'Marketing Specialist',
    description: 'Merumuskan strategi promosi, menyusun penawaran penjualan (copywriting), dan merencanakan distribusi kampanye.',
    responsibilities: [
      'Penyusunan strategi kampanye pemasaran produk & target audiens',
      'Penulisan naskah promosi (sales copy) berorientasi konversi',
      'Perencanaan jadwal distribusi konten ke berbagai saluran promosi',
      'Penerapan prinsip psikologi pemasaran untuk meningkatkan daya tarik',
      'Evaluasi efektivitas kampanye promosi dan ROI'
    ],
    status: 'active'
  },
  {
    id: 'role-rnd',
    departmentId: 'dept-side-hustle',
    name: 'R&D Product Research',
    description: 'Menganalisis tren pasar e-commerce, mengidentifikasi produk berdaya jual tinggi, dan memetakan peluang produk baru.',
    responsibilities: [
      'Riset tren kata kunci & produk berdaya beli tinggi di marketplace',
      'Analisis kompetitor, strategi harga, dan diferensiasi produk',
      'Identifikasi pain points konsumen yang belum terlayani di pasar',
      'Rekomendasi kandidat produk unggulan untuk dipasarkan',
      'Handoff insight peluang produk ke tim Marketing & Konten'
    ],
    status: 'active'
  },
  {
    id: 'role-content',
    departmentId: 'dept-side-hustle',
    name: 'Pembuat Konten',
    description: 'Memproduksi aset visual foto, video pendek (TikTok/Reels/Shorts), dan copywriting pendukung media sosial.',
    responsibilities: [
      'Produksi materi visual promosi produk (grafis, foto produk)',
      'Pembuatan video pendek menarik untuk TikTok, Instagram & YouTube',
      'Penulisan caption interaktif dengan Call-to-Action (CTA) jelas',
      'Penyesuaian format konten sesuai algoritma masing-masing platform',
      'Eksplorasi gaya visual modern untuk meningkatkan engagement'
    ],
    status: 'active'
  }
]

export const initialSkills: Skill[] = [
  // --- INTERNAL CORE SKILLS ---
  {
    id: 'skill-planning',
    name: 'Task Planning & Breakdown',
    slug: 'task-planning',
    category: 'Planning',
    description: 'Kemampuan mendekomposisi kebutuhan proyek menjadi paket unit tugas terstruktur dengan acceptance criteria.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle'],
    compatibleRoles: ['role-planner', 'role-admin-trainer', 'role-marketing'],
    tags: ['Core', 'Management', 'Coordination'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-frontend-dev',
    name: 'Frontend Development (Vue 3 / TS)',
    slug: 'frontend-dev',
    category: 'Engineering',
    description: 'Implementasi komponen antarmuka modern dengan Vue 3 Composition API, TypeScript strict mode, dan Tailwind CSS.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding'],
    compatibleRoles: ['role-uiux'],
    tags: ['Vue3', 'TypeScript', 'Tailwind', 'PWA'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-backend-dev',
    name: 'REST API & Database Engineering',
    slug: 'backend-api-db',
    category: 'Engineering',
    description: 'Pembangunan RESTful API, validasi payload schema, migrasi database relasional, dan integrasi business logic.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding'],
    compatibleRoles: ['role-backend'],
    tags: ['API', 'Database', 'Backend', 'SQL'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-testing-qa',
    name: 'Quality Assurance & Regression Testing',
    slug: 'qa-testing',
    category: 'Quality',
    description: 'Perencanaan skenario uji, pengujian fungsionalitas antarmuka, verifikasi integrasi data, dan bug analysis.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding'],
    compatibleRoles: ['role-qc', 'role-planner'],
    tags: ['Testing', 'QA', 'Validation', 'Regression'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-sec-review',
    name: 'Application Security Audit',
    slug: 'app-sec-audit',
    category: 'Security',
    description: 'Audit kerentanan kode, validasi mekanisme otentikasi, kepatuhan OWASP, dan penanganan secret configuration.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding'],
    compatibleRoles: ['role-security'],
    tags: ['Security', 'OWASP', 'Auth', 'Audit'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-safety-research',
    name: 'Mining & Industrial Safety Research (K3)',
    slug: 'safety-k3-research',
    category: 'Research',
    description: 'Penelusuran regulasi K3 nasional, standar keselamatan kerja pertambangan, dan sintesis studi kasus kecelakaan kerja.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-trainer'],
    compatibleRoles: ['role-researcher'],
    tags: ['K3', 'Safety', 'Mining', 'Regulations'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-doc-ppt',
    name: 'Module PDF & Slide PPT Authoring',
    slug: 'module-ppt-authoring',
    category: 'Authoring',
    description: 'Penyusunan modul materi bahan ajar berformat dokumen PDF dan pembuatan slide presentasi presentable format PowerPoint.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-trainer'],
    compatibleRoles: ['role-creator'],
    tags: ['PDF', 'PowerPoint', 'Documentation', 'Training'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-training-admin',
    name: 'Training Admin & Roster Management',
    slug: 'training-admin-roster',
    category: 'Operations',
    description: 'Distribusi undangan pelatihan, penjadwalan kalender kelas, absensi peserta, serta penerbitan sertifikat pelatihan.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-trainer'],
    compatibleRoles: ['role-admin-trainer'],
    tags: ['Operations', 'Calendar', 'Certificates', 'Admin'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-cs-support',
    name: 'Customer Support & Sales Follow-Up',
    slug: 'cs-sales-followup',
    category: 'Operations',
    description: 'Layanan konsultasi pelanggan, respons pesan prospek cepat, penanganan keluhan, dan follow-up closing penjualan.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-cs'],
    tags: ['CustomerService', 'Sales', 'CRM', 'Support'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-copywriting',
    name: 'Conversion Copywriting',
    slug: 'conversion-copywriting',
    category: 'Marketing',
    description: 'Penulisan naskah iklan persuasif, landing page headline, email marketing, dan penawaran penjualan berbasis psikologi audiens.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-content', 'role-cs'],
    tags: ['Copywriting', 'Marketing', 'Sales', 'Conversion'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-market-analysis',
    name: 'Market & Product Demand Analysis',
    slug: 'market-demand-analysis',
    category: 'Research',
    description: 'Riset kata kunci e-commerce, identifikasi produk laris dengan margin tinggi, analisis review konsumen, dan evaluasi kompetitor.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-rnd'],
    tags: ['MarketResearch', 'Ecommerce', 'Trends', 'Analytics'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-social-content',
    name: 'Social Media Content Strategy',
    slug: 'social-media-content',
    category: 'Marketing',
    description: 'Penyusunan jadwal konten media sosial, konsep visual feed Instagram, dan scripting video pendek TikTok/Reels berdaya tarik viral.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-content', 'role-marketing'],
    tags: ['SocialMedia', 'Content', 'TikTok', 'Instagram'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // --- EXTERNAL PACKAGES (SUPERPOWERS & INTELLIGENCE) ---
  {
    id: 'skill-writing-plans',
    name: 'Writing Implementation Plans',
    slug: 'writing-plans',
    category: 'Planning',
    description: 'Menulis rencana implementasi teknis multi-step yang terstruktur dan teruji sebelum eksekusi kode.',
    sourceType: 'external',
    sourceRepository: 'obra/superpowers',
    installCommand: 'npx skills add obra/superpowers',
    version: '2.1.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-trainer'],
    compatibleRoles: ['role-planner', 'role-creator'],
    tags: ['Architecture', 'Planning', 'Superpowers'],
    createdAt: '2026-08-02T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-ui-ux-pro-max',
    name: 'UI/UX Pro Max Intelligence',
    slug: 'ui-ux-pro-max',
    category: 'Design',
    description: 'Kecerdasan desain UI/UX dengan 79 gaya antarmuka, 192 palet warna industri, dan 119 pedoman UX.',
    sourceType: 'external',
    sourceRepository: 'next-level/ui-ux',
    installCommand: 'npx skills add next-level/ui-ux',
    version: '3.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-side-hustle'],
    compatibleRoles: ['role-uiux', 'role-content'],
    tags: ['UI', 'UX', 'DesignSystem', 'ProMax'],
    createdAt: '2026-08-02T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-high-end-visual-design',
    name: 'High-End Visual Design',
    slug: 'high-end-visual-design',
    category: 'Design',
    description: 'Pembuatan visual antarmuka premium, tipografi modern, micro-interactions, dan layout non-templated.',
    sourceType: 'external',
    sourceRepository: 'design-collective/visual-craft',
    installCommand: 'npx skills add design-collective/visual-craft',
    version: '1.4.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-side-hustle'],
    compatibleRoles: ['role-uiux', 'role-content'],
    tags: ['Aesthetics', 'Visual', 'Typography'],
    createdAt: '2026-08-02T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-marketing-psychology',
    name: 'Marketing Psychology Principles',
    slug: 'marketing-psychology',
    category: 'Marketing',
    description: 'Penerapan prinsip psikologi konsumen (urgency, social proof, anchoring) untuk memaksimalkan konversi penjualan.',
    sourceType: 'external',
    sourceRepository: 'growth-lab/psychology',
    installCommand: 'npx skills add growth-lab/psychology',
    version: '1.2.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-cs'],
    tags: ['Psychology', 'Conversion', 'Sales'],
    createdAt: '2026-08-03T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-seo-audit',
    name: 'SEO Performance Audit',
    slug: 'seo-audit',
    category: 'Marketing',
    description: 'Audit teknis SEO, struktur heading semantik, optimasi meta tags, dan kecepatan perayapan mesin pencari.',
    sourceType: 'external',
    sourceRepository: 'growth-lab/seo',
    installCommand: 'npx skills add growth-lab/seo',
    version: '1.1.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle', 'dept-coding'],
    compatibleRoles: ['role-marketing', 'role-uiux'],
    tags: ['SEO', 'Search', 'Analytics'],
    createdAt: '2026-08-03T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-ad-creative',
    name: 'Performance Ad Creative',
    slug: 'ad-creative',
    category: 'Marketing',
    description: 'Penyusunan konsep iklan performa tinggi untuk Meta Ads, TikTok Ads, dan Google Ads dengan variasi sudut hook.',
    sourceType: 'external',
    sourceRepository: 'growth-lab/ads',
    installCommand: 'npx skills add growth-lab/ads',
    version: '1.0.5',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-content'],
    tags: ['Ads', 'Creative', 'PaidMedia'],
    createdAt: '2026-08-04T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-brainstorming',
    name: 'Brainstorming & Ideation',
    slug: 'brainstorming',
    category: 'Planning',
    description: 'Eksplorasi konsep kreatif, pemetaan ide divergen, dan sintesis solusi inovatif terstruktur.',
    sourceType: 'external',
    sourceRepository: 'obra/superpowers',
    installCommand: 'npx skills add obra/superpowers',
    version: '1.5.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle'],
    compatibleRoles: ['role-planner', 'role-rnd', 'role-creator'],
    tags: ['Ideation', 'Creativity', 'Superpowers'],
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-find-skills',
    name: 'Find Skills (Skill Discovery)',
    slug: 'find-skills',
    category: 'Operations',
    description: 'Pencarian dan penemuan paket skill baru dari repositori terbuka yang sesuai dengan kebutuhan tugas digital employee.',
    sourceType: 'external',
    sourceRepository: 'obra/superpowers',
    installCommand: 'npx skills add obra/superpowers',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle'],
    compatibleRoles: ['role-planner', 'role-rnd', 'role-admin-trainer'],
    tags: ['Discovery', 'Registry', 'Superpowers'],
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-content-strategy',
    name: 'Inbound Content Strategy',
    slug: 'content-strategy',
    category: 'Marketing',
    description: 'Perumusan strategi konten jangka panjang untuk membangun otoritas brand dan menarik traffic organik berkualitas.',
    sourceType: 'external',
    sourceRepository: 'growth-lab/content',
    installCommand: 'npx skills add growth-lab/content',
    version: '1.3.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle', 'dept-trainer'],
    compatibleRoles: ['role-marketing', 'role-researcher', 'role-content'],
    tags: ['ContentStrategy', 'Inbound', 'Brand'],
    createdAt: '2026-08-06T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  }
]

export const initialWorkforceTools: WorkforceTool[] = [
  {
    id: 'tool-git',
    name: 'Git Version Control',
    category: 'Development',
    description: 'Kontrol versi kode sumber, pengelolaan commit, merge branch, dan sinkronisasi repositori Git.',
    permissionLevel: 'admin',
    status: 'available',
    compatibleDepartments: ['dept-coding']
  },
  {
    id: 'tool-terminal',
    name: 'Terminal Execution Engine',
    category: 'Development',
    description: 'Eksekusi perintah shell lokal aman untuk instalasi dependensi npm, build aset, dan validasi linter.',
    permissionLevel: 'admin',
    status: 'available',
    compatibleDepartments: ['dept-coding']
  },
  {
    id: 'tool-browser',
    name: 'Browser Automation Engine',
    category: 'Automation',
    description: 'Otomasi web browser untuk crawling riset, pengujian fungsionalitas UI, dan pengumpulan referensi data online.',
    permissionLevel: 'read',
    status: 'available',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle']
  },
  {
    id: 'tool-fs',
    name: 'File System & Asset Manager',
    category: 'Storage',
    description: 'Akses baca dan tulis berkas aman di direktori workspace untuk menyimpan kode sumber, dokumen, dan aset.',
    permissionLevel: 'write',
    status: 'available',
    compatibleDepartments: ['dept-coding', 'dept-trainer']
  },
  {
    id: 'tool-code-sandbox',
    name: 'Code Sandbox & Linter',
    category: 'Development',
    description: 'Lingkungan isolasi eksekusi kode untuk validasi sintaks TypeScript, type-checking, dan lint audit mandiri.',
    permissionLevel: 'admin',
    status: 'available',
    compatibleDepartments: ['dept-coding']
  },
  {
    id: 'tool-http',
    name: 'REST API & Webhook Client',
    category: 'Integration',
    description: 'Klien HTTP untuk pengujian endpoint API, verifikasi webhook event, dan integrasi payload eksternal.',
    permissionLevel: 'write',
    status: 'available',
    compatibleDepartments: ['dept-coding']
  },
  {
    id: 'tool-pdf-gen',
    name: 'PDF Document Authoring Engine',
    category: 'Authoring',
    description: 'Generator format dokumen PDF dari markdown / HTML dengan dukungan penomoran halaman, tabel, dan header resmi.',
    permissionLevel: 'write',
    status: 'available',
    compatibleDepartments: ['dept-trainer']
  },
  {
    id: 'tool-ppt-gen',
    name: 'PowerPoint Presentation Builder',
    category: 'Authoring',
    description: 'Penyusun slide presentasi PPT otomatis berbasis layout visual profesional dengan template korporat.',
    permissionLevel: 'write',
    status: 'available',
    compatibleDepartments: ['dept-trainer']
  },
  {
    id: 'tool-calendar',
    name: 'Schedule & Calendar Dispatcher',
    category: 'Operations',
    description: 'Pengelola jadwal sesi pelatihan, reminder tenggat waktu task, dan sinkronisasi kalender kelas.',
    permissionLevel: 'write',
    status: 'available',
    compatibleDepartments: ['dept-trainer', 'dept-side-hustle']
  },
  {
    id: 'tool-market-trends',
    name: 'Marketplace Trends Scraper',
    category: 'Research',
    description: 'Pengecekan volume pencarian, rentang harga pasar, dan rating produk di marketplace e-commerce terkemuka.',
    permissionLevel: 'read',
    status: 'available',
    compatibleDepartments: ['dept-side-hustle']
  },
  {
    id: 'tool-social-publisher',
    name: 'Social Media Publisher',
    category: 'Marketing',
    description: 'Penjadwal dan penerbit draft postingan ke Instagram, TikTok, dan Facebook dengan media preview.',
    permissionLevel: 'write',
    status: 'available',
    compatibleDepartments: ['dept-side-hustle']
  },
  {
    id: 'tool-video-creator',
    name: 'Short Video Synthesizer',
    category: 'Media',
    description: 'Penyusun storyboard video pendek promosi dan penggabungan klip gambar dengan audio pendukung.',
    permissionLevel: 'write',
    status: 'available',
    compatibleDepartments: ['dept-side-hustle']
  }
]

export const initialEmployees: Employee[] = [
  // --- CODING EMPLOYEES (5) ---
  {
    id: 'emp-raka',
    name: 'Raka',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-planner',
    roleName: 'Asisten Manager / Planner',
    description: 'Koordinator alur kerja teknis departemen coding. Memecah requirement proyek, menetapkan prioritas, dan memantau handoff antar specialist.',
    status: 'Active',
    isPrimary: true,
    workerType: 'digital_worker',
    supervisorId: undefined,
    supervisorName: 'Technical Lead',
    skills: [
      { skillId: 'skill-planning', skillName: 'Task Planning & Breakdown', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-writing-plans', skillName: 'Writing Implementation Plans', priority: 'P1', assignedAt: '2026-08-02' },
      { skillId: 'skill-testing-qa', skillName: 'Quality Assurance & Regression Testing', priority: 'P2', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-git', 'tool-terminal', 'tool-fs', 'tool-calendar'],
    permissions: ['task:decompose', 'assignee:allocate'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-maya',
    name: 'Maya',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-uiux',
    roleName: 'UI/UX Frontend',
    description: 'Spesialis antarmuka pengguna web. Berpengalaman membangun layout responsif, komponen desain semantik, dan integrasi Tailwind CSS v4.',
    status: 'Active',
    isPrimary: true,
    workerType: 'digital_worker',
    supervisorId: 'emp-raka',
    supervisorName: 'Raka (Planner)',
    skills: [
      { skillId: 'skill-frontend-dev', skillName: 'Frontend Development (Vue 3 / TS)', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-ui-ux-pro-max', skillName: 'UI/UX Pro Max Intelligence', priority: 'P0', assignedAt: '2026-08-02' },
      { skillId: 'skill-high-end-visual-design', skillName: 'High-End Visual Design', priority: 'P1', assignedAt: '2026-08-02' },
      { skillId: 'skill-planning', skillName: 'Task Planning & Breakdown', priority: 'P2', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-browser', 'tool-fs', 'tool-code-sandbox', 'tool-git'],
    permissions: ['ui:read', 'ui:write', 'component:create'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-bima',
    name: 'Bima',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-backend',
    roleName: 'Backend API',
    description: 'Spesialis rekayasa backend API dan arsitektur database. Berpengalaman mendesain RESTful service, caching layer, dan migrasi skema database.',
    status: 'Active',
    isPrimary: true,
    workerType: 'digital_worker',
    supervisorId: 'emp-raka',
    supervisorName: 'Raka (Planner)',
    skills: [
      { skillId: 'skill-backend-dev', skillName: 'REST API & Database Engineering', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-sec-review', skillName: 'Application Security Audit', priority: 'P2', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-http', 'tool-fs', 'tool-code-sandbox', 'tool-terminal'],
    permissions: ['api:create', 'db:migrate'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-dimas',
    name: 'Dimas',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-qc',
    roleName: 'Quality Control',
    description: 'Spesialis penjaminan mutu perangkat lunak. Ahli dalam validasi acceptance criteria, penyusunan test plan, dan pengujian regresi.',
    status: 'Active',
    isPrimary: true,
    workerType: 'digital_worker',
    supervisorId: 'emp-raka',
    supervisorName: 'Raka (Planner)',
    skills: [
      { skillId: 'skill-testing-qa', skillName: 'Quality Assurance & Regression Testing', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-planning', skillName: 'Task Planning & Breakdown', priority: 'P2', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-browser', 'tool-code-sandbox', 'tool-git'],
    permissions: ['test:run', 'report:create'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-ardi',
    name: 'Ardi',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-security',
    roleName: 'Security Control',
    description: 'Auditor keamanan aplikasi dan kepatuhan kode sumber. Menginspeksi celah keamanan OWASP, validasi izin akses, dan konfigurasi rahasia sistem.',
    status: 'Active',
    workerType: 'digital_worker',
    supervisorId: 'emp-raka',
    supervisorName: 'Raka (Planner)',
    skills: [
      { skillId: 'skill-sec-review', skillName: 'Application Security Audit', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-backend-dev', skillName: 'REST API & Database Engineering', priority: 'P2', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-code-sandbox', 'tool-fs', 'tool-terminal'],
    permissions: ['sec:audit', 'report:create'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // --- TRAINER EMPLOYEES (3) ---
  {
    id: 'emp-dani',
    name: 'Dani',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-trainer',
    departmentName: 'Trainer',
    roleId: 'role-admin-trainer',
    roleName: 'Admin Trainer',
    description: 'Pengelola operasional administrasi training, koordinasi kehadiran peserta, penjadwalan kelas, dan pengarsipan sertifikat.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Training Lead',
    skills: [
      { skillId: 'skill-training-admin', skillName: 'Training Admin & Roster Management', priority: 'P0', assignedAt: '2026-08-01' }
    ],
    toolIds: ['tool-calendar', 'tool-fs'],
    permissions: ['calendar:manage', 'cert:issue'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-rina',
    name: 'Rina',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-trainer',
    departmentName: 'Trainer',
    roleId: 'role-researcher',
    roleName: 'Researcher Materi',
    description: 'Riset regulasi keselamatan kerja dan standar industri pertambangan (K3). Mengumpulkan studi kasus insiden dan menyusun outline materi terverifikasi.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Training Lead',
    skills: [
      { skillId: 'skill-safety-research', skillName: 'Mining & Industrial Safety Research (K3)', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-planning', skillName: 'Task Planning & Breakdown', priority: 'P2', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-browser', 'tool-fs'],
    permissions: ['research:curate', 'doc:create'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-sari',
    name: 'Sari',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-trainer',
    departmentName: 'Trainer',
    roleId: 'role-creator',
    roleName: 'Pembuat Materi',
    description: 'Spesialis perancangan modul ajar PDF dan slide presentasi PPT. Mengubah data riset menjadi media presentasi visual interaktif.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Training Lead',
    skills: [
      { skillId: 'skill-doc-ppt', skillName: 'Module PDF & Slide PPT Authoring', priority: 'P0', assignedAt: '2026-08-01' }
    ],
    toolIds: ['tool-pdf-gen', 'tool-ppt-gen', 'tool-fs'],
    permissions: ['doc:generate', 'presentation:create'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // --- SIDE HUSTLE EMPLOYEES (4) ---
  {
    id: 'emp-faisal',
    name: 'Faisal',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-side-hustle',
    departmentName: 'Side Hustle',
    roleId: 'role-cs',
    roleName: 'Customer Service',
    description: 'Representatif layanan pelanggan. Menangani konsultasi pembeli, follow-up leads penjualan, dan menjaga kepuasan konsumen.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Business Lead',
    skills: [
      { skillId: 'skill-cs-support', skillName: 'Customer Support & Sales Follow-Up', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-copywriting', skillName: 'Conversion Copywriting', priority: 'P1', assignedAt: '2026-08-07' }
    ],
    toolIds: ['tool-browser', 'tool-calendar'],
    permissions: ['customer:contact', 'sales:record'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-citra',
    name: 'Citra',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-side-hustle',
    departmentName: 'Side Hustle',
    roleId: 'role-marketing',
    roleName: 'Marketing Specialist',
    description: 'Strategist pemasaran digital. Menyusun positioning produk, naskah copywriting promosi, dan jadwal kampanye pemasaran.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Business Lead',
    skills: [
      { skillId: 'skill-copywriting', skillName: 'Conversion Copywriting', priority: 'P0', assignedAt: '2026-08-07' },
      { skillId: 'skill-marketing-psychology', skillName: 'Marketing Psychology Principles', priority: 'P1', assignedAt: '2026-08-07' },
      { skillId: 'skill-social-content', skillName: 'Social Media Content Strategy', priority: 'P1', assignedAt: '2026-08-08' }
    ],
    toolIds: ['tool-browser', 'tool-social-publisher', 'tool-calendar'],
    permissions: ['campaign:create', 'copy:publish'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-tari',
    name: 'Tari',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-side-hustle',
    departmentName: 'Side Hustle',
    roleId: 'role-rnd',
    roleName: 'R&D Product Research',
    description: 'Product researcher. Memetakan potensi produk laris di e-commerce, menganalisis peluang pasar baru, dan evaluasi pesaing.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Business Lead',
    skills: [
      { skillId: 'skill-market-analysis', skillName: 'Market & Product Demand Analysis', priority: 'P0', assignedAt: '2026-08-01' }
    ],
    toolIds: ['tool-market-trends', 'tool-browser'],
    permissions: ['market:analyze', 'product:recommend'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-bagas',
    name: 'Bagas',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-side-hustle',
    departmentName: 'Side Hustle',
    roleId: 'role-content',
    roleName: 'Pembuat Konten',
    description: 'Content creator multimedia. Memproduksi foto produk berkualitas tinggi dan video pendek kreatif untuk platform media sosial.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Business Lead',
    skills: [
      { skillId: 'skill-social-content', skillName: 'Social Media Content Strategy', priority: 'P0', assignedAt: '2026-08-08' },
      { skillId: 'skill-copywriting', skillName: 'Conversion Copywriting', priority: 'P1', assignedAt: '2026-08-07' }
    ],
    toolIds: ['tool-video-creator', 'tool-social-publisher', 'tool-browser'],
    permissions: ['content:create', 'media:upload'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  }
]

export const initialProjects: Project[] = [
  {
    id: 'prj-satria-ui',
    workspaceId: 'ws-dev',
    name: 'SATRIA AI Workforce UI',
    description: 'Pusat komando digital workspace PWA untuk orkestrasi dan eksekusi AI agent.',
    status: 'Active',
    health: 'Healthy',
    progress: 75,
    taskCount: 3,
    completedTaskCount: 1,
    contributorsCount: 3,
    accentColor: '#10b981',
    path: 'C:/Projects/AI AGENTIC UI',
    defaultWorkerId: 'emp-raka',
    defaultWorkerName: 'Raka',
    repositoryUrl: 'https://github.com/satria-workforce/satria-ai-workforce',
    branch: 'main',
    milestones: [
      { id: 'm1', title: 'Core Workspace Shell', dueDate: '2026-08-14', completed: true },
      { id: 'm2', title: 'Real Database & Persistent Storage', dueDate: '2026-08-20', completed: false }
    ],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T11:00:00Z'
  },
  {
    id: 'prj-crm-saas',
    workspaceId: 'ws-dev',
    name: 'CRM SaaS Backend Engine',
    description: 'Layanan backend terdistribusi untuk manajemen data pelanggan dan autentikasi.',
    status: 'Active',
    health: 'Healthy',
    progress: 50,
    taskCount: 2,
    completedTaskCount: 0,
    contributorsCount: 2,
    accentColor: '#03b5d3',
    path: 'C:/Projects/crm-backend',
    defaultWorkerId: 'emp-bima',
    defaultWorkerName: 'Bima',
    repositoryUrl: 'https://github.com/satria-workforce/crm-backend-engine',
    branch: 'main',
    milestones: [
      { id: 'm3', title: 'REST API & Security Audit', dueDate: '2026-08-25', completed: false }
    ],
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-08-14T10:45:00Z'
  },
  {
    id: 'prj-marketing',
    workspaceId: 'ws-business',
    name: 'Marketing & Digital Business',
    description: 'Otomasi riset pasar, materi promosi konversi tinggi, dan customer support.',
    status: 'Active',
    health: 'At Risk',
    progress: 40,
    taskCount: 4,
    completedTaskCount: 0,
    contributorsCount: 4,
    accentColor: '#fc7c78',
    path: 'C:/Projects/marketing-automation',
    defaultWorkerId: 'emp-citra',
    defaultWorkerName: 'Citra',
    milestones: [
      { id: 'm4', title: 'Q3 Product & Campaign Launch', dueDate: '2026-08-30', completed: false }
    ],
    createdAt: '2026-07-20T08:00:00Z',
    updatedAt: '2026-08-14T09:30:00Z'
  },
  {
    id: 'prj-internal-ops',
    workspaceId: 'ws-personal',
    name: 'Training & Safety Operations',
    description: 'Modul materi keselamatan kerja pertambangan K3 dan administrasi pelatihan.',
    status: 'Active',
    health: 'Healthy',
    progress: 60,
    taskCount: 3,
    completedTaskCount: 1,
    contributorsCount: 3,
    accentColor: '#4cd7f6',
    path: 'C:/Projects/safety-ops',
    defaultWorkerId: 'emp-dani',
    defaultWorkerName: 'Dani',
    milestones: [
      { id: 'm5', title: 'Safety Training Modules Complete', dueDate: '2026-08-28', completed: false }
    ],
    createdAt: '2026-06-10T08:00:00Z',
    updatedAt: '2026-08-13T16:00:00Z'
  }
]

/**
 * EXACTLY 1 EXAMPLE TASK PER EMPLOYEE / PROJECT (12 Tasks total)
 */
export const initialTasks: Task[] = [
  // 1. Raka (Planner) -> prj-satria-ui
  {
    id: 'tsk-101',
    workspaceId: 'ws-dev',
    projectId: 'prj-satria-ui',
    projectName: 'SATRIA AI Workforce UI',
    title: 'Decompose product roadmap into sprint deliverables and milestones',
    description: 'Menganalisis kebutuhan fitur sistem dan menyusun rencana alokasi tugas untuk tim coding.',
    type: 'project',
    status: 'Done',
    priority: 'High',
    assigneeId: 'emp-raka',
    assigneeName: 'Raka',
    assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-raka',
    workerName: 'Raka',
    pathOverride: 'C:/Projects/AI AGENTIC UI',
    dueDate: '2026-08-14',
    tags: ['Planning', 'Sprint', 'Management'],
    progress: 100,
    checklist: [
      { id: 'chk-r1', title: 'Define acceptance criteria', completed: true }
    ],
    comments: [],
    createdAt: '2026-08-14T07:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // 2. Maya (UI/UX Frontend) -> prj-satria-ui
  {
    id: 'tsk-102',
    workspaceId: 'ws-dev',
    projectId: 'prj-satria-ui',
    projectName: 'SATRIA AI Workforce UI',
    title: 'Design and implement responsive task matrix layout',
    description: 'Membangun komponen visual antarmuka task matrix Vue 3 dengan token desain semantik dan responsif mobile.',
    type: 'project',
    status: 'In Progress',
    priority: 'High',
    assigneeId: 'emp-maya',
    assigneeName: 'Maya',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-maya',
    workerName: 'Maya',
    pathOverride: 'C:/Projects/AI AGENTIC UI',
    dueDate: '2026-08-20',
    tags: ['UI', 'Frontend', 'Vue3'],
    progress: 60,
    checklist: [
      { id: 'chk-a1', title: 'Component template structure', completed: true },
      { id: 'chk-a2', title: 'Mobile viewport breakpoint test', completed: false }
    ],
    comments: [],
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T11:15:00Z'
  },

  // 3. Bima (Backend API) -> prj-crm-saas
  {
    id: 'tsk-103',
    workspaceId: 'ws-dev',
    projectId: 'prj-crm-saas',
    projectName: 'CRM SaaS Backend Engine',
    title: 'Implement REST API schema validation and database query optimization',
    description: 'Menyusun endpoint RESTful CRUD dan mengoptimalkan performa indexing database relasional.',
    type: 'project',
    status: 'In Progress',
    priority: 'Urgent',
    assigneeId: 'emp-bima',
    assigneeName: 'Bima',
    assigneeAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-bima',
    workerName: 'Bima',
    pathOverride: 'C:/Projects/crm-backend',
    dueDate: '2026-08-22',
    tags: ['Backend', 'API', 'Database'],
    progress: 40,
    checklist: [
      { id: 'chk-b1', title: 'Payload validation schema', completed: true },
      { id: 'chk-b2', title: 'Composite index benchmarking', completed: false }
    ],
    comments: [],
    createdAt: '2026-08-13T14:00:00Z',
    updatedAt: '2026-08-14T09:00:00Z'
  },

  // 4. Dimas (Quality Control) -> prj-satria-ui
  {
    id: 'tsk-104',
    workspaceId: 'ws-dev',
    projectId: 'prj-satria-ui',
    projectName: 'SATRIA AI Workforce UI',
    title: 'Execute quality assurance test suite on navigation components',
    description: 'Melakukan pengetesan regresi fungsionalitas router, sidebar drawer, dan keyboard shortcuts.',
    type: 'project',
    status: 'Todo',
    priority: 'High',
    assigneeId: 'emp-dimas',
    assigneeName: 'Dimas',
    assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-dimas',
    workerName: 'Dimas',
    pathOverride: 'C:/Projects/AI AGENTIC UI',
    dueDate: '2026-08-21',
    tags: ['QA', 'Testing', 'Regression'],
    progress: 0,
    checklist: [
      { id: 'chk-d1', title: 'Setup automated test cases', completed: false }
    ],
    comments: [],
    createdAt: '2026-08-14T08:30:00Z',
    updatedAt: '2026-08-14T08:30:00Z'
  },

  // 5. Ardi (Security Control) -> prj-crm-saas
  {
    id: 'tsk-105',
    workspaceId: 'ws-dev',
    projectId: 'prj-crm-saas',
    projectName: 'CRM SaaS Backend Engine',
    title: 'Perform security review and access token authentication audit',
    description: 'Mengaudit celah keamanan otorisasi endpoint dan memastikan kepatuhan standar OWASP Top 10.',
    type: 'project',
    status: 'Todo',
    priority: 'High',
    assigneeId: 'emp-ardi',
    assigneeName: 'Ardi',
    assigneeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-ardi',
    workerName: 'Ardi',
    pathOverride: 'C:/Projects/crm-backend',
    dueDate: '2026-08-23',
    tags: ['Security', 'Audit', 'OWASP'],
    progress: 0,
    checklist: [],
    comments: [],
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // 6. Dani (Admin Trainer) -> prj-internal-ops
  {
    id: 'tsk-106',
    workspaceId: 'ws-personal',
    projectId: 'prj-internal-ops',
    projectName: 'Training & Safety Operations',
    title: 'Coordinate training participant roster and distribution schedule',
    description: 'Mengelola daftar peserta pelatihan K3, mengirimkan undangan sesi, dan menjadwalkan sertifikasi.',
    type: 'project',
    status: 'Todo',
    priority: 'Medium',
    assigneeId: 'emp-dani',
    assigneeName: 'Dani',
    assigneeAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-dani',
    workerName: 'Dani',
    pathOverride: 'C:/Projects/safety-ops',
    dueDate: '2026-08-26',
    tags: ['Admin', 'Training', 'Operations'],
    progress: 0,
    checklist: [],
    comments: [],
    createdAt: '2026-08-14T09:30:00Z',
    updatedAt: '2026-08-14T09:30:00Z'
  },

  // 7. Rina (Researcher Materi) -> prj-internal-ops
  {
    id: 'tsk-107',
    workspaceId: 'ws-personal',
    projectId: 'prj-internal-ops',
    projectName: 'Training & Safety Operations',
    title: 'Conduct industrial mining safety regulations (K3) literature research',
    description: 'Menelusuri standar regulasi K3 pertambangan terbaru dan mengompilasi studi kasus pencegahan kecelakaan kerja.',
    type: 'project',
    status: 'Done',
    priority: 'High',
    assigneeId: 'emp-rina',
    assigneeName: 'Rina',
    assigneeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-rina',
    workerName: 'Rina',
    pathOverride: 'C:/Projects/safety-ops',
    dueDate: '2026-08-15',
    tags: ['K3', 'Research', 'Safety'],
    progress: 100,
    checklist: [
      { id: 'chk-rn1', title: 'Collect ESDM & K3 regulation papers', completed: true }
    ],
    comments: [],
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-08-14T11:00:00Z'
  },

  // 8. Sari (Pembuat Materi) -> prj-internal-ops
  {
    id: 'tsk-108',
    workspaceId: 'ws-personal',
    projectId: 'prj-internal-ops',
    projectName: 'Training & Safety Operations',
    title: 'Author training module PDF document and presentation slides',
    description: 'Menyusun dokumen ajar format PDF dan slide presentasi visual PPT berbasis bahan riset keselamatan kerja.',
    type: 'project',
    status: 'In Progress',
    priority: 'High',
    assigneeId: 'emp-sari',
    assigneeName: 'Sari',
    assigneeAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-sari',
    workerName: 'Sari',
    pathOverride: 'C:/Projects/safety-ops',
    dueDate: '2026-08-24',
    tags: ['PDF', 'PPT', 'Training'],
    progress: 50,
    checklist: [
      { id: 'chk-m1', title: 'Layout PDF chapter 1-3', completed: true },
      { id: 'chk-m2', title: 'Slide presentation deck visual polish', completed: false }
    ],
    comments: [],
    createdAt: '2026-08-14T09:00:00Z',
    updatedAt: '2026-08-14T11:30:00Z'
  },

  // 9. Faisal (Customer Service) -> prj-marketing
  {
    id: 'tsk-109',
    workspaceId: 'ws-business',
    projectId: 'prj-marketing',
    projectName: 'Marketing & Digital Business',
    title: 'Set up customer inquiry triage and automated sales response templates',
    description: 'Menyusun SOP respons cepat pertanyaan pembeli dan template panduan penanganan keluhan pelanggan.',
    type: 'project',
    status: 'In Progress',
    priority: 'Medium',
    assigneeId: 'emp-faisal',
    assigneeName: 'Faisal',
    assigneeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-faisal',
    workerName: 'Faisal',
    pathOverride: 'C:/Projects/marketing-automation',
    dueDate: '2026-08-22',
    tags: ['CS', 'Support', 'Sales'],
    progress: 45,
    checklist: [
      { id: 'chk-c1', title: 'Standard FAQ responses', completed: true },
      { id: 'chk-c2', title: 'Escalation workflow diagram', completed: false }
    ],
    comments: [],
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // 10. Citra (Marketing Specialist) -> prj-marketing
  {
    id: 'tsk-110',
    workspaceId: 'ws-business',
    projectId: 'prj-marketing',
    projectName: 'Marketing & Digital Business',
    title: 'Draft conversion copywriting and campaign content distribution plan',
    description: 'Menulis naskah sales copy untuk landing page promosi dan menyusun kalender kampanye promosi digital.',
    type: 'project',
    status: 'In Progress',
    priority: 'Urgent',
    assigneeId: 'emp-citra',
    assigneeName: 'Citra',
    assigneeAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-citra',
    workerName: 'Citra',
    pathOverride: 'C:/Projects/marketing-automation',
    dueDate: '2026-08-23',
    tags: ['Copywriting', 'Marketing', 'Campaign'],
    progress: 35,
    checklist: [
      { id: 'chk-al1', title: 'Hero section headline options', completed: true },
      { id: 'chk-al2', title: 'Value proposition points', completed: false }
    ],
    comments: [],
    createdAt: '2026-08-14T08:30:00Z',
    updatedAt: '2026-08-14T10:30:00Z'
  },

  // 11. Tari (R&D Product Research) -> prj-marketing
  {
    id: 'tsk-111',
    workspaceId: 'ws-business',
    projectId: 'prj-marketing',
    projectName: 'Marketing & Digital Business',
    title: 'Analyze trending e-commerce product opportunities and market demand',
    description: 'Riset tren pencarian produk berdaya beli tinggi di marketplace, estimasi margin profit, dan analisis kompetitor.',
    type: 'project',
    status: 'Todo',
    priority: 'High',
    assigneeId: 'emp-tari',
    assigneeName: 'Tari',
    assigneeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-tari',
    workerName: 'Tari',
    pathOverride: 'C:/Projects/marketing-automation',
    dueDate: '2026-08-25',
    tags: ['MarketResearch', 'Ecommerce', 'RND'],
    progress: 0,
    checklist: [],
    comments: [],
    createdAt: '2026-08-14T09:00:00Z',
    updatedAt: '2026-08-14T09:00:00Z'
  },

  // 12. Bagas (Pembuat Konten) -> prj-marketing
  {
    id: 'tsk-112',
    workspaceId: 'ws-business',
    projectId: 'prj-marketing',
    projectName: 'Marketing & Digital Business',
    title: 'Produce promotional media visual assets and short-form video concepts',
    description: 'Merancang visual poster produk dan konsep storyboard video pendek kreatif untuk platform media sosial.',
    type: 'project',
    status: 'In Progress',
    priority: 'Medium',
    assigneeId: 'emp-bagas',
    assigneeName: 'Bagas',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    workerId: 'emp-bagas',
    workerName: 'Bagas',
    pathOverride: 'C:/Projects/marketing-automation',
    dueDate: '2026-08-24',
    tags: ['Content', 'Design', 'Video'],
    progress: 20,
    checklist: [
      { id: 'chk-s1', title: 'Product visual mockup templates', completed: true },
      { id: 'chk-s2', title: '3 video hook scripts', completed: false }
    ],
    comments: [],
    createdAt: '2026-08-14T09:30:00Z',
    updatedAt: '2026-08-14T11:00:00Z'
  }
]

export const initialAssignments: TaskAssignment[] = initialTasks.map((t) => ({
  id: `asg-${t.id}`,
  taskId: t.id,
  taskTitle: t.title,
  employeeId: t.assigneeId || 'emp-raka',
  employeeName: t.assigneeName || 'Raka',
  employeeAvatar: t.assigneeAvatar || '',
  employeeRole: 'Specialist',
  assignedBy: 'Satria Utama',
  skillIds: [],
  priority: t.priority,
  status: t.status === 'Done' ? 'Completed' : t.status === 'In Progress' ? 'In Progress' : 'Assigned',
  startedAt: t.status === 'In Progress' || t.status === 'Done' ? t.createdAt : undefined,
  completedAt: t.status === 'Done' ? t.updatedAt : undefined,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt
}))

export const initialAgentRuns: AgentRun[] = [
  {
    id: 'run-101-01',
    assignmentId: 'asg-tsk-101',
    taskId: 'tsk-101',
    taskTitle: 'Decompose product roadmap into sprint deliverables and milestones',
    employeeId: 'emp-raka',
    employeeName: 'Raka',
    employeeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'Planner',
    status: 'Completed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-101-1', timestamp: '07:00:02', step: 'Initializing', message: 'Task context loaded into workspace.', level: 'info' },
      { id: 'log-101-2', timestamp: '07:00:18', step: 'Working', message: 'Roadmap breakdown artifact generated.', level: 'info' },
      { id: 'log-101-3', timestamp: '07:00:24', step: 'Completing', message: 'Quality gate verified with 100% assertions passed.', level: 'success' }
    ],
    telemetry: {
      model: 'hermes-3-llama-3.1-70b',
      provider: 'NousResearch',
      promptTokens: 18500,
      completionTokens: 4200,
      cachedTokens: 256,
      totalTokens: 22700,
      estimatedCostUsd: 0.018,
      durationMs: 24000
    },
    startedAt: '2026-08-14T07:00:00Z',
    completedAt: '2026-08-14T07:00:24Z',
    createdAt: '2026-08-14T07:00:00Z',
    updatedAt: '2026-08-14T07:00:24Z',
    durationSeconds: 24
  },
  {
    id: 'run-102-01',
    assignmentId: 'asg-tsk-102',
    taskId: 'tsk-102',
    taskTitle: 'Design and implement responsive task matrix layout',
    employeeId: 'emp-maya',
    employeeName: 'Maya',
    employeeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'UI/UX Lead',
    status: 'Completed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-102-1', timestamp: '07:30:00', step: 'Initializing', message: 'UI/UX Pro Max tokens resolved.', level: 'info' },
      { id: 'log-102-2', timestamp: '07:30:42', step: 'Completing', message: 'Responsive matrix layout created and verified.', level: 'success' }
    ],
    telemetry: {
      model: 'claude-3-5-sonnet-20241022',
      provider: 'Anthropic',
      promptTokens: 28000,
      completionTokens: 7200,
      cachedTokens: 1024,
      totalTokens: 35200,
      estimatedCostUsd: 0.112,
      durationMs: 42000
    },
    startedAt: '2026-08-14T07:30:00Z',
    completedAt: '2026-08-14T07:30:42Z',
    createdAt: '2026-08-14T07:30:00Z',
    updatedAt: '2026-08-14T07:30:42Z',
    durationSeconds: 42
  },
  {
    id: 'run-103-01',
    assignmentId: 'asg-tsk-103',
    taskId: 'tsk-103',
    taskTitle: 'Implement REST API schema validation and database query optimization',
    employeeId: 'emp-bima',
    employeeName: 'Bima',
    employeeAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'Backend API',
    status: 'Completed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-103-1', timestamp: '08:00:00', step: 'Working', message: 'Database query migration script generated.', level: 'info' },
      { id: 'log-103-2', timestamp: '08:00:38', step: 'Completing', message: 'All query optimizations verified.', level: 'success' }
    ],
    telemetry: {
      model: 'hermes-3-llama-3.1-70b',
      provider: 'NousResearch',
      promptTokens: 24500,
      completionTokens: 7910,
      cachedTokens: 512,
      totalTokens: 32410,
      estimatedCostUsd: 0.02675,
      durationMs: 38000
    },
    startedAt: '2026-08-14T08:00:00Z',
    completedAt: '2026-08-14T08:00:38Z',
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T08:00:38Z',
    durationSeconds: 38
  },
  {
    id: 'run-105-01',
    assignmentId: 'asg-tsk-105',
    taskId: 'tsk-105',
    taskTitle: 'Establish distributed cache replication and fallback invalidation',
    employeeId: 'emp-bima',
    employeeName: 'Bima',
    employeeAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'Backend API',
    status: 'Failed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 80,
    logs: [
      { id: 'log-105-1', timestamp: '08:05:00', step: 'Working', message: 'Cache strategy drafted.', level: 'info' },
      { id: 'log-105-2', timestamp: '08:05:25', step: 'Completing', message: 'Verification failed: invalidation edge case missing.', level: 'error' }
    ],
    telemetry: {
      model: 'hermes-3-llama-3.1-70b',
      provider: 'NousResearch',
      promptTokens: 14200,
      completionTokens: 2800,
      cachedTokens: 0,
      totalTokens: 17000,
      estimatedCostUsd: 0.0136,
      durationMs: 25000
    },
    error: 'Cache invalidation boundary test failed on network partition.',
    startedAt: '2026-08-14T08:05:00Z',
    completedAt: '2026-08-14T08:05:25Z',
    createdAt: '2026-08-14T08:05:00Z',
    updatedAt: '2026-08-14T08:05:25Z',
    durationSeconds: 25
  },
  {
    id: 'run-105-02',
    assignmentId: 'asg-tsk-105',
    taskId: 'tsk-105',
    taskTitle: 'Establish distributed cache replication and fallback invalidation',
    employeeId: 'emp-bima',
    employeeName: 'Bima',
    employeeAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'Backend API',
    status: 'Completed',
    attempt: 2,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-105b-1', timestamp: '08:10:00', step: 'Initializing', message: 'Retry attempt #2 with partition fault handler.', level: 'info' },
      { id: 'log-105b-2', timestamp: '08:10:35', step: 'Completing', message: 'Self-healing succeeded: cache partition test passed.', level: 'success' }
    ],
    telemetry: {
      model: 'hermes-3-llama-3.1-70b',
      provider: 'NousResearch',
      promptTokens: 21000,
      completionTokens: 6400,
      cachedTokens: 512,
      totalTokens: 27400,
      estimatedCostUsd: 0.0223,
      durationMs: 35000
    },
    startedAt: '2026-08-14T08:10:00Z',
    completedAt: '2026-08-14T08:10:35Z',
    createdAt: '2026-08-14T08:10:00Z',
    updatedAt: '2026-08-14T08:10:35Z',
    durationSeconds: 35
  },
  {
    id: 'run-104-01',
    assignmentId: 'asg-tsk-104',
    taskId: 'tsk-104',
    taskTitle: 'Construct automated verification test suite and quality assertions',
    employeeId: 'emp-satria',
    employeeName: 'Satria Lead',
    employeeAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'Fullstack Lead',
    status: 'Completed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-104-1', timestamp: '08:15:00', step: 'Working', message: 'Quality gate assertions generated.', level: 'info' },
      { id: 'log-104-2', timestamp: '08:15:45', step: 'Completing', message: 'All test assertions passed with 100% coverage.', level: 'success' }
    ],
    telemetry: {
      model: 'gpt-4o',
      provider: 'OpenAI',
      promptTokens: 32000,
      completionTokens: 9800,
      cachedTokens: 2048,
      totalTokens: 41800,
      estimatedCostUsd: 0.125,
      durationMs: 45000
    },
    startedAt: '2026-08-14T08:15:00Z',
    completedAt: '2026-08-14T08:15:45Z',
    createdAt: '2026-08-14T08:15:00Z',
    updatedAt: '2026-08-14T08:15:45Z',
    durationSeconds: 45
  },
  {
    id: 'run-107-01',
    assignmentId: 'asg-tsk-107',
    taskId: 'tsk-107',
    taskTitle: 'Conduct industrial mining safety regulations (K3) literature research',
    employeeId: 'emp-rina',
    employeeName: 'Rina',
    employeeAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'Researcher Materi',
    status: 'Completed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-107-1', timestamp: '09:00:00', step: 'Working', message: 'K3 safety regulations literature search completed.', level: 'info' },
      { id: 'log-107-2', timestamp: '09:00:20', step: 'Completing', message: 'Research summary deliverable ingested.', level: 'success' }
    ],
    telemetry: {
      model: 'fast-work-free',
      provider: 'LocalGateway',
      promptTokens: 11200,
      completionTokens: 3300,
      cachedTokens: 0,
      totalTokens: 14500,
      estimatedCostUsd: 0.0,
      durationMs: 20000
    },
    startedAt: '2026-08-14T09:00:00Z',
    completedAt: '2026-08-14T09:00:20Z',
    createdAt: '2026-08-14T09:00:00Z',
    updatedAt: '2026-08-14T09:00:20Z',
    durationSeconds: 20
  },
  {
    id: 'run-108-01',
    assignmentId: 'asg-tsk-108',
    taskId: 'tsk-108',
    taskTitle: 'Author training module PDF document and presentation slides',
    employeeId: 'emp-sari',
    employeeName: 'Sari',
    employeeAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'Pembuat Materi',
    status: 'Completed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-108-1', timestamp: '09:30:00', step: 'Working', message: 'PDF document generated. Missing 1 optional slide template.', level: 'warn' },
      { id: 'log-108-2', timestamp: '09:30:26', step: 'Completing', message: 'Quality gate evaluated with Warning status.', level: 'warn' }
    ],
    telemetry: {
      model: 'hermes-3-llama-3.1-8b',
      provider: 'NousResearch',
      promptTokens: 15400,
      completionTokens: 4400,
      cachedTokens: 0,
      totalTokens: 19800,
      estimatedCostUsd: 0.00396,
      durationMs: 26000
    },
    startedAt: '2026-08-14T09:30:00Z',
    completedAt: '2026-08-14T09:30:26Z',
    createdAt: '2026-08-14T09:30:00Z',
    updatedAt: '2026-08-14T09:30:26Z',
    durationSeconds: 26
  },
  {
    id: 'run-110-01',
    assignmentId: 'asg-tsk-110',
    taskId: 'tsk-110',
    taskTitle: 'Draft conversion copywriting and campaign content distribution plan',
    employeeId: 'emp-citra',
    employeeName: 'Citra',
    employeeAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'Marketing Specialist',
    status: 'Completed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-110-1', timestamp: '10:00:00', step: 'Working', message: 'Conversion copy headlines and distribution plan drafted.', level: 'info' },
      { id: 'log-110-2', timestamp: '10:00:32', step: 'Completing', message: 'Quality verification passed all criteria.', level: 'success' }
    ],
    telemetry: {
      model: 'gpt-4o-mini',
      provider: 'OpenAI',
      promptTokens: 22400,
      completionTokens: 6200,
      cachedTokens: 512,
      totalTokens: 28600,
      estimatedCostUsd: 0.0052,
      durationMs: 32000
    },
    startedAt: '2026-08-14T10:00:00Z',
    completedAt: '2026-08-14T10:00:32Z',
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-14T10:00:32Z',
    durationSeconds: 32
  },
  {
    id: 'run-111-01',
    assignmentId: 'asg-tsk-111',
    taskId: 'tsk-111',
    taskTitle: 'Analyze trending e-commerce product opportunities and market demand',
    employeeId: 'emp-tari',
    employeeName: 'Tari',
    employeeAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    employeeRole: 'R&D Product Research',
    status: 'Completed',
    attempt: 1,
    currentStep: 'Completing',
    progress: 100,
    logs: [
      { id: 'log-111-1', timestamp: '10:30:00', step: 'Working', message: 'Market demand data synthesized.', level: 'info' },
      { id: 'log-111-2', timestamp: '10:30:22', step: 'Completing', message: 'Research findings verified.', level: 'success' }
    ],
    telemetry: {
      model: 'claude-3-haiku-20240307',
      provider: 'Anthropic',
      promptTokens: 16800,
      completionTokens: 4200,
      cachedTokens: 0,
      totalTokens: 21000,
      estimatedCostUsd: 0.0068,
      durationMs: 22000
    },
    startedAt: '2026-08-14T10:30:00Z',
    completedAt: '2026-08-14T10:30:22Z',
    createdAt: '2026-08-14T10:30:00Z',
    updatedAt: '2026-08-14T10:30:22Z',
    durationSeconds: 22
  }
]

export const initialRunResults: RunResult[] = [
  {
    id: 'res-101-01',
    runId: 'run-101-01',
    taskId: 'tsk-101',
    assignmentId: 'asg-tsk-101',
    summary: 'Decomposed product roadmap into sprint deliverables with timeline milestones.',
    output: '### Deliverable Output — Sprint Roadmap Breakdown\n- **Milestones**: 4 sprint phases defined\n- **Dependencies**: Database schema, API auth, and UI tokens\n- **Verification**: Complete roadmap assertions verified.',
    status: 'success',
    artifactIds: ['art-roadmap-01'],
    verificationStatus: 'Passed',
    verificationNotes: 'Quality Gate Passed: 5/5 assertions passed (Score: 100%).',
    verificationEvidence: [
      { type: 'criteria', name: 'Deliverable Output Integrity', passed: true, details: 'Sprint milestones complete.' },
      { type: 'security', name: 'Sandbox Policy Compliance', passed: true, details: 'Zero boundary violations.' },
      { type: 'diff', name: 'File Modifications', passed: true, details: 'Read-only planning report.' }
    ],
    createdAt: '2026-08-14T07:00:24Z',
    updatedAt: '2026-08-14T07:00:24Z'
  },
  {
    id: 'res-102-01',
    runId: 'run-102-01',
    taskId: 'tsk-102',
    assignmentId: 'asg-tsk-102',
    summary: 'Implemented responsive task matrix layout using modern design tokens.',
    output: '### Deliverable Output — Task Matrix Component\n- **Tokens**: Full dark-first palette compliant\n- **Breakpoints**: 360px mobile to 1600px desktop responsive layout.',
    status: 'success',
    artifactIds: ['art-matrix-ui'],
    verificationStatus: 'Passed',
    verificationNotes: 'Quality Gate Passed: 5/5 assertions passed (Score: 100%).',
    verificationEvidence: [
      { type: 'test', name: 'Unit / Integration Tests', passed: true, details: 'Exit code 0 (24 passed)', command: 'vitest run' },
      { type: 'typecheck', name: 'TypeScript Validation', passed: true, details: '0 errors (strict mode)', command: 'vue-tsc --noEmit' },
      { type: 'criteria', name: 'Design Token Conformance', passed: true, details: 'Verified with design tokens.' },
      { type: 'security', name: 'Sandbox Policy Compliance', passed: true, details: 'Passed safe boundary audit.' }
    ],
    createdAt: '2026-08-14T07:30:42Z',
    updatedAt: '2026-08-14T07:30:42Z'
  },
  {
    id: 'res-103-02',
    runId: 'run-103-02',
    taskId: 'tsk-103',
    assignmentId: 'asg-tsk-103',
    summary: 'REST API schema validation and database query indexing optimization complete.',
    output: '### Deliverable Output — REST API & DB Query Optimization\n- **Endpoints**: /api/v1/tasks, /api/v1/runs\n- **Validation**: Strict schema checks & fast IndexedDB queries.',
    status: 'success',
    artifactIds: ['art-api-schema'],
    verificationStatus: 'Passed',
    verificationNotes: 'Quality Gate Passed: 5/5 assertions passed (Score: 100%).',
    verificationEvidence: [
      { type: 'test', name: 'Unit / Integration Tests', passed: true, details: 'All query benchmarks passed', command: 'vitest run' },
      { type: 'typecheck', name: 'TypeScript Validation', passed: true, details: '0 type errors', command: 'vue-tsc --noEmit' },
      { type: 'build', name: 'Production Build Bundle', passed: true, details: 'Clean bundle generation', command: 'vite build' },
      { type: 'security', name: 'Sandbox Policy Compliance', passed: true, details: 'Safe query execution boundary.' }
    ],
    createdAt: '2026-08-14T08:00:38Z',
    updatedAt: '2026-08-14T08:00:38Z'
  },
  {
    id: 'res-104-01',
    runId: 'run-104-01',
    taskId: 'tsk-104',
    assignmentId: 'asg-tsk-104',
    summary: 'Automated test suite and quality assertions framework.',
    output: '### Deliverable Output — Quality Gate Engine\n- **Engine**: VerificationEngine with multi-evidence validation.',
    status: 'success',
    artifactIds: ['art-test-suite'],
    verificationStatus: 'Passed',
    verificationNotes: 'Quality Gate Passed: 5/5 assertions passed (Score: 100%).',
    verificationEvidence: [
      { type: 'test', name: 'Unit / Integration Tests', passed: true, details: '162 passed', command: 'vitest run' },
      { type: 'typecheck', name: 'TypeScript Validation', passed: true, details: '0 errors', command: 'vue-tsc --noEmit' },
      { type: 'security', name: 'Sandbox Policy Compliance', passed: true, details: 'Passed boundary checks.' }
    ],
    createdAt: '2026-08-14T08:15:45Z',
    updatedAt: '2026-08-14T08:15:45Z'
  },
  {
    id: 'res-108-01',
    runId: 'run-108-01',
    taskId: 'tsk-108',
    assignmentId: 'asg-tsk-108',
    summary: 'Training module PDF generated. Minor formatting warning on optional visual asset.',
    output: '### Deliverable Output — K3 Safety Training Document\n- **Document**: k3-mining-safety-guide.pdf\n- **Notice**: Slide deck chapter 4 optional illustration pending.',
    status: 'partial',
    artifactIds: ['fl-safety-doc'],
    verificationStatus: 'Warning',
    verificationNotes: 'Quality Gate Warning: 4/5 assertions passed (Score: 80%). Missing optional visual slide asset.',
    verificationEvidence: [
      { type: 'criteria', name: 'PDF Document Completeness', passed: true, details: 'Core chapters 1-3 complete.' },
      { type: 'criteria', name: 'Visual Slide Deck Asset', passed: false, details: 'Optional chapter 4 illustration not attached.' },
      { type: 'security', name: 'Sandbox Policy Compliance', passed: true, details: 'Zero boundary violations.' }
    ],
    createdAt: '2026-08-14T09:30:26Z',
    updatedAt: '2026-08-14T09:30:26Z'
  },
  {
    id: 'res-110-01',
    runId: 'run-110-01',
    taskId: 'tsk-110',
    assignmentId: 'asg-tsk-110',
    summary: 'Conversion sales copy and campaign distribution calendar.',
    output: '### Deliverable Output — Marketing Sales Copy & Campaign\n- **Copy**: 3 high-converting landing page headline options\n- **Calendar**: 14-day promotional distribution schedule.',
    status: 'success',
    artifactIds: ['art-copy-plan'],
    verificationStatus: 'Passed',
    verificationNotes: 'Quality Gate Passed: 4/4 assertions passed (Score: 100%).',
    verificationEvidence: [
      { type: 'criteria', name: 'Value Proposition Points', passed: true, details: 'Clear value drivers.' },
      { type: 'security', name: 'Sandbox Policy Compliance', passed: true, details: 'Zero boundary violations.' }
    ],
    createdAt: '2026-08-14T10:00:32Z',
    updatedAt: '2026-08-14T10:00:32Z'
  }
]

export const initialTaskReviews: TaskReview[] = [
  {
    id: 'rev-101',
    runId: 'run-101-01',
    taskId: 'tsk-101',
    taskTitle: 'Decompose product roadmap into sprint deliverables and milestones',
    assignmentId: 'asg-tsk-101',
    employeeId: 'emp-raka',
    employeeName: 'Raka',
    reviewer: 'Satria Utama (Lead)',
    status: 'Pending',
    checklist: [
      { item: 'Roadmap breakdown completeness', completed: true },
      { item: 'Acceptance criteria verified', completed: true }
    ],
    createdAt: '2026-08-14T07:05:00Z',
    updatedAt: '2026-08-14T07:05:00Z'
  },
  {
    id: 'rev-102',
    runId: 'run-102-01',
    taskId: 'tsk-102',
    taskTitle: 'Design and implement responsive task matrix layout',
    assignmentId: 'asg-tsk-102',
    employeeId: 'emp-maya',
    employeeName: 'Maya',
    reviewer: 'Satria Utama (Lead)',
    status: 'Approved',
    comment: 'Clean responsive matrix and elegant token usage. Approved.',
    checklist: [
      { item: 'Responsive design tokens', completed: true },
      { item: 'Unit & TypeScript validation', completed: true }
    ],
    decisionAt: '2026-08-14T07:35:00Z',
    createdAt: '2026-08-14T07:31:00Z',
    updatedAt: '2026-08-14T07:35:00Z'
  },
  {
    id: 'rev-103',
    runId: 'run-103-02',
    taskId: 'tsk-103',
    taskTitle: 'Implement REST API schema validation and database query optimization',
    assignmentId: 'asg-tsk-103',
    employeeId: 'emp-bima',
    employeeName: 'Bima',
    reviewer: 'Satria Utama (Lead)',
    status: 'Approved',
    comment: 'Retry attempt #2 resolved all query validation errors perfectly.',
    checklist: [
      { item: 'Query optimization benchmark', completed: true },
      { item: 'Strict schema check', completed: true }
    ],
    decisionAt: '2026-08-14T08:10:00Z',
    createdAt: '2026-08-14T08:05:00Z',
    updatedAt: '2026-08-14T08:10:00Z'
  },
  {
    id: 'rev-108',
    runId: 'run-108-01',
    taskId: 'tsk-108',
    taskTitle: 'Author training module PDF document and presentation slides',
    assignmentId: 'asg-tsk-108',
    employeeId: 'emp-sari',
    employeeName: 'Sari',
    reviewer: 'Satria Utama (Lead)',
    status: 'Changes Requested',
    comment: 'Please attach optional chapter 4 illustration slide in next revision.',
    checklist: [
      { item: 'PDF Core chapters 1-3', completed: true },
      { item: 'Chapter 4 illustration slide', completed: false }
    ],
    decisionAt: '2026-08-14T09:40:00Z',
    createdAt: '2026-08-14T09:35:00Z',
    updatedAt: '2026-08-14T09:40:00Z'
  }
]

export const initialFiles: WorkspaceFile[] = [
  {
    id: 'fl-openapi-spec',
    workspaceId: 'ws-dev',
    projectId: 'prj-crm-saas',
    name: 'openapi-spec.json',
    sizeBytes: 43827,
    sizeFormatted: '42.8 KB',
    category: 'Code',
    extension: 'json',
    updatedAt: '2026-08-14'
  },
  {
    id: 'fl-design-tokens',
    workspaceId: 'ws-dev',
    projectId: 'prj-satria-ui',
    name: 'design-tokens.css',
    sizeBytes: 18841,
    sizeFormatted: '18.4 KB',
    category: 'Code',
    extension: 'css',
    updatedAt: '2026-08-14'
  },
  {
    id: 'fl-safety-doc',
    workspaceId: 'ws-personal',
    projectId: 'prj-internal-ops',
    name: 'k3-mining-safety-guide.pdf',
    sizeBytes: 1258291,
    sizeFormatted: '1.2 MB',
    category: 'Documents',
    extension: 'pdf',
    updatedAt: '2026-08-14'
  },
  {
    id: 'fl-training-doc-dev',
    workspaceId: 'ws-dev',
    projectId: 'prj-satria-ui',
    name: 'architecture_guidelines.pdf',
    sizeBytes: 655360,
    sizeFormatted: '640 KB',
    category: 'Documents',
    extension: 'pdf',
    updatedAt: '2026-08-14'
  }
]

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'act-init-01',
    workspaceId: 'ws-dev',
    actorName: 'Satria Utama',
    action: 'created',
    targetType: 'task',
    targetTitle: 'SATRIA AI Workforce Real Database Initialized',
    timestamp: '08:00',
    timeAgo: 'Just now',
    date: 'Today'
  }
]

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-welcome',
    workspaceId: 'ws-dev',
    title: 'Real Database Ready',
    message: 'SATRIA AI Workforce real database active with 12 digital employees and starter tasks.',
    timeAgo: 'Just now',
    priority: 'normal',
    category: 'System',
    read: false,
    createdAt: '2026-08-14T08:00:00Z'
  }
]

export const initialMemories: AgentMemoryItem[] = [
  {
    id: 'mem-global-01',
    workspaceId: 'ws-dev',
    type: 'semantic',
    scope: 'global',
    title: 'Semantic Design Tokens Standard',
    content: 'Always use semantic Tailwind design tokens (e.g. text-on-surface, bg-surface-container-low, border-outline-variant, text-primary). Do not use hardcoded hex values in template class attributes.',
    tags: ['design_system', 'tailwind', 'tokens', 'styling'],
    confidence: 0.98,
    importance: 5,
    source: 'system_rule',
    accessCount: 14,
    lastAccessedAt: '2026-08-14T10:00:00Z',
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'mem-global-02',
    workspaceId: 'ws-dev',
    type: 'procedural',
    scope: 'global',
    title: 'Mandatory Quality Gate Verification Sequence',
    content: 'Before requesting review or completing a deliverable, verify code in order: typecheck (vue-tsc --noEmit) -> lint (eslint .) -> test:unit (vitest) -> test:e2e -> build (vite build).',
    tags: ['quality_gate', 'typecheck', 'lint', 'test', 'verification'],
    confidence: 1.0,
    importance: 5,
    source: 'system_rule',
    accessCount: 28,
    lastAccessedAt: '2026-08-15T09:00:00Z',
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z'
  },
  {
    id: 'mem-prj-01',
    workspaceId: 'ws-dev',
    projectId: 'prj-satria-ui',
    projectName: 'SATRIA AI Workforce UI',
    type: 'semantic',
    scope: 'project',
    title: 'SATRIA UI Dark-First Architecture',
    content: 'SATRIA AI Workforce UI follows a dark-first command center design with primary emerald (#4edea3), secondary cyan (#4cd7f6), surface (#0e1511), and accessible ARIA attributes across all dialogs, tabs, and status badges.',
    tags: ['satria_ui', 'dark_mode', 'accessibility', 'palette'],
    confidence: 0.95,
    importance: 4,
    source: 'system_rule',
    accessCount: 19,
    lastAccessedAt: '2026-08-14T14:30:00Z',
    createdAt: '2026-08-11T09:00:00Z',
    updatedAt: '2026-08-14T14:30:00Z'
  },
  {
    id: 'mem-emp-01',
    workspaceId: 'ws-dev',
    employeeId: 'emp-raka',
    employeeName: 'Raka Pratama',
    type: 'procedural',
    scope: 'employee',
    title: 'Strict Path Sandboxing Defense',
    content: 'Always sanitize relative and absolute paths against workspace boundaries before performing filesystem tool operations. Reject symlink traversals and access to system-level directories.',
    tags: ['sandbox', 'security', 'filesystem', 'traversal_defense'],
    confidence: 0.99,
    importance: 5,
    source: 'manual_entry',
    accessCount: 12,
    lastAccessedAt: '2026-08-15T11:00:00Z',
    createdAt: '2026-08-12T08:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z'
  },
  {
    id: 'mem-emp-02',
    workspaceId: 'ws-dev',
    employeeId: 'emp-maya',
    employeeName: 'Maya Salsabila',
    type: 'procedural',
    scope: 'employee',
    title: 'Interactive Component Accessibility Standards',
    content: 'Every interactive drawer, modal, and tab switcher must declare role="dialog" or role="tablist", aria-modal="true", and aria-label to guarantee WCAG compliance and smooth E2E test locator resolution.',
    tags: ['accessibility', 'aria', 'ui_ux', 'wcag'],
    confidence: 0.96,
    importance: 4,
    source: 'manual_entry',
    accessCount: 8,
    lastAccessedAt: '2026-08-14T16:00:00Z',
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-08-14T16:00:00Z'
  },
  {
    id: 'mem-emp-03',
    workspaceId: 'ws-dev',
    employeeId: 'emp-dedi',
    employeeName: 'Dedi Kurniawan',
    type: 'feedback',
    scope: 'employee',
    title: 'Self-Healing Retry Limit Governance',
    content: 'Supervisor Directive: Never exceed 3 autonomous retry attempts. If unrecoverable errors occur, transition task to Blocked and alert Lead Supervisor immediately with detailed failure classification.',
    tags: ['retry_policy', 'governance', 'self_healing', 'supervisor_directive'],
    confidence: 0.99,
    importance: 5,
    source: 'reviewer_feedback',
    accessCount: 15,
    lastAccessedAt: '2026-08-15T12:00:00Z',
    createdAt: '2026-08-13T14:00:00Z',
    updatedAt: '2026-08-15T12:00:00Z'
  }
]

export const initialSchedules: Schedule[] = [
  {
    id: 'sch-001',
    workspaceId: 'ws-dev',
    projectId: 'prj-crm-saas',
    projectName: 'CRM SaaS Backend Engine',
    name: 'Daily Database Backup & Cache Invalidation',
    taskTemplate: {
      title: 'Run daily automated database snapshot and cache integrity verify',
      description: 'Melakukan backup database berkala dan verifikasi integritas cache distributed redis.',
      workerId: 'emp-bima',
      workerName: 'Bima',
      priority: 'High',
      instructions: 'Pastikan snapshot database tersimpan aman di direktori backup dan verifikasi liveness connection.',
      pathOverride: 'C:/Projects/crm-backend',
      acceptanceCriteria: ['Backup artifact created', 'Database integrity check passed']
    },
    recurrence: 'daily',
    time: '23:00',
    timezone: 'Asia/Jakarta (GMT+7)',
    enabled: true,
    nextRunAt: '2026-08-15T23:00:00Z',
    lastRunAt: '2026-08-14T23:00:00Z',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T23:00:00Z'
  },
  {
    id: 'sch-002',
    workspaceId: 'ws-business',
    projectId: 'prj-marketing',
    projectName: 'Marketing & Digital Business',
    name: 'Weekly Marketing Performance & ROI Report',
    taskTemplate: {
      title: 'Generate weekly marketing conversion analytics and campaign digest',
      description: 'Menyusun laporan mingguan metrik konversi iklan, performa konten sosial media, dan ROI kampanye.',
      workerId: 'emp-citra',
      workerName: 'Citra',
      priority: 'Medium',
      instructions: 'Kompilasi data leads, CPC, CTR, dan closing rate ke dalam format ringkasan eksekutif.',
      pathOverride: 'C:/Projects/marketing-automation',
      acceptanceCriteria: ['Weekly marketing report generated', 'Channel performance comparison table attached']
    },
    recurrence: 'weekly',
    dayOfWeek: 'Monday',
    time: '08:00',
    timezone: 'Asia/Jakarta (GMT+7)',
    enabled: true,
    nextRunAt: '2026-08-17T08:00:00Z',
    lastRunAt: '2026-08-10T08:00:00Z',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-10T08:00:00Z'
  },
  {
    id: 'sch-003',
    workspaceId: 'ws-dev',
    projectId: 'prj-satria-ui',
    projectName: 'SATRIA AI Workforce UI',
    name: 'Monthly Token Spend & Governance Cost Audit',
    taskTemplate: {
      title: 'Conduct monthly multi-model token burn and quality gate audit',
      description: 'Mengaudit total pengeluaran token LLM, efisiensi cache hit, dan skor kelulusan quality gate.',
      workerId: 'emp-raka',
      workerName: 'Raka',
      priority: 'High',
      instructions: 'Ekspor metrik governance aggregator dan susun perbandingan biaya antar departemen.',
      pathOverride: 'C:/Projects/AI AGENTIC UI',
      acceptanceCriteria: ['Monthly governance cost ledger generated', 'Budget threshold alert evaluated']
    },
    recurrence: 'monthly',
    time: '09:00',
    timezone: 'Asia/Jakarta (GMT+7)',
    enabled: true,
    nextRunAt: '2026-09-01T09:00:00Z',
    lastRunAt: '2026-08-01T09:00:00Z',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z'
  }
]

