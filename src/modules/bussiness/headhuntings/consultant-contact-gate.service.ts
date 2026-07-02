import {
    Injectable,
} from "@nestjs/common"
import {
    ConsultantEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserCVSubmissionAttemptEntity,
    UserCVSubmissionEntity,
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
     * Computes the viewer's best-ever CV score across all of their CV
     * submission attempts that have finished scoring.
     *
     * @param params - The viewer to score.
     * @returns The viewer's highest recorded score (0–100), or `0` when the
     *   viewer is anonymous or has no scored CV attempt yet ("no CV" is
     *   treated the same as "worst possible CV" for gating purposes).
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

        // MAX(score) across every attempt of every CV submission owned by
        // this user; a null score means that attempt hasn't finished
        // analysis yet and is naturally excluded by MAX() ignoring nulls
        const row = await this.entityManager
            .createQueryBuilder(UserCVSubmissionAttemptEntity,
                "attempt")
            .innerJoin(
                UserCVSubmissionEntity,
                "submission",
                "submission.id = attempt.cv_submission_id",
            )
            .select("MAX(attempt.score)",
                "max")
            .where("submission.user_id = :userId",
                {
                    userId,
                })
            .getRawOne<MaxCvScoreRow>()

        // Postgres MAX() over an int column comes back as a numeric string;
        // no row / all-null scores → row.max is null → default to 0
        return Number(row?.max) || 0
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
