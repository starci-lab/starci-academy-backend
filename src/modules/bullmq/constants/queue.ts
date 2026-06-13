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
const formatWithBraces = (prefix: string): string => ` {${prefix}} `

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
    [BullQueueName.ProcessGitSubmissionV2]: {
        prefix: formatWithBraces(
            "process-git-submission-v2",
        ),
        name: "process-git-submission-v2",
    },
    [BullQueueName.ProcessGoogleDocsSubmission]: {
        prefix: formatWithBraces(
            "process-google-docs-submission",
        ),
        name: "process-google-docs-submission",
    },
    [BullQueueName.ProcessGoogleDocsSubmissionV2]: {
        prefix: formatWithBraces(
            "process-google-docs-submission-v2",
        ),
        name: "process-google-docs-submission-v2",
    },
    [BullQueueName.ResolveGithub]: {
        prefix: formatWithBraces(
            "resolve-github",
        ),
        name: "resolve-github",
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
    [BullQueueName.SyncIndexer]: {
        prefix: formatWithBraces(
            "sync-indexer",
        ),
        name: "sync-indexer",
    },
    [BullQueueName.SyncCdn]: {
        prefix: formatWithBraces(
            "sync-cdn",
        ),
        name: "sync-cdn",
    },
    [BullQueueName.SyncElasticsearch]: {
        prefix: formatWithBraces(
            "sync-elasticsearch",
        ),
        name: "sync-elasticsearch",
    },
    [BullQueueName.ProcessPersonalProject]: {
        prefix: formatWithBraces(
            "process-personal-project",
        ),
        name: "process-personal-project",
    },
    [BullQueueName.GeneratePersonalProjectTasks]: {
        prefix: formatWithBraces(
            "generate-personal-project-tasks",
        ),
        name: "generate-personal-project-tasks",
    },
    [BullQueueName.ReviewPersonalProjectTask]: {
        prefix: formatWithBraces(
            "review-personal-project-task",
        ),
        name: "review-personal-project-task",
    },
    [BullQueueName.JudgeCodingSubmission]: {
        prefix: formatWithBraces(
            "judge-coding-submission",
        ),
        name: "judge-coding-submission",
    },
    [BullQueueName.ReconcileTransaction]: {
        prefix: formatWithBraces(
            "reconcile-transaction",
        ),
        name: "reconcile-transaction",
    },
    [BullQueueName.ReviewAiLabEval]: {
        prefix: formatWithBraces(
            "review-ai-lab-eval",
        ),
        name: "review-ai-lab-eval",
    },
}
