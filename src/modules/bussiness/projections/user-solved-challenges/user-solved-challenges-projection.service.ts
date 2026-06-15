import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserSolvedChallengesProjectionEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import type {
    RecomputeUserSolvedChallengesParams,
    UserSolvedChallengeResult,
    UserSolvedChallengeValue,
} from "./types"

/**
 * CQRS projection service for a user's passed challenge submissions (with their
 * submitted git / docs link). The DISTINCT-ON join over
 * `user_challenge_submission_attempts` runs ONLY in {@link recompute}, folding
 * `{ challenges: [...] }` (newest-first) into the jsonb `value` keyed by user.
 * {@link getChallenges} reads the flat row with a TTL lazy-refresh; the CDC
 * listener keeps it fresh on new passing attempts.
 */
@Injectable()
export class UserSolvedChallengesProjectionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Recompute + upsert the solved-challenges aggregate for one user (idempotent).
     *
     * @param params - {@link RecomputeUserSolvedChallengesParams}
     */
    async recompute(
        {
            userId,
            entityManager,
        }: RecomputeUserSolvedChallengesParams,
    ): Promise<void> {
        const manager = entityManager ?? this.entityManager
        await manager.query(
            this.buildUpsertSql(),
            [
                userId,
            ],
        )
    }

    /**
     * Read a user's passed challenge submissions (newest first), TTL lazy-refreshed.
     *
     * @param userId - the user to read.
     * @returns the passed challenge submissions with their links.
     */
    async getChallenges(userId: string): Promise<Array<UserSolvedChallengeResult>> {
        let row = await this.entityManager.findOne(
            UserSolvedChallengesProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        // missing / past freshness window → recompute + re-read
        if (!row || this.isStale(row.updatedAt)) {
            await this.recompute({
                userId,
            })
            row = await this.entityManager.findOne(
                UserSolvedChallengesProjectionEntity,
                {
                    where: {
                        userId,
                    },
                },
            )
        }
        const challenges = (row?.value?.challenges as Array<UserSolvedChallengeValue> | undefined) ?? []
        // map the stored ISO string back to a Date (already newest-first in jsonb)
        return challenges.map((challenge) => ({
            title: challenge.title,
            submissionUrl: challenge.submissionUrl,
            submissionType: challenge.submissionType,
            selectedLang: challenge.selectedLang ?? null,
            passedAt: challenge.passedAt ? new Date(challenge.passedAt) : null,
        }))
    }

    /**
     * Whether a projection row is past its freshness window.
     *
     * @param updatedAt - the row's last write time.
     * @returns true when older than the configured TTL.
     */
    private isStale(updatedAt: Date): boolean {
        return Date.now() - updatedAt.getTime() > envConfig().projection.staleAfterMs
    }

    /**
     * Build the solved-challenges UPSERT — one row per passed submission (latest
     * passing attempt: score > 0 + graded, via DISTINCT ON), folded newest-first
     * into `value.challenges` for the single user `$1`.
     *
     * @returns the parameterised UPSERT SQL.
     */
    private buildUpsertSql(): string {
        return `
            INSERT INTO user_solved_challenges_projections (user_id, value)
            SELECT $1::uuid, jsonb_build_object('challenges', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'title',          t.title,
                        'submissionUrl',  t.submission_url,
                        'submissionType', t.submission_type,
                        'selectedLang',   t.selected_lang,
                        'passedAt',       t.passed_at
                    ) ORDER BY t.passed_at DESC NULLS LAST
                )
                FROM (
                    SELECT DISTINCT ON (ucs.id)
                           cs.title          AS title,
                           ucs.submission_url AS submission_url,
                           cs.type::text     AS submission_type,
                           ucs.selected_lang AS selected_lang,
                           ucsa.processed_at AS passed_at
                    FROM user_challenge_submissions ucs
                    JOIN challenge_submissions cs ON cs.id = ucs.submission_id
                    JOIN user_challenge_submission_attempts ucsa ON ucsa.user_challenge_submission_id = ucs.id
                    WHERE ucs.user_id = $1
                      AND ucsa.score > 0
                      AND ucsa.processed_at IS NOT NULL
                    ORDER BY ucs.id, ucsa.processed_at DESC
                ) t
            ), '[]'::jsonb))
            ON CONFLICT (user_id) DO UPDATE SET
                value      = EXCLUDED.value,
                updated_at = now()
        `
    }
}
