import { useEffect, useState, type FC } from "react";
import { generateGradient } from "../utils/generateGradient";
import { FolderOpen, Play, SquareX } from "lucide-react";
import type { EngineCardProps } from "../types";
import PageWrapper from "../layout/PageWrapper";
import PageTitleBar from "../components/PageTitlebar";

const EngineCard: FC<
  EngineCardProps & {
    onLaunch: (exePath: string) => void;
    onOpenDir: (dirPath: string) => void;
    onDelete: (dirPath: string) => void;
  }
> = ({
  version,
  exePath,
  directoryPath,
  folderSize,
  lastLaunch,
  gradient,
  onLaunch,
  onOpenDir,
  onDelete,
}) => {
  const [currentGradient] = useState(gradient || generateGradient());

  return (
    <div className="w-full h-30 bg-[#161616] overflow-hidden rounded-md border border-white/5 flex group hover:border-white/10 transition-all duration-150 ease-in-out select-text">
      <div
        className="w-48 p-5 border-r border-white/10 h-full flex flex-col justify-between relative select-none"
        style={{ background: currentGradient }}
      >
        <div className="absolute z-0 inset-0 bg-black/10 backdrop-blur-[1px]" />

        <div className="relative z-10">
          <p className="opacity-80 uppercase text-[10px] font-bold tracking-[0.2em]">
            Version
          </p>
        </div>
        <h1 className="text-4xl z-20 font-black tracking-tight mt-1">
          {version}
        </h1>
      </div>

      <div className="flex-1 h-full bg-[#121212]/50 flex flex-col p-4 justify-between">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white/90">
              Unreal Engine {version}
            </h3>
            <p className="text-[11px] text-white/40 mt-1 font-mono truncate" title={directoryPath}>
              {directoryPath}
            </p>
          </div>
          <button 
            onClick={() => onDelete(directoryPath)}
            className="p-1 hover:bg-white/5 transition-colors cursor-pointer text-white/50 hover:text-red-500/80 rounded-md ml-2"
            title="Remove from list"
          >
            <SquareX size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-white/30 tracking-wide font-semibold">
                Size
              </span>
              <span className="text-xs text-white/70">{folderSize}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-white/30 tracking-wide font-semibold">
                Usage
              </span>
              <span className="text-xs text-white/70">{lastLaunch}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onOpenDir(directoryPath)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-medium transition-all cursor-pointer"
              title="Open in Explorer"
            >
              <FolderOpen size={14} />
              Directory
            </button>
            <button
              onClick={() => onLaunch(exePath)}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
              title="Launch Engine"
            >
              <Play size={14} fill="currentColor" />
              Launch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnginesPage = () => {
  const [engines, setEngines] = useState<EngineCardProps[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Don't auto-scan on mount, just load saved data
    const loadSavedEngines = async () => {
      if (window.electronAPI) {
        try {
          // Just load from saved data without scanning
          const scannedEngines = await window.electronAPI.scanEngines();
          setEngines(scannedEngines);
        } catch (err) {
          console.error("Failed to load engines:", err);
        }
      }
    };
    loadSavedEngines();
    
    // Listen for size updates
    if (window.electronAPI) {
      window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'engine') {
          setEngines((prev) =>
            prev.map((e) =>
              e.directoryPath === data.path ? { ...e, folderSize: data.size } : e
            )
          );
        }
      });
    }
  }, []);

  const handleScan = async () => {
    setScanning(true);
    if (window.electronAPI) {
      try {
        const scannedEngines = await window.electronAPI.scanEngines();
        setEngines(scannedEngines);
      } catch (err) {
        console.error("Failed to scan engines:", err);
      }
    }
    setScanning(false);
  };

  const handleLaunch = async (exePath: string) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.launchEngine(exePath);
      if (!result.success) {
        alert("Failed to launch engine: " + result.error);
      }
    }
  };

  const handleOpenDir = async (dirPath: string) => {
    if (window.electronAPI) {
      await window.electronAPI.openDirectory(dirPath);
    }
  };

  const handleDelete = async (dirPath: string) => {
    if (confirm("Remove this engine from the list? (Files will not be deleted)")) {
      setEngines((prev) => prev.filter((e) => e.directoryPath !== dirPath));
      if (window.electronAPI) {
        await window.electronAPI.deleteEngine(dirPath);
      }
    }
  };

  const handleAddEngine = async () => {
    if (!window.electronAPI) return;
    const engine = await window.electronAPI.selectEngineFolder();
    if (!engine) {
      alert(
        "Engine already exists or no valid Unreal Engine folder selected.",
      );
      return;
    }
    // Check if already in UI state
    if (engines.find(e => e.directoryPath === engine.directoryPath)) {
      alert("This engine is already added.");
      return;
    }
    setEngines((prev) => [engine, ...prev]);
  };

  return (
    <PageWrapper>
      <PageTitleBar
        title="Engines"
        description="Installed Unreal Engine versions"
        showScanButton
        showAddButton
        scanButtonText="Scan for Engines"
        addButtonText="Add Engine"
        onScan={handleScan}
        onAdd={handleAddEngine}
        scanning={scanning}
      />

      <div className="flex-1 space-y-2 overflow-y-auto py-3 px-1.5">
        {engines.length > 0 ? (
          engines.map((data, index) => (
            <EngineCard
              key={`${data.directoryPath}-${index}`}
              {...data}
              onLaunch={handleLaunch}
              onOpenDir={handleOpenDir}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-white/50">
            <p className="text-lg mb-2">No engines found</p>
            <p className="text-sm text-white/30 mb-4">Click "Scan for Engines" to search or add manually</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default EnginesPage;
