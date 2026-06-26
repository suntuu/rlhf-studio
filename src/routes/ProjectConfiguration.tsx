import { Eye, Save, UploadCloud } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  applyPreset,
  createBlankProject,
  methodologyLabels,
  objectiveLabels,
} from '../data/demoData'
import { getProjectById, saveProject } from '../lib/storage'
import type { MethodologyPreset, Objective, ProjectConfig, TaskType, TurnFormat } from '../types'
import { Badge, Button, FormLabel, LinkButton, PageHeader, Panel } from '../components/UI'
import { inputClass, textareaClass } from '../lib/styles'

const taskTypeLabels: Record<TaskType, string> = {
  pairwise: 'Pairwise comparison',
  rating: 'Rating',
  rewrite: 'Rewrite',
}

const turnFormatLabels: Record<TurnFormat, string> = {
  single_turn: 'Single-turn',
  multi_turn: 'Multi-turn',
}

export function ProjectConfiguration() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialProject = useMemo(() => {
    if (id) {
      return getProjectById(id) ?? createBlankProject()
    }

    const preset = searchParams.get('preset') as MethodologyPreset | null
    return createBlankProject(preset ?? 'meta_helpfulness')
  }, [id, searchParams])

  const [project, setProject] = useState<ProjectConfig>(initialProject)
  const [savedMessage, setSavedMessage] = useState('')

  function update<K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) {
    setProject((current) => ({ ...current, [key]: value }))
  }

  function handlePresetChange(event: ChangeEvent<HTMLSelectElement>) {
    const preset = event.target.value as MethodologyPreset
    setProject((current) => applyPreset(current, preset))
  }

  function persist(status: ProjectConfig['status']) {
    const saved = saveProject({ ...project, status })
    setProject(saved)
    setSavedMessage(status === 'published' ? 'Project published.' : 'Draft saved.')
    return saved
  }

  function preview() {
    const saved = persist(project.status)
    navigate(`/projects/${saved.id}/preview`)
  }

  function publish() {
    const saved = persist('published')
    navigate(`/projects/${saved.id}/preview`)
  }

  return (
    <>
      <PageHeader
        title={id ? 'Configure project' : 'Create project'}
        description="Configuration controls the annotator UI and output schema."
        actions={
          <>
            <Button onClick={() => persist('draft')}>
              <Save size={16} aria-hidden="true" />
              Save Draft
            </Button>
            <Button onClick={preview}>
              <Eye size={16} aria-hidden="true" />
              Preview Annotator Task
            </Button>
            <Button onClick={publish} variant="primary">
              <UploadCloud size={16} aria-hidden="true" />
              Publish Project
            </Button>
          </>
        }
      />

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-8">
        <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
          <Panel className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Project basics</h2>
                <p className="mt-1 text-sm text-slate-600">
                  This prototype collects RLHF training data only. Model training is outside scope.
                </p>
              </div>
              <Badge tone={project.status === 'published' ? 'green' : 'slate'}>
                {project.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FormLabel label="Project name">
                <input
                  className={inputClass}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="Helpfulness Preference Collection"
                  value={project.name}
                />
              </FormLabel>
              <FormLabel label="Methodology preset">
                <select className={inputClass} onChange={handlePresetChange} value={project.methodologyPreset}>
                  {Object.entries(methodologyLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormLabel>
              <div className="md:col-span-2">
                <FormLabel label="Description">
                  <textarea
                    className={textareaClass}
                    onChange={(event) => update('description', event.target.value)}
                    placeholder="Describe the annotation workflow and output dataset."
                    value={project.description}
                  />
                </FormLabel>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-slate-950">Workflow controls</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Configuration controls the annotator UI and output schema.
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FormLabel label="Task objective">
                <select
                  className={inputClass}
                  onChange={(event) => update('objective', event.target.value as Objective)}
                  value={project.objective}
                >
                  {Object.entries(objectiveLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormLabel>

              <FormLabel label="Turn format" hint="Multi-turn affects copy only in v1.">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(turnFormatLabels) as TurnFormat[]).map((format) => (
                    <button
                      className={`rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                        project.turnFormat === format
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                      key={format}
                      onClick={() => update('turnFormat', format)}
                      type="button"
                    >
                      {turnFormatLabels[format]}
                    </button>
                  ))}
                </div>
              </FormLabel>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-800">Task type</p>
              <div className="mt-2 grid gap-3 md:grid-cols-3">
                {(Object.keys(taskTypeLabels) as TaskType[]).map((type) => {
                  const disabled = type !== 'pairwise'
                  return (
                    <button
                      className={`rounded-md border p-3 text-left transition ${
                        project.taskType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                      disabled={disabled}
                      key={type}
                      onClick={() => update('taskType', type)}
                      type="button"
                    >
                      <span className="block text-sm font-semibold text-slate-900">
                        {taskTypeLabels[type]}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {disabled ? 'Roadmap preview' : 'Fully supported in v1'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-slate-950">Required annotator fields</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <CheckboxRow
                checked={project.requiredFields.preferenceStrength}
                label="Preference strength"
                onChange={(checked) =>
                  update('requiredFields', { ...project.requiredFields, preferenceStrength: checked })
                }
              />
              <CheckboxRow
                checked={project.requiredFields.rationale}
                label="Rationale"
                onChange={(checked) => update('requiredFields', { ...project.requiredFields, rationale: checked })}
              />
              <CheckboxRow
                checked={project.requiredFields.safetyLabels}
                label="Safety labels"
                onChange={(checked) =>
                  update('requiredFields', { ...project.requiredFields, safetyLabels: checked })
                }
              />
              <CheckboxRow
                checked={project.requiredFields.confidence}
                label="Confidence"
                onChange={(checked) => update('requiredFields', { ...project.requiredFields, confidence: checked })}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <CheckboxRow
                checked={project.allowTie}
                label="Allow tie / unsure"
                onChange={(checked) => update('allowTie', checked)}
              />
              <FormLabel label="Annotations per task">
                <input
                  className={inputClass}
                  min={1}
                  onChange={(event) => update('annotationsPerTask', Number(event.target.value))}
                  type="number"
                  value={project.annotationsPerTask}
                />
              </FormLabel>
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-slate-950">Seeded demo task</h2>
            <p className="mt-1 text-sm text-slate-600">
              This prompt and response pair powers the preview and the first annotation task.
            </p>
            <div className="mt-5 grid gap-5">
              <FormLabel label={project.turnFormat === 'multi_turn' ? 'Sample conversation prompt' : 'Sample prompt'}>
                <textarea
                  className={textareaClass}
                  onChange={(event) => update('samplePrompt', event.target.value)}
                  value={project.samplePrompt}
                />
              </FormLabel>
              <div className="grid gap-5 lg:grid-cols-2">
                <FormLabel label="Response A">
                  <textarea
                    className={textareaClass}
                    onChange={(event) => update('responseA', event.target.value)}
                    value={project.responseA}
                  />
                </FormLabel>
                <FormLabel label="Response B">
                  <textarea
                    className={textareaClass}
                    onChange={(event) => update('responseB', event.target.value)}
                    value={project.responseB}
                  />
                </FormLabel>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <FormLabel label="Response A model version" hint="Hidden from annotator">
                  <input
                    className={inputClass}
                    onChange={(event) => update('responseAModel', event.target.value)}
                    value={project.responseAModel}
                  />
                </FormLabel>
                <FormLabel label="Response B model version" hint="Hidden from annotator">
                  <input
                    className={inputClass}
                    onChange={(event) => update('responseBModel', event.target.value)}
                    value={project.responseBModel}
                  />
                </FormLabel>
              </div>
            </div>
          </Panel>
        </form>

        <aside className="space-y-4">
          {savedMessage ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
              {savedMessage}
            </div>
          ) : null}

          <Panel className="p-5">
            <h2 className="text-base font-semibold text-slate-950">Generated UI schema</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <SchemaRow label="Objective" value={objectiveLabels[project.objective]} />
              <SchemaRow label="Task type" value={taskTypeLabels[project.taskType]} />
              <SchemaRow label="Turn format" value={turnFormatLabels[project.turnFormat]} />
              <SchemaRow label="Tie allowed" value={project.allowTie ? 'Yes' : 'No'} />
              <SchemaRow label="Config version" value={`v${project.configVersion}`} />
            </dl>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-base font-semibold text-slate-950">Annotator fields</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {project.requiredFields.preferenceStrength ? <Badge tone="blue">Strength</Badge> : null}
              {project.requiredFields.rationale ? <Badge tone="blue">Rationale</Badge> : null}
              {project.requiredFields.safetyLabels ? <Badge tone="amber">Safety labels</Badge> : null}
              {project.requiredFields.confidence ? <Badge tone="green">Confidence</Badge> : null}
            </div>
          </Panel>

          <div className="grid gap-2">
            <Button onClick={preview} className="w-full">
              Preview Annotator Task
            </Button>
            <Button onClick={publish} variant="primary" className="w-full">
              Publish Project
            </Button>
            <LinkButton to="/" className="w-full">
              Back to dashboard
            </LinkButton>
          </div>
        </aside>
      </div>
    </>
  )
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
      <span>{label}</span>
      <input
        checked={checked}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

function SchemaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-900">{value}</dd>
    </div>
  )
}
