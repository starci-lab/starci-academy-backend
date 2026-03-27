import {
    InjectPrimaryPostgresqlEntityManager,
    JobEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
    FindOptionsWhere,
} from "typeorm"
import type {
    JobTargetParams,
} from "./types"
import {
    JobNotFoundException,
    JobTargetRequiredException,
} from "@modules/exceptions"

/**
 * Shared utilities for job services (manager resolving + job lookup).
 */
@Injectable()
export class JobCommonService {
    constructor(
        @InjectPrimaryPostgresqlEntityManager()
        private readonly primaryEntityManager: EntityManager,
    ) {}

    /**
     * Resolve entity manager (transactional manager takes precedence).
     *
     * @param param - Optional transactional entity manager.
     * @returns Effective entity manager.
     */
    getManager({
        entityManager,
    }: {
        entityManager?: EntityManager
    }): EntityManager {
        return entityManager ?? this.primaryEntityManager
    }

    /**
     * Find a job by id or (queueName + bullmqJobId), throw when missing.
     *
     * @param param - Target selector and optional transactional entity manager.
     * @returns Existing job record.
     */
    async getJobOrThrow({
        entityManager,
        ...target
    }: JobTargetParams): Promise<JobEntity> {
        const manager = this.getManager({
            entityManager,
        })
        const where = this.buildWhere(target)
        const job = await manager.findOne(
            JobEntity,
            {
                where,
            },
        )
        if (!job) {
            throw new JobNotFoundException({
                jobId: target.id ?? "",
            })
        }
        return job
    }

    private buildWhere({
        id,
        queueName,
        bullmqJobId,
    }: Omit<JobTargetParams, "entityManager">): FindOptionsWhere<JobEntity> {
        if (id) {
            return {
                id,
            }
        }
        if (!queueName || !bullmqJobId) {
            throw new JobTargetRequiredException({
                queueName,
                bullmqJobId,
            })
        }
        return {
            queueName,
            bullmqJobId,
        }
    }
}
