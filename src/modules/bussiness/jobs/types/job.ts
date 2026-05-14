import {
    ActionType,
    JobCategory,
    JobEntity,
} from "@modules/databases"
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
    /** The challenge submission id to target. */
    challengeSubmissionId?: string | null
}

/** Params for getting a job. */
export interface GetJobParams extends Omit<JobTargetParams, "job"> {
    /** The ID of the job. */
    id: string
    /** Whether to emit a change event. */
    emitChangeEvent?: boolean
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
}

/** Params for marking a job as completed. */
export interface CompleteJobParams extends JobTargetParams {
    /** Whether to emit a change event. */
    emitChangeEvent?: boolean
}

/** Params for marking a job as failed. */
export interface FailJobParams extends JobTargetParams {
    /** Whether to emit a change event. */
    emitChangeEvent?: boolean
    /** The error message. */
    error?: string
}

/** Params for querying stalled jobs. */
export interface GetStalledJobsParams {
    /** The entity manager to use. */
    entityManager?: EntityManager
    /** The action type to filter by. */
    actionType: ActionType
}

/** Result for querying stalled jobs. */
export type GetStalledJobsResult = Array<JobEntity>

/** Params for refreshing `queueAt` of still-processing jobs. */
export interface UpdateQueueAtParams {
    entityManager?: EntityManager
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