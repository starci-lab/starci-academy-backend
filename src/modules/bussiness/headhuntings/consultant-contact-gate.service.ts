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
     * reading the UNIFIED `cv_generations` table as the sole source of truth.
     *
     * The legacy `cv_submission_attempts` union-read has been retired: the
     * WF-03c backfill migration copied every legacy scored attempt into
     * `cv_generations` (`source = 'uploaded'`), and a prod count check confirmed
     * the backfill is complete and score-for-score exact. See WF-10.
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

        // MAX(cv_generations.score) for this user; MAX() ignores null (unscored)
        // rows; COALESCE(-1) covers the "no scored CV at all" case, then the
        // outer result clamps up to 0.
        const [
            row,
        ] = await this.entityManager.query<Array<MaxCvScoreRow>>(
            `
            SELECT COALESCE((
                SELECT MAX(g.score) FROM cv_generations g
                WHERE g.user_id = $1
            ), -1) AS max
            `,
            [
                userId,
            ],
        )

        // Postgres MAX() over an int column comes back as a numeric string;
        // no scored CV at all → "-1" → clamp up to 0
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
