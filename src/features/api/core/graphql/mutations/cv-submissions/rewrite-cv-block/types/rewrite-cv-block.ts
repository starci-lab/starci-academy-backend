import type {
    CapstoneGroundingRow,
} from "../rewrite-cv-block.handler"

/** Params for {@link import("../rewrite-cv-block.handler").RewriteCvBlockHandler.loadCapstoneGrounding}. */
export interface LoadCapstoneGroundingParams {
    /** Owning user id -- grounding is scoped to this user's own capstones only. */
    userId: string
    /** The `user_milestone_task_attempts` row id to ground on. */
    attemptId: string
}

/** Params for {@link import("../rewrite-cv-block.handler").RewriteCvBlockHandler.buildSystemPrompt}. */
export interface BuildSystemPromptParams {
    targetLanguage: string
    instruction: string
    grounding: CapstoneGroundingRow | null
}
