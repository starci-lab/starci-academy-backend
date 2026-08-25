/**
 * Event names used by the backend.
 *
 * Scope: **job state only**.
 */
export enum EventName {
  /** Job-notifications gateway pushes status so subscribed clients refresh progress without polling. */
  JobStatusUpdated = "job.status.updated",
  /** Personal-project listeners refresh milestone-task progress UI for the enrollment. */
  MilestoneTaskProgressUpdated = "milestone.task.progress.updated",
  /** NATS/local heartbeat -- subscribers treat it as liveness, not business data. */
  Ping = "ping",
  /** System-health gateway broadcasts the latency snapshot to status-page sockets. */
  AiModelHealthUpdated = "ai.model.health.updated",
  /** Challenge-progress subscription listeners refresh the in-flight submission stepper. */
  ChallengeSubmissionProgressUpdated = "challenge.submission.progress.updated",
  /** Content-discussion gateway inserts the new comment into live thread rooms. */
  CommentCreated = "content.comment.created",
  /** Content-discussion gateway patches the edited comment in live thread rooms. */
  CommentUpdated = "content.comment.updated",
  /** Content-discussion gateway removes the soft-deleted comment from live thread rooms. */
  CommentDeleted = "content.comment.deleted",
  /** Discussion gateway refreshes aggregate reaction counts on the content. */
  ContentReactionChanged = "content.reaction.changed",
  /** Discussion gateway refreshes aggregate reaction counts on the comment. */
  CommentReactionChanged = "content.comment.reaction.changed",
  /** Notifications gateway delivers the bell item to the recipient's socket. */
  NotificationCreated = "notification.created",
  /** Community-feed gateway prepends the post into subscribed channel/all rooms. */
  CommunityPostCreated = "community.post.created",
  /** Community-feed gateway patches the edited post in subscribed rooms. */
  CommunityPostUpdated = "community.post.updated",
  /** Community-feed gateway drops the soft-deleted post from subscribed rooms. */
  CommunityPostDeleted = "community.post.deleted",
  /** Community-feed gateway inserts the comment into the post's room. */
  CommunityCommentCreated = "community.post.comment.created",
  /** Community-feed gateway patches the edited comment in the post's room. */
  CommunityCommentUpdated = "community.post.comment.updated",
  /** Community-feed gateway removes the soft-deleted comment from the post's room. */
  CommunityCommentDeleted = "community.post.comment.deleted",
  /** Community-feed gateway refreshes reaction totals on the post. */
  CommunityPostReactionChanged = "community.post.reaction.changed",
  /** Community-feed gateway refreshes reaction totals on the community comment. */
  CommunityCommentReactionChanged = "community.post.comment.reaction.changed",
  /** Community-chat gateway delivers the message to conversation members. */
  ChatMessageCreated = "community.chat.message.created",
  /** Durable outbox publisher tells authorized clients to refetch actor-specific Global Chat state. */
  GlobalChatInvalidated = "community.chat.global.invalidated",
}
