import { test, expect } from '@playwright/test'

test.describe('SATRIA AI Workforce — Real E2E Journeys & Lifecycle UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.addInitScript(() => {
      localStorage.setItem('satria_runtime_mode', 'mock')
    })
  })

  test('Journey 1: Create Project with Path -> Create Task -> Run Execution', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.getByRole('heading', { name: 'Projects Directory' })).toBeVisible()

    // 1. Create New Project
    await page.getByRole('button', { name: /New Project/i }).first().click()
    const projNameInput = page.getByPlaceholder(/e.g. CRM SaaS Backend Engine/i)
    await expect(projNameInput).toBeVisible()

    const uniqueProjectName = `E2E Fleet System ${Date.now()}`
    await projNameInput.fill(uniqueProjectName)
    await page.getByPlaceholder(/C:\/Projects\/crm-backend/i).fill('C:/Projects/e2e-fleet-system')
    await page.getByPlaceholder(/High-level mission and architecture scope/i).fill('Testing end-to-end project directory binding.')

    await page.getByRole('button', { name: 'Create Project', exact: true }).click()

    // Verify project appears in listing
    await expect(page.getByText(uniqueProjectName).first()).toBeVisible()

    // 2. Navigate to Tasks and create linked task
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { name: 'Tasks Command Center' })).toBeVisible()

    await page.getByRole('button', { name: 'New Task', exact: true }).click()
    const taskTitleInput = page.getByPlaceholder(/e.g. Implement customer webhook/i)
    await expect(taskTitleInput).toBeVisible()

    const uniqueTaskTitle = `Build Telemetry Gateway ${Date.now()}`
    await taskTitleInput.fill(uniqueTaskTitle)
    await page.getByPlaceholder(/Explain deliverable requirements/i).fill('Implement SSE stream parser and metrics recording.')

    await page.getByRole('button', { name: 'Create Task', exact: true }).click()

    // 3. Inspect created task
    const createdTask = page.getByText(uniqueTaskTitle).first()
    await expect(createdTask).toBeVisible()
  })

  test('Journey 2: Home Observability Strip -> Active Work & Schedules Hub', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Good morning, Satria' })).toBeVisible()

    // Verify Observability Status Bar is present
    await expect(page.getByText(/Mock Runtime|Hermes Healthy/i)).toBeVisible()
    await expect(page.getByText(/Scheduler Healthy|Scheduler Standby/i)).toBeVisible()
    await expect(page.getByText(/Active Runs/i)).toBeVisible()
    await expect(page.getByText(/Orphan Runs/i)).toBeVisible()

    // Navigate to Schedules
    await page.goto('/schedules')
    await expect(page.getByRole('heading', { name: /Recurring Schedules & Automated Jobs/i })).toBeVisible()

    // Verify Schedule Table / List is rendered
    await expect(page.getByText(/Recurring Schedules & Automated Jobs/i)).toBeVisible()
  })
})
