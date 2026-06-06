/** Params for recording (upserting) a device a user authenticated/acted from. */
export interface RecordDeviceParams {
    /** The acting user's id. */
    userId: string
    /** Client-generated device fingerprint (no-op when absent). */
    fingerprint: string | null
    /** Best-effort client IP, or null. */
    ipAddress: string | null
    /** Raw User-Agent, or null. */
    userAgent: string | null
}

/** Result of recording a device (void). */
export type RecordDeviceResult = void
