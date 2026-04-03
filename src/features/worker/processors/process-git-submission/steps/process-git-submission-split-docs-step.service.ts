import type {
    ProcessGitSubmissionPayload,
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
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "../../abstracts"
import type {
    JobExtendedContext,
} from "../../types"
import type {
    ExtendedProcessGitSubmissionContext,
    ProcessGitSubmissionSplitDocsStepExecuteResult,
} from "../types"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProcessGitSubmissionLoadDocsStepService
} from "./process-git-submission-load-docs-step.service"
import {
    Document,
} from "@langchain/core/documents"
import {
    envConfig 
} from "@modules/env"

/**
 * Step 2: split loaded documents into chunks for embedding.
 */
@Injectable()
export class ProcessGitSubmissionSplitDocsStepService extends AbstractStepService<ProcessGitSubmissionPayload, ExtendedProcessGitSubmissionContext> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly processGitSubmissionLoadDocsStepService: ProcessGitSubmissionLoadDocsStepService,
    ) {
        super()
    }

    /**
     * The index of the step.
     */
    stepIndex = 1

    /**
     * The name of the step.
     */
    stepName = "split-docs"

    /**
     * Process the step: split loaded documents into chunks for embedding.
     * @param context - The context.
     * @returns The void.
     */
    async process(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload, 
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<void> {
        // execute the step
        const executionResult = await this.execute(context)
        // finalize the step
        await this.finalize(executionResult,
            context)
    }

    /**
     * Execute the step: split loaded documents into chunks for embedding.
     * @param context - The context.
     * @returns The void.
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload, 
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<ProcessGitSubmissionSplitDocsStepExecuteResult> {
        const jsonDocs = await this.jobActionService.loadExecutionResult<Array<Document>>(
            {
                job: context.job,
                key: this.processGitSubmissionLoadDocsStepService.stepName,
            }
        )
        const docs = jsonDocs.map((doc) => new Document(
            {
                pageContent: doc.pageContent,
                metadata: doc.metadata,
            }
        ))
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.githubWorker.processGitSubmission.chunkSize,
            chunkOverlap: envConfig().services.githubWorker.processGitSubmission.chunkOverlap,
        })
        const chunks = await splitter.splitDocuments(docs)
        return {
            chunks,
        }
    }

    /**
     * Finalize the step: save the result to the database.
     * @param context - The context.
     * @returns The void.
     */
    private async finalize(
        executionResult: ProcessGitSubmissionSplitDocsStepExecuteResult,
        context: JobExtendedContext<
            ProcessGitSubmissionPayload, 
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    },
                )
            },
        )
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