import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/auth/LoginPage.vue')
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('../pages/auth/OnboardingPage.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/overview/HomePage.vue')
  },
  {
    path: '/work',
    name: 'ActiveWork',
    component: () => import('../pages/work/ActiveWorkPage.vue')
  },
  {
    path: '/workspace',
    name: 'Workspace',
    component: () => import('../pages/workspace/WorkspacePage.vue')
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../pages/projects/ProjectsPage.vue')
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: () => import('../pages/projects/ProjectDetailPage.vue')
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../pages/tasks/TasksPage.vue')
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('../pages/tasks/TaskDetailPage.vue')
  },
  {
    path: '/schedules',
    name: 'Schedules',
    component: () => import('../pages/schedules/SchedulesPage.vue')
  },
  {
    path: '/content',
    name: 'ContentHub',
    component: () => import('../pages/content/ContentHubPage.vue')
  },
  {
    path: '/integrations',
    name: 'IntegrationsHub',
    component: () => import('../pages/integrations/IntegrationsHubPage.vue')
  },
  {
    path: '/memory',
    name: 'MemoryHub',
    component: () => import('../pages/memory/MemoryHubPage.vue')
  },
  {
    path: '/evaluation',
    name: 'EvaluationLab',
    component: () => import('../pages/workforce/EvaluationLabPage.vue')
  },
  {
    path: '/workflows',
    name: 'WorkflowBuilder',
    component: () => import('../pages/workflow/WorkflowBuilderPage.vue')
  },
  {
    path: '/delegation',
    name: 'DelegationHub',
    component: () => import('../pages/workforce/DelegationHubPage.vue')
  },
  {
    path: '/webhooks',
    name: 'WebhookGateway',
    component: () => import('../pages/webhooks/WebhookGatewayPage.vue')
  },
  {
    path: '/workers',
    redirect: '/workforce/employees'
  },
  {
    path: '/workers/:id',
    redirect: (to: any) => `/workforce/employees/${to.params.id}`
  },
  {
    path: '/files',
    name: 'Files',
    component: () => import('../pages/files/FilesPage.vue')
  },
  {
    path: '/activity',
    name: 'Activity',
    component: () => import('../pages/activity/ActivityCenterPage.vue')
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: () => import('../pages/calendar/CalendarPage.vue')
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../pages/reports/ReportsPage.vue')
  },
  {
    path: '/governance',
    name: 'CostGovernance',
    component: () => import('../pages/governance/GovernanceDashboardPage.vue')
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../pages/notifications/NotificationsPage.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../pages/settings/SettingsPage.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../pages/settings/SettingsPage.vue')
  },
  // --- WORKFORCE PHASE 1 ROUTES ---
  {
    path: '/workforce',
    name: 'WorkforceOverview',
    component: () => import('../pages/workforce/WorkforceOverviewPage.vue')
  },
  {
    path: '/workforce/departments',
    name: 'WorkforceDepartments',
    component: () => import('../pages/workforce/DepartmentsPage.vue')
  },
  {
    path: '/workforce/departments/:id',
    name: 'WorkforceDepartmentDetail',
    component: () => import('../pages/workforce/DepartmentDetailPage.vue')
  },
  {
    path: '/workforce/employees',
    name: 'WorkforceEmployees',
    component: () => import('../pages/workforce/EmployeesPage.vue')
  },
  {
    path: '/workforce/employees/new',
    name: 'WorkforceCreateEmployee',
    component: () => import('../pages/workforce/CreateEmployeePage.vue')
  },
  {
    path: '/workforce/employees/:id',
    name: 'WorkforceEmployeeDetail',
    component: () => import('../pages/workforce/EmployeeDetailPage.vue')
  },
  {
    path: '/workforce/skills',
    name: 'WorkforceSkills',
    component: () => import('../pages/workforce/SkillsPage.vue')
  },
  {
    path: '/workforce/tools',
    name: 'WorkforceTools',
    component: () => import('../pages/workforce/ToolsPage.vue')
  },
  {
    path: '/workforce/assignments',
    name: 'WorkforceAssignments',
    component: () => import('../pages/workforce/AssignmentsPage.vue')
  },
  {
    path: '/assignments',
    redirect: '/workforce/assignments'
  },
  // --- PHASE 2: RUNS & REVIEWS ROUTES ---
  {
    path: '/runs',
    name: 'AgentRuns',
    component: () => import('../pages/runs/RunsPage.vue')
  },
  {
    path: '/runs/:id',
    name: 'AgentRunDetail',
    component: () => import('../pages/runs/RunDetailPage.vue')
  },
  {
    path: '/reviews',
    name: 'TaskReviews',
    component: () => import('../pages/reviews/ReviewsPage.vue')
  },
  {
    path: '/design-system',
    name: 'DesignSystem',
    component: () => import('../pages/DesignSystemPage.vue')
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFoundPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
