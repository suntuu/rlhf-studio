import { ArrowRight, BarChart3, FileDown, PencilLine, PlayCircle, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { objectiveLabels } from '../data/demoData'
import { buildQualityExportRecords, getQualityMetrics, getTaskQualitySummaries } from '../lib/quality'
import { getAnnotations, getProjects, getReviewDecisions } from '../lib/storage'
import type { AnnotationResult, ProjectConfig, ReviewerDecision } from '../types'
import { Badge, InlineEmptyState, LinkButton, MetricCard, PageHeader, Panel } from '../components/UI'

type SegmentTone = 'blue' | 'green' | 'amber' | 'slate' | 'red'

interface BreakdownSegment {
  label: string
  value: number
  tone: SegmentTone
}

export function Dashboard() {
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [annotations, setAnnotations] = useState<AnnotationResult[]>([])
  const [reviewDecisions, setReviewDecisions] = useState<ReviewerDecision[]>([])

  useEffect(() => {
    setProjects(getProjects())
    setAnnotations(getAnnotations())
    setReviewDecisions(getReviewDecisions())
  }, [])

  const publishedProjects = projects.filter((project) => project.status === 'published').length
  const draftProjects = projects.length - publishedProjects
  const responseA = annotations.filter((item) => item.chosen_response === 'response_a').length
  const responseB = annotations.filter((item) => item.chosen_response === 'response_b').length
  const tieUnsure = annotations.filter((item) => item.chosen_response === 'tie_unsure').length
  const taskSummaries = getTaskQualitySummaries(annotations, reviewDecisions)
  const qualityMetrics = getQualityMetrics(annotations, taskSummaries)
  const exportRecords = buildQualityExportRecords(annotations, taskSummaries)
  const readyExportRecords = exportRecords.filter(
    (record) =>
      record.review_status === 'accepted' ||
      (record.review_status === 'approved' && record.reviewer_final_label !== 'discard'),
  ).length
  const reviewQueueRecords = exportRecords.length - readyExportRecords
  const acceptedTasks = taskSummaries.filter((summary) => summary.status === 'accepted').length
  const approvedTasks = taskSummaries.filter((summary) => summary.status === 'approved').length
  const needsReviewTasks = taskSummaries.filter((summary) => summary.status === 'needs_review').length

  return (
    <>
      <PageHeader
        title="RLHF data collection workspace"
        description="Configuration controls the annotation UI and output schema."
      />

      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active projects"
            value={projects.length}
            help={projects.length === 0 ? 'None yet' : `${publishedProjects} published`}
            tone="blue"
            visualization={
              <MetricBreakdown
                ariaLabel="Project status breakdown"
                emptyLabel="Create a project to start tracking workflow status."
                segments={[
                  { label: 'Published', value: publishedProjects, tone: 'green' },
                  { label: 'Draft', value: draftProjects, tone: 'slate' },
                ]}
                total={projects.length}
              />
            }
          />
          <MetricCard
            label="Completed annotations"
            value={annotations.length}
            help={annotations.length === 0 ? 'No votes' : `${responseA + responseB} decisive`}
            tone="green"
            visualization={
              <MetricBreakdown
                ariaLabel="Annotation choice distribution"
                emptyLabel="Submitted annotations will show response preference distribution."
                segments={[
                  { label: 'Response A', value: responseA, tone: 'blue' },
                  { label: 'Response B', value: responseB, tone: 'green' },
                  { label: 'Tie', value: tieUnsure, tone: 'amber' },
                ]}
                total={annotations.length}
              />
            }
          />
          <MetricCard
            label="Avg agreement"
            value={qualityMetrics.agreementRate}
            help={taskSummaries.length === 0 ? 'No tasks' : formatCount(taskSummaries.length, 'task')}
            visualization={
              <MetricBreakdown
                ariaLabel="Task review status breakdown"
                emptyLabel="Agreement appears after at least one submitted task."
                segments={[
                  { label: 'Accepted', value: acceptedTasks, tone: 'green' },
                  { label: 'Approved', value: approvedTasks, tone: 'blue' },
                  { label: 'Review', value: needsReviewTasks, tone: 'amber' },
                ]}
                total={taskSummaries.length}
              />
            }
          />
          <MetricCard
            label="Export-ready records"
            value={readyExportRecords}
            help={
              exportRecords.length === 0
                ? 'No records'
                : formatCount(qualityMetrics.readyForExport, 'ready task')
            }
            tone="amber"
            visualization={
              <MetricBreakdown
                ariaLabel="Export readiness breakdown"
                emptyLabel="Records become export-ready after accepted or approved task quality checks."
                segments={[
                  { label: 'Ready', value: readyExportRecords, tone: 'green' },
                  { label: 'Review', value: reviewQueueRecords, tone: 'amber' },
                ]}
                total={exportRecords.length}
              />
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <Panel>
            <div className="flex flex-col gap-3 border-b border-[#e2ded6] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">Projects</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  Export-ready structured preference records are created from completed tasks.
                </p>
              </div>
              <LinkButton to="/results">
                <BarChart3 size={16} aria-hidden="true" />
                Results
              </LinkButton>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e2ded6] text-left text-sm">
                <thead className="bg-[#f6f4ef] text-xs font-semibold uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Objective</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Records</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2ded6] bg-[#fffdf9]">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <InlineEmptyState
                          title="No projects yet"
                          description="Create a project to configure an annotation workflow and start collecting preference records."
                          action={
                            <LinkButton to="/projects/new" variant="primary">
                              <Plus size={16} aria-hidden="true" />
                              Create Project
                            </LinkButton>
                          }
                        />
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => {
                      const projectAnnotations = annotations.filter(
                        (annotation) => annotation.project_id === project.id,
                      )

                      return (
                        <tr key={project.id} className="align-top transition duration-200 hover:bg-[#f3f1eb]">
                          <td className="max-w-sm px-5 py-4">
                            <p className="font-semibold text-neutral-950">{project.name}</p>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-600">
                              {project.description || 'No description provided.'}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={project.objective === 'safety' ? 'amber' : 'blue'}>
                              {objectiveLabels[project.objective]}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge tone={project.status === 'published' ? 'green' : 'slate'}>
                              {project.status === 'published' ? 'Published' : 'Draft'}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-neutral-700">{projectAnnotations.length}</td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap justify-end gap-2">
                              <LinkButton to={`/projects/${project.id}/configure`} className="px-3">
                                <PencilLine size={15} aria-hidden="true" />
                                Configure
                              </LinkButton>
                              <LinkButton to={`/annotate/${project.id}`} className="px-3">
                                <PlayCircle size={15} aria-hidden="true" />
                                Annotate
                              </LinkButton>
                              <LinkButton to={`/projects/${project.id}/results`} className="px-3">
                                <FileDown size={15} aria-hidden="true" />
                                Results
                              </LinkButton>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="rounded-xl border border-[#e2ded6] bg-[#f6f4ef] p-4">
              <h2 className="text-base font-semibold text-neutral-950">Interview demo path</h2>
              <ol className="mt-3 space-y-3 text-sm leading-6 text-neutral-700">
                <li>1. Configure a project preset.</li>
                <li>2. Preview the generated annotator UI.</li>
                <li>3. Submit an annotation.</li>
                <li>4. Export JSONL or CSV records.</li>
              </ol>
            </div>

            <div className="mt-5 space-y-3">
              <Link
                to="/projects/new"
                className="flex items-center justify-between rounded-lg border border-[#e2ded6] p-3 text-sm font-semibold text-neutral-800 transition duration-200 hover:bg-[#f3f1eb]"
              >
                Create configurable workflow
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/templates"
                className="flex items-center justify-between rounded-lg border border-[#e2ded6] p-3 text-sm font-semibold text-neutral-800 transition duration-200 hover:bg-[#f3f1eb]"
              >
                Compare methodology presets
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </Panel>
        </div>

        {projects.length > 0 && (
          <div className="flex justify-end sm:hidden">
            <LinkButton to="/projects/new" variant="primary" className="w-full">
              <Plus size={16} aria-hidden="true" />
              Create Project
            </LinkButton>
          </div>
        )}
      </div>
    </>
  )
}

function MetricBreakdown({
  ariaLabel,
  emptyLabel,
  segments,
  total,
}: {
  ariaLabel: string
  emptyLabel: string
  segments: BreakdownSegment[]
  total: number
}) {
  const visibleSegments = segments.filter((segment) => segment.value > 0)

  if (total === 0) {
    return <p className="min-h-10 text-xs font-medium leading-5 text-neutral-500">{emptyLabel}</p>
  }

  return (
    <div className="space-y-2">
      <div
        aria-label={ariaLabel}
        className="flex h-2 overflow-hidden rounded-full bg-[#ebe7df]"
        role="img"
      >
        {visibleSegments.map((segment) => (
          <span
            className={segmentStyles[segment.tone]}
            key={segment.label}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid gap-1">
        {segments.map((segment) => (
          <div className="flex items-center justify-between gap-2 text-xs" key={segment.label}>
            <span className="flex min-w-0 items-center gap-1.5 text-neutral-600">
              <span className={`h-2 w-2 shrink-0 rounded-full ${segmentStyles[segment.tone]}`} />
              <span className="truncate">{segment.label}</span>
            </span>
            <span className="font-semibold text-neutral-800">{formatSegment(segment.value, total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatSegment(value: number, total: number) {
  if (value === 0) {
    return '0'
  }

  return `${value} (${Math.round((value / total) * 100)}%)`
}

function formatCount(value: number, singular: string) {
  return `${value} ${value === 1 ? singular : `${singular}s`}`
}

const segmentStyles: Record<SegmentTone, string> = {
  blue: 'bg-[#2776a8]',
  green: 'bg-[#1f8b75]',
  amber: 'bg-[#c17a24]',
  slate: 'bg-[#8c877d]',
  red: 'bg-[#d14c4c]',
}
