import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    ListLearnerCmsParams,
    PaginatedLearnerCmsResult,
    ChallengeSubmissionAttemptResult,
    ChallengeSubmissionAttemptRow,
    CountRow,
} from "./types"

@Injectable()
/**
 * Learner-CMS read service for the current user's challenge-submission attempts.
 *
 * This is a PLAIN paginated list keyed by the viewer (the LIST exception), so it
 * reads the live tables directly via the primary {@link EntityManager} rather
 * than a CQRS projection. The join chain mirrors the solved-challenges
 * projection's recompute, extended up to the course:
 *
 *   user_challenge_submission_attempts (ucsa)
 *     -> user_challenge_submissions (ucs, ucsa.user_challenge_submission_id)
 *     -> challenge_submissions (cs, ucs.submission_id)
 *     -> challenges (ch, cs.challenge_id)           [LEFT -- V1 rows may lack it]
 *     -> contents (co, ch.content_id)
 *     -> modules (mo, co.module_id)
 *     -> courses (c, mo.course_id)
 *
 * Status is derived from the attempt's grading state: not-yet-processed ->
 * "pending", graded with a positive score -> "passed", otherwise "failed".
 */
export class ChallengeSubmissionsCmsService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Page over the user's challenge-submission attempts (newest first).
     *
     * @param params - {@link ListLearnerCmsParams}
     * @returns the page of attempts plus the user's total attempt count.
     */
    async list(
        {
            userId,
            limit,
            offset,
        }: ListLearnerCmsParams,
    ): Promise<PaginatedLearnerCmsResult<ChallengeSubmissionAttemptResult>> {
        // run the page query and the total count together -- both hit the same
        // index on ucs.user_id, so doing them in parallel halves the latency
        const [
            rows,
            countRows,
        ] = await Promise.all([
            // page: flatten the attempt with its challenge + course titles, ordered
            // newest-first (created_at), windowed by limit/offset
            this.entityManager.query(
                this.buildPageSql(),
                [
                    userId,
                    limit,
                    offset,
                ],
            ) as Promise<Array<ChallengeSubmissionAttemptRow>>,
            // total: count every attempt owned by the user (ignores the page window)
            this.entityManager.query(
                this.buildCountSql(),
                [
                    userId,
                ],
            ) as Promise<Array<CountRow>>,
        ])
        return {
            // map each raw SQL row into the typed result the resolver expects
            items: rows.map((row) => ({
                id: row.id,
                challengeTitle: row.challenge_title,
                courseTitle: row.course_title,
                courseId: row.course_id,
                // collapse the grading state into the contract's status bucket
                status: this.deriveStatus(row.score,
                    row.processed_at),
                // an ungraded attempt has a null score -> surface 0 to the FE
                score: row.score ?? 0,
                selectedLang: row.selected_lang ?? null,
                submissionUrl: row.submission_url ?? null,
                submittedAt: row.submitted_at,
            })),
            // the count query returns a single row with a text-encoded bigint
            total: Number(countRows[0]?.total ?? 0),
        }
    }

    /**
     * Collapse an attempt's grading state into the contract status bucket.
     *
     * @param score - the attempt score (null when not yet graded).
     * @param processedAt - when grading finished (null while still pending).
     * @returns "pending" | "passed" | "failed".
     */
    private deriveStatus(
        score: number | null,
        processedAt: Date | null,
    ): string {
        // grading has not finished yet -> the attempt is still pending
        if (!processedAt) {
            return "pending"
        }
        // graded with a positive score -> passed (mirrors the solved-challenges rule)
        if ((score ?? 0) > 0) {
            return "passed"
        }
        // graded but no positive score -> failed
        return "failed"
    }

    /**
     * Build the page SQL -- one row per attempt with its challenge + course titles,
     * newest-first, windowed by `$2` (limit) / `$3` (offset) for user `$1`.
     *
     * @returns the parameterised page SQL.
     */
    private buildPageSql(): string {
        return `
            SELECT
                ucsa.id            AS id,
                COALESCE(ch.title, cs.title) AS challenge_title,
                c.title            AS course_title,
                c.id               AS course_id,
                ucsa.score         AS score,
                ucsa.processed_at  AS processed_at,
                ucs.selected_lang  AS selected_lang,
                ucsa.submission_url AS submission_url,
                ucsa.created_at    AS submitted_at
            FROM user_challenge_submission_attempts ucsa
            JOIN user_challenge_submissions ucs ON ucs.id = ucsa.user_challenge_submission_id
            JOIN challenge_submissions cs ON cs.id = ucs.submission_id
            LEFT JOIN challenges ch ON ch.id = cs.challenge_id
            LEFT JOIN contents co ON co.id = ch.content_id
            LEFT JOIN modules mo ON mo.id = co.module_id
            LEFT JOIN courses c ON c.id = mo.course_id
            WHERE ucs.user_id = $1
            ORDER BY ucsa.created_at DESC
            LIMIT $2 OFFSET $3
        `
    }

    /**
     * Build the count SQL -- every attempt owned by user `$1` (no page window).
     *
     * @returns the parameterised count SQL.
     */
    private buildCountSql(): string {
        return `
            SELECT COUNT(*) AS total
            FROM user_challenge_submission_attempts ucsa
            JOIN user_challenge_submissions ucs ON ucs.id = ucsa.user_challenge_submission_id
            WHERE ucs.user_id = $1
        `
    }
}
