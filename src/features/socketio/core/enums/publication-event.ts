/** Socket.IO publication event names. */
export enum PublicationEvent {
    GlobalSearch = "autocomplete.global_search.publication",
    SubscribeJobNotification = "job_notifications.subscribe_job_notification.publication",
    SubscribeContentDiscussion = "content_discussion.subscribe.publication",
    SubscribeAiLabRun = "ai_lab.subscribe_run.publication",
    AbortAiLabRun = "ai_lab.abort_run.publication",
    SubscribeNotifications = "notifications.subscribe.publication",
    SubscribeCommunityFeed = "community_feed.subscribe.publication",
    SubscribeCommunityChat = "community_chat.subscribe.publication",
    AskContentAi = "content_ai.ask.publication",
    AbortContentAi = "content_ai.abort.publication",
    SubscribeRagPlaygroundRun = "rag_playground.subscribe_run.publication",
    AbortRagPlaygroundRun = "rag_playground.abort_run.publication",
    AskMockInterviewTurn = "mock_interview.ask.publication",
    AbortMockInterviewTurn = "mock_interview.abort.publication",
    // Playground BYOM — literal wire event names (NOT the dotted convention
    // above): the agent side is a plain socket.io-client CLI tool that must
    // match these names exactly, and the browser side mirrors them.
    PlaygroundAgentPair = "agent:pair",
    PlaygroundBrowserSubscribe = "browser:subscribe",
    PlaygroundCommandRun = "command:run",
    PlaygroundCommandOutput = "command:output",
    PlaygroundResourcesReport = "resources:report",
    PlaygroundAgentPing = "agent:ping",
    PlaygroundAgentPong = "agent:pong",
}