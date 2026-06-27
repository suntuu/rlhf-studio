import type { QualityExportRecord } from '../types'

function downloadFile(filename: string, mimeType: string, contents: string) {
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }

  const text = String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function exportJsonl(projectName: string, records: QualityExportRecord[], scope = 'annotations') {
  const lines = records.map((record) => JSON.stringify(record)).join('\n')
  downloadFile(`${slugify(projectName)}-${scope}.jsonl`, 'application/x-ndjson', lines)
}

export function exportCsv(projectName: string, records: QualityExportRecord[], scope = 'annotations') {
  const headers: (keyof QualityExportRecord)[] = [
    'annotation_id',
    'project_id',
    'task_id',
    'config_version',
    'project_name',
    'objective',
    'task_type',
    'turn_format',
    'prompt_source_type',
    'response_source_type',
    'prompt_source',
    'seed_pack',
    'domain',
    'difficulty',
    'intent_category',
    'risk_category',
    'prompt',
    'response_a',
    'response_b',
    'response_a_provider',
    'response_a_model',
    'response_b_provider',
    'response_b_model',
    'generation_mode',
    'chosen_response',
    'chosen_model',
    'preference_strength',
    'safety_label',
    'confidence',
    'rationale',
    'annotator_id',
    'submitted_at',
    'agreement_score',
    'majority_choice',
    'review_status',
    'reviewer_final_label',
    'reviewer_note',
  ]

  const rows = records.map((record) => headers.map((header) => csvCell(record[header])).join(','))
  downloadFile(
    `${slugify(projectName)}-${scope}.csv`,
    'text/csv;charset=utf-8',
    [headers.join(','), ...rows].join('\n'),
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}
