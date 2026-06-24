import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    FlashcardDeckEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    ModuleEntity,
} from "@modules/databases"
import type {
    ParentIndexCacheResult,
} from "@modules/cache"

/** Params for {@link buildEntityRoute}. */
export interface BuildEntityRouteParams {
    /** Entity class name (the index namespace, e.g. "ContentEntity"). */
    entityName: string
    /** Primary key (UUID) of the entity itself. */
    id: string
    /** Ancestor chain from the parent-index cache, or null/undefined on a miss. */
    parentRef?: ParentIndexCacheResult | null
}

/**
 * Single source of truth for "entity → canonical route". Builds a
 * **locale-agnostic** path (caller prepends `/{locale}`) from an entity's class
 * name + id + cached ancestor chain. Server-side port of the old client
 * `buildHref`, so global search and the route resolver agree byte-for-byte.
 *
 * Returns `null` when the ancestors needed for that kind are missing (cache
 * miss / deleted) — the caller then renders a non-link.
 *
 * @param params - See {@link BuildEntityRouteParams}.
 * @returns The locale-agnostic path, or `null` when it cannot be built.
 */
export const buildEntityRoute = (
    {
        entityName,
        id,
        parentRef,
    }: BuildEntityRouteParams,
): string | null => {
    // every routable kind hangs off a course slug; pull it once
    const course = parentRef && "course" in parentRef ? parentRef.course : undefined

    switch (entityName) {
    // a course links to its own public page (slug = course displayId)
    case CourseEntity.name:
        return course ? `/courses/${course.displayId}` : null

    // a module needs the owning course slug; the module segment uses its UUID
    // (route is /learn/content/modules/<id> — the "content" segment is required)
    case ModuleEntity.name:
        return course ? `/courses/${course.displayId}/learn/content/modules/${id}` : null

    // a content needs course slug + module UUID
    case ContentEntity.name: {
        const module = parentRef && "module" in parentRef ? parentRef.module : undefined
        return course && module
            ? `/courses/${course.displayId}/learn/content/modules/${module.id}/contents/${id}`
            : null
    }

    // a challenge deep-links to its own solve page (.../challenges/<id>)
    case ChallengeEntity.name: {
        const module = parentRef && "module" in parentRef ? parentRef.module : undefined
        const content = parentRef && "content" in parentRef ? parentRef.content : undefined
        return course && module && content
            ? `/courses/${course.displayId}/learn/content/modules/${module.id}/contents/${content.id}/challenges/${id}`
            : null
    }

    // a milestone has no page → deep-link to its first task, else the project root
    case MilestoneEntity.name: {
        if (!course) {
            return null
        }
        const task = parentRef && "task" in parentRef ? parentRef.task : undefined
        return task
            ? `/courses/${course.displayId}/learn/personal-project/tasks/${task.id}`
            : `/courses/${course.displayId}/learn/personal-project`
    }

    // a task deep-links to its own personal-project page (task id = the entity id)
    case MilestoneTaskEntity.name:
        return course ? `/courses/${course.displayId}/learn/personal-project/tasks/${id}` : null

    // a deck lives on the course-level flashcards tab (needs only the course slug)
    case FlashcardDeckEntity.name:
        return course ? `/courses/${course.displayId}/learn/flashcards` : null

    default:
        return null
    }
}
