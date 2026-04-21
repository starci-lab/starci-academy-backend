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
    ContentIdFactoryService,
} from "./content.service"
import {
    v5 as uuidv5,
} from "uuid"

/**
 * Input for {@link ChallengeIdFactoryService.generate}.
 */
export interface GenerateChallengeIdParams {
    /** Parent course ordinal. */
    courseIndex: number
    /** Parent module ordinal. */
    moduleIndex: number
    /** Parent content ordinal. */
    contentIndex: number
    /** Zero-based challenge folder under `modules/{m}/contents/{c}/challenges/{challengeIndex}`. */
    challengeIndex: number
}

/**
 * Challenge root entity; parent id is {@link ModuleIdFactoryService}.
 */
@Injectable()
export class ChallengeIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly contentIdFactoryService: ContentIdFactoryService,
    ) { }

    /**
     * @param params - Course / module / content ordinals and challenge index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
        }: GenerateChallengeIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge",
                this.contentIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                    },
                ),
                challengeIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
