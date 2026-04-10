import { RefreshCw, Download, CheckCircle, GitBranch } from 'lucide-react'
import { SectionHeader, Card } from '../SectionHelpers'
import { useUpdateCheck } from '../../../hooks/useUpdateCheck'

const UpdatesSection = (): React.ReactElement => {
  const {
    updateStatus,
    updateMessage,
    updateVersion,
    githubVersion,
    githubStatus,
    githubMessage,
    handleCheckForUpdates,
    handleDownloadUpdate,
    checkGitHubVersion
  } = useUpdateCheck()

  return (
    <section>
      <SectionHeader
        icon={<RefreshCw size={13} className="text-blue-300" />}
        label="Updates"
        accent="bg-blue-500/20"
      />
      <Card>
        {/* Check for updates */}
        <div className="px-5 py-4 border-b border-white/5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/85">Check for updates</p>
              <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                Check for and download new versions of Unreal Launcher
              </p>
              {updateMessage && (
                <p
                  className={`text-xs mt-2 ${
                    updateStatus === 'error'
                      ? 'text-red-400'
                      : updateStatus === 'available'
                        ? 'text-yellow-400'
                        : updateStatus === 'ready'
                          ? 'text-green-400'
                          : 'text-white/50'
                  }`}
                >
                  {updateMessage}
                </p>
              )}
            </div>
            <div className="shrink-0 flex gap-2">
              {(updateStatus === 'idle' ||
                updateStatus === 'no-update' ||
                updateStatus === 'error') && (
                <button
                  onClick={handleCheckForUpdates}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 hover:bg-blue-500/18 text-blue-400 border border-blue-500/20 transition-all cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Check
                </button>
              )}
              {updateStatus === 'checking' && (
                <button
                  disabled
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/5 text-blue-400/50 border border-blue-500/15 cursor-not-allowed"
                >
                  <RefreshCw size={12} className="animate-spin" />
                  Checking…
                </button>
              )}
              {updateStatus === 'available' && (
                <button
                  onClick={handleDownloadUpdate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 hover:bg-green-500/18 text-green-400 border border-green-500/20 transition-all cursor-pointer"
                >
                  <Download size={12} />v{updateVersion}
                </button>
              )}
              {updateStatus === 'downloading' && (
                <button
                  disabled
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/5 text-green-400/50 border border-green-500/15 cursor-not-allowed"
                >
                  <Download size={12} className="animate-pulse" />
                  Downloading…
                </button>
              )}
              {updateStatus === 'ready' && (
                <button
                  onClick={() => window.electronAPI?.installUpdate?.()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/18 text-purple-400 border border-purple-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle size={12} />
                  Install
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Check GitHub version */}
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/85">GitHub version check</p>
              <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                Check the latest release version on GitHub
              </p>
              {githubVersion && (
                <p className="text-xs text-white/50 mt-2">Latest on GitHub: v{githubVersion}</p>
              )}
              {githubMessage && (
                <p
                  className={`text-xs mt-2 ${githubStatus === 'error' ? 'text-red-400' : 'text-white/50'}`}
                >
                  {githubMessage}
                </p>
              )}
            </div>
            <div className="shrink-0 flex gap-2">
              {(githubStatus === 'idle' ||
                githubStatus === 'success' ||
                githubStatus === 'error') && (
                <button
                  onClick={checkGitHubVersion}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    githubStatus === 'error'
                      ? 'bg-red-500/10 hover:bg-red-500/18 text-red-400 border border-red-500/20'
                      : 'bg-purple-500/10 hover:bg-purple-500/18 text-purple-400 border border-purple-500/20'
                  }`}
                >
                  {githubStatus === 'error' ? <RefreshCw size={12} /> : <GitBranch size={12} />}
                  {githubStatus === 'success'
                    ? 'Recheck'
                    : githubStatus === 'error'
                      ? 'Retry'
                      : 'Check'}
                </button>
              )}
              {githubStatus === 'checking' && (
                <button
                  disabled
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/5 text-purple-400/50 border border-purple-500/15 cursor-not-allowed"
                >
                  <RefreshCw size={12} className="animate-spin" />
                  Checking…
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}

export default UpdatesSection
