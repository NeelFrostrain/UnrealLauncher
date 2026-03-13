import { Plus, RefreshCw } from "lucide-react";
import type { FC } from "react";

interface PageTitleBarProps {
  title: string;
  showAddButton?: boolean;
  showScanButton?: boolean;
  description: string;
  addButtonText?: string;
  scanButtonText?: string;
  onAdd?: () => void;
  onScan?: () => void;
  scanning?: boolean;
}

const PageTitleBar: FC<PageTitleBarProps> = ({
  title,
  showAddButton,
  showScanButton,
  description,
  addButtonText = "Add",
  scanButtonText = "Scan",
  onAdd,
  onScan,
  scanning = false,
}) => {
  return (
    <div className="w-full h-fit mt-1 px-2 flex justify-between items-center">
      <div>
        <h1 className="font-semibold text-xl">{title}</h1>
        <p className="text-sm mt-px text-white/50">{description}</p>
      </div>
      <div className="flex gap-2">
        {showScanButton && (
          <button
            onClick={onScan}
            disabled={scanning}
            className={`cursor-pointer flex justify-center items-center px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 ${
              scanning
                ? "bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/30"
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning..." : scanButtonText}
          </button>
        )}
        {showAddButton && (
          <button
            onClick={onAdd}
            className="cursor-pointer flex justify-center items-center bg-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 border border-transparent transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageTitleBar;
