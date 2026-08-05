/**
 * Minimal parent pointer (uuid + slug). Kept tiny so parent-index cache stays
 * cheap to prime — do not hang titles/bodies here or every indexer rebuild balloons.
 */
export interface ParentIndexRef {
    id: string
    displayId: string
}

/**
 * Cached parent graph for an entity (challenge/content).
 * This shape is deliberately small: only IDs + display IDs.
 */
export interface ChallengeParentIndexCacheResult {
    /** The challenge that the content belongs to. */
    challenge: ParentIndexRef
    /** The content that the challenge belongs to. */
    content: ParentIndexRef
    /** The module that the content belongs to. */
    module: ParentIndexRef
    /** The course that the module belongs to. */
    course: ParentIndexRef
}

/**
 * Parent chain for a content (lesson/etc.): content → module → course.
 * Used to deep-link a content hit without joining the live catalog.
 */
export interface ContentParentIndexCacheResult {
    /** The content that the module belongs to. */
    content: ParentIndexRef
    /** The module that the content belongs to. */
    module: ParentIndexRef
    /** The course that the module belongs to. */
    course: ParentIndexRef
}

/**
 * Parent chain for a module: module → course.
 * A module hit with no course ref cannot build a course-scoped URL.
 */
export interface ModuleParentIndexCacheResult {
    /** The module that the course belongs to. */
    module: ParentIndexRef
    /** The course that the module belongs to. */
    course: ParentIndexRef
}

/**
 * Parent chain for a course (self). Exists so course hits share the same cache
 * shape as nested entities instead of a special-case empty object.
 */
export interface CourseParentIndexCacheResult {
    /** The course that the course belongs to. */
    course: ParentIndexRef
}

/**
 * Parent chain for a milestone: course + optional first task.
 * Milestones have no page — missing `task` lands the client on the project root.
 */
export interface MilestoneParentIndexCacheResult {
    /** The course that the milestone belongs to (drives the deep-link course slug). */
    course: ParentIndexRef
    /**
     * The milestone's first task (lowest sort order), when it has any. Milestones have no
     * standalone page, so a milestone hit deep-links to this task's personal-project page;
     * absent when the milestone has no tasks (the client then lands on the project root).
     */
    task?: ParentIndexRef
}

/**
 * Parent chain for a flashcard deck: course only.
 * Drives the deep-link course slug; a miss leaves the deck unroutable from search.
 */
export interface FlashcardDeckParentIndexCacheResult {
    /** The course that the deck belongs to (drives the deep-link course slug). */
    course: ParentIndexRef
}

/**
 * Parent chain for a milestone task: course only.
 * Same deep-link slug rule as decks — no course ref means the task hit is dead.
 */
export interface MilestoneTaskParentIndexCacheResult {
    /** The course that the task belongs to (drives the deep-link course slug). */
    course: ParentIndexRef
}

/**
 * Discriminated-by-shape union of parent-index cache hits. Callers must switch
 * on which chain they have — treating a milestone hit as a challenge chain
 * invents missing parents.
 */
export type ParentIndexCacheResult =
    | ChallengeParentIndexCacheResult
    | ContentParentIndexCacheResult
    | ModuleParentIndexCacheResult
    | CourseParentIndexCacheResult
    | MilestoneParentIndexCacheResult
    | FlashcardDeckParentIndexCacheResult
    | MilestoneTaskParentIndexCacheResult
