import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDepartmentStore } from '../stores/department'
import { useEmployeeStore } from '../stores/employee'
import { useSkillStore } from '../stores/skill'
import { useWorkforceToolStore } from '../stores/workforceTool'

describe('SATRIA AI Workforce Phase 1 — Integrated User Journey Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('Journey 1: Workforce Overview displays correct baseline metrics', async () => {
    const deptStore = useDepartmentStore()
    const empStore = useEmployeeStore()
    const skillStore = useSkillStore()
    const toolStore = useWorkforceToolStore()

    await Promise.all([
      deptStore.fetchDepartments(),
      empStore.fetchEmployees(),
      skillStore.fetchSkills(),
      toolStore.fetchTools()
    ])

    expect(deptStore.departments.length).toBe(3)
    expect(empStore.employees.length).toBe(12)
    expect(skillStore.skills.length).toBeGreaterThanOrEqual(20)
    expect(toolStore.tools.length).toBeGreaterThanOrEqual(10)
  })

  it('Journey 2: Filtering employees by Coding department returns 5 specialists', async () => {
    const empStore = useEmployeeStore()
    await empStore.fetchEmployees()

    const codingPersonnel = empStore.employees.filter((e) => e.departmentId === 'dept-coding')
    expect(codingPersonnel.length).toBe(5)

    const names = codingPersonnel.map((e) => e.name)
    expect(names).toEqual(expect.arrayContaining(['Raka', 'Maya', 'Bima', 'Dimas', 'Ardi']))
  })

  it('Journey 3: Create new Employee adds record to directory and updates department counts', async () => {
    const empStore = useEmployeeStore()
    await empStore.fetchEmployees()
    const initialCount = empStore.employees.length

    const created = await empStore.createEmployee({
      name: 'Kevin Test Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      description: 'Test specialist for automated QA verification.',
      departmentId: 'dept-coding',
      departmentName: 'Coding',
      roleId: 'role-uiux',
      roleName: 'UI/UX Frontend',
      status: 'Active',
      supervisorId: 'emp-raka',
      supervisorName: 'Raka (Planner)',
      skills: [
        { skillId: 'skill-frontend-dev', skillName: 'Frontend Development (Vue 3 / TS)', priority: 'P0', assignedAt: '2026-08-14' }
      ],
      toolIds: ['tool-git', 'tool-terminal'],
      permissions: ['task:read', 'task:update']
    })

    expect(created.id).toBeDefined()
    expect(empStore.employees.length).toBe(initialCount + 1)

    const found = await empStore.fetchEmployeeById(created.id)
    expect(found?.name).toBe('Kevin Test Specialist')
    expect(found?.roleName).toBe('UI/UX Frontend')
  })

  it('Journey 4: Skill Assignment and Removal on Employee Profile', async () => {
    const empStore = useEmployeeStore()
    await empStore.fetchEmployees()

    // Assign copywriting skill to Maya
    await empStore.assignSkill('emp-maya', {
      skillId: 'skill-copywriting',
      skillName: 'Conversion Copywriting',
      priority: 'P1',
      assignedAt: '2026-08-14'
    })

    let maya = await empStore.fetchEmployeeById('emp-maya')
    expect(maya?.skills.some((s) => s.skillId === 'skill-copywriting')).toBe(true)

    // Remove copywriting skill from Maya
    await empStore.removeSkill('emp-maya', 'skill-copywriting')
    maya = await empStore.fetchEmployeeById('emp-maya')
    expect(maya?.skills.some((s) => s.skillId === 'skill-copywriting')).toBe(false)
  })

  it('Journey 5: Archiving and Restoring Employee status', async () => {
    const empStore = useEmployeeStore()
    await empStore.fetchEmployees()

    // Archive Ardi
    await empStore.archiveEmployee('emp-ardi')
    let ardi = await empStore.fetchEmployeeById('emp-ardi')
    expect(ardi?.status).toBe('Archived')

    // Restore Ardi
    await empStore.updateEmployeeStatus('emp-ardi', 'Active')
    ardi = await empStore.fetchEmployeeById('emp-ardi')
    expect(ardi?.status).toBe('Active')
  })

  it('Journey 6: Registering new skill into Skill Registry', async () => {
    const skillStore = useSkillStore()
    await skillStore.fetchSkills()
    const initialSkillsCount = skillStore.skills.length

    const newSkill = await skillStore.createSkill({
      name: 'Automated E2E Testing with Playwright',
      slug: 'playwright-e2e',
      category: 'Quality Assurance',
      description: 'End-to-end browser automation and visual regression testing.',
      sourceType: 'internal',
      version: '1.0.0',
      status: 'Available',
      compatibleDepartments: ['dept-coding'],
      compatibleRoles: ['role-qc'],
      tags: ['Testing', 'E2E', 'Automation']
    })

    expect(newSkill.id).toBeDefined()
    expect(skillStore.skills.length).toBe(initialSkillsCount + 1)
  })
})
