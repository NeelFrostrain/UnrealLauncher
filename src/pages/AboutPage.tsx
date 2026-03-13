import PageWrapper from "../layout/PageWrapper";
import { Github, Heart, Zap, Package, Activity } from "lucide-react";

const AboutPage = () => {
  return (
    <PageWrapper>
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50">
              <span className="text-4xl font-black text-white">UL</span>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Unreal Launcher
            </h1>
            <p className="text-white/50 text-sm">
              A modern, lightweight launcher for Unreal Engine projects
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center space-y-2 hover:bg-white/10 transition-colors">
              <div className="flex justify-center">
                <Zap className="text-blue-400" size={24} />
              </div>
              <h3 className="text-sm font-semibold text-white/90">Fast</h3>
              <p className="text-xs text-white/50">Quick engine and project scanning</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center space-y-2 hover:bg-white/10 transition-colors">
              <div className="flex justify-center">
                <Package className="text-purple-400" size={24} />
              </div>
              <h3 className="text-sm font-semibold text-white/90">Simple</h3>
              <p className="text-xs text-white/50">Clean and intuitive interface</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center space-y-2 hover:bg-white/10 transition-colors">
              <div className="flex justify-center">
                <Activity className="text-green-400" size={24} />
              </div>
              <h3 className="text-sm font-semibold text-white/90">Efficient</h3>
              <p className="text-xs text-white/50">Lightweight and responsive</p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Version</span>
              <span className="text-sm font-mono text-white/90">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Built with</span>
              <span className="text-sm text-white/90">Electron + React + TypeScript</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">License</span>
              <span className="text-sm text-white/90">MIT</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
              >
                <Github size={16} />
                GitHub
              </a>
            </div>
            <p className="text-xs text-white/30 flex items-center justify-center gap-1">
              Made with <Heart size={12} className="text-red-500" fill="currentColor" /> for the Unreal Engine community
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AboutPage;
