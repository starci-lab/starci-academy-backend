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
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "../../abstracts"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProcessGoogleDocsSubmissionLoadDocsStepExecuteResult,
    ProcessGoogleDocsSubmissionSplitDocsStepExecuteResult,
    ExtendedProcessGoogleDocsSubmissionContext,
} from "../types"
import {
    JobExtendedContext,
} from "../../types"
import {
    envConfig,
} from "@modules/env"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    ProcessGoogleDocsSubmissionLoadDocsStepService,
} from "./process-submission-load-docs-step.service"

/**
 * Step 2: split document into chunks for embedding/grading.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionSplitDocsStepService extends AbstractStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly processGoogleDocsSubmissionLoadDocsStepService: ProcessGoogleDocsSubmissionLoadDocsStepService,
    ) {
        super()
    }

    stepIndex = 1

    stepName = "split-docs"

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
        await this.finalize(executionResult,
            context)
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
    ): Promise<ProcessGoogleDocsSubmissionSplitDocsStepExecuteResult> {
        const loadResult = await this.jobActionService.loadExecutionResult<ProcessGoogleDocsSubmissionLoadDocsStepExecuteResult>({
            job: context.job,
            key: this.processGoogleDocsSubmissionLoadDocsStepService.stepName,
        })

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize, // Reusing git worker config
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })

        const chunks = await splitter.splitDocuments(loadResult.docs)

        return {
            chunks,
        }
    }

    /**
     * Finalize the step.
     * @param executionResult - Execution result of the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        executionResult: ProcessGoogleDocsSubmissionSplitDocsStepExecuteResult,
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
            WinstonLog.ProcessGitSubmissionStepExecuted,
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
