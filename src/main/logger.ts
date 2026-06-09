// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import util from 'util'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_LABELS: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: 'INFO ',
  warn: 'WARN ',
  error: 'ERROR'
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m'
}

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const originalConsole = {
  debug: console.debug.bind(console),
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
}

let logFilePath: string | null = null
let consoleBridgeInstalled = false
let processHandlersInstalled = false

function getTimestampForFile(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, '-')
}

function getLogFilePath(): string {
  if (logFilePath) return logFilePath

  logFilePath = path.join(
    getLogsDir(),
    `unreal-launcher-${getTimestampForFile()}-${process.pid}.log`
  )
  return logFilePath
}

export function getLogsDir(): string {
  let baseDir = process.cwd()
  try {
    baseDir = app.getPath('userData')
  } catch {
    /* app paths may be unavailable very early in startup */
  }

  const logsDir = path.join(baseDir, 'save', 'logs')
  fs.mkdirSync(logsDir, { recursive: true })
  return logsDir
}

export function clearLogFiles(): number {
  const logsDir = getLogsDir()
  let removed = 0
  for (const entry of fs.readdirSync(logsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.log')) continue
    try {
      fs.unlinkSync(path.join(logsDir, entry.name))
      removed += 1
    } catch {
      /* ignore locked or already removed files */
    }
  }
  return removed
}

function compactValue(value: unknown, depth = 0): unknown {
  if (value == null) return value
  if (value instanceof Error) return `${value.name}: ${value.message}`
  if (typeof value === 'string') return value.length > 240 ? `${value.slice(0, 237)}...` : value
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) {
    const compact = value.slice(0, 5).map((item) => compactValue(item, depth + 1))
    return value.length > 5 ? [...compact, `...+${value.length - 5}`] : compact
  }
  if (depth >= 2) return '[object]'

  const compact: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (item === undefined || typeof item === 'function') continue
    compact[key] = compactValue(item, depth + 1)
  }
  return compact
}

function serialize(value: unknown): string {
  const compact = compactValue(value)
  if (typeof compact === 'string') return compact
  return util.inspect(compact, { colors: false, depth: 3, breakLength: Infinity, compact: true })
}

function stringifyMessage(message: unknown, meta: unknown[]): string {
  const parts = [message, ...meta].map(serialize).filter(Boolean)
  return parts.join(' ')
}

function writeToFile(line: string): void {
  try {
    fs.appendFileSync(getLogFilePath(), `${line}\n`, 'utf8')
  } catch {
    /* logging must never crash the app */
  }
}

function writeToConsole(level: LogLevel, line: string): void {
  const colored = `${LEVEL_COLORS[level]}${line}${RESET}`
  if (level === 'error') {
    originalConsole.error(colored)
  } else if (level === 'warn') {
    originalConsole.warn(colored)
  } else if (level === 'debug') {
    originalConsole.debug(colored)
  } else {
    originalConsole.log(colored)
  }
}

export function log(level: LogLevel, scope: string, message: unknown, ...meta: unknown[]): void {
  if (level === 'debug' && process.env.DEBUG_LOGS !== '1') return
  const timestamp = new Date().toISOString()
  const safeScope = scope || 'app'
  const text = stringifyMessage(message, meta)
  const line = `[${timestamp}] [${LEVEL_LABELS[level]}] [${safeScope}] ${text}`

  writeToFile(line)
  writeToConsole(level, `${DIM}${line.slice(0, 26)}${RESET}${line.slice(26)}`)
}

export const logger = {
  debug: (scope: string, message: unknown, ...meta: unknown[]) =>
    log('debug', scope, message, ...meta),
  info: (scope: string, message: unknown, ...meta: unknown[]) =>
    log('info', scope, message, ...meta),
  warn: (scope: string, message: unknown, ...meta: unknown[]) =>
    log('warn', scope, message, ...meta),
  error: (scope: string, message: unknown, ...meta: unknown[]) =>
    log('error', scope, message, ...meta),
  getLogFilePath,
  getLogsDir,
  clearLogFiles
}

export function installConsoleLogger(): void {
  if (consoleBridgeInstalled) return
  consoleBridgeInstalled = true

  console.debug = (...args: unknown[]) => log('debug', 'console', args[0] ?? '', ...args.slice(1))
  console.log = (...args: unknown[]) => log('info', 'console', args[0] ?? '', ...args.slice(1))
  console.info = (...args: unknown[]) => log('info', 'console', args[0] ?? '', ...args.slice(1))
  console.warn = (...args: unknown[]) => log('warn', 'console', args[0] ?? '', ...args.slice(1))
  console.error = (...args: unknown[]) => log('error', 'console', args[0] ?? '', ...args.slice(1))
}

export function installProcessErrorLogging(): void {
  if (processHandlersInstalled) return
  processHandlersInstalled = true

  process.on('uncaughtException', (error) => {
    logger.error('process', 'Uncaught exception', error)
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('process', 'Unhandled promise rejection', reason)
  })

  process.on('warning', (warning) => {
    logger.warn('process', warning.name, warning)
  })
}

export function initializeLogging(): void {
  installConsoleLogger()
  installProcessErrorLogging()
  logger.info('app', 'Logging initialized', { logFile: getLogFilePath() })
}
