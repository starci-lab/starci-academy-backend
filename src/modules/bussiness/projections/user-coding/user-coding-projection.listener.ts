import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    KafkaService,
} from "@modules/integrations/kafka/kafka.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    AbstractProjectionListener,
} from "@modules/platform/projection/abstract-projection.listener"
import type {
    ProjectionCdcMessage,
} from "@modules/platform/projection/types"
import {
    UserCodingProjectionService,
} from "./user-coding-projection.service"
import type {
    CodingSubmissionCdcRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `user_coding_projections` fresh -- a new coding
 * submission rebuilds the submitter's coding aggregate (skills + history). The
 * projection's TTL lazy-refresh is the fallback. Connection + per-message safety
 * are owned by {@link AbstractProjectionListener}.
 */
export class UserCodingProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group -> restarts resume from the committed offset. */
    protected readonly groupId = "user-coding-projection"

    /** Coding-submission changes move the submitter's coding aggregate. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}coding_submissions`,
    ]

    constructor(
        kafkaService: KafkaService,
        winstonService: WinstonService,
        private readonly userCodingProjectionService: UserCodingProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService,
            winstonService)
    }

    /**
     * A coding submission touches only its submitter. Returns the user id, or
     * empty to skip.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user id (0-1).
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
