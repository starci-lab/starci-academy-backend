import {
    JobEntity,
    ActionType,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"


/** Target selector for an existing job record. */
export interface JobTargetParams {
    id: string
    entityManager?: EntityManager
}

/** Params for creating a job tracking record. */
export interface CreateJobParams extends JobTargetParams {
    /** The type of action to perform. */
    actionType: ActionType
    /** The payload for the job. */
    payload: string
    /** The maximum number of steps for the job. */
    maxSteps: number
    /** The entity manager to use. */
    entityManager?: EntityManager
}

/** Params for queuing a job. */
export type RequeueJobParams = JobTargetParams

/** Result of creating a job tracking record. */
export type CreateJobResult = JobEntity

/** Params for increasing the current step of a job. */
export interface IncreaseJobParams extends JobTargetParams {
    step?: number
}

/** Result of increasing a job step. */
export type IncreaseJobResult = JobEntity

/** Params for marking a job as completed. */
export type CompleteJobParams = JobTargetParams

/** Result of marking a job as completed. */
export type CompleteJobResult = JobEntity

/** Params for marking a job as failed. */
export interface FailJobParams extends JobTargetParams {
    error?: string | null
}

/** Result of marking a job as failed. */
export type FailJobResult = JobEntity

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

/** Number of affected jobs after refreshing `queueAt`. */
export type UpdateQueueAtResult = number
