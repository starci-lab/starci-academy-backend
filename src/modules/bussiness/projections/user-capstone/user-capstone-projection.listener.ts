import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    KafkaService,
} from "@modules/kafka"
import {
    AbstractProjectionListener,
    type ProjectionCdcMessage,
} from "@modules/projection"
import {
    UserCapstoneProjectionService,
} from "./user-capstone-projection.service"
import type {
    CapstoneEnrollmentUserIdRow,
    MilestoneTaskAttemptCdcRow,
} from "./types"

/**
 * CDC consumer that keeps `user_capstone_projections` fresh — a new milestone-task
 * attempt rebuilds the owner's capstone aggregate. The attempts row carries only
 * `user_milestone_task_id`, so the owning user id is resolved via
 * `user_milestone_tasks → enrollments`. TTL lazy-refresh is the fallback.
 */
@Injectable()
export class UserCapstoneProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "user-capstone-projection"

    /** Milestone-task attempts move the owner's capstone aggregate. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}user_milestone_task_attempts`,
    ]

    constructor(
        kafkaService: KafkaService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userCapstoneProjectionService: UserCapstoneProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * Resolve the owning user id from the attempt's `user_milestone_task_id`
     * (via user_milestone_tasks → enrollments). Returns 0–1 user ids.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user id(s).
     */
    protected async deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Promise<Array<string>> {
        const attemptRow = row as MilestoneTaskAttemptCdcRow
        if (!attemptRow.user_milestone_task_id) {
            return []
        }
        // the attempts table has no user_id → walk up to the enrollment's owner
        const found = await this.entityManager.query<Array<CapstoneEnrollmentUserIdRow>>(
            `
            SELECT e.user_id
            FROM user_milestone_tasks umt
            JOIN enrollments e ON e.id = umt.enrollment_id
            WHERE umt.id = $1
            LIMIT 1
            `,
            [
                attemptRow.user_milestone_task_id,
            ],
        )
        return found[0]?.user_id ? [
            found[0].user_id,
        ] : []
    }

    /**
     * Recompute the owner's capstone aggregate.
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.userCapstoneProjectionService.recompute({
            userId,
        })
    }
}
