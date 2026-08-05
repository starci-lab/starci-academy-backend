/** Wire names the server emits -- each member is what a subscribed client does with the payload. */
export enum SubscriptionEvent {
    /** Autocomplete hits arrived -> client renders the suggestion list. */
    GlobalSearch = "autocomplete.global_search.subscription",
    /** Job progress / status changed -> client refreshes the job stepper / toast without polling. */
    JobStatusUpdated = "job_notifications.job_status_updated.subscription",
    /** New discussion comment -> client inserts it into the live thread. */
    CommentCreated = "content_discussion.comment_created.subscription",
    /** Discussion comment edited -> client patches that comment in the thread. */
    CommentUpdated = "content_discussion.comment_updated.subscription",
    /** Discussion comment removed -> client drops it from the thread. */
    CommentDeleted = "content_discussion.comment_deleted.subscription",
    /** Content-level reaction totals changed -> client refreshes the content reaction bar. */
    ContentReactionChanged = "content_discussion.content_reaction_changed.subscription",
    /** Comment-level reaction totals changed -> client refreshes that comment's reaction counts. */
    CommentReactionChanged = "content_discussion.comment_reaction_changed.subscription",
    /** New in-app notification -> client prepends the bell inbox / increments the badge. */
    NotificationCreated = "notifications.notification_created.subscription",
    /** New community post -> client prepends it into subscribed feed rooms. */
    CommunityPostCreated = "community_feed.post_created.subscription",
    /** Community post edited -> client patches that post in the feed. */
    CommunityPostUpdated = "community_feed.post_updated.subscription",
    /** Community post removed -> client drops it from the feed. */
    CommunityPostDeleted = "community_feed.post_deleted.subscription",
    /** New comment on a community post -> client inserts it into that post's thread. */
    CommunityCommentCreated = "community_feed.comment_created.subscription",
    /** Community comment edited -> client patches it in the post's thread. */
    CommunityCommentUpdated = "community_feed.comment_updated.subscription",
    /** Community comment removed -> client drops it from the post's thread. */
    CommunityCommentDeleted = "community_feed.comment_deleted.subscription",
    /** Post reaction totals changed -> client refreshes the post reaction bar. */
    CommunityPostReactionChanged = "community_feed.post_reaction_changed.subscription",
    /** Community-comment reaction totals changed -> client refreshes that comment's counts. */
    CommunityCommentReactionChanged = "community_feed.comment_reaction_changed.subscription",
    /** New chat message -> client appends it to the conversation (refetch-on-event). */
    ChatMessageCreated = "community_chat.message_created.subscription",
    /** Content-AI token delta -> client appends to the streaming answer. */
    ContentAiChunk = "content_ai.chunk.subscription",
    /** AI model latency snapshot -> public status page refreshes up / down / latency without polling. */
    AiModelHealth = "system_health.ai_model_health.subscription",
    /** RAG playground token delta -> marketing demo appends to the run output. */
    RagPlaygroundRunChunk = "rag_playground.run_chunk.subscription",
    /** Mock-interview token delta -> client appends to the interviewer reply. */
    MockInterviewChunk = "mock_interview.chunk.subscription",
    // Playground BYOM -- literal wire event names, see PublicationEvent above.
    // `PlaygroundCommandRun` (server -> agent) reuses the SAME literal name as
    // the publication event since it is a pure relay.
    /** Relayed shell command -> paired agent executes it locally. */
    PlaygroundCommandRun = "command:run",
    /** Relayed stdout / stderr -> browser appends to the terminal panel. */
    PlaygroundCommandOutput = "command:output",
    /** Relayed resource snapshot -> browser refreshes the resource panel (and may await `step:verified`). */
    PlaygroundResourcesReport = "resources:report",
    /** Relayed ping -> agent echoes a pong with the same timestamp. */
    PlaygroundAgentPing = "agent:ping",
    /** Relayed pong -> browser computes round-trip latency from the echoed timestamp. */
    PlaygroundAgentPong = "agent:pong",
    /** Current playground step passed -> browser unlocks the next step / shows pass. */
    PlaygroundStepVerified = "step:verified",
    // server -> browser: the learner's local CLI agent paired / dropped, so the
    // UI can gate steps behind a real connection instead of guessing.
    /** Agent paired (or already connected on subscribe) -> browser lifts the install / connect gate. */
    PlaygroundAgentConnected = "agent:connected",
    /** Agent dropped or not yet paired -> browser re-gates steps that need a live machine. */
    PlaygroundAgentDisconnected = "agent:disconnected",
    // server -> agent: the browser asked to verify the current step now -> the agent
    // pushes a fresh `resources:report` immediately.
    /** Relayed verify-now -> agent immediately pushes a fresh `resources:report`. */
    PlaygroundVerifyNow = "verify:now",
}
