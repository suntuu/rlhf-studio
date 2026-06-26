import type { AnnotationResult, ProjectConfig, ReviewerDecision } from '../types'

const projectsKey = 'rlhf-studio.projects.v2'
const annotationsKey = 'rlhf-studio.annotations.v2'
const reviewDecisionsKey = 'rlhf-studio.review-decisions.v2'

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
}

export function getProjects(): ProjectConfig[] {
  ensureWorkspaceStorage()
  return readJson(projectsKey, [])
}

export function saveProject(project: ProjectConfig): ProjectConfig {
  const projects = getProjects()
  const existing = projects.find((item) => item.id === project.id)
  const savedProject: ProjectConfig = {
    ...project,
    name: project.name.trim() || 'Untitled RLHF Project',
    description: project.description.trim(),
    updatedAt: new Date().toISOString(),
    configVersion: existing ? existing.configVersion + 1 : project.configVersion,
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
  return readJson<AnnotationResult[]>(annotationsKey, [])
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

export function clearWorkspaceData() {
  writeJson(projectsKey, [])
  writeJson(annotationsKey, [])
  writeJson(reviewDecisionsKey, [])
}
