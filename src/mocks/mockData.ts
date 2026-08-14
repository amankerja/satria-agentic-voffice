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
  TaskReview
} from '../types'


export const mockUserSettings: UserSettings = {
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

export const mockUser: UserProfile = {
  id: 'usr-001',
  displayName: 'Satria Utama',
  email: 'satria@workforce.ai',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  timezone: 'Asia/Jakarta (GMT+7)',
  language: 'English (US)',
  compactMode: false,
  theme: 'dark',
  settings: mockUserSettings
}

export const mockWorkspaces: Workspace[] = [
  {
    id: 'ws-personal',
    name: 'Personal Workspace',
    type: 'Personal',
    description: 'Ruang kerja pribadi untuk eksplorasi ide, riset, dan side-project mandiri.',
    projectCount: 4,
    taskCount: 12,
    fileCount: 18,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'ws-dev',
    name: 'Development Workspace',
    type: 'Development',
    description: 'Pusat pengembangan perangkat lunak, microservices, API contract, dan infrastruktur cloud.',
    projectCount: 8,
    taskCount: 24,
    fileCount: 28,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-08-14T11:20:00Z'
  },
  {
    id: 'ws-business',
    name: 'Business & Ops Workspace',
    type: 'Business',
    description: 'Operasional bisnis, analisis funnel penjualan, kampanye pemasaran, dan CRM automation.',
    projectCount: 6,
    taskCount: 16,
    fileCount: 22,
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-08-14T09:15:00Z'
  }
]

export const mockProjects: Project[] = []
export const mockTasks: Task[] = []
export const mockFiles: WorkspaceFile[] = []
export const mockActivityLogs: ActivityLog[] = []
export const mockNotifications: NotificationItem[] = []

export const mockDepartments: Department[] = [
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

export const mockEmployeeRoles: EmployeeRole[] = [
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

export const mockSkills: Skill[] = [
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
    category: 'Document',
    description: 'Pembuatan dokumen modul bahan ajar komprehensif serta presentasi slide visual berstruktur.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-trainer'],
    compatibleRoles: ['role-creator'],
    tags: ['PDF', 'PPT', 'Training', 'Design'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-cs-support',
    name: 'Customer Support & Sales Follow-Up',
    slug: 'customer-sales-support',
    category: 'Customer',
    description: 'Komunikasi persuasif dengan pelanggan, penanganan keluhan teknis, dan eskalasi prospek closing produk.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-cs'],
    tags: ['CRM', 'Sales', 'Support', 'Communication'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-market-analysis',
    name: 'Market & Product Demand Analysis',
    slug: 'market-demand-analysis',
    category: 'Analytics',
    description: 'Riset tren pencarian produk terlaris di e-commerce, analisis harga kompetitor, dan identifikasi ceruk pasar.',
    sourceType: 'internal',
    version: '1.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-rnd', 'role-marketing'],
    tags: ['Marketplace', 'E-commerce', 'Trends', 'Analytics'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // --- EXTERNAL REUSABLE SKILL PACKAGES ---
  {
    id: 'skill-find-skills',
    name: 'Find Skills (Skill Discovery)',
    slug: 'find-skills',
    category: 'Skill Discovery',
    description: 'Mencari dan menemukan kapabilitas skill yang relevan dari ekosistem package untuk memperluas kapabilitas workforce.',
    sourceType: 'external',
    sourceRepository: 'vercel-labs/skills',
    sourceUrl: 'https://github.com/vercel-labs/skills',
    installCommand: 'npx skills add https://github.com/vercel-labs/skills --skill find-skills',
    version: '1.2.0',
    status: 'Registered',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle'],
    compatibleRoles: ['role-planner', 'role-marketing', 'role-rnd', 'role-researcher'],
    tags: ['Discovery', 'Meta', 'Ecosystem'],
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-brainstorming',
    name: 'Brainstorming & Ideation',
    slug: 'brainstorming',
    category: 'Planning / Ideation',
    description: 'Mengeksplorasi ragam alternatif desain, hipotesis solusi, dan sudut pandang kreatif sebelum langkah implementasi.',
    sourceType: 'external',
    sourceRepository: 'obra/superpowers',
    sourceUrl: 'https://github.com/obra/superpowers',
    installCommand: 'npx skills add https://github.com/obra/superpowers --skill brainstorming',
    version: '2.1.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle'],
    compatibleRoles: ['role-planner', 'role-uiux', 'role-marketing', 'role-rnd', 'role-content'],
    tags: ['Ideation', 'Superpowers', 'Creative'],
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-writing-plans',
    name: 'Writing Implementation Plans',
    slug: 'writing-plans',
    category: 'Planning / Execution',
    description: 'Menyusun dokumen rencana eksekusi multi-step yang terukur, berurutan secara logis, dan mudah diverifikasi.',
    sourceType: 'external',
    sourceRepository: 'obra/superpowers',
    sourceUrl: 'https://github.com/obra/superpowers',
    installCommand: 'npx skills add https://github.com/obra/superpowers --skill writing-plans',
    version: '2.0.4',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle'],
    compatibleRoles: ['role-planner', 'role-backend', 'role-uiux', 'role-qc', 'role-creator', 'role-marketing'],
    tags: ['Planning', 'Superpowers', 'Blueprint'],
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-high-end-visual-design',
    name: 'High-End Visual Design',
    slug: 'high-end-visual-design',
    category: 'Visual Design',
    description: 'Penerapan standar visual kelas atas (agency-level), koreografi motion mikro, dan eliminasi anti-pattern desain murahan.',
    sourceType: 'external',
    sourceRepository: 'leonxlnx/taste-skill',
    sourceUrl: 'https://github.com/leonxlnx/taste-skill',
    installCommand: 'npx skills add https://github.com/leonxlnx/taste-skill --skill high-end-visual-design',
    version: '1.4.2',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle'],
    compatibleRoles: ['role-uiux', 'role-content', 'role-marketing', 'role-creator'],
    tags: ['Visual', 'Design', 'Aesthetics', 'Taste'],
    createdAt: '2026-08-06T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-ui-ux-pro-max',
    name: 'UI/UX Pro Max Intelligence',
    slug: 'ui-ux-pro-max',
    category: 'UI/UX Design',
    description: 'Panduan intelijen UI/UX lengkap: sistem warna harmonis, pairing tipografi, layout responsif, aksesibilitas, dan chart UX.',
    sourceType: 'external',
    sourceRepository: 'nextlevelbuilder/ui-ux-pro-max-skill',
    sourceUrl: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
    installCommand: 'npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max',
    version: '3.0.0',
    status: 'Active',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle'],
    compatibleRoles: ['role-uiux', 'role-creator', 'role-marketing', 'role-content'],
    tags: ['UIUX', 'ProMax', 'System', 'Guidelines'],
    createdAt: '2026-08-06T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-seo-audit',
    name: 'SEO Performance Audit',
    slug: 'seo-audit',
    category: 'SEO / Growth',
    description: 'Audit visibilitas pencarian organik, struktur metadata semantik, identifikasi issue indexing, dan rekomendasi perbaikan ranking.',
    sourceType: 'external',
    sourceRepository: 'coreyhaines31/marketingskills',
    sourceUrl: 'https://github.com/coreyhaines31/marketingskills',
    installCommand: 'npx skills add https://github.com/coreyhaines31/marketingskills --skill seo-audit',
    version: '1.1.0',
    status: 'Available',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-rnd', 'role-content'],
    tags: ['SEO', 'Marketing', 'Search', 'Audit'],
    createdAt: '2026-08-07T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-copywriting',
    name: 'Conversion Copywriting',
    slug: 'copywriting',
    category: 'Marketing / Conversion',
    description: 'Penyusunan headline memikat, deskripsi produk bernilai jual tinggi, pesan persuasif, dan naskah penjualan berkonversi tinggi.',
    sourceType: 'external',
    sourceRepository: 'coreyhaines31/marketingskills',
    sourceUrl: 'https://github.com/coreyhaines31/marketingskills',
    installCommand: 'npx skills add https://github.com/coreyhaines31/marketingskills --skill copywriting',
    version: '1.3.1',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-content', 'role-cs'],
    tags: ['Copywriting', 'Sales', 'Messaging', 'Conversion'],
    createdAt: '2026-08-07T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-marketing-psychology',
    name: 'Marketing Psychology Principles',
    slug: 'marketing-psychology',
    category: 'Marketing Strategy',
    description: 'Pemanfaatan pemicu psikologis keputusan konsumen (scarcity, social proof, reciprocity) secara etis untuk mendorong transaksi.',
    sourceType: 'external',
    sourceRepository: 'coreyhaines31/marketingskills',
    sourceUrl: 'https://github.com/coreyhaines31/marketingskills',
    installCommand: 'npx skills add https://github.com/coreyhaines31/marketingskills --skill marketing-psychology',
    version: '1.0.8',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-rnd', 'role-cs', 'role-content'],
    tags: ['Psychology', 'Strategy', 'Behavior', 'Marketing'],
    createdAt: '2026-08-07T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-social-content',
    name: 'Social Media Content Strategy',
    slug: 'social-content',
    category: 'Social Media',
    description: 'Perencanaan pilar konten media sosial, peningkatan interaksi audiens, strategi viralitas, dan pertumbuhan followers organik.',
    sourceType: 'external',
    sourceRepository: 'coreyhaines31/marketingskills',
    sourceUrl: 'https://github.com/coreyhaines31/marketingskills',
    installCommand: 'npx skills add https://github.com/coreyhaines31/marketingskills --skill social-content',
    version: '1.2.5',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-content', 'role-cs'],
    tags: ['Social', 'Content', 'Engagement', 'Community'],
    createdAt: '2026-08-08T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-content-strategy',
    name: 'Inbound Content Strategy',
    slug: 'content-strategy',
    category: 'Content Strategy',
    description: 'Perencanaan alur konten terstruktur untuk membangun otoritas brand, menarik traffic prospek, dan mendukung lead generation.',
    sourceType: 'external',
    sourceRepository: 'coreyhaines31/marketingskills',
    sourceUrl: 'https://github.com/coreyhaines31/marketingskills',
    installCommand: 'npx skills add https://github.com/coreyhaines31/marketingskills --skill content-strategy',
    version: '1.1.2',
    status: 'Active',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-content', 'role-rnd'],
    tags: ['Strategy', 'Inbound', 'Authority', 'Traffic'],
    createdAt: '2026-08-08T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'skill-ad-creative',
    name: 'Performance Ad Creative',
    slug: 'ad-creative',
    category: 'Performance Marketing',
    description: 'Formulasi konsep materi iklan berbayar (Meta Ads, TikTok Ads), pengujian headline variatif, dan iterasi berbasis metrik CTR/CPA.',
    sourceType: 'external',
    sourceRepository: 'coreyhaines31/marketingskills',
    sourceUrl: 'https://github.com/coreyhaines31/marketingskills',
    installCommand: 'npx skills add https://github.com/coreyhaines31/marketingskills --skill ad-creative',
    version: '1.0.4',
    status: 'Available',
    compatibleDepartments: ['dept-side-hustle'],
    compatibleRoles: ['role-marketing', 'role-content', 'role-rnd'],
    tags: ['Advertising', 'Performance', 'PaidAds', 'Creative'],
    createdAt: '2026-08-08T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  }
]

export const mockWorkforceTools: WorkforceTool[] = [
  {
    id: 'tool-fs',
    name: 'File System Workspace Explorer',
    category: 'System',
    description: 'Akses pembacaan struktur berkas lokal, penulisan artefak kode, dan manajemen direktori proyek.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle']
  },
  {
    id: 'tool-git',
    name: 'Git Version Control Client',
    category: 'Developer',
    description: 'Pelacakan versi repositori, commit perubahan, percabangan branch, dan inspeksi diff.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-coding']
  },
  {
    id: 'tool-github',
    name: 'GitHub API & Issue Tracker',
    category: 'Developer',
    description: 'Integrasi penarikan issue, pengelolaan pull request, dan otomatisasi workflow CI/CD.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-coding']
  },
  {
    id: 'tool-terminal',
    name: 'Terminal Command Execution',
    category: 'Developer',
    description: 'Eksekusi utilitas build, unit testing runner, linting linter, dan manajemen container lokal.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-coding']
  },
  {
    id: 'tool-browser',
    name: 'Web Browser & Search Engine',
    category: 'General',
    description: 'Penelusuran dokumentasi online, validasi UI web, dan riset informasi referensi eksternal.',
    status: 'available',
    permissionLevel: 'read',
    compatibleDepartments: ['dept-coding', 'dept-trainer', 'dept-side-hustle']
  },
  {
    id: 'tool-db',
    name: 'Database Schema & Query Inspector',
    category: 'Developer',
    description: 'Konektor database relasional untuk verifikasi integritas skema tabel dan optimasi indeks data.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-coding']
  },
  {
    id: 'tool-pdf-gen',
    name: 'PDF Module Generator Engine',
    category: 'Document',
    description: 'Penyusunan dan rendering berkas format PDF untuk modul pelatihan materi K3.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-trainer']
  },
  {
    id: 'tool-ppt-gen',
    name: 'Presentation Slides Generator',
    category: 'Document',
    description: 'Pembuatan slide presentasi visual berstruktur dalam format PowerPoint (PPTX).',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-trainer']
  },
  {
    id: 'tool-calendar',
    name: 'Calendar & Schedule Organizer',
    category: 'Productivity',
    description: 'Pencatatan sesi training, reminder tenggat waktu task, dan jadwal koordinasi tim.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-trainer', 'dept-coding', 'dept-side-hustle']
  },
  {
    id: 'tool-market-trends',
    name: 'E-Commerce Marketplace Demand Analyzer',
    category: 'Analytics',
    description: 'Alat pemantau volume pencarian produk terlaris, rentang harga, dan tren penjualan kompetitor.',
    status: 'available',
    permissionLevel: 'read',
    compatibleDepartments: ['dept-side-hustle']
  },
  {
    id: 'tool-social-publisher',
    name: 'Social Media Publishing Suite',
    category: 'Marketing',
    description: 'Distribusi otomatis jadwal posting konten visual ke multi-platform media sosial.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-side-hustle']
  },
  {
    id: 'tool-video-creator',
    name: 'Short-Form Video Production Suite',
    category: 'Media',
    description: 'Pemotongan klip, penambahan subtitle dinamis, dan penyesuaian rasio 9:16 untuk video pendek promosi.',
    status: 'available',
    permissionLevel: 'write',
    compatibleDepartments: ['dept-side-hustle']
  }
]

export const mockEmployees: Employee[] = [
  // --- CODING EMPLOYEES (5) ---
  {
    id: 'emp-raka',
    name: 'Raka',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-planner',
    roleName: 'Asisten Manager / Planner',
    description: 'Koordinator teknis tim coding. Bertanggung jawab membedah requirement proyek menjadi task atomic dan mengarahkan ke specialist.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Project Owner',
    skills: [
      { skillId: 'skill-planning', skillName: 'Task Planning & Breakdown', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-writing-plans', skillName: 'Writing Implementation Plans', priority: 'P0', assignedAt: '2026-08-05' },
      { skillId: 'skill-brainstorming', skillName: 'Brainstorming & Ideation', priority: 'P1', assignedAt: '2026-08-05' },
      { skillId: 'skill-find-skills', skillName: 'Find Skills (Skill Discovery)', priority: 'P2', assignedAt: '2026-08-06' }
    ],
    toolIds: ['tool-fs', 'tool-github', 'tool-browser', 'tool-calendar'],
    permissions: ['project:read', 'task:create', 'task:update', 'task:assign'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-maya',
    name: 'Maya',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-uiux',
    roleName: 'UI/UX Frontend',
    description: 'Specialist antarmuka pengguna web. Membangun komponen UI modern berbasis Vue 3, token desain semantik, dan responsif.',
    status: 'Active',
    supervisorId: 'emp-raka',
    supervisorName: 'Raka (Planner)',
    skills: [
      { skillId: 'skill-frontend-dev', skillName: 'Frontend Development (Vue 3 / TS)', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-ui-ux-pro-max', skillName: 'UI/UX Pro Max Intelligence', priority: 'P1', assignedAt: '2026-08-06' },
      { skillId: 'skill-high-end-visual-design', skillName: 'High-End Visual Design', priority: 'P1', assignedAt: '2026-08-06' },
      { skillId: 'skill-brainstorming', skillName: 'Brainstorming & Ideation', priority: 'P2', assignedAt: '2026-08-07' }
    ],
    toolIds: ['tool-fs', 'tool-git', 'tool-terminal', 'tool-browser'],
    permissions: ['code:write', 'task:read', 'task:update'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-bima',
    name: 'Bima',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-backend',
    roleName: 'Backend API',
    description: 'Specialist backend services dan database architecture. Merancang REST API handal, migrasi data, dan business logic teruji.',
    status: 'Active',
    supervisorId: 'emp-raka',
    supervisorName: 'Raka (Planner)',
    skills: [
      { skillId: 'skill-backend-dev', skillName: 'REST API & Database Engineering', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-writing-plans', skillName: 'Writing Implementation Plans', priority: 'P1', assignedAt: '2026-08-05' },
      { skillId: 'skill-brainstorming', skillName: 'Brainstorming & Ideation', priority: 'P2', assignedAt: '2026-08-06' }
    ],
    toolIds: ['tool-fs', 'tool-git', 'tool-terminal', 'tool-db'],
    permissions: ['api:write', 'db:migrate', 'task:read', 'task:update'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-dimas',
    name: 'Dimas',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-qc',
    roleName: 'Quality Control',
    description: 'Quality Assurance specialist. Menguji fungsionalitas aplikasi, regression tests, dan validasi acceptance criteria sebelum rilis.',
    status: 'Active',
    supervisorId: 'emp-raka',
    supervisorName: 'Raka (Planner)',
    skills: [
      { skillId: 'skill-testing-qa', skillName: 'Quality Assurance & Regression Testing', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-writing-plans', skillName: 'Writing Implementation Plans', priority: 'P1', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-terminal', 'tool-browser', 'tool-github'],
    permissions: ['qa:approve', 'bug:report', 'task:read'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-ardi',
    name: 'Ardi',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-coding',
    departmentName: 'Coding',
    roleId: 'role-security',
    roleName: 'Security Control',
    description: 'Security engineer. Melakukan vulnerability assessment, OWASP compliance review, serta audit permissions dan sensitive credentials.',
    status: 'Active',
    supervisorId: 'emp-raka',
    supervisorName: 'Raka (Planner)',
    skills: [
      { skillId: 'skill-sec-review', skillName: 'Application Security Audit', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-writing-plans', skillName: 'Writing Implementation Plans', priority: 'P1', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-terminal', 'tool-fs', 'tool-browser'],
    permissions: ['security:audit', 'secret:inspect', 'task:read'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // --- TRAINER EMPLOYEES (3) ---
  {
    id: 'emp-naya',
    name: 'Naya',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-trainer',
    departmentName: 'Trainer',
    roleId: 'role-admin-trainer',
    roleName: 'Admin Trainer',
    description: 'Administrator pelatihan. Mengurus penyebaran undangan training, manajemen agenda, dan pengiriman berkas sertifikat.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Training Lead',
    skills: [
      { skillId: 'skill-planning', skillName: 'Task Planning & Breakdown', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-writing-plans', skillName: 'Writing Implementation Plans', priority: 'P1', assignedAt: '2026-08-05' },
      { skillId: 'skill-find-skills', skillName: 'Find Skills (Skill Discovery)', priority: 'P2', assignedAt: '2026-08-06' }
    ],
    toolIds: ['tool-calendar', 'tool-fs', 'tool-browser'],
    permissions: ['admin:schedule', 'certificate:issue', 'training:invite'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-rina',
    name: 'Rina',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
    departmentId: 'dept-trainer',
    departmentName: 'Trainer',
    roleId: 'role-researcher',
    roleName: 'Researcher Materi',
    description: 'Spesialis riset materi K3. Menelusuri regulasi terbaru, studi kasus keselamatan tambang, dan kurasi referensi ilmiah.',
    status: 'Active',
    supervisorId: undefined,
    supervisorName: 'Training Lead',
    skills: [
      { skillId: 'skill-safety-research', skillName: 'Mining & Industrial Safety Research (K3)', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-brainstorming', skillName: 'Brainstorming & Ideation', priority: 'P1', assignedAt: '2026-08-05' },
      { skillId: 'skill-find-skills', skillName: 'Find Skills (Skill Discovery)', priority: 'P2', assignedAt: '2026-08-06' },
      { skillId: 'skill-content-strategy', skillName: 'Inbound Content Strategy', priority: 'P2', assignedAt: '2026-08-08' }
    ],
    toolIds: ['tool-browser', 'tool-fs'],
    permissions: ['research:curate', 'doc:create'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-mila',
    name: 'Mila',
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
      { skillId: 'skill-doc-ppt', skillName: 'Module PDF & Slide PPT Authoring', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-high-end-visual-design', skillName: 'High-End Visual Design', priority: 'P1', assignedAt: '2026-08-06' },
      { skillId: 'skill-ui-ux-pro-max', skillName: 'UI/UX Pro Max Intelligence', priority: 'P1', assignedAt: '2026-08-06' },
      { skillId: 'skill-writing-plans', skillName: 'Writing Implementation Plans', priority: 'P2', assignedAt: '2026-08-07' }
    ],
    toolIds: ['tool-pdf-gen', 'tool-ppt-gen', 'tool-fs'],
    permissions: ['doc:generate', 'presentation:create'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },

  // --- SIDE HUSTLE EMPLOYEES (4) ---
  {
    id: 'emp-citra',
    name: 'Citra',
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
      { skillId: 'skill-copywriting', skillName: 'Conversion Copywriting', priority: 'P1', assignedAt: '2026-08-07' },
      { skillId: 'skill-marketing-psychology', skillName: 'Marketing Psychology Principles', priority: 'P1', assignedAt: '2026-08-07' },
      { skillId: 'skill-social-content', skillName: 'Social Media Content Strategy', priority: 'P2', assignedAt: '2026-08-08' }
    ],
    toolIds: ['tool-browser', 'tool-calendar'],
    permissions: ['customer:contact', 'sales:record'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-alya',
    name: 'Alya',
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
      { skillId: 'skill-content-strategy', skillName: 'Inbound Content Strategy', priority: 'P0', assignedAt: '2026-08-08' },
      { skillId: 'skill-social-content', skillName: 'Social Media Content Strategy', priority: 'P1', assignedAt: '2026-08-08' },
      { skillId: 'skill-marketing-psychology', skillName: 'Marketing Psychology Principles', priority: 'P1', assignedAt: '2026-08-07' },
      { skillId: 'skill-seo-audit', skillName: 'SEO Performance Audit', priority: 'P1', assignedAt: '2026-08-07' },
      { skillId: 'skill-ad-creative', skillName: 'Performance Ad Creative', priority: 'P2', assignedAt: '2026-08-08' },
      { skillId: 'skill-brainstorming', skillName: 'Brainstorming & Ideation', priority: 'P2', assignedAt: '2026-08-05' }
    ],
    toolIds: ['tool-browser', 'tool-social-publisher', 'tool-calendar'],
    permissions: ['campaign:create', 'copy:publish'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-rafi',
    name: 'Rafi',
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
      { skillId: 'skill-market-analysis', skillName: 'Market & Product Demand Analysis', priority: 'P0', assignedAt: '2026-08-01' },
      { skillId: 'skill-find-skills', skillName: 'Find Skills (Skill Discovery)', priority: 'P1', assignedAt: '2026-08-05' },
      { skillId: 'skill-brainstorming', skillName: 'Brainstorming & Ideation', priority: 'P1', assignedAt: '2026-08-05' },
      { skillId: 'skill-seo-audit', skillName: 'SEO Performance Audit', priority: 'P2', assignedAt: '2026-08-07' },
      { skillId: 'skill-content-strategy', skillName: 'Inbound Content Strategy', priority: 'P2', assignedAt: '2026-08-08' }
    ],
    toolIds: ['tool-market-trends', 'tool-browser'],
    permissions: ['market:analyze', 'product:recommend'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  },
  {
    id: 'emp-salsa',
    name: 'Salsa',
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
      { skillId: 'skill-copywriting', skillName: 'Conversion Copywriting', priority: 'P0', assignedAt: '2026-08-07' },
      { skillId: 'skill-high-end-visual-design', skillName: 'High-End Visual Design', priority: 'P1', assignedAt: '2026-08-06' },
      { skillId: 'skill-content-strategy', skillName: 'Inbound Content Strategy', priority: 'P1', assignedAt: '2026-08-08' },
      { skillId: 'skill-ui-ux-pro-max', skillName: 'UI/UX Pro Max Intelligence', priority: 'P2', assignedAt: '2026-08-06' },
      { skillId: 'skill-ad-creative', skillName: 'Performance Ad Creative', priority: 'P2', assignedAt: '2026-08-08' }
    ],
    toolIds: ['tool-video-creator', 'tool-social-publisher', 'tool-browser'],
    permissions: ['content:create', 'media:upload'],
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z'
  }
]

export const mockAssignments: TaskAssignment[] = []
export const mockAgentRuns: AgentRun[] = []
export const mockRunResults: RunResult[] = []
export const mockTaskReviews: TaskReview[] = []
