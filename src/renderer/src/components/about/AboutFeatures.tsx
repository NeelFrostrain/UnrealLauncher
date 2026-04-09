import { Zap, Package, Activity, Code, RefreshCw, AlertTriangle, BookOpen } from 'lucide-react'

const features = [
  { icon: <Package className="text-blue-400" size={20} />, title: 'Engine Management', desc: 'Scan and manage multiple Unreal Engine versions (UE4 & UE5)' },
  { icon: <Activity className="text-purple-400" size={20} />, title: 'Project Tracking', desc: 'Automatically find and organize your Unreal projects with thumbnails' },
  { icon: <Zap className="text-green-400" size={20} />, title: 'Quick Launch', desc: 'Launch engines and projects with a single click' },
  { icon: <Code className="text-yellow-400" size={20} />, title: 'Size Calculation', desc: 'Calculate exact folder sizes with background processing' },
  { icon: <RefreshCw className="text-orange-400" size={20} />, title: 'Recent Projects', desc: 'Sorted by actual last-opened time using Saved/Logs timestamps' },
  { icon: <AlertTriangle className="text-cyan-400" size={20} />, title: 'Toast Notifications', desc: 'Real-time feedback for all user actions and operations' },
  { icon: <BookOpen className="text-pink-400" size={20} />, title: 'Settings Page', desc: 'Customize app behavior and user preferences' },
  { icon: <Activity className="text-indigo-400" size={20} />, title: 'Smooth Animations', desc: 'Beautiful framer-motion animations throughout the interface' },
]

const AboutFeatures = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4 flex items-center gap-2">
      <Zap size={20} className="text-blue-400" />
      Features
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map(({ icon, title, desc }) => (
        <div key={title} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          </div>
          <p className="text-xs text-white/50">{desc}</p>
        </div>
      ))}
    </div>
  </div>
)

export default AboutFeatures
