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
    StepNotFoundException,
    UserChallengeSubmissionNotFoundException,
} from "@modules/exceptions"

@Worker(
    bullData[BullQueueName.ProcessGitSubmission].name,
    {
        concurrency: envConfig().bullmq.aiConcurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
/**
 * SCHEMA V2 worker: GitHub submission -> split -> embed -> grade against outcome/approach criteria ->
 * update `user_challenge_submissions`. Enqueued jobs use the same 2-step pipeline (grade + complete)
 * as the legacy worker, so `maxSteps` is `2`.
 */
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
            // load the SPECIFIC submission being graded WITH its normalized per-language grading
            // rubric (approach + outcome criteria, each with their per-language prose rows)
            const challengeSubmission = await this.entityManager.findOne(
                ChallengeSubmissionEntity,
                {
                    where: {
                        id: userChallengeSubmission.submissionId,
                    },
                    relations: {
                        approachCriteria: {
                            langs: true,
                        },
                        outcomeCriteria: {
                            langs: true,
                        },
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
                const step = stepMap.get(syncedJob.currentStep)
                if (!step) {
                    throw new StepNotFoundException({
                        stepIndex: syncedJob.currentStep,
                    })
                }
                await step.process(context)
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
