/**
 * Params for the process-video command.
 */
export interface ProcessVideoCommandParams {
    /** Full S3 URL of the source video. */
    url: string
}

/**
 * Result of enqueueing a process-video job.
 */
export interface ProcessVideoResult {
    /** Created BullMQ job ID. */
    jobId: string
    /** Human-readable status message. */
    message: string
}

/**
 * CQRS command for processing a video.
 */
export class ProcessVideoCommand {
    constructor(
        public readonly params: ProcessVideoCommandParams,
    ) { }
}
