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

export interface ContentParentIndexCacheResult {
    /** The content that the module belongs to. */
    content: ParentIndexRef
    /** The module that the content belongs to. */
    module: ParentIndexRef
    /** The course that the module belongs to. */
    course: ParentIndexRef
}

export interface ModuleParentIndexCacheResult {
    /** The module that the course belongs to. */
    module: ParentIndexRef
    /** The course that the module belongs to. */
    course: ParentIndexRef
}

export interface CourseParentIndexCacheResult {
    /** The course that the course belongs to. */
    course: ParentIndexRef
}

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

export interface FlashcardDeckParentIndexCacheResult {
    /** The course that the deck belongs to (drives the deep-link course slug). */
    course: ParentIndexRef
}

export interface MilestoneTaskParentIndexCacheResult {
    /** The course that the task belongs to (drives the deep-link course slug). */
    course: ParentIndexRef
}

export type ParentIndexCacheResult =
    | ChallengeParentIndexCacheResult
    | ContentParentIndexCacheResult
    | ModuleParentIndexCacheResult
    | CourseParentIndexCacheResult
    | MilestoneParentIndexCacheResult
    | FlashcardDeckParentIndexCacheResult
    | MilestoneTaskParentIndexCacheResult
