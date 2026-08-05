/**
 * Consumer subscribed -- subjects listed so a silent bridge can be distinguished from a
 * hung one.
 */
export interface NatsConsumerOpenedMessage {
    subjects: Array<string>
}

/**
 * Consumer stopped (with uptime) -- after this, cross-pod events on those subjects no
 * longer arrive.
 */
export interface NatsConsumerClosedMessage {
    subjects: Array<string>
    durationMs: number | null
}

/**
 * Consumer threw -- subjects + error so the bridge can be restarted before events pile up
 * undelivered.
 */
export interface NatsConsumerErrorMessage {
    subjects: Array<string>
    error: string
    stack?: string
}

