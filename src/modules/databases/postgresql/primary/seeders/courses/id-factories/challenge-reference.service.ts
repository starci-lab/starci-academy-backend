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
 * Input for {@link ChallengeReferenceIdFactoryService.generate}.
 */
export interface GenerateChallengeReferenceIdParams {
    /** Locates the parent challenge. */
    courseIndex: number
    moduleIndex: number
    challengeIndex: number
    /** Zero-based reference in the challenge “References” block. */
    referenceIndex: number
}

/**
 * Reference links on a challenge; parent id is {@link ChallengeIdFactoryService}.
 */
@Injectable()
export class ChallengeReferenceIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
    ) {}

    /**
     * @param params - Challenge coordinates plus reference index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
            referenceIndex,
        }: GenerateChallengeReferenceIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-reference",
                this.challengeIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        challengeIndex,
                    },
                ),
                referenceIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
