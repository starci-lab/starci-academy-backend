import {
    JobEntity,
    ActionType,
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
    /** The payload for the job. */
    payload: string
    /** The maximum number of steps for the job. */
    maxSteps: number
    /** The entity manager to use. */
    entityManager?: EntityManager
}

/** Params for getting a job. */
export interface GetJobParams extends Omit<JobTargetParams, "job"> {
    /** The ID of the job. */
    id: string
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
export type CompleteJobParams = JobTargetParams

/** Params for marking a job as failed. */
export interface FailJobParams extends JobTargetParams {
    error?: string | null
}

/** Params for querying stalled jobs. */
export interface GetStalledJobsParams {
    entityManager?: EntityManager
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