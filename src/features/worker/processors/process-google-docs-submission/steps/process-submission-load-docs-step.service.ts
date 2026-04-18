import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import {
    LangchainService,
} from "@modules/langchain"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "@modules/bullmq"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProcessGoogleDocsSubmissionLoadDocsStepExecuteResult,
    ExtendedProcessGoogleDocsSubmissionContext,
} from "../types"
import {
    JobExtendedContext,
} from "../../types"

/**
 * Step 1: load document content from Google Docs (Plan B: public export).
 */
@Injectable()
export class ProcessGoogleDocsSubmissionLoadDocsStepService extends AbstractStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly langchainService: LangchainService,
    ) {
        super()
    }

    stepIndex = 0

    stepName = "load-docs"

    /**
     * Process the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is processed.
     */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        // execute the step
        const executionResult = await this.execute(context)
        // finalize the step
        await this.finalize(executionResult, context)
    }

    /**
     * Execute the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is executed.
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionLoadDocsStepExecuteResult> {
        const url = context.extended?.userChallengeSubmission.submissionUrl ?? ""

        // Use the centralized LangChain service to load Google Docs via public export
        const docs = await this.langchainService.loadGoogleDocs(url)

        return {
            docs,
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - Execution result of the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        executionResult: ProcessGoogleDocsSubmissionLoadDocsStepExecuteResult,
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(async (entityManager) => {
            await this.jobActionService.increaseJob({
                job,
                entityManager,
            })

            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult,
                entityManager,
            })
        })

        this.winstonService.log(
            WinstonLog.ProcessGitSubmissionStepExecuted, // Reusing generic log constant
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
    }
}
