export enum JobNotificationStatus {
    Processing = "processing",
    Completed = "completed",
    Failed = "failed",
}

export interface JobSubscribeRequest {
    /** Job id to subscribe to. Optional: if omitted, user listens to all of their jobs. */
    jobId?: string
}

export interface JobNotificationPayload<T = unknown> {
    jobId: string
    userId?: string
    queueName: string
    status: JobNotificationStatus
    /** Current step index (0-based). */
    currentStep?: number
    /** Total number of steps. */
    maxSteps?: number
    /** Human-readable step name. */
    stepName?: string
    /** Extra data (execution result on complete, etc.). */
    data?: T
    /** Error message when status = Failed. */
    error?: string
    /** Progress in percent (0..100). */
    progress?: number
    timestamp: string
}
