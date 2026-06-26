import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/styles'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'border-[#202936] bg-[#202936] text-white shadow-[0_10px_24px_rgba(31,41,55,0.14)] hover:border-[#111827] hover:bg-[#111827] focus-visible:outline-[#202936]',
  secondary:
    'border-[#d9d5cd] bg-[#fffdf9] text-neutral-800 shadow-[0_1px_2px_rgba(36,32,28,0.05)] hover:border-[#c9c4ba] hover:bg-white focus-visible:outline-[#202936]',
  ghost:
    'border-transparent bg-transparent text-neutral-700 hover:bg-[#efede8] focus-visible:outline-[#202936]',
  danger:
    'border-[#c2413a] bg-[#c2413a] text-white shadow-[0_10px_24px_rgba(194,65,58,0.14)] hover:border-[#a7332e] hover:bg-[#a7332e] focus-visible:outline-[#c2413a]',
}

export function Button({ className, variant = 'secondary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100',
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
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
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
    slate: 'border-[#dedad2] bg-[#f2f0eb] text-neutral-700',
    blue: 'border-[#cfe1df] bg-[#edf7f5] text-[#176c5f]',
    green: 'border-[#cfe4d8] bg-[#edf8f1] text-[#17633b]',
    amber: 'border-[#ead7b7] bg-[#fff6e7] text-[#8a5a12]',
    red: 'border-[#efd0cf] bg-[#fff1f0] text-[#b53b36]',
  }

  return (
    <span className={cn('inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold', tones[tone])}>
      {children}
    </span>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-xl border border-[#e2ded6] bg-[#fffdf9] shadow-[0_1px_2px_rgba(36,32,28,0.05)]',
        className,
      )}
    >
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
    <div className="flex flex-col gap-4 border-b border-[#e2ded6] bg-[#f7f6f2]/95 px-5 py-5 backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-normal text-neutral-950">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">{description}</p> : null}
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
    slate: 'bg-[#f2f0eb] text-neutral-600',
    blue: 'bg-[#edf7f5] text-[#176c5f]',
    green: 'bg-[#edf8f1] text-[#17633b]',
    amber: 'bg-[#fff6e7] text-[#8a5a12]',
  }

  return (
    <Panel className="relative overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(247,245,240,0.52))]" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        <span className={cn('rounded-md px-2 py-1 text-xs font-semibold', toneStyles[tone])}>{help}</span>
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold text-neutral-950">{value}</p>
        <MiniSparkline tone={tone} />
      </div>
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
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">{description}</p>
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
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      {hint ? <span className="ml-2 text-xs font-medium text-neutral-500">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  )
}

function MiniSparkline({ tone }: { tone: 'slate' | 'blue' | 'green' | 'amber' }) {
  return (
    <svg
      className="metric-sparkline"
      data-tone={tone}
      viewBox="0 0 76 30"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 24H11L18 10L28 17L36 7L47 20L57 12L66 23L73 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 24H11L18 10L28 17L36 7L47 20L57 12L66 23L73 15V30H3V24Z" fill="currentColor" opacity="0.08" />
    </svg>
  )
}
