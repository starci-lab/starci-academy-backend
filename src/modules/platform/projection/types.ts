/**
 * Parsed image of one CDC message handed to a projection listener. Debezium's
 * unwrap SMT emits the flat row as the message value; `topic` carries the
 * source table (suffix of the fully-qualified topic name).
 */
export interface ProjectionCdcMessage {
    /** Fully-qualified source topic, e.g. `starci.public.enrollments`. */
    topic: string
    /** The flat row image after Debezium unwrap (shape is table-specific). */
    row: unknown
}

/**
 * Minimal envelope shape used to defensively unwrap a Debezium message. Some
 * unwrap configs nest the row under `payload`; others emit it at top level.
 */
export interface ProjectionCdcEnvelope {
    /** The unwrapped row when present; absent when the row is already top-level. */
    payload?: unknown
}
