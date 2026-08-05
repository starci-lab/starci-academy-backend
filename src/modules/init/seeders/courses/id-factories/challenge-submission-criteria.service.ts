import {
    Injectable,
} from "@nestjs/common"
import {
    Sha256Service,
} from "@modules/crypto/sha256.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    ChallengeSubmissionIdFactoryService,
} from "./challenge-submission.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateChallengeSubmissionCriteriaIdParams,
    GenerateChallengeSubmissionCriteriaLangIdParams,
} from "./types"

@Injectable()
/**
 * Deterministic ids for the SCHEMA V2 per-language grading-rubric buckets attached to a challenge
 * submission (`approach` + `outcome`). Parent id comes from
 * {@link ChallengeSubmissionIdFactoryService}; the `kind` discriminator keeps approach and outcome
 * ids distinct even when their langIndex matches.
 */
export class ChallengeSubmissionCriteriaIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
    ) { }

    /**
     * Generates the deterministic UUID for one (submission x kind x language) rubric bucket.
     *
     * @param params - Parent submission ordinals + rubric `kind` + programming-language bucket index.
     * @returns Stable UUID v5 derived from the parent submission id, the kind, and the language index.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            submissionIndex,
            kind,
            criterionIndex,
        }: GenerateChallengeSubmissionCriteriaIdParams,
    ): string {
        // chain off the parent submission id so a submission move re-derives its rubric ids
        return uuidv5(
            this.sha256Service.hash(
                // `kind` keeps approach vs outcome ids disjoint for the same criterion index
                `challenge-submission-${kind}-criteria`,
                this.challengeSubmissionIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        submissionIndex,
                    },
                ),
                criterionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }

    /**
     * Generates the deterministic UUID for one (criterion x programming-language) prose row.
     *
     * @param params - Criterion params + the programming-language variant index.
     * @returns Stable UUID v5 derived from the parent criterion id and the language index.
     */
    generateLang(
        params: GenerateChallengeSubmissionCriteriaLangIdParams,
    ): string {
        // chain off the parent criterion id so a criterion move re-derives its language rows
        return uuidv5(
            this.sha256Service.hash(
                `challenge-submission-${params.kind}-criteria-lang`,
                this.generate(params),
                params.langIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
