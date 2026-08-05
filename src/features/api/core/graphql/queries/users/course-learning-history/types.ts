import type {
    ContentDifficulty,
} from "@modules/databases/postgresql/primary/enums/content-difficulty"
import type {
    CourseLearningEventType,
} from "./enums"

/**
 * Raw row returned by the per-course learning-history query. One row per
 * learning event (lessonRead / challengePassed / milestonePassed) already
 * filtered to one course via the content -> module -> course (or
 * milestone_task -> milestone -> course) join, newest-first. `at` + `id` give
 * a stable ordering tie-break.
 */
export interface CourseLearningHistoryRow {
    /** Source activity row id (stable tie-breaker, surfaced as the event id). */
    id: string
    /** Kind of learning event. */
    type: CourseLearningEventType
    /** Lesson / challenge / milestone-task title (the event label). */
    label: string
    /** When the event happened (activity created_at). */
    at: Date
    /** Owning module title, or null for milestone events (no module). */
    moduleTitle: string | null
    /** Lesson difficulty, or null when unset / not a lesson event. */
    difficulty: ContentDifficulty | null
}

/**
 * Decoded cursor for the chronological per-course history. Newest-first ordering
 * is absolute (created_at DESC, id DESC), so a plain row offset is enough -- no
 * decay reference is pinned the way the score-ranked home feed does.
 */
export interface DecodedCourseLearningHistoryCursor {
    /** Number of already-consumed rows to skip (offset pagination). */
    offset: number
}
