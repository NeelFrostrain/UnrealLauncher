import { motion } from 'framer-motion'
import type { FC, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { PageType } from '../../types'
import { Zap, Package, Activity, Settings } from 'lucide-react'
import Engine_BG from '@renderer/assets/Engines_BG.webp'
import Projects_BG from '@renderer/assets/Projects_BG.jpg'
import ProjectDefault from '@renderer/assets/ProjectDefault.avif'
import Settings_BG from '@renderer/assets/Settings_BG.jpg'

interface SidebarCardData {
  title: PageType
  path: string
  imageSrc: string
  icon: ReactNode
}

const SidebarCards: SidebarCardData[] = [
  {
    title: 'Engines',
    path: '/engines',
    imageSrc: Engine_BG,
    icon: <Zap size={15.5} />
  },
  {
    title: 'Projects',
    path: '/projects',
    imageSrc: Projects_BG,
    icon: <Package size={15.5} />
  },
  {
    title: 'Settings',
    path: '/settings',
    imageSrc: Settings_BG,
    icon: <Settings size={15.5} />
  },
  {
    title: 'About',
    path: '/about',
    imageSrc: ProjectDefault,
    icon: <Activity size={15.5} />
  }
]

interface SidebarCardProps {
  title: PageType
  path: string
  icon: ReactNode
  imageSrc: string
  isActive?: boolean
}

const SidebarCard: FC<SidebarCardProps> = ({
  title,
  path,
  icon,
  imageSrc,
  isActive
}): React.ReactElement => {
  return (
    <Link to={path}>
      <motion.div
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
      </motion.div>
    </Link>
  )
}

const Sidebar = (): React.ReactElement => {
  const location = useLocation()

  return (
    <div className="w-72 h-full border-r border-white/10 p-4">
      <div className="w-full h-fit bg-[#1a1a1a] p-2 rounded-sm flex flex-col gap-2">
        {SidebarCards.map((card, index) => (
          <SidebarCard
            key={index}
            icon={card.icon}
            title={card.title}
            path={card.path}
            imageSrc={card.imageSrc}
            isActive={location.pathname === card.path}
          />
        ))}
      </div>
    </div>
  )
}

export default Sidebar
