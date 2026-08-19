import type {
    Job,
} from "bullmq"
import type {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"
import type {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"

/** Params to persist a terminal (timed-out/errored) verdict for a submission whose judging failed. */
export interface PersistTerminalFailureVerdictParams {
    /** The submission being judged, already known to still be `Pending`. */
    submission: CodingSubmissionEntity
    /** The error that failed judging -- classified to pick the terminal verdict. */
    error: unknown
    /** The raw BullMQ job, used only for log correlation. */
    bullmqJob: Job<string>
}

/** Params to notify the solver of a terminal (timed-out/errored) verdict, best-effort. */
export interface NotifySubmissionGradedFailureParams {
    /** The submission, already stamped with its terminal verdict. */
    submission: CodingSubmissionEntity
    /** The raw BullMQ job, used only for log correlation. */
    bullmqJob: Job<string>
    /** The tracked job row, used only for log correlation. */
    job: JobEntity | undefined
}
