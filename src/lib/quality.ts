import type {
  AnnotationResult,
  ChosenResponse,
  Difficulty,
  QualityExportRecord,
  ReviewerDecision,
  ReviewStatus,
} from '../types'

export interface TaskQualitySummary {
  project_id: string
  task_id: string
  prompt_source: string
  seed_pack: string
  domain: string
  difficulty: Difficulty
  intent_category: string
  risk_category: string
  prompt: string
  response_a: string
  response_b: string
  annotations: AnnotationResult[]
  responseAVotes: number
  responseBVotes: number
  tieUnsureVotes: number
  majorityChoice: ChosenResponse
  agreementScore: number
  hasLowConfidence: boolean
  status: ReviewStatus
  reviewDecision: ReviewerDecision | null
}

export function getTaskQualitySummaries(
  records: AnnotationResult[],
  reviewDecisions: ReviewerDecision[],
): TaskQualitySummary[] {
  const grouped = new Map<string, AnnotationResult[]>()

  for (const record of records) {
    const key = getTaskSummaryKey(record.project_id, record.task_id)
    const existing = grouped.get(key) ?? []
    grouped.set(key, [...existing, record])
  }

  return Array.from(grouped.values())
    .map((annotations) => createTaskSummary(annotations, reviewDecisions))
    .sort((a, b) => {
      const projectOrder = a.project_id.localeCompare(b.project_id)
      return projectOrder === 0 ? a.task_id.localeCompare(b.task_id) : projectOrder
    })
}

export function getQualityMetrics(records: AnnotationResult[], summaries: TaskQualitySummary[]) {
  const readySummaryKeys = new Set(
    summaries
      .filter(isReadyForExport)
      .map((summary) => getTaskSummaryKey(summary.project_id, summary.task_id)),
  )
  const readyForExport = records.filter((record) =>
    readySummaryKeys.has(getTaskSummaryKey(record.project_id, record.task_id)),
  ).length
  const needingReview = summaries.filter((summary) => summary.status === 'needs_review').length
  const lowConfidenceRecords = records.filter(isLowConfidence).length
  const agreementRate =
    summaries.length === 0
      ? 'No data'
      : `${Math.round(
          (summaries.reduce((sum, summary) => sum + summary.agreementScore, 0) / summaries.length) * 100,
        )}%`

  return {
    completedAnnotations: records.length,
    agreementRate,
    readyForExport,
    needingReview,
    lowConfidenceRecords,
  }
}

export function buildQualityExportRecords(
  records: AnnotationResult[],
  summaries: TaskQualitySummary[],
): QualityExportRecord[] {
  const summaryByTask = new Map(
    summaries.map((summary) => [getTaskSummaryKey(summary.project_id, summary.task_id), summary]),
  )

  return records.map((record) => {
    const summary = summaryByTask.get(getTaskSummaryKey(record.project_id, record.task_id))

    return {
      ...record,
      agreement_score: summary?.agreementScore ?? 0,
      majority_choice: summary?.majorityChoice ?? record.chosen_response,
      review_status: summary?.status ?? 'needs_review',
      reviewer_final_label: summary?.reviewDecision?.final_label ?? null,
      reviewer_note: summary?.reviewDecision?.reviewer_note ?? null,
    }
  })
}

export function isReadyForExport(summary: TaskQualitySummary) {
  return summary.status === 'accepted' || summary.status === 'approved'
}

function createTaskSummary(
  annotations: AnnotationResult[],
  reviewDecisions: ReviewerDecision[],
): TaskQualitySummary {
  const first = annotations[0]
  const responseAVotes = countVotes(annotations, 'response_a')
  const responseBVotes = countVotes(annotations, 'response_b')
  const tieUnsureVotes = countVotes(annotations, 'tie_unsure')
  const counts = [
    { choice: 'response_a' as const, votes: responseAVotes },
    { choice: 'response_b' as const, votes: responseBVotes },
    { choice: 'tie_unsure' as const, votes: tieUnsureVotes },
  ]
  const highestVoteCount = Math.max(...counts.map((item) => item.votes))
  const tiedMajorities = counts.filter((item) => item.votes === highestVoteCount)
  const majorityChoice = tiedMajorities.length === 1 ? tiedMajorities[0].choice : 'tie_unsure'
  const agreementScore = roundAgreementScore(highestVoteCount / annotations.length)
  const hasLowConfidence = annotations.some(isLowConfidence)
  const reviewDecision =
    reviewDecisions.find(
      (decision) => decision.project_id === first.project_id && decision.task_id === first.task_id,
    ) ?? null
  const status = getReviewStatus(agreementScore, hasLowConfidence, reviewDecision)

  return {
    project_id: first.project_id,
    task_id: first.task_id,
    prompt_source: first.prompt_source,
    seed_pack: first.seed_pack,
    domain: first.domain,
    difficulty: first.difficulty,
    intent_category: first.intent_category,
    risk_category: first.risk_category,
    prompt: first.prompt,
    response_a: first.response_a,
    response_b: first.response_b,
    annotations,
    responseAVotes,
    responseBVotes,
    tieUnsureVotes,
    majorityChoice,
    agreementScore,
    hasLowConfidence,
    status,
    reviewDecision,
  }
}

function countVotes(records: AnnotationResult[], choice: ChosenResponse) {
  return records.filter((record) => record.chosen_response === choice).length
}

function getTaskSummaryKey(projectId: string, taskId: string) {
  return `${projectId}::${taskId}`
}

function isLowConfidence(record: AnnotationResult) {
  return record.confidence?.trim().toLowerCase() === 'low'
}

function roundAgreementScore(score: number) {
  return Math.round(score * 100) / 100
}

function getReviewStatus(
  agreementScore: number,
  hasLowConfidence: boolean,
  reviewDecision: ReviewerDecision | null,
): ReviewStatus {
  if (reviewDecision?.final_label === 'discard') {
    return 'discarded'
  }

  if (reviewDecision) {
    return 'approved'
  }

  if (agreementScore >= 0.67 && !hasLowConfidence) {
    return 'accepted'
  }

  return 'needs_review'
}
