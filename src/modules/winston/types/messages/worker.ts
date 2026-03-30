/** Generic message for when a worker step finishes executing. */
export interface StepExecutedMessage<TPayload = unknown> {
    /** Worker job record ID. */
    jobId: string
    /** BullMQ queue name (if available). */
    queueName?: string
    /** Step name (e.g. "enroll"). */
    step: string
    /** Step index in the pipeline. */
    stepIndex?: number
    /** Payload given to the step (optional; can be large). */
    payload?: TPayload
    /** Extra metadata (small, indexed fields preferred). */
    meta?: Record<string, unknown>
    /** Duration (ms) if measured by the caller. */
    durationMs?: number
    /** Whether step completed successfully. */
    success?: boolean
    /** Error message if failed. */
    error?: string
}

/** Generic message for when a worker job finishes executing. */
export interface JobExecutedMessage<TPayload = unknown> {
    /** Worker job record ID. */
    jobId: string
    /** BullMQ queue name (if available). */
    queueName?: string
    /** Payload for the job (optional; can be large). */
    payload?: TPayload
    /** Error message if failed. */
    error?: string
    /** Total duration (ms) if measured by the caller. */
    durationMs?: number
}

