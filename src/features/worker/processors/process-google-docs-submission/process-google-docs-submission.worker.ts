import {
    BullQueueName,
    ProcessGoogleDocsSubmissionPayload,
    bullData,
} from "@modules/bullmq"
import {
    InjectSuperJson,
} from "@modules/mixin"
import {
    Processor as Worker,
    WorkerHost,
} from "@nestjs/bullmq"
import {
    Job,
} from "bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    DayjsService,
} from "@modules/mixin"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ProcessGoogleDocsSubmissionStepMappingService,
} from "./step-mapping.service"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
} from "./types"
import {
    JobExtendedContext,
} from "@modules/bullmq"
import {
    ChallengeSubmissionPromptEntity,
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
    UserChallengeSubmissionEntity,
    ChallengeEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    ChallengeNotFoundException,
    ChallengeSubmissionNotFoundException,
    UserChallengeSubmissionNotFoundException,
} from "@modules/exceptions"
import SuperJSON from "superjson"

/**
 * Worker: Google Docs submission -> split -> vectorize -> grade (DB prompts) -> update `submission_attempts`.
 */
@Worker(
    bullData[BullQueueName.ProcessGoogleDocsSubmission].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ProcessGoogleDocsSubmissionWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ProcessGoogleDocsSubmissionStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Process the job.
     * @param bullmqJob - The BullMQ job.
     * @returns A promise that resolves when the job is processed.
     */
    async process(bullmqJob: Job<string>) {
        const startedAt = this.dayjsService.now()
        let payload: ProcessGoogleDocsSubmissionPayload | undefined
        let job: JobEntity | undefined
        try {
            job = await this.jobActionService.getJob(
                {
                    id: bullmqJob.id ?? "",
                },
            )
            payload = this.superJson.parse<ProcessGoogleDocsSubmissionPayload>(bullmqJob.data)
            
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

            const challenge = await this.entityManager.findOne(
                ChallengeEntity,
                {
                    where: {
                        id: challengeSubmission.challengeId,
                    },
                },
            )

            if (!challenge) {
                throw new ChallengeNotFoundException({
                    id: challengeSubmission.challengeId,
                })
            }

            // Fetch prompts from the database for this specific submission requirement
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
                ProcessGoogleDocsSubmissionPayload,
                ExtendedProcessGoogleDocsSubmissionContext
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                    prompts,
                    challengeSubmission,
                    challenge,
                    userChallengeSubmission,
                },
            }

            while (job.currentStep < job.maxSteps) {
                // Refresh the job record to ensure we have the latest step index
                const syncedJob = await this.jobActionService.getJob({
                    id: job.id,
                })
                context.job = syncedJob

                // Process the current step
                const step = stepMap.get(syncedJob.currentStep)
                if (step) {
                    await step.process(context)
                } else {
                    // Safety break if a step is missing to prevent infinite loop
                    break
                }
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
                    error: error instanceof Error ? error.message : String(error),
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            // Rethrow to let BullMQ handle retries if configured
            throw error
        }
    }
}
