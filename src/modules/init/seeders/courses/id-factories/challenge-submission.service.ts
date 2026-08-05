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
import type {
    GenerateChallengeSubmissionIdParams,
} from "./types"

@Injectable()
/**
 * Expected submission artifacts (GitHub URL, etc.); parent {@link ChallengeIdFactoryService}.
 */
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
