import type {
    AiTaskKind,
} from "@modules/ai/types/model"

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

/**
 * Provider marked unavailable for the task kind -- router will skip it until a recheck
 * clears it.
 */
export interface AiModelRouterFailureMessage {
    /** Task kind. */
    taskKind: AiTaskKind
    /** Provider that failed. */
    provider: string
}

/** Proactive recheck cleared unavailable providers -- they are eligible again. */
export interface AiModelRouterRecheckMessage {
    /** Task kind. */
    taskKind: string
    /** Number of previously unavailable providers cleared. */
    clearedCount: number
}

/** Provider ping outcome (success/error + masked key) for the health snapshot. */
export interface AiPingResultMessage {
    /** Provider that was pinged. */
    provider: string
    /** Last four characters of the key -- safe for logs. */
    keySuffix?: string
    /** Whether the ping succeeded. */
    success: boolean
    /** Error message if failed. */
    error?: string
}
