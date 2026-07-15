import { loadEngines } from '../store'
import { getNative } from './native'

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
  if (!native) {
    throw new Error('Native module not loaded')
  }

  const report = native.checkProjectHealth(projectPath)

  // Double check engine compatibility against user's registered engines (JS state)
  let hasEngine = report.hasEngine
  if (hasEngine && report.engineVersion !== 'Unknown') {
    if (!report.engineVersion.startsWith('{')) {
      const engines = loadEngines()
      const matched = engines.some(
        (eng) =>
          eng.version === report.engineVersion ||
          eng.version.startsWith(report.engineVersion + '.') ||
          report.engineVersion.startsWith(eng.version + '.')
      )
      if (!matched) {
        hasEngine = false
      }
    }
  }

  const issues = report.issues.map((i) => ({
    type: i.severity.toLowerCase() as 'info' | 'warning' | 'critical',
    message: i.message,
    recommendation: i.fixSuggestion || ''
  }))

  // If engine compatibility check failed in JS, append the warning issue & adjust score
  let finalScore = report.score
  if (report.engineVersion !== 'Unknown') {
    if (!hasEngine) {
      // Check if we already have the mismatch issue in the list
      const alreadyHas = issues.some((i) => i.message.includes('Engine version mismatch'))
      if (!alreadyHas) {
        issues.push({
          type: 'warning',
          message: `Engine version mismatch (Project uses UE ${report.engineVersion})`,
          recommendation: `No matching or compatible engine version was found registered. Add Unreal Engine ${report.engineVersion} in the Engines tab.`
        })
        finalScore = Math.max(0, finalScore - 20)
      }
    }
  } else {
    const alreadyHas = issues.some((i) => i.message.includes('Engine version is unknown'))
    if (!alreadyHas) {
      issues.push({
        type: 'warning',
        message: 'Engine version is unknown or missing in .uproject',
        recommendation: 'Open the project descriptor or right-click the project to set/associate a valid engine version.'
      })
      finalScore = Math.max(0, finalScore - 15)
    }
  }

  // Deduce status based on final score
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
    intermediateSize: report.intermediateSizeBytes,
    savedSize: report.savedSizeBytes,
    isCpp: report.isCpp,
    hasEngine,
    engineVersion: report.engineVersion
  }
}
