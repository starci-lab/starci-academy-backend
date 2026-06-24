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
    CommunityPostCreated = "community.post.created",
    CommunityPostUpdated = "community.post.updated",
    CommunityPostDeleted = "community.post.deleted",
    CommunityCommentCreated = "community.post.comment.created",
    CommunityCommentUpdated = "community.post.comment.updated",
    CommunityCommentDeleted = "community.post.comment.deleted",
    CommunityPostReactionChanged = "community.post.reaction.changed",
    CommunityCommentReactionChanged = "community.post.comment.reaction.changed",
    ChatMessageCreated = "community.chat.message.created",
}
