import { ArrowRight, CheckCircle2, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProjectTasks } from '../data/demoData'
import { objectiveQuestion, taskInstructions } from '../lib/copy'
import { getProjectById, saveAnnotation } from '../lib/storage'
import type { AnnotationResult, ChosenResponse } from '../types'
import { Badge, Button, EmptyState, LinkButton, PageHeader, Panel } from '../components/UI'
import { inputClass, textareaClass } from '../lib/styles'

const strengthOptions = ['Slightly better', 'Better', 'Much better']
const safetyOptions = [
  'None',
  'Harmful instructions',
  'Hate / harassment',
  'Self-harm',
  'Privacy issue',
  'Misinformation',
]
const confidenceOptions = ['Low', 'Medium', 'High']

export function LiveAnnotation() {
  const { projectId } = useParams()
  const project = projectId ? getProjectById(projectId) : undefined
  const tasks = useMemo(() => (project ? getProjectTasks(project) : []), [project])
  const [taskIndex, setTaskIndex] = useState(0)
  const [chosenResponse, setChosenResponse] = useState<ChosenResponse | ''>('')
  const [preferenceStrength, setPreferenceStrength] = useState('')
  const [safetyLabel, setSafetyLabel] = useState('')
  const [confidence, setConfidence] = useState('')
  const [rationale, setRationale] = useState('')
  const [submittedId, setSubmittedId] = useState('')

  if (!project) {
    return (
      <div className="p-5 lg:p-8">
        <EmptyState
          title="Project not found"
          description="Choose an existing project from the dashboard before opening an annotation task."
          action={<LinkButton to="/">Back to dashboard</LinkButton>}
        />
      </div>
    )
  }

  const currentProject = project
  const task = tasks[taskIndex] ?? tasks[0]
  const isValid =
    chosenResponse &&
    (!currentProject.requiredFields.preferenceStrength || preferenceStrength) &&
    (!currentProject.requiredFields.safetyLabels || safetyLabel) &&
    (!currentProject.requiredFields.confidence || confidence) &&
    (!currentProject.requiredFields.rationale || rationale.trim().length > 0)

  function resetForm(nextIndex = taskIndex) {
    setTaskIndex(nextIndex)
    setChosenResponse('')
    setPreferenceStrength('')
    setSafetyLabel('')
    setConfidence('')
    setRationale('')
    setSubmittedId('')
  }

  function submitAnnotation() {
    if (!isValid || !chosenResponse) {
      return
    }

    const chosenModel =
      chosenResponse === 'response_a'
        ? task.responseAModel
        : chosenResponse === 'response_b'
          ? task.responseBModel
          : null

    const annotation: AnnotationResult = {
      annotation_id: `annotation-${crypto.randomUUID()}`,
      project_id: currentProject.id,
      task_id: task.id,
      config_version: currentProject.configVersion,
      project_name: currentProject.name,
      objective: currentProject.objective,
      task_type: currentProject.taskType,
      turn_format: currentProject.turnFormat,
      prompt: task.prompt,
      response_a: task.responseA,
      response_b: task.responseB,
      response_a_model: task.responseAModel,
      response_b_model: task.responseBModel,
      chosen_response: chosenResponse,
      chosen_model: chosenModel,
      preference_strength: currentProject.requiredFields.preferenceStrength ? preferenceStrength : null,
      safety_label: currentProject.requiredFields.safetyLabels ? safetyLabel : null,
      confidence: currentProject.requiredFields.confidence ? confidence : null,
      rationale: currentProject.requiredFields.rationale ? rationale.trim() : null,
      annotator_id: 'demo_annotator_001',
      submitted_at: new Date().toISOString(),
    }

    saveAnnotation(annotation)
    setSubmittedId(annotation.annotation_id)
  }

  if (submittedId) {
    return (
      <>
        <PageHeader
          title="Annotation submitted"
          description="The structured preference record was saved locally and is ready for review or export."
        />
        <div className="p-5 lg:p-8">
          <Panel className="mx-auto max-w-2xl p-6 text-center">
            <CheckCircle2 className="mx-auto text-green-600" size={46} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">Annotation submitted</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Record ID <span className="font-mono text-slate-800">{submittedId}</span> is stored in localStorage.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button onClick={() => resetForm((taskIndex + 1) % tasks.length)}>
                Annotate another seeded task
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
              <LinkButton to={`/projects/${project.id}/results`} variant="primary">
                View results
              </LinkButton>
            </div>
          </Panel>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={taskInstructions(project)}
        actions={<Badge tone="slate">Task {taskIndex + 1} of {tasks.length}</Badge>}
      />

      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_340px] lg:p-8">
        <section className="space-y-5">
          <Panel className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={project.objective === 'safety' ? 'amber' : 'blue'}>
                {project.objective}
              </Badge>
              <Badge tone="slate">Config v{project.configVersion}</Badge>
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-950">
              {objectiveQuestion(project.objective)}
            </h1>
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                {project.turnFormat === 'multi_turn' ? 'Conversation prompt' : 'User prompt'}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-800">{task.prompt}</p>
            </div>
          </Panel>

          <div className="grid gap-4 xl:grid-cols-2">
            <AnswerCard body={task.responseA} selected={chosenResponse === 'response_a'} title="Response A" />
            <AnswerCard body={task.responseB} selected={chosenResponse === 'response_b'} title="Response B" />
          </div>

          <Panel className="p-5">
            <h2 className="text-base font-semibold text-slate-950">Choose the better response</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <ChoiceButton
                active={chosenResponse === 'response_a'}
                label="Response A"
                onClick={() => setChosenResponse('response_a')}
              />
              <ChoiceButton
                active={chosenResponse === 'response_b'}
                label="Response B"
                onClick={() => setChosenResponse('response_b')}
              />
              {project.allowTie ? (
                <ChoiceButton
                  active={chosenResponse === 'tie_unsure'}
                  label="Tie / Unsure"
                  onClick={() => setChosenResponse('tie_unsure')}
                />
              ) : null}
            </div>
          </Panel>
        </section>

        <aside className="space-y-4">
          <Panel className="p-5">
            <h2 className="text-base font-semibold text-slate-950">Required feedback</h2>
            <div className="mt-4 space-y-4">
              {project.requiredFields.preferenceStrength ? (
                <Field label="Preference strength">
                  <select
                    className={inputClass}
                    onChange={(event) => setPreferenceStrength(event.target.value)}
                    value={preferenceStrength}
                  >
                    <option value="">Select strength</option>
                    {strengthOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              ) : null}

              {project.requiredFields.safetyLabels ? (
                <Field label="Safety labels">
                  <select
                    className={inputClass}
                    onChange={(event) => setSafetyLabel(event.target.value)}
                    value={safetyLabel}
                  >
                    <option value="">Select label</option>
                    {safetyOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              ) : null}

              {project.requiredFields.confidence ? (
                <Field label="Confidence">
                  <select
                    className={inputClass}
                    onChange={(event) => setConfidence(event.target.value)}
                    value={confidence}
                  >
                    <option value="">Select confidence</option>
                    {confidenceOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
              ) : null}

              {project.requiredFields.rationale ? (
                <Field label="Rationale">
                  <textarea
                    className={textareaClass}
                    onChange={(event) => setRationale(event.target.value)}
                    placeholder="Explain why this response is preferred."
                    value={rationale}
                  />
                </Field>
              ) : null}
            </div>
          </Panel>

          <Button disabled={!isValid} onClick={submitAnnotation} variant="primary" className="w-full">
            <Send size={16} aria-hidden="true" />
            Submit
          </Button>

          {!isValid ? (
            <p className="text-sm leading-6 text-slate-600">
              Submit becomes available after the required choice and feedback fields are complete.
            </p>
          ) : null}
        </aside>
      </div>
    </>
  )
}

function AnswerCard({ title, body, selected }: { title: string; body: string; selected: boolean }) {
  return (
    <Panel className={`p-5 ${selected ? 'border-blue-500 ring-4 ring-blue-100' : ''}`}>
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-700">{body}</p>
    </Panel>
  )
}

function ChoiceButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}
