import type { MethodologyPreset, Objective, ProjectConfig } from '../types'
import { getDefaultSeedPackIdForPreset, getSeedPackById } from './seedTasks'

export {
  SEEDED_PROMPT_PACKS,
  getPromptBatchChecks,
  getProjectSeedPack,
  getProjectTasks,
  getSeedPackById,
} from './seedTasks'

export const methodologyLabels: Record<MethodologyPreset, string> = {
  meta_helpfulness: 'Meta-style helpfulness comparison',
  anthropic_safety: 'Anthropic-style safety / red-team comparison',
  custom_workflow: 'Custom workflow',
}

export const objectiveLabels: Record<Objective, string> = {
  helpfulness: 'Helpfulness',
  safety: 'Safety',
  accuracy: 'Accuracy',
  custom: 'Custom',
}

export function createBlankProject(preset: MethodologyPreset = 'meta_helpfulness'): ProjectConfig {
  const now = new Date().toISOString()
  const seedPackId = getDefaultSeedPackIdForPreset(preset)
  const base: ProjectConfig = {
    id: `project-${crypto.randomUUID()}`,
    name: '',
    description: '',
    status: 'draft',
    methodologyPreset: preset,
    objective: 'helpfulness',
    promptSource: 'seeded_prompt_pack',
    selectedSeedPackId: seedPackId,
    taskType: 'pairwise',
    turnFormat: 'single_turn',
    requiredFields: {
      preferenceStrength: true,
      rationale: true,
      safetyLabels: false,
      confidence: true,
    },
    allowTie: true,
    annotationsPerTask: 3,
    samplePrompt: '',
    responseA: '',
    responseB: '',
    responseAModel: '',
    responseBModel: '',
    createdAt: now,
    updatedAt: now,
    configVersion: 1,
  }

  return applyPreset(withSeedPackFields(base, seedPackId), preset)
}

export function applyPreset(project: ProjectConfig, preset: MethodologyPreset): ProjectConfig {
  const seedPackId = getDefaultSeedPackIdForPreset(preset)

  if (preset === 'meta_helpfulness') {
    return withSeedPackFields(
      {
        ...project,
        methodologyPreset: preset,
        objective: 'helpfulness',
        promptSource: 'seeded_prompt_pack',
        taskType: 'pairwise',
        turnFormat: 'single_turn',
        requiredFields: {
          preferenceStrength: true,
          rationale: true,
          safetyLabels: false,
          confidence: true,
        },
        allowTie: true,
      },
      seedPackId,
    )
  }

  if (preset === 'anthropic_safety') {
    return withSeedPackFields(
      {
        ...project,
        methodologyPreset: preset,
        objective: 'safety',
        promptSource: 'seeded_prompt_pack',
        taskType: 'pairwise',
        turnFormat: 'single_turn',
        requiredFields: {
          preferenceStrength: true,
          rationale: true,
          safetyLabels: true,
          confidence: true,
        },
        allowTie: true,
      },
      seedPackId,
    )
  }

  return withSeedPackFields(
    {
      ...project,
      methodologyPreset: preset,
      objective: 'custom',
      promptSource: 'seeded_prompt_pack',
      taskType: 'pairwise',
    },
    seedPackId,
  )
}

export function applySeedPack(project: ProjectConfig, seedPackId: string): ProjectConfig {
  return withSeedPackFields(project, seedPackId)
}

export function withSeedPackFields(project: ProjectConfig, seedPackId: string): ProjectConfig {
  const seedPack = getSeedPackById(seedPackId)
  const firstTask = seedPack.tasks[0]

  return {
    ...project,
    promptSource: 'seeded_prompt_pack',
    selectedSeedPackId: seedPack.id,
    samplePrompt: firstTask.prompt,
    responseA: firstTask.response_a,
    responseB: firstTask.response_b,
    responseAModel: firstTask.response_a_model,
    responseBModel: firstTask.response_b_model,
  }
}
