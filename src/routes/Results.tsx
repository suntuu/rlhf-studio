import { Download, Eye, FileDown, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { objectiveLabels } from '../data/demoData'
import { exportCsv, exportJsonl } from '../lib/exporters'
import { getAnnotations, getAnnotationsByProject, getProjectById, getProjects } from '../lib/storage'
import type { AnnotationResult, ProjectConfig } from '../types'
import { Badge, Button, EmptyState, LinkButton, MetricCard, PageHeader, Panel } from '../components/UI'

export function Results() {
  const { id } = useParams()
  const project = id ? getProjectById(id) : undefined

  if (!id) {
    return <ResultsIndex />
  }

  if (!project) {
    return (
      <div className="p-5 lg:p-8">
        <EmptyState
          title="Project not found"
          description="Choose a saved project before opening results."
          action={<LinkButton to="/">Back to dashboard</LinkButton>}
        />
      </div>
    )
  }

  return <ProjectResults project={project} />
}

function ResultsIndex() {
  const projects = getProjects()
  const annotations = getAnnotations()

  return (
    <>
      <PageHeader
        title="Results"
        description="Review export-ready structured preference records by project."
        actions={<LinkButton to="/">Projects</LinkButton>}
      />
      <div className="p-5 lg:p-8">
        <Panel>
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-950">Project result sets</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {projects.map((project) => {
              const count = annotations.filter((annotation) => annotation.project_id === project.id).length
              return (
                <Link
                  className="flex flex-col gap-3 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  key={project.id}
                  to={`/projects/${project.id}/results`}
                >
                  <div>
                    <p className="font-semibold text-slate-950">{project.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{count} records ready for export</p>
                  </div>
                  <Badge tone={count > 0 ? 'green' : 'slate'}>{count > 0 ? 'Has results' : 'Empty'}</Badge>
                </Link>
              )
            })}
          </div>
        </Panel>
      </div>
    </>
  )
}

function ProjectResults({ project }: { project: ProjectConfig }) {
  const [records, setRecords] = useState(() => getAnnotationsByProject(project.id))
  const [selectedRecord, setSelectedRecord] = useState<AnnotationResult | null>(null)
  const distribution = useMemo(() => getDistribution(records), [records])
  const averageConfidence = useMemo(() => getAverageConfidence(records), [records])

  function refreshRecords() {
    setRecords(getAnnotationsByProject(project.id))
  }

  return (
    <>
      <PageHeader
        title={`${project.name} results`}
        description="Export-ready structured preference records."
        actions={
          <>
            <LinkButton to={`/annotate/${project.id}`}>Annotate</LinkButton>
            <Button disabled={records.length === 0} onClick={() => exportJsonl(project.name, records)}>
              <Download size={16} aria-hidden="true" />
              Export JSONL
            </Button>
            <Button disabled={records.length === 0} onClick={() => exportCsv(project.name, records)} variant="primary">
              <FileDown size={16} aria-hidden="true" />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Completed annotations" value={records.length} help="Submitted" tone="green" />
          <MetricCard label="Response A chosen" value={distribution.responseA} help="Preference" tone="blue" />
          <MetricCard label="Response B chosen" value={distribution.responseB} help="Preference" tone="amber" />
          <MetricCard label="Average confidence" value={averageConfidence} help="Annotator" />
        </div>

        <Panel className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Project summary</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                {project.description || 'No project description.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={project.objective === 'safety' ? 'amber' : 'blue'}>
                {objectiveLabels[project.objective]}
              </Badge>
              <Badge tone="slate">Config v{project.configVersion}</Badge>
              <Badge tone="green">{records.length} records ready for export</Badge>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <DistributionBar label="Response A chosen" value={distribution.responseA} total={records.length} />
            <DistributionBar label="Response B chosen" value={distribution.responseB} total={records.length} />
            <DistributionBar label="Tie / unsure" value={distribution.tie} total={records.length} />
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Results table</h2>
              <p className="mt-1 text-sm text-slate-600">
                Export-ready structured preference records. Click a row to inspect the complete annotation record.
              </p>
            </div>
            <Button onClick={refreshRecords}>Refresh records</Button>
          </div>

          {records.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No annotations yet"
                description="Submit a live annotation task to create the first export-ready preference record."
                action={<LinkButton to={`/annotate/${project.id}`} variant="primary">Open annotation task</LinkButton>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Task ID</th>
                    <th className="px-5 py-3">Prompt preview</th>
                    <th className="px-5 py-3">Choice</th>
                    <th className="px-5 py-3">Strength</th>
                    <th className="px-5 py-3">Safety label</th>
                    <th className="px-5 py-3">Confidence</th>
                    <th className="px-5 py-3">Submitted at</th>
                    <th className="px-5 py-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {records.map((record) => (
                    <tr
                      className="cursor-pointer align-top transition hover:bg-slate-50"
                      key={record.annotation_id}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{record.task_id}</td>
                      <td className="max-w-sm px-5 py-4 text-slate-800">{record.prompt}</td>
                      <td className="px-5 py-4">
                        <Badge tone={record.chosen_response === 'tie_unsure' ? 'slate' : 'blue'}>
                          {formatChoice(record.chosen_response)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{record.preference_strength ?? 'Not captured'}</td>
                      <td className="px-5 py-4 text-slate-700">{record.safety_label ?? 'Not captured'}</td>
                      <td className="px-5 py-4 text-slate-700">{record.confidence ?? 'Not captured'}</td>
                      <td className="px-5 py-4 text-slate-700">{formatDate(record.submitted_at)}</td>
                      <td className="px-5 py-4 text-right">
                        <Button className="px-3" onClick={(event) => {
                          event.stopPropagation()
                          setSelectedRecord(record)
                        }}>
                          <Eye size={15} aria-hidden="true" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {selectedRecord ? (
        <DetailDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      ) : null}
    </>
  )
}

function DistributionBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100)

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="text-slate-500">{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{percent}%</p>
    </div>
  )
}

function DetailDrawer({ record, onClose }: { record: AnnotationResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-950/30" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <p className="text-sm font-semibold text-slate-500">Annotation detail</p>
            <h2 className="text-lg font-semibold text-slate-950">{record.annotation_id}</h2>
          </div>
          <Button onClick={onClose}>
            <X size={16} aria-hidden="true" />
            Close
          </Button>
        </div>
        <div className="space-y-5 p-5">
          <DetailBlock label="Prompt" value={record.prompt} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DetailBlock label="Response A" value={record.response_a} />
            <DetailBlock label="Response B" value={record.response_b} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <DetailBlock label="Chosen response" value={formatChoice(record.chosen_response)} />
            <DetailBlock label="Chosen model" value={record.chosen_model ?? 'Tie / unsure'} />
            <DetailBlock label="Preference strength" value={record.preference_strength ?? 'Not captured'} />
            <DetailBlock label="Safety label" value={record.safety_label ?? 'Not captured'} />
            <DetailBlock label="Confidence" value={record.confidence ?? 'Not captured'} />
            <DetailBlock label="Rationale" value={record.rationale ?? 'Not captured'} />
            <DetailBlock label="Model metadata" value={`A: ${record.response_a_model}\nB: ${record.response_b_model}`} />
            <DetailBlock label="Config version" value={`v${record.config_version}`} />
            <DetailBlock label="Submitted at" value={formatDate(record.submitted_at)} />
            <DetailBlock label="Task ID" value={record.task_id} />
            <DetailBlock label="Project ID" value={record.project_id} />
            <DetailBlock label="Annotator ID" value={record.annotator_id} />
            <DetailBlock label="Objective / task" value={`${record.objective} / ${record.task_type} / ${record.turn_format}`} />
          </div>
          <DetailBlock label="Raw AnnotationResult JSON" value={JSON.stringify(record, null, 2)} />
        </div>
      </div>
    </div>
  )
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{value}</p>
    </div>
  )
}

function getDistribution(records: AnnotationResult[]) {
  return records.reduce(
    (acc, record) => {
      if (record.chosen_response === 'response_a') {
        acc.responseA += 1
      } else if (record.chosen_response === 'response_b') {
        acc.responseB += 1
      } else {
        acc.tie += 1
      }

      return acc
    },
    { responseA: 0, responseB: 0, tie: 0 },
  )
}

function getAverageConfidence(records: AnnotationResult[]) {
  const scores: Record<string, number> = { Low: 1, Medium: 2, High: 3 }
  const captured = records
    .map((record) => (record.confidence ? scores[record.confidence] : 0))
    .filter((score) => score > 0)

  if (captured.length === 0) {
    return 'No data'
  }

  const average = captured.reduce((sum, score) => sum + score, 0) / captured.length

  if (average >= 2.67) {
    return 'High'
  }

  if (average >= 1.67) {
    return 'Medium'
  }

  return 'Low'
}

function formatChoice(choice: AnnotationResult['chosen_response']) {
  if (choice === 'response_a') {
    return 'Response A'
  }

  if (choice === 'response_b') {
    return 'Response B'
  }

  return 'Tie / unsure'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
