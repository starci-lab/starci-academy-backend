import {
    createEnumType
} from "@modules/common"
import {
    registerEnumType
} from "@nestjs/graphql"

/**
 * Tasks an AI model is suited for. Stored on `ai_models.supported_tasks`
 * (JSONB array of these string values — NOT a Postgres enum type) and surfaced
 * to the FE so the model pickers can hide models that do not serve a task
 * (e.g. a grading-only model is hidden from the chat picker).
 */
export enum AiModelTask {
    /** Conversational tutor — shown in the chat model picker. */
    Chatting = "chatting",
    /** Code / submission grading — shown in the grading model picker. */
    Grading = "grading",
    /** Vector embedding generation — RAG indexing / retrieval. */
    Embedding = "embedding",
    /** CV generation / revision — shown in the CV-generation model picker. */
    CVGenerating = "cv_generating",
    /** Personal-project / capstone milestone-task review — shown in that grading model picker. */
    TaskGrading = "task_grading",
    /** Challenge submission grading (Git repo / Google Docs) — shown in that grading model picker. */
    ChallengeGrading = "challenge_grading",
}

/**
 * GraphQL type for the AI model task enum.
 */
export const GraphQLTypeAiModelTask = createEnumType(AiModelTask)

/**
 * Register the AI model task enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeAiModelTask,
    {
        name: "AiModelTask",
        description: "Tasks an AI model is suited for.",
        valuesMap: {
            [AiModelTask.Chatting]: {
                description: "Conversational tutor.",
            },
            [AiModelTask.Grading]: {
                description: "Code/submission grading.",
            },
            [AiModelTask.Embedding]: {
                description: "Vector embedding generation.",
            },
            [AiModelTask.CVGenerating]: {
                description: "CV generation/revision.",
            },
            [AiModelTask.TaskGrading]: {
                description: "Personal-project/capstone milestone-task review.",
            },
            [AiModelTask.ChallengeGrading]: {
                description: "Challenge submission grading (Git/Google Docs).",
            },
        },
    }
)
