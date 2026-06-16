import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    ChallengeEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    toGlobalId,
} from "@modules/routing"
import type {
    ChallengeIdRow,
    LeaderboardRow,
    ViewerPassedRow,
    WeekEndRow,
    WeeklyChallenge,
    WeeklyChallengeEntry,
} from "./types"

/** Max leaderboard rows returned for the weekly challenge. */
const LEADERBOARD_LIMIT = 10

/**
 * Read-only weekly-challenge event. Deterministically picks ONE challenge for the
 * current ISO week (challenges ordered by id ASC, index = ISO-week-number % count)
 * and reports who passed it this week. A "pass" mirrors the solved-challenges
 * projection: a `user_challenge_submission_attempts` row with `score > 0` and a
 * non-null `processed_at`, here filtered to the current ISO-week window. No write
 * path — the rotation is a pure function of the calendar, so nothing is stored.
 */
@Injectable()
export class WeeklyChallengeService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Resolve the current week's challenge event for a viewer.
     *
     * @param viewerId - the authed viewer id, or null when anonymous.
     * @returns the weekly-challenge view, or null when there are no challenges.
     */
    async getWeeklyChallenge(viewerId: string | null): Promise<WeeklyChallenge | null> {
        // count the candidate pool (all challenges, ordered by id ASC)
        const total = await this.entityManager.count(ChallengeEntity)
        if (total === 0) {
            return null
        }

        // deterministic pick: index = ISO-week-number % count, over id-ASC order.
        // ISO week number is computed in SQL (Postgres ISO 8601 'IW') so the FE/BE
        // agree on the boundary; OFFSET selects the chosen row.
        const picked = await this.entityManager.query<Array<ChallengeIdRow>>(
            `
            SELECT c.id, c.title
            FROM challenges c
            ORDER BY c.id ASC
            OFFSET (EXTRACT(WEEK FROM now())::int % $1)
            LIMIT 1
            `,
            [
                total,
            ],
        )
        if (picked.length === 0) {
            return null
        }
        const challenge = picked[0]

        // end of the current ISO week = Monday-start + 7 days - 1ms (Sunday 23:59:59.999)
        const weekEndRow = await this.entityManager.query<Array<WeekEndRow>>(
            "SELECT (date_trunc('week', now()) + interval '7 days' - interval '1 millisecond') AS week_end",
        )
        const weekEndAt = new Date(weekEndRow[0].week_end)

        // passers this week: latest passing attempt per user-submission for THIS
        // challenge, with processed_at inside the current ISO week, newest first
        const passerRows = await this.entityManager.query<Array<LeaderboardRow>>(
            `
            SELECT t.username, t.avatar, t.passed_at
            FROM (
                SELECT DISTINCT ON (ucs.id)
                       u.username AS username,
                       u.avatar   AS avatar,
                       ucsa.processed_at AS passed_at
                FROM user_challenge_submissions ucs
                JOIN challenge_submissions cs ON cs.id = ucs.submission_id
                JOIN users u ON u.id = ucs.user_id
                JOIN user_challenge_submission_attempts ucsa
                  ON ucsa.user_challenge_submission_id = ucs.id
                WHERE cs.challenge_id = $1
                  AND ucsa.score > 0
                  AND ucsa.processed_at IS NOT NULL
                  AND ucsa.processed_at >= date_trunc('week', now())
                  AND ucsa.processed_at <  date_trunc('week', now()) + interval '7 days'
                ORDER BY ucs.id, ucsa.processed_at DESC
            ) t
            ORDER BY t.passed_at DESC
            `,
            [
                challenge.id,
            ],
        )

        const passedCount = passerRows.length
        const leaderboard: Array<WeeklyChallengeEntry> = passerRows
            .slice(0,
                LEADERBOARD_LIMIT)
            .map((row) => ({
                username: row.username ?? "",
                avatar: row.avatar,
                passedAt: new Date(row.passed_at),
            }))

        // whether THIS viewer is among the passers (false for anonymous)
        const viewerPassed = viewerId
            ? await this.didViewerPass(challenge.id,
                viewerId)
            : false

        return {
            challengeGlobalId: toGlobalId(ChallengeEntity.name,
                challenge.id),
            title: challenge.title,
            weekEndAt,
            viewerPassed,
            passedCount,
            leaderboard,
        }
    }

    /**
     * Whether a viewer passed a given challenge within the current ISO week.
     *
     * @param challengeId - the picked challenge id.
     * @param viewerId - the viewer id.
     * @returns true when a qualifying passing attempt exists this week.
     */
    private async didViewerPass(
        challengeId: string,
        viewerId: string,
    ): Promise<boolean> {
        const rows = await this.entityManager.query<Array<ViewerPassedRow>>(
            `
            SELECT EXISTS (
                SELECT 1
                FROM user_challenge_submissions ucs
                JOIN challenge_submissions cs ON cs.id = ucs.submission_id
                JOIN user_challenge_submission_attempts ucsa
                  ON ucsa.user_challenge_submission_id = ucs.id
                WHERE cs.challenge_id = $1
                  AND ucs.user_id = $2
                  AND ucsa.score > 0
                  AND ucsa.processed_at IS NOT NULL
                  AND ucsa.processed_at >= date_trunc('week', now())
                  AND ucsa.processed_at <  date_trunc('week', now()) + interval '7 days'
            ) AS ok
            `,
            [
                challengeId,
                viewerId,
            ],
        )
        return Boolean(rows[0]?.ok)
    }
}
