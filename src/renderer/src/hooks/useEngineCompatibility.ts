// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Engine compatibility badge hook.
 *
 * Uses a module-level engines cache that is populated once (lazily) via a
 * single `load-saved-engines` IPC call. The cache is shared across all card
 * instances so only one round-trip is ever made.
 *
 * The EnginesPage also writes to the same cache via `setEnginesCache` whenever
 * it loads/refreshes its engine list, keeping it in sync without extra IPCs.
 */

export type CompatibilityStatus = 'matched' | 'partial' | 'missing' | 'unknown'

export interface EngineCompatibility {
  status: CompatibilityStatus
  /** Shown on the badge tooltip */
  tooltip: string
}

// ── Module-level shared cache ─────────────────────────────────────────────────
let _engines: EngineData[] = []
let _loadPromise: Promise<EngineData[]> | null = null

/** Called by the EnginesPage after it loads its engine list — free sync update */
export function setEnginesCache(engines: EngineData[]): void {
  _engines = engines
  _loadPromise = Promise.resolve(engines) // satisfy pending callers immediately
}

function loadEnginesOnce(): Promise<EngineData[]> {
  if (_engines.length) return Promise.resolve(_engines)
  if (_loadPromise) return _loadPromise
  _loadPromise = window.electronAPI
    .scanEngines()
    .then((engines) => {
      _engines = engines
      return engines
    })
    .catch(() => {
      _loadPromise = null
      return [] as EngineData[]
    })
  return _loadPromise
}

// ── Compatibility logic ───────────────────────────────────────────────────────
function computeCompatibility(version: string, engines: EngineData[]): EngineCompatibility {
  // GUID-based associations (Epic Games Launcher managed, Windows only)
  if (version?.startsWith('{')) {
    return {
      status: 'unknown',
      tooltip: 'GUID engine association — managed by Epic Games Launcher'
    }
  }

  if (!version || version === 'Unknown') {
    return { status: 'unknown', tooltip: 'Engine version not detected' }
  }

  if (!engines.length) {
    return { status: 'unknown', tooltip: 'No engines loaded' }
  }

  for (const engine of engines) {
    const ev = engine.version
    // Exact match
    if (ev === version) {
      return { status: 'matched', tooltip: `Engine ${ev} — ready to launch` }
    }
    // Prefix match (e.g. project "5.3" stored, engine "5.3.2" installed, or vice-versa)
    if (ev.startsWith(version + '.') || version.startsWith(ev + '.')) {
      return {
        status: 'partial',
        tooltip: `Engine ${ev} is a close match for project version ${version}`
      }
    }
  }

  return {
    status: 'missing',
    tooltip: `No engine found for version ${version} — add it in the Engines tab`
  }
}

// ── Per-version result cache (avoids recomputing on every render) ─────────────
const _resultCache = new Map<string, EngineCompatibility>()

export function clearEngineCompatibilityCache(): void {
  _resultCache.clear()
  _engines = []
  _loadPromise = null
}

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

export function useEngineCompatibility(projectVersion: string): EngineCompatibility {
  const [compat, setCompat] = useState<EngineCompatibility>(() => {
    // Return cached result synchronously if available
    if (_resultCache.has(projectVersion)) return _resultCache.get(projectVersion)!
    if (_engines.length) {
      const r = computeCompatibility(projectVersion, _engines)
      _resultCache.set(projectVersion, r)
      return r
    }
    return { status: 'unknown', tooltip: 'Checking…' }
  })

  useEffect(() => {
    // If result is already cached, nothing async needed
    if (_resultCache.has(projectVersion)) return
    let cancelled = false
    loadEnginesOnce().then((engines) => {
      if (cancelled) return
      const r = computeCompatibility(projectVersion, engines)
      _resultCache.set(projectVersion, r)
      setCompat(r)
    })
    return () => {
      cancelled = true
    }
  }, [projectVersion])

  return compat
}
