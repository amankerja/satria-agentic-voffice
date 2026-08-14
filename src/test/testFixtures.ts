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
import * as seed from './seedData'

export function seedTestFixtures() {
  clearTestFixtures()

  mockWorkspaces.push(...JSON.parse(JSON.stringify(seed.mockWorkspaces)))
  mockProjects.push(...JSON.parse(JSON.stringify(seed.mockProjects)))
  mockTasks.push(...JSON.parse(JSON.stringify(seed.mockTasks)))
  mockFiles.push(...JSON.parse(JSON.stringify(seed.mockFiles)))
  mockActivityLogs.push(...JSON.parse(JSON.stringify(seed.mockActivityLogs)))
  mockNotifications.push(...JSON.parse(JSON.stringify(seed.mockNotifications)))
  mockDepartments.push(...JSON.parse(JSON.stringify(seed.mockDepartments)))
  mockEmployeeRoles.push(...JSON.parse(JSON.stringify(seed.mockEmployeeRoles)))
  mockSkills.push(...JSON.parse(JSON.stringify(seed.mockSkills)))
  mockWorkforceTools.push(...JSON.parse(JSON.stringify(seed.mockWorkforceTools)))
  mockEmployees.push(...JSON.parse(JSON.stringify(seed.mockEmployees)))
  mockAssignments.push(...JSON.parse(JSON.stringify(seed.mockAssignments)))
  mockAgentRuns.push(...JSON.parse(JSON.stringify(seed.mockAgentRuns)))
  mockRunResults.push(...JSON.parse(JSON.stringify(seed.mockRunResults)))
  mockTaskReviews.push(...JSON.parse(JSON.stringify(seed.mockTaskReviews)))
}

export function clearTestFixtures() {
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
