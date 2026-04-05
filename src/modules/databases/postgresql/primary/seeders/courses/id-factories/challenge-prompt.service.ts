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
 * Input for {@link ChallengePromptIdFactoryService.generate}.
 */
export interface GenerateChallengePromptIdParams {
    /** Locates the parent challenge. */
    courseIndex: number
    moduleIndex: number
    challengeIndex: number
    /** Zero-based LLM / grader prompt attached to the challenge. */
    promptIndex: number
}

/**
 * Challenge prompt records; parent id is {@link ChallengeIdFactoryService}.
 */
@Injectable()
export class ChallengePromptIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
    ) {}

    /**
     * @param params - Challenge coordinates plus prompt index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
            promptIndex,
        }: GenerateChallengePromptIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-prompt",
                this.challengeIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        challengeIndex,
                    },
                ),
                promptIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
