import type { FC, ReactNode } from 'react'
import type { PageType } from '../types'
import { Activity, Package, Zap } from 'lucide-react'
import usePagesStore from '@renderer/store/usePagesStore'
import Engine_BG from '@renderer/assets/Engines_BG.webp'
import Projects_BG from '@renderer/assets/Projects_BG.jpg'
import ProjectDefault from '@renderer/assets/ProjectDefault.avif'

interface SidebarCardData {
  title: PageType
  imageSrc: string
  icon: ReactNode
}

const SidebarCards: SidebarCardData[] = [
  {
    title: 'Engines',
    imageSrc: Engine_BG,
    icon: <Zap size={15.5} strokeWidth={1.8} />
  },
  {
    title: 'Projects',
    imageSrc: Projects_BG,
    icon: <Package size={15.5} strokeWidth={1.8} />
  },
  {
    title: 'About',
    imageSrc: ProjectDefault,
    icon: <Activity size={15.5} strokeWidth={1.8} />
  }
]

interface SidebarCardProps {
  title: PageType
  icon: ReactNode
  imageSrc: string
  isActive?: boolean
  currentActivePage?: PageType
  onClick?: () => void
}

const SidebarCard: FC<SidebarCardProps> = ({ title, icon, imageSrc, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full relative ${
        isActive
          ? 'border-blue-600 shadow-lg shadow-blue-600/20'
          : 'border-[#171717] hover:border-white/10'
      } cursor-pointer h-24 rounded-md border-2 overflow-hidden transition-all duration-200`}
    >
      <img
        src={imageSrc}
        alt={title}
        className={`w-full h-full object-cover rounded-md transition-all duration-200 ${
          isActive ? 'scale-105' : 'group-hover:scale-105'
        }`}
      />

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 rounded-md transition-opacity duration-200 ${
          isActive ? 'opacity-90' : 'opacity-80 hover:opacity-90'
        }`}
        aria-hidden="true"
      />

      <div className="absolute bottom-1 left-2 text-white text-base font-semibold p-1 flex justify-center items-center gap-1.5 uppercase z-20">
        {icon}
        {title}
      </div>
    </button>
  )
}

const Sidebar = () => {
  const { currentPage, setCurrentPage } = usePagesStore()

  const handleCardClick = (page: PageType) => {
    if (currentPage !== page) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="w-72 h-full border-r-2 border-black p-4">
      <div className="w-full h-fit bg-[#1a1a1a] flex justify-start items-center p-2 rounded-sm flex-col gap-2">
        {SidebarCards.map((card, index) => (
          <SidebarCard
            key={index}
            icon={card.icon}
            title={card.title}
            imageSrc={card.imageSrc}
            isActive={currentPage === card.title}
            onClick={() => handleCardClick(card.title)}
          />
        ))}
      </div>
    </div>
  )
}

export default Sidebar
