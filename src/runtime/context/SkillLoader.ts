import type { Skill } from '../../types'

export interface LoadedSkillContext {
  skillId: string
  name: string
  instructions: string
  priority: string
  version: string
}

export class SkillLoader {
  /**
   * Resolves and formats assigned skills into compact prompt instructions
   */
  static loadSkills(skills: Skill[]): LoadedSkillContext[] {
    return skills.map((skill) => ({
      skillId: skill.id,
      name: skill.name,
      priority: 'P0',
      version: skill.version,
      instructions: `### SKILL: ${skill.name} (v${skill.version})\n${skill.description}\nCategory: ${skill.category}`
    }))
  }

  static formatSkillsPrompt(loadedSkills: LoadedSkillContext[]): string {
    if (loadedSkills.length === 0) return 'No specialized skill packages attached.'
    return loadedSkills.map((s) => s.instructions).join('\n\n')
  }
}
