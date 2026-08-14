import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Skill } from '../types'
import { MockSkillRepository } from '../repositories'

export const useSkillStore = defineStore('skill', () => {
  const repo = new MockSkillRepository()

  const skills = ref<Skill[]>([])
  const currentSkill = ref<Skill | null>(null)
  const loading = ref<boolean>(false)

  const internalSkills = computed(() => skills.value.filter((s) => s.sourceType === 'internal'))
  const externalSkills = computed(() => skills.value.filter((s) => s.sourceType === 'external'))

  async function fetchSkills() {
    loading.value = true
    try {
      skills.value = await repo.getAll()
      return skills.value
    } finally {
      loading.value = false
    }
  }

  async function fetchSkillById(id: string) {
    loading.value = true
    try {
      const skill = await repo.getById(id)
      currentSkill.value = skill || null
      return skill
    } finally {
      loading.value = false
    }
  }

  async function createSkill(data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    try {
      const created = await repo.create(data)
      skills.value.push(created)
      return created
    } finally {
      loading.value = false
    }
  }

  async function updateSkill(id: string, updates: Partial<Skill>) {
    loading.value = true
    try {
      const updated = await repo.update(id, updates)
      if (updated) {
        const idx = skills.value.findIndex((s) => s.id === id)
        if (idx >= 0) {
          skills.value[idx] = updated
        }
      }
      return updated
    } finally {
      loading.value = false
    }
  }

  return {
    skills,
    currentSkill,
    loading,
    internalSkills,
    externalSkills,
    fetchSkills,
    fetchSkillById,
    createSkill,
    updateSkill
  }
})
