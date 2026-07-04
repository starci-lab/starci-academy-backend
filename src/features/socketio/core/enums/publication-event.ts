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
}