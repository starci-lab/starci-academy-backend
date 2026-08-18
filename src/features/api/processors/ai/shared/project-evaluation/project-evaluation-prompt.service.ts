import type {
    MilestoneTaskCriteriaEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task-criteria.entity"
import {
    Injectable,
} from "@nestjs/common"
import type {
    ResolvedChallengeCriterion,
} from "../challenge-submission/types/criteria"
import {
    renderCriteriaPromptSections,
} from "../challenge-submission/utils/render-criteria-prompt-sections"
import template from "../../review-milestone-task/steps/template.json"

interface ProjectEvaluationPromptBaseInput {
    taskTitle: string
    targetLanguage: string
    sourceExcerpt: string
}

interface ProjectEvaluationResolvedCriteriaPromptInput extends ProjectEvaluationPromptBaseInput {
    kind: "v2"
    criteria: Array<ResolvedChallengeCriterion>
    gradeMaxScore: number
}

interface ProjectEvaluationLegacyPromptInput extends ProjectEvaluationPromptBaseInput {
    kind: "legacy"
    criteria: Array<Pick<MilestoneTaskCriteriaEntity, "id" | "orderIndex" | "promptText" | "score" | "text">>
}

/** Discriminated input for the resolved-criteria (yes/no, language-resolved) and legacy milestone prompt contracts. */
export type ProjectEvaluationPromptInput =
    | ProjectEvaluationResolvedCriteriaPromptInput
    | ProjectEvaluationLegacyPromptInput

/** Ordered role content consumed by both production invocation and the live harness. */
export interface ProjectEvaluationPrompt {
    systemText: string
    humanText: string
}

@Injectable()
/** Builds the exact V2 or legacy milestone grading prompt without invoking a model. */
export class ProjectEvaluationPromptService {
    /** Build the production milestone grading prompt. */
    build(input: ProjectEvaluationPromptInput): ProjectEvaluationPrompt {
        const systemText = input.kind === "v2"
            ? this.buildResolvedCriteriaSystemText(input)
            : this.buildLegacySystemText(input)
        const humanText = [
            "Below is an excerpt of files loaded from the submitted GitHub repository (may be truncated):",
            "",
            input.sourceExcerpt || "(empty repository excerpt)",
        ].join("\n")
        return {
            systemText,
            humanText,
        }
    }

    private buildResolvedCriteriaSystemText(input: ProjectEvaluationResolvedCriteriaPromptInput): string {
        const criteriaPromptSections = renderCriteriaPromptSections(input.criteria)
        return [
            `You are a strict, experienced code reviewer grading a learner's personal project for task: "${input.taskTitle}".`,
            "",
            "## Task",
            "Grade the submitted source code against EVERY yes/no criterion listed below.",
            "Each criterion is binary: it is either MET (award its full score) or NOT MET (award 0).",
            "Do NOT award partial credit for a single criterion.",
            "",
            "## Critical criteria",
            "Some criteria are marked **CRITICAL**. If ANY critical criterion is NOT MET, the TOTAL score is 0 for the whole task, regardless of the other criteria.",
            "",
            "## IMPORTANT: Language Requirement",
            `All feedback text MUST be written in **${input.targetLanguage}**.`,
            `JSON keys must remain in English, but all human-readable values (shortFeedback, message, suggestion) must be in ${input.targetLanguage}.`,
            "",
            "## Criteria",
            criteriaPromptSections || "(no criteria provided)",
            "",
            `## Scoring (max total: ${input.gradeMaxScore})`,
            "- total score = sum of the scores of every MET criterion.",
            "- If any CRITICAL criterion is NOT MET, set the total score to 0.",
            "",
            "## Output Format",
            "Respond with a single JSON object matching this template exactly (replace placeholder values):",
            "",
            JSON.stringify(template,
                null,
                2),
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- Escape newlines as \\\\n and double quotes as \\\\\" inside string values.",
            "",
            "## Grading Philosophy",
            "- Focus on implementation correctness and the evidence each criterion describes, NOT code style.",
            "- Before deciding, ACTUALLY READ the source files (e.g. *.ts/*.java/*.cs/*.go), not just the README.",
            "- Add a feedback item per criterion stating whether it was met and the concrete `file:line` evidence.",
            "- Only mark NOT MET when, after inspecting the relevant code, the evidence is genuinely absent.",
        ].filter(Boolean).join("\n")
    }

    private buildLegacySystemText(input: ProjectEvaluationLegacyPromptInput): string {
        const criteriaPromptSections = input.criteria
            .slice()
            .sort((prev, next) => prev.orderIndex - next.orderIndex)
            .map((criterion, index) => {
                const lines = [
                    `### Criteria ${index} (id: "${criterion.id}", maxScore: ${criterion.score})`,
                    `**Display text:** ${criterion.text}`,
                ]
                if (criterion.promptText) lines.push(`**Grading Rubric:**\n${criterion.promptText}`)
                return lines.join("\n")
            })
            .join("\n\n")
        return [
            `You are a strict, experienced code reviewer grading a learner's personal project for task: "${input.taskTitle}".`,
            "",
            "## Task",
            "Review the submitted source code against EVERY criteria listed below.",
            "For each criteria, evaluate whether the code satisfies it, provide concise feedback, and assign a score based on the rubric.",
            "",
            "## IMPORTANT: Language Requirement",
            `All feedback text MUST be written in **${input.targetLanguage}**.`,
            `JSON keys must remain in English, but all human-readable values (shortFeedback, feedback, suggestion) must be in ${input.targetLanguage}.`,
            "",
            "## Criteria",
            criteriaPromptSections || "(no criteria provided)",
            "",
            "## Output Format",
            "Respond with a single JSON object matching this template exactly (replace placeholder values):",
            "",
            JSON.stringify(template,
                null,
                2),
            "## JSON Formatting",
            "- Output STRICT JSON only — no markdown fences, no comments, no trailing commas.",
            "- Use double quotes for all keys and string values.",
            "- Escape newlines as \\\\n and double quotes as \\\\\" inside string values.",
            "",
            "## Grading Philosophy",
            "- Focus on implementation correctness and completeness, NOT code style or formatting.",
            "- If a criteria has forbidden patterns, actively search the code for violations.",
            "- A criteria can have multiple feedback items (one per sub-rubric if the grading rubric lists multiple items).",
            "- Criteria with maxScore: 0 still need feedback but contribute 0 to the total.",
        ].filter(Boolean).join("\n")
    }
}
