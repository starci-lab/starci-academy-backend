import {
    BullQueueName,
    ProcessGitSubmissionPayload,
    bullData,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    DayjsService,
    InjectSuperJson,
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import SuperJSON from "superjson"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProcessGitSubmissionStepMappingService,
} from "./step-mapping.service"
import type {
    ExtendedProcessGitSubmissionContext,
} from "./types"
import {
    JobExtendedContext 
} from "../types"
import {
    ChallengeSubmissionPromptEntity, 
    ChallengeSubmissionEntity, 
    InjectPrimaryPostgreSQLEntityManager, 
    JobEntity, 
    UserChallengeSubmissionEntity 
} from "@modules/databases"
import {
    EntityManager 
} from "typeorm"
import {
    ChallengeSubmissionNotFoundException,
    UserChallengeSubmissionNotFoundException,
} from "@modules/exceptions"

/**
 * Worker: GitHub submission → split → embed → grade (DB prompts) → update `user_challenge_submissions`.
 * Enqueued jobs must use `maxSteps` matching the pipeline (default `5`, see `JOB_PROCESS_GIT_SUBMISSION_MAX_STEPS`).
 */
@Worker(
    bullData[BullQueueName.ProcessGitSubmission].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ProcessGitSubmissionWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ProcessGitSubmissionStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Process the job.
     * @param bullmqJob - The bullmq job.
     * @returns A promise that resolves when the job is processed.
     */
    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: ProcessGitSubmissionPayload | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                },
            )
            payload = this.superJson.parse<ProcessGitSubmissionPayload>(bullmqJob.data)
            const stepMap = this.stepMappingService.getStepMap()
            const userChallengeSubmission = await this.entityManager.findOne(
                UserChallengeSubmissionEntity,
                {
                    where: {
                        id: payload.userChallengeSubmissionId,
                    },
                },
            )
            if (!userChallengeSubmission) {
                throw new UserChallengeSubmissionNotFoundException({
                    userChallengeSubmissionId: payload.userChallengeSubmissionId,
                })
            }
            const challengeSubmission = await this.entityManager.findOne(
                ChallengeSubmissionEntity,
                {
                    where: {
                        id: userChallengeSubmission.submissionId,
                    },
                },
            )
            if (!challengeSubmission) {
                throw new ChallengeSubmissionNotFoundException({
                    submissionId: userChallengeSubmission.submissionId,
                })
            }
            const prompts = await this.entityManager.find(
                ChallengeSubmissionPromptEntity,
                {
                    where: {
                        challengeSubmission: {
                            id: challengeSubmission.id,
                        },
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
            const context: JobExtendedContext<
            ProcessGitSubmissionPayload, 
            ExtendedProcessGitSubmissionContext
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                    challengeSubmission,
                    prompts,
                    userChallengeSubmission,
                },
            }
            while (job.currentStep < job.maxSteps) {
                // refresh the job record
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: job.id,
                    },
                )
                context.job = syncedJob
                // process the step
                await stepMap.get(syncedJob.currentStep)?.process(
                    context,
                )
            }
            this.winstonService.log(
                WinstonLog.JobExecutedSuccessfully,
                {
                    jobId: job.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
        } catch (error) {
            this.winstonService.log(
                WinstonLog.JobExecutedFailed,
                {
                    jobId: job?.id ?? "",
                    queueName: bullmqJob.queueName,
                    payload,
                    error: error.message,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            throw error
        }
    }
}
