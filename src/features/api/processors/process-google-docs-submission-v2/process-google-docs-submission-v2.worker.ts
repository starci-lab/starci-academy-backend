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
    ProcessGoogleDocsSubmissionV2StepMappingService,
} from "./step-mapping.service"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
} from "../process-google-docs-submission/types"
import {
    JobExtendedContext,
} from "@modules/bussiness"
import {
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
 * SCHEMA V2 worker: Google Docs submission → split → vectorize → grade against outcome/approach
 * criteria → update `submission_attempts`. Same 2-step pipeline (grade + complete) as the legacy
 * worker, so `maxSteps` is `2`.
 */
@Worker(
    bullData[BullQueueName.ProcessGoogleDocsSubmissionV2].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ProcessGoogleDocsSubmissionV2Worker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ProcessGoogleDocsSubmissionV2StepMappingService,
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
            await this.jobActionService.processingJob({
                job,
            })
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
            // criteria live in jsonb columns on the challenge row (auto-loaded)
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
            const context: JobExtendedContext<
                ProcessGoogleDocsSubmissionPayload,
                ExtendedProcessGoogleDocsSubmissionContext
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                    challengeSubmission,
                    challenge,
                    userChallengeSubmission,
                },
            }
            while (job.currentStep < job.maxSteps) {
                const syncedJob = await this.jobActionService.getJob(
                    {
                        id: job.id,
                    },
                )
                job = syncedJob
                context.job = job
                await stepMap.get(syncedJob.currentStep)?.process(
                    context,
                )
            }
            await this.jobActionService.completeJob({
                job,
            })
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
            throw error
        }
    }
}
