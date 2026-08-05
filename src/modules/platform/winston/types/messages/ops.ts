/** Structured ops breadcrumb shared by several `WinstonLog` members. */
export interface OpsLogMessage {
    /** Stable verb+object key for this occurrence (e.g. `payos.webhook.received`). */
    op: string
    /** Acting user, when known. */
    userId?: string
    /** Worker / BullMQ job id. */
    jobId?: string
    /** Socket or playground session id. */
    sessionId?: string
    /** Payment / order reference. */
    referenceId?: string
    /** Count or size associated with the event. */
    count?: number
    /** Failure text when the event is a failure or a degraded path. */
    error?: string
    /** Small extra fields (provider, path, queue, ...). */
    meta?: Record<string, unknown>
}
