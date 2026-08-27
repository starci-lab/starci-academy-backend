import {
    InjectQueue
} from "@nestjs/bullmq"
import {
    Injectable
} from "@nestjs/common"
import {
    Interval
} from "@nestjs/schedule"
import {
    Queue
} from "bullmq"
import {
    randomUUID
} from "node:crypto"
import {
    EntityManager
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    MockInterviewGradingJobEntity
} from "@modules/databases/postgresql/primary/entities/mock-interview-grading-job.entity"
import {
    bullData
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    GradeMockInterviewSessionPayload
} from "@modules/integrations/bullmq/types/payloads/grade-mock-interview-session"

const DISPATCH_INTERVAL_MS = 2000

@Injectable()
/** Leases durable PostgreSQL rows and publishes pointer-only BullMQ messages. */
export class MockInterviewGradingJobDispatcherService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager,
        @InjectQueue(bullData[BullQueueName.GradeMockInterviewSession].name)
        private readonly queue: Queue<GradeMockInterviewSessionPayload>,
    ) {}

    @Interval(DISPATCH_INTERVAL_MS)
    async dispatch(): Promise<void> {
        const leaseToken = randomUUID()
        const rows = await this.entityManager.query<Array<{ id: string }>>(`
            WITH candidate AS (
                SELECT id
                FROM mock_interview_grading_jobs
                WHERE attempt_count < max_attempts
                  AND available_at <= CURRENT_TIMESTAMP
                  AND (
                    status IN ('queued', 'retry_scheduled')
                    OR (status = 'leased' AND lease_expires_at <= CURRENT_TIMESTAMP)
                  )
                ORDER BY available_at, created_at
                FOR UPDATE SKIP LOCKED
                LIMIT 10
            )
            UPDATE mock_interview_grading_jobs AS job
            SET status = 'leased',
                lease_token = $1,
                lease_expires_at = CURRENT_TIMESTAMP + interval '5 minutes',
                last_dispatched_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            FROM candidate
            WHERE job.id = candidate.id
            RETURNING job.id AS "id"
        `,
        [leaseToken])

        await Promise.all(rows.map(async (job) => {
            try {
                await this.queue.add("grade",
                    {
                        gradingJobId: job.id, leaseToken
                    },
                    {
                        jobId: `${job.id}-${leaseToken}`
                    })
            } catch (error) {
                await this.entityManager.createQueryBuilder()
                    .update(MockInterviewGradingJobEntity)
                    .set({
                        status: "retry_scheduled",
                        leaseToken: null,
                        leaseExpiresAt: null,
                        availableAt: new Date(Date.now() + DISPATCH_INTERVAL_MS),
                        lastError: error instanceof Error ? error.message : String(error),
                    })
                    .where("id = :id AND lease_token = :leaseToken",
                        {
                            id: job.id, leaseToken
                        })
                    .execute()
            }
        }))
    }
}
