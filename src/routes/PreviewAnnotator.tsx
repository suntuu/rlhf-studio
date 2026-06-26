import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { objectiveLabels } from '../data/demoData'
import { objectiveQuestion, taskInstructions } from '../lib/copy'
import { getProjectById } from '../lib/storage'
import { Badge, EmptyState, LinkButton, PageHeader, Panel } from '../components/UI'
import { inputClass, textareaClass } from '../lib/styles'

export function PreviewAnnotator() {
  const { id } = useParams()
  const project = id ? getProjectById(id) : undefined

  if (!project) {
    return (
      <div className="p-5 lg:p-8">
        <EmptyState
          title="Project not found"
          description="Save a project configuration before opening the annotator preview."
          action={<LinkButton to="/">Back to dashboard</LinkButton>}
        />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Generated from current task configuration"
        description="This is the exact field set annotators will see for the saved configuration."
        actions={
          <>
            <LinkButton to={`/projects/${project.id}/configure`}>
              <ArrowLeft size={16} aria-hidden="true" />
              Configure
            </LinkButton>
            <LinkButton to={`/annotate/${project.id}`} variant="primary">
              <ExternalLink size={16} aria-hidden="true" />
              Open Live Annotation Task
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
        <Panel className="overflow-hidden">
          <div className="border-b border-[#e2ded6] bg-[#f6f4ef] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={project.objective === 'safety' ? 'amber' : 'blue'}>
                {objectiveLabels[project.objective]}
              </Badge>
              <Badge tone="slate">Config v{project.configVersion}</Badge>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-neutral-950">
              {objectiveQuestion(project.objective)}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{taskInstructions(project)}</p>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">
                {project.turnFormat === 'multi_turn' ? 'Conversation prompt' : 'User prompt'}
              </p>
              <p className="mt-2 rounded-lg border border-[#e2ded6] bg-[#fffdf9] p-4 text-sm leading-6 text-neutral-800">
                {project.samplePrompt}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ResponsePreview title="Response A" body={project.responseA} />
              <ResponsePreview title="Response B" body={project.responseB} />
            </div>

            <div className="rounded-lg border border-[#e2ded6] bg-[#fffdf9] p-4">
              <p className="text-sm font-semibold text-neutral-900">Choice</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-md border border-[#d9d5cd] px-4 py-2 text-sm font-semibold text-neutral-700" type="button">
                  Response A
                </button>
                <button className="rounded-md border border-[#d9d5cd] px-4 py-2 text-sm font-semibold text-neutral-700" type="button">
                  Response B
                </button>
                {project.allowTie ? (
                  <button className="rounded-md border border-[#d9d5cd] px-4 py-2 text-sm font-semibold text-neutral-700" type="button">
                    Tie / Unsure
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {project.requiredFields.preferenceStrength ? (
                <PreviewField label="Preference strength">
                  <select className={inputClass} disabled>
                    <option>Slightly better</option>
                    <option>Better</option>
                    <option>Much better</option>
                  </select>
                </PreviewField>
              ) : null}

              {project.requiredFields.safetyLabels ? (
                <PreviewField label="Safety category">
                  <select className={inputClass} disabled>
                    <option>None</option>
                    <option>Harmful instructions</option>
                    <option>Hate / harassment</option>
                    <option>Self-harm</option>
                    <option>Privacy issue</option>
                    <option>Misinformation</option>
                  </select>
                </PreviewField>
              ) : null}

              {project.requiredFields.confidence ? (
                <PreviewField label="Confidence">
                  <select className={inputClass} disabled>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Low</option>
                  </select>
                </PreviewField>
              ) : null}
            </div>

            {project.requiredFields.rationale ? (
              <PreviewField label="Rationale">
                <textarea className={textareaClass} disabled placeholder="Annotator explains the preference." />
              </PreviewField>
            ) : null}
          </div>
        </Panel>

        <Panel className="h-fit p-5">
          <h2 className="text-base font-semibold text-neutral-950">Output schema preview</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Saved records include prompt, responses, choice, optional labels, rationale, annotator ID, timestamp,
            and hidden model metadata.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <SchemaChip label="chosen_response" />
            <SchemaChip label="chosen_model" />
            <SchemaChip label="config_version" />
            <SchemaChip label="response_a_model" />
            <SchemaChip label="response_b_model" />
          </div>
        </Panel>
      </div>
    </>
  )
}

function ResponsePreview({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[#e2ded6] bg-[#fffdf9] p-4">
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <p className="mt-3 text-sm leading-6 text-neutral-700">{body}</p>
    </div>
  )
}

function PreviewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function SchemaChip({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-[#e2ded6] bg-[#f6f4ef] px-3 py-2 font-mono text-xs text-neutral-700">
      {label}
    </div>
  )
}
