#!/usr/bin/env node

/**
 * ============================================================================
 * SATRIA AI WORKFORCE — Unified CLI & Service Command Center
 * ============================================================================
 * File: satria-cli.mjs
 * Purpose: 
 *   - Start & Stop Vite Web App (5173), Hermes Gateway (8642), 9Router (20128)
 *   - Live health check & port diagnostics
 *   - Real-time agent task monitoring (active tasks, digital employee, progress)
 *   - Deep error diagnostics & logs inspector
 *   - Combined live log stream
 * ============================================================================
 */

import { spawn, execSync, exec } from 'child_process'
import http from 'http'
import net from 'net'
import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ----------------------------------------------------------------------------
// Color Tokens & ANSI Helpers
// ----------------------------------------------------------------------------
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Bright / High Contrast
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background Colors
  bgDark: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
  bgGray: '\x1b[100m'
}

// ----------------------------------------------------------------------------
// Service Definitions & State
// ----------------------------------------------------------------------------
const SERVICES = {
  vite: {
    id: 'vite',
    name: 'SATRIA Web App',
    shortName: 'Vite UI',
    port: 5173,
    host: 'localhost',
    command: 'npm',
    args: ['run', 'dev'],
    healthUrl: 'http://localhost:5173/',
    color: c.brightCyan
  },
  hermes: {
    id: 'hermes',
    name: 'Hermes Agent Gateway',
    shortName: 'Hermes',
    port: 8642,
    host: '127.0.0.1',
    command: 'hermes',
    args: ['gateway'],
    healthUrl: 'http://127.0.0.1:8642/health',
    color: c.brightGreen
  },
  router: {
    id: 'router',
    name: '9Router LLM Proxy',
    shortName: '9Router',
    port: 20128,
    host: '127.0.0.1',
    command: '9router',
    args: ['--tray', '--no-browser'],
    healthUrl: 'http://127.0.0.1:20128/v1/models',
    color: c.brightMagenta
  }
}

const childProcesses = {
  vite: null,
  hermes: null,
  router: null
}

const logBuffers = {
  vite: [],
  hermes: [],
  router: [],
  combined: []
}

const MAX_LOG_HISTORY = 300

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------
function pushLog(source, text, isError = false) {
  const lines = text.toString().split(/\r?\n/).filter(line => line.trim().length > 0)
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false })

  for (const line of lines) {
    const entry = {
      timestamp,
      source,
      text: line,
      isError
    }

    if (logBuffers[source]) {
      logBuffers[source].push(entry)
      if (logBuffers[source].length > MAX_LOG_HISTORY) logBuffers[source].shift()
    }

    logBuffers.combined.push(entry)
    if (logBuffers.combined.length > MAX_LOG_HISTORY) logBuffers.combined.shift()
  }
}

function checkPort(port, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let isConnected = false

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => {
      isConnected = true
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })

    socket.connect(port, host)
  })
}

function fetchHttp(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url)
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'Connection': 'close',
        'User-Agent': 'Satria-CLI'
      },
      timeout: timeoutMs
    }

    const req = http.get(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          data
        })
      })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({ ok: false, status: 0, error: 'TIMEOUT' })
    })

    req.on('error', (err) => {
      resolve({ ok: false, status: 0, error: err.message })
    })
  })
}

function getPidOnPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
    const lines = output.split('\n')
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && !isNaN(parseInt(pid, 10))) {
          return parseInt(pid, 10)
        }
      }
    }
  } catch {
    // Port not found or no process listening
  }
  return null
}

function killPid(pid) {
  if (!pid) return false
  try {
    execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function readDatabase() {
  const dbPath = path.resolve(process.cwd(), 'data', 'database.json')
  try {
    if (!fs.existsSync(dbPath)) return null
    const raw = fs.readFileSync(dbPath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    return { error: err.message }
  }
}

function openBrowser(url) {
  const platform = process.platform
  let cmd
  if (platform === 'darwin') {
    cmd = `open "${url}"`
  } else if (platform === 'win32') {
    cmd = `start "" "${url}"`
  } else {
    cmd = `xdg-open "${url}"`
  }
  exec(cmd, { windowsHide: true }, () => {})
}

// ----------------------------------------------------------------------------
// Process Management
// ----------------------------------------------------------------------------
async function startService(key, streamToConsole = false) {
  const svc = SERVICES[key]
  if (!svc) return false

  const isLive = await checkPort(svc.port, svc.host)
  if (isLive) {
    const pid = getPidOnPort(svc.port)
    console.log(`${c.brightYellow}ℹ  [${svc.name}] sudah aktif di port ${svc.port}${pid ? ` (PID: ${pid})` : ''}.${c.reset}`)
    if (key === 'vite') {
      console.log(`${c.brightCyan}🌐 Membuka browser: http://localhost:${svc.port}...${c.reset}`)
      openBrowser(`http://localhost:${svc.port}`)
    }
    return true
  }

  console.log(`${c.brightCyan}⏳ Memulai [${svc.name}]...${c.reset}`)

  try {
    const child = spawn(svc.command, svc.args, {
      cwd: process.cwd(),
      shell: true,
      windowsHide: false,
      env: {
        ...process.env,
        API_SERVER_KEY: process.env.API_SERVER_KEY || 'satria-local-dev'
      }
    })

    childProcesses[key] = child

    child.stdout.on('data', (data) => {
      const txt = data.toString()
      pushLog(key, txt, false)
      if (streamToConsole) {
        process.stdout.write(`${svc.color}[${svc.shortName}]${c.reset} ${txt}`)
      }
    })

    child.stderr.on('data', (data) => {
      const txt = data.toString()
      pushLog(key, txt, true)
      if (streamToConsole) {
        process.stderr.write(`${c.brightRed}[${svc.shortName} ERR]${c.reset} ${txt}`)
      }
    })

    child.on('error', (err) => {
      pushLog(key, `Process failed to start: ${err.message}`, true)
      console.log(`${c.brightRed}❌ Gagal menjalankan ${svc.name}: ${err.message}${c.reset}`)
    })

    child.on('close', (code) => {
      pushLog(key, `Process exited with code ${code}`, code !== 0)
      childProcesses[key] = null
    })

    // Wait a brief moment to check if port opened
    let attempts = 0
    while (attempts < 15) {
      await new Promise(r => setTimeout(r, 400))
      const online = await checkPort(svc.port, svc.host)
      if (online) {
        const pid = getPidOnPort(svc.port)
        console.log(`${c.brightGreen}✅ [${svc.name}] BERHASIL AKTIF di http://${svc.host}:${svc.port}${pid ? ` (PID: ${pid})` : ''}${c.reset}`)
        if (key === 'vite') {
          console.log(`${c.brightCyan}🌐 Membuka browser: http://localhost:${svc.port}...${c.reset}`)
          openBrowser(`http://localhost:${svc.port}`)
        }
        return true
      }
      attempts++
    }

    console.log(`${c.brightYellow}⚠️  [${svc.name}] proses telah di-spawn (PID: ${child.pid}). Menunggu port ${svc.port}...${c.reset}`)
    return true
  } catch (err) {
    console.log(`${c.brightRed}❌ Gagal menjalankan command ${svc.command}: ${err.message}${c.reset}`)
    return false
  }
}

async function stopService(key) {
  const svc = SERVICES[key]
  if (!svc) return

  console.log(`${c.gray}Menghentikan [${svc.name}]...${c.reset}`)

  if (childProcesses[key]) {
    try {
      childProcesses[key].kill()
    } catch {}
    childProcesses[key] = null
  }

  const pid = getPidOnPort(svc.port)
  if (pid) {
    const killed = killPid(pid)
    if (killed) {
      console.log(`${c.brightGreen}✅ [${svc.name}] dimatikan (Port ${svc.port}, PID ${pid}).${c.reset}`)
    } else {
      console.log(`${c.brightRed}❌ Gagal menghentikan PID ${pid} untuk ${svc.name}.${c.reset}`)
    }
  } else {
    console.log(`${c.gray}ℹ [${svc.name}] sudah tidak berjalan di port ${svc.port}.${c.reset}`)
  }
}

async function stopAllServices() {
  console.log(`\n${c.brightYellow}${c.bold}🛑 Menghentikan seluruh service SATRIA...${c.reset}`)
  await stopService('vite')
  await stopService('hermes')
  await stopService('router')
  console.log(`${c.brightGreen}✨ Seluruh service telah dihentikan.${c.reset}\n`)
}

async function startAllServices(streamLogs = false) {
  console.log(`\n${c.brightCyan}${c.bold}🚀 MEMULAI SELURUH INFRASTRUKTUR SATRIA AI WORKFORCE...${c.reset}`)
  console.log(`${c.gray}------------------------------------------------------------${c.reset}`)

  // 1. Start 9Router
  await startService('router', streamLogs)
  // 2. Start Hermes Gateway
  await startService('hermes', streamLogs)
  // 3. Start Vite App
  await startService('vite', streamLogs)

  console.log(`${c.gray}------------------------------------------------------------${c.reset}`)
  console.log(`${c.brightGreen}${c.bold}✨ SATRIA AI WORKFORCE SIAP DIGUNAKAN!${c.reset}`)
  console.log(`   🔗 Web App:       ${c.brightCyan}http://localhost:5173${c.reset}`)
  console.log(`   🔗 Hermes:        ${c.brightGreen}http://127.0.0.1:8642/health${c.reset}`)
  console.log(`   🔗 9Router:       ${c.brightMagenta}http://127.0.0.1:20128/v1/models${c.reset}\n`)
}

// ----------------------------------------------------------------------------
// Health Status & Diagnostic Views
// ----------------------------------------------------------------------------
async function getOverallHealth() {
  const results = {}

  for (const [key, svc] of Object.entries(SERVICES)) {
    const portOpen = await checkPort(svc.port, svc.host, 500)
    const pid = portOpen ? getPidOnPort(svc.port) : null
    let httpOk = false
    let httpDetail = ''

    if (portOpen && svc.healthUrl) {
      const res = await fetchHttp(svc.healthUrl, 2500)
      httpOk = res.ok
      if (res.ok) {
        try {
          const parsed = JSON.parse(res.data)
          if (parsed.version) httpDetail = `v${parsed.version}`
          else if (parsed.data && Array.isArray(parsed.data)) httpDetail = `${parsed.data.length} models loaded`
        } catch {
          httpDetail = 'HTTP 200 OK'
        }
      } else {
        httpDetail = `HTTP ${res.status || 'Err'}`
      }
    }

    results[key] = {
      name: svc.name,
      shortName: svc.shortName,
      port: svc.port,
      host: svc.host,
      isLive: portOpen,
      pid,
      httpOk,
      httpDetail,
      color: svc.color
    }
  }

  return results
}

function renderProgressBar(progress, length = 20) {
  const safeP = Math.max(0, Math.min(100, Math.round(progress || 0)))
  const filled = Math.round((safeP / 100) * length)
  const empty = length - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return `[${c.brightGreen}${bar}${c.reset}] ${safeP}%`
}

function renderStatusBadge(status) {
  switch (status) {
    case 'Running':
      return `${c.bgBlue}${c.brightWhite} RUNNING ${c.reset}`
    case 'Completed':
      return `${c.bgGreen}${c.brightWhite} COMPLETED ${c.reset}`
    case 'Failed':
      return `${c.bgRed}${c.brightWhite} FAILED ${c.reset}`
    case 'AwaitingApproval':
      return `${c.bgYellow}${c.black} APPROVAL REQUIRED ${c.reset}`
    case 'Blocked':
      return `${c.bgRed}${c.brightWhite} BLOCKED ${c.reset}`
    case 'Rejected':
      return `${c.bgRed}${c.brightWhite} REJECTED ${c.reset}`
    case 'Queued':
      return `${c.bgGray}${c.brightWhite} QUEUED ${c.reset}`
    default:
      return `${c.gray}[${status || 'Unknown'}]${c.reset}`
  }
}

async function printStatusScreen() {
  const health = await getOverallHealth()
  const db = readDatabase()

  console.log(`\n${c.bold}========================================================================${c.reset}`)
  console.log(`${c.brightCyan}${c.bold}  🛡️  SATRIA AI WORKFORCE — SYSTEM & SERVICE HEALTH DASHBOARD${c.reset}`)
  console.log(`${c.bold}========================================================================${c.reset}\n`)

  console.log(`${c.bold}📡 SERVICE STATUS:${c.reset}`)
  for (const [key, item] of Object.entries(health)) {
    const statusDot = item.isLive ? `${c.brightGreen}● ONLINE ${c.reset}` : `${c.brightRed}○ OFFLINE${c.reset}`
    const pidStr = item.pid ? `${c.gray}(PID: ${item.pid})${c.reset}` : ''
    const detailStr = item.httpDetail ? `${c.brightCyan}[${item.httpDetail}]${c.reset}` : ''
    console.log(`  ${statusDot}  ${item.color}${item.name.padEnd(24)}${c.reset} Port ${c.bold}${item.port.toString().padEnd(6)}${c.reset} ${detailStr.padEnd(20)} ${pidStr}`)
  }

  console.log(`\n${c.bold}💾 DATABASE & WORKSPACE:${c.reset}`)
  if (db && !db.error) {
    const wsCount = db.workspaces ? db.workspaces.length : 0
    const taskCount = db.tasks ? db.tasks.length : 0
    const empCount = db.employees ? db.employees.length : 0
    const runsCount = db.agent_runs ? db.agent_runs.length : 0
    console.log(`  📁 Workspaces: ${c.brightCyan}${wsCount}${c.reset}  |  Tasks: ${c.brightCyan}${taskCount}${c.reset}  |  Digital Employees: ${c.brightCyan}${empCount}${c.reset}  |  Total Agent Runs: ${c.brightCyan}${runsCount}${c.reset}`)
  } else {
    console.log(`  ${c.brightRed}⚠️  Database file: ${db?.error || 'Tidak ditemukan (data/database.json)'}${c.reset}`)
  }
  console.log('')
}

async function printTaskMonitor() {
  const db = readDatabase()
  console.log(`\n${c.bold}========================================================================${c.reset}`)
  console.log(`${c.brightCyan}${c.bold}  🤖 REAL-TIME DIGITAL AGENT TASK & EXECUTION MONITOR${c.reset}`)
  console.log(`${c.bold}========================================================================${c.reset}\n`)

  if (!db || db.error || !db.agent_runs || db.agent_runs.length === 0) {
    console.log(`${c.gray}Belum ada riwayat atau task agent yang aktif di database.${c.reset}\n`)
    return
  }

  const runs = [...db.agent_runs].reverse()

  const activeRuns = runs.filter(r => r.status === 'Running' || r.status === 'AwaitingApproval' || r.status === 'Queued')
  const completedRuns = runs.filter(r => r.status === 'Completed')
  const failedRuns = runs.filter(r => r.status === 'Failed' || r.status === 'Blocked' || r.status === 'Rejected')

  console.log(`${c.bold}📊 RINGKASAN TASK:${c.reset}  ${c.brightBlue}Aktif: ${activeRuns.length}${c.reset}  |  ${c.brightGreen}Selesai: ${completedRuns.length}${c.reset}  |  ${c.brightRed}Gagal/Error: ${failedRuns.length}${c.reset}\n`)

  if (activeRuns.length > 0) {
    console.log(`${c.brightCyan}${c.bold}▶ SEDANG BERJALAN / MEMERLUKAN TINDAKAN:${c.reset}`)
    for (const run of activeRuns) {
      console.log(`${c.gray}------------------------------------------------------------${c.reset}`)
      console.log(`  ${renderStatusBadge(run.status)} ${c.bold}${run.taskTitle || run.taskId}${c.reset}`)
      console.log(`  👤 Assigned: ${c.brightCyan}${run.employeeName || 'Agent'}${c.reset} (${run.employeeRole || 'Digital Worker'}) | Run ID: ${c.gray}${run.id}${c.reset}`)
      console.log(`  ⚡ Step:     ${c.brightYellow}${run.currentStep || 'In Progress'}${c.reset} | Percobaan: #${run.attempt || 1}`)
      console.log(`  📈 Progress: ${renderProgressBar(run.progress)}`)

      // Latest logs
      if (run.logs && run.logs.length > 0) {
        console.log(`  📜 Log Terakhir:`)
        const latestLogs = run.logs.slice(-3)
        for (const l of latestLogs) {
          const levelColor = l.level === 'error' ? c.brightRed : l.level === 'warn' ? c.brightYellow : c.gray
          console.log(`     ${c.gray}[${l.timestamp}]${c.reset} ${levelColor}[${l.step}]${c.reset} ${l.message}`)
        }
      }
    }
    console.log('')
  }

  console.log(`${c.bold}📋 RIWAYAT RUN TERAKHIR (Top 5):${c.reset}`)
  for (const run of runs.slice(0, 5)) {
    const dateStr = run.startedAt ? new Date(run.startedAt).toLocaleTimeString('id-ID') : '-'
    console.log(`  • ${renderStatusBadge(run.status)} ${c.bold}${run.taskTitle?.slice(0, 38) || run.taskId}${c.reset} (${run.employeeName}) - ${run.currentStep} [${run.progress}%] ${c.gray}@${dateStr}${c.reset}`)
  }
  console.log('')
}

async function printErrorDiagnostics() {
  const db = readDatabase()
  console.log(`\n${c.bold}========================================================================${c.reset}`)
  console.log(`${c.brightRed}${c.bold}  🔍 DIAGNOSTIK ERROR & ANALISIS KEGAGALAN AGENT${c.reset}`)
  console.log(`${c.bold}========================================================================${c.reset}\n`)

  if (!db || db.error || !db.agent_runs) {
    console.log(`${c.gray}Tidak dapat membaca database untuk diagnostik.${c.reset}\n`)
    return
  }

  const failedRuns = db.agent_runs.filter(r => r.status === 'Failed' || r.status === 'Blocked' || r.status === 'Rejected' || (r.logs && r.logs.some(l => l.level === 'error')))

  if (failedRuns.length === 0) {
    console.log(`${c.brightGreen}✅ Luar biasa! Tidak ada task yang berstatus Failed atau mengalami error fatal.${c.reset}\n`)
    return
  }

  console.log(`${c.brightYellow}Ditemukan ${failedRuns.length} task dengan catatan error/kegagalan:${c.reset}\n`)

  for (const run of failedRuns) {
    console.log(`${c.bgRed}${c.brightWhite} ERROR CASE ${c.reset} ${c.bold}${run.taskTitle} (ID: ${run.id})${c.reset}`)
    console.log(`  👤 Agent:   ${run.employeeName} (${run.employeeRole})`)
    console.log(`  📌 Status:  ${renderStatusBadge(run.status)} | Gagal pada step: ${c.brightRed}${run.currentStep}${c.reset}`)
    console.log(`  ⏱ Waktu:   ${run.updatedAt || run.startedAt || '-'}`)

    const errorLogs = (run.logs || []).filter(l => l.level === 'error')
    if (errorLogs.length > 0) {
      console.log(`  🚨 ${c.bold}Pesan Error Terdeteksi:${c.reset}`)
      for (const errLog of errorLogs) {
        console.log(`     ${c.brightRed}✖ [${errLog.timestamp}] [${errLog.step}] ${errLog.message}${c.reset}`)
      }
    }

    if (run.error) {
      console.log(`  ⚠️  ${c.bold}Detail:${c.reset} ${c.brightYellow}${run.error}${c.reset}`)
    }

    // Auto Diagnosis Suggestion
    console.log(`  💡 ${c.brightCyan}${c.bold}Saran Pemecahan Masalah:${c.reset}`)
    const allMsg = (run.logs || []).map(l => l.message).join(' ') + ' ' + (run.error || '')
    if (allMsg.includes('ECONNREFUSED') || allMsg.includes('Failed to fetch') || allMsg.includes('8642')) {
      console.log(`     👉 Hermes Gateway (port 8642) belum berjalan atau terblokir firewall. Jalankan ${c.bold}satria hermes${c.reset} atau pilih Menu [3].`)
    } else if (allMsg.includes('20128') || allMsg.includes('model') || allMsg.includes('Provider')) {
      console.log(`     👉 9Router / Local LLM (port 20128) belum aktif atau model ID belum diunduh. Jalankan ${c.bold}satria 9router${c.reset} atau periksa tab Settings > AI Runtime.`)
    } else if (allMsg.includes('approval') || allMsg.includes('rejected')) {
      console.log(`     👉 Perubahan tool sensitif ditolak pada human-in-the-loop approval gate.`)
    } else {
      console.log(`     👉 Periksa konfigurasi API Key dan Provider di halaman Settings Web UI (/settings > AI Agent Runtime).`)
    }
    console.log(`${c.gray}------------------------------------------------------------${c.reset}\n`)
  }
}

function streamCombinedLogs() {
  console.log(`\n${c.bold}========================================================================${c.reset}`)
  console.log(`${c.brightCyan}${c.bold}  📜 LIVE COMBINED LOGS (Tekan Ctrl+C untuk kembali)${c.reset}`)
  console.log(`${c.bold}========================================================================${c.reset}\n`)

  if (logBuffers.combined.length === 0) {
    console.log(`${c.gray}Belum ada log aktif. Service log akan otomatis muncul di sini saat berjalan...${c.reset}\n`)
  } else {
    for (const entry of logBuffers.combined.slice(-40)) {
      const color = entry.isError ? c.brightRed : entry.source === 'vite' ? c.brightCyan : entry.source === 'hermes' ? c.brightGreen : c.brightMagenta
      console.log(`${c.gray}[${entry.timestamp}]${c.reset} ${color}[${entry.source.toUpperCase()}]${c.reset} ${entry.text}`)
    }
  }
}

// ----------------------------------------------------------------------------
// Interactive CLI Menu Loop
// ----------------------------------------------------------------------------
function printBanner() {
  console.clear()
  console.log(`${c.brightGreen}${c.bold}`)
  console.log(`  ███████╗ █████╗ ████████╗██████╗ ██╗ █████╗     █████╗ ██╗`)
  console.log(`  ██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██║██╔══██╗   ██╔══██╗██║`)
  console.log(`  ███████╗███████║   ██║   ██████╔╝██║███████║   ███████║██║`)
  console.log(`  ╚════██║██╔══██║   ██║   ██╔══██╗██║██╔══██║   ██╔══██║██║`)
  console.log(`  ███████║██║  ██║   ██║   ██║  ██║██║██║  ██║██╗██║  ██║██║`)
  console.log(`  ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝`)
  console.log(`             DIGITAL WORKFORCE COMMAND CENTER${c.reset}`)
  console.log(`${c.gray}  ====================================================================${c.reset}`)
}

async function showInteractiveMenu() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const ask = (query) => new Promise(resolve => rl.question(query, resolve))

  while (true) {
    printBanner()
    await printStatusScreen()

    console.log(`${c.bold}🎮 PILIHAN MENU:${c.reset}`)
    console.log(`  ${c.brightGreen}[1]${c.reset} 🚀 ${c.bold}Start ALL Services${c.reset} (9Router + Hermes + Vite Web UI)`)
    console.log(`  ${c.brightCyan}[2]${c.reset} 🌐 Start Vite Web App Only (${c.gray}npm run dev - port 5173${c.reset})`)
    console.log(`  ${c.brightGreen}[3]${c.reset} 🧠 Start Hermes Gateway Only (${c.gray}hermes gateway - port 8642${c.reset})`)
    console.log(`  ${c.brightMagenta}[4]${c.reset} ⚡ Start 9Router Proxy Only (${c.gray}9router - port 20128${c.reset})`)
    console.log(`  ${c.brightRed}[5]${c.reset} 🛑 Stop ALL Services (Kill ports 5173, 8642, 20128)`)
    console.log(`  ${c.brightYellow}[6]${c.reset} 📋 Live Agent Task Monitor (Running tasks & progress)`)
    console.log(`  ${c.brightRed}[7]${c.reset} 🔍 Error Diagnostics & Run Inspector (Lihat error & penyebab)`)
    console.log(`  ${c.brightWhite}[8]${c.reset} 📜 Combined Service Logs Buffer`)
    console.log(`  ${c.gray}[9]${c.reset} 🔄 Reset Database to Initial Seed`)
    console.log(`  ${c.gray}[0]${c.reset} 🚪 Keluar / Exit`)
    console.log('')

    const choice = (await ask(`${c.brightCyan}${c.bold}SATRIA ❯ ${c.reset}`)).trim()

    if (choice === '1') {
      await startAllServices(false)
      await ask(`\n${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '2') {
      await startService('vite', false)
      await ask(`\n${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '3') {
      await startService('hermes', false)
      await ask(`\n${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '4') {
      await startService('router', false)
      await ask(`\n${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '5') {
      await stopAllServices()
      await ask(`\n${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '6') {
      console.clear()
      await printTaskMonitor()
      await ask(`${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '7') {
      console.clear()
      await printErrorDiagnostics()
      await ask(`${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '8') {
      console.clear()
      streamCombinedLogs()
      await ask(`\n${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '9') {
      const confirm = await ask(`${c.brightYellow}Apakah Anda yakin ingin me-reset database ke seed awal? (y/N): ${c.reset}`)
      if (confirm.toLowerCase() === 'y') {
        const res = await fetchHttp('http://localhost:5173/api/db/reset', 2000)
        console.log(res.ok ? `${c.brightGreen}✅ Database berhasil di-reset.${c.reset}` : `${c.brightRed}⚠️ Gagal reset via API. Pastikan Vite berjalan.${c.reset}`)
      }
      await ask(`\n${c.gray}Tekan [Enter] untuk kembali ke menu...${c.reset}`)
    } else if (choice === '0' || choice.toLowerCase() === 'exit' || choice.toLowerCase() === 'q') {
      console.log(`\n${c.brightGreen}Terima kasih telah menggunakan SATRIA AI WORKFORCE. Sampai jumpa!${c.reset}\n`)
      rl.close()
      process.exit(0)
    }
  }
}

// ----------------------------------------------------------------------------
// CLI Direct Argument Dispatcher
// ----------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2)
  const cmd = args[0]?.toLowerCase()

  if (!cmd || cmd === 'menu' || cmd === 'gui' || cmd === 'dashboard') {
    await showInteractiveMenu()
    return
  }

  switch (cmd) {
    case 'start':
    case 'up':
    case 'all':
      await startAllServices(true)
      // Keep alive if streaming
      setInterval(() => {}, 1000)
      break

    case 'dev':
    case 'vite':
    case 'ui':
      await startService('vite', true)
      setInterval(() => {}, 1000)
      break

    case 'hermes':
    case 'gateway':
      await startService('hermes', true)
      setInterval(() => {}, 1000)
      break

    case '9router':
    case 'router':
      await startService('router', true)
      setInterval(() => {}, 1000)
      break

    case 'stop':
    case 'down':
    case 'kill':
      await stopAllServices()
      process.exit(0)
      break

    case 'status':
    case 'health':
    case 'check':
      await printStatusScreen()
      process.exit(0)
      break

    case 'tasks':
    case 'task':
    case 'runs':
      await printTaskMonitor()
      process.exit(0)
      break

    case 'errors':
    case 'error':
    case 'diag':
    case 'diagnose':
      await printErrorDiagnostics()
      process.exit(0)
      break

    case 'logs':
    case 'log':
      streamCombinedLogs()
      process.exit(0)
      break

    case 'help':
    case '--help':
    case '-h':
      console.log(`
${c.brightGreen}${c.bold}SATRIA AI WORKFORCE CLI — Usage Guide${c.reset}

  ${c.bold}Perintah Cepat:${c.reset}
    ${c.brightCyan}node satria-cli.mjs${c.reset}              Buka Interactive Terminal Dashboard (Menu)
    ${c.brightCyan}node satria-cli.mjs start${c.reset}        Jalankan SEMUA service (9Router + Hermes + Vite)
    ${c.brightCyan}node satria-cli.mjs stop${c.reset}         Hentikan semua service yang berjalan
    ${c.brightCyan}node satria-cli.mjs status${c.reset}       Cek status koneksi & health port (5173, 8642, 20128)
    ${c.brightCyan}node satria-cli.mjs tasks${c.reset}        Monitor task yang sedang berjalan, progress & agent
    ${c.brightCyan}node satria-cli.mjs errors${c.reset}       Lihat rincian error, step kegagalan & saran solusi
    ${c.brightCyan}node satria-cli.mjs dev${c.reset}          Jalankan Vite Web App saja
    ${c.brightCyan}node satria-cli.mjs hermes${c.reset}       Jalankan Hermes Gateway saja
    ${c.brightCyan}node satria-cli.mjs 9router${c.reset}      Jalankan 9Router LLM proxy saja
`)
      process.exit(0)
      break

    default:
      console.log(`${c.brightRed}Perintah '${cmd}' tidak dikenali.${c.reset} Jalankan ${c.brightCyan}node satria-cli.mjs help${c.reset} untuk melihat daftar perintah.`)
      process.exit(1)
  }
}

// Global process exception safety
process.on('SIGINT', async () => {
  console.log(`\n${c.brightYellow}Menerima sinyal interrupt (Ctrl+C). Menutup CLI...${c.reset}`)
  process.exit(0)
})

main().catch((err) => {
  console.error(`${c.brightRed}Fatal Error: ${err.message}${c.reset}`)
  process.exit(1)
})
