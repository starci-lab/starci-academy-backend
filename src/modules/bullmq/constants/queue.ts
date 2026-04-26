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
    [BullQueueName.ProcessGitSubmission]: {
        prefix: formatWithBraces(
            "process-git-submission",
        ),
        name: "process-git-submission",
    },
    [BullQueueName.ProcessGoogleDocsSubmission]: {
        prefix: formatWithBraces(
            "process-google-docs-submission",
        ),
        name: "process-google-docs-submission",
    },
    [BullQueueName.InviteGithub]: {
        prefix: formatWithBraces(
            "invite-github",
        ),
        name: "invite-github",
    },
    [BullQueueName.ProcessCvSubmission]: {
        prefix: formatWithBraces(
            "process-cv-submission",
        ),
        name: "process-cv-submission",
    },
    [BullQueueName.ProcessVideo]: {
        prefix: formatWithBraces(
            "process-video",
        ),
        name: "process-video",
    },
    [BullQueueName.SendMail]: {
        prefix: formatWithBraces(
            "send-mail",
        ),
        name: "send-mail",
    },
    [BullQueueName.SyncScyllaDB]: {
        prefix: formatWithBraces(
            "sync-scylladb",
        ),
        name: "sync-scylladb",
    },
    [BullQueueName.SyncEmailBloomFilter]: {
        prefix: formatWithBraces(
            "sync-email-bloom-filter",
        ),
        name: "sync-email-bloom-filter",
    },
    [BullQueueName.SyncCdn]: {
        prefix: formatWithBraces(
            "sync-cdn",
        ),
        name: "sync-cdn",
    },
}
