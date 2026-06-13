/** Socket.IO publication event names. */
export enum PublicationEvent {
    GlobalSearch = "autocomplete.global_search.publication",
    SubscribeJobNotification = "job_notifications.subscribe_job_notification.publication",
    SubscribeContentDiscussion = "content_discussion.subscribe.publication",
    SubscribeAiLabRun = "ai_lab.subscribe_run.publication",
    AbortAiLabRun = "ai_lab.abort_run.publication",
}