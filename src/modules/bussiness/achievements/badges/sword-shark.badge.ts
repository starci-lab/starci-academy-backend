import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractBadge,
} from "./abstract-badge"

/**
 * Distinct challenges passed: max attempt score per submission, summed per
 * challenge, counted when it reaches the challenge's pass score.
 */
@Injectable()
export class SwordSharkBadge extends AbstractBadge {
    readonly slug = "sword-shark"

    getSql(): string {
        return `(
            WITH per_submission_max AS (
                SELECT cs.challenge_id,
                       cs.id AS submission_id,
                       COALESCE(MAX(a.score), 0) AS max_score
                FROM user_challenge_submissions ucs
                JOIN challenge_submissions cs ON cs.id = ucs.submission_id
                LEFT JOIN user_challenge_submission_attempts a
                    ON a.user_challenge_submission_id = ucs.id
                WHERE ucs.user_id = $1
                GROUP BY cs.challenge_id, cs.id
            ),
            per_challenge AS (
                SELECT challenge_id, SUM(max_score) AS challenge_score
                FROM per_submission_max
                GROUP BY challenge_id
            )
            SELECT COUNT(*)
            FROM per_challenge pc
            JOIN challenges c ON c.id = pc.challenge_id
            WHERE pc.challenge_score >= c.score AND c.score > 0
        )`
    }
}
