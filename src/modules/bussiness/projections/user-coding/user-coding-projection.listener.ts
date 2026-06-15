import {
    Injectable,
} from "@nestjs/common"
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
    UserCodingProjectionService,
} from "./user-coding-projection.service"

/** CDC row from `coding_submissions` (a submission moves the submitter's coding aggregate). */
interface CodingSubmissionCdcRow {
    /** The user who submitted. */
    user_id?: string
}

/**
 * CDC consumer that keeps `user_coding_projections` fresh — a new coding
 * submission rebuilds the submitter's coding aggregate (skills + history). The
 * projection's TTL lazy-refresh is the fallback. Connection + per-message safety
 * are owned by {@link AbstractProjectionListener}.
 */
@Injectable()
export class UserCodingProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "user-coding-projection"

    /** Coding-submission changes move the submitter's coding aggregate. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}coding_submissions`,
    ]

    constructor(
        kafkaService: KafkaService,
        private readonly userCodingProjectionService: UserCodingProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * A coding submission touches only its submitter. Returns the user id, or
     * empty to skip.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user id (0–1).
     */
    protected deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Array<string> {
        const submissionRow = row as CodingSubmissionCdcRow
        if (!submissionRow.user_id) {
            return []
        }
        return [
            submissionRow.user_id,
        ]
    }

    /**
     * Recompute the submitter's coding aggregate (skills + history).
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.userCodingProjectionService.recompute({
            userId,
        })
    }
}
