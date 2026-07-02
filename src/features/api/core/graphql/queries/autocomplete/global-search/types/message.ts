/** A single resolved ancestor (course/module/content/challenge) of a search hit. */
export interface GlobalSearchParentRef {
    /** Primary key (UUID) of the ancestor — used for module/content learn URLs. */
    id: string
    /** Human-facing slug of the ancestor — used for the course URL segment. */
    displayId: string
}

/**
 * Ancestor chain of a search hit, hydrated from the sync-indexer parent-index cache.
 * Each level is present only when it exists for the hit's entity kind.
 */
export interface GlobalSearchParentPath {
    /** Owning course (present for every entity kind). */
    course?: GlobalSearchParentRef
    /** Owning module (present for module/content/challenge hits). */
    module?: GlobalSearchParentRef
    /** Owning content (present for content/challenge hits). */
    content?: GlobalSearchParentRef
    /** The challenge itself (present for challenge hits). */
    challenge?: GlobalSearchParentRef
    /** The milestone's first task (present for milestone hits) — used to deep-link into the personal-project page. */
    task?: GlobalSearchParentRef
}

/** A single autocomplete hit produced by an entity search service. */
export interface GlobalSearchItem {
    /** Primary key (UUID) of the matched entity. */
    id: string
    /** Human-facing slug of the matched entity. */
    displayId: string
    /** Matched entity title. */
    title: string
    /** Highlighted snippet strings (may contain `<em>` tags from Elasticsearch). */
    texts: Array<string>
    /** Resolved ancestor chain used by the client to build a navigation URL (null if uncached). */
    parentPath?: GlobalSearchParentPath
    /**
     * Canonical, locale-agnostic route built server-side from the parent index
     * (the route resolver / "index" SSOT). Client prepends `/{locale}` and pushes
     * it. Null when the route can't be built (cache miss / unroutable kind).
     */
    path?: string | null
    /**
     * COURSE hits only: whether the authed user has a REAL enrollment
     * (`EnrollmentEntity.isEnrolled === true`) in this course. Always false for
     * guests. Undefined for non-course kinds / when enrichment was skipped.
     */
    isEnrolled?: boolean
    /**
     * COURSE hits only: whether the course is free — no paid price
     * (`originalPrice` null/0 AND no pricing phase has `price > 0`). Undefined for
     * non-course kinds / when enrichment was skipped. No live/discounted pricing.
     */
    isFree?: boolean
    /**
     * CONTENT (lesson) hits only: mirrors `ContentEntity.isPremium`. Undefined for
     * non-content kinds / when enrichment was skipped.
     */
    isPremium?: boolean
}

/** Grouped autocomplete result buckets, one array per searchable entity kind. */
export interface GlobalSearchMessage {
    /** Course hits. */
    courses: Array<GlobalSearchItem>
    /** Module hits. */
    modules: Array<GlobalSearchItem>
    /** Challenge hits. */
    challenges: Array<GlobalSearchItem>
    /** Content hits. */
    contents: Array<GlobalSearchItem>
    /** Flashcard-deck hits. */
    flashcardDecks: Array<GlobalSearchItem>
    /** Milestone hits. */
    milestones: Array<GlobalSearchItem>
    /** Milestone-task hits. */
    milestoneTasks: Array<GlobalSearchItem>
    /** Foundation-item hits. */
    foundations: Array<GlobalSearchItem>
}
