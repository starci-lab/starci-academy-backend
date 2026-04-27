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

export interface LessonVideoParentIndexCacheResult {
    /** The lesson video that the module belongs to. */
    lessonVideo: ParentIndexRef
    /** The content that the lesson video belongs to. */
    content: ParentIndexRef
    /** The module that the lesson video belongs to. */
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

export type ParentIndexCacheResult = ChallengeParentIndexCacheResult | ContentParentIndexCacheResult | LessonVideoParentIndexCacheResult | ModuleParentIndexCacheResult | CourseParentIndexCacheResult