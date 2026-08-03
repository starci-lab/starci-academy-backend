export interface EnrollPayload {
    /** The ID of the course to enroll in. */
    courseId: string
    /** The ID of the user to enroll. */
    userId: string
    /** The ID of the transaction. */
    transactionId: string
}