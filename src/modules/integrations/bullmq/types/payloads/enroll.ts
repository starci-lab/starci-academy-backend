/**
 * BullMQ body for a post-payment enroll job. `transactionId` ties the grant to
 * the paid row so a retry cannot double-enroll or orphan a successful charge.
 */
export interface EnrollPayload {
    /** The ID of the course to enroll in. */
    courseId: string
    /** The ID of the user to enroll. */
    userId: string
    /** The ID of the transaction. */
    transactionId: string
}