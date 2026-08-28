import {
    JobEntity,
    JobRefs,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import type {
    EntityManager,
} from "typeorm"


/** Target selector for an existing job record. */
export interface JobTargetParams {
    /** The job entity. */
    job: JobEntity
    /** The entity manager to use. */
    entityManager?: EntityManager
}

/** Params for creating a job tracking record. */
export interface CreateJobParams extends Omit<JobTargetParams, "job"> {
    /** The ID of the job. */
    id: string
    /** The type of action to perform. */
    actionType: ActionType
    /** UI-facing job category for realtime rendering (omit or null when not tied to a learn UI bucket, e.g. enroll). */
    category?: JobCategory
    /** The payload for the job. */
    payload: string
    /** The maximum number of steps for the job. */
    maxSteps: number
    /**
     * Optional user this job is associated with (persists `jobs.user_id`).
     * Omit for system jobs (e.g. outbound email with no end-user id).
     */
    userId?: string | null
    /** The entity manager to use. */
    entityManager?: EntityManager
    /** The challenge submission id to target (stored into `jobs.refs.challengeSubmissionId`). */
    challengeSubmissionId?: string | null
    /** Extra loose domain correlation ids stored into `jobs.refs` (no FK). */
    refs?: JobRefs
}

/** Params for getting a job. */
export interface GetJobParams extends Omit<JobTargetParams, "job"> {
    /** The ID of the job. */
    id: string
    /** Whether to emit a change event. */
    emitChangeEvent?: boolean
    /**
     * Optional caller to scope the lookup to (compared against `jobs.user_id`).
     * When provided, a job owned by someone else -- or a system job with no
     * owner at all -- is treated the same as not found: the predicate lives in
     * the query so a row the caller does not own never leaves the database.
     * Omit for internal/worker callers that legitimately load any job by id.
     */
    userId?: string | null
}

/** Params for queuing a job. */
export interface RequeueJobParams extends Omit<JobTargetParams, "job"> {
    /** The ID of the job. */
    id: string
}

/** Params for increasing the current step of a job. */
export interface IncreaseJobParams extends JobTargetParams {
    /** The step to increase. */
    step?: number
    /** The entity manager to use. */
    entityManager?: EntityManager
    /** When set, the step is advanced only if the row still carries this fencing token. */
    expectedFencingToken?: number
}

/** Params for marking a job as completed. */
export interface CompleteJobParams extends JobTargetParams {
    /** Whether to emit a change event. */
    emitChangeEvent?: boolean
    /** When set, completion is applied only if the row still carries this fencing token. */
    expectedFencingToken?: number
}

/** Params for marking a job as failed. */
export interface FailJobParams extends JobTargetParams {
    /** Whether to emit a change event. */
    emitChangeEvent?: boolean
    /** The error message. */
    error?: string
    /** When set, the failure is applied only if the row still carries this fencing token. */
    expectedFencingToken?: number
}

/** Params for storing the result of a job. */
export interface SaveExecutionResultParams<T> extends JobTargetParams {
    /** The key of the execution result. */
    key: string
    /** The execution result of the job. */
    executionResult: T
}

/** Params for loading the result of a job. */
export interface LoadExecutionResultParams extends JobTargetParams {
    /** The key of the execution result. */
    key: string
}

/** Params for updating the status of a job. */
export interface ProcessingJobParams extends JobTargetParams {
    /** Whether to emit a change event. */
    emitChangeEvent?: boolean
    /** The entity manager to use. */
    entityManager?: EntityManager
}

/** Params for atomically publishing the exact learner-visible result. */
export interface SaveJobResultRefParams extends JobTargetParams {
    /** Result domain understood by the frontend adapter. */
    kind: NonNullable<JobRefs["resultKind"]>
    /** Exact persisted result row id. */
    id: string
}

/** Owner-authorized selector for one durable job status. */
export interface GetOwnedJobStatusParams {
    /** Durable job id returned by an asynchronous mutation. */
    jobId: string
    /** Authenticated owner id. */
    userId: string
}

/** Safe shared read model for GraphQL polling and Socket.IO publication. */
export interface JobStatusReadModel {
    jobId: string
    status: import("@modules/databases/postgresql/primary/enums/job-status").JobStatus
    category: JobEntity["category"]
    actionType: JobEntity["actionType"]
    currentStep: number
    maxSteps: number
    updatedAt: Date
    retryable: boolean
    failureReason: string | null
    result: null | {
        kind: NonNullable<JobRefs["resultKind"]>
        id: string
    }
}
