/**
 * One raw row from the enrolled-course-id query
 * (`SELECT course_id FROM enrollments WHERE user_id = $1`). The set of these
 * rows is cached per user as a fast membership check.
 */
export interface EnrolledCourseIdRow {
    /** A course the user is enrolled in (raw `course_id` column). */
    course_id: string
}
