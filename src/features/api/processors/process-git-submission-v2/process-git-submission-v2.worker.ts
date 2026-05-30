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
    ProcessGitSubmissionV2StepMappingService,
} from "./step-mapping.service"
import type {
    ExtendedProcessGitSubmissionContext,
} from "../process-git-submission/types"
import {
    JobExtendedContext,
} from "@modules/bussiness"
import {
    ChallengeEntity,
    ChallengeSubmissionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    EntityManager,
} from "typeorm"
import {
    ChallengeNotFoundException,
    ChallengeSubmissionNotFoundException,
    UserChallengeSubmissionNotFoundException,
} from "@modules/exceptions"

/**
 * SCHEMA V2 worker: GitHub submission → split → embed → grade against outcome/approach criteria →
 * update `user_challenge_submissions`. Enqueued jobs use the same 2-step pipeline (grade + complete)
 * as the legacy worker, so `maxSteps` is `2`.
 */
@Worker(
    bullData[BullQueueName.ProcessGitSubmissionV2].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class ProcessGitSubmissionV2Worker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: ProcessGitSubmissionV2StepMappingService,
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
            await this.jobActionService.processingJob({
                job,
            })
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
            ProcessGitSubmissionPayload,
            ExtendedProcessGitSubmissionContext
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                    challenge,
                    challengeSubmission,
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
                    error: error.message,
                    durationMs: this.dayjsService.now().diff(this.dayjsService.from(startedAt)),
                },
            )
            throw error
        }
    }
}
