import type {
    BullQueueData 
} from "../types"
import {
    BullQueueName 
} from "../enums"

/**
 * Wraps a string in braces for use as a Redis key prefix.
 *
 * @param prefix - Raw prefix string
 * @returns Formatted string like "{prefix}"
 */
export function formatWithBraces(prefix: string): string {
    return `{${prefix}}`
}

/**
 * Centralized configuration for all BullMQ queues.
 * Each queue has its own prefix and name derived from executor id.
 */
export const bullData: Record<BullQueueName, BullQueueData> = {
    [BullQueueName.Enroll]: {
        prefix: formatWithBraces(
            "enroll"
        ),
        name: "enroll",
    },
    [BullQueueName.ProccessGitUrl]: {
        prefix: formatWithBraces(
            "proccess-git-url",
        ),
        name: "proccess-git-url",
    },
}
