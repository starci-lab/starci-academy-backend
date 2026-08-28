import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    GetOwnedJobStatusParams,
    JobStatusReadModel,
} from "../types/job"

const SAFE_FAILURE_REASON = "The job could not be completed. You can retry the original action."

@Injectable()
/** Owns the safe durable read model shared by GraphQL and Socket.IO. */
export class JobStatusReadService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /** Read a job only when the authenticated user owns it. */
    async getOwned(
        params: GetOwnedJobStatusParams,
    ): Promise<JobStatusReadModel | null> {
        const job = await this.entityManager.findOne(
            JobEntity,
            {
                where: {
                    id: params.jobId,
                    userId: params.userId,
                },
            },
        )
        return job ? this.toReadModel(job) : null
    }

    /** Internal publication read; room membership was owner-authorized earlier. */
    async getForPublication(jobId: string): Promise<JobStatusReadModel | null> {
        const job = await this.entityManager.findOne(
            JobEntity,
            {
                where: {
                    id: jobId,
                },
            },
        )
        return job ? this.toReadModel(job) : null
    }

    /** Remove payload and raw worker errors from the external contract. */
    private toReadModel(job: JobEntity): JobStatusReadModel {
        const resultKind = job.refs?.resultKind
        const resultId = job.refs?.resultId
        const status = resultKind !== undefined && resultId !== undefined
            ? JobStatus.Completed
            : job.status
        return {
            jobId: job.id,
            status,
            category: job.category,
            actionType: job.actionType,
            currentStep: job.currentStep,
            maxSteps: job.maxSteps,
            updatedAt: job.updatedAt,
            retryable: status === JobStatus.Failed,
            failureReason: status === JobStatus.Failed
                ? SAFE_FAILURE_REASON
                : null,
            result: resultKind !== undefined && resultId !== undefined
                ? {
                    kind: resultKind,
                    id: resultId,
                }
                : null,
        }
    }
}
