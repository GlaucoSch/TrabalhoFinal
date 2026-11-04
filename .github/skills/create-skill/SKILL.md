---
name: create-skill
description: "Create reusable SKILL.md files from a repeatable workflow. Use for turning debugging, review, planning, implementation, or QA flows into a reusable agent skill; deciding whether the workflow belongs in a skill, prompt, or custom agent; and saving the result in the correct workspace or personal customization folder."
argument-hint: "Create a skill for [workflow name]"
user-invocable: true
---

# Create a Reusable Skill

## When to Use
- A workflow repeats across tasks and should be reusable
- You want to capture a process that includes checks, branching, and completion criteria
- A user asks to formalize a workflow as a skill, prompt, or agent customization
- The goal is to reduce repeated instructions and make them discoverable by keyword

## Goal
Produce a concise, reusable SKILL.md that captures:
- the step-by-step process being followed
- key decision points and branching logic
- quality checks or completion conditions
- the correct location and naming for the skill

## Procedure
1. Review the conversation and identify the actual workflow being followed.
   - Look for repeated steps, decision branches, and verification gates.
   - Generalize the pattern so it can be reused beyond a single scenario.

2. Extract the core workflow.
   - Write down the sequence of actions.
   - Note where the user chooses between paths, such as workspace vs personal scope or skill vs prompt vs agent.
   - Capture expected outputs and stopping criteria.

3. Determine the right scope.
   - Workspace scope: save under .github/skills/<skill-name>/ if the workflow is project-specific or team-shared.
   - Personal scope: save under ~/.copilot/skills/<skill-name>/ or a matching personal customization folder if it should be reused across workspaces.

4. Decide whether this should be a skill, prompt, or custom agent.
   - Use a skill when the workflow is multi-step, reusable, and task-focused.
   - Use a prompt when the task is a single focused action with inputs.
   - Use a custom agent when context isolation or tool restrictions are required.

5. Draft the skill file.
   - Use frontmatter with a valid name that matches the folder name.
   - Add a keyword-rich description that includes trigger phrases.
   - Include a clear title and a concise set of sections, such as:
     - When to Use
     - Goal
     - Procedure
     - Quality Checks
     - Output Expectations

6. Validate the skill before finishing.
   - Confirm the folder and file name match the YAML name.
   - Ensure the description is discoverable using likely trigger words.
   - Confirm the procedure is explicit and actionable.
   - Check that completion criteria are measurable.
   - Keep the content concise and self-contained.

7. Iterate if the workflow is incomplete or ambiguous.
   - Ask 1 to 3 concise clarifying questions if the workflow needs a choice on scope, outcome, or expected artifacts.
   - Tighten the skill by removing vague or duplicate instructions.
   - Re-test against likely prompts to ensure it is discoverable.

## Quality Criteria
A good skill should:
- be easy to trigger with concrete keywords
- explain the workflow in plain, repeatable steps
- include decision points when the process branches
- define how success is verified
- live in the correct customization location

## Output
The result is a reusable SKILL.md designed to help an agent or user execute the process repeatedly without re-deriving the workflow each time.

## Example Prompts
- Create a skill for debugging REST API issues in a Spring Boot project.
- Turn our code review checklist into a reusable skill for the workspace.
- Write a skill for validating a Java upgrade before finalizing it.
- Create a skill for reviewing project setup and verifying build health.

## Related Customizations
- Add a workspace instruction for standards that apply to all tasks
- Add a custom agent for a specialized workflow with constrained tools
- Add a prompt for one-off tasks that do not need full workflow packaging
