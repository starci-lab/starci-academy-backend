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
    CommunityPostCreated = "community_feed.post_created.subscription",
    CommunityPostUpdated = "community_feed.post_updated.subscription",
    CommunityPostDeleted = "community_feed.post_deleted.subscription",
    CommunityCommentCreated = "community_feed.comment_created.subscription",
    CommunityCommentUpdated = "community_feed.comment_updated.subscription",
    CommunityCommentDeleted = "community_feed.comment_deleted.subscription",
    CommunityPostReactionChanged = "community_feed.post_reaction_changed.subscription",
    CommunityCommentReactionChanged = "community_feed.comment_reaction_changed.subscription",
    ChatMessageCreated = "community_chat.message_created.subscription",
    ContentAiChunk = "content_ai.chunk.subscription",
    AiModelHealth = "system_health.ai_model_health.subscription",
    RagPlaygroundRunChunk = "rag_playground.run_chunk.subscription",
    MockInterviewChunk = "mock_interview.chunk.subscription",
    // Playground BYOM — literal wire event names, see PublicationEvent above.
    // `PlaygroundCommandRun` (server → agent) reuses the SAME literal name as
    // the publication event since it is a pure relay.
    PlaygroundCommandRun = "command:run",
    PlaygroundCommandOutput = "command:output",
    PlaygroundResourcesReport = "resources:report",
    PlaygroundAgentPing = "agent:ping",
    PlaygroundAgentPong = "agent:pong",
    PlaygroundStepVerified = "step:verified",
    // server → browser: the learner's local CLI agent paired / dropped, so the
    // UI can gate steps behind a real connection instead of guessing.
    PlaygroundAgentConnected = "agent:connected",
    PlaygroundAgentDisconnected = "agent:disconnected",
    // server → agent: the browser asked to verify the current step now → the agent
    // pushes a fresh `resources:report` immediately.
    PlaygroundVerifyNow = "verify:now",
}
