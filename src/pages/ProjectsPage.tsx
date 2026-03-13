import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import PageWrapper from "../layout/PageWrapper";
import PageTitleBar from "../components/PageTitlebar";
import type { Project } from "../types";
import { FolderOpen, Play, Trash2 } from "lucide-react";

const baseUrl = import.meta.env.BASE_URL || "./";

const resolveAsset = (path?: string) => {
  if (!path) return `${baseUrl}assets/ProjectDefault.avif`;
  // If it's an absolute file path (local screenshot), convert to file:// URL
  if (path.includes(':\\') || (path.includes('/') && !path.startsWith('http'))) {
    // Normalize path separators and ensure proper file:// format
    const normalizedPath = path.replace(/\\/g, '/');
    return `file:///${normalizedPath}`;
  }
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("file:")) return path;
  return `${baseUrl}${path.replace(/^\//, "")}`;
};

const ProjectCardButton = ({
  icon,
  onClick,
  title,
}: {
  icon: ReactNode;
  onClick?: () => void;
  title?: string;
}) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-2 rounded-md bg-[#121212] border border-white/10 hover:border-blue-600/40 hover:text-blue-600/70 flex justify-center cursor-pointer items-center text-white transition-colors shadow-lg shadow-blue-900/20"
    >
      {icon}
    </button>
  );
};

const ProjectCard: FC<
  Project & {
    onLaunch: (projectPath: string) => void;
    onOpenDir: (dirPath: string) => void;
    onDelete: (projectPath: string) => void;
  }
> = ({
  createdAt,
  name,
  size,
  version,
  thumbnail,
  projectPath,
  onLaunch,
  onOpenDir,
  onDelete,
}) => {
  const [launching, setLaunching] = useState(false);
  const [currentSize, setCurrentSize] = useState(size);
  const [imageSrc, setImageSrc] = useState<string>(resolveAsset(undefined));

  useEffect(() => {
    const loadThumbnail = async () => {
      if (thumbnail && window.electronAPI) {
        const dataUrl = await window.electronAPI.loadImage(thumbnail);
        if (dataUrl) {
          setImageSrc(dataUrl);
        } else {
          setImageSrc(resolveAsset(undefined));
        }
      } else {
        setImageSrc(resolveAsset(undefined));
      }
    };
    loadThumbnail();
  }, [thumbnail]);

  useEffect(() => {
    setCurrentSize(size);
  }, [size]);

  const handleLaunch = async () => {
    if (!projectPath) return;
    setLaunching(true);
    await onLaunch(projectPath);
    setTimeout(() => setLaunching(false), 3000);
  };

  return (
    <div className="w-full h-52 bg-[#121212] rounded-md border border-white/10 cursor-pointer overflow-hidden hover:border-blue-500/50 hover:bg-[#1a1a1a] transition-all duration-200 ease-in-out group relative">
      {/* Launching Overlay */}
      {launching && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-white/90 font-medium">Launching...</p>
          </div>
        </div>
      )}

      {/* Hover Overlay Buttons */}
      <div className="absolute inset-0 z-20 flex items-center justify-center gap-4 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ProjectCardButton
          icon={<Play size={16} />}
          onClick={handleLaunch}
          title="Launch Project"
        />
        <ProjectCardButton
          icon={<FolderOpen size={16} />}
          onClick={() => projectPath && onOpenDir(projectPath)}
          title="Open Directory"
        />
        <ProjectCardButton 
          icon={<Trash2 size={16} />} 
          onClick={() => projectPath && onDelete(projectPath)}
          title="Remove from list"
        />
      </div>

      {/* Thumbnail Section */}
      <div className="w-full h-28 relative overflow-hidden">
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover opacity-100 group-hover:opacity-40 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = resolveAsset(undefined);
          }}
        />
        <img
          src={resolveAsset(thumbnail)}
          alt={name}
          className="w-full h-full object-cover opacity-100 group-hover:opacity-40 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = resolveAsset(undefined);
          }}
        />
        <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-blue-400">
          {version}
        </div>
      </div>

      {/* Accent Divider */}
      <div className="w-full h-0.5 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>

      {/* Info Section */}
      <div className="w-full p-3 flex flex-col justify-between h-[calc(100%-114px)]">
        <p className="text-sm font-semibold truncate text-gray-200 uppercase tracking-wider" title={name}>
          {name}
        </p>

        <div className="flex justify-between items-center mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold">
              Created
            </span>
            <span className="text-xs text-gray-400">{createdAt}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-gray-500 uppercase font-bold">
              Size
            </span>
            <span className="text-xs text-gray-400 font-mono">{currentSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Don't auto-scan, just load saved data
    const loadSavedProjects = async () => {
      if (window.electronAPI) {
        try {
          const scannedProjects = await window.electronAPI.scanProjects();
          setProjects(scannedProjects);
        } catch (err) {
          console.error("Failed to load projects:", err);
        }
      }
    };
    loadSavedProjects();
    
    // Listen for size updates
    if (window.electronAPI) {
      window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'project') {
          setProjects((prev) =>
            prev.map((p) =>
              p.projectPath === data.path ? { ...p, size: data.size } : p
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
        const scannedProjects = await window.electronAPI.scanProjects();
        setProjects([...scannedProjects]);
        
        // Calculate sizes for all projects with estimates
        for (const project of scannedProjects) {
          if (project.projectPath && project.size.startsWith('~')) {
            window.electronAPI.calculateProjectSize(project.projectPath).then(result => {
              if (result.success && result.size) {
                setProjects(prev => 
                  prev.map(p => 
                    p.projectPath === project.projectPath 
                      ? { ...p, size: result.size! } 
                      : p
                  )
                );
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to scan projects:", err);
      }
    }
    setScanning(false);
  };

  const handleLaunch = async (projectPath: string) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.launchProject(projectPath);
      if (!result.success) {
        alert("Failed to launch project: " + result.error);
      }
    }
  };

  const handleOpenDir = async (dirPath: string) => {
    if (window.electronAPI) {
      await window.electronAPI.openDirectory(dirPath);
    }
  };

  const handleDelete = async (projectPath: string) => {
    if (confirm("Remove this project from the list? (Files will not be deleted)")) {
      setProjects((prev) => prev.filter((p) => p.projectPath !== projectPath));
      if (window.electronAPI) {
        await window.electronAPI.deleteProject(projectPath);
      }
    }
  };

  const handleAddProject = async () => {
    if (!window.electronAPI) return;
    const project = await window.electronAPI.selectProjectFolder();
    if (!project) {
      alert(
        "Project already exists or no valid Unreal project folder found.",
      );
      return;
    }
    // Check if already in UI state
    if (projects.find(p => p.projectPath === project.projectPath)) {
      alert("This project is already added.");
      return;
    }
    setProjects((prev) => [project, ...prev]);
    
    // Calculate size for the new project if it has an estimate
    if (project.projectPath && project.size.startsWith('~')) {
      window.electronAPI.calculateProjectSize(project.projectPath).then(result => {
        if (result.success && result.size) {
          setProjects(prev => 
            prev.map(p => 
              p.projectPath === project.projectPath 
                ? { ...p, size: result.size! } 
                : p
            )
          );
        }
      });
    }
  };

  return (
    <PageWrapper>
      <PageTitleBar
        title="Projects"
        description="Your Unreal project list"
        showScanButton
        showAddButton
        scanButtonText="Scan for Projects"
        addButtonText="Add Project"
        onScan={handleScan}
        onAdd={handleAddProject}
        scanning={scanning}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto py-px px-2 mt-2">
        {projects.length > 0 ? (
          projects.map((data, index) => (
            <ProjectCard
              key={`${data.projectPath}-${index}`}
              {...data}
              onLaunch={handleLaunch}
              onOpenDir={handleOpenDir}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-full text-center text-white/50">
            <p className="text-lg mb-2">No projects found</p>
            <p className="text-sm text-white/30 mb-4">Click "Scan for Projects" to search or add manually</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ProjectsPage;
