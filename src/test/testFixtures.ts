import { dbClient } from '../database/DatabaseClient'
import * as seed from '../database/initialSeed'
import {
  mockWorkspaces,
  mockProjects,
  mockTasks,
  mockFiles,
  mockActivityLogs,
  mockNotifications,
  mockDepartments,
  mockEmployeeRoles,
  mockSkills,
  mockWorkforceTools,
  mockEmployees,
  mockAssignments,
  mockAgentRuns,
  mockRunResults,
  mockTaskReviews
} from '../mocks/mockData'

export function seedTestFixtures() {
  clearTestFixtures()

  const rawState = dbClient.getRawMemoryState()
  rawState.workspaces = JSON.parse(JSON.stringify(seed.initialWorkspaces))
  rawState.projects = JSON.parse(JSON.stringify(seed.initialProjects))
  rawState.tasks = JSON.parse(JSON.stringify(seed.initialTasks))
  rawState.files = JSON.parse(JSON.stringify(seed.initialFiles))
  rawState.activities = JSON.parse(JSON.stringify(seed.initialActivityLogs))
  rawState.notifications = JSON.parse(JSON.stringify(seed.initialNotifications))
  rawState.departments = JSON.parse(JSON.stringify(seed.initialDepartments))
  rawState.roles = JSON.parse(JSON.stringify(seed.initialEmployeeRoles))
  rawState.skills = JSON.parse(JSON.stringify(seed.initialSkills))
  rawState.tools = JSON.parse(JSON.stringify(seed.initialWorkforceTools))
  rawState.employees = JSON.parse(JSON.stringify(seed.initialEmployees))
  rawState.assignments = JSON.parse(JSON.stringify(seed.initialAssignments))
  rawState.agent_runs = JSON.parse(JSON.stringify(seed.initialAgentRuns))
  rawState.run_results = JSON.parse(JSON.stringify(seed.initialRunResults))
  rawState.task_reviews = JSON.parse(JSON.stringify(seed.initialTaskReviews))

  mockWorkspaces.push(...JSON.parse(JSON.stringify(seed.initialWorkspaces)))
  mockProjects.push(...JSON.parse(JSON.stringify(seed.initialProjects)))
  mockTasks.push(...JSON.parse(JSON.stringify(seed.initialTasks)))
  mockFiles.push(...JSON.parse(JSON.stringify(seed.initialFiles)))
  mockActivityLogs.push(...JSON.parse(JSON.stringify(seed.initialActivityLogs)))
  mockNotifications.push(...JSON.parse(JSON.stringify(seed.initialNotifications)))
  mockDepartments.push(...JSON.parse(JSON.stringify(seed.initialDepartments)))
  mockEmployeeRoles.push(...JSON.parse(JSON.stringify(seed.initialEmployeeRoles)))
  mockSkills.push(...JSON.parse(JSON.stringify(seed.initialSkills)))
  mockWorkforceTools.push(...JSON.parse(JSON.stringify(seed.initialWorkforceTools)))
  mockEmployees.push(...JSON.parse(JSON.stringify(seed.initialEmployees)))
  mockAssignments.push(...JSON.parse(JSON.stringify(seed.initialAssignments)))
  mockAgentRuns.push(...JSON.parse(JSON.stringify(seed.initialAgentRuns)))
  mockRunResults.push(...JSON.parse(JSON.stringify(seed.initialRunResults)))
  mockTaskReviews.push(...JSON.parse(JSON.stringify(seed.initialTaskReviews)))
}

export function clearTestFixtures() {
  const rawState = dbClient.getRawMemoryState()
  rawState.workspaces.length = 0
  rawState.projects.length = 0
  rawState.tasks.length = 0
  rawState.files.length = 0
  rawState.activities.length = 0
  rawState.notifications.length = 0
  rawState.departments.length = 0
  rawState.roles.length = 0
  rawState.skills.length = 0
  rawState.tools.length = 0
  rawState.employees.length = 0
  rawState.assignments.length = 0
  rawState.agent_runs.length = 0
  rawState.run_results.length = 0
  rawState.task_reviews.length = 0

  mockWorkspaces.length = 0
  mockProjects.length = 0
  mockTasks.length = 0
  mockFiles.length = 0
  mockActivityLogs.length = 0
  mockNotifications.length = 0
  mockDepartments.length = 0
  mockEmployeeRoles.length = 0
  mockSkills.length = 0
  mockWorkforceTools.length = 0
  mockEmployees.length = 0
  mockAssignments.length = 0
  mockAgentRuns.length = 0
  mockRunResults.length = 0
  mockTaskReviews.length = 0
}
