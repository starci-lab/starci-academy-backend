import type {
    AiTaskKind
} from "@modules/ai"

/** AI model router log messages. */
export interface AiModelRouterResolvedMessage {
    /** Task kind (e.g. "grade", "generateMilestone"). */
    taskKind: AiTaskKind
    /** Resolved model name. */
    model: string
    /** Resolved provider name. */
    provider: string
    /** Active tier. */
    tier: string
}

export interface AiModelRouterFailureMessage {
    /** Task kind. */
    taskKind: AiTaskKind
    /** Provider that failed. */
    provider: string
}

export interface AiModelRouterRecheckMessage {
    /** Task kind. */
    taskKind: string
    /** Number of previously unavailable providers cleared. */
    clearedCount: number
}

export interface AiPingResultMessage {
    /** Provider that was pinged. */
    provider: string
    /** Whether the ping succeeded. */
    success: boolean
    /** Error message if failed. */
    error?: string
}
