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
    UserSolvedChallengesProjectionService,
} from "./user-solved-challenges-projection.service"
import type {
    ChallengeSubmissionAttemptCdcRow,
    SolvedSubmissionUserIdRow,
} from "./types"

@Injectable()
/**
 * CDC consumer that keeps `user_solved_challenges_projections` fresh — a new
 * challenge-submission attempt rebuilds the owner's solved-challenges aggregate.
 * The attempts row carries only `user_challenge_submission_id`, so the owning
 * user id is resolved via `user_challenge_submissions`. TTL lazy-refresh is the
 * fallback.
 */
export class UserSolvedChallengesProjectionListener extends AbstractProjectionListener<string> {
    /** Stable group → restarts resume from the committed offset. */
    protected readonly groupId = "user-solved-challenges-projection"

    /** Challenge-submission attempts move the owner's solved-challenges aggregate. */
    protected readonly topics = [
        `${envConfig().kafka.cdcTopicPrefix}user_challenge_submission_attempts`,
    ]

    constructor(
        kafkaService: KafkaService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userSolvedChallengesProjectionService: UserSolvedChallengesProjectionService,
    ) {
        // base owns the Kafka wiring
        super(kafkaService)
    }

    /**
     * Resolve the owning user id from the attempt's `user_challenge_submission_id`.
     * Returns 0–1 user ids.
     *
     * @param message - {@link ProjectionCdcMessage}
     * @returns the affected user id(s).
     */
    protected async deriveTargets(
        {
            row,
        }: ProjectionCdcMessage,
    ): Promise<Array<string>> {
        const attemptRow = row as ChallengeSubmissionAttemptCdcRow
        if (!attemptRow.user_challenge_submission_id) {
            return []
        }
        // the attempts table has no user_id → look up the owning submission
        const found = await this.entityManager.query<Array<SolvedSubmissionUserIdRow>>(
            `
            SELECT user_id
            FROM user_challenge_submissions
            WHERE id = $1
            LIMIT 1
            `,
            [
                attemptRow.user_challenge_submission_id,
            ],
        )
        return found[0]?.user_id ? [
            found[0].user_id,
        ] : []
    }

    /**
     * Recompute the owner's solved-challenges aggregate.
     *
     * @param userId - the affected user id.
     */
    protected async recomputeTarget(userId: string): Promise<void> {
        await this.userSolvedChallengesProjectionService.recompute({
            userId,
        })
    }
}
