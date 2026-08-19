import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    JobStalledService,
} from "../atomic/job-stalled.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    TransactionItemEntity,
} from "@modules/databases/postgresql/primary/entities/transaction-item.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    InstallmentPlanService,
} from "../../installment-plan/installment-plan.service"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
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
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    EnqueueEnrollJobParams,
    EnqueueEnrollmentsForTransactionParams,
    EnqueueEnrollmentsForTransactionResult,
} from "../types/enqueue"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    sleepEnqueueUxDelay,
} from "../utils/enqueue-ux-delay"

@Injectable()
/**
 * Service for enqueuing an enroll job.
 */
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
        private readonly installmentPlanService: InstallmentPlanService,
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
        // multi-course order -> the courses live in transaction_items (transaction.course is null)
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
        // resolve the course ids of this order (multi-course items, else the single
        // course on the transaction) -- drives both the per-course enroll fan-out AND
        // the installment plan's `lockedCourseIds` (all courses gated together)
        let courseIds: Array<string>
        if (items.length > 0) {
            courseIds = items.map((item) => item.courseId)
        } else {
            courseIds = transaction.courseId ? [transaction.courseId] : []
        }
        // neither items nor a course -> malformed Enroll transaction; let the caller surface it
        if (courseIds.length === 0) {
            return {
                enqueuedCount: 0,
            }
        }
        // enqueue sequentially (AWAITED per line) so a broker failure propagates:
        // the webhook then returns non-2xx and the gateway re-delivers -> no line stranded.
        // Each enroll job is idempotent per (user, course), so a re-delivery is safe.
        for (const courseId of courseIds) {
            await this.enqueue({
                userId: transaction.userId,
                courseId,
                transactionId: transaction.id,
            })
        }
        // installment (installment plan) first cycle: create the Fixed plan ONCE per paid
        // checkout (the enroll jobs above grant access; this only records the
        // schedule + gated courses). Idempotent against re-delivery (webhook + poll)
        // by the plan's unique origin transaction.
        await this.createInstallmentPlanIfNeeded(transaction,
            courseIds)
        return {
            enqueuedCount: courseIds.length,
        }
    }

    /**
     * When a paid Enroll transaction carries installment intent (the buyer chose
     * installment plan at checkout), create its `Fixed` {@link InstallmentPlanEntity} --
     * exactly once. A no-op for a one-shot purchase (no `installmentMonths`) or a
     * re-delivered confirmation (a plan already exists for this origin transaction).
     *
     * @param transaction - The paid Enroll transaction (carries the installment snapshot).
     * @param lockedCourseIds - Every course this plan gates access to (locked/unlocked together).
     */
    private async createInstallmentPlanIfNeeded(
        transaction: EnqueueEnrollmentsForTransactionParams["transaction"],
        lockedCourseIds: Array<string>,
    ): Promise<void> {
        if (!transaction.installmentMonths || !transaction.installmentTotalVnd) {
            return
        }
        const existing = await this.entityManager.findOne(
            InstallmentPlanEntity,
            {
                where: {
                    originTransaction: {
                        id: transaction.id,
                    },
                },
            },
        )
        if (existing) {
            return
        }
        await this.installmentPlanService.createFixedPlan({
            userId: transaction.userId,
            originTransactionId: transaction.id,
            lockedCourseIds,
            totalAmountVnd: transaction.installmentTotalVnd,
            months: transaction.installmentMonths,
            markupPercent: transaction.installmentMarkupPercent ?? 0,
        })
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
        // push the job to the broker -- AWAITED (not fire-and-forget): this runs on
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