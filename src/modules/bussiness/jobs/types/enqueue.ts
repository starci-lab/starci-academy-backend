/** Params for enqueuing an enroll job. */
export interface EnqueueEnrollJobParams {
    /** The ID of the transaction. */
    transactionId: string
    /** The ID of the user to enroll. */
    userId: string
    /** The ID of the course to enroll in. */
    courseId: string
    /** The ID of the job to requeue. */
    jobId?: string
}