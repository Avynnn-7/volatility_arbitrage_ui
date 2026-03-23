import { Link, useLocation } from 'react-router-dom'
import { Activity, BarChart3, Compass, Home, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/wizard', label: 'Wizard', icon: Compass },
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/analysis', label: 'Analysis', icon: Activity },
]

export function Navbar() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-700/50 bg-surface-900/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            <span className="gradient-text">Vol-Arb</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-500/10 text-primary-400'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button className="btn-ghost p-2">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
