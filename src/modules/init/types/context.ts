/**
 * Per-course module/milestone filter built from `seed.yaml`.
 *
 * Map value: `null` = all order indexes; `Set()` = disabled;
 * `Set(n...)` = allow-list (e.g. `0,1` -> folders `0-*`, `1-*`).
 */
export type CourseIndexFilterByDisplayId = Map<string, Set<number> | null>

/** Resolved synchronizer scope for one sink (CDN or Elasticsearch). */
export interface SynchronizerSyncScope {
    /**
     * Course root entity sync gate, keyed by course `displayId`.
     * When `false` or missing from the map, the course document is skipped.
     */
    courseEnabledByDisplayId: Map<string, boolean>
    /** `null` = unrestricted (no map); otherwise one entry per course track. */
    moduleIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    milestoneIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    /** Whether foundation entities are in scope. */
    foundations: boolean
    /** Whether headhunting entities are in scope. */
    headhunting: boolean
    /** Whether flashcard decks are in scope. */
    flashcards: boolean
    /** Whether coding-practice problems are in scope. */
    codingProblems: boolean
}
