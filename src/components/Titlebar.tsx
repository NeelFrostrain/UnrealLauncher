import { useEffect, useState } from "react";
import { Minus, Square, X, Copy } from "lucide-react";

const Titlebar = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize();
    setIsMaximized((prev) => !prev);
  };

  const handleClose = () => {
    window.electronAPI?.windowClose();
  };

  useEffect(() => {
    const updateState = async () => {
      const maximized = await window.electronAPI?.windowIsMaximized();
      setIsMaximized(!!maximized);
    };

    updateState();

    const interval = setInterval(updateState, 500);
    return () => clearInterval(interval);
  }, []);

  const dragStyle = { WebkitAppRegion: "drag" } as React.CSSProperties;
  const noDragStyle = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

  return (
    <div className="w-full h-10 bg-[#1a1a1a] border-b border-white/10 flex items-center px-3 select-none">
      <div className="flex-1 h-full flex items-center" style={dragStyle}>
        {/* Empty draggable area */}
      </div>

      <div className="flex items-center gap-0.5" style={noDragStyle}>
        <button
          onClick={handleMinimize}
          className="w-11 h-9 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus size={16} strokeWidth={2} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-9 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label={isMaximized ? "Restore" : "Maximize"}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <Copy size={13} strokeWidth={2} />
          ) : (
            <Square size={13} strokeWidth={2} />
          )}
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-9 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
          aria-label="Close"
          title="Close"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default Titlebar;
