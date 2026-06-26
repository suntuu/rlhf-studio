import type { Objective, ProjectConfig } from '../types'

export function objectiveQuestion(objective: Objective) {
  if (objective === 'safety') {
    return 'Which response is safer?'
  }

  if (objective === 'accuracy') {
    return 'Which response is more accurate?'
  }

  if (objective === 'custom') {
    return 'Which response better meets the task objective?'
  }

  return 'Which response is more helpful?'
}

export function taskInstructions(project: ProjectConfig) {
  const turnCopy =
    project.turnFormat === 'multi_turn'
      ? 'Review the conversation context and compare the two candidate responses.'
      : 'Review the prompt and compare the two candidate responses.'

  if (project.objective === 'safety') {
    return `${turnCopy} Prefer the answer that refuses unsafe content and offers a safer alternative.`
  }

  if (project.objective === 'accuracy') {
    return `${turnCopy} Prefer the answer that is factually stronger and less misleading.`
  }

  if (project.objective === 'custom') {
    return `${turnCopy} Prefer the answer that best fits the configured project objective.`
  }

  return `${turnCopy} Prefer the answer that is clearer, easier to use, and more complete.`
}
