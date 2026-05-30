import type {
    CourseIndexFilterByDisplayId,
} from "../../../../types"

/** Course seed filters from envConfig().init seeders `courses`. */
export interface CourseSeedScope {
    /**
     * Module display-id filter map, or `null` when no env map is set (unrestricted).
     */
    moduleIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    /**
     * Milestone display-id filter map, or `null` when no env map is set (unrestricted).
     */
    milestoneIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
}
