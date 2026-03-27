export interface EnrollPayload {
    /** The ID of the job. */
    jobId: string
    /** The ID of the course to enroll in. */
    courseId: string
    /** The ID of the user to enroll. */
    userId: string
}