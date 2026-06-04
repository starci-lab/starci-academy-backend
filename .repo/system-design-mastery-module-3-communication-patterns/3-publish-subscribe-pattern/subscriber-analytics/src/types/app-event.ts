/**
 * NATS pub/sub demo payload types.
 */

/** POST /publish request body. */
export interface PublishRequestBody {
    type?: string
    payload?: string | number | boolean | null
}

/** Envelope emitted on `app.events`. */
export interface AppEventEnvelope {
    type: string
    payload: string | number | boolean | null | undefined
    timestamp: string
}

/** Response after publish. */
export interface PublishResponse {
    message: string
    type: string
}
