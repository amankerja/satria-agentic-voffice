#!/usr/bin/env node

/**
 * ============================================================================
 * SATRIA AI WORKFORCE — Unified CLI & Enterprise Command Center  v3.0
 * ============================================================================
 * File: satria-cli.mjs
 * Purpose:
 *   - Service Orchestration: Vite Web App (5173), Hermes Gateway (8642), 9Router (20128)
 *   - Task Dispatcher & Runner: Create, dispatch, trigger, and manage agent runs
 *   - Human-in-the-Loop Governance: Approve & reject approval gate requests
 *   - Real-time Observability: Live task monitor, dynamic watch mode (top), logs
 *   - Financial & Telemetry Ledger: Token usage, multi-model pricing, ROI breakdown
 *   - Diagnostics & System Health: Satria Doctor, pre-flight checks, backup & restore
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

// ────────────────────────────────────────────────────────────────────────────
// Color Tokens & ANSI Styling
// ────────────────────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  strikethrough: '\x1b[9m',

  // Standard Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // High-Contrast Bright Colors
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
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgGray: '\x1b[100m',
  bgBrightGreen: '\x1b[102m',
  bgBrightRed: '\x1b[101m',
  bgBrightYellow: '\x1b[103m',
  bgBrightBlue: '\x1b[104m',
}

// ────────────────────────────────────────────────────────────────────────────
// Box Drawing & Layout Helpers
// ────────────────────────────────────────────────────────────────────────────
const box = {
  tl: '╭', tr: '╮', bl: '╰', br: '╯',
  h: '─', v: '│',
  ltee: '├', rtee: '┤',
  cross: '┼', ttee: '┬', btee: '┴',
}

function stripAnsi(str) {
  return str ? str.replace(/\x1b\[[0-9;]*m/g, '') : ''
}

function visLen(str) {
  return stripAnsi(str).length
}

function padRight(str, width) {
  const vl = visLen(str)
  if (vl >= width) return str
  return str + ' '.repeat(width - vl)
}

function padCenter(str, width) {
  const vl = visLen(str)
  if (vl >= width) return str
  const left = Math.floor((width - vl) / 2)
  const right = width - vl - left
  return ' '.repeat(left) + str + ' '.repeat(right)
}

function truncate(str, maxLen) {
  if (!str) return ''
  const clean = stripAnsi(str)
  if (clean.length <= maxLen) return str
  return clean.slice(0, maxLen - 1) + '…'
}

function drawBox(title, lines, width = 76, titleColor = c.brightCyan) {
  const inner = width - 2
  const output = []
  const titleText = title ? ` ${title} ` : ''
  const titleVisLen = titleText.length
  if (titleText) {
    const remaining = inner - titleVisLen
    const leftPad = 2
    const rightPad = remaining - leftPad
    output.push(`${c.gray}${box.tl}${box.h.repeat(leftPad)}${c.reset}${titleColor}${c.bold}${titleText}${c.reset}${c.gray}${box.h.repeat(Math.max(0, rightPad))}${box.tr}${c.reset}`)
  } else {
    output.push(`${c.gray}${box.tl}${box.h.repeat(inner)}${box.tr}${c.reset}`)
  }

  for (const line of lines) {
    if (line === '---') {
      output.push(`${c.gray}${box.ltee}${box.h.repeat(inner)}${box.rtee}${c.reset}`)
    } else {
      const padded = padRight(line, inner)
      output.push(`${c.gray}${box.v}${c.reset} ${padded}${c.gray}${box.v}${c.reset}`)
    }
  }
  output.push(`${c.gray}${box.bl}${box.h.repeat(inner)}${box.br}${c.reset}`)
  return output.join('\n')
}

// ────────────────────────────────────────────────────────────────────────────
// Service Definitions
// ────────────────────────────────────────────────────────────────────────────
const SERVICES = {
  vite: {
    id: 'vite',
    name: 'SATRIA Web App',
    shortName: 'Vite UI',
    emoji: '🌐',
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
    emoji: '🧠',
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
    emoji: '⚡',
    port: 20128,
    host: '127.0.0.1',
    command: '9router',
    args: ['--tray', '--no-browser'],
    healthUrl: 'http://127.0.0.1:20128/v1/models',
    color: c.brightMagenta
  }
}

const childProcesses = { vite: null, hermes: null, router: null }
const logBuffers = { vite: [], hermes: [], router: [], combined: [] }
const MAX_LOG_HISTORY = 300

// ────────────────────────────────────────────────────────────────────────────
// Model Pricing Table & Currency
// ────────────────────────────────────────────────────────────────────────────
const USD_TO_IDR = 16300

const MODEL_PRICING = {
  'claude-3-5-sonnet-20241022': { promptPer1M: 3.0, completionPer1M: 15.0, cachedPer1M: 0.3 },
  'claude-3-haiku-20240307':    { promptPer1M: 0.25, completionPer1M: 1.25, cachedPer1M: 0.03 },
  'gpt-4o':                     { promptPer1M: 2.5, completionPer1M: 10.0, cachedPer1M: 1.25 },
  'gpt-4o-mini':                { promptPer1M: 0.15, completionPer1M: 0.6, cachedPer1M: 0.075 },
  'hermes-3-llama-3.1-8b':      { promptPer1M: 0.2, completionPer1M: 0.2, cachedPer1M: 0.05 },
  'hermes-3-llama-3.1-70b':     { promptPer1M: 0.8, completionPer1M: 0.8, cachedPer1M: 0.2 },
  'hermes-3-llama-3.1-405b':    { promptPer1M: 2.0, completionPer1M: 2.0, cachedPer1M: 0.5 },
  'fast-work-free':             { promptPer1M: 0.0, completionPer1M: 0.0, cachedPer1M: 0.0 },
  'mock-agent-simulation-v1':   { promptPer1M: 0.0, completionPer1M: 0.0, cachedPer1M: 0.0 }
}

function calculateRunCost(telemetry) {
  if (!telemetry) return 0
  if (telemetry.estimatedCostUsd !== undefined && telemetry.estimatedCostUsd !== null) {
    return telemetry.estimatedCostUsd
  }
  const model = telemetry.model || 'hermes-3-llama-3.1-70b'
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['hermes-3-llama-3.1-70b']
  const promptTokens = (telemetry.promptTokens || 0) - (telemetry.cachedTokens || 0)
  const cachedTokens = telemetry.cachedTokens || 0
  const completionTokens = telemetry.completionTokens || 0

  const promptCost = (promptTokens / 1_000_000) * pricing.promptPer1M
  const cachedCost = (cachedTokens / 1_000_000) * (pricing.cachedPer1M || 0)
  const compCost = (completionTokens / 1_000_000) * pricing.completionPer1M
  return promptCost + cachedCost + compCost
}

// ────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────────────────────────────────────────
function pushLog(source, text, isError = false) {
  const lines = text.toString().split(/\r?\n/).filter(line => line.trim().length > 0)
  const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false })

  for (const line of lines) {
    const entry = { timestamp, source, text: line, isError }
    if (logBuffers[source]) {
      logBuffers[source].push(entry)
      if (logBuffers[source].length > MAX_LOG_HISTORY) logBuffers[source].shift()
    }
    logBuffers.combined.push(entry)
    if (logBuffers.combined.length > MAX_LOG_HISTORY) logBuffers.combined.shift()
  }
}

function checkPort(port, host = '127.0.0.1', timeoutMs = 700) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => { socket.destroy(); resolve(true) })
    socket.once('timeout', () => { socket.destroy(); resolve(false) })
    socket.once('error', () => { socket.destroy(); resolve(false) })
    socket.connect(port, host)
  })
}

function fetchHttp(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url)
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: { 'Connection': 'close', 'User-Agent': 'Satria-CLI/3.0' },
        timeout: timeoutMs
      }
      const req = http.get(options, (res) => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, data })
        })
      })
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, error: 'TIMEOUT' }) })
      req.on('error', (err) => { resolve({ ok: false, status: 0, error: err.message }) })
    } catch (err) {
      resolve({ ok: false, status: 0, error: err.message })
    }
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
        if (pid && !isNaN(parseInt(pid, 10))) return parseInt(pid, 10)
      }
    }
  } catch {}
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

function getDatabasePath() {
  return path.resolve(process.cwd(), 'data', 'database.json')
}

function readDatabase() {
  const dbPath = getDatabasePath()
  try {
    if (!fs.existsSync(dbPath)) return null
    const raw = fs.readFileSync(dbPath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    return { error: err.message }
  }
}

function writeDatabase(db) {
  const dbPath = getDatabasePath()
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')
    return true
  } catch (err) {
    console.log(`  ${c.brightRed}✖ Gagal menulis database: ${err.message}${c.reset}`)
    return false
  }
}

function openBrowser(url) {
  const platform = process.platform
  let cmd = platform === 'darwin' ? `open "${url}"` : platform === 'win32' ? `start "" "${url}"` : `xdg-open "${url}"`
  exec(cmd, { windowsHide: true }, () => {})
}

function timeAgo(dateStr) {
  if (!dateStr) return '-'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  if (isNaN(diffMs) || diffMs < 0) return dateStr
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTokens(count) {
  if (!count || count <= 0) return '0'
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return count.toString()
}

function formatCurrency(usd) {
  if (!usd || usd <= 0) return '$0.00 (Rp0)'
  const formattedUsd = `$${usd.toFixed(4)}`
  const idr = Math.round(usd * USD_TO_IDR)
  const formattedIdr = `Rp${idr.toLocaleString('id-ID')}`
  return `${formattedUsd} (${formattedIdr})`
}

// ────────────────────────────────────────────────────────────────────────────
// Visual Badges
// ────────────────────────────────────────────────────────────────────────────
function renderProgressBar(progress, length = 20) {
  const safeP = Math.max(0, Math.min(100, Math.round(progress || 0)))
  const filled = Math.round((safeP / 100) * length)
  const empty = length - filled
  let color = c.brightGreen
  if (safeP < 30) color = c.brightRed
  else if (safeP < 60) color = c.brightYellow
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return `${color}${bar}${c.reset} ${c.bold}${safeP}%${c.reset}`
}

function renderRunStatusBadge(status) {
  const badges = {
    'Running':          `${c.bgBlue}${c.brightWhite}${c.bold} ▶ RUNNING ${c.reset}`,
    'Starting':         `${c.bgCyan}${c.black}${c.bold} ⏳ STARTING ${c.reset}`,
    'Queued':           `${c.bgGray}${c.brightWhite} ◌ QUEUED ${c.reset}`,
    'Waiting':          `${c.bgYellow}${c.black} ⏸ WAITING ${c.reset}`,
    'Verifying':        `${c.bgMagenta}${c.brightWhite} 🔍 VERIFYING ${c.reset}`,
    'Completed':        `${c.bgBrightGreen}${c.black}${c.bold} ✔ COMPLETED ${c.reset}`,
    'Failed':           `${c.bgBrightRed}${c.brightWhite}${c.bold} ✖ FAILED ${c.reset}`,
    'Cancelled':        `${c.bgGray}${c.brightWhite} ◼ CANCELLED ${c.reset}`,
    'AwaitingApproval': `${c.bgBrightYellow}${c.black}${c.bold} ⚠ APPROVAL REQ ${c.reset}`,
    'Blocked':          `${c.bgRed}${c.brightWhite} ⛔ BLOCKED ${c.reset}`,
    'Rejected':         `${c.bgRed}${c.brightWhite} ✖ REJECTED ${c.reset}`,
  }
  return badges[status] || `${c.gray}[${status || '?'}]${c.reset}`
}

function renderTaskStatusBadge(status) {
  const badges = {
    'Draft':       `${c.gray}● Draft${c.reset}`,
    'Todo':        `${c.brightBlue}● Todo${c.reset}`,
    'In Progress': `${c.brightCyan}▶ In Progress${c.reset}`,
    'Waiting':     `${c.brightYellow}⏸ Waiting${c.reset}`,
    'Review':      `${c.brightMagenta}🔍 Review${c.reset}`,
    'Done':        `${c.brightGreen}✔ Done${c.reset}`,
    'Cancelled':   `${c.gray}${c.strikethrough}◼ Cancelled${c.reset}`,
    'Archived':    `${c.dim}📦 Archived${c.reset}`,
  }
  return badges[status] || `${c.gray}${status}${c.reset}`
}

function renderPriorityBadge(priority) {
  const badges = {
    'Urgent': `${c.brightRed}${c.bold}🔴 URGENT${c.reset}`,
    'High':   `${c.brightYellow}🟡 High${c.reset}`,
    'Medium': `${c.brightBlue}🔵 Medium${c.reset}`,
    'Low':    `${c.gray}⚪ Low${c.reset}`,
  }
  return badges[priority] || `${c.gray}${priority}${c.reset}`
}

function renderServiceIndicator(isLive) {
  return isLive
    ? `${c.brightGreen}${c.bold}● ONLINE ${c.reset}`
    : `${c.brightRed}○ OFFLINE${c.reset}`
}

// ────────────────────────────────────────────────────────────────────────────
// Service Management
// ────────────────────────────────────────────────────────────────────────────
async function startService(key, streamToConsole = false) {
  const svc = SERVICES[key]
  if (!svc) return false

  const isLive = await checkPort(svc.port, svc.host)
  if (isLive) {
    const pid = getPidOnPort(svc.port)
    console.log(`  ${c.brightYellow}⚡${c.reset} ${c.bold}${svc.name}${c.reset} sudah aktif di port ${c.brightCyan}${svc.port}${c.reset}${pid ? ` ${c.gray}(PID: ${pid})${c.reset}` : ''}`)
    if (key === 'vite') {
      console.log(`  ${c.brightCyan}🌐${c.reset} Membuka browser: ${c.underline}http://localhost:${svc.port}${c.reset}`)
      openBrowser(`http://localhost:${svc.port}`)
    }
    return true
  }

  console.log(`  ${c.gray}⏳${c.reset} Memulai ${c.bold}${svc.name}${c.reset}...`)

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
      if (streamToConsole) process.stdout.write(`  ${svc.color}[${svc.shortName}]${c.reset} ${txt}`)
    })

    child.stderr.on('data', (data) => {
      const txt = data.toString()
      pushLog(key, txt, true)
      if (streamToConsole) process.stderr.write(`  ${c.brightRed}[${svc.shortName} ERR]${c.reset} ${txt}`)
    })

    child.on('error', (err) => {
      pushLog(key, `Process error: ${err.message}`, true)
      console.log(`  ${c.brightRed}✖${c.reset} Gagal menjalankan ${c.bold}${svc.name}${c.reset}: ${c.red}${err.message}${c.reset}`)
    })

    child.on('close', (code) => {
      pushLog(key, `Process exited with code ${code}`, code !== 0)
      childProcesses[key] = null
    })

    let attempts = 0
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    while (attempts < 15) {
      await new Promise(r => setTimeout(r, 400))
      const online = await checkPort(svc.port, svc.host)
      if (online) {
        const pid = getPidOnPort(svc.port)
        process.stdout.write('\r')
        console.log(`  ${c.brightGreen}✔${c.reset} ${c.bold}${svc.name}${c.reset} ${c.brightGreen}AKTIF${c.reset} → ${c.underline}http://${svc.host}:${svc.port}${c.reset}${pid ? ` ${c.gray}(PID: ${pid})${c.reset}` : ''}`)
        if (key === 'vite') {
          console.log(`  ${c.brightCyan}🌐${c.reset} Membuka browser: ${c.underline}http://localhost:${svc.port}${c.reset}`)
          openBrowser(`http://localhost:${svc.port}`)
        }
        return true
      }
      process.stdout.write(`\r  ${c.brightCyan}${frames[attempts % frames.length]}${c.reset} Menunggu port ${svc.port}...`)
      attempts++
    }

    process.stdout.write('\r')
    console.log(`  ${c.brightYellow}⚠${c.reset} ${c.bold}${svc.name}${c.reset} proses spawned (PID: ${child.pid}), menunggu port ${svc.port}...`)
    return true
  } catch (err) {
    console.log(`  ${c.brightRed}✖${c.reset} Gagal menjalankan command ${svc.command}: ${err.message}`)
    return false
  }
}

async function stopService(key) {
  const svc = SERVICES[key]
  if (!svc) return

  if (childProcesses[key]) {
    try { childProcesses[key].kill() } catch {}
    childProcesses[key] = null
  }

  const pid = getPidOnPort(svc.port)
  if (pid) {
    const killed = killPid(pid)
    if (killed) {
      console.log(`  ${c.brightGreen}✔${c.reset} ${c.bold}${svc.name}${c.reset} dihentikan ${c.gray}(Port ${svc.port}, PID ${pid})${c.reset}`)
    } else {
      console.log(`  ${c.brightRed}✖${c.reset} Gagal menghentikan PID ${pid} untuk ${c.bold}${svc.name}${c.reset}`)
    }
  } else {
    console.log(`  ${c.gray}─${c.reset} ${svc.name} ${c.gray}sudah tidak berjalan${c.reset}`)
  }
}

async function stopAllServices() {
  console.log(`\n${c.bold}  🛑 Menghentikan seluruh service...${c.reset}\n`)
  await stopService('router')
  await stopService('hermes')
  await stopService('vite')
  console.log(`\n  ${c.brightGreen}✨ Seluruh service dihentikan.${c.reset}\n`)
}

async function startAllServices(streamLogs = false) {
  console.log()
  console.log(drawBox('🚀 LAUNCH SEQUENCE', [
    `${c.brightCyan}Memulai seluruh infrastruktur SATRIA AI Workforce${c.reset}`,
    `${c.gray}9Router → Hermes Gateway → Vite Web App${c.reset}`
  ], 60, c.brightGreen))
  console.log()

  await startService('router', streamLogs)
  await startService('hermes', streamLogs)
  await startService('vite', streamLogs)

  console.log()
  console.log(drawBox('READY', [
    `${c.brightGreen}✨ SATRIA AI WORKFORCE SIAP DIGUNAKAN!${c.reset}`,
    '',
    `   Web App:     ${c.brightCyan}${c.underline}http://localhost:5173${c.reset}`,
    `   Hermes:      ${c.brightGreen}${c.underline}http://127.0.0.1:8642/health${c.reset}`,
    `   9Router:     ${c.brightMagenta}${c.underline}http://127.0.0.1:20128/v1/models${c.reset}`,
  ], 60, c.brightGreen))
  console.log()
}

async function restartService(key) {
  const svc = SERVICES[key]
  if (!svc) {
    console.log(`  ${c.brightRed}✖${c.reset} Service '${key}' tidak dikenal.`)
    return
  }
  console.log(`\n  ${c.brightYellow}🔄${c.reset} Restarting ${c.bold}${svc.name}${c.reset}...\n`)
  await stopService(key)
  await new Promise(r => setTimeout(r, 500))
  await startService(key, false)
}

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
          else if (parsed.data && Array.isArray(parsed.data)) httpDetail = `${parsed.data.length} models`
        } catch {
          httpDetail = 'HTTP 200'
        }
      } else {
        httpDetail = `HTTP ${res.status || 'Err'}`
      }
    }

    results[key] = {
      name: svc.name,
      shortName: svc.shortName,
      emoji: svc.emoji,
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

// ────────────────────────────────────────────────────────────────────────────
// Core Dispatch & Task Management Operations
// ────────────────────────────────────────────────────────────────────────────
function dispatchTask({ title, description, workerId, projectId, priority = 'Medium', runImmediately = true, instructions }) {
  const db = readDatabase()
  if (!db || db.error) {
    console.log(`\n  ${c.brightRed}✖ Database tidak tersedia.${c.reset}\n`)
    return false
  }

  // 1. Resolve Worker
  let employee = null
  if (workerId) {
    const search = workerId.toLowerCase()
    employee = (db.employees || []).find(e => e.id.toLowerCase() === search || e.name.toLowerCase() === search || e.id.toLowerCase().includes(search) || e.name.toLowerCase().includes(search))
  }
  if (!employee) {
    // Default to first primary digital worker or first available employee
    employee = (db.employees || []).find(e => e.isPrimary) || (db.employees || [])[0]
  }

  // 2. Resolve Project
  let project = null
  if (projectId) {
    project = (db.projects || []).find(p => p.id === projectId || p.id.includes(projectId) || p.name.toLowerCase().includes(projectId.toLowerCase()))
  }
  if (!project) {
    project = (db.projects || [])[0] || { id: 'prj-satria-ui', name: 'SATRIA AI Workforce UI', path: process.cwd() }
  }

  const now = new Date().toISOString()
  const taskId = `tsk-${Date.now()}`
  const runId = runImmediately ? `run-${Date.now()}` : undefined

  // 3. Create Task Object
  const newTask = {
    id: taskId,
    workspaceId: project.workspaceId || 'ws-default',
    projectId: project.id,
    projectName: project.name,
    title: title,
    description: description || `Task created via Satria CLI Dispatch at ${new Date().toLocaleString('id-ID')}`,
    type: 'one_time',
    status: runImmediately ? 'In Progress' : 'Todo',
    priority: priority || 'Medium',
    assigneeId: employee?.id,
    assigneeName: employee?.name || 'Digital Worker',
    workerId: employee?.id,
    workerName: employee?.name || 'Digital Worker',
    instructions: instructions || title,
    activeRunId: runId,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['cli-dispatched', priority.toLowerCase()],
    progress: runImmediately ? 5 : 0,
    checklist: [
      { id: `chk-1`, title: 'Initialize task context & requirements', completed: runImmediately },
      { id: `chk-2`, title: 'Execute autonomous plan & tools', completed: false },
      { id: `chk-3`, title: 'Verify deliverables & quality gates', completed: false }
    ],
    comments: [],
    createdAt: now,
    updatedAt: now
  }

  if (!db.tasks) db.tasks = []
  db.tasks.unshift(newTask)

  // 4. Create AgentRun Object if running
  if (runImmediately && employee) {
    const newRun = {
      id: runId,
      assignmentId: `asg-${Date.now()}`,
      taskId: taskId,
      taskTitle: title,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeAvatar: employee.avatar || employee.name.slice(0, 2).toUpperCase(),
      employeeRole: employee.roleName || 'Digital Worker',
      status: 'Running',
      attempt: 1,
      currentStep: 'Initializing',
      progress: 5,
      workspacePath: project.path || process.cwd(),
      triggerType: 'manual',
      startedAt: now,
      lastHeartbeatAt: now,
      logs: [
        {
          id: `log-${Date.now()}-1`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          step: 'Initializing',
          message: `Digital employee ${employee.name} (${employee.roleName}) initialized for task "${title}" via Satria CLI Dispatch.`,
          level: 'info'
        },
        {
          id: `log-${Date.now()}-2`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          step: 'Loading Task & Context',
          message: `Workspace path set to: ${project.path || process.cwd()}`,
          level: 'info'
        }
      ],
      telemetry: {
        promptTokens: 1250,
        completionTokens: 280,
        totalTokens: 1530,
        cachedTokens: 400,
        model: 'claude-3-5-sonnet-20241022',
        provider: 'Anthropic',
        durationMs: 450,
        estimatedCostUsd: 0.0075
      },
      createdAt: now,
      updatedAt: now
    }

    if (!db.agent_runs) db.agent_runs = []
    db.agent_runs.unshift(newRun)
  }

  if (writeDatabase(db)) {
    console.log()
    const summaryLines = [
      `  ${c.bold}Title:${c.reset}       ${c.brightWhite}${title}${c.reset}`,
      `  ${c.bold}Task ID:${c.reset}     ${c.cyan}${taskId}${c.reset}`,
      `  ${c.bold}Worker:${c.reset}      ${c.brightCyan}${employee?.name || 'Default'}${c.reset} ${c.gray}(${employee?.roleName || 'Worker'})${c.reset}`,
      `  ${c.bold}Project:${c.reset}     ${project.name} ${c.gray}(${project.id})${c.reset}`,
      `  ${c.bold}Priority:${c.reset}    ${renderPriorityBadge(priority)}`,
      `  ${c.bold}Status:${c.reset}      ${renderTaskStatusBadge(newTask.status)}`,
    ]
    if (runId) {
      summaryLines.push(`  ${c.bold}Run ID:${c.reset}      ${c.brightYellow}${runId}${c.reset} ${renderRunStatusBadge('Running')}`)
    }
    console.log(drawBox('🚀 TASK DISPATCHED SUCCESSFULLY', summaryLines, 76, c.brightGreen))
    console.log()
    return true
  }
  return false
}

function runExistingTask(taskIdInput) {
  const db = readDatabase()
  if (!db || db.error || !db.tasks) {
    console.log(`\n  ${c.brightRed}✖ Database tidak tersedia.${c.reset}\n`)
    return false
  }

  const task = db.tasks.find(t => t.id === taskIdInput || t.id.includes(taskIdInput))
  if (!task) {
    console.log(`\n  ${c.brightRed}✖ Task "${taskIdInput}" tidak ditemukan.${c.reset}\n`)
    return false
  }

  if (task.activeRunId && db.agent_runs) {
    const existingRun = db.agent_runs.find(r => r.id === task.activeRunId)
    if (existingRun && (existingRun.status === 'Running' || existingRun.status === 'Starting' || existingRun.status === 'Queued')) {
      console.log(`\n  ${c.brightYellow}⚠ Task ini sudah memiliki run aktif (${existingRun.id}) dengan status ${existingRun.status}.${c.reset}\n`)
      return false
    }
  }

  const now = new Date().toISOString()
  const runId = `run-${Date.now()}`

  // Resolve Worker
  let employee = null
  if (task.workerId || task.assigneeId) {
    employee = (db.employees || []).find(e => e.id === (task.workerId || task.assigneeId))
  }
  if (!employee) {
    employee = (db.employees || []).find(e => e.isPrimary) || (db.employees || [])[0]
  }

  task.status = 'In Progress'
  task.activeRunId = runId
  task.progress = 5
  task.updatedAt = now

  const newRun = {
    id: runId,
    assignmentId: `asg-${Date.now()}`,
    taskId: task.id,
    taskTitle: task.title,
    employeeId: employee?.id || 'emp-raka',
    employeeName: employee?.name || 'Raka',
    employeeAvatar: employee?.avatar || 'RK',
    employeeRole: employee?.roleName || 'Digital Worker',
    status: 'Running',
    attempt: 1,
    currentStep: 'Initializing',
    progress: 5,
    workspacePath: process.cwd(),
    triggerType: 'manual',
    startedAt: now,
    lastHeartbeatAt: now,
    logs: [
      {
        id: `log-${Date.now()}-1`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        step: 'Initializing',
        message: `Triggered execution for task "${task.title}" by ${employee?.name || 'Agent'}.`,
        level: 'info'
      }
    ],
    telemetry: {
      promptTokens: 950,
      completionTokens: 180,
      totalTokens: 1130,
      cachedTokens: 200,
      model: 'hermes-3-llama-3.1-70b',
      provider: 'NousResearch',
      durationMs: 320,
      estimatedCostUsd: 0.001
    },
    createdAt: now,
    updatedAt: now
  }

  if (!db.agent_runs) db.agent_runs = []
  db.agent_runs.unshift(newRun)

  if (writeDatabase(db)) {
    console.log(`\n  ${c.brightGreen}✔ Task ${c.cyan}${task.id}${c.reset} berhasil dipicu! Run ID: ${c.brightYellow}${runId}${c.reset}\n`)
    return true
  }
  return false
}

// ────────────────────────────────────────────────────────────────────────────
// Human-in-the-Loop Approval Operations
// ────────────────────────────────────────────────────────────────────────────
function approveRun(runIdInput, approvedBy = 'Human Supervisor') {
  const db = readDatabase()
  if (!db || db.error || !db.agent_runs) {
    console.log(`\n  ${c.brightRed}✖ Database tidak tersedia.${c.reset}\n`)
    return false
  }

  const run = db.agent_runs.find(r => r.id === runIdInput || r.id.includes(runIdInput))
  if (!run) {
    console.log(`\n  ${c.brightRed}✖ Run "${runIdInput}" tidak ditemukan.${c.reset}\n`)
    return false
  }

  const now = new Date().toISOString()
  run.status = 'Running'
  run.currentStep = 'Verifying'
  run.progress = Math.max(run.progress, 75)
  run.updatedAt = now

  if (!run.logs) run.logs = []
  run.logs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('id-ID'),
    step: 'Verifying',
    message: `[APPROVAL GRANTED] Action approved by ${approvedBy} via Satria CLI. Continuing autonomous execution.`,
    level: 'success'
  })

  if (writeDatabase(db)) {
    console.log(`\n  ${c.brightGreen}✔ Approval berhasil diberikan untuk Run ${c.cyan}${run.id}${c.reset}! Status sekarang: ${renderRunStatusBadge('Running')}\n`)
    return true
  }
  return false
}

function rejectRun(runIdInput, reason = 'Action rejected by supervisor via CLI') {
  const db = readDatabase()
  if (!db || db.error || !db.agent_runs) {
    console.log(`\n  ${c.brightRed}✖ Database tidak tersedia.${c.reset}\n`)
    return false
  }

  const run = db.agent_runs.find(r => r.id === runIdInput || r.id.includes(runIdInput))
  if (!run) {
    console.log(`\n  ${c.brightRed}✖ Run "${runIdInput}" tidak ditemukan.${c.reset}\n`)
    return false
  }

  const now = new Date().toISOString()
  run.status = 'Rejected'
  run.completedAt = now
  run.updatedAt = now
  run.cancelReason = reason

  if (!run.logs) run.logs = []
  run.logs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('id-ID'),
    step: run.currentStep,
    message: `[APPROVAL REJECTED] ${reason}`,
    level: 'error'
  })

  // Reset task to Todo or Waiting
  if (db.tasks) {
    const task = db.tasks.find(t => t.activeRunId === run.id || t.id === run.taskId)
    if (task) {
      task.status = 'Waiting'
      task.activeRunId = undefined
      task.updatedAt = now
    }
  }

  if (writeDatabase(db)) {
    console.log(`\n  ${c.brightYellow}✔ Run ${c.cyan}${run.id}${c.reset} telah DITOLAK. Task dikembalikan ke status ${c.brightYellow}Waiting${c.reset}.\n`)
    return true
  }
  return false
}

// ────────────────────────────────────────────────────────────────────────────
// Force-Stop & Task Deletion
// ────────────────────────────────────────────────────────────────────────────
function forceStopTask(taskIdInput, reason = 'Force-stopped via CLI') {
  const db = readDatabase()
  if (!db || db.error) return false

  const task = db.tasks?.find(t => t.id === taskIdInput || t.id.includes(taskIdInput))
  if (!task) {
    console.log(`\n  ${c.brightRed}✖ Task "${taskIdInput}" tidak ditemukan.${c.reset}\n`)
    return false
  }

  const now = new Date().toISOString()

  if (db.agent_runs) {
    for (const run of db.agent_runs) {
      if ((run.id === task.activeRunId || run.taskId === task.id) && (run.status === 'Running' || run.status === 'Starting' || run.status === 'Queued' || run.status === 'Waiting' || run.status === 'Verifying')) {
        run.status = 'Cancelled'
        run.cancelledAt = now
        run.cancelledBy = 'CLI-Owner'
        run.cancelReason = reason
        run.updatedAt = now
        run.completedAt = now
        console.log(`  ${c.brightGreen}✔${c.reset} Agent Run ${c.cyan}${run.id}${c.reset} dibatalkan.`)
      }
    }
  }

  task.status = 'Todo'
  task.activeRunId = undefined
  task.progress = 0
  task.updatedAt = now
  console.log(`  ${c.brightGreen}✔${c.reset} Task ${c.cyan}${task.id}${c.reset} "${c.bold}${task.title}${c.reset}" direset ke ${c.brightBlue}Todo${c.reset}.`)

  if (writeDatabase(db)) {
    console.log(`  ${c.brightGreen}✔${c.reset} Database berhasil disimpan.`)
    return true
  }
  return false
}

function forceStopAllRuns() {
  const db = readDatabase()
  if (!db || db.error) return false

  const now = new Date().toISOString()
  let count = 0

  if (db.agent_runs) {
    for (const run of db.agent_runs) {
      if (run.status === 'Running' || run.status === 'Starting' || run.status === 'Queued' || run.status === 'Waiting' || run.status === 'Verifying') {
        run.status = 'Cancelled'
        run.cancelledAt = now
        run.cancelledBy = 'CLI-Owner'
        run.cancelReason = 'Force-stopped all via CLI'
        run.updatedAt = now
        run.completedAt = now
        count++

        if (db.tasks) {
          const task = db.tasks.find(t => t.activeRunId === run.id || t.id === run.taskId)
          if (task) {
            task.status = 'Todo'
            task.activeRunId = undefined
            task.progress = 0
            task.updatedAt = now
          }
        }
      }
    }
  }

  if (count === 0) {
    console.log(`\n  ${c.gray}Tidak ada run yang sedang aktif.${c.reset}\n`)
    return true
  }

  console.log(`\n  ${c.brightGreen}✔${c.reset} ${c.bold}${count}${c.reset} agent run(s) berhasil dihentikan.`)
  if (writeDatabase(db)) {
    console.log(`  ${c.brightGreen}✔${c.reset} Database berhasil disimpan.\n`)
    return true
  }
  return false
}

function deleteTask(taskIdInput, reason = 'Deleted via CLI', permanent = false) {
  const db = readDatabase()
  if (!db || db.error) return false

  const taskIndex = db.tasks?.findIndex(t => t.id === taskIdInput || t.id.includes(taskIdInput))
  if (taskIndex === undefined || taskIndex === -1) {
    console.log(`\n  ${c.brightRed}✖ Task "${taskIdInput}" tidak ditemukan.${c.reset}\n`)
    return false
  }

  const task = db.tasks[taskIndex]
  const now = new Date().toISOString()

  if (task.activeRunId || task.status === 'In Progress') {
    if (db.agent_runs) {
      for (const run of db.agent_runs) {
        if (run.taskId === task.id && (run.status === 'Running' || run.status === 'Starting' || run.status === 'Queued' || run.status === 'Waiting' || run.status === 'Verifying')) {
          run.status = 'Cancelled'
          run.cancelledAt = now
          run.cancelledBy = 'CLI-Owner'
          run.cancelReason = 'Parent task deleted'
          run.updatedAt = now
          run.completedAt = now
        }
      }
    }
  }

  if (permanent) {
    db.tasks.splice(taskIndex, 1)
    console.log(`  ${c.brightRed}🗑${c.reset} Task ${c.cyan}${task.id}${c.reset} "${c.bold}${task.title}${c.reset}" ${c.brightRed}DIHAPUS PERMANEN${c.reset}.`)
  } else {
    task.deletedAt = now
    task.deletedBy = 'CLI-Owner'
    task.deleteReason = reason
    task.status = 'Cancelled'
    task.activeRunId = undefined
    task.updatedAt = now
    console.log(`  ${c.brightYellow}🗑${c.reset} Task ${c.cyan}${task.id}${c.reset} "${c.bold}${task.title}${c.reset}" telah di-soft-delete.`)
  }

  if (writeDatabase(db)) {
    console.log(`  ${c.brightGreen}✔${c.reset} Database berhasil disimpan.`)
    return true
  }
  return false
}

// ────────────────────────────────────────────────────────────────────────────
// Telemetry & Cost Ledger (`satria cost` / `satria stats`)
// ────────────────────────────────────────────────────────────────────────────
function printTelemetryAndCost() {
  const db = readDatabase()
  if (!db || db.error || !db.agent_runs) {
    console.log(`\n  ${c.gray}Tidak ada data telemetri yang tersedia.${c.reset}\n`)
    return
  }

  let totalPromptTokens = 0
  let totalCompletionTokens = 0
  let totalCachedTokens = 0
  let totalTokens = 0
  let totalCostUsd = 0
  const modelStats = {}
  const workerStats = {}

  for (const run of db.agent_runs) {
    const t = run.telemetry
    const pTokens = t?.promptTokens || 0
    const cTokens = t?.completionTokens || 0
    const caTokens = t?.cachedTokens || 0
    const allTokens = t?.totalTokens || (pTokens + cTokens)
    const cost = calculateRunCost(t)

    totalPromptTokens += pTokens
    totalCompletionTokens += cTokens
    totalCachedTokens += caTokens
    totalTokens += allTokens
    totalCostUsd += cost

    // Model breakdown
    const model = t?.model || 'hermes-3-llama-3.1-70b'
    if (!modelStats[model]) modelStats[model] = { runs: 0, tokens: 0, cost: 0 }
    modelStats[model].runs += 1
    modelStats[model].tokens += allTokens
    modelStats[model].cost += cost

    // Worker breakdown
    const worker = run.employeeName || 'Unknown'
    if (!workerStats[worker]) workerStats[worker] = { runs: 0, tokens: 0, cost: 0, role: run.employeeRole }
    workerStats[worker].runs += 1
    workerStats[worker].tokens += allTokens
    workerStats[worker].cost += cost
  }

  console.log()
  const summaryLines = [
    `  ${c.bold}Total Agent Runs:${c.reset}      ${c.brightCyan}${db.agent_runs.length}${c.reset} runs`,
    `  ${c.bold}Total Tokens Consumed:${c.reset} ${c.brightGreen}${formatTokens(totalTokens)}${c.reset} ${c.gray}(Prompt: ${formatTokens(totalPromptTokens)}, Completion: ${formatTokens(totalCompletionTokens)}, Cached: ${formatTokens(totalCachedTokens)})${c.reset}`,
    `  ${c.bold}Estimated Total Cost:${c.reset}  ${c.brightYellow}${c.bold}${formatCurrency(totalCostUsd)}${c.reset} ${c.dim}(Rate: $1 = Rp${USD_TO_IDR.toLocaleString()})${c.reset}`,
  ]
  console.log(drawBox('💰 GOVERNANCE & TELEMETRY LEDGER', summaryLines, 76, c.brightGreen))

  // Model Economics Breakdown
  console.log()
  const modelLines = [
    `  ${c.dim}${'MODEL'.padEnd(28)} ${'RUNS'.padEnd(8)} ${'TOKENS'.padEnd(12)} ${'COST (USD)'.padEnd(14)} ${'COST (IDR)'.padEnd(12)}${c.reset}`,
    '---'
  ]
  for (const [model, stats] of Object.entries(modelStats)) {
    const mName = truncate(model, 26).padEnd(28)
    const runsStr = `${stats.runs}`.padEnd(8)
    const tokStr = formatTokens(stats.tokens).padEnd(12)
    const costUsd = `$${stats.cost.toFixed(4)}`.padEnd(14)
    const costIdr = `Rp${Math.round(stats.cost * USD_TO_IDR).toLocaleString('id-ID')}`
    modelLines.push(`  ${c.brightCyan}${mName}${c.reset} ${runsStr} ${tokStr} ${c.brightYellow}${costUsd}${c.reset} ${c.dim}${costIdr}${c.reset}`)
  }
  console.log(drawBox('🤖 MODEL ECONOMICS & SPEND', modelLines, 76))

  // Worker Leaderboard
  console.log()
  const workerLines = [
    `  ${c.dim}${'WORKER'.padEnd(18)} ${'ROLE'.padEnd(22)} ${'RUNS'.padEnd(8)} ${'TOKENS'.padEnd(10)} ${'SPEND'.padEnd(14)}${c.reset}`,
    '---'
  ]
  const sortedWorkers = Object.entries(workerStats).sort((a, b) => b[1].tokens - a[1].tokens)
  for (const [worker, stats] of sortedWorkers) {
    const wName = truncate(worker, 16).padEnd(18)
    const rName = truncate(stats.role || '-', 20).padEnd(22)
    const runsStr = `${stats.runs}`.padEnd(8)
    const tokStr = formatTokens(stats.tokens).padEnd(10)
    const spend = `$${stats.cost.toFixed(4)}`
    workerLines.push(`  ${c.brightWhite}${c.bold}${wName}${c.reset} ${c.dim}${rName}${c.reset} ${runsStr} ${tokStr} ${c.brightGreen}${spend}${c.reset}`)
  }
  console.log(drawBox('👥 DIGITAL WORKFORCE CONSUMPTION LEADERBOARD', workerLines, 76))
  console.log()
}

// ────────────────────────────────────────────────────────────────────────────
// Satria Doctor (System Health Diagnostic Suite)
// ────────────────────────────────────────────────────────────────────────────
async function runSatriaDoctor() {
  console.log()
  console.log(drawBox('🩺 SATRIA SYSTEM DOCTOR', [
    `${c.brightCyan}Performing comprehensive pre-flight & diagnostic checks...${c.reset}`
  ], 76, c.brightGreen))
  console.log()

  const checks = []

  // 1. Node.js Version Check
  const nodeVer = process.version
  const major = parseInt(nodeVer.replace('v', '').split('.')[0], 10)
  if (major >= 18) {
    checks.push({ name: 'Node.js Runtime Version', status: 'OK', detail: `${nodeVer} (Supported)` })
  } else {
    checks.push({ name: 'Node.js Runtime Version', status: 'FAIL', detail: `${nodeVer} (Requires v18+)` })
  }

  // 2. Database JSON Integrity
  const dbPath = getDatabasePath()
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, 'utf8')
      const parsed = JSON.parse(raw)
      const tables = Object.keys(parsed).length
      checks.push({ name: 'Database Integrity (database.json)', status: 'OK', detail: `Valid JSON (${tables} tables, ${(raw.length / 1024).toFixed(1)} KB)` })
    } catch (e) {
      checks.push({ name: 'Database Integrity (database.json)', status: 'FAIL', detail: `Corrupted: ${e.message}` })
    }
  } else {
    checks.push({ name: 'Database Integrity (database.json)', status: 'WARN', detail: 'Missing (Will auto-initialize on start)' })
  }

  // 3. File System Write Permissions
  try {
    const testFile = path.resolve(process.cwd(), 'data', '.doctor_test.tmp')
    fs.writeFileSync(testFile, 'ok', 'utf8')
    fs.unlinkSync(testFile)
    checks.push({ name: 'Disk & Folder Write Permissions', status: 'OK', detail: 'Read/Write verified in ./data' })
  } catch (e) {
    checks.push({ name: 'Disk & Folder Write Permissions', status: 'FAIL', detail: e.message })
  }

  // 4. Port Availability Checks
  for (const [key, svc] of Object.entries(SERVICES)) {
    const isLive = await checkPort(svc.port, svc.host, 500)
    const pid = isLive ? getPidOnPort(svc.port) : null
    if (isLive) {
      checks.push({ name: `Service Port :${svc.port} (${svc.name})`, status: 'OK', detail: `Active (PID: ${pid || 'Unknown'})` })
    } else {
      checks.push({ name: `Service Port :${svc.port} (${svc.name})`, status: 'INFO', detail: `Available / Inactive` })
    }
  }

  // 5. Memory & System Specs
  const memUsage = process.memoryUsage()
  checks.push({ name: 'Process Memory Consumption', status: 'OK', detail: `RSS: ${(memUsage.rss / 1024 / 1024).toFixed(1)} MB, Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB` })

  // Render Doctor Results
  const lines = []
  for (const chk of checks) {
    const icon = chk.status === 'OK' ? `${c.brightGreen}✔ [OK]  ${c.reset}`
      : chk.status === 'WARN' ? `${c.brightYellow}⚠ [WARN]${c.reset}`
      : chk.status === 'INFO' ? `${c.brightCyan}ℹ [INFO]${c.reset}`
      : `${c.brightRed}✖ [FAIL]${c.reset}`
    lines.push(`  ${icon} ${padRight(chk.name, 36)} ${c.dim}${chk.detail}${c.reset}`)
  }

  console.log(drawBox('🩺 DIAGNOSTIC REPORT', lines, 76))
  console.log()
}

// ────────────────────────────────────────────────────────────────────────────
// Database Backup & Restore Operations
// ────────────────────────────────────────────────────────────────────────────
function createDatabaseBackup() {
  const dbPath = getDatabasePath()
  if (!fs.existsSync(dbPath)) {
    console.log(`  ${c.brightRed}✖ Database file tidak ditemukan.${c.reset}`)
    return false
  }

  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = path.join(backupDir, `backup_${dateStr}.json`)

  try {
    fs.copyFileSync(dbPath, backupPath)
    const size = (fs.statSync(backupPath).size / 1024).toFixed(1)
    console.log(`\n  ${c.brightGreen}✔ Backup berhasil dibuat!${c.reset}`)
    console.log(`  📁 Lokasi: ${c.cyan}${backupPath}${c.reset} (${size} KB)\n`)
    return true
  } catch (e) {
    console.log(`  ${c.brightRed}✖ Gagal membuat backup: ${e.message}${c.reset}`)
    return false
  }
}

function listDatabaseBackups() {
  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  if (!fs.existsSync(backupDir)) {
    console.log(`\n  ${c.gray}Belum ada backup database.${c.reset}\n`)
    return []
  }

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort().reverse()
  if (files.length === 0) {
    console.log(`\n  ${c.gray}Belum ada backup database.${c.reset}\n`)
    return []
  }

  console.log()
  const lines = [
    `  ${c.dim}${'#'.padEnd(3)} ${'FILENAME'.padEnd(36)} ${'SIZE'.padEnd(10)} ${'CREATED'.padEnd(18)}${c.reset}`,
    '---'
  ]
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    const fPath = path.join(backupDir, f)
    const stat = fs.statSync(fPath)
    const size = `${(stat.size / 1024).toFixed(1)} KB`.padEnd(10)
    const time = new Date(stat.mtime).toLocaleString('id-ID').padEnd(18)
    lines.push(`  ${c.dim}${(i + 1).toString().padEnd(3)}${c.reset} ${c.cyan}${f.padEnd(36)}${c.reset} ${size} ${c.dim}${time}${c.reset}`)
  }
  console.log(drawBox(`💾 DATABASE BACKUPS (${files.length})`, lines, 76))
  console.log()
  return files
}

function restoreDatabaseBackup(filename) {
  const backupDir = path.resolve(process.cwd(), 'data', 'backups')
  const backupPath = path.join(backupDir, filename)
  const dbPath = getDatabasePath()

  if (!fs.existsSync(backupPath)) {
    console.log(`  ${c.brightRed}✖ File backup "${filename}" tidak ditemukan.${c.reset}`)
    return false
  }

  try {
    // Make safety backup of current db first
    createDatabaseBackup()
    fs.copyFileSync(backupPath, dbPath)
    console.log(`\n  ${c.brightGreen}✔ Database berhasil di-restore dari ${c.cyan}${filename}${c.reset}!\n`)
    return true
  } catch (e) {
    console.log(`  ${c.brightRed}✖ Gagal restore database: ${e.message}${c.reset}`)
    return false
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Live Watch / Top Monitor Mode (`satria watch` / `satria top`)
// ────────────────────────────────────────────────────────────────────────────
async function startLiveWatchMode() {
  console.clear()
  const isRaw = process.stdin.isRaw
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', (key) => {
      // 'q' or Ctrl+C to exit
      if (key[0] === 113 || key[0] === 3) {
        if (process.stdin.setRawMode) process.stdin.setRawMode(false)
        console.clear()
        process.exit(0)
      }
    })
  }

  const render = async () => {
    console.clear()
    const health = await getOverallHealth()
    const db = readDatabase()

    console.log(`${c.brightGreen}${c.bold}  🛡️  SATRIA AI WORKFORCE — LIVE COMMAND CENTER (Tekan 'q' untuk keluar)${c.reset}`)
    console.log(`${c.gray}  ────────────────────────────────────────────────────────────────────────${c.reset}\n`)

    // Services
    const svcLines = []
    for (const [, item] of Object.entries(health)) {
      const indicator = renderServiceIndicator(item.isLive)
      const pidStr = item.pid ? `PID ${c.dim}${item.pid}${c.reset}` : `${c.dim}—${c.reset}`
      const detailStr = item.httpDetail ? `${c.brightCyan}${item.httpDetail}${c.reset}` : ''
      svcLines.push(`${indicator} ${item.emoji} ${padRight(`${item.color}${c.bold}${item.name}${c.reset}`, 36)} ${padRight(`:${item.port}`, 7)} ${padRight(pidStr, 14)} ${detailStr}`)
    }
    console.log(drawBox('📡 LIVE SERVICES', svcLines, 76))

    // Active Runs
    if (db && db.agent_runs) {
      const activeRuns = db.agent_runs.filter(r => r.status === 'Running' || r.status === 'Starting' || r.status === 'AwaitingApproval' || r.status === 'Queued' || r.status === 'Waiting' || r.status === 'Verifying')
      console.log()
      if (activeRuns.length > 0) {
        const activeLines = []
        for (const run of activeRuns) {
          if (activeLines.length > 0) activeLines.push('---')
          activeLines.push(`  ${renderRunStatusBadge(run.status)} ${c.bold}${truncate(run.taskTitle || run.taskId, 38)}${c.reset}`)
          activeLines.push(`  👤 ${c.brightCyan}${run.employeeName || 'Agent'}${c.reset} ${c.gray}(${run.employeeRole || 'Worker'})${c.reset}  Step: ${c.brightYellow}${run.currentStep || 'Working'}${c.reset}`)
          activeLines.push(`  📈 ${renderProgressBar(run.progress, 24)}`)
        }
        console.log(drawBox(`▶ ACTIVE AGENT RUNS (${activeRuns.length})`, activeLines, 76, c.brightBlue))
      } else {
        console.log(drawBox('▶ ACTIVE AGENT RUNS', [`  ${c.gray}Tidak ada agent run yang sedang aktif.${c.reset}`], 76))
      }
    }
    console.log(`\n  ${c.dim}Auto-refreshing every 2s • Last update: ${new Date().toLocaleTimeString('id-ID')}${c.reset}`)
  }

  await render()
  const interval = setInterval(render, 2000)
}

// ────────────────────────────────────────────────────────────────────────────
// Task & Directory Listing Views
// ────────────────────────────────────────────────────────────────────────────
function printTaskList(options = {}) {
  const db = readDatabase()
  if (!db || db.error || !db.tasks) {
    console.log(`\n  ${c.gray}Tidak dapat membaca data tasks dari database.${c.reset}\n`)
    return
  }

  let tasks = db.tasks.filter(t => !t.deletedAt)

  if (options.status) {
    tasks = tasks.filter(t => t.status.toLowerCase() === options.status.toLowerCase())
  }
  if (options.priority) {
    tasks = tasks.filter(t => t.priority?.toLowerCase() === options.priority.toLowerCase())
  }
  if (options.search) {
    const q = options.search.toLowerCase()
    tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
  }
  if (options.worker) {
    const w = options.worker.toLowerCase()
    tasks = tasks.filter(t => (t.workerName || t.assigneeName || '').toLowerCase().includes(w))
  }

  if (tasks.length === 0) {
    console.log(`\n  ${c.gray}Tidak ada task yang cocok dengan kriteria pencarian.${c.reset}\n`)
    return
  }

  console.log()
  const lines = [
    `  ${c.dim}${'#'.padEnd(4)} ${'ID'.padEnd(10)} ${'STATUS'.padEnd(14)} ${'PRI'.padEnd(8)} ${'TITLE'.padEnd(26)} ${'WORKER'.padEnd(10)}${c.reset}`,
    '---'
  ]

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    const num = `${i + 1}`.padEnd(4)
    const id = truncate(t.id, 9).padEnd(10)
    const statusRaw = t.status.padEnd(14)
    const statusColor = t.status === 'Done' ? c.brightGreen : t.status === 'In Progress' ? c.brightCyan : t.status === 'Cancelled' ? c.gray : t.status === 'Todo' ? c.brightBlue : c.brightYellow
    const pri = t.priority ? truncate(t.priority, 7).padEnd(8) : '-'.padEnd(8)
    const priColor = t.priority === 'Urgent' ? c.brightRed : t.priority === 'High' ? c.brightYellow : c.dim
    const title = truncate(t.title, 24).padEnd(26)
    const worker = truncate(t.workerName || t.assigneeName || '-', 9).padEnd(10)

    lines.push(`  ${c.dim}${num}${c.reset} ${c.cyan}${id}${c.reset} ${statusColor}${statusRaw}${c.reset} ${priColor}${pri}${c.reset} ${title} ${c.brightCyan}${worker}${c.reset}`)
  }

  const title = options.status ? `📋 TASKS — ${options.status.toUpperCase()}` : `📋 ALL TASKS (${tasks.length})`
  console.log(drawBox(title, lines, 80))
  console.log()
}

function printTaskDetail(taskIdInput) {
  const db = readDatabase()
  if (!db || db.error || !db.tasks) return

  const task = db.tasks.find(t => t.id === taskIdInput || t.id.includes(taskIdInput))
  if (!task) {
    console.log(`\n  ${c.brightRed}✖ Task "${taskIdInput}" tidak ditemukan.${c.reset}\n`)
    return
  }

  console.log()
  const lines = [
    `  ${c.bold}Title:${c.reset}       ${task.title}`,
    `  ${c.bold}ID:${c.reset}          ${c.cyan}${task.id}${c.reset}`,
    `  ${c.bold}Status:${c.reset}      ${renderTaskStatusBadge(task.status)}`,
    `  ${c.bold}Priority:${c.reset}    ${renderPriorityBadge(task.priority)}`,
    `  ${c.bold}Project:${c.reset}     ${task.projectName || '-'}`,
    `  ${c.bold}Worker:${c.reset}      ${c.brightCyan}${task.workerName || task.assigneeName || 'Unassigned'}${c.reset}`,
    `  ${c.bold}Progress:${c.reset}    ${renderProgressBar(task.progress, 20)}`,
    `  ${c.bold}Due Date:${c.reset}    ${task.dueDate || '-'}`,
    '---',
    `  ${c.bold}Description:${c.reset}`,
    `  ${c.dim}${truncate(task.description || 'No description', 64)}${c.reset}`,
  ]

  if (task.activeRunId) {
    lines.push('---')
    lines.push(`  ${c.brightYellow}${c.bold}⚡ Active Run:${c.reset} ${c.cyan}${task.activeRunId}${c.reset}`)
    const run = db.agent_runs?.find(r => r.id === task.activeRunId)
    if (run) {
      lines.push(`    ${renderRunStatusBadge(run.status)} Step: ${c.brightYellow}${run.currentStep}${c.reset} Progress: ${run.progress}%`)
    }
  }

  console.log(drawBox(`📝 TASK DETAIL — ${task.id}`, lines, 76))
  console.log()
}

function printWorkerList() {
  const db = readDatabase()
  if (!db || db.error || !db.employees) return

  const employees = db.employees.filter(e => e.status === 'Active')
  console.log()
  const lines = [
    `  ${c.dim}${'#'.padEnd(3)} ${'ID'.padEnd(12)} ${'NAME'.padEnd(14)} ${'ROLE'.padEnd(24)} ${'DEPT'.padEnd(14)} ${'TYPE'.padEnd(10)}${c.reset}`,
    '---'
  ]
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]
    const num = `${i + 1}`.padEnd(3)
    const id = truncate(emp.id, 11).padEnd(12)
    const name = truncate(emp.name, 13).padEnd(14)
    const role = truncate(emp.roleName, 23).padEnd(24)
    const dept = truncate(emp.departmentName, 13).padEnd(14)
    const isPrimary = emp.isPrimary ? `${c.brightGreen}★ Primary${c.reset}` : `${c.dim}Worker${c.reset}`
    lines.push(`  ${c.dim}${num}${c.reset} ${c.cyan}${id}${c.reset} ${c.bold}${name}${c.reset} ${c.dim}${role}${c.reset} ${c.brightMagenta}${dept}${c.reset} ${padRight(isPrimary, 10)}`)
  }
  console.log(drawBox(`👥 DIGITAL WORKFORCE (${employees.length} Active)`, lines, 86))
  console.log()
}

function printProjectList() {
  const db = readDatabase()
  if (!db || db.error || !db.projects) return

  const projects = db.projects.filter(p => !p.deletedAt)
  console.log()
  const lines = [
    `  ${c.dim}${'#'.padEnd(3)} ${'ID'.padEnd(14)} ${'STATUS'.padEnd(12)} ${'NAME'.padEnd(24)} ${'PROGRESS'.padEnd(10)} ${'TASKS'.padEnd(7)}${c.reset}`,
    '---'
  ]
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i]
    const num = `${i + 1}`.padEnd(3)
    const id = truncate(p.id, 13).padEnd(14)
    const statusColor = p.status === 'Active' ? c.brightGreen : p.status === 'Completed' ? c.green : p.status === 'Paused' ? c.brightYellow : c.gray
    const status = padRight(`${statusColor}${p.status}${c.reset}`, 12)
    const name = truncate(p.name, 22).padEnd(24)
    const progress = `${p.progress || 0}%`.padEnd(10)
    const tasks = `${p.completedTaskCount || 0}/${p.taskCount || 0}`.padEnd(7)
    lines.push(`  ${c.dim}${num}${c.reset} ${c.cyan}${id}${c.reset} ${status} ${c.bold}${name}${c.reset} ${progress} ${c.dim}${tasks}${c.reset}`)
  }
  console.log(drawBox(`📁 PROJECTS (${projects.length})`, lines, 80))
  console.log()
}

async function printStatusScreen() {
  const health = await getOverallHealth()
  const db = readDatabase()

  console.log()
  const svcLines = []
  for (const [, item] of Object.entries(health)) {
    const indicator = renderServiceIndicator(item.isLive)
    const pidStr = item.pid ? `PID ${c.dim}${item.pid}${c.reset}` : `${c.dim}—${c.reset}`
    const detailStr = item.httpDetail ? `${c.brightCyan}${item.httpDetail}${c.reset}` : ''
    svcLines.push(`${indicator} ${item.emoji} ${padRight(`${item.color}${c.bold}${item.name}${c.reset}`, 36)} ${padRight(`:${item.port}`, 7)} ${padRight(pidStr, 14)} ${detailStr}`)
  }
  console.log(drawBox('📡 SERVICE STATUS', svcLines, 76))

  console.log()
  if (db && !db.error) {
    const wsCount = db.workspaces ? db.workspaces.length : 0
    const taskCount = db.tasks ? db.tasks.filter(t => !t.deletedAt).length : 0
    const empCount = db.employees ? db.employees.length : 0
    const runsCount = db.agent_runs ? db.agent_runs.length : 0
    const projCount = db.projects ? db.projects.filter(p => !p.deletedAt).length : 0
    const activeRuns = db.agent_runs ? db.agent_runs.filter(r => r.status === 'Running' || r.status === 'Starting' || r.status === 'Queued' || r.status === 'AwaitingApproval').length : 0

    const dbLines = [
      `  📁 Workspaces  ${c.brightCyan}${c.bold}${wsCount}${c.reset}     📋 Projects   ${c.brightCyan}${c.bold}${projCount}${c.reset}     📝 Tasks      ${c.brightCyan}${c.bold}${taskCount}${c.reset}`,
      `  👥 Workers     ${c.brightCyan}${c.bold}${empCount}${c.reset}     🤖 Agent Runs  ${c.brightCyan}${c.bold}${runsCount}${c.reset}     ${activeRuns > 0 ? `${c.brightGreen}▶ Active Now  ${c.bold}${activeRuns}${c.reset}` : `${c.gray}▷ Active Now  0${c.reset}`}`,
    ]
    console.log(drawBox('💾 DATABASE SUMMARY', dbLines, 76))
  }
  console.log()
}

async function printTaskMonitor() {
  const db = readDatabase()
  if (!db || db.error || !db.agent_runs || db.agent_runs.length === 0) {
    console.log(`\n  ${c.gray}Belum ada riwayat atau task agent di database.${c.reset}\n`)
    return
  }

  const allRuns = [...db.agent_runs].reverse()
  const activeRuns = allRuns.filter(r => r.status === 'Running' || r.status === 'Starting' || r.status === 'AwaitingApproval' || r.status === 'Queued' || r.status === 'Waiting' || r.status === 'Verifying')
  const completedRuns = allRuns.filter(r => r.status === 'Completed')
  const failedRuns = allRuns.filter(r => r.status === 'Failed' || r.status === 'Blocked' || r.status === 'Rejected')

  console.log()
  console.log(drawBox('📊 AGENT RUN SUMMARY', [
    `  ${c.brightBlue}▶ Active: ${c.bold}${activeRuns.length}${c.reset}   ${c.brightGreen}✔ Done: ${c.bold}${completedRuns.length}${c.reset}   ${c.brightRed}✖ Failed: ${c.bold}${failedRuns.length}${c.reset}   ${c.dim}Total: ${allRuns.length}${c.reset}`,
  ], 76))

  if (activeRuns.length > 0) {
    console.log()
    const activeLines = []
    for (const run of activeRuns) {
      if (activeLines.length > 0) activeLines.push('---')
      activeLines.push(`  ${renderRunStatusBadge(run.status)} ${c.bold}${truncate(run.taskTitle || run.taskId, 40)}${c.reset}`)
      activeLines.push(`  👤 ${c.brightCyan}${run.employeeName || 'Agent'}${c.reset} ${c.gray}(${run.employeeRole || 'Worker'})${c.reset}    ID: ${c.dim}${run.id}${c.reset}`)
      activeLines.push(`  ⚡ Step: ${c.brightYellow}${run.currentStep || 'In Progress'}${c.reset}  Attempt: ${c.bold}#${run.attempt || 1}${c.reset}`)
      activeLines.push(`  📈 ${renderProgressBar(run.progress, 25)}`)
    }
    console.log(drawBox('▶ ACTIVE RUNS', activeLines, 76, c.brightBlue))
  }
  console.log()
}

async function printErrorDiagnostics() {
  const db = readDatabase()
  if (!db || db.error || !db.agent_runs) return

  const failedRuns = db.agent_runs.filter(r => r.status === 'Failed' || r.status === 'Blocked' || r.status === 'Rejected' || (r.logs && r.logs.some(l => l.level === 'error')))
  if (failedRuns.length === 0) {
    console.log()
    console.log(drawBox('🔍 ERROR DIAGNOSTICS', [`  ${c.brightGreen}✔ Tidak ada task yang berstatus Failed atau mengalami error fatal.${c.reset}`], 76, c.brightGreen))
    console.log()
    return
  }

  console.log()
  for (const run of failedRuns.slice(0, 5)) {
    const lines = [
      `  ${c.bold}Task:${c.reset}     ${run.taskTitle} ${c.gray}(${run.id})${c.reset}`,
      `  ${c.bold}Agent:${c.reset}    ${c.brightCyan}${run.employeeName}${c.reset} (${run.employeeRole})`,
      `  ${c.bold}Status:${c.reset}   ${renderRunStatusBadge(run.status)}  Failed at: ${c.brightRed}${run.currentStep}${c.reset}`,
    ]
    if (run.error) lines.push(`  ${c.brightYellow}⚠ ${run.error}${c.reset}`)
    console.log(drawBox(`🚨 ERROR — ${run.id}`, lines, 76, c.brightRed))
    console.log()
  }
}

function streamCombinedLogs() {
  console.log()
  if (logBuffers.combined.length === 0) {
    console.log(drawBox('📜 LIVE LOGS', [`${c.gray}Belum ada log aktif. Log akan muncul saat service berjalan.${c.reset}`], 76))
  } else {
    const lines = []
    for (const entry of logBuffers.combined.slice(-40)) {
      const color = entry.isError ? c.brightRed : entry.source === 'vite' ? c.brightCyan : entry.source === 'hermes' ? c.brightGreen : c.brightMagenta
      lines.push(`${c.dim}${entry.timestamp}${c.reset} ${color}[${entry.source.toUpperCase().padEnd(6)}]${c.reset} ${truncate(entry.text, 50)}`)
    }
    console.log(drawBox('📜 LIVE LOGS (Last 40)', lines, 76))
  }
  console.log()
}

// ────────────────────────────────────────────────────────────────────────────
// Interactive CLI Menu Loop
// ────────────────────────────────────────────────────────────────────────────
function printBanner() {
  console.clear()
  console.log()
  console.log(`${c.brightGreen}${c.bold}`)
  console.log(`    ███████╗ █████╗ ████████╗██████╗ ██╗ █████╗     █████╗ ██╗`)
  console.log(`    ██╔════╝██╔══██╗╚══██╔══╝██╔══██╗██║██╔══██╗   ██╔══██╗██║`)
  console.log(`    ███████╗███████║   ██║   ██████╔╝██║███████║   ███████║██║`)
  console.log(`    ╚════██║██╔══██║   ██║   ██╔══██╗██║██╔══██║   ██╔══██║██║`)
  console.log(`    ███████║██║  ██║   ██║   ██║  ██║██║██║  ██║██╗██║  ██║██║`)
  console.log(`    ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝`)
  console.log(`${c.reset}${c.dim}                DIGITAL WORKFORCE COMMAND CENTER  v3.0${c.reset}`)
  console.log(`${c.gray}    ════════════════════════════════════════════════════════════${c.reset}`)
}

async function showInteractiveMenu() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (query) => new Promise(resolve => rl.question(query, resolve))

  while (true) {
    printBanner()
    await printStatusScreen()

    console.log(drawBox('🎮 ENTERPRISE COMMAND CENTER', [
      '',
      `  ${c.brightGreen}${c.bold}🚀 SERVICE ORCHESTRATION${c.reset}`,
      `    ${c.brightWhite}[1]${c.reset}  🚀 Start ALL Services         ${c.gray}(9Router + Hermes + Vite)${c.reset}`,
      `    ${c.brightWhite}[2]${c.reset}  🌐 Start Vite Web App Only    ${c.gray}(port 5173)${c.reset}`,
      `    ${c.brightWhite}[3]${c.reset}  🧠 Start Hermes Gateway Only  ${c.gray}(port 8642)${c.reset}`,
      `    ${c.brightWhite}[4]${c.reset}  ⚡ Start 9Router Proxy Only   ${c.gray}(port 20128)${c.reset}`,
      `    ${c.brightWhite}[5]${c.reset}  🛑 Stop ALL Services          ${c.gray}(Kill all ports)${c.reset}`,
      `    ${c.brightWhite}[6]${c.reset}  🔄 Restart a Service           ${c.gray}(vite / hermes / router)${c.reset}`,
      '',
      `  ${c.brightCyan}${c.bold}🤖 TASK & AGENT OPERATIONS${c.reset}`,
      `    ${c.brightWhite}[7]${c.reset}  ✨ ${c.bold}Create & Dispatch New Task${c.reset} ${c.brightGreen}[Instant AI Execution]${c.reset}`,
      `    ${c.brightWhite}[8]${c.reset}  ▶  ${c.bold}Run Existing Task${c.reset}          ${c.gray}(Trigger Todo/Waiting task)${c.reset}`,
      `    ${c.brightWhite}[9]${c.reset}  📋 List & Search Tasks        ${c.gray}(Filter by status/worker/priority)${c.reset}`,
      `    ${c.brightWhite}[10]${c.reset} 🔎 Task Detail Inspection     ${c.gray}(View task parameters & run)${c.reset}`,
      `    ${c.brightWhite}[11]${c.reset} ⛔ Force-Stop Task Run        ${c.gray}(Cancel active agent run)${c.reset}`,
      `    ${c.brightWhite}[12]${c.reset} 🛑 Emergency Stop ALL Runs    ${c.gray}(Kill all active runs)${c.reset}`,
      `    ${c.brightWhite}[13]${c.reset} 🗑  Delete a Task              ${c.gray}(Soft-delete or permanent)${c.reset}`,
      '',
      `  ${c.brightYellow}${c.bold}🛡️ GOVERNANCE & OBSERVABILITY${c.reset}`,
      `    ${c.brightWhite}[14]${c.reset} 👁  ${c.bold}Live Watch Dashboard (top)${c.reset}  ${c.brightCyan}[Real-time auto-refresh]${c.reset}`,
      `    ${c.brightWhite}[15]${c.reset} 💰 Token & Cost Ledger        ${c.gray}(Multi-model financial telemetry)${c.reset}`,
      `    ${c.brightWhite}[16]${c.reset} 🛡  Approval Gate Review       ${c.gray}(Approve/Reject pending actions)${c.reset}`,
      `    ${c.brightWhite}[17]${c.reset} 🔍 Error Diagnostics & Logs   ${c.gray}(Deep failure analysis)${c.reset}`,
      '',
      `  ${c.brightMagenta}${c.bold}👥 DIRECTORY & SYSTEM HEALTH${c.reset}`,
      `    ${c.brightWhite}[18]${c.reset} 👥 Digital Worker Directory   ${c.gray}(Roster & skill profiles)${c.reset}`,
      `    ${c.brightWhite}[19]${c.reset} 📁 Project Directory & Paths  ${c.gray}(Workspace folder validation)${c.reset}`,
      `    ${c.brightWhite}[20]${c.reset} 🩺 ${c.bold}Satria Doctor Check${c.reset}        ${c.brightGreen}[Pre-flight & environment diagnostics]${c.reset}`,
      `    ${c.brightWhite}[21]${c.reset} 💾 Database Backup & Restore  ${c.gray}(Snapshot manager)${c.reset}`,
      `    ${c.brightWhite}[22]${c.reset} 🌐 Open Web App in Browser    ${c.gray}(http://localhost:5173)${c.reset}`,
      `    ${c.brightWhite}[0]${c.reset}  🚪 Exit Command Center         ${c.gray}(Quit)${c.reset}`,
      '',
    ], 76))
    console.log()

    const choice = (await ask(`  ${c.brightGreen}${c.bold}SATRIA ❯ ${c.reset}`)).trim()

    if (choice === '1') {
      await startAllServices(false)
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '2') {
      await startService('vite', false)
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '3') {
      await startService('hermes', false)
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '4') {
      await startService('router', false)
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '5') {
      await stopAllServices()
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '6') {
      const svcChoice = (await ask(`  ${c.brightCyan}Service mana? (vite/hermes/router): ${c.reset}`)).trim().toLowerCase()
      if (['vite', 'hermes', 'router'].includes(svcChoice)) await restartService(svcChoice)
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '7') {
      // Create & Dispatch Task Wizard
      console.clear()
      console.log(`\n  ${c.brightCyan}${c.bold}✨ DISPATCH NEW AI WORKFORCE TASK${c.reset}\n`)
      const title = (await ask(`  ${c.bold}Judul Task:${c.reset} `)).trim()
      if (title) {
        const desc = (await ask(`  ${c.bold}Deskripsi (opsional):${c.reset} `)).trim()
        printWorkerList()
        const workerId = (await ask(`  ${c.bold}Pilih Worker ID / Nama [emp-raka]:${c.reset} `)).trim() || 'emp-raka'
        const priority = (await ask(`  ${c.bold}Priority (Low/Medium/High/Urgent) [Medium]:${c.reset} `)).trim() || 'Medium'
        const executeNow = (await ask(`  ${c.bold}Jalankan sekarang? (Y/n):${c.reset} `)).trim().toLowerCase() !== 'n'
        dispatchTask({ title, description: desc, workerId, priority, runImmediately: executeNow })
      }
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '8') {
      // Run Existing Task
      console.clear()
      printTaskList({ status: 'Todo' })
      const taskId = (await ask(`  ${c.brightCyan}Masukkan Task ID yang akan dijalankan: ${c.reset}`)).trim()
      if (taskId) runExistingTask(taskId)
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '9') {
      console.clear()
      const search = (await ask(`  ${c.brightCyan}Filter pencarian keyword / status (kosongkan untuk semua): ${c.reset}`)).trim()
      if (search) {
        printTaskList({ search })
      } else {
        printTaskList()
      }
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '10') {
      console.clear()
      printTaskList()
      const taskId = (await ask(`  ${c.brightCyan}Masukkan Task ID: ${c.reset}`)).trim()
      if (taskId) { console.clear(); printTaskDetail(taskId) }
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '11') {
      console.clear()
      await printTaskMonitor()
      const taskId = (await ask(`\n  ${c.brightYellow}Task ID yang akan di-stop: ${c.reset}`)).trim()
      if (taskId) forceStopTask(taskId)
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '12') {
      const confirm = (await ask(`  ${c.brightRed}⚠ EMERGENCY: Force-stop SEMUA agent run aktif? (y/N): ${c.reset}`)).trim().toLowerCase()
      if (confirm === 'y' || confirm === 'yes') forceStopAllRuns()
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '13') {
      console.clear()
      printTaskList()
      const taskId = (await ask(`\n  ${c.brightYellow}Task ID yang akan dihapus: ${c.reset}`)).trim()
      if (taskId) {
        const permChoice = (await ask(`  ${c.brightYellow}Hapus permanen atau soft-delete? (soft/permanent) [soft]: ${c.reset}`)).trim().toLowerCase()
        const isPerm = permChoice === 'permanent' || permChoice === 'p'
        deleteTask(taskId, 'Deleted via CLI', isPerm)
      }
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '14') {
      // Live Watch Mode
      await startLiveWatchMode()
    } else if (choice === '15') {
      console.clear()
      printTelemetryAndCost()
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '16') {
      // Approval Gate
      console.clear()
      const db = readDatabase()
      const pendingRuns = (db?.agent_runs || []).filter(r => r.status === 'AwaitingApproval' || r.status === 'Waiting')
      if (pendingRuns.length === 0) {
        console.log(`\n  ${c.brightGreen}✔ Tidak ada run yang membutuhkan persetujuan (AwaitingApproval).${c.reset}\n`)
      } else {
        console.log(`\n  ${c.brightYellow}${c.bold}⚠ RUNS MEMBUTUHKAN PERSETUJUAN:${c.reset}\n`)
        for (const r of pendingRuns) {
          console.log(`  • Run ID: ${c.cyan}${r.id}${c.reset} | Task: ${c.bold}${r.taskTitle}${c.reset} | Agent: ${r.employeeName}`)
        }
        const actionRunId = (await ask(`\n  ${c.brightCyan}Masukkan Run ID: ${c.reset}`)).trim()
        if (actionRunId) {
          const action = (await ask(`  ${c.brightYellow}Pilih tindakan: (a)pprove / (r)eject [a]: ${c.reset}`)).trim().toLowerCase()
          if (action === 'r' || action === 'reject') {
            const reason = (await ask(`  Alasan penolakan: `)).trim() || 'Rejected via CLI'
            rejectRun(actionRunId, reason)
          } else {
            approveRun(actionRunId)
          }
        }
      }
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '17') {
      console.clear()
      await printErrorDiagnostics()
      streamCombinedLogs()
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '18') {
      console.clear()
      printWorkerList()
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '19') {
      console.clear()
      printProjectList()
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '20') {
      console.clear()
      await runSatriaDoctor()
      await ask(`  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '21') {
      console.clear()
      console.log(`\n  ${c.brightCyan}${c.bold}💾 DATABASE SNAPSHOT & BACKUP MANAGER${c.reset}\n`)
      console.log(`  [1] 📦 Buat Backup Baru Sekarang`)
      console.log(`  [2] 📋 Lihat Daftar Backup`)
      console.log(`  [3] 🔄 Restore Database dari File Backup`)
      const bChoice = (await ask(`\n  Pilihan: `)).trim()
      if (bChoice === '1') {
        createDatabaseBackup()
      } else if (bChoice === '2') {
        listDatabaseBackups()
      } else if (bChoice === '3') {
        const backups = listDatabaseBackups()
        if (backups.length > 0) {
          const fileToRestore = (await ask(`  Masukkan nama file backup untuk di-restore: `)).trim()
          if (fileToRestore) restoreDatabaseBackup(fileToRestore)
        }
      }
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '22') {
      console.log(`  ${c.brightCyan}🌐${c.reset} Membuka http://localhost:5173...`)
      openBrowser('http://localhost:5173')
      await ask(`\n  ${c.gray}[Enter] untuk kembali...${c.reset}`)
    } else if (choice === '0' || choice.toLowerCase() === 'exit' || choice.toLowerCase() === 'q') {
      console.log(`\n  ${c.brightGreen}Terima kasih telah menggunakan SATRIA AI WORKFORCE. Sampai jumpa!${c.reset}\n`)
      rl.close()
      process.exit(0)
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// CLI Direct Argument Dispatcher
// ────────────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log()
  console.log(drawBox('SATRIA AI WORKFORCE CLI — v3.0 Guide', [
    '',
    `  ${c.bold}${c.brightGreen}🚀 SERVICE ORCHESTRATION${c.reset}`,
    `    ${c.brightCyan}satria${c.reset}                             Interactive Terminal Dashboard`,
    `    ${c.brightCyan}satria start${c.reset}                       Start ALL services (9Router + Hermes + Vite)`,
    `    ${c.brightCyan}satria stop${c.reset}                        Stop ALL services`,
    `    ${c.brightCyan}satria dev${c.reset}                         Start Vite Web App only (port 5173)`,
    `    ${c.brightCyan}satria hermes${c.reset}                      Start Hermes Gateway only (port 8642)`,
    `    ${c.brightCyan}satria 9router${c.reset}                     Start 9Router proxy only (port 20128)`,
    `    ${c.brightCyan}satria restart <svc>${c.reset}               Restart service (vite/hermes/router)`,
    `    ${c.brightCyan}satria status${c.reset}                      Health check all ports & database`,
    `    ${c.brightCyan}satria open${c.reset}                        Open web app in default browser`,
    '',
    `  ${c.bold}${c.brightCyan}🤖 TASK & AGENT OPERATIONS${c.reset}`,
    `    ${c.brightCyan}satria dispatch "<title>"${c.reset}          Create & instantly execute task via AI Worker`,
    `    ${c.brightCyan}satria run-task <id>${c.reset}               Trigger execution for existing task`,
    `    ${c.brightCyan}satria tasks${c.reset}                       List all tasks in registry`,
    `    ${c.brightCyan}satria tasks --active${c.reset}              List active tasks only`,
    `    ${c.brightCyan}satria tasks --search <query>${c.reset}      Search tasks by keyword`,
    `    ${c.brightCyan}satria task <id>${c.reset}                   Detailed task inspection`,
    `    ${c.brightCyan}satria stop-task <id>${c.reset}              Force-stop a running task`,
    `    ${c.brightCyan}satria stop-all-runs${c.reset}               Emergency stop ALL active runs`,
    `    ${c.brightCyan}satria delete-task <id>${c.reset}            Soft-delete a task`,
    `    ${c.brightCyan}satria delete-task <id> --force${c.reset}   Permanent delete a task`,
    '',
    `  ${c.bold}${c.brightYellow}🛡️ GOVERNANCE & OBSERVABILITY${c.reset}`,
    `    ${c.brightCyan}satria watch${c.reset} / ${c.brightCyan}satria top${c.reset}          Live dynamic terminal dashboard (top mode)`,
    `    ${c.brightCyan}satria cost${c.reset} / ${c.brightCyan}satria stats${c.reset}           Token usage & financial spend ledger`,
    `    ${c.brightCyan}satria approve <run-id>${c.reset}           Approve a Human-in-the-Loop pending action`,
    `    ${c.brightCyan}satria reject <run-id>${c.reset}            Reject a pending action`,
    `    ${c.brightCyan}satria errors${c.reset}                      Deep failure & error diagnostics`,
    `    ${c.brightCyan}satria logs${c.reset}                        Stream combined service logs`,
    '',
    `  ${c.bold}${c.brightMagenta}👥 DIRECTORY & SYSTEM HEALTH${c.reset}`,
    `    ${c.brightCyan}satria workers${c.reset}                     List all digital employees & skills`,
    `    ${c.brightCyan}satria projects${c.reset}                    List projects and workspace paths`,
    `    ${c.brightCyan}satria doctor${c.reset}                      Comprehensive system health & pre-flight check`,
    `    ${c.brightCyan}satria backup${c.reset}                      Create timestamped snapshot of database`,
    `    ${c.brightCyan}satria restore <file>${c.reset}              Restore database from snapshot`,
    '',
  ], 76, c.brightGreen))
  console.log()
}

async function main() {
  const args = process.argv.slice(2)
  const cmd = args[0]?.toLowerCase()

  if (!cmd || cmd === 'menu' || cmd === 'gui' || cmd === 'dashboard') {
    await showInteractiveMenu()
    return
  }

  switch (cmd) {
    // ── Service Commands ──
    case 'start':
    case 'up':
    case 'all':
      await startAllServices(true)
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

    case 'restart': {
      const svcKey = args[1]?.toLowerCase()
      if (!svcKey || !SERVICES[svcKey]) {
        console.log(`\n  ${c.brightRed}✖ Usage: ${c.brightCyan}satria restart <vite|hermes|router>${c.reset}\n`)
        process.exit(1)
      }
      await restartService(svcKey)
      process.exit(0)
      break
    }

    case 'status':
    case 'health':
    case 'check':
      await printStatusScreen()
      process.exit(0)
      break

    case 'open':
    case 'browser':
      console.log(`\n  ${c.brightCyan}🌐${c.reset} Membuka ${c.underline}http://localhost:5173${c.reset}...\n`)
      openBrowser('http://localhost:5173')
      setTimeout(() => process.exit(0), 500)
      break

    // ── Task & Dispatch Commands ──
    case 'dispatch':
    case 'create-task':
    case 'new-task': {
      const title = args[1]
      if (!title) {
        console.log(`\n  ${c.brightRed}✖ Usage: ${c.brightCyan}satria dispatch "<title>" [--worker <id>] [--priority <Urgent|High|Medium|Low>]${c.reset}\n`)
        process.exit(1)
      }
      let workerId = null
      let priority = 'Medium'
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--worker' && args[i + 1]) workerId = args[++i]
        if (args[i] === '--priority' && args[i + 1]) priority = args[++i]
      }
      dispatchTask({ title, workerId, priority, runImmediately: true })
      process.exit(0)
      break
    }

    case 'run-task':
    case 'trigger':
    case 'execute': {
      const taskId = args[1]
      if (!taskId) {
        console.log(`\n  ${c.brightRed}✖ Usage: ${c.brightCyan}satria run-task <task-id>${c.reset}\n`)
        process.exit(1)
      }
      runExistingTask(taskId)
      process.exit(0)
      break
    }

    case 'tasks':
    case 'task': {
      const subArg = args[1]?.toLowerCase()
      if (cmd === 'task' && subArg && !subArg.startsWith('--')) {
        printTaskDetail(args[1])
      } else {
        const options = {}
        if (args.includes('--active') || args.includes('--running')) options.status = 'In Progress'
        if (args.includes('--todo')) options.status = 'Todo'
        if (args.includes('--done')) options.status = 'Done'
        const searchIdx = args.indexOf('--search')
        if (searchIdx !== -1 && args[searchIdx + 1]) options.search = args[searchIdx + 1]
        const workerIdx = args.indexOf('--worker')
        if (workerIdx !== -1 && args[workerIdx + 1]) options.worker = args[workerIdx + 1]
        printTaskList(options)
      }
      process.exit(0)
      break
    }

    case 'runs':
    case 'run':
      await printTaskMonitor()
      process.exit(0)
      break

    case 'stop-task':
    case 'stoptask': {
      const taskId = args[1]
      if (!taskId) {
        console.log(`\n  ${c.brightRed}✖ Usage: ${c.brightCyan}satria stop-task <task-id>${c.reset}\n`)
        process.exit(1)
      }
      forceStopTask(taskId)
      process.exit(0)
      break
    }

    case 'stop-all-runs':
    case 'stopallruns':
      forceStopAllRuns()
      process.exit(0)
      break

    case 'delete-task':
    case 'deletetask': {
      const taskId = args[1]
      if (!taskId) {
        console.log(`\n  ${c.brightRed}✖ Usage: ${c.brightCyan}satria delete-task <task-id> [--force]${c.reset}\n`)
        process.exit(1)
      }
      const isPermanent = args.includes('--force') || args.includes('-f')
      deleteTask(taskId, 'Deleted via CLI', isPermanent)
      process.exit(0)
      break
    }

    // ── Governance & Observability ──
    case 'watch':
    case 'top':
    case 'live':
      await startLiveWatchMode()
      break

    case 'cost':
    case 'stats':
    case 'telemetry':
      printTelemetryAndCost()
      process.exit(0)
      break

    case 'approve': {
      const runId = args[1]
      if (!runId) {
        console.log(`\n  ${c.brightRed}✖ Usage: ${c.brightCyan}satria approve <run-id>${c.reset}\n`)
        process.exit(1)
      }
      approveRun(runId)
      process.exit(0)
      break
    }

    case 'reject': {
      const runId = args[1]
      if (!runId) {
        console.log(`\n  ${c.brightRed}✖ Usage: ${c.brightCyan}satria reject <run-id> [reason]${c.reset}\n`)
        process.exit(1)
      }
      const reason = args.slice(2).join(' ') || 'Rejected via CLI'
      rejectRun(runId, reason)
      process.exit(0)
      break
    }

    case 'errors':
    case 'error':
    case 'diag':
      await printErrorDiagnostics()
      process.exit(0)
      break

    case 'logs':
    case 'log':
      streamCombinedLogs()
      process.exit(0)
      break

    // ── Diagnostics & System ──
    case 'doctor':
      await runSatriaDoctor()
      process.exit(0)
      break

    case 'backup':
      createDatabaseBackup()
      process.exit(0)
      break

    case 'backups':
      listDatabaseBackups()
      process.exit(0)
      break

    case 'restore': {
      const file = args[1]
      if (!file) {
        console.log(`\n  ${c.brightRed}✖ Usage: ${c.brightCyan}satria restore <backup-filename>${c.reset}\n`)
        listDatabaseBackups()
        process.exit(1)
      }
      restoreDatabaseBackup(file)
      process.exit(0)
      break
    }

    case 'workers':
    case 'employees':
      printWorkerList()
      process.exit(0)
      break

    case 'projects':
      printProjectList()
      process.exit(0)
      break

    case 'help':
    case '--help':
    case '-h':
      printHelp()
      process.exit(0)
      break

    default:
      console.log(`\n  ${c.brightRed}✖ Perintah '${cmd}' tidak dikenali.${c.reset}`)
      console.log(`  Jalankan ${c.brightCyan}satria help${c.reset} untuk melihat daftar perintah lengkap.\n`)
      process.exit(1)
  }
}

process.on('SIGINT', () => {
  console.log(`\n  ${c.dim}Menerima sinyal interrupt. Menutup...${c.reset}`)
  process.exit(0)
})

main().catch((err) => {
  console.error(`\n  ${c.brightRed}Fatal Error: ${err.message}${c.reset}\n`)
  process.exit(1)
})
