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
    CommentCreated = "content.comment.created",
    CommentUpdated = "content.comment.updated",
    CommentDeleted = "content.comment.deleted",
    ContentReactionChanged = "content.reaction.changed",
    CommentReactionChanged = "content.comment.reaction.changed",
    NotificationCreated = "notification.created",
}
