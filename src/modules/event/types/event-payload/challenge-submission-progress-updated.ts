import type {
    ProgressEnrollmentType,
} from "@modules/bussiness"

/**
 * Payload emitted when a challenge submission grading completes,
 * signaling that the progress cache should be updated.
 */
export interface ChallengeSubmissionProgressUpdatedEventPayload extends ProgressEnrollmentType {
}
