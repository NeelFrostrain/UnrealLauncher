import { useEffect, useState, useCallback } from 'react'
import PageWrapper from '../layout/PageWrapper'
import { Cpu, MemoryStick, Zap, Package, Clock, Play, FolderOpen, Activity, MonitorDot, RefreshCw } from 'lucide-react'
import { generateGradient } from '../utils/generateGradient'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatUptime(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}
function formatRam(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`
}
function cpuColor(v: number): string {
  return v > 80 ? '#f87171' : v > 50 ? '#fbbf24' : '#4ade80'
}
function ramColor(mb: number): string {
  return mb > 16384 ? '#f87171' : mb > 8192 ? '#fbbf24' : '#4ade80'
}

// ── Meter bar ─────────────────────────────────────────────────────────────────
function MeterBar({ value, max, color }: { value: number; max: number; color: string }): React.ReactElement {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

// ── Hero — live session ───────────────────────────────────────────────────────
function LiveHero({ session }: { session: ActiveSession }): React.ReactElement {
  const isProject = session.sessionType === 'project'
  const [uptime, setUptime] = useState(() => formatUptime(session.startedAt))
  const [gradient] = useState(() => generateGradient())

  useEffect(() => {
    const id = setInterval(() => setUptime(formatUptime(session.startedAt)), 1000)
    return () => clearInterval(id)
  }, [session.startedAt])

  return (
    <div className="relative overflow-hidden w-full" style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', minHeight: 200 }}>
      {/* Gradient banner */}
      <div className="absolute inset-0" style={{ background: gradient, opacity: 0.18 }} />
      <div className="absolute inset-0 bg-linear-to-r from-black/60 via-transparent to-transparent" />

      <div className="relative z-10 p-6 flex flex-col gap-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="w-14 h-14 flex items-center justify-center shrink-0"
              style={{ borderRadius: 'calc(var(--radius) * 1.2)', background: gradient, border: '2px solid rgba(255,255,255,0.15)' }}>
              {isProject
                ? <Package size={24} className="text-white" />
                : <Zap size={24} className="text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5"
                  style={{ borderRadius: '9999px', backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  LIVE
                </span>
                <span className="text-[10px] px-2 py-0.5"
                  style={{ borderRadius: '9999px', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                  {isProject ? 'Project' : 'Engine'}
                </span>
              </div>
              <h2 className="text-xl font-black text-white leading-tight">
                {isProject ? (session.projectName || 'Unknown Project') : `Unreal Engine ${session.engineVersion}`}
              </h2>
              <p className="text-xs font-mono mt-0.5 truncate max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {isProject ? session.projectPath : session.engineRoot}
              </p>
            </div>
          </div>

          {/* Uptime */}
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Uptime</p>
            <p className="text-2xl font-black font-mono text-white">{uptime}</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>PID {session.pid}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {/* CPU */}
          <div className="flex flex-col gap-2 p-3" style={{ borderRadius: 'var(--radius)', backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu size={12} style={{ color: cpuColor(session.cpuPercent) }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>CPU</span>
              </div>
              <span className="text-sm font-black font-mono" style={{ color: cpuColor(session.cpuPercent) }}>
                {session.cpuPercent.toFixed(1)}%
              </span>
            </div>
            <MeterBar value={session.cpuPercent} max={100} color={cpuColor(session.cpuPercent)} />
          </div>

          {/* RAM */}
          <div className="flex flex-col gap-2 p-3" style={{ borderRadius: 'var(--radius)', backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MemoryStick size={12} style={{ color: ramColor(session.ramMb) }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>RAM</span>
              </div>
              <span className="text-sm font-black font-mono" style={{ color: ramColor(session.ramMb) }}>
                {formatRam(session.ramMb)}
              </span>
            </div>
            <MeterBar value={session.ramMb} max={32768} color={ramColor(session.ramMb)} />
          </div>

          {/* GPU */}
          <div className="flex flex-col gap-2 p-3" style={{ borderRadius: 'var(--radius)', backgroundColor: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity size={12} style={{ color: 'var(--color-accent)' }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>GPU VRAM</span>
              </div>
              <span className="text-sm font-black font-mono" style={{ color: 'var(--color-accent)' }}>
                {session.gpuVramMb > 0 ? formatRam(session.gpuVramMb) : '—'}
              </span>
            </div>
            <MeterBar value={session.gpuVramMb} max={16384} color="var(--color-accent)" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isProject && session.projectPath && (
            <button onClick={() => window.electronAPI.openDirectory(session.projectPath)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer"
              style={{ borderRadius: 'var(--radius)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <FolderOpen size={12} /> Open Folder
            </button>
          )}
          <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
            UE {session.engineVersion}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Last session card ─────────────────────────────────────────────────────────
function LastSessionCard({ session }: { session: ActiveSession }): React.ReactElement {
  const isProject = session.sessionType === 'project'
  const [hovered, setHovered] = useState(false)

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 transition-colors"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))' : 'var(--color-border)'}`,
        transition: 'background-color 150ms ease, border-color 150ms ease'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-9 h-9 flex items-center justify-center shrink-0"
        style={{ borderRadius: 'calc(var(--radius) * 0.75)', backgroundColor: isProject ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'rgba(251,191,36,0.1)', border: `1px solid ${isProject ? 'color-mix(in srgb, var(--color-accent) 22%, transparent)' : 'rgba(251,191,36,0.2)'}` }}>
        {isProject ? <Package size={16} style={{ color: 'var(--color-accent)' }} /> : <Zap size={16} style={{ color: '#fbbf24' }} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {isProject ? (session.projectName || 'Unknown Project') : `Unreal Engine ${session.engineVersion}`}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono px-1.5 py-px"
            style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', color: 'var(--color-accent)', border: '1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
            UE {session.engineVersion}
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            <Clock size={9} />
            {new Date(session.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {isProject && session.projectPath && (
          <button onClick={() => window.electronAPI.openDirectory(session.projectPath)}
            className="p-1.5 cursor-pointer transition-colors"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', color: 'var(--color-text-muted)', backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent', border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}` }}>
            <FolderOpen size={13} />
          </button>
        )}
        <button
          onClick={() => isProject
            ? session.projectPath && window.electronAPI.launchProject(session.projectPath)
            : session.exePath && window.electronAPI.launchEngine(session.exePath)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer text-white"
          style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', boxShadow: '0 2px 8px color-mix(in srgb, var(--color-accent) 30%, transparent)' }}>
          <Play size={11} /> Launch
        </button>
      </div>
    </div>
  )
}

// ── Recent project row ────────────────────────────────────────────────────────
function RecentProjectRow({ project }: { project: ProjectData }): React.ReactElement {
  const [hovered, setHovered] = useState(false)
  const imageSrc = project.thumbnail ? `local-asset:///${project.thumbnail.replace(/\\/g, '/')}` : null

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 transition-colors"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 25%, var(--color-border))' : 'var(--color-border)'}`,
        transition: 'background-color 150ms ease, border-color 150ms ease'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 shrink-0 overflow-hidden"
        style={{ borderRadius: 'calc(var(--radius) * 0.6)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}>
        {imageSrc
          ? <img src={imageSrc} alt={project.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg font-black" style={{ color: 'var(--color-border)' }}>{project.name.charAt(0)}</span>
            </div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{project.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] font-mono px-1 py-px"
            style={{ borderRadius: 'calc(var(--radius) * 0.3)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', color: 'var(--color-accent)', border: '1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
            UE {project.version}
          </span>
          {project.lastOpenedAt && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {new Date(project.lastOpenedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => project.projectPath && window.electronAPI.launchProject(project.projectPath)}
        className="flex p-1.5 cursor-pointer shrink-0 transition-all"
        style={{ borderRadius: 'calc(var(--radius) * 0.5)', backgroundColor: hovered ? 'var(--color-accent)' : 'var(--color-surface-elevated)', color: hovered ? 'white' : 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
        <Play size={11} />
      </button>
    </div>
  )
}

// ── Empty hero ────────────────────────────────────────────────────────────────
function EmptyHero(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12"
      style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', border: '1px dashed var(--color-border)' }}>
      <div className="w-14 h-14 flex items-center justify-center"
        style={{ borderRadius: 'calc(var(--radius) * 1.2)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 15%, transparent)' }}>
        <MonitorDot size={24} style={{ color: 'var(--color-accent)', opacity: 0.5 }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>No active sessions</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Launch Unreal Editor to see live stats here</p>
      </div>
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
      {children}
    </p>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage(): React.ReactElement {
  const [live, setLive] = useState<ActiveSession[]>([])
  const [engines, setEngines] = useState<EngineData[]>([])
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const load = useCallback(async (): Promise<void> => {
    const [sessions, eng, proj] = await Promise.all([
      window.electronAPI.getActiveSessions(),
      window.electronAPI.scanEngines(),
      window.electronAPI.scanProjects()
    ])
    setLive(sessions)
    setEngines(eng.slice(0, 3))
    setProjects(proj.slice(0, 5))
    setLoading(false)
    setTick(t => t + 1)
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [load])

  const hasLive = live.length > 0

  // Build last-session cards from history
  const lastSessions: ActiveSession[] = []
  if (!hasLive) {
    if (projects[0]) lastSessions.push({
      pid: 0, exePath: '', engineVersion: projects[0].version, engineRoot: '',
      sessionType: 'project', projectName: projects[0].name,
      projectPath: projects[0].projectPath ?? '', cpuPercent: 0, ramMb: 0, gpuVramMb: 0,
      startedAt: projects[0].lastOpenedAt ?? projects[0].createdAt,
      updatedAt: projects[0].lastOpenedAt ?? projects[0].createdAt
    })
    if (engines[0]) lastSessions.push({
      pid: 0, exePath: engines[0].exePath, engineVersion: engines[0].version,
      engineRoot: engines[0].directoryPath, sessionType: 'engine',
      projectName: '', projectPath: '', cpuPercent: 0, ramMb: 0, gpuVramMb: 0,
      startedAt: engines[0].lastLaunch, updatedAt: engines[0].lastLaunch
    })
  }

  return (
    <PageWrapper>
      <div className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Dashboard</p>
            <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {hasLive ? `${live.length} session${live.length > 1 ? 's' : ''} running` : 'No active sessions'}
            </p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer disabled:opacity-50"
            style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-6">
          {/* Hero */}
          <div>
            <SectionLabel>{hasLive ? 'Active Now' : 'Last Session'}</SectionLabel>
            {hasLive ? (
              <div className="flex flex-col gap-3">
                {live.map(s => <LiveHero key={s.pid} session={s} />)}
              </div>
            ) : lastSessions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {lastSessions.map((s, i) => <LastSessionCard key={i} session={s} />)}
              </div>
            ) : (
              <EmptyHero />
            )}
          </div>

          {/* Recent projects */}
          {projects.length > 0 && (
            <div>
              <SectionLabel>Recent Projects</SectionLabel>
              <div className="flex flex-col gap-1.5">
                {projects.map(p => <RecentProjectRow key={p.projectPath} project={p} />)}
              </div>
            </div>
          )}

          {/* Engines */}
          {engines.length > 0 && (
            <div>
              <SectionLabel>Installed Engines</SectionLabel>
              <div className="flex flex-col gap-1.5">
                {engines.map(e => (
                  <div key={e.directoryPath} className="flex items-center gap-3 px-3 py-2.5"
                    style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
                    <div className="w-9 h-9 flex items-center justify-center shrink-0"
                      style={{ borderRadius: 'calc(var(--radius) * 0.75)', backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <Zap size={15} style={{ color: '#fbbf24' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>Unreal Engine {e.version}</p>
                      <p className="text-[10px] font-mono truncate" style={{ color: 'var(--color-text-muted)' }}>{e.directoryPath}</p>
                    </div>
                    <button onClick={() => window.electronAPI.launchEngine(e.exePath)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer text-white"
                      style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)' }}>
                      <Play size={11} /> Launch
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
