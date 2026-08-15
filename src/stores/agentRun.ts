import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  AgentRun,
  TaskAssignment,
  Employee,
  RunLogEntry
} from '../types'
import {
  MockAgentRunRepository,
  MockRunResultRepository,
  MockReviewRepository,
  MockEmployeeRepository,
  MockTaskRepository,
  MockProjectRepository,
  MockAssignmentRepository,
  MockMemoryRepository
} from '../repositories'
import { RuntimeFactory } from '../runtime/RuntimeFactory'
import type { AgentRunInput, RuntimeEvent, RuntimeMode, ApprovalRequest } from '../runtime/types'
import { VerificationEngine } from '../runtime/verification/VerificationEngine'
import { AcceptanceCriteriaRule } from '../runtime/verification/rules/AcceptanceCriteriaRule'
import { globalResultIngestor } from '../runtime/results/ResultIngestor'
import { useActivityStore } from './activity'
import { useNotificationStore } from './notification'

export const useAgentRunStore = defineStore('agentRun', () => {
  const runRepo = new MockAgentRunRepository()
  const resultRepo = new MockRunResultRepository()
  const reviewRepo = new MockReviewRepository()
  const employeeRepo = new MockEmployeeRepository()
  const taskRepo = new MockTaskRepository()
  const projectRepo = new MockProjectRepository()
  const assignmentRepo = new MockAssignmentRepository()
  const memoryRepo = new MockMemoryRepository()

  const runs = ref<AgentRun[]>([])
  const currentRun = ref<AgentRun | null>(null)
  const loading = ref<boolean>(false)
  const runtimeMode = ref<RuntimeMode>(RuntimeFactory.getDefaultMode())
  const pendingApprovals = ref<Record<string, ApprovalRequest>>({})
  const resolvingApprovals = ref<Record<string, boolean>>({})
  const retryFeedbackMap = ref<Record<string, string>>({})

  const activeRuns = computed(() =>
    runs.value.filter(
      (r) =>
        r.status === 'Running' ||
        r.status === 'Starting' ||
        r.status === 'Queued' ||
        r.status === 'Verifying'
    )
  )

  const completedRuns = computed(() => runs.value.filter((r) => r.status === 'Completed'))

  const failedRuns = computed(() => runs.value.filter((r) => r.status === 'Failed'))

  const waitingRuns = computed(() => runs.value.filter((r) => r.status === 'Waiting'))

  function setRuntimeMode(mode: RuntimeMode) {
    runtimeMode.value = mode
    RuntimeFactory.setDefaultMode(mode)
  }

  function getPendingApproval(runId: string): ApprovalRequest | undefined {
    return pendingApprovals.value[runId]
  }

  async function fetchRuns() {
    loading.value = true
    try {
      runs.value = await runRepo.getAll()
    } finally {
      loading.value = false
    }
  }

  async function fetchRunById(id: string) {
    loading.value = true
    try {
      const run = await runRepo.getById(id)
      currentRun.value = run || null
      return run
    } finally {
      loading.value = false
    }
  }

  async function fetchRunsByEmployee(employeeId: string) {
    return await runRepo.getByEmployeeId(employeeId)
  }

  async function fetchRunsByTask(taskId: string) {
    return await runRepo.getByTaskId(taskId)
  }

  async function createRun(assignment: TaskAssignment, attempt: number = 1): Promise<AgentRun> {
    const newRun = await runRepo.create({
      assignmentId: assignment.id,
      taskId: assignment.taskId,
      taskTitle: assignment.taskTitle,
      employeeId: assignment.employeeId,
      employeeName: assignment.employeeName,
      employeeAvatar: assignment.employeeAvatar,
      employeeRole: assignment.employeeRole,
      status: 'Running',
      currentStep: 'Initializing',
      progress: 5,
      attempt,
      logs: [
        {
          id: `log-${Date.now()}-init`,
          timestamp: new Date().toLocaleTimeString(),
          step: 'Initializing',
          message: `Digital employee ${assignment.employeeName} runtime initialized for task "${assignment.taskTitle}".`,
          level: 'info'
        }
      ],
      startedAt: new Date().toISOString()
    })

    runs.value.unshift(newRun)
    currentRun.value = newRun
    return newRun
  }

  async function startLiveRunner(runId: string) {
    const targetRun = runs.value.find((r) => r.id === runId)
    if (!targetRun) return

    // 1. Fetch Task
    const task = await taskRepo.getById(targetRun.taskId)

    // 2. Fetch Project
    const project = task ? await projectRepo.getById(task.projectId) : undefined

    // 3. Fetch Assignment & Employee
    const assignmentFromDb = await assignmentRepo.getById(targetRun.assignmentId)
    const employeeFromDb = await employeeRepo.getById(targetRun.employeeId)

    const employee: Employee = employeeFromDb || {
      id: targetRun.employeeId,
      name: targetRun.employeeName,
      roleId: 'role-dev',
      roleName: targetRun.employeeRole,
      departmentId: 'dept-eng',
      departmentName: 'Engineering',
      avatar: targetRun.employeeAvatar,
      status: 'Active',
      description: 'Digital workforce employee',
      skills: [],
      toolIds: [],
      permissions: ['task:execute'],
      createdAt: targetRun.startedAt,
      updatedAt: targetRun.startedAt
    }

    const assignment: TaskAssignment = assignmentFromDb || {
      id: targetRun.assignmentId,
      taskId: targetRun.taskId,
      taskTitle: targetRun.taskTitle,
      employeeId: targetRun.employeeId,
      employeeName: targetRun.employeeName,
      employeeAvatar: targetRun.employeeAvatar,
      employeeRole: targetRun.employeeRole,
      assignedBy: 'Lead Developer',
      skillIds: [],
      priority: 'High',
      status: 'In Progress',
      createdAt: targetRun.startedAt,
      updatedAt: targetRun.startedAt
    }

    // 4. Criteria from Task
    const resolvedCriteria: string[] =
      task?.acceptanceCriteria && task.acceptanceCriteria.length > 0
        ? task.acceptanceCriteria
        : task?.checklist && task.checklist.length > 0
        ? task.checklist.map((c) => c.title)
        : [`Deliverable output integrity for ${targetRun.taskTitle}`]

    // 5. Dynamic Workspace Path & Project Context (Strict: Task.pathOverride -> Project.path -> FAIL)
    const resolvedWorkspacePath = task?.pathOverride || project?.path
    if (!resolvedWorkspacePath || !resolvedWorkspacePath.trim()) {
      throw new Error(
        `Cannot start execution for task "${targetRun.taskTitle}": Workspace folder path is not configured. Please set the project path or task path override.`
      )
    }

    const retryFeedback = retryFeedbackMap.value[runId]
    const resolvedInstructions = retryFeedback
      ? `${assignment.instructions || ''}\n\n[REVISION / RETRY DIRECTIVE]:\n${retryFeedback}`.trim()
      : assignment.instructions

    // Phase 3.11: Dynamic Memory Recall Subsystem
    const recalledMemories = await memoryRepo.recall({
      workspaceId: 'ws-dev',
      employeeId: targetRun.employeeId,
      projectId: task?.projectId,
      queryText: targetRun.taskTitle,
      tags: task?.tags || [],
      limit: 5
    })

    targetRun.injectedMemories = recalledMemories
    await runRepo.update(runId, { injectedMemories: recalledMemories })

    const input: AgentRunInput = {
      runId,
      assignment,
      employee,
      skills: [],
      tools: [],
      workspacePath: resolvedWorkspacePath,
      projectContext: project
        ? {
            projectId: project.id,
            projectName: project.name,
            repositoryUrl: project.repositoryUrl,
            branch: project.branch
          }
        : undefined,
      taskPrompt: task?.description
        ? `${targetRun.taskTitle}\n\nTask Description:\n${task.description}`
        : targetRun.taskTitle,
      acceptanceCriteria: resolvedCriteria,
      instructions: resolvedInstructions,
      memories: recalledMemories
    }

    const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
    const activityStore = useActivityStore()
    const notificationStore = useNotificationStore()

    await runtime.start(input, async (event: RuntimeEvent) => {
      if (event.type === 'telemetry:updated') {
        if (event.telemetry) {
          targetRun.telemetry = event.telemetry
          await runRepo.update(runId, { telemetry: event.telemetry })
        }
      } else if (event.type === 'progress:updated') {
        if (event.progress !== undefined) targetRun.progress = event.progress
        if (event.step) targetRun.currentStep = event.step
        if (event.log) targetRun.logs.push(event.log)
        if (event.telemetry) targetRun.telemetry = event.telemetry
        await runRepo.update(runId, {
          progress: targetRun.progress,
          currentStep: targetRun.currentStep,
          telemetry: targetRun.telemetry
        })
      } else if (event.type === 'approval:required') {
        targetRun.status = 'Waiting'
        if (event.approvalRequest) {
          pendingApprovals.value[runId] = event.approvalRequest
          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Approval Required',
            message: `${targetRun.employeeName} requires human approval for ${event.approvalRequest.toolCall.toolName}.`,
            priority: 'important',
            category: 'Tasks',
            link: `/runs/${runId}`,
            read: false
          })
          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: targetRun.employeeName,
            action: 'updated',
            targetType: 'task',
            targetTitle: `Approval required for action: ${event.approvalRequest.toolCall.toolName}`
          })
        }
        if (event.log) targetRun.logs.push(event.log)
        if (event.telemetry) targetRun.telemetry = event.telemetry
        await runRepo.update(runId, { status: 'Waiting', telemetry: targetRun.telemetry })
      } else if (event.type === 'run:completed') {
        targetRun.status = 'Completed'
        targetRun.progress = 100
        targetRun.currentStep = 'Completing'
        targetRun.completedAt = new Date().toISOString()
        targetRun.durationSeconds = Math.max(
          1,
          Math.floor(
            (new Date(targetRun.completedAt).getTime() - new Date(targetRun.startedAt).getTime()) /
              1000
          )
        )
        if (event.telemetry) {
          targetRun.telemetry = event.telemetry
        }
        targetRun.outputSummary = `Run "${targetRun.taskTitle}" completed by ${targetRun.employeeName}. Pending verification and human review.`

        await runRepo.update(runId, {
          status: 'Completed',
          progress: 100,
          currentStep: 'Completing',
          completedAt: targetRun.completedAt,
          durationSeconds: targetRun.durationSeconds,
          outputSummary: targetRun.outputSummary,
          telemetry: targetRun.telemetry
        })

        // Phase 3.7: Real Result Ingestion & Verification Engine Pipeline
        const runtimeResult =
          event.result || globalResultIngestor.buildRuntimeResult(targetRun.id, 'Completed')

        const evaluatedCriteria = input.acceptanceCriteria && input.acceptanceCriteria.length > 0
          ? AcceptanceCriteriaRule.evaluateAgainstOutput(
              input.acceptanceCriteria,
              runtimeResult.output,
              runtimeResult.status
            )
          : [
              {
                name: 'Deliverable Output Integrity',
                passed: Boolean(runtimeResult.output && runtimeResult.output.trim().length > 0),
                details: runtimeResult.output?.trim().length > 0
                  ? 'Agent produced non-empty deliverable output.'
                  : 'Agent produced no output. Cannot verify deliverable.',
                mandatory: true
              }
            ]

        const verification = VerificationEngine.evaluate({
          runtimeResult,
          acceptanceCriteria: evaluatedCriteria,
          diffCount: runtimeResult.diffs?.length || 0,
          securityPassed: !runtimeResult.error?.toLowerCase().includes('sandbox')
        })

        const outputText =
          runtimeResult.output ||
          `### Deliverable Output — ${targetRun.taskTitle}\n- **Author:** ${targetRun.employeeName} (${targetRun.employeeRole})\n- **Status:** Execution completed\n- **Verification:** ${verification.summaryNotes}`

        await resultRepo.create({
          runId: targetRun.id,
          taskId: targetRun.taskId,
          assignmentId: targetRun.assignmentId,
          summary: runtimeResult.summary || targetRun.outputSummary,
          output: outputText,
          status:
            verification.status === 'Failed'
              ? 'failure'
              : verification.status === 'Warning'
                ? 'partial'
                : 'success',
          artifactIds: runtimeResult.artifactIds || [],
          diffs: runtimeResult.diffs,
          verificationStatus: verification.status,
          verificationNotes: verification.summaryNotes,
          verificationEvidence: verification.evidence
        })

        const reviewChecklist = verification.evidence.map((ev) => ({
          item: `${ev.name}: ${ev.details}`,
          completed: ev.passed
        }))

        const initialReviewStatus =
          verification.status === 'Failed' ? 'Changes Requested' : 'Pending'

        await reviewRepo.create({
          runId: targetRun.id,
          taskId: targetRun.taskId,
          taskTitle: targetRun.taskTitle,
          assignmentId: targetRun.assignmentId,
          employeeId: targetRun.employeeId,
          employeeName: targetRun.employeeName,
          reviewer: 'Satria Lead / Planner',
          status: initialReviewStatus,
          checklist:
            reviewChecklist.length > 0
              ? reviewChecklist
              : [
                  {
                    item: 'Acceptance criteria verification',
                    completed: verification.status === 'Passed'
                  }
                ]
        })

        if (verification.status === 'Passed') {
          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Review Required',
            message: `Deliverable for task "${targetRun.taskTitle}" is verified and ready for review.`,
            priority: 'important',
            category: 'Tasks',
            link: '/reviews',
            read: false
          })
          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: targetRun.employeeName,
            action: 'completed',
            targetType: 'task',
            targetTitle: `Completed execution run for "${targetRun.taskTitle}"`
          })
        } else {
          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Quality Gate Warning',
            message: `Run #${targetRun.id} completed with verification warnings: ${verification.summaryNotes}`,
            priority: 'important',
            category: 'Tasks',
            link: `/runs/${targetRun.id}`,
            read: false
          })
          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: targetRun.employeeName,
            action: 'updated',
            targetType: 'task',
            targetTitle: `Quality gate warning on Run #${targetRun.id}`
          })
        }

        // Phase 3.11: Synthesize episodic memory on completion
        try {
          await memoryRepo.create({
            workspaceId: 'ws-dev',
            employeeId: targetRun.employeeId,
            employeeName: targetRun.employeeName,
            projectId: task?.projectId,
            projectName: project?.name,
            runId: targetRun.id,
            type: 'episodic',
            scope: 'employee',
            title: `Successful Execution: ${targetRun.taskTitle}`,
            content: `Agent completed "${targetRun.taskTitle}" in ${targetRun.durationSeconds}s (Attempt #${targetRun.attempt}). Verification: ${verification.status} (${verification.score}% score). Deliverable: ${targetRun.outputSummary}`,
            tags: ['autonomous_run', 'success', targetRun.employeeRole.toLowerCase().replace(/\s+/g, '_')],
            confidence: 0.95,
            importance: 3,
            source: 'autonomous_run'
          })
        } catch (err) {
          console.warn('[agentRunStore] Memory write warning:', err)
        }
      } else if (event.type === 'run:cancelled') {
        targetRun.status = 'Cancelled'
        delete pendingApprovals.value[runId]
        await runRepo.update(runId, { status: 'Cancelled' })
      } else if (event.type === 'run:failed') {
        targetRun.status = 'Failed'
        targetRun.error = event.error || 'Execution failed.'
        delete pendingApprovals.value[runId]
        await runRepo.update(runId, { status: 'Failed', error: targetRun.error })

        await notificationStore.createNotification({
          workspaceId: 'ws-dev',
          title: 'Agent Run Failed',
          message: `Run #${runId} for "${targetRun.taskTitle}" failed: ${targetRun.error}`,
          priority: 'important',
          category: 'Tasks',
          link: `/runs/${runId}`,
          read: false
        })
        await activityStore.logActivity({
          workspaceId: 'ws-dev',
          actorName: targetRun.employeeName,
          action: 'updated',
          targetType: 'task',
          targetTitle: `Run #${runId} execution failed`
        })

        // Phase 3.11: Synthesize diagnostic feedback memory on failure
        try {
          await memoryRepo.create({
            workspaceId: 'ws-dev',
            employeeId: targetRun.employeeId,
            employeeName: targetRun.employeeName,
            projectId: task?.projectId,
            projectName: project?.name,
            runId: targetRun.id,
            type: 'feedback',
            scope: 'employee',
            title: `Execution Failure: ${targetRun.taskTitle}`,
            content: `Agent encountered error during attempt #${targetRun.attempt}: ${targetRun.error || 'Execution failed'}. Avoid repeating this failure condition.`,
            tags: ['autonomous_run', 'failure', 'error_diagnostic'],
            confidence: 0.9,
            importance: 4,
            source: 'autonomous_run'
          })
        } catch (err) {
          console.warn('[agentRunStore] Memory write warning:', err)
        }
      } else if (event.type === 'run:paused') {
        targetRun.status = 'Waiting'
        await runRepo.update(runId, { status: 'Waiting' })
      }
    })
  }

  async function startRunFromAssignment(assignment: TaskAssignment) {
    const run = await createRun(assignment, 1)
    await startLiveRunner(run.id)
    return run
  }

  function pauseRun(runId: string) {
    const run = runs.value.find((r) => r.id === runId)
    if (run) {
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      runtime.pause(runId)
      run.status = 'Waiting'
      runRepo.update(runId, { status: 'Waiting' })
    }
  }

  function resumeRun(runId: string) {
    const run = runs.value.find((r) => r.id === runId)
    if (run) {
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      runtime.resume(runId)
      run.status = 'Running'
      runRepo.update(runId, { status: 'Running' })
    }
  }

  function cancelRun(runId: string) {
    const run = runs.value.find((r) => r.id === runId)
    if (run) {
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      runtime.cancel(runId)
      run.status = 'Cancelled'
      delete pendingApprovals.value[runId]
      runRepo.update(runId, { status: 'Cancelled' })
    }
  }

  /**
   * Single Source of Truth for Retry Lifecycle Contract with Feedback Propagation
   */
  async function retryRun(runId: string, reviewerComment?: string) {
    const previousRun = runs.value.find((r) => r.id === runId)
    if (!previousRun) return null

    const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
    await runtime.cancel(runId)

    const nextAttempt = previousRun.attempt + 1
    const notificationStore = useNotificationStore()
    const activityStore = useActivityStore()

    if (nextAttempt > 3) {
      previousRun.status = 'Failed'
      previousRun.error = 'Max retry attempts (3) exceeded. Task is now waiting for human intervention.'
      await runRepo.update(runId, { status: 'Failed', error: previousRun.error })
      await taskRepo.update(previousRun.taskId, { status: 'Waiting' })

      await notificationStore.createNotification({
        workspaceId: 'ws-dev',
        title: 'Task Waiting — Max Retries Exceeded',
        message: `Task "${previousRun.taskTitle}" failed 3 consecutive retry attempts and is waiting for manual directive.`,
        priority: 'critical',
        category: 'Tasks',
        link: `/tasks`,
        read: false
      })
      await activityStore.logActivity({
        workspaceId: 'ws-dev',
        actorName: 'Self-Healing Engine',
        action: 'updated',
        targetType: 'task',
        targetTitle: `Task "${previousRun.taskTitle}" Blocked (Max Retries Exceeded)`
      })
      return previousRun
    }

    delete pendingApprovals.value[runId]

    if (reviewerComment) {
      // Phase 3.11: Persist reviewer directive into feedback memory
      try {
        const previousTask = await taskRepo.getById(previousRun.taskId)
        await memoryRepo.create({
          workspaceId: 'ws-dev',
          employeeId: previousRun.employeeId,
          employeeName: previousRun.employeeName,
          projectId: previousTask?.projectId,
          runId: previousRun.id,
          type: 'feedback',
          scope: 'employee',
          title: `Reviewer Revision Directive: ${previousRun.taskTitle}`,
          content: `Supervisor Directive on Attempt #${previousRun.attempt}: "${reviewerComment}". Apply this revision directive in all subsequent attempts.`,
          tags: ['reviewer_directive', 'revision', 'quality_gate'],
          confidence: 0.99,
          importance: 5,
          source: 'reviewer_feedback'
        })
      } catch (err) {
        console.warn('[agentRunStore] Retry memory write warning:', err)
      }
    }

    const retryMsg = reviewerComment
      ? `Retrying execution (Attempt #${nextAttempt}, parent: ${previousRun.id}). Feedback: ${reviewerComment}`
      : `Retrying execution (Attempt #${nextAttempt}, parent: ${previousRun.id}).`

    // Create fresh new Run record linked via parentRunId
    const newRun = await runRepo.create({
      assignmentId: previousRun.assignmentId,
      taskId: previousRun.taskId,
      taskTitle: previousRun.taskTitle,
      employeeId: previousRun.employeeId,
      employeeName: previousRun.employeeName,
      employeeAvatar: previousRun.employeeAvatar,
      employeeRole: previousRun.employeeRole,
      status: 'Running',
      currentStep: 'Initializing',
      progress: 5,
      attempt: nextAttempt,
      parentRunId: previousRun.id,
      logs: [
        {
          id: `log-${Date.now()}-retry`,
          timestamp: new Date().toLocaleTimeString(),
          step: 'Initializing',
          message: retryMsg,
          level: 'info'
        }
      ],
      startedAt: new Date().toISOString()
    })

    // Update task with activeRunId and latestRunId
    if (previousRun.taskId) {
      await taskRepo.update(previousRun.taskId, {
        status: 'In Progress',
        activeRunId: newRun.id,
        latestRunId: newRun.id
      })
    }

    if (reviewerComment) {
      retryFeedbackMap.value[newRun.id] = reviewerComment
    }

    runs.value.unshift(newRun)
    currentRun.value = newRun

    await notificationStore.createNotification({
      workspaceId: 'ws-dev',
      title: 'Retry Started',
      message: `Attempt #${nextAttempt} started for "${previousRun.taskTitle}" (Run #${newRun.id}).`,
      priority: 'normal',
      category: 'Tasks',
      link: `/runs/${newRun.id}`,
      read: false
    })

    await activityStore.logActivity({
      workspaceId: 'ws-dev',
      actorName: 'Lead Developer',
      action: 'updated',
      targetType: 'task',
      targetTitle: `Retried Run #${newRun.id} (Attempt #${nextAttempt}, parent #${previousRun.id})`
    })

    await startLiveRunner(newRun.id)
    return newRun
  }

  async function respondApproval(
    runId: string,
    approvalId: string,
    approved: boolean,
    feedback?: string
  ): Promise<boolean> {
    // Idempotency / Duplicate click protection
    if (resolvingApprovals.value[approvalId]) {
      return false
    }

    resolvingApprovals.value[approvalId] = true

    try {
      const targetRun = runs.value.find((r) => r.id === runId)
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      const activityStore = useActivityStore()
      const notificationStore = useNotificationStore()

      delete pendingApprovals.value[runId]
      await runtime.respondApproval(runId, approvalId, approved, feedback)

      if (targetRun) {
        if (approved) {
          targetRun.status = 'Running'
          await runRepo.update(runId, { status: 'Running' })

          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Approval Granted',
            message: `Run #${runId} resumed after user confirmed action.`,
            priority: 'normal',
            category: 'Tasks',
            link: `/runs/${runId}`,
            read: false
          })

          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: 'Lead Developer',
            action: 'updated',
            targetType: 'task',
            targetTitle: `Approved action for Run #${runId}`
          })
        } else {
          targetRun.status = 'Cancelled'
          await runRepo.update(runId, { status: 'Cancelled' })

          await notificationStore.createNotification({
            workspaceId: 'ws-dev',
            title: 'Approval Rejected',
            message: `Action for Run #${runId} was rejected: ${feedback || 'No feedback'}`,
            priority: 'important',
            category: 'Tasks',
            link: `/runs/${runId}`,
            read: false
          })

          await activityStore.logActivity({
            workspaceId: 'ws-dev',
            actorName: 'Lead Developer',
            action: 'updated',
            targetType: 'task',
            targetTitle: `Rejected action for Run #${runId}`
          })
        }
      }

      return true
    } finally {
      delete resolvingApprovals.value[approvalId]
    }
  }

  function getRunTelemetry(runId: string) {
    const target = runs.value.find((r) => r.id === runId) || (currentRun.value?.id === runId ? currentRun.value : null)
    return target?.telemetry
  }

  function getRunCost(runId: string): number | null | undefined {
    return getRunTelemetry(runId)?.estimatedCostUsd
  }

  function getRunDuration(runId: string): number {
    const target = runs.value.find((r) => r.id === runId) || (currentRun.value?.id === runId ? currentRun.value : null)
    if (!target) return 0
    if (target.durationSeconds) return target.durationSeconds
    if (target.telemetry?.durationMs) return Math.round(target.telemetry.durationMs / 1000)
    if (target.startedAt) {
      const end = target.completedAt ? new Date(target.completedAt).getTime() : Date.now()
      return Math.max(0, Math.floor((end - new Date(target.startedAt).getTime()) / 1000))
    }
    return 0
  }

  function getRunTokenUsage(runId: string): { total: number; prompt: number; completion: number; cached: number } | undefined {
    const telemetry = getRunTelemetry(runId)
    if (!telemetry) return undefined
    return {
      total: telemetry.totalTokens,
      prompt: telemetry.promptTokens,
      completion: telemetry.completionTokens,
      cached: telemetry.cachedTokens
    }
  }

  const totalTokensAllRuns = computed(() => {
    return runs.value.reduce((acc, r) => acc + (r.telemetry?.totalTokens || 0), 0)
  })

  const totalEstimatedCost = computed(() => {
    return runs.value.reduce((acc, r) => acc + (r.telemetry?.estimatedCostUsd || 0), 0)
  })

  const averageDurationSeconds = computed(() => {
    const completed = runs.value.filter((r) => r.status === 'Completed' && r.durationSeconds)
    if (completed.length === 0) return 0
    const totalSecs = completed.reduce((acc, r) => acc + (r.durationSeconds || 0), 0)
    return Math.round(totalSecs / completed.length)
  })

  async function stopRun(runId: string, reason = 'Stopped by owner', cancelTask = false) {
    const run = runs.value.find((r) => r.id === runId)
    if (run) {
      const runtime = RuntimeFactory.getRuntime(runtimeMode.value)
      await runtime.cancel(runId)
      const now = new Date().toISOString()
      run.status = 'Cancelled'
      run.cancelledAt = now
      run.cancelledBy = 'Owner'
      run.cancelReason = reason
      delete pendingApprovals.value[runId]
      await runRepo.update(runId, {
        status: 'Cancelled',
        cancelledAt: run.cancelledAt,
        cancelledBy: run.cancelledBy,
        cancelReason: run.cancelReason
      })

      // Update task status and clear active run
      const targetTaskStatus = cancelTask ? 'Cancelled' : 'Todo'
      await taskRepo.update(run.taskId, {
        status: targetTaskStatus,
        cancelledAt: cancelTask ? now : undefined,
        cancelledBy: cancelTask ? 'Owner' : undefined,
        cancelReason: cancelTask ? reason : undefined,
        activeRunId: undefined
      })

      const activityStore = useActivityStore()
      await activityStore.logActivity({
        workspaceId: 'ws-dev',
        actorName: 'Owner',
        action: 'updated',
        targetType: 'task',
        targetTitle: `Stopped execution Run #${runId}: ${reason}`
      })
    }
    return run
  }

  async function changeWorkerMidRun(
    runId: string,
    newEmployeeId: string,
    restartImmediately = true
  ): Promise<AgentRun | undefined> {
    const run = runs.value.find((r) => r.id === runId)
    if (!run) return undefined

    const newEmployee = await employeeRepo.getById(newEmployeeId)
    if (!newEmployee) return undefined

    const activityStore = useActivityStore()

    // 1. Update task assignee
    await taskRepo.update(run.taskId, {
      assigneeId: newEmployee.id,
      assigneeName: newEmployee.name,
      assigneeAvatar: newEmployee.avatar,
      workerId: newEmployee.id,
      workerName: newEmployee.name
    })

    if (restartImmediately) {
      // Cancel current run
      await stopRun(runId, `Replaced worker with ${newEmployee.name}`)

      // Create new assignment
      const newAssignment = await assignmentRepo.create({
        taskId: run.taskId,
        taskTitle: run.taskTitle,
        employeeId: newEmployee.id,
        employeeName: newEmployee.name,
        employeeAvatar: newEmployee.avatar,
        employeeRole: newEmployee.roleName,
        assignedBy: 'Owner',
        skillIds: newEmployee.skills.map((s) => s.skillId),
        priority: 'High',
        status: 'In Progress'
      })

      // Create new fresh run
      const freshRun = await runRepo.create({
        assignmentId: newAssignment.id,
        taskId: run.taskId,
        taskTitle: run.taskTitle,
        employeeId: newEmployee.id,
        employeeName: newEmployee.name,
        employeeAvatar: newEmployee.avatar,
        employeeRole: newEmployee.roleName,
        status: 'Running',
        currentStep: 'Initializing',
        progress: 5,
        attempt: 1,
        parentRunId: run.id,
        logs: [
          {
            id: `log-${Date.now()}-worker-switch`,
            timestamp: new Date().toLocaleTimeString(),
            step: 'Initializing',
            message: `Execution reassigned from ${run.employeeName} to ${newEmployee.name} by Owner.`,
            level: 'info'
          }
        ],
        startedAt: new Date().toISOString()
      })

      runs.value.unshift(freshRun)
      currentRun.value = freshRun

      await activityStore.logActivity({
        workspaceId: 'ws-dev',
        actorName: 'Owner',
        action: 'updated',
        targetType: 'task',
        targetTitle: `Changed worker from ${run.employeeName} to ${newEmployee.name} and restarted run`
      })

      await startLiveRunner(freshRun.id)
      return freshRun
    } else {
      await activityStore.logActivity({
        workspaceId: 'ws-dev',
        actorName: 'Owner',
        action: 'updated',
        targetType: 'task',
        targetTitle: `Assigned next execution to ${newEmployee.name}`
      })
      return run
    }
  }

  async function addInstructionMidRun(runId: string, additionalInstruction: string) {
    const run = runs.value.find((r) => r.id === runId)
    if (!run) return false

    const prevFeedback = retryFeedbackMap.value[runId] || ''
    retryFeedbackMap.value[runId] = `${prevFeedback}\n[OWNER INSTRUCTION]: ${additionalInstruction}`.trim()

    const logEntry: RunLogEntry = {
      id: `log-${Date.now()}-owner-instr`,
      timestamp: new Date().toLocaleTimeString(),
      step: 'Working',
      message: `Owner directive injected: "${additionalInstruction}"`,
      level: 'info'
    }

    run.logs.push(logEntry)
    await runRepo.addLog(runId, logEntry)

    const activityStore = useActivityStore()
    await activityStore.logActivity({
      workspaceId: 'ws-dev',
      actorName: 'Owner',
      action: 'updated',
      targetType: 'task',
      targetTitle: `Added mid-run instruction to Run #${runId}`
    })

    return true
  }

  async function deleteRun(runId: string, soft = true, reason = 'Run deleted') {
    if (soft) {
      await runRepo.softDelete(runId, 'Owner', reason)
    } else {
      await runRepo.delete(runId)
    }
    runs.value = runs.value.filter((r) => r.id !== runId)
    return true
  }

  return {
    runs,
    currentRun,
    loading,
    runtimeMode,
    pendingApprovals,
    activeRuns,
    completedRuns,
    failedRuns,
    waitingRuns,
    totalTokensAllRuns,
    totalEstimatedCost,
    averageDurationSeconds,
    setRuntimeMode,
    getPendingApproval,
    getRunTelemetry,
    getRunCost,
    getRunDuration,
    getRunTokenUsage,
    fetchRuns,
    fetchRunById,
    fetchRunsByEmployee,
    fetchRunsByTask,
    createRun,
    startRunFromAssignment,
    startLiveRunner,
    pauseRun,
    resumeRun,
    cancelRun,
    stopRun,
    changeWorkerMidRun,
    addInstructionMidRun,
    deleteRun,
    retryRun,
    respondApproval
  }
})

