import type {
  AnnotationResult,
  GenerationMode,
  ModelProvider,
  ProjectConfig,
  PromptSourceConfig,
  RoadmapPromptSourceType,
  ResponseSourceConfig,
  ReviewerDecision,
} from '../types'
import { defaultResponseSource } from '../data/demoData'
import { getDefaultSeedPackIdForPreset, getSeedPackById } from '../data/seedTasks'

const projectsKey = 'rlhf-studio.projects.v2'
const annotationsKey = 'rlhf-studio.annotations.v2'
const reviewDecisionsKey = 'rlhf-studio.review-decisions.v2'
const taskProgressKey = 'rlhf-studio.task-progress.v1'
const roadmapPromptSourceTypes: RoadmapPromptSourceType[] = [
  'upload_csv_jsonl',
  'client_system_api',
  'annotator_created',
  'synthetic_generation',
]

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (canUseStorage()) {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

function ensureWorkspaceStorage() {
  if (!canUseStorage()) {
    return
  }

  if (!window.localStorage.getItem(projectsKey)) {
    writeJson(projectsKey, [])
  }

  if (!window.localStorage.getItem(annotationsKey)) {
    writeJson(annotationsKey, [])
  }

  if (!window.localStorage.getItem(reviewDecisionsKey)) {
    writeJson(reviewDecisionsKey, [])
  }

  if (!window.localStorage.getItem(taskProgressKey)) {
    writeJson(taskProgressKey, {})
  }
}

export function getProjects(): ProjectConfig[] {
  ensureWorkspaceStorage()
  return readJson<ProjectConfig[]>(projectsKey, []).map(normalizeProject)
}

export function saveProject(project: ProjectConfig): ProjectConfig {
  const projects = getProjects()
  const normalizedProject = normalizeProject(project)
  const existing = projects.find((item) => item.id === normalizedProject.id)
  const savedProject: ProjectConfig = {
    ...normalizedProject,
    name: normalizedProject.name.trim() || 'Untitled RLHF Project',
    description: normalizedProject.description.trim(),
    updatedAt: new Date().toISOString(),
    configVersion: existing ? existing.configVersion + 1 : normalizedProject.configVersion,
  }

  const nextProjects = existing
    ? projects.map((item) => (item.id === savedProject.id ? savedProject : item))
    : [savedProject, ...projects]

  writeJson(projectsKey, nextProjects)
  return savedProject
}

export function getProjectById(id: string): ProjectConfig | undefined {
  return getProjects().find((project) => project.id === id)
}

export function getAnnotations(): AnnotationResult[] {
  ensureWorkspaceStorage()
  return readJson<AnnotationResult[]>(annotationsKey, []).map(normalizeAnnotation)
}

export function saveAnnotation(annotation: AnnotationResult) {
  const annotations = getAnnotations()
  writeJson(annotationsKey, [annotation, ...annotations])
}

export function getAnnotationsByProject(projectId: string): AnnotationResult[] {
  return getAnnotations().filter((annotation) => annotation.project_id === projectId)
}

export function getReviewDecisions(projectId?: string): ReviewerDecision[] {
  ensureWorkspaceStorage()
  const decisions = readJson<ReviewerDecision[]>(reviewDecisionsKey, [])

  if (!projectId) {
    return decisions
  }

  return decisions.filter((decision) => decision.project_id === projectId)
}

export function saveReviewDecision(decision: ReviewerDecision) {
  const decisions = getReviewDecisions()
  const nextDecisions = decisions.some(
    (item) => item.project_id === decision.project_id && item.task_id === decision.task_id,
  )
    ? decisions.map((item) =>
        item.project_id === decision.project_id && item.task_id === decision.task_id ? decision : item,
      )
    : [decision, ...decisions]

  writeJson(reviewDecisionsKey, nextDecisions)
}

export function getTaskProgress(projectId: string) {
  ensureWorkspaceStorage()
  const progress = readJson<Record<string, number>>(taskProgressKey, {})
  return progress[projectId] ?? 0
}

export function saveTaskProgress(projectId: string, nextTaskIndex: number) {
  ensureWorkspaceStorage()
  const progress = readJson<Record<string, number>>(taskProgressKey, {})
  writeJson(taskProgressKey, { ...progress, [projectId]: nextTaskIndex })
}

export function clearWorkspaceData() {
  writeJson(projectsKey, [])
  writeJson(annotationsKey, [])
  writeJson(reviewDecisionsKey, [])
  writeJson(taskProgressKey, {})
}

type LegacyProjectConfig = Partial<ProjectConfig> & {
  selectedSeedPackId?: string
  promptSource?: ProjectConfig['promptSource'] | string
  responseSource?: Partial<ResponseSourceConfig>
}

function normalizeProject(project: LegacyProjectConfig): ProjectConfig {
  const methodologyPreset = project.methodologyPreset ?? 'meta_helpfulness'
  const promptSource = normalizePromptSource(project, methodologyPreset)
  const seedPack = getSeedPackById(
    promptSource.seedPackId || getDefaultSeedPackIdForPreset(methodologyPreset),
  )
  const firstTask = seedPack.tasks[0]

  return {
    ...project,
    id: project.id ?? `project-${crypto.randomUUID()}`,
    name: project.name ?? '',
    description: project.description ?? '',
    status: project.status ?? 'draft',
    methodologyPreset,
    objective: project.objective ?? 'helpfulness',
    promptSource: {
      ...promptSource,
      seedPackId: seedPack.id,
    },
    responseSource: normalizeResponseSource(project.responseSource),
    taskType: project.taskType ?? 'pairwise',
    turnFormat: project.turnFormat ?? 'single_turn',
    requiredFields: {
      preferenceStrength: project.requiredFields?.preferenceStrength ?? true,
      rationale: project.requiredFields?.rationale ?? true,
      safetyLabels: project.requiredFields?.safetyLabels ?? false,
      confidence: project.requiredFields?.confidence ?? true,
    },
    allowTie: project.allowTie ?? true,
    annotationsPerTask: project.annotationsPerTask || 1,
    samplePrompt: firstTask.prompt,
    responseA: firstTask.response_a,
    responseB: firstTask.response_b,
    responseAModel: firstTask.response_a_model,
    responseBModel: firstTask.response_b_model,
    createdAt: project.createdAt ?? new Date().toISOString(),
    updatedAt: project.updatedAt ?? new Date().toISOString(),
    configVersion: project.configVersion || 1,
  }
}

function normalizeAnnotation(record: AnnotationResult): AnnotationResult {
  return {
    ...record,
    prompt_source_type: record.prompt_source_type ?? record.prompt_source ?? 'legacy_configured_task',
    response_source_type: record.response_source_type ?? 'seeded_pairs',
    prompt_source: record.prompt_source ?? 'legacy_configured_task',
    seed_pack: record.seed_pack ?? 'legacy_configured_task',
    domain: record.domain ?? 'configured',
    difficulty: record.difficulty ?? 'medium',
    intent_category: record.intent_category ?? record.objective ?? 'configured',
    risk_category: record.risk_category ?? (record.objective === 'safety' ? 'safety' : 'none'),
    response_a_provider: record.response_a_provider ?? 'Custom',
    response_b_provider: record.response_b_provider ?? 'Custom',
    generation_mode: record.generation_mode ?? 'batch_before_annotation',
  }
}

function normalizePromptSource(
  project: LegacyProjectConfig,
  methodologyPreset: ProjectConfig['methodologyPreset'],
): PromptSourceConfig {
  if (typeof project.promptSource === 'object' && project.promptSource) {
    return {
      type: project.promptSource.type ?? 'seeded_prompt_pack',
      seedPackId:
        project.promptSource.seedPackId ??
        project.selectedSeedPackId ??
        getDefaultSeedPackIdForPreset(methodologyPreset),
      roadmapSourceType: project.promptSource.roadmapSourceType,
    }
  }

  const roadmapSourceType = isRoadmapPromptSourceType(project.promptSource) ? project.promptSource : undefined

  return {
    type: 'seeded_prompt_pack',
    seedPackId: project.selectedSeedPackId ?? getDefaultSeedPackIdForPreset(methodologyPreset),
    roadmapSourceType,
  }
}

function isRoadmapPromptSourceType(value: unknown): value is RoadmapPromptSourceType {
  return typeof value === 'string' && roadmapPromptSourceTypes.includes(value as RoadmapPromptSourceType)
}

function normalizeResponseSource(source: Partial<ResponseSourceConfig> | undefined): ResponseSourceConfig {
  return {
    ...defaultResponseSource,
    ...source,
    type: source?.type ?? defaultResponseSource.type,
    modelAProvider: normalizeProvider(source?.modelAProvider, defaultResponseSource.modelAProvider),
    modelBProvider: normalizeProvider(source?.modelBProvider, defaultResponseSource.modelBProvider),
    modelAVersion: source?.modelAVersion?.trim() || defaultResponseSource.modelAVersion,
    modelBVersion: source?.modelBVersion?.trim() || defaultResponseSource.modelBVersion,
    generationMode: normalizeGenerationMode(source?.generationMode, defaultResponseSource.generationMode),
    temperature: Number.isFinite(source?.temperature) ? Number(source?.temperature) : defaultResponseSource.temperature,
    maxTokens: Number.isFinite(source?.maxTokens) ? Number(source?.maxTokens) : defaultResponseSource.maxTokens,
  }
}

function normalizeProvider(value: ModelProvider | undefined, fallback: ModelProvider) {
  return value ?? fallback
}

function normalizeGenerationMode(value: GenerationMode | undefined, fallback: GenerationMode) {
  return value ?? fallback
}
