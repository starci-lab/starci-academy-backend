import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    EmptyObject,
} from "@modules/lib/common/types/atomic"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import type {
    EntityManager,
} from "typeorm"

/** Params for {@link claimDispatch}. */
export interface ClaimDispatchParams<T> {
    /** The primary entity manager the claim's row-locked transaction runs on. */
    entityManager: EntityManager
    /** The job action service the claim marker is read/written through. */
    jobActionService: JobActionService
    /** The job context of the step attempting the claim. */
    context: JobExtendedContext<T, EmptyObject>
    /** The execution-result key the claim marker is stored under -- per-caller so retries of different steps never collide. */
    checkpoint: string
}

/**
 * Claim a one-shot external dispatch (e.g. a GitHub API call) so a
 * persistence retry after the call already succeeded does not dispatch a
 * second time. Row-locks the job, checks the checkpoint marker, and -- if
 * unclaimed -- marks it claimed inside the same transaction before the
 * caller is allowed to proceed.
 * @param params - The entity manager, job action service, job context, and checkpoint key.
 * @returns `true` when the caller just claimed the dispatch and should proceed; `false` when it was already claimed.
 */
export const claimDispatch = async <T>(
    {
        entityManager,
        jobActionService,
        context,
        checkpoint,
    }: ClaimDispatchParams<T>,
): Promise<boolean> => {
    return entityManager.transaction(async (transactionEntityManager) => {
        const job = await transactionEntityManager.findOneOrFail(
            JobEntity,
            {
                where: {
                    id: context.job.id,
                },
                lock: {
                    mode: "pessimistic_write",
                },
            },
        )
        const claimed = await jobActionService.loadExecutionResult<boolean>({
            job,
            key: checkpoint,
        })
        if (claimed) {
            context.job.executionResults = job.executionResults
            return false
        }
        await jobActionService.saveExecutionResult({
            job,
            key: checkpoint,
            executionResult: true,
            entityManager: transactionEntityManager,
        })
        context.job.executionResults = job.executionResults
        return true
    })
}

/** Params for {@link releaseDispatch}. */
export interface ReleaseDispatchParams {
    /** The job action service the claim marker is cleared through. */
    jobActionService: JobActionService
    /** The job row the claim marker is stored against. */
    job: JobEntity
    /** The execution-result key the claim marker is stored under. */
    checkpoint: string
}

/**
 * Release a claim taken by {@link claimDispatch} when the external call
 * explicitly failed, so BullMQ's retry is allowed to dispatch again.
 * @param params - The job action service, job row, and checkpoint key.
 * @returns A promise that resolves once the claim marker is cleared.
 */
export const releaseDispatch = async (
    {
        jobActionService,
        job,
        checkpoint,
    }: ReleaseDispatchParams,
): Promise<void> => {
    await jobActionService.saveExecutionResult({
        job,
        key: checkpoint,
        executionResult: false,
    })
}
