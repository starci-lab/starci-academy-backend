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
 * Input for {@link ChallengeStepIdFactoryService.generate}.
 */
export interface GenerateChallengeStepIdParams {
    /** Locates the parent challenge (same as {@link GenerateChallengeIdParams}). */
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    challengeIndex: number
    /** Zero-based step from the challenge markdown (`## N. Title` ordering). */
    stepIndex: number
}

/**
 * Graded steps inside a challenge; parent id is {@link ChallengeIdFactoryService}.
 */
@Injectable()
export class ChallengeStepIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
    ) {}

    /**
     * @param params - Challenge coordinates plus step index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            stepIndex,
        }: GenerateChallengeStepIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-step",
                this.challengeIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                    },
                ),
                stepIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
