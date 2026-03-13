import { Plus } from "lucide-react";
import type { FC } from "react";

interface PageTitleBarProps {
  title: string;
  showAddButton?: boolean;
  description: string;
}

const PageTitleBar: FC<PageTitleBarProps> = ({
  title,
  showAddButton,
  description,
}) => {
  return (
    <div className="w-full h-fit mt-1 px-2 flex justify-between items-center">
      <div>
        <h1 className="font-semibold text-xl">{title}</h1>
        <p className="text-sm mt-px text-white/50">{description}</p>
      </div>
      {showAddButton && (
        <button className="cursor-pointer flex justify-center items-center bg-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-black/5 border border-transparent hover:border-blue-700 transition-all duration-200 hover:text-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Engine
        </button>
      )}
    </div>
  );
};

export default PageTitleBar;
