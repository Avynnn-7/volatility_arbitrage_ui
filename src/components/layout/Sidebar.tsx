import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Box,
  Compass,
  FileDown,
  Home,
  Layers,
  LineChart,
  Settings,
  Shield,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface SidebarItem {
  path: string
  label: string
  icon: React.ElementType
  badge?: string
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { path: '/', label: 'Home', icon: Home },
      { path: '/wizard', label: 'Analysis Wizard', icon: Compass },
      { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    ],
  },
  {
    title: 'Visualization',
    items: [
      { path: '/surface', label: '3D Surface', icon: Box, badge: 'New' },
      { path: '/localvol', label: 'Local Volatility', icon: Layers },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { path: '/analysis', label: 'Deep Analysis', icon: Activity },
      { path: '/analysis/comparison', label: 'Comparison', icon: LineChart },
    ],
  },
  {
    title: 'Tools',
    items: [
      { path: '/export', label: 'Export Data', icon: FileDown },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-surface-700/50 bg-surface-900/50',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-surface-700/50 px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow-sm">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold gradient-text">Vol-Arb</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {sidebarSections.map((section) => (
          <div key={section.title} className="mb-6">
            {!collapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
                {section.title}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary-500/10 text-primary-400 shadow-glow-sm'
                          : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="ml-auto rounded-full bg-primary-500/20 px-2 py-0.5 text-xs text-primary-400">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-700/50 p-4">
        <div className="flex items-center gap-3 text-sm text-surface-500">
          <Activity className="h-4 w-4" />
          {!collapsed && <span>v1.0.0</span>}
        </div>
      </div>
    </aside>
  )
}
