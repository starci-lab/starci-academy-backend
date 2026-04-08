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
    GithubRepoLoader,
} from "@langchain/community/document_loaders/web/github"
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
    ProcessGitSubmissionLoadDocsStepExecuteResult,
    ExtendedProcessGitSubmissionContext 
} from "../types"
import {
    JobExtendedContext 
} from "../../types"
import {
    MountStorageService 
} from "@modules/filesystem"

/**
 * Step 1: load documents from the submitted GitHub repository.
 */
@Injectable()
export class ProcessGitSubmissionLoadDocsStepService extends AbstractStepService<ProcessGitSubmissionPayload, ExtendedProcessGitSubmissionContext> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly mountStorageService: MountStorageService,
    ) {
        super()
    }

    /**
     * The index of the step.
     */
    stepIndex = 0

    /**
     * The name of the step.
     */
    stepName = "load-docs"

    /**
     * Process the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is processed.
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
     * Execute the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is executed.
     */
    private async execute(
        context: JobExtendedContext<
            ProcessGitSubmissionPayload, 
            ExtendedProcessGitSubmissionContext
        >,
    ): Promise<ProcessGitSubmissionLoadDocsStepExecuteResult> {
        const branch = context.payload.branch ?? "main"
        console.log(branch)
        const gitLoader = new GithubRepoLoader(
            context.extended?.userChallengeSubmission.submissionUrl ?? "",
            {
                branch,
                recursive: true,
                accessToken: this.mountStorageService.githubAccessToken,
                verbose: true,
                ignorePaths: [
                    "package-lock.json",
                    "dist",
                    "node_modules",
                ],
            },
        )
        const docs = await gitLoader.load()
        return {
            docs,
        }
    }
    /**
     * Finalize the step.
     * @param context - The context of the step.
     * @returns A promise that resolves when the step is finalized.
     */
    private async finalize(
        /** Execution result of the step. */
        executionResult: ProcessGitSubmissionLoadDocsStepExecuteResult,
        /** Context of the step. */
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
