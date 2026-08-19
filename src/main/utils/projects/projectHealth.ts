import fs from 'fs'
import path from 'path'
import { loadEngines } from '../../store'
import { getNative } from '../native'

export interface HealthIssue {
  type: 'info' | 'warning' | 'critical'
  message: string
  recommendation: string
}

export interface HealthReport {
  score: number
  status: 'healthy' | 'warning' | 'critical'
  issues: HealthIssue[]
  intermediateSize: number
  savedSize: number
  isCpp: boolean
  hasEngine: boolean
  engineVersion: string
}

/**
 * Runs a comprehensive health check on an Unreal Engine project using the Rust native backend.
 */
export async function checkProjectHealth(projectPath: string): Promise<HealthReport> {
  const native = getNative()

  if (native?.inspectProjectHealthDeepNative) {
    try {
      const deepReport = native.inspectProjectHealthDeepNative(projectPath)
      let hasEngine = deepReport.hasEngine
      const engineVersion = deepReport.engineVersion ?? 'Unknown'

      if (hasEngine && engineVersion !== 'Unknown') {
        if (!engineVersion.startsWith('{')) {
          const engines = loadEngines()
          const matched = engines.some(
            (eng) =>
              eng.version === engineVersion ||
              eng.version.startsWith(engineVersion + '.') ||
              engineVersion.startsWith(eng.version + '.')
          )
          if (!matched) {
            hasEngine = false
          }
        }
      }

      const issues: HealthIssue[] = (deepReport.issues || []).map((i) => ({
        type: ((i as any).issueType || (i as any).issue_type || 'info').toLowerCase() as
          | 'info'
          | 'warning'
          | 'critical',
        message: i.message || '',
        recommendation: i.recommendation || ''
      }))

      let finalScore = typeof deepReport.score === 'number' ? deepReport.score : 100
      if (engineVersion !== 'Unknown') {
        if (!hasEngine) {
          const alreadyHas = issues.some((i) => i.message.includes('Engine version mismatch'))
          if (!alreadyHas) {
            issues.push({
              type: 'warning',
              message: `Engine version mismatch (Project uses UE ${engineVersion})`,
              recommendation: `No matching or compatible engine version was found registered. Add Unreal Engine ${engineVersion} in the Engines tab.`
            })
            finalScore = Math.max(0, finalScore - 20)
          }
        }
      }

      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (finalScore < 50) {
        status = 'critical'
      } else if (finalScore < 80) {
        status = 'warning'
      }

      return {
        score: finalScore,
        status,
        issues,
        intermediateSize: (deepReport as any).intermediateSizeBytes ?? (deepReport as any).intermediate_size_bytes ?? 0,
        savedSize: (deepReport as any).savedSizeBytes ?? (deepReport as any).saved_size_bytes ?? 0,
        isCpp: (deepReport as any).isCpp ?? (deepReport as any).is_cpp ?? false,
        hasEngine,
        engineVersion
      }
    } catch {
      /* fall through to JS fallback */
    }
  }

  // Pure JS Fallback
  return _checkProjectHealthJS(projectPath)
}

function _checkProjectHealthJS(projectPath: string): HealthReport {
  const root = path.resolve(projectPath)
  if (!fs.existsSync(root)) {
    return {
      score: 0,
      status: 'critical',
      issues: [
        {
          type: 'critical',
          message: 'Project folder not found on disk',
          recommendation: 'Verify that the project directory exists.'
        }
      ],
      intermediateSize: 0,
      savedSize: 0,
      isCpp: false,
      hasEngine: false,
      engineVersion: 'Unknown'
    }
  }

  let engineVersion = 'Unknown'
  let hasEngine = false
  const isCpp = fs.existsSync(path.join(root, 'Source'))

  try {
    const files = fs.readdirSync(root)
    const uproj = files.find((f) => f.endsWith('.uproject'))
    if (uproj) {
      const data = JSON.parse(fs.readFileSync(path.join(root, uproj), 'utf8'))
      if (data.EngineAssociation) {
        engineVersion = String(data.EngineAssociation)
        const engines = loadEngines()
        hasEngine = engines.some((e) => e.version === engineVersion || engineVersion.startsWith(e.version))
      }
    }
  } catch {
    /* ignore */
  }

  const issues: HealthIssue[] = []
  let score = 100

  if (!fs.existsSync(path.join(root, '.git'))) {
    score -= 10
    issues.push({
      type: 'info',
      message: 'No Version Control Detected',
      recommendation: 'Project is not using Git. Consider initializing a repository.'
    })
  }

  const status: 'healthy' | 'warning' | 'critical' = score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical'

  return {
    score,
    status,
    issues,
    intermediateSize: 0,
    savedSize: 0,
    isCpp,
    hasEngine,
    engineVersion
  }
}
