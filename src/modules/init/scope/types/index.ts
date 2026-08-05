import type {
    CourseIndexFilterByDisplayId,
} from "../../types"

/**
 * A synchronizer sink -- scoped independently:
 *
 * - `cdn` -- CDN (S3/MinIO JSON object) materialization.
 * - `elasticsearch` -- Elasticsearch index population.
 * - `repo` -- repo code sync (Sandpack file trees -> CDN).
 */
export type SynchronizerSink = "cdn" | "elasticsearch" | "repo"

/**
 * Resolved course seed scope (built from `seed.yaml` seeders `courses.tracks`).
 *
 * Each map: `null` = unrestricted (all order indexes); `Set()` = disabled;
 * `Set(n...)` = allow-list. A `displayId` absent from the map is excluded.
 */
export interface CourseSeedScope {
    /** Module display-id filter map (`null` = unrestricted). */
    moduleIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
    /** Milestone display-id filter map (`null` = unrestricted). */
    milestoneIndexFilterByDisplayId: CourseIndexFilterByDisplayId | null
}
