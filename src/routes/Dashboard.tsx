import { ArrowRight, BarChart3, FileDown, PencilLine, PlayCircle, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { objectiveLabels } from '../data/demoData'
import { getAnnotations, getProjects } from '../lib/storage'
import type { AnnotationResult, ProjectConfig } from '../types'
import { Badge, LinkButton, MetricCard, PageHeader, Panel } from '../components/UI'

export function Dashboard() {
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [annotations, setAnnotations] = useState<AnnotationResult[]>([])

  useEffect(() => {
    setProjects(getProjects())
    setAnnotations(getAnnotations())
  }, [])

  const responseA = annotations.filter((item) => item.chosen_response === 'response_a').length
  const responseB = annotations.filter((item) => item.chosen_response === 'response_b').length
  const nonTieTotal = responseA + responseB
  const avgAgreement =
    annotations.length === 0 ? 'No data' : `${Math.round((nonTieTotal / annotations.length) * 100)}%`

  return (
    <>
      <PageHeader
        title="RLHF data collection workspace"
        description="Configuration controls the annotation UI and output schema."
        actions={
          <LinkButton to="/projects/new" variant="primary">
            <Plus size={16} aria-hidden="true" />
            Create Project
          </LinkButton>
        }
      />

      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active projects" value={projects.length} help="Configured" tone="blue" />
          <MetricCard
            label="Completed annotations"
            value={annotations.length}
            help="Saved locally"
            tone="green"
          />
          <MetricCard label="Avg agreement" value={avgAgreement} help="Preference signal" />
          <MetricCard
            label="Export-ready records"
            value={annotations.length}
            help="JSONL / CSV"
            tone="amber"
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
                  {projects.map((project) => {
                    const projectAnnotations = annotations.filter(
                      (annotation) => annotation.project_id === project.id,
                    )

                    return (
                      <tr key={project.id} className="align-top hover:bg-[#f3f1eb]">
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
                  })}
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

        <div className="flex justify-end sm:hidden">
          <LinkButton to="/projects/new" variant="primary" className="w-full">
            <Plus size={16} aria-hidden="true" />
            Create Project
          </LinkButton>
        </div>
      </div>
    </>
  )
}
