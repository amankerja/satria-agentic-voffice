import { test, expect } from '@playwright/test'

test.describe('SATRIA AI Workforce — End-to-End Golden Path', () => {
  test('Complete Golden Path: Overview -> Quick Dispatch -> Tasks -> Assign -> Runs -> Approval -> Reviews -> Governance', async ({ page }) => {
    // Set viewport size for desktop command center view
    await page.setViewportSize({ width: 1280, height: 800 })

    // Set mock runtime mode so simulation executes deterministically
    await page.addInitScript(() => {
      localStorage.setItem('satria_runtime_mode', 'mock')
    })

    // ----------------------------------------------------
    // STEP 1: Overview & Quick AI Workforce Dispatch
    // ----------------------------------------------------
    await page.goto('/')
    await expect(page).toHaveTitle(/SATRIA/i)
    await expect(page.getByRole('heading', { name: 'Good morning, Satria' })).toBeVisible()

    // Use Quick Dispatch Bar to launch a live agent run
    const quickPromptInput = page.getByRole('textbox', { name: /Prompt text for AI Workforce Dispatch/i })
    await quickPromptInput.scrollIntoViewIfNeeded()
    await expect(quickPromptInput).toBeVisible()
    await quickPromptInput.fill('Audit backend architecture tokens and verify security sandbox boundaries.')

    const launchBtn = page.getByRole('button', { name: /Launch & Execute/i })
    await expect(launchBtn).toBeVisible()
    await launchBtn.click()

    // ----------------------------------------------------
    // STEP 2: Tasks Command Center (Create & Inspect Task)
    // ----------------------------------------------------
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { name: 'Tasks Command Center' })).toBeVisible()

    // Open Create Task Drawer
    await page.getByRole('button', { name: 'New Task', exact: true }).click()
    const taskTitleInput = page.getByPlaceholder(/e.g. Implement customer webhook/i)
    await expect(taskTitleInput).toBeVisible()

    // Fill Task form
    const uniqueTaskTitle = `E2E Workforce Task ${Date.now()}`
    await taskTitleInput.fill(uniqueTaskTitle)
    await page.getByPlaceholder(/Explain deliverable requirements/i).fill('Automated task for end-to-end workforce assignment and quality gate review.')
    
    // Save Task
    await page.getByRole('button', { name: 'Create Task', exact: true }).click()

    // Verify task is visible in task list
    const createdTaskRow = page.getByText(uniqueTaskTitle).first()
    await expect(createdTaskRow).toBeVisible()

    // Click task row to open Task Detail
    await createdTaskRow.click()
    await expect(page.getByText(uniqueTaskTitle).first()).toBeVisible()

    // ----------------------------------------------------
    // STEP 3: Agent Execution Center & Approval Gate Inspection
    // ----------------------------------------------------
    await page.goto('/runs')
    await expect(page.getByRole('heading', { name: 'Agent Execution Center' })).toBeVisible()

    // Inspect first active / historical run
    const inspectBtn = page.getByRole('button', { name: /Inspect/i }).first()
    if (await inspectBtn.isVisible()) {
      await inspectBtn.click()

      // Verify Run Detail components
      await expect(page.getByText(/Execution Lifecycle Stage/i)).toBeVisible()
      await expect(page.getByRole('log', { name: /Real-time execution log stream/i })).toBeVisible()

      // If Approval Gate is waiting, approve it
      const approveBtn = page.getByRole('button', { name: /Approve Action|Approve & Continue/i })
      if (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await approveBtn.click()
        await expect(page.getByText(/Approved/i).first()).toBeVisible()
      }
    }

    // ----------------------------------------------------
    // STEP 4: Verification & Quality Review Hub
    // ----------------------------------------------------
    await page.goto('/reviews')
    await expect(page.getByRole('heading', { name: 'Reviews & Verification Hub' })).toBeVisible()

    // Open first review
    const reviewActionBtn = page.getByRole('button', { name: /Review & Approve|View Decision/i }).first()
    if (await reviewActionBtn.isVisible()) {
      await reviewActionBtn.click()
      const reviewDrawer = page.getByRole('dialog', { name: /Review Work:/i })
      await expect(reviewDrawer).toBeVisible()

      // Verify Quality Gate & Deliverable Diff sections
      await expect(page.getByRole('region', { name: 'Deliverable Output' })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Acceptance Criteria Checklist' })).toBeVisible()

      // Perform Approval
      const approveDeliverableBtn = page.getByRole('button', { name: /Approve & Complete Task/i })
      if (await approveDeliverableBtn.isVisible()) {
        await approveDeliverableBtn.click()
      }
    }

    // ----------------------------------------------------
    // STEP 5: Executive Cost & Governance Dashboard
    // ----------------------------------------------------
    await page.goto('/governance')
    await expect(page.getByRole('heading', { name: 'Cost & Governance Dashboard' })).toBeVisible()
    await expect(page.getByText(/Financial & Token Spend/i)).toBeVisible()
    await expect(page.getByText(/Verification Pass Rate/i).first()).toBeVisible()
    await expect(page.getByText(/Reliability & Retry Rate/i)).toBeVisible()
    await expect(page.getByText(/Human-in-the-Loop & Safety/i)).toBeVisible()
    await expect(page.getByText(/Quality Gate Evidence Matrix/i)).toBeVisible()
  })
})
