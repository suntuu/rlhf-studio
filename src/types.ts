export type MethodologyPreset =
  | 'meta_helpfulness'
  | 'anthropic_safety'
  | 'custom_workflow'

export type Objective = 'helpfulness' | 'safety' | 'accuracy' | 'custom'

export type TaskType = 'pairwise' | 'rating' | 'rewrite'

export type TurnFormat = 'single_turn' | 'multi_turn'

export type PromptSourceOption = 'seeded_prompt_pack' | 'upload_jsonl_csv' | 'annotator_created'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type ExpectedObjective = 'helpfulness' | 'safety' | 'accuracy' | 'rewrite'

export type ProjectStatus = 'draft' | 'published'

export type ChosenResponse = 'response_a' | 'response_b' | 'tie_unsure'

export type ReviewFinalLabel = ChosenResponse | 'discard'

export type ReviewStatus = 'accepted' | 'needs_review' | 'approved' | 'discarded'

export interface RequiredFields {
  preferenceStrength: boolean
  rationale: boolean
  safetyLabels: boolean
  confidence: boolean
}

export interface ProjectConfig {
  id: string
  name: string
  description: string
  status: ProjectStatus
  methodologyPreset: MethodologyPreset
  objective: Objective
  promptSource: PromptSourceOption
  selectedSeedPackId: string
  taskType: TaskType
  turnFormat: TurnFormat
  requiredFields: RequiredFields
  allowTie: boolean
  annotationsPerTask: number
  samplePrompt: string
  responseA: string
  responseB: string
  responseAModel: string
  responseBModel: string
  createdAt: string
  updatedAt: string
  configVersion: number
}

export interface AnnotationResult {
  annotation_id: string
  project_id: string
  task_id: string
  config_version: number
  project_name: string
  objective: Objective
  task_type: TaskType
  turn_format: TurnFormat
  prompt_source: string
  seed_pack: string
  domain: string
  difficulty: Difficulty
  intent_category: string
  risk_category: string
  prompt: string
  response_a: string
  response_b: string
  response_a_model: string
  response_b_model: string
  chosen_response: ChosenResponse
  chosen_model: string | null
  preference_strength: string | null
  safety_label: string | null
  confidence: string | null
  rationale: string | null
  annotator_id: string
  submitted_at: string
}

export interface ReviewerDecision {
  project_id: string
  task_id: string
  final_label: ReviewFinalLabel
  reviewer_note: string
  approved_at: string
}

export interface QualityExportFields {
  agreement_score: number
  majority_choice: ChosenResponse
  review_status: ReviewStatus
  reviewer_final_label: ReviewFinalLabel | null
  reviewer_note: string | null
}

export type QualityExportRecord = AnnotationResult & QualityExportFields
