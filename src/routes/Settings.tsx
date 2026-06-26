import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { resetDemoData } from '../lib/storage'
import { Badge, Button, LinkButton, PageHeader, Panel } from '../components/UI'

export function Settings() {
  const [message, setMessage] = useState('')

  function reset() {
    resetDemoData()
    setMessage('Demo data reset. Seed projects were restored and annotations were cleared.')
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Local prototype controls for demo reset and scope visibility."
        actions={<LinkButton to="/">Back to projects</LinkButton>}
      />
      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
        <Panel className="p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Prototype scope</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ScopeItem label="Persistence" value="localStorage" />
            <ScopeItem label="Authentication" value="Out of scope" />
            <ScopeItem label="Live LLM calls" value="Out of scope" />
            <ScopeItem label="Model training" value="Out of scope" />
          </div>
          <p className="mt-5 text-sm leading-6 text-neutral-600">
            RLHF Studio stores project configurations and annotation results in the browser for this v1 prototype.
          </p>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">Reset demo data</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Restore the two seeded projects and remove submitted annotations.
              </p>
            </div>
            <Badge tone="amber">Debug</Badge>
          </div>
          <Button onClick={reset} variant="danger" className="mt-5 w-full">
            <RotateCcw size={16} aria-hidden="true" />
            Reset demo data
          </Button>
          {message ? (
            <p className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
              {message}
            </p>
          ) : null}
        </Panel>
      </div>
    </>
  )
}

function ScopeItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e2ded6] bg-[#f6f4ef] p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  )
}
