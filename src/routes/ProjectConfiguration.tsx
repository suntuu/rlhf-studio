import { CheckCircle2, Eye, Save, UploadCloud } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  SEEDED_PROMPT_PACKS,
  applySeedPack,
  applyPreset,
  createBlankProject,
  getProjectSeedPack,
  getPromptBatchChecks,
  methodologyLabels,
  objectiveLabels,
} from '../data/demoData'
import { getProjectById, saveProject } from '../lib/storage'
import type {
  GenerationMode,
  MethodologyPreset,
  ModelProvider,
  Objective,
  ProjectConfig,
  PromptSourceType,
  ResponseSourceType,
  TaskType,
  TurnFormat,
} from '../types'
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

const promptSourceOptions: {
  value: PromptSourceType
  label: string
  status: string
  disabled?: boolean
}[] = [
  { value: 'seeded_prompt_pack', label: 'Seeded prompt pack', status: 'Supported in v1' },
  { value: 'upload_csv_jsonl', label: 'Upload CSV/JSONL', status: 'Roadmap', disabled: true },
  { value: 'client_system_api', label: 'Client system API', status: 'Roadmap', disabled: true },
  { value: 'annotator_created', label: 'Annotator-created prompts', status: 'Roadmap', disabled: true },
  { value: 'synthetic_generation', label: 'Synthetic prompt generation', status: 'Roadmap', disabled: true },
]

const responseSourceOptions: {
  value: ResponseSourceType
  label: string
  status: string
  disabled?: boolean
}[] = [
  { value: 'seeded_pairs', label: 'Seeded response pairs', status: 'Supported in v1' },
  { value: 'uploaded_pairs', label: 'Uploaded response pairs', status: 'Roadmap', disabled: true },
  { value: 'model_api_simulated', label: 'Model API comparison', status: 'Simulated in v1' },
]

const modelProviders: ModelProvider[] = ['OpenAI', 'Anthropic', 'Meta', 'Custom']

const generationModeLabels: Record<GenerationMode, string> = {
  batch_before_annotation: 'Batch before annotation',
  live_during_annotation: 'Live during annotation',
}

const responseSourceLabels: Record<ResponseSourceType, string> = {
  seeded_pairs: 'Seeded response pairs',
  uploaded_pairs: 'Uploaded response pairs',
  model_api_simulated: 'Model API comparison',
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
  const selectedSeedPack = getProjectSeedPack(project)
  const promptBatchChecks = getPromptBatchChecks(selectedSeedPack)
  const promptBatchReady = promptBatchChecks.every((check) => check.passed)

  function update<K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) {
    setProject((current) => ({ ...current, [key]: value }))
  }

  function handlePresetChange(event: ChangeEvent<HTMLSelectElement>) {
    const preset = event.target.value as MethodologyPreset
    setProject((current) => applyPreset(current, preset))
  }

  function handleSeedPackChange(event: ChangeEvent<HTMLSelectElement>) {
    setProject((current) => applySeedPack(current, event.target.value))
  }

  function updatePromptSourceType(type: PromptSourceType) {
    if (type !== 'seeded_prompt_pack') {
      return
    }

    setProject((current) => ({
      ...current,
      promptSource: {
        ...current.promptSource,
        type,
        roadmapSourceType: undefined,
      },
    }))
  }

  function updateResponseSourceType(type: ResponseSourceType) {
    if (type === 'uploaded_pairs') {
      return
    }

    setProject((current) => ({
      ...current,
      responseSource: {
        ...current.responseSource,
        type,
      },
    }))
  }

  function updateResponseSource<K extends keyof ProjectConfig['responseSource']>(
    key: K,
    value: ProjectConfig['responseSource'][K],
  ) {
    setProject((current) => ({
      ...current,
      responseSource: {
        ...current.responseSource,
        [key]: value,
      },
    }))
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2ded6] pb-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">Project basics</h2>
                <p className="mt-1 text-sm text-neutral-600">
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
            <h2 className="text-lg font-semibold text-neutral-950">Workflow controls</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
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
                      className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition duration-200 ${
                        project.turnFormat === format
                          ? 'border-[#202936] bg-[#f3f1eb] text-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
                          : 'border-[#e2ded6] bg-[#fffdf9] text-neutral-700 hover:bg-[#f3f1eb]'
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
              <p className="text-sm font-semibold text-neutral-800">Task type</p>
              <div className="mt-2 grid gap-3 md:grid-cols-3">
                {(Object.keys(taskTypeLabels) as TaskType[]).map((type) => {
                  const disabled = type !== 'pairwise'
                  return (
                    <button
                      className={`rounded-lg border p-3 text-left transition duration-200 ${
                        project.taskType === type
                          ? 'border-[#202936] bg-[#f3f1eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
                          : 'border-[#e2ded6] bg-[#fffdf9] hover:bg-[#f3f1eb]'
                      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                      disabled={disabled}
                      key={type}
                      onClick={() => update('taskType', type)}
                      type="button"
                    >
                      <span className="block text-sm font-semibold text-neutral-900">
                        {taskTypeLabels[type]}
                      </span>
                      <span className="mt-1 block text-xs text-neutral-500">
                        {disabled ? 'Roadmap preview' : 'Fully supported in v1'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-lg font-semibold text-neutral-950">Required annotator fields</h2>
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
            <h2 className="text-lg font-semibold text-neutral-950">Prompt Source</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
              Prompt source defines where user prompts/tasks come from before annotation.
            </p>
            <p className="mt-3 rounded-lg border border-[#e2ded6] bg-[#f6f4ef] p-3 text-sm leading-6 text-neutral-700">
              Real RLHF projects separate prompt sourcing from response generation. Prompts may come from uploads,
              client APIs, user logs, or annotators. Responses may come from uploaded pairs or model APIs. V1
              simulates this with seeded prompt-response batches.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {promptSourceOptions.map((option) => (
                <button
                  className={`rounded-lg border p-3 text-left transition duration-200 ${
                    project.promptSource.type === option.value
                      ? 'border-[#202936] bg-[#f3f1eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
                      : 'border-[#e2ded6] bg-[#fffdf9] hover:bg-[#f3f1eb]'
                  } ${option.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  disabled={option.disabled}
                  key={option.value}
                  onClick={() => updatePromptSourceType(option.value)}
                  type="button"
                >
                  <span className="block text-sm font-semibold text-neutral-900">{option.label}</span>
                  <span className="mt-1 block text-xs text-neutral-500">{option.status}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <FormLabel label="Seed pack">
                  <select
                    className={inputClass}
                    onChange={handleSeedPackChange}
                    value={selectedSeedPack.id}
                  >
                    {SEEDED_PROMPT_PACKS.map((pack) => (
                      <option key={pack.id} value={pack.id}>
                        {pack.name}
                      </option>
                    ))}
                  </select>
                </FormLabel>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{selectedSeedPack.description}</p>

                <div className="mt-4 rounded-lg border border-[#e2ded6] bg-[#f6f4ef] p-4">
                  <p className="text-sm font-semibold text-neutral-900">Coverage preview</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {formatCoverageSummary(selectedSeedPack)}
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {getCoverageRows(selectedSeedPack).map((row) => (
                      <CoverageRow key={row.label} label={row.label} value={row.value} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#e2ded6] bg-[#fffdf9] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-neutral-950">Prompt batch checks</h3>
                  {promptBatchReady ? <Badge tone="green">Prompt batch ready</Badge> : <Badge tone="amber">Review</Badge>}
                </div>
                <div className="mt-4 space-y-3">
                  {promptBatchChecks.map((check) => (
                    <div className="flex items-start gap-2 text-sm" key={check.id}>
                      <CheckCircle2
                        aria-hidden="true"
                        className={check.passed ? 'text-green-600' : 'text-neutral-400'}
                        size={16}
                      />
                      <span className={check.passed ? 'text-neutral-800' : 'text-neutral-500'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">Response Source</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
                  Response source defines where Response A and Response B come from for pairwise evaluation.
                </p>
              </div>
              {project.responseSource.type === 'model_api_simulated' ? (
                <Badge tone="amber">Simulated in v1</Badge>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {responseSourceOptions.map((option) => (
                <button
                  className={`rounded-lg border p-3 text-left transition duration-200 ${
                    project.responseSource.type === option.value
                      ? 'border-[#202936] bg-[#f3f1eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
                      : 'border-[#e2ded6] bg-[#fffdf9] hover:bg-[#f3f1eb]'
                  } ${option.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  disabled={option.disabled}
                  key={option.value}
                  onClick={() => updateResponseSourceType(option.value)}
                  type="button"
                >
                  <span className="block text-sm font-semibold text-neutral-900">{option.label}</span>
                  <span className="mt-1 block text-xs text-neutral-500">{option.status}</span>
                </button>
              ))}
            </div>

            {project.responseSource.type === 'model_api_simulated' ? (
              <div className="mt-5 rounded-lg border border-[#e2ded6] bg-[#fffdf9] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-neutral-950">Model API comparison setup</h3>
                  <Badge tone="amber">Simulated in v1</Badge>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormLabel label="Model A provider">
                    <select
                      className={inputClass}
                      onChange={(event) => updateResponseSource('modelAProvider', event.target.value as ModelProvider)}
                      value={project.responseSource.modelAProvider}
                    >
                      {modelProviders.map((provider) => (
                        <option key={provider}>{provider}</option>
                      ))}
                    </select>
                  </FormLabel>
                  <FormLabel label="Model A version">
                    <input
                      className={inputClass}
                      onChange={(event) => updateResponseSource('modelAVersion', event.target.value)}
                      value={project.responseSource.modelAVersion}
                    />
                  </FormLabel>
                  <FormLabel label="Model B provider">
                    <select
                      className={inputClass}
                      onChange={(event) => updateResponseSource('modelBProvider', event.target.value as ModelProvider)}
                      value={project.responseSource.modelBProvider}
                    >
                      {modelProviders.map((provider) => (
                        <option key={provider}>{provider}</option>
                      ))}
                    </select>
                  </FormLabel>
                  <FormLabel label="Model B version">
                    <input
                      className={inputClass}
                      onChange={(event) => updateResponseSource('modelBVersion', event.target.value)}
                      value={project.responseSource.modelBVersion}
                    />
                  </FormLabel>
                  <FormLabel label="Generation mode">
                    <select
                      className={inputClass}
                      onChange={(event) => updateResponseSource('generationMode', event.target.value as GenerationMode)}
                      value={project.responseSource.generationMode}
                    >
                      {Object.entries(generationModeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </FormLabel>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormLabel label="Temperature">
                      <input
                        className={inputClass}
                        max={2}
                        min={0}
                        onChange={(event) => updateResponseSource('temperature', Number(event.target.value))}
                        step={0.1}
                        type="number"
                        value={project.responseSource.temperature}
                      />
                    </FormLabel>
                    <FormLabel label="Max tokens">
                      <input
                        className={inputClass}
                        min={1}
                        onChange={(event) => updateResponseSource('maxTokens', Number(event.target.value))}
                        type="number"
                        value={project.responseSource.maxTokens}
                      />
                    </FormLabel>
                  </div>
                </div>

                <p className="mt-4 rounded-lg border border-[#e2ded6] bg-[#f6f4ef] p-3 text-sm leading-6 text-neutral-700">
                  Production version would call model APIs through a backend job, store generated responses, randomize
                  display order, and keep model identity hidden from annotators.
                </p>
              </div>
            ) : null}
          </Panel>
        </form>

        <aside className="space-y-4">
          {savedMessage ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
              {savedMessage}
            </div>
          ) : null}

          <Panel className="p-5">
            <h2 className="text-base font-semibold text-neutral-950">Generated UI schema</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <SchemaRow label="Objective" value={objectiveLabels[project.objective]} />
              <SchemaRow label="Prompt source" value={formatPromptSource(project.promptSource.type)} />
              <SchemaRow label="Seed pack" value={selectedSeedPack.name} />
              <SchemaRow label="Response source" value={responseSourceLabels[project.responseSource.type]} />
              {project.responseSource.type === 'model_api_simulated' ? (
                <SchemaRow
                  label="Model pair"
                  value={`${project.responseSource.modelAProvider} / ${project.responseSource.modelAVersion} vs ${project.responseSource.modelBProvider} / ${project.responseSource.modelBVersion}`}
                />
              ) : null}
              <SchemaRow label="Task type" value={taskTypeLabels[project.taskType]} />
              <SchemaRow label="Turn format" value={turnFormatLabels[project.turnFormat]} />
              <SchemaRow label="Tie allowed" value={project.allowTie ? 'Yes' : 'No'} />
              <SchemaRow label="Config version" value={`v${project.configVersion}`} />
            </dl>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-base font-semibold text-neutral-950">Annotator fields</h2>
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
    <label className="flex min-h-12 items-center justify-between gap-4 rounded-lg border border-[#e2ded6] bg-[#fffdf9] px-3 py-2 text-sm font-semibold text-neutral-800 transition duration-200 hover:bg-[#f6f4ef]">
      <span>{label}</span>
      <input
        checked={checked}
        className="h-4 w-4 rounded border-[#d9d5cd] text-[#202936] focus:ring-neutral-900/10"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}

function SchemaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold text-neutral-900">{value}</dd>
    </div>
  )
}

function CoverageRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function getCoverageRows(pack: (typeof SEEDED_PROMPT_PACKS)[number]) {
  return [
    { label: 'Total tasks', value: String(pack.tasks.length) },
    { label: 'Domains included', value: formatList(getUniqueValues(pack.tasks.map((task) => task.domain)), 4) },
    { label: 'Difficulty distribution', value: formatDifficultyDistribution(pack) },
    {
      label: 'Risk categories included',
      value: formatList(getUniqueValues(pack.tasks.map((task) => task.risk_category)), 4),
    },
    {
      label: 'Model pairs included',
      value: formatList(
        getUniqueValues(pack.tasks.map((task) => `${task.response_a_model} vs ${task.response_b_model}`)),
        3,
      ),
    },
    {
      label: 'Objective coverage',
      value: formatList(getUniqueValues(pack.tasks.map((task) => task.expected_objective)), 4),
    },
  ]
}

function formatCoverageSummary(pack: (typeof SEEDED_PROMPT_PACKS)[number]) {
  const domainCount = getUniqueValues(pack.tasks.map((task) => task.domain)).length
  const modelPairs = getUniqueValues(pack.tasks.map((task) => `${task.response_a_model} vs ${task.response_b_model}`))

  return `${pack.tasks.length} tasks · ${domainCount} domains · ${formatDifficultyDistribution(pack)} · ${formatList(modelPairs, 2)}`
}

function formatDifficultyDistribution(pack: (typeof SEEDED_PROMPT_PACKS)[number]) {
  const counts = pack.tasks.reduce(
    (acc, task) => ({ ...acc, [task.difficulty]: acc[task.difficulty] + 1 }),
    { easy: 0, medium: 0, hard: 0 },
  )

  return `${counts.easy} easy / ${counts.medium} medium / ${counts.hard} hard`
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values))
}

function formatList(values: string[], limit: number) {
  if (values.length <= limit) {
    return values.join(', ')
  }

  return `${values.slice(0, limit).join(', ')} +${values.length - limit} more`
}

function formatPromptSource(source: PromptSourceType) {
  return promptSourceOptions.find((option) => option.value === source)?.label ?? source.replaceAll('_', ' ')
}
