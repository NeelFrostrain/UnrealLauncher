import { motion } from 'framer-motion'
import type { FC, ReactNode } from 'react'
import type { PageType } from '../types'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import TimelineIcon from '@mui/icons-material/Timeline'
import SettingsIcon from '@mui/icons-material/Settings'
import usePagesStore from '@renderer/store/usePagesStore'
import Engine_BG from '@renderer/assets/Engines_BG.webp'
import Projects_BG from '@renderer/assets/Projects_BG.jpg'
import ProjectDefault from '@renderer/assets/ProjectDefault.avif'
import Settings_BG from '@renderer/assets/Settings_BG.jpg'

interface SidebarCardData {
  title: PageType
  imageSrc: string
  icon: ReactNode
}

const SidebarCards: SidebarCardData[] = [
  {
    title: 'Engines',
    imageSrc: Engine_BG,
    icon: <FlashOnIcon sx={{ fontSize: 15.5 }} />
  },
  {
    title: 'Projects',
    imageSrc: Projects_BG,
    icon: <Inventory2Icon sx={{ fontSize: 15.5 }} />
  },
  {
    title: 'Settings',
    imageSrc: Settings_BG,
    icon: <SettingsIcon sx={{ fontSize: 15.5 }} />
  },
  {
    title: 'About',
    imageSrc: ProjectDefault,
    icon: <TimelineIcon sx={{ fontSize: 15.5 }} />
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

const SidebarCard: FC<SidebarCardProps> = ({
  title,
  icon,
  imageSrc,
  isActive,
  onClick
}): React.ReactElement => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
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
        className={`absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent z-10 rounded-md transition-opacity duration-200 ${
          isActive ? 'opacity-90' : 'opacity-80 hover:opacity-90'
        }`}
        aria-hidden="true"
      />

      <div className="absolute bottom-1 left-2 text-white text-base font-semibold p-1 flex justify-center items-center gap-1.5 uppercase z-20">
        {icon}
        {title}
      </div>
    </motion.button>
  )
}

const Sidebar = (): React.ReactElement => {
  const { currentPage, setCurrentPage } = usePagesStore()

  const handleCardClick = (page: PageType): void => {
    if (currentPage !== page) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="w-72 h-full border-r border-white/10 p-4">
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
