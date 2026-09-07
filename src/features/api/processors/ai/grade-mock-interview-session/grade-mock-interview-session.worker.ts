import {
    Processor, WorkerHost
} from "@nestjs/bullmq"
import {
    Job
} from "bullmq"
import {
    EntityManager
} from "typeorm"
import {
    envConfig
} from "@modules/platform/env/config"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    MockInterviewGradingJobEntity
} from "@modules/databases/postgresql/primary/entities/mock-interview-grading-job.entity"
import {
    MockInterviewSessionEntity
} from "@modules/databases/postgresql/primary/entities/mock-interview-session.entity"
import {
    bullData
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    GradeMockInterviewSessionPayload
} from "@modules/integrations/bullmq/types/payloads/grade-mock-interview-session"
import {
    MockInterviewGradingService
} from "../../../core/graphql/mutations/interview/grade-mock-interview-session/grade-mock-interview-session-grading.service"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"

@Processor(bullData[BullQueueName.GradeMockInterviewSession].name,
    {
        concurrency: envConfig().bullmq.aiConcurrency,
        lockDuration: envConfig().bullmq.lockDuration,
        stalledInterval: envConfig().bullmq.stalledInterval,
        maxStalledCount: envConfig().bullmq.maxStalledCount,
    })
/** Claims one leased durable job and grades its persisted server transcript idempotently. */
export class GradeMockInterviewSessionWorker extends WorkerHost {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager,
        private readonly gradingService: MockInterviewGradingService,
    ) { super() }

    async process(job: Job<GradeMockInterviewSessionPayload>): Promise<void> {
        const claimed = await this.entityManager.createQueryBuilder()
            .update(MockInterviewGradingJobEntity)
            .set({
                attemptCount: () => "\"attempt_count\" + 1"
            })
            .where("id = :id",
                {
                    id: job.data.gradingJobId
                })
            .andWhere("status = 'leased' AND lease_token = :leaseToken",
                {
                    leaseToken: job.data.leaseToken
                })
            .execute()
        if (claimed.affected !== 1) {
            return
        }
        const gradingJob = await this.entityManager.findOneOrFail(MockInterviewGradingJobEntity,
            {
                where: {
                    id: job.data.gradingJobId
                },
            })
        const session = await this.entityManager.findOneOrFail(MockInterviewSessionEntity,
            {
                where: {
                    id: gradingJob.sessionId
                },
                relations: {
                    enrollment: {
                        user: true, course: true
                    }
                },
            })
        try {
            await this.gradingService.grade({
                userId: session.enrollment.user.id,
                courseId: session.enrollment.course.id,
                promptId: session.promptId,
                promptTitle: session.promptTitle,
                level: session.level,
                turns: (session.turns ?? []).map((turn) => ({
                    ...turn,
                    phase: turn.phase as MockInterviewPhase,
                })),
                sessionId: session.id,
                locale: session.locale ?? Locale.En,
                selectedModel: gradingJob.selectedModel ?? undefined,
                selectedModelProvider: gradingJob.selectedModelProvider as ModelProvider | undefined,
            })
        } catch (error) {
            const terminal = gradingJob.attemptCount >= gradingJob.maxAttempts
            await this.entityManager.transaction(async (manager) => {
                await manager.update(MockInterviewGradingJobEntity,
                    {
                        id: gradingJob.id
                    },
                    {
                        status: terminal ? "failed" : "retry_scheduled",
                        availableAt: new Date(Date.now() + Math.min(60_000,
                            1000 * 2 ** gradingJob.attemptCount)),
                        leaseToken: null,
                        leaseExpiresAt: null,
                        lastError: error instanceof Error ? error.message : String(error),
                    })
                await manager.createQueryBuilder()
                    .update(MockInterviewSessionEntity)
                    .set({
                        status: terminal ? "grading_failed" : "grading", revision: () => "\"revision\" + 1"
                    })
                    .where("id = :id AND status = 'grading'",
                        {
                            id: session.id
                        })
                    .execute()
            })
            throw error
        }
    }
}
