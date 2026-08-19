import type {
    EntityManager,
} from "typeorm"
import type {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import type {
    ReviewPersonalProjectTaskPayload,
} from "@modules/integrations/bullmq/types/payloads/review-personal-project-task"
import type {
    ReviewMilestoneTaskGradeResult,
} from "./grade"

/** Params to atomically persist one graded milestone attempt plus its rewards and step advance. */
export interface PersistMilestoneCompletionParams {
    /** The transactional entity manager the whole write must run on. */
    entityManager: EntityManager
    /** The job row backing this run, used for idempotency keying and the step advance. */
    job: JobEntity
    /** The decoded queue payload. */
    payload: ReviewPersonalProjectTaskPayload
    /** The validated grade result produced by the grade step. */
    grade: ReviewMilestoneTaskGradeResult
    /** Credit to debit for this grading run (0 when the run used no billable model call). */
    creditCost: number
}

/** Params to grant the once-per-task pass reward for a graded milestone attempt. */
export interface GrantMilestonePassRewardParams {
    /** The transactional entity manager the whole write must run on. */
    entityManager: EntityManager
    /** The decoded queue payload. */
    payload: ReviewPersonalProjectTaskPayload
    /** The user-milestone-task id the reward and activity are keyed to. */
    userMilestoneTaskId: string
}

/** Params to notify a learner that their milestone task attempt was graded. */
export interface NotifyMilestoneCompletionParams {
    /** The decoded queue payload. */
    payload: ReviewPersonalProjectTaskPayload
    /** The job row, used only for log correlation. */
    job: JobEntity
    /** The queue name, used only for log correlation. */
    queueName: string | undefined
    /** The validated grade result produced by the grade step. */
    grade: ReviewMilestoneTaskGradeResult
}
