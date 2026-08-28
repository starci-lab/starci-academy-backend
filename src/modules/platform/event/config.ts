import {
    EventName 
} from "./enums/event-name"
import {
    AiModelHealthUpdatedEventPayload 
} from "./types/event-payload/ai-model-health-updated"
import {
    ChallengeSubmissionProgressUpdatedEventPayload 
} from "./types/event-payload/challenge-submission-progress-updated"
import {
    ChatMessageChangedEventPayload,
    GlobalChatInvalidatedEventPayload,
} from "./types/event-payload/chat"
import {
    CommunityPostChangedEventPayload,
    CommunityCommentChangedEventPayload,
    CommunityPostReactionChangedEventPayload,
    CommunityCommentReactionChangedEventPayload,
} from "./types/event-payload/community"
import {
    CommentChangedEventPayload,
    ContentReactionChangedEventPayload,
    CommentReactionChangedEventPayload,
} from "./types/event-payload/content-discussion"
import {
    JobStatusUpdatedEventPayload 
} from "./types/event-payload/job-status-updated"
import {
    MilestoneTaskProgressUpdatedEventPayload 
} from "./types/event-payload/milestone-task-progress-updated"
import {
    NotificationCreatedEventPayload 
} from "./types/event-payload/notification"
import {
    PingEventPayload 
} from "./types/event-payload/ping"

/** Map of event names to NATS/local usage and payload type. */
export const configMap = {
    /** Event name: job status updated. */
    [EventName.JobStatusUpdated]: {
        // The publishing pod owns the learner's live socket most of the time,
        // so it must fan out locally. NATS carries the same event to other pods;
        // the bridge filters the producer instance and therefore does not
        // duplicate this local publication.
        useNats: true,
        useLocal: true,
        eventPayload: {
        } as JobStatusUpdatedEventPayload,
    },
    /** Event name: milestone task progress updated. */
    [EventName.MilestoneTaskProgressUpdated]: {
        useNats: true,
        useLocal: true,
        eventPayload: {
        } as MilestoneTaskProgressUpdatedEventPayload,
    },
    [EventName.Ping]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as PingEventPayload,
    },
    // Per-model latency probe snapshots fan out to the local Socket.IO gateway
    // in-process; useNats stays true so every pod re-broadcasts to its own
    // connected clients (status page is multi-instance safe).
    /** Event name: a per-model latency probe cycle completed (full snapshot). */
    [EventName.AiModelHealthUpdated]: {
        useNats: true,
        useLocal: true,
        eventPayload: {
        } as AiModelHealthUpdatedEventPayload,
    },
    /** Event name: challenge submission progress updated. */
    [EventName.ChallengeSubmissionProgressUpdated]: {
        useNats: true,
        useLocal: true,
        eventPayload: {
        } as ChallengeSubmissionProgressUpdatedEventPayload,
    },
    // Discussion events are fanned out to the local Socket.IO gateway in-process.
    // useNats stays false for now (single-instance realtime); flip to true once a NATS
    // bridge re-emits these locally on every pod for multi-instance delivery.
    /** Event name: a content comment was created. */
    [EventName.CommentCreated]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommentChangedEventPayload,
    },
    /** Event name: a content comment was edited. */
    [EventName.CommentUpdated]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommentChangedEventPayload,
    },
    /** Event name: a content comment was soft-deleted. */
    [EventName.CommentDeleted]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommentChangedEventPayload,
    },
    /** Event name: aggregate reactions on a content changed. */
    [EventName.ContentReactionChanged]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as ContentReactionChangedEventPayload,
    },
    /** Event name: aggregate reactions on a comment changed. */
    [EventName.CommentReactionChanged]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommentReactionChangedEventPayload,
    },
    // A notification is fanned out to the local Socket.IO gateway in-process so the
    // recipient's bell updates in real time. useNats stays false for now (single-instance
    // realtime); flip to true once a NATS bridge re-emits locally on every pod.
    /** Event name: a notification was created for a single recipient. */
    [EventName.NotificationCreated]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as NotificationCreatedEventPayload,
    },
    // Community events are fanned out to the local Socket.IO gateway in-process.
    // useNats stays false for now (single-instance realtime); flip to true once a
    // NATS bridge re-emits these locally on every pod for multi-instance delivery.
    /** Event name: a community post was created. */
    [EventName.CommunityPostCreated]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommunityPostChangedEventPayload,
    },
    /** Event name: a community post was edited. */
    [EventName.CommunityPostUpdated]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommunityPostChangedEventPayload,
    },
    /** Event name: a community post was soft-deleted. */
    [EventName.CommunityPostDeleted]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommunityPostChangedEventPayload,
    },
    /** Event name: a community post comment was created. */
    [EventName.CommunityCommentCreated]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommunityCommentChangedEventPayload,
    },
    /** Event name: a community post comment was edited. */
    [EventName.CommunityCommentUpdated]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommunityCommentChangedEventPayload,
    },
    /** Event name: a community post comment was soft-deleted. */
    [EventName.CommunityCommentDeleted]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommunityCommentChangedEventPayload,
    },
    /** Event name: aggregate reactions on a community post changed. */
    [EventName.CommunityPostReactionChanged]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommunityPostReactionChangedEventPayload,
    },
    /** Event name: aggregate reactions on a community post comment changed. */
    [EventName.CommunityCommentReactionChanged]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as CommunityCommentReactionChangedEventPayload,
    },
    /** Event name: a chat message was created in a conversation. */
    [EventName.ChatMessageCreated]: {
    // Every pod owns different Socket.IO clients. Publish through NATS as
    // well as locally so a write on pod A reaches a room connected to pod B.
        useNats: true,
        useLocal: true,
        eventPayload: {
        } as ChatMessageChangedEventPayload,
    },
    /** Event name: a durable Global Chat command invalidated actor projections. */
    [EventName.GlobalChatInvalidated]: {
    // One pod leases each outbox row; NATS fans the compact invalidation out
    // to Socket.IO clients connected to every other pod.
        useNats: true,
        useLocal: true,
        eventPayload: {
        } as GlobalChatInvalidatedEventPayload,
    },
}
