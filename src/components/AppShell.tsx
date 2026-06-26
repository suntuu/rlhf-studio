import {
  BarChart3,
  ClipboardList,
  Layers3,
  PanelLeft,
  Settings,
  Sparkles,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/styles'
import { LinkButton } from './UI'

const navItems = [
  { label: 'Projects', to: '/', icon: ClipboardList },
  { label: 'Templates', to: '/templates', icon: Layers3 },
  { label: 'Results', to: '/results', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function AppShell() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 text-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold">RLHF Studio</p>
            <p className="text-xs text-slate-400">Data collection ops</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                )
              }
              end={item.to === '/'}
              key={item.to}
              to={item.to}
            >
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="text-xs leading-5 text-slate-400">
            This prototype collects RLHF training data only. Model training is outside scope.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <PanelLeft className="text-slate-400 lg:hidden" size={20} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-950">RLHF Studio</p>
              <p className="text-xs text-slate-500">{headerLabel(location.pathname)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LinkButton to="/projects/new" variant="primary" className="hidden sm:inline-flex">
              Create Project
            </LinkButton>
          </div>
        </header>

        <nav className="grid grid-cols-4 border-b border-slate-200 bg-white lg:hidden">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold',
                  isActive ? 'text-blue-700' : 'text-slate-500',
                )
              }
              end={item.to === '/'}
              key={item.to}
              to={item.to}
            >
              <item.icon size={17} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function headerLabel(pathname: string) {
  if (pathname.includes('/configure')) {
    return 'Workflow configuration'
  }
  if (pathname.includes('/preview')) {
    return 'Generated annotator preview'
  }
  if (pathname.includes('/annotate')) {
    return 'Live annotation task'
  }
  if (pathname.includes('/results')) {
    return 'Structured feedback records'
  }
  if (pathname.includes('/settings')) {
    return 'Workspace controls'
  }
  return 'RLHF data collection workspace'
}
