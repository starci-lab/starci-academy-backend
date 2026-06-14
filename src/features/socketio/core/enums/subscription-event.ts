/** Socket.IO subscription event names. */
export enum SubscriptionEvent {
    GlobalSearch = "autocomplete.global_search.subscription",
    JobStatusUpdated = "job_notifications.job_status_updated.subscription",
    CommentCreated = "content_discussion.comment_created.subscription",
    CommentUpdated = "content_discussion.comment_updated.subscription",
    CommentDeleted = "content_discussion.comment_deleted.subscription",
    ContentReactionChanged = "content_discussion.content_reaction_changed.subscription",
    CommentReactionChanged = "content_discussion.comment_reaction_changed.subscription",
    AiLabRunChunk = "ai_lab.run_chunk.subscription",
    NotificationCreated = "notifications.notification_created.subscription",
}
