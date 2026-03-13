export type PageType = "Engines" | "Projects" | "About";

export interface EngineCardProps {
  version: string;
  exePath: string;
  directoryPath: string;
  folderSize: string;
  lastLaunch: string;
  gradient?: string;
}

export interface Project {
  name: string;
  version: string;
  size: string;
  createdAt: string;
  thumbnail?: string;
  projectPath?: string;
}

declare global {
  interface Window {
    electronAPI: {
      scanEngines: () => Promise<EngineCardProps[]>;
      scanProjects: () => Promise<Project[]>;
      launchEngine: (
        exePath: string,
      ) => Promise<{ success: boolean; error?: string }>;
      launchProject: (
        projectPath: string,
      ) => Promise<{ success: boolean; error?: string }>;
      openDirectory: (dirPath: string) => Promise<void>;
      selectEngineFolder: () => Promise<EngineCardProps | null>;
      selectProjectFolder: () => Promise<Project | null>;
      windowMinimize: () => void;
      windowMaximize: () => void;
      windowClose: () => void;
      windowIsMaximized: () => Promise<boolean>;
      deleteEngine: (directoryPath: string) => Promise<boolean>;
      deleteProject: (projectPath: string) => Promise<boolean>;
      onSizeCalculated: (callback: (data: { type: string; path: string; size: string }) => void) => void;
      calculateEngineSize: (directoryPath: string) => Promise<{ success: boolean; size?: string; error?: string }>;
      calculateProjectSize: (projectPath: string) => Promise<{ success: boolean; size?: string; error?: string }>;
      loadImage: (imagePath: string) => Promise<string | null>;
    };
  }
}
