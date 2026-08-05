/** Real StarCi capstone grounding pulled from Postgres for an accurate rewrite. */
export interface CapstoneGroundingRow {
    /** Title of the milestone task the capstone was submitted against. */
    task_title: string
    /** Brief of that task, when the task carries one. */
    task_description: string | null
    /** Title of the milestone the task belongs to. */
    milestone_title: string
    /** Title of the course the milestone belongs to. */
    course_title: string
    /** Score the attempt was graded at. */
    score: number
    /** One-line grader feedback, when the attempt has one. */
    short_feedback: string | null
}

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
