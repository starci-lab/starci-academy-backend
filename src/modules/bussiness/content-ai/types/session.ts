/**
 * Which surface a content-AI question is grounded on. A session is one
 * `(scope + anchor)`; the scope selects WHICH grounding path runs:
 * - `"content"`: a course lesson/content item (MinIO body + repo code, premium-gated).
 * - `"task"`: a capstone / personal-project task (milestone RAG chunk, enrolled-only).
 * - `"foundation"`: a global foundation-library doc (single-doc RAG, no course gate).
 * - `"course"`: the whole course (course-wide RAG, enrolled-only).
 */
export type ContentAiScope = "content" | "task" | "challenge" | "quiz" | "foundation" | "course"

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
