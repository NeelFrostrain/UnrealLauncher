// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import ProjectContextMenu from './ProjectContextMenu'
import { ToastProvider } from '../ui/ToastContext'

describe('ProjectContextMenu', () => {
  it('renders project status badges in the header', () => {
    render(
      <ToastProvider>
        <ProjectContextMenu
          x={120}
          y={80}
          name="My Project"
          projectPath="C:/Projects/MyProject"
          projectVersion="5.4"
          isFavorite
          isHidden
          gitInitialized
          gitBranch="main"
          gitRemoteUrl=""
          onLaunch={vi.fn()}
          onLaunchGame={vi.fn()}
          onLaunchWithConfig={vi.fn()}
          onFavorite={vi.fn()}
          onOpenDir={vi.fn()}
          onHide={vi.fn()}
          onViewLogs={vi.fn()}
          onGitInit={vi.fn()}
          onClose={vi.fn()}
          onOpenCommitDialog={vi.fn()}
          onOpenBranchDialog={vi.fn()}
          onOpenFileEditor={vi.fn()}
          onOpenPlugins={vi.fn()}
        />
      </ToastProvider>
    )

    expect(screen.getByText('My Project')).toBeInTheDocument()
    expect(screen.getByText('Favorite')).toBeInTheDocument()
    expect(screen.getByText('Hidden')).toBeInTheDocument()
    expect(screen.getByText('Git')).toBeInTheDocument()
  })
})
