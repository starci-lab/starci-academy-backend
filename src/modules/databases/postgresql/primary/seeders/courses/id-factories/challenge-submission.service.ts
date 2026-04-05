import {
    Injectable,
} from "@nestjs/common"
import {
    Sha256Service,
} from "@modules/crypto"
import {
    envConfig,
} from "@modules/env"
import {
    ChallengeIdFactoryService,
} from "./challenge.service"
import {
    v5 as uuidv5,
} from "uuid"

/**
 * Input for {@link ChallengeSubmissionIdFactoryService.generate}.
 */
export interface GenerateChallengeSubmissionIdParams {
    /** Locates the parent challenge. */
    courseIndex: number
    moduleIndex: number
    challengeIndex: number
    /** Zero-based submission type block in the challenge markdown. */
    submissionIndex: number
}

/**
 * Expected submission artifacts (GitHub URL, etc.); parent {@link ChallengeIdFactoryService}.
 */
@Injectable()
export class ChallengeSubmissionIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
    ) {}

    /**
     * @param params - Challenge coordinates plus submission slot index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
            submissionIndex,
        }: GenerateChallengeSubmissionIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-submission",
                this.challengeIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        challengeIndex,
                    },
                ),
                submissionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
