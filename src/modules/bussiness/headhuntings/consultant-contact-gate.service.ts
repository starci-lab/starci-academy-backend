import {
    Injectable,
} from "@nestjs/common"
import {
    ConsultantEntity,
} from "@modules/databases"
import {
    CV_SCORE_UNLOCK_THRESHOLD,
} from "./constants"
import type {
    GetBestCvScoreParams,
} from "./types"
import {
    CvVerificationService,
} from "./cv-verification.service"

@Injectable()
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
export class ConsultantContactGateService {
    constructor(
        private readonly cvVerificationService: CvVerificationService,
    ) {}

    /**
     * Computes the viewer's CV trust score — **deterministic, count-independent,
     * no AI/CV-prose involved** (2026-07-05: replaced the old AI-judged
     * `cv_generations.score` rubric entirely; see
     * {@link import("./cv-verification.service").CvVerificationService.scoreOf}).
     * A pure function of {@link import("./cv-verification.service").CvVerificationService.resolveLevel}
     * (passed capstone / graded challenge, existence-checked) — **source-blind
     * AND upload-vs-generate-irrelevant by construction**, since there is no
     * CV row read here at all. This gate stays OPEN for everyone ("Hướng A",
     * see `CV-VERIFIED-TRUST-TIER-WORKFLOW.md`): StarCi sells CREDIBILITY, not
     * ACCESS.
     *
     * CAUTION: placeholder step values pending calibration — see
     * {@link import("./cv-verification.service").CvVerificationService.scoreOf}.
     *
     * @param params - The viewer to score.
     * @returns 100 / 50 / 0 (see `scoreOf`), or `0` for an anonymous viewer.
     */
    async getBestCvScore(
        {
            userId,
        }: GetBestCvScoreParams,
    ): Promise<number> {
        // anonymous viewer → always locked, skip the lookup entirely
        if (!userId) {
            return 0
        }

        const level = await this.cvVerificationService.resolveLevel(userId)
        return this.cvVerificationService.scoreOf(level)
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
