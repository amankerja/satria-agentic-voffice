import type { AgentRunInput } from '../types'
import { SkillLoader } from './SkillLoader'
import { MemoryRecallFormatter } from './MemoryRecallFormatter'

export interface BuiltAgentContext {
  systemPrompt: string
  userPrompt: string
  tokenBudget: number
  metadata: {
    employeeRole: string
    department: string
    toolCount: number
    skillCount: number
    memoryCount: number
  }
}

export class ContextBuilder {
  private static readonly MAX_CONTEXT_TOKENS = 32000

  static build(input: AgentRunInput): BuiltAgentContext {
    const {
      employee,
      assignment,
      skills,
      tools,
      workspacePath,
      taskPrompt,
      acceptanceCriteria = [],
      instructions,
      memories = []
    } = input

    const skillInstructions = SkillLoader.formatSkillsPrompt(SkillLoader.loadSkills(skills || []))
    const memoryInstructions = MemoryRecallFormatter.format(memories)
    const toolList =
      tools && tools.length > 0
        ? tools.map((t) => `- ${t.name}: ${t.description} (Access: ${t.permissionLevel})`).join('\n')
        : '- filesystem.read: Read-only access to workspace files'

    const criteriaList =
      acceptanceCriteria && acceptanceCriteria.length > 0
        ? acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')
        : '1. Fulfill task objective completely and reliably.\n2. Ensure zero regressions and pass all test assertions.'

    const systemPrompt = `You are ${employee.name}, an autonomous digital workforce agent in SATRIA AI WORKFORCE.
Department: ${employee.departmentName}
Role: ${employee.roleName}
Description: ${employee.description}

### AVAILABLE TOOLS:
${toolList}

### ATTACHED SKILLS & GUIDELINES:
${skillInstructions}

### RECALLED AGENT MEMORIES & LESSONS (PAST EXPERIENCE):
${memoryInstructions}

### SECURITY & EXECUTION POLICY:
1. You may ONLY read and write files within the assigned workspace path: "${workspacePath}".
2. Any attempt to access paths outside this directory will be blocked immediately.
3. Every file modification will be captured as a git-style diff and inspected by the user.
4. You must execute tests to verify your work before requesting review.
5. Provide clear, structured reasoning before invoking tools.`

    const userPrompt = `### TASK ASSIGNMENT:
Title: ${assignment.taskTitle}
Priority: ${assignment.priority}

### OBJECTIVE & PROMPT:
${taskPrompt}

### SPECIFIC INSTRUCTIONS:
${instructions || 'Follow standard department best practices.'}

### ACCEPTANCE CRITERIA:
${criteriaList}

Please analyze the workspace, plan your approach, execute changes safely, and verify results.`

    return {
      systemPrompt,
      userPrompt,
      tokenBudget: this.MAX_CONTEXT_TOKENS,
      metadata: {
        employeeRole: employee.roleName,
        department: employee.departmentName,
        toolCount: (tools || []).length,
        skillCount: (skills || []).length,
        memoryCount: (memories || []).length
      }
    }
  }
}
