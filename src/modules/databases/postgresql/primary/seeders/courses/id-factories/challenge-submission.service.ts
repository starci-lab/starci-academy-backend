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
    /** Locates the parent challenge (same as {@link GenerateChallengeIdParams}). */
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    challengeIndex: number
    /** Zero-based submission definition from the challenge markdown (`## Submissions` indexed list). */
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
            contentIndex,
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
                        contentIndex,
                        challengeIndex,
                    },
                ),
                submissionIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
