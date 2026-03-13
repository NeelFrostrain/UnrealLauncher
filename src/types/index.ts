export type PageType = "Engines" | "Projects" | "About";

export interface EngineCardProps {
  version: string;
  exePath: string;
  directoryPath: string;
  folderSize: string;
  lastLaunch: string;
}
