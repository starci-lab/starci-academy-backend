/** Wire names the client emits — each member is what a gateway handler fires on. */
export enum PublicationEvent {
    /** Client sends a search query → gateway runs ES and replies on `GlobalSearch` subscription. */
    GlobalSearch = "autocomplete.global_search.publication",
    /** Client joins a job room → later `JobStatusUpdated` events reach this socket without polling. */
    SubscribeJobNotification = "job_notifications.subscribe_job_notification.publication",
    /** Client joins a content discussion room → comment / reaction subscription events start flowing. */
    SubscribeContentDiscussion = "content_discussion.subscribe.publication",
    /** Client joins its private bell room → `NotificationCreated` reaches this socket only. */
    SubscribeNotifications = "notifications.subscribe.publication",
    /** Client joins community feed rooms → post / comment / reaction subscription events start flowing. */
    SubscribeCommunityFeed = "community_feed.subscribe.publication",
    /** Client joins a conversation room → `ChatMessageCreated` starts flowing for that thread. */
    SubscribeCommunityChat = "community_chat.subscribe.publication",
    /** Learner starts a grounded lesson Q&A stream → token deltas arrive as `ContentAiChunk`. */
    AskContentAi = "content_ai.ask.publication",
    /** Learner cancels the in-flight content-AI stream → no further chunks; generation stops. */
    AbortContentAi = "content_ai.abort.publication",
    /** Client joins a RAG playground run room and consumes the one-shot registry entry → tokens stream as `RagPlaygroundRunChunk`. */
    SubscribeRagPlaygroundRun = "rag_playground.subscribe_run.publication",
    /** Client cancels the in-flight RAG run → stream stops and the abort controller is cleared. */
    AbortRagPlaygroundRun = "rag_playground.abort_run.publication",
    /** Candidate starts a mock-interview turn → interviewer tokens arrive as `MockInterviewChunk`. */
    AskMockInterviewTurn = "mock_interview.ask.publication",
    /** Candidate cancels the in-flight interview turn → no further chunks; generation stops. */
    AbortMockInterviewTurn = "mock_interview.abort.publication",
    // Playground BYOM — literal wire event names (NOT the dotted convention
    // above): the agent side is a plain socket.io-client CLI tool that must
    // match these names exactly, and the browser side mirrors them.
    /** Agent CLI submits a pairing code → ACK returns session state; browsers in the room get `agent:connected`. */
    PlaygroundAgentPair = "agent:pair",
    /** Browser joins a playground session room → receives live pairing state plus later relays / `step:verified`. */
    PlaygroundBrowserSubscribe = "browser:subscribe",
    /** Owner browser sends a shell command → relayed to the paired agent as `command:run` (RCE gate: owner only). */
    PlaygroundCommandRun = "command:run",
    /** Agent publishes stdout / stderr → relayed to observing browsers as `command:output`. */
    PlaygroundCommandOutput = "command:output",
    /** Agent publishes a resource snapshot → relayed to browsers and may pass the current step (`step:verified`). */
    PlaygroundResourcesReport = "resources:report",
    /** Browser pings the paired agent → relayed so the UI can measure round-trip latency. */
    PlaygroundAgentPing = "agent:ping",
    /** Agent echoes the ping timestamp → relayed so the browser can compute `Date.now() - t`. */
    PlaygroundAgentPong = "agent:pong",
    /** Owner browser asks to verify now → agent is told to push a fresh `resources:report` immediately. */
    PlaygroundVerifyNow = "verify:now",
}
