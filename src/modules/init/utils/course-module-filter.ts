import type {
    CourseIndexFilterByDisplayId,
} from "../types"

/**
 * Whether a module/milestone should be included for the given course.
 *
 * Map value: `null` = all order indexes; `Set(n...)` = allow-list only
 * (e.g. `0,1` -> folders `0-*`, `1-*`); `Set()` = disabled.
 * Unknown `courseDisplayId` -> exclude (avoids seeding every index when the
 * displayId is not declared in `seed.yaml`).
 */
const shouldIncludeByOrderIndex = (
    filter: CourseIndexFilterByDisplayId | null,
    courseDisplayId: string,
    orderIndex: number,
): boolean => {
    if (!filter) {
        return true
    }
    const allowed = filter.get(courseDisplayId)
    if (allowed === undefined) {
        return false
    }
    if (allowed === null) {
        return true
    }
    if (allowed.size === 0) {
        return false
    }
    return allowed.has(orderIndex)
}

/**
 * Whether a module should be seeded/synced for the given course.
 */
export const shouldIncludeCourseModule = (
    filter: CourseIndexFilterByDisplayId | null,
    courseDisplayId: string,
    moduleOrderIndex: number,
): boolean => shouldIncludeByOrderIndex(
    filter,
    courseDisplayId,
    moduleOrderIndex,
)

/**
 * Whether a milestone should be seeded/synced for the given course.
 */
export const shouldIncludeCourseMilestone = (
    filter: CourseIndexFilterByDisplayId | null,
    courseDisplayId: string,
    milestoneOrderIndex: number,
): boolean => shouldIncludeByOrderIndex(
    filter,
    courseDisplayId,
    milestoneOrderIndex,
)
