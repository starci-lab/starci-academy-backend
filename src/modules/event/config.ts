import {
    EventName,
} from "./enums"
import {
    JobStatusUpdatedEventPayload,
    PingEventPayload,
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
    /** Event name: ping. */
    [EventName.Ping]: {
        useNats: false,
        useLocal: true,
        eventPayload: {
        } as PingEventPayload,
    },
}
