import type { FC } from "react";
import usePagesStore from "../stores/usePagesStore";
import type { PageType } from "../types";

interface SidebarCardData {
  title: PageType;
  imageSrc: string;
}

const SidebarCards: SidebarCardData[] = [
  {
    title: "Engines",
    imageSrc: "/assets/Engines_BG.webp",
  },
  {
    title: "Projects",
    imageSrc: "/assets/Projects_BG.jpg",
  },
  {
    title: "About",
    imageSrc: "/assets/About_BG.jpg",
  },
];

interface SidebarCardProps {
  title: PageType;
  imageSrc: string;
  isActive?: boolean;
  currentActivePage?: PageType;
  onClick?: () => void;
}

const SidebarCard: FC<SidebarCardProps> = ({
  title,
  imageSrc,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full relative ${isActive ? "border-blue-600" : "hover:border-white/5"} cursor-pointer h-24 rounded-md border-[#171717] border-2 overflow-hidden`}
    >
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-full object-cover rounded-md"
      />

      <div
        className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent opacity-80 z-10 rounded-md"
        aria-hidden="true"
      />

      <p className="absolute bottom-1 left-2 text-white text-base font-semibold p-1 uppercase z-20">
        {title}
      </p>
    </button>
  );
};

const Sidebar = () => {
  const { currentPage, setCurrentPage } = usePagesStore();

  const handleCardClick = (page: PageType) => {
    if (currentPage !== page) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-72 h-full border-r-2 border-black p-4">
      <div className="w-full h-fit bg-[#1a1a1a] flex justify-start items-center p-2 rounded-sm flex-col gap-2">
        {SidebarCards.map((card, index) => (
          <SidebarCard
            key={index}
            title={card.title}
            imageSrc={card.imageSrc}
            isActive={currentPage === card.title}
            onClick={() => handleCardClick(card.title)}
          />
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
