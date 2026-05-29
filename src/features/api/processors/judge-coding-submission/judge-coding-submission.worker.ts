import {
    BullQueueName,
    JudgeCodingSubmissionPayload,
    bullData,
} from "@modules/bullmq"
import {
    envConfig,
} from "@modules/env"
import {
    JobActionService,
    JobExtendedContext,
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
    EntityManager,
} from "typeorm"
import {
    CodingProblemEntity,
    CodingProblemTestcaseEntity,
    CodingSubmissionEntity,
    CodingVerdict,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
} from "@modules/databases"
import {
    CodingProblemNotFoundException,
    CodingSubmissionNotFoundException,
} from "@modules/exceptions"
import {
    JudgeCodingSubmissionStepMappingService,
} from "./step-mapping.service"
import type {
    ExtendedJudgeCodingSubmissionContext,
} from "./types"

/**
 * Worker: coding submission → build Judge0 batch (source × testcases) → judge →
 * aggregate verdict → update `coding_submissions`. On completion the
 * `JobActionService.completeJob` event pushes the status to the client over the
 * `job_notifications` Socket.IO namespace.
 */
@Worker(
    bullData[BullQueueName.JudgeCodingSubmission].name,
    {
        concurrency: envConfig().bullmq.concurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    },
)
export class JudgeCodingSubmissionWorker extends WorkerHost {
    constructor(
        private readonly jobActionService: JobActionService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        private readonly stepMappingService: JudgeCodingSubmissionStepMappingService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /**
     * Process one judging job.
     * @param bullmqJob - the BullMQ job carrying the serialized payload
     */
    async process(bullmqJob: Job<string>): Promise<void> {
        // stamp the start so we can log how long judging took
        const startedAt = this.dayjsService.now()
        // keep payload/job/submission in outer scope so the catch block can use them
        let payload: JudgeCodingSubmissionPayload | undefined
        let job: JobEntity | undefined
        let submission: CodingSubmissionEntity | undefined
        try {
            // load the tracked job row by the BullMQ job id
            job = await this.jobActionService.getJob({
                id: bullmqJob.id ?? "",
            })
            // mark Processing (emits a Socket.IO status update to the client)
            await this.jobActionService.processingJob({
                job,
            })
            // decode the payload (identifiers only)
            payload = this.superJson.parse<JudgeCodingSubmissionPayload>(bullmqJob.data)
            // load the submission row to be judged
            submission = await this.entityManager.findOne(
                CodingSubmissionEntity,
                {
                    where: {
                        id: payload.codingSubmissionId,
                    },
                },
            ) ?? undefined
            // missing submission → typed failure (job will be marked failed by the outer catch)
            if (!submission) {
                throw new CodingSubmissionNotFoundException({
                    codingSubmissionId: payload.codingSubmissionId,
                })
            }
            // load the target problem (for limits)
            const problem = await this.entityManager.findOne(
                CodingProblemEntity,
                {
                    where: {
                        id: submission.codingProblemId,
                    },
                },
            )
            // missing problem → typed failure
            if (!problem) {
                throw new CodingProblemNotFoundException({
                    identifier: submission.codingProblemId,
                })
            }
            // load every testcase for the problem in evaluation order
            const testcases = await this.entityManager.find(
                CodingProblemTestcaseEntity,
                {
                    where: {
                        codingProblemId: problem.id,
                    },
                    order: {
                        orderIndex: "ASC",
                    },
                },
            )
            // assemble the extended context the step operates on
            const context: JobExtendedContext<
                JudgeCodingSubmissionPayload,
                ExtendedJudgeCodingSubmissionContext
            > = {
                job,
                queueName: bullmqJob.queueName,
                payload,
                extended: {
                    submission,
                    problem,
                    testcases,
                },
            }
            // fetch the step map (single judge step)
            const stepMap = this.stepMappingService.getStepMap()
            // run steps until the job reaches its max step count
            while (job.currentStep < job.maxSteps) {
                // refresh the job row so currentStep reflects prior step bumps
                const syncedJob = await this.jobActionService.getJob({
                    id: job.id,
                })
                // adopt the refreshed row + keep the context in sync
                job = syncedJob
                context.job = job
                // execute the step registered at the current index
                await stepMap.get(syncedJob.currentStep)?.process(context)
            }
            // mark the job complete → emits Socket.IO status to the client
            await this.jobActionService.completeJob({
                job,
            })
            // success log with duration
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
            // mark the job failed so the client gets a failed Socket.IO status update
            if (job) {
                await this.jobActionService.failJob({
                    job,
                    error: error instanceof Error ? error.message : String(error),
                })
            }
            // reflect the infra failure on the submission so its verdict isn't stuck "pending"
            if (submission && submission.verdict === CodingVerdict.Pending) {
                submission.verdict = CodingVerdict.InternalError
                await this.entityManager.save(CodingSubmissionEntity,
                    submission)
            }
            // failure log; re-throw so BullMQ records the failure
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
