import type {
    CourseIndexFilterByDisplayId,
} from "../../types"

/**
 * Resolved course seed scope (built from `seed.yaml` seeders `courses.tracks`).
 *
 * Each map: `null` = unrestricted (all order indexes); `Set()` = disabled;
 * `Set(n…)` = allow-list. A `displayId` absent from the map is excluded.
 */
export interface CourseSeedScope {
    /** Module display-id filter map (`null` = unrestricted). */
    moduleIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    /** Milestone display-id filter map (`null` = unrestricted). */
    milestoneIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
}
