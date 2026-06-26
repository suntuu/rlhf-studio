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
    <div className="min-h-screen bg-[#e9e7e2] text-neutral-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-[#ddd8cf] bg-[#f7f6f2] text-neutral-700 lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-[#ebe7df] px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#202936] text-white shadow-[0_8px_20px_rgba(32,41,54,0.18)]">
            <Sparkles size={18} aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-950">RLHF Studio</p>
            <p className="text-xs text-neutral-500">Data collection ops</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Main navigation">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            Workspace
          </p>
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition duration-200',
                  isActive
                    ? 'border-[#e2ded6] bg-[#fffdf9] text-neutral-950 shadow-[0_1px_2px_rgba(36,32,28,0.06)]'
                    : 'border-transparent text-neutral-600 hover:bg-[#efede8] hover:text-neutral-950',
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
        <div className="border-t border-[#ebe7df] p-3">
          <div className="rounded-xl border border-[#e2ded6] bg-[#fffdf9] p-3 shadow-[0_1px_2px_rgba(36,32,28,0.04)]">
            <p className="text-xs font-semibold text-neutral-900">Prototype scope</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
            This prototype collects RLHF training data only. Model training is outside scope.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-[#ddd8cf] bg-[#f7f6f2]/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <PanelLeft className="text-neutral-500 lg:hidden" size={20} aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-neutral-950">RLHF Studio</p>
              <p className="text-xs text-neutral-500">{headerLabel(location.pathname)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LinkButton to="/projects/new" variant="primary" className="hidden sm:inline-flex">
              Create Project
            </LinkButton>
          </div>
        </header>

        <nav className="grid grid-cols-4 border-b border-[#ddd8cf] bg-[#f7f6f2] lg:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold transition',
                  isActive ? 'text-neutral-950' : 'text-neutral-500',
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

        <main className="min-h-[calc(100vh-4rem)] bg-[#f7f6f2]">
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
