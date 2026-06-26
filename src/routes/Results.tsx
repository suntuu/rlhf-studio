import { CheckCircle2, Download, Eye, FileDown, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { objectiveLabels } from '../data/demoData'
import { exportCsv, exportJsonl } from '../lib/exporters'
import {
  buildQualityExportRecords,
  getQualityMetrics,
  getTaskQualitySummaries,
  isReadyForExport,
  type TaskQualitySummary,
} from '../lib/quality'
import {
  getAnnotations,
  getAnnotationsByProject,
  getProjectById,
  getProjects,
  getReviewDecisions,
  saveReviewDecision,
} from '../lib/storage'
import { inputClass, textareaClass } from '../lib/styles'
import type { AnnotationResult, ProjectConfig, ReviewFinalLabel, ReviewStatus } from '../types'
import { Badge, Button, EmptyState, InlineEmptyState, LinkButton, MetricCard, PageHeader, Panel } from '../components/UI'

type ExportScope = 'all' | 'ready'

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
          <div className="border-b border-[#e2ded6] p-5">
            <h2 className="text-lg font-semibold text-neutral-950">Project result sets</h2>
          </div>
          <div className="divide-y divide-[#e2ded6]">
            {projects.length === 0 ? (
              <InlineEmptyState
                title="No project result sets yet"
                description="Create a project before reviewing export-ready preference records."
                action={<LinkButton to="/projects/new" variant="primary">Create Project</LinkButton>}
              />
            ) : (
              projects.map((project) => {
                const count = annotations.filter((annotation) => annotation.project_id === project.id).length
                return (
                  <Link
                    className="flex flex-col gap-3 p-5 transition hover:bg-[#f3f1eb] sm:flex-row sm:items-center sm:justify-between"
                    key={project.id}
                    to={`/projects/${project.id}/results`}
                  >
                    <div>
                      <p className="font-semibold text-neutral-950">{project.name}</p>
                      <p className="mt-1 text-sm text-neutral-600">{count} annotations collected</p>
                    </div>
                    <Badge tone={count > 0 ? 'green' : 'slate'}>{count > 0 ? 'Has results' : 'Empty'}</Badge>
                  </Link>
                )
              })
            )}
          </div>
        </Panel>
      </div>
    </>
  )
}

function ProjectResults({ project }: { project: ProjectConfig }) {
  const [records, setRecords] = useState(() => getAnnotationsByProject(project.id))
  const [reviewDecisions, setReviewDecisions] = useState(() => getReviewDecisions(project.id))
  const [selectedRecord, setSelectedRecord] = useState<AnnotationResult | null>(null)
  const [selectedSummary, setSelectedSummary] = useState<TaskQualitySummary | null>(null)
  const [exportScope, setExportScope] = useState<ExportScope>('all')
  const distribution = useMemo(() => getDistribution(records), [records])
  const taskSummaries = useMemo(
    () => getTaskQualitySummaries(records, reviewDecisions),
    [records, reviewDecisions],
  )
  const qualityMetrics = useMemo(() => getQualityMetrics(records, taskSummaries), [records, taskSummaries])
  const exportRecords = useMemo(() => buildQualityExportRecords(records, taskSummaries), [records, taskSummaries])
  const selectedExportRecords = useMemo(
    () =>
      exportScope === 'ready'
        ? exportRecords.filter(
            (record) =>
              record.review_status === 'accepted' ||
              (record.review_status === 'approved' && record.reviewer_final_label !== 'discard'),
          )
        : exportRecords,
    [exportRecords, exportScope],
  )
  const exportScopeFilename = exportScope === 'ready' ? 'approved-accepted-records' : 'all-records'

  function refreshRecords() {
    setRecords(getAnnotationsByProject(project.id))
    setReviewDecisions(getReviewDecisions(project.id))
  }

  function refreshReviewDecisions() {
    setReviewDecisions(getReviewDecisions(project.id))
  }

  return (
    <>
      <PageHeader
        title={`${project.name} results`}
        description="Quality review helps prevent noisy human feedback from entering the training dataset."
        actions={
          <>
            <LinkButton to={`/annotate/${project.id}`}>Annotate</LinkButton>
            <label className="min-w-56">
              <span className="sr-only">Export scope</span>
              <select
                aria-label="Export scope"
                className={inputClass}
                onChange={(event) => setExportScope(event.target.value as ExportScope)}
                value={exportScope}
              >
                <option value="all">Export all records</option>
                <option value="ready">Export approved / accepted records only</option>
              </select>
            </label>
            <Button
              disabled={selectedExportRecords.length === 0}
              onClick={() => exportJsonl(project.name, selectedExportRecords, exportScopeFilename)}
            >
              <Download size={16} aria-hidden="true" />
              Export JSONL
            </Button>
            <Button
              disabled={selectedExportRecords.length === 0}
              onClick={() => exportCsv(project.name, selectedExportRecords, exportScopeFilename)}
              variant="primary"
            >
              <FileDown size={16} aria-hidden="true" />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Completed annotations"
            value={qualityMetrics.completedAnnotations}
            help="Submitted"
            tone="green"
          />
          <MetricCard label="Agreement rate" value={qualityMetrics.agreementRate} help="Average" tone="blue" />
          <MetricCard
            label="Records ready for export"
            value={qualityMetrics.readyForExport}
            help="Accepted"
            tone="green"
          />
          <MetricCard
            label="Records needing review"
            value={qualityMetrics.needingReview}
            help="Queue"
            tone="amber"
          />
          <MetricCard
            label="Low-confidence records"
            value={qualityMetrics.lowConfidenceRecords}
            help="Flagged"
            tone="amber"
          />
        </div>

        <Panel className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">Project summary</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
                {project.description || 'No project description.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={project.objective === 'safety' ? 'amber' : 'blue'}>
                {objectiveLabels[project.objective]}
              </Badge>
              <Badge tone="slate">Config v{project.configVersion}</Badge>
              <Badge tone="green">{records.length} annotations collected</Badge>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <DistributionBar label="Response A chosen" value={distribution.responseA} total={records.length} />
            <DistributionBar label="Response B chosen" value={distribution.responseB} total={records.length} />
            <DistributionBar label="Tie / unsure" value={distribution.tie} total={records.length} />
          </div>
        </Panel>

        <QualityReviewQueue summaries={taskSummaries} onReview={setSelectedSummary} />

        <Panel>
          <div className="flex flex-col gap-3 border-b border-[#e2ded6] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-950">Results table</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Export-ready structured preference records. Click a row to inspect the complete annotation record.
              </p>
            </div>
            <Button onClick={refreshRecords}>Refresh records</Button>
          </div>

          {records.length === 0 ? (
            <InlineEmptyState
              title="No annotations yet"
              description="Submit a live annotation task to create the first export-ready preference record."
              action={<LinkButton to={`/annotate/${project.id}`} variant="primary">Open annotation task</LinkButton>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e2ded6] text-left text-sm">
                <thead className="bg-[#f6f4ef] text-xs font-semibold uppercase tracking-normal text-neutral-500">
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
                <tbody className="divide-y divide-[#e2ded6] bg-[#fffdf9]">
                  {records.map((record) => (
                    <tr
                      className="cursor-pointer align-top transition hover:bg-[#f3f1eb]"
                      key={record.annotation_id}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-neutral-600">{record.task_id}</td>
                      <td className="max-w-sm px-5 py-4 text-neutral-800">{record.prompt}</td>
                      <td className="px-5 py-4">
                        <Badge tone={record.chosen_response === 'tie_unsure' ? 'slate' : 'blue'}>
                          {formatChoice(record.chosen_response)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-neutral-700">{record.preference_strength ?? 'Not captured'}</td>
                      <td className="px-5 py-4 text-neutral-700">{record.safety_label ?? 'Not captured'}</td>
                      <td className="px-5 py-4 text-neutral-700">{record.confidence ?? 'Not captured'}</td>
                      <td className="px-5 py-4 text-neutral-700">{formatDate(record.submitted_at)}</td>
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
      {selectedSummary ? (
        <QualityReviewDrawer
          onApproved={refreshReviewDecisions}
          onClose={() => setSelectedSummary(null)}
          summary={selectedSummary}
        />
      ) : null}
    </>
  )
}

function QualityReviewQueue({
  summaries,
  onReview,
}: {
  summaries: TaskQualitySummary[]
  onReview: (summary: TaskQualitySummary) => void
}) {
  const readyCount = summaries.filter(isReadyForExport).length

  return (
    <Panel>
      <div className="flex flex-col gap-3 border-b border-[#e2ded6] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">Quality Review Queue</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
            Review disagreements and low-confidence tasks before exporting the final training dataset.
          </p>
        </div>
        <Badge tone={readyCount === summaries.length && summaries.length > 0 ? 'green' : 'amber'}>
          {readyCount} ready
        </Badge>
      </div>

      {summaries.length === 0 ? (
        <InlineEmptyState
          title="No reviewable records yet"
          description="Submit annotations or reset the demo data to populate agreement scoring."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e2ded6] text-left text-sm">
            <thead className="bg-[#f6f4ef] text-xs font-semibold uppercase tracking-normal text-neutral-500">
              <tr>
                <th className="px-5 py-3">Task ID</th>
                <th className="px-5 py-3">Prompt preview</th>
                <th className="px-5 py-3">Response A votes</th>
                <th className="px-5 py-3">Response B votes</th>
                <th className="px-5 py-3">Tie/Unsure votes</th>
                <th className="px-5 py-3">Agreement</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2ded6] bg-[#fffdf9]">
              {summaries.map((summary) => (
                <tr key={summary.task_id} className="align-top transition hover:bg-[#f3f1eb]">
                  <td className="px-5 py-4 font-mono text-xs text-neutral-600">{summary.task_id}</td>
                  <td className="max-w-sm px-5 py-4 text-neutral-800">{summary.prompt}</td>
                  <td className="px-5 py-4 text-neutral-700">{summary.responseAVotes}</td>
                  <td className="px-5 py-4 text-neutral-700">{summary.responseBVotes}</td>
                  <td className="px-5 py-4 text-neutral-700">{summary.tieUnsureVotes}</td>
                  <td className="px-5 py-4 font-semibold text-neutral-800">{summary.agreementScore}%</td>
                  <td className="px-5 py-4">
                    <Badge tone={getStatusTone(summary.status)}>{formatReviewStatus(summary.status)}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button className="px-3" onClick={() => onReview(summary)}>
                      <Eye size={15} aria-hidden="true" />
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

function QualityReviewDrawer({
  summary,
  onClose,
  onApproved,
}: {
  summary: TaskQualitySummary
  onClose: () => void
  onApproved: () => void
}) {
  const [finalLabel, setFinalLabel] = useState<ReviewFinalLabel>(
    summary.reviewDecision?.final_label ?? summary.majorityChoice,
  )
  const [reviewerNote, setReviewerNote] = useState(summary.reviewDecision?.reviewer_note ?? '')
  const decisionOptions: { value: ReviewFinalLabel; label: string }[] = [
    { value: 'response_a', label: 'Response A' },
    { value: 'response_b', label: 'Response B' },
    { value: 'tie_unsure', label: 'Tie / Unsure' },
    { value: 'discard', label: 'Discard' },
  ]

  function approveFinalLabel() {
    saveReviewDecision({
      project_id: summary.project_id,
      task_id: summary.task_id,
      final_label: finalLabel,
      reviewer_note: reviewerNote.trim(),
      approved_at: new Date().toISOString(),
    })
    onApproved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-neutral-950/30" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-4xl overflow-y-auto bg-[#fffdf9] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2ded6] bg-[#fffdf9] p-5">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Reviewer adjudication</p>
            <h2 className="text-lg font-semibold text-neutral-950">{summary.task_id}</h2>
          </div>
          <Button onClick={onClose}>
            <X size={16} aria-hidden="true" />
            Close
          </Button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={getStatusTone(summary.status)}>{formatReviewStatus(summary.status)}</Badge>
            <Badge tone="blue">{summary.agreementScore}% agreement</Badge>
            <Badge tone={summary.hasLowConfidence ? 'amber' : 'green'}>
              {summary.hasLowConfidence ? 'Low confidence flagged' : 'No low-confidence issue'}
            </Badge>
            <Badge tone="slate">Majority: {formatChoice(summary.majorityChoice)}</Badge>
          </div>

          <DetailBlock label="Prompt" value={summary.prompt} />

          <div className="grid gap-4 lg:grid-cols-2">
            <DetailBlock label="Response A" value={summary.response_a} />
            <DetailBlock label="Response B" value={summary.response_b} />
          </div>

          <div className="rounded-lg border border-[#e2ded6] bg-[#f6f4ef]">
            <div className="border-b border-[#e2ded6] p-4">
              <h3 className="text-base font-semibold text-neutral-950">Annotator judgments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e2ded6] text-left text-sm">
                <thead className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Annotator</th>
                    <th className="px-4 py-3">Judgment</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Safety labels</th>
                    <th className="px-4 py-3">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2ded6] bg-[#fffdf9]">
                  {summary.annotations.map((annotation) => (
                    <tr key={annotation.annotation_id} className="align-top">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">{annotation.annotator_id}</td>
                      <td className="px-4 py-3">
                        <Badge tone={annotation.chosen_response === 'tie_unsure' ? 'slate' : 'blue'}>
                          {formatChoice(annotation.chosen_response)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{annotation.confidence ?? 'Not captured'}</td>
                      <td className="px-4 py-3 text-neutral-700">{annotation.safety_label ?? 'Not captured'}</td>
                      <td className="max-w-md px-4 py-3 text-neutral-800">{annotation.rationale ?? 'Not captured'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-[#e2ded6] bg-[#f6f4ef] p-4">
            <h3 className="text-base font-semibold text-neutral-950">Final reviewer decision</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {decisionOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setFinalLabel(option.value)}
                  variant={finalLabel === option.value ? 'primary' : 'secondary'}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-neutral-800">Reviewer note</span>
              <textarea
                className={`${textareaClass} mt-2`}
                onChange={(event) => setReviewerNote(event.target.value)}
                placeholder="Explain the adjudication decision."
                value={reviewerNote}
              />
            </label>

            {summary.reviewDecision ? (
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Current approved label: {formatFinalLabel(summary.reviewDecision.final_label)}. Last approved{' '}
                {formatDate(summary.reviewDecision.approved_at)}.
              </p>
            ) : null}

            <div className="mt-4 flex justify-end">
              <Button onClick={approveFinalLabel} variant="primary">
                <CheckCircle2 size={16} aria-hidden="true" />
                Approve final label
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DistributionBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100)

  return (
    <div className="rounded-lg border border-[#e2ded6] bg-[#f6f4ef] p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-neutral-800">{label}</span>
        <span className="text-neutral-500">{value}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e2ded6]">
        <div className="h-full rounded-full bg-[#202936]" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-neutral-500">{percent}%</p>
    </div>
  )
}

function DetailDrawer({ record, onClose }: { record: AnnotationResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-neutral-950/30" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-[#fffdf9] shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#e2ded6] bg-[#fffdf9] p-5">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Annotation detail</p>
            <h2 className="text-lg font-semibold text-neutral-950">{record.annotation_id}</h2>
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
    <div className="rounded-lg border border-[#e2ded6] bg-[#f6f4ef] p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-800">{value}</p>
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

function formatChoice(choice: AnnotationResult['chosen_response']) {
  if (choice === 'response_a') {
    return 'Response A'
  }

  if (choice === 'response_b') {
    return 'Response B'
  }

  return 'Tie / unsure'
}

function formatFinalLabel(label: ReviewFinalLabel) {
  if (label === 'discard') {
    return 'Discard'
  }

  return formatChoice(label)
}

function formatReviewStatus(status: ReviewStatus) {
  if (status === 'approved') {
    return 'Approved'
  }

  if (status === 'accepted') {
    return 'Accepted'
  }

  return 'Needs Review'
}

function getStatusTone(status: ReviewStatus): 'slate' | 'blue' | 'green' | 'amber' | 'red' {
  if (status === 'approved') {
    return 'green'
  }

  if (status === 'accepted') {
    return 'blue'
  }

  return 'amber'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
