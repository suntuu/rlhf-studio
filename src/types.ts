export type MethodologyPreset =
  | 'meta_helpfulness'
  | 'anthropic_safety'
  | 'custom_workflow'

export type Objective = 'helpfulness' | 'safety' | 'accuracy' | 'custom'

export type TaskType = 'pairwise' | 'rating' | 'rewrite'

export type TurnFormat = 'single_turn' | 'multi_turn'

export type ProjectStatus = 'draft' | 'published'

export type ChosenResponse = 'response_a' | 'response_b' | 'tie_unsure'

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

export interface DemoTask {
  id: string
  objective: Objective
  prompt: string
  responseA: string
  responseB: string
  responseAModel: string
  responseBModel: string
}
