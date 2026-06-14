import {
    EventName,
} from "./enums"
import {
    JobStatusUpdatedEventPayload,
    MilestoneTaskProgressUpdatedEventPayload,
    PingEventPayload,
    ChallengeSubmissionProgressUpdatedEventPayload,
    CommentChangedEventPayload,
    ContentReactionChangedEventPayload,
    CommentReactionChangedEventPayload,
    NotificationCreatedEventPayload,
} from "./types"

/** Map of event names to NATS/local usage and payload type. */
export const configMap = {
    /** Event name: job status updated. */
    [EventName.JobStatusUpdated]: {
        useNats: true,
        useLocal: false,
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
}
