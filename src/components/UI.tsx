import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/styles'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 focus-visible:outline-blue-600',
  secondary:
    'bg-white text-slate-800 border-slate-300 hover:bg-slate-50 focus-visible:outline-blue-600',
  ghost:
    'bg-transparent text-slate-700 border-transparent hover:bg-slate-100 focus-visible:outline-blue-600',
  danger:
    'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 focus-visible:outline-red-600',
}

export function Button({ className, variant = 'secondary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55',
        buttonStyles[variant],
        className,
      )}
      type="button"
      {...props}
    />
  )
}

interface LinkButtonProps {
  to: string
  children: ReactNode
  variant?: ButtonVariant
  className?: string
}

export function LinkButton({ to, children, variant = 'secondary', className }: LinkButtonProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        buttonStyles[variant],
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function Badge({
  tone = 'slate',
  children,
}: {
  tone?: 'slate' | 'blue' | 'green' | 'amber' | 'red'
  children: ReactNode
}) {
  const tones = {
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-700',
  }

  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', tones[tone])}>
      {children}
    </span>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </section>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  help,
  tone = 'slate',
}: {
  label: string
  value: string | number
  help: string
  tone?: 'slate' | 'blue' | 'green' | 'amber'
}) {
  const toneStyles = {
    slate: 'bg-slate-50 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-800',
  }

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={cn('rounded-md px-2 py-1 text-xs font-semibold', toneStyles[tone])}>{help}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
    </Panel>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Panel className="flex flex-col items-start gap-3 p-6">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </Panel>
  )
}

export function FormLabel({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {hint ? <span className="ml-2 text-xs font-medium text-slate-500">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  )
}
