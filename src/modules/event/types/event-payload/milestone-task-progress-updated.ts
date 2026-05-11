import type {
    ProgressEnrollmentType,
} from "@modules/bussiness"

/**
 * Payload emitted when a milestone task grading completes,
 * signaling that the progress cache should be updated.
 */
export interface MilestoneTaskProgressUpdatedEventPayload extends ProgressEnrollmentType {
}
