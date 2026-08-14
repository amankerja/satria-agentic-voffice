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
