import {
    EventName,
} from "./enums"
import {
    JobStatusUpdatedEventPayload,
    MilestoneTaskProgressUpdatedEventPayload,
    PingEventPayload,
    ChallengeSubmissionProgressUpdatedEventPayload,
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
}
