/** Message for when a user is enrolled into a course. */
export interface EnrollmentCreatedMessage {
    userId: string
    courseId: string
}

/** Message for when enrollment already exists (duplicate job or repeated request). */
export interface EnrollmentAlreadyExistsMessage {
    userId: string
    courseId: string
}

/** Message for when an enroll step is executed in the worker pipeline. */
export interface EnrollStepExecutedMessage {
    jobId: string
    userId: string
    courseId: string
}
