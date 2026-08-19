import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import type {
    ParentIndexCacheResult,
    ParentIndexRef,
} from "@modules/integrations/cache/types/cache-results/parent-index"

/** Params for {@link buildEntityRoute}. */
export interface BuildEntityRouteParams {
    /** Entity class name (the index namespace, e.g. "ContentEntity"). */
    entityName: string
    /** Primary key (UUID) of the entity itself. */
    id: string
    /** Ancestor chain from the parent-index cache, or null/undefined on a miss. */
    parentRef?: ParentIndexCacheResult | null
}

/** A course links to its own public page (slug = course displayId). */
const buildCourseRoute = (
    course: ParentIndexRef | undefined,
): string | null => (course ? `/courses/${course.displayId}` : null)

/**
 * A module needs the owning course slug; the module segment uses its UUID
 * (route is /learn/content/modules/<id> -- the "content" segment is required).
 */
const buildModuleRoute = (
    course: ParentIndexRef | undefined,
    id: string,
): string | null => (course
    ? `/courses/${course.displayId}/learn/content/modules/${id}`
    : null)

/** A content needs course slug + module UUID. */
const buildContentRoute = (
    parentRef: ParentIndexCacheResult | null | undefined,
    course: ParentIndexRef | undefined,
    id: string,
): string | null => {
    const module = parentRef && "module" in parentRef ? parentRef.module : undefined
    return course && module
        ? `/courses/${course.displayId}/learn/content/modules/${module.id}/contents/${id}`
        : null
}

/** A challenge deep-links to its own solve page (.../challenges/<id>). */
const buildChallengeRoute = (
    parentRef: ParentIndexCacheResult | null | undefined,
    course: ParentIndexRef | undefined,
    id: string,
): string | null => {
    const module = parentRef && "module" in parentRef ? parentRef.module : undefined
    const content = parentRef && "content" in parentRef ? parentRef.content : undefined
    return course && module && content
        ? `/courses/${course.displayId}/learn/content/modules/${module.id}/contents/${content.id}/challenges/${id}`
        : null
}

/** A milestone has no page -> deep-link to its first task, else the project root. */
const buildMilestoneRoute = (
    parentRef: ParentIndexCacheResult | null | undefined,
    course: ParentIndexRef | undefined,
): string | null => {
    if (!course) {
        return null
    }
    const task = parentRef && "task" in parentRef ? parentRef.task : undefined
    return task
        ? `/courses/${course.displayId}/learn/personal-project/tasks/${task.id}`
        : `/courses/${course.displayId}/learn/personal-project`
}

/** A task deep-links to its own personal-project page (task id = the entity id). */
const buildMilestoneTaskRoute = (
    course: ParentIndexRef | undefined,
    id: string,
): string | null => (course
    ? `/courses/${course.displayId}/learn/personal-project/tasks/${id}`
    : null)

/** A deck lives on the course-level flashcards tab (needs only the course slug). */
const buildFlashcardDeckRoute = (
    course: ParentIndexRef | undefined,
): string | null => (course ? `/courses/${course.displayId}/learn/flashcards` : null)

/**
 * Single source of truth for "entity -> canonical route". Builds a
 * **locale-agnostic** path (caller prepends `/{locale}`) from an entity's class
 * name + id + cached ancestor chain. Server-side port of the old client
 * `buildHref`, so global search and the route resolver agree byte-for-byte.
 *
 * Returns `null` when the ancestors needed for that kind are missing (cache
 * miss / deleted) -- the caller then renders a non-link.
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
    case CourseEntity.name:
        return buildCourseRoute(course)
    case ModuleEntity.name:
        return buildModuleRoute(course,
            id)
    case ContentEntity.name:
        return buildContentRoute(parentRef,
            course,
            id)
    case ChallengeEntity.name:
        return buildChallengeRoute(parentRef,
            course,
            id)
    case MilestoneEntity.name:
        return buildMilestoneRoute(parentRef,
            course)
    case MilestoneTaskEntity.name:
        return buildMilestoneTaskRoute(course,
            id)
    case FlashcardDeckEntity.name:
        return buildFlashcardDeckRoute(course)
    default:
        return null
    }
}
