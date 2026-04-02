import type {
    ProccessGitUrlPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    envConfig,
} from "@modules/env"
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
import type {
    JobContext,
} from "../../types"
import type {
    ProccessGitUrlPipelineContext,
} from "../types"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"

/**
 * Step 1: load documents from the submitted GitHub repository URL (from DB).
 */
@Injectable()
export class ProccessGitUrlLoadDocsStepService extends AbstractStepService<ProccessGitUrlPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
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
    stepName = "load-docs"

    /**
     * Process the step: load documents from the GitHub repository.
     * @param context - The context.
     * @returns The void.
     */
    async process(
        context: JobContext<ProccessGitUrlPayload>,
    ): Promise<void> {
        const pipeline = context as ProccessGitUrlPipelineContext
        await this.execute(pipeline)
        await this.finalize(pipeline)
    }

    /**
     * Execute the step: load documents from the GitHub repository.
     * @param context - The context.
     * @returns The void.
     */
    private async execute(
        context: ProccessGitUrlPipelineContext,
    ): Promise<void> {
        const submissionUrl = context.submissionUrl
        if (!submissionUrl?.trim()) {
            throw new Error(
                "Missing submission URL; resolve-context step must run first.",
            )
        }
        const {
            branch: branchFromPayload,
        } = context.payload
        const githubWorkerConfig = envConfig().services.githubWorker.processGitUrl
        const branch = branchFromPayload ?? githubWorkerConfig.branch
        const gitLoader = new GithubRepoLoader(
            submissionUrl,
            {
                branch,
                recursive: true,
                accessToken: githubWorkerConfig.githubAccessToken,
                verbose: true,
                ignorePaths: [
                    "package-lock.json",
                    "dist",
                    "node_modules",
                ],
            },
        )
        context.docs = await gitLoader.load()
    }

    /**
     * Finalize the step: save the result to the database.
     * @param context - The context.
     * @returns The void.
     */
    private async finalize(
        context: ProccessGitUrlPipelineContext,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        const docCount = context.docs?.length ?? 0
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
                        executionResult: {
                            docCount,
                        },
                        entityManager,
                    },
                )
            },
        )
        this.winstonService.log(
            WinstonLog.ProcessGitUrlStepExecuted,
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
