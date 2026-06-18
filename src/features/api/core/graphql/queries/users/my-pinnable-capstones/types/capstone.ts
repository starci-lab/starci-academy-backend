/**
 * Raw row shape returned by the pinnable-capstones LEFT JOIN query.
 *
 * Wire-format DB row — column aliases come back exactly as named in the SQL
 * `SELECT`, so they stay in the casing the query emits. The `is_verified`
 * predicate is computed in SQL (`tasks_completed_at IS NOT NULL`) and Postgres
 * returns a real boolean for it.
 */
export interface PinnableCapstoneRow {
    /** Enrollment primary-key id (`enrollments.id`). */
    enrollment_id: string
    /** Linked course title (`courses.title`); null when the course row is missing. */
    course_title: string | null
    /** User-submitted personal-project GitHub URL (`enrollments.personal_project_github_url`). */
    github_url: string | null
    /** Whether the enrollment's task plan is complete (`tasks_completed_at IS NOT NULL`). */
    is_verified: boolean
}
