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
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    EntityManager,
} from "typeorm"

/** Params for {@link finalizeStep}. */
export interface FinalizeStepParams<T> {
    /** The primary entity manager the increase/save-result transaction runs on. */
    entityManager: EntityManager
    /** The job action service used to advance the step and persist its result. */
    jobActionService: JobActionService
    /** The Winston service the step-executed log is written through. */
    winstonService: WinstonService
    /** The step's name, used as both the execution-result key and the log field. */
    stepName: string
    /** The step's index, written to the step-executed log. */
    stepIndex: number
    /** The step's execution result, persisted under `stepName`. */
    executionResult: EmptyObject
    /** The job context the step is finalizing. */
    context: JobExtendedContext<T, EmptyObject>
}

/**
 * Shared finalize shape for a job step: advance the job's step counter,
 * persist the step's execution result, and emit the step-executed log --
 * identical across every step in a pipeline regardless of what the step
 * itself does.
 * @param params - The entity manager, job action service, Winston service,
 * step identity, execution result, and job context.
 * @returns A promise that resolves once the step is finalized.
 */
export const finalizeStep = async <T>(
    {
        entityManager,
        jobActionService,
        winstonService,
        stepName,
        stepIndex,
        executionResult,
        context,
    }: FinalizeStepParams<T>,
): Promise<void> => {
    const {
        job,
        payload,
        queueName,
    } = context
    await entityManager.transaction(
        async (transactionEntityManager) => {
            await jobActionService.increaseJob(
                {
                    job,
                    entityManager: transactionEntityManager,
                },
            )
            await jobActionService.saveExecutionResult(
                {
                    job,
                    key: stepName,
                    executionResult,
                    entityManager: transactionEntityManager,
                },
            )
        },
    )
    winstonService.log(
        WinstonLog.ProcessStepExecuted,
        {
            jobId: job.id ?? "",
            queueName,
            step: stepName,
            stepIndex,
            payload,
            success: true,
        },
    )
}
