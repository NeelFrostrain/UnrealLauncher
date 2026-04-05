import type { FC, ReactNode } from 'react'

const ProjectCardButton: FC<{
  icon: ReactNode
  onClick?: () => void
  title?: string
}> = ({ icon, onClick, title }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-md bg-[#121212] border border-white/10 hover:border-blue-600/40 hover:text-blue-600/70 flex justify-center cursor-pointer items-center text-white transition-colors shadow-lg shadow-blue-900/20"
    >
      {icon}
    </button>
  )
}

export default ProjectCardButton
