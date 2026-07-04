import {
    JobActionService,
    JobStalledService
} from "../atomic"
import {
    Injectable,
} from "@nestjs/common"
import {
    ActionType,
    InjectPrimaryPostgreSQLEntityManager,
    JobEntity,
    TransactionItemEntity
} from "@modules/databases"
import {
    InjectSuperJson
} from "@modules/mixin"
import SuperJSON from "superjson"
import {
    v4 as uuidv4
} from "uuid"
import {
    Queue
} from "bullmq"
import type {
    EntityManager
} from "typeorm"
import {
    InjectQueue
} from "@nestjs/bullmq"
import {
    bullData,
    BullQueueName
} from "@modules/bullmq"
import {
    EnqueueEnrollJobParams,
    EnqueueEnrollmentsForTransactionParams,
    EnqueueEnrollmentsForTransactionResult
} from "../types"
import {
    envConfig 
} from "@modules/env"
import {
    sleepEnqueueUxDelay,
} from "../utils"

/**
 * Service for enqueuing an enroll job.
 */
@Injectable()
export class EnqueueEnrollJobService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly jobStalledService: JobStalledService,
        @InjectSuperJson()
        private readonly superJson: SuperJSON,
        @InjectQueue(bullData[BullQueueName.Enroll].name)
        private readonly enrollQueue: Queue<string>,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Fan a paid Enroll transaction out to one enroll job per course, covering both
     * multi-course orders (a `transaction_items` row per course) and legacy
     * single-course orders (the course carried directly on `transaction.course`).
     * Called by every gateway webhook + the reconcile worker on payment success.
     *
     * @param params - The paid Enroll transaction.
     * @returns The number of enroll jobs enqueued (0 = malformed transaction).
     */
    async enqueueForTransaction(
        {
            transaction,
        }: EnqueueEnrollmentsForTransactionParams,
    ): Promise<EnqueueEnrollmentsForTransactionResult> {
        // multi-course order → the courses live in transaction_items (transaction.course is null)
        const items = await this.entityManager.find(
            TransactionItemEntity,
            {
                where: {
                    transaction: {
                        id: transaction.id,
                    },
                },
            },
        )
        if (items.length > 0) {
            // enqueue sequentially (AWAITED per line) so a broker failure propagates:
            // the webhook then returns non-2xx and the gateway re-delivers → no line stranded.
            // Each enroll job is idempotent per (user, course), so a re-delivery is safe.
            for (const item of items) {
                await this.enqueue({
                    userId: transaction.userId,
                    courseId: item.courseId,
                    transactionId: transaction.id,
                })
            }
            return {
                enqueuedCount: items.length,
            }
        }
        // single-course legacy order → the course is carried directly on the transaction
        if (transaction.courseId) {
            await this.enqueue({
                userId: transaction.userId,
                courseId: transaction.courseId,
                transactionId: transaction.id,
            })
            return {
                enqueuedCount: 1,
            }
        }
        // neither items nor a course → malformed Enroll transaction; let the caller surface it
        return {
            enqueuedCount: 0,
        }
    }

    /**
     * Enqueue an enroll job.
     * @param params - The parameters for enqueuing an enroll job.
     * @param params.userId - The ID of the user to enroll.
     * @param params.courseId - The ID of the course to enroll in.
     * @param params.jobId - The ID of the job to requeue.
     * @returns The job.
     */
    async enqueue(
        {
            transactionId,
            userId,
            courseId,
            jobId,
        }: EnqueueEnrollJobParams,
    ) {
        // get the job record
        let job: JobEntity | null = null
        if (jobId) {
            // requeue the job
            job = await this.jobStalledService.requeueJob(
                {
                    id: jobId,
                }
            )
        } else {
            // create a new job record
            job = await this.jobActionService.createJob({
                id: uuidv4(),
                userId,
                actionType: ActionType.Enroll,
                maxSteps: envConfig().job.enroll.maxSteps,
                payload: this.superJson.stringify(
                    {
                        transactionId,
                        userId,
                        courseId,
                    }
                ),
            })
        }
        // push the job to the broker — AWAITED (not fire-and-forget): this runs on
        // the payment-finalize path, so returning before the broker job exists would
        // strand a paid transaction with no enroll job (and the gateway, already
        // 2xx'd, never retries). On failure mark the job failed AND rethrow so the
        // caller (webhook) returns non-2xx and the gateway re-delivers.
        try {
            await sleepEnqueueUxDelay()
            await this.enrollQueue.add(
                job.id,
                job.payload,
                {
                    jobId: job.id,
                },
            )
        } catch (error) {
            await this.jobActionService.failJob({
                job,
                error: `Failed to enqueue job to broker: ${error?.message ?? "unknown error"}`,
            })
            throw error
        }
        return job
    }
}