/**
 * Payload emitted when a challenge submission grading completes,
 * signaling that the progress cache should be updated.
 */
export interface ChallengeSubmissionProgressUpdatedEventPayload {
    enrollmentId: string
}
