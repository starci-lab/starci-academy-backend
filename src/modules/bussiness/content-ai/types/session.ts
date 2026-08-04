/**
 * Which surface a content-AI question is grounded on. A session is one
 * `(scope + anchor)`; the scope selects WHICH grounding path runs:
 * - `"content"`: a course lesson/content item (MinIO body + repo code, premium-gated).
 * - `"task"`: a capstone / personal-project task (milestone RAG chunk, enrolled-only).
 * - `"challenge"`: a hands-on challenge (RAG chunk, enrolled-only).
 * - `"quiz"`: a flashcard-quiz deck (RAG chunk, enrolled-only).
 * - `"foundation"`: a global foundation-library doc (single-doc RAG, no course gate).
 * - `"course"`: the whole course, no page of its own (course-wide RAG is the ONLY
 *   grounding — the additive BASE described below IS the course's grounding here).
 * - `"global"`: the app-wide chat — no page anchor AND no course (truly anchorless).
 *   Anchored on the USER (like `foundation`), never an enrollment.
 *
 * ADDITIVE grounding: every anchored scope above (content/task/challenge/quiz)
 * layers a course-wide BASE (this course's RAG, premium-excluded for a
 * non-enrolled viewer) UNDER its own page-specific grounding — see
 * {@link import("../content-ai.service").ContentAiService.prepareMessages}.
 */
export type ContentAiScope = "content" | "task" | "challenge" | "quiz" | "foundation" | "course" | "global"

/** One prior chat turn replayed to the model as short-term memory. */
export interface ContentAiHistoryMessage {
    /** Author of the turn: `"user"` or `"assistant"`. */
    role: string
    /** The message text. */
    content: string
}

/** A conversation in the session list / search results. */
export interface ContentAiSessionSummary {
    /** Session id. */
    id: string
    /** Conversation title (null until the first question auto-titles it). */
    title: string | null
    /** Last-activity timestamp (drives recency ordering). */
    updatedAt: Date
    /** Number of turns in the conversation. */
    messageCount: number
    /** Which surface the conversation grounds on. */
    scope: ContentAiScope
    /** Content the conversation is anchored to (content scope only; null otherwise). */
    originContentId: string | null
    /** Title of the anchoring content (only resolved for cross-lesson search results). */
    originContentTitle: string | null
    /** First message matching the search query (only for search results). */
    snippet: string | null
}
