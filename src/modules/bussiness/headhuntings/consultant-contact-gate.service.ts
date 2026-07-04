import {
    Injectable,
} from "@nestjs/common"
import {
    ConsultantEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import {
    CV_SCORE_UNLOCK_THRESHOLD,
} from "./constants"
import type {
    GetBestCvScoreParams,
    MaxCvScoreRow,
} from "./types"

/**
 * Gates a consultant's direct contact details (email / phone / Zalo /
 * LinkedIn) behind the requesting viewer's best-ever CV score. Below
 * {@link CV_SCORE_UNLOCK_THRESHOLD}, the contact fields are nulled out
 * server-side — never sent over the wire — so a headhunter's phone number
 * cannot be scraped by an anonymous or low-scoring viewer.
 *
 * Applied by the `headhuntingCompany(ies)` / `consultant(s)` query handlers,
 * which fetch consultant documents from Elasticsearch and pass each one
 * through {@link gateConsultant} before returning it to the client.
 */
@Injectable()
export class ConsultantContactGateService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Computes the viewer's best-ever CV score across ALL of their scored CVs,
     * reading the UNIFIED `cv_generations` table as the source of truth while
     * remaining UNION-safe during the WF-03c migration window.
     *
     * **UNION-safe:** the score is `GREATEST(MAX(unified score), MAX(legacy
     * attempt score))` so no viewer ever loses their gate score while legacy
     * `cv_submission_attempts` rows are being backfilled into the unified table.
     * Each side's `MAX()` ignores null (unscored) rows; `COALESCE(..., -1)`
     * keeps a fully-empty side from suppressing the other, and the outer result
     * clamps to `0`.
     *
     * TODO(retire-legacy-cv): once the WF-03c backfill migration has run in prod
     * AND a count check confirms every legacy scored attempt now has a matching
     * unified `cv_generations` row (same user, score carried over), drop the
     * legacy `cv_submission_attempts` sub-select below and gate on the unified
     * table alone. Mirror marker in `JobReadinessService.computeCvScore`.
     *
     * @param params - The viewer to score.
     * @returns The viewer's highest recorded score (0–100), or `0` when the
     *   viewer is anonymous or has no scored CV yet ("no CV" is treated the same
     *   as "worst possible CV" for gating purposes).
     */
    async getBestCvScore(
        {
            userId,
        }: GetBestCvScoreParams,
    ): Promise<number> {
        // anonymous viewer → always locked, skip the query entirely
        if (!userId) {
            return 0
        }

        // GREATEST of the two per-table maxima:
        //  - unified: MAX(cv_generations.score) for this user
        //  - legacy:  MAX(cv_submission_attempts.score) over the user's submissions
        // MAX() ignores null (unscored) rows on each side; COALESCE(-1) keeps an
        // empty side from dragging the other down; a row is always returned.
        const [
            row,
        ] = await this.entityManager.query<Array<MaxCvScoreRow>>(
            `
            SELECT GREATEST(
                COALESCE((
                    SELECT MAX(g.score) FROM cv_generations g
                    WHERE g.user_id = $1
                ), -1),
                COALESCE((
                    SELECT MAX(a.score) FROM cv_submission_attempts a
                    JOIN cv_submissions s ON s.id = a.cv_submission_id
                    WHERE s.user_id = $1
                ), -1)
            ) AS max
            `,
            [
                userId,
            ],
        )

        // Postgres MAX()/GREATEST over an int column comes back as a numeric
        // string; both sides empty → "-1" → clamp up to 0
        return Math.max(Number(row?.max) || 0,
            0)
    }

    /**
     * Mutates one consultant document in place: nulls out its contact fields
     * and sets `contactUnlocked` / `cvScoreUnlockThreshold` based on the
     * viewer's best CV score.
     *
     * @param consultant - Consultant document to gate (mutated in place).
     * @param bestCvScore - The requesting viewer's best-ever CV score (from
     *   {@link getBestCvScore}); pass `0` for anonymous viewers.
     * @returns The same `consultant` reference, for convenient chaining in
     *   `.map()` calls.
     */
    gateConsultant(
        consultant: ConsultantEntity,
        bestCvScore: number,
    ): ConsultantEntity {
        const unlocked = bestCvScore >= CV_SCORE_UNLOCK_THRESHOLD

        // always stamp the two new fields so the FE can render the gate
        // ("cần điểm CV ≥ X") regardless of unlock state
        consultant.contactUnlocked = unlocked
        consultant.cvScoreUnlockThreshold = CV_SCORE_UNLOCK_THRESHOLD

        // below threshold → strip every direct-contact field server-side so
        // it never reaches the wire, not just hidden client-side
        if (!unlocked) {
            consultant.email = null
            consultant.phoneNumber = null
            consultant.zaloNumber = null
            consultant.linkedinUrl = null
        }

        return consultant
    }

    /**
     * Gates every consultant in a list using the same viewer score, mirroring
     * {@link gateConsultant} for list query paths (`consultants`,
     * `headhuntingCompany.consultants`).
     *
     * @param consultants - Consultant documents to gate (mutated in place).
     * @param bestCvScore - The requesting viewer's best-ever CV score.
     * @returns The same array reference, for convenient chaining.
     */
    gateConsultants(
        consultants: Array<ConsultantEntity>,
        bestCvScore: number,
    ): Array<ConsultantEntity> {
        consultants.forEach((consultant) => this.gateConsultant(consultant,
            bestCvScore))
        return consultants
    }
}
