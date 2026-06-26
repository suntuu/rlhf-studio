import { cloneDefaultProjects } from '../data/demoData'
import type { AnnotationResult, ProjectConfig } from '../types'

const projectsKey = 'rlhf-studio.projects.v1'
const annotationsKey = 'rlhf-studio.annotations.v1'

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

function ensureSeededProjects() {
  if (!canUseStorage()) {
    return
  }

  if (!window.localStorage.getItem(projectsKey)) {
    writeJson(projectsKey, cloneDefaultProjects())
  }

  if (!window.localStorage.getItem(annotationsKey)) {
    writeJson(annotationsKey, [])
  }
}

export function getProjects(): ProjectConfig[] {
  ensureSeededProjects()
  return readJson(projectsKey, cloneDefaultProjects())
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
  ensureSeededProjects()
  return readJson<AnnotationResult[]>(annotationsKey, [])
}

export function saveAnnotation(annotation: AnnotationResult) {
  const annotations = getAnnotations()
  writeJson(annotationsKey, [annotation, ...annotations])
}

export function getAnnotationsByProject(projectId: string): AnnotationResult[] {
  return getAnnotations().filter((annotation) => annotation.project_id === projectId)
}

export function resetDemoData() {
  writeJson(projectsKey, cloneDefaultProjects())
  writeJson(annotationsKey, [])
}
