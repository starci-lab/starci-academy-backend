import type {
    ProccessGitUrlPayload,
} from "@modules/bullmq"

/** Worker step payload (same shape as the BullMQ job body). */
export type ExecuteStepPayload = ProccessGitUrlPayload
