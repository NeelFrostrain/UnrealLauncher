import { useEffect, useState, type FC } from "react";
import PageTitleBar from "../components/PageTitlebar";
import { generateGradient } from "../utils/generateGradient";
import { FolderOpen, Play, SquareX } from "lucide-react";
import type { EngineCardProps } from "../types";
import PageWrapper from "../layout/PageWrapper";

export const mockData: EngineCardProps[] = [
  {
    version: "5.4.1",
    exePath:
      "C:/Program Files/Epic Games/UE_5.4/Engine/Binaries/Win64/UnrealEditor.exe",
    directoryPath: "C:/Program Files/Epic Games/UE_5.4",
    folderSize: "124.8 GB",
    lastLaunch: "Yesterday at 4:20 PM",
  },
  {
    version: "5.3.2",
    exePath: "D:/Unreal/UE_5.3/Engine/Binaries/Win64/UnrealEditor.exe",
    directoryPath: "D:/Unreal/UE_5.3",
    folderSize: "118.2 GB",
    lastLaunch: "3 days ago",
  },
  {
    version: "5.1.0",
    exePath: "C:/UE_Versions/UE_5.1/Engine/Binaries/Win64/UnrealEditor.exe",
    directoryPath: "C:/UE_Versions/UE_5.1",
    folderSize: "102.5 GB",
    lastLaunch: "Oct 12, 2023",
  },
  {
    version: "4.27.2",
    exePath:
      "C:/Program Files/Epic Games/UE_4.27/Engine/Binaries/Win64/UE4Editor.exe",
    directoryPath: "C:/Program Files/Epic Games/UE_4.27",
    folderSize: "64.2 GB",
    lastLaunch: "Never",
  },
];

const EngineCard: FC<EngineCardProps> = ({
  version,
  exePath,
  directoryPath,
  folderSize,
  lastLaunch,
}) => {
  const [currentGradient, setCurrentGradient] = useState("");

  useEffect(() => {
    setCurrentGradient(generateGradient());
  }, []);

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
          <div>
            <h3 className="text-sm font-medium text-white/90">
              Unreal Engine {version}
            </h3>
            <p className="text-[11px] text-white/40 mt-1 font-mono">
              {directoryPath}
            </p>
          </div>
          <button className="p-1 hover:bg-white/5 transition-colors cursor-pointer text-white/50 hover:text-red-500/80 rounded-md">
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
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-medium transition-all cursor-pointer">
              <FolderOpen size={14} />
              Directory
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer">
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
  return (
    <PageWrapper>
      {/* <PageTitleBar
        title="Core Engines"
        description="Installed Engine Version"
        showAddButton
      /> */}
      <div className="flex-1 space-y-2 overflow-y-auto py-3 px-1.5">
        {mockData.map((data, index) => (
          <EngineCard key={index} {...data} />
        ))}
      </div>
    </PageWrapper>
  );
};

export default EnginesPage;
