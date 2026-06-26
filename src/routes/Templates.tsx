import { ArrowRight } from 'lucide-react'
import { methodologyLabels } from '../data/demoData'
import { Badge, LinkButton, PageHeader, Panel } from '../components/UI'

const templates = [
  {
    preset: 'meta_helpfulness',
    title: methodologyLabels.meta_helpfulness,
    objective: 'Helpfulness',
    summary:
      'Pairwise single-turn preference collection with strength, rationale, confidence, and optional ties.',
    fields: ['Preference strength', 'Rationale', 'Confidence', 'Tie / unsure'],
  },
  {
    preset: 'anthropic_safety',
    title: methodologyLabels.anthropic_safety,
    objective: 'Safety',
    summary:
      'Pairwise red-team review that adds safety category labels while keeping unsafe examples abstract.',
    fields: ['Preference strength', 'Rationale', 'Safety labels', 'Confidence', 'Tie / unsure'],
  },
  {
    preset: 'custom_workflow',
    title: methodologyLabels.custom_workflow,
    objective: 'Custom',
    summary:
      'Start from the pairwise workflow and decide which annotator fields should be required.',
    fields: ['Configurable objective', 'Configurable required fields', 'Export schema'],
  },
]

export function Templates() {
  return (
    <>
      <PageHeader
        title="Templates"
        description="Start with methodology presets that map admin configuration to annotator UI and export schema."
      />
      <div className="grid gap-5 p-5 xl:grid-cols-3 lg:p-8">
        {templates.map((template) => (
          <Panel className="flex flex-col p-5" key={template.preset}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-neutral-950">{template.title}</h2>
              <Badge tone={template.objective === 'Safety' ? 'amber' : 'blue'}>{template.objective}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-600">{template.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {template.fields.map((field) => (
                <Badge key={field} tone="slate">
                  {field}
                </Badge>
              ))}
            </div>
            <div className="mt-6 flex-1" />
            <LinkButton to={`/projects/new?preset=${template.preset}`} variant="primary" className="w-full">
              Use template
              <ArrowRight size={16} aria-hidden="true" />
            </LinkButton>
          </Panel>
        ))}
      </div>
    </>
  )
}
