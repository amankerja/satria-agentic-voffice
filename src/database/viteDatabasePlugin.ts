import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import {
  initialWorkspaces,
  initialProjects,
  initialTasks,
  initialDepartments,
  initialEmployeeRoles,
  initialSkills,
  initialWorkforceTools,
  initialEmployees,
  initialAssignments,
  initialAgentRuns,
  initialRunResults,
  initialTaskReviews,
  initialFiles,
  initialActivityLogs,
  initialNotifications,
  initialUser,
  initialUserSettings
} from './initialSeed'

export function viteDatabasePlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data')
  const dbFilePath = path.resolve(dataDir, 'database.json')

  function getInitialDbState() {
    return {
      workspaces: initialWorkspaces,
      projects: initialProjects,
      tasks: initialTasks,
      departments: initialDepartments,
      roles: initialEmployeeRoles,
      skills: initialSkills,
      tools: initialWorkforceTools,
      employees: initialEmployees,
      assignments: initialAssignments,
      agent_runs: initialAgentRuns,
      run_results: initialRunResults,
      task_reviews: initialTaskReviews,
      files: initialFiles,
      activities: initialActivityLogs,
      notifications: initialNotifications,
      user_profile: initialUser,
      user_settings: initialUserSettings
    }
  }

  function ensureDbFile(): any {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    if (!fs.existsSync(dbFilePath)) {
      const initial = getInitialDbState()
      fs.writeFileSync(dbFilePath, JSON.stringify(initial, null, 2), 'utf-8')
      return initial
    }
    try {
      const content = fs.readFileSync(dbFilePath, 'utf-8')
      return JSON.parse(content)
    } catch {
      const initial = getInitialDbState()
      fs.writeFileSync(dbFilePath, JSON.stringify(initial, null, 2), 'utf-8')
      return initial
    }
  }

  return {
    name: 'vite-plugin-satria-database',
    configureServer(server) {
      // Ensure file exists on server startup
      ensureDbFile()

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/db')) {
          return next()
        }

        const url = req.url

        if (url === '/api/db/sync' && req.method === 'GET') {
          const state = ensureDbFile()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(state))
          return
        }

        if (url === '/api/db/sync' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true })
              }
              fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, timestamp: new Date().toISOString() }))
            } catch (err: any) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        if (url === '/api/db/reset' && req.method === 'POST') {
          const initial = getInitialDbState()
          fs.writeFileSync(dbFilePath, JSON.stringify(initial, null, 2), 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, message: 'Database reset to initial seed' }))
          return
        }

        next()
      })
    }
  }
}
