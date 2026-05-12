/**
 * Event names used by the backend.
 *
 * Scope: **job state only**.
 */
export enum EventName {
    JobStatusUpdated = "job.status.updated",
    MilestoneTaskProgressUpdated = "milestone.task.progress.updated",
    Ping = "ping",
    ChallengeSubmissionProgressUpdated = "challenge.submission.progress.updated",
}
