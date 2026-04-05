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
    ModuleIdFactoryService,
} from "./module.service"
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
    /** Zero-based challenge folder under `modules/{m}/challenges/{challengeIndex}`. */
    challengeIndex: number
}

/**
 * Challenge root entity; parent id is {@link ModuleIdFactoryService}.
 */
@Injectable()
export class ChallengeIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly moduleIdFactoryService: ModuleIdFactoryService,
    ) {}

    /**
     * @param params - Course / module ordinals and challenge index.
     * @returns UUID v5 string.
     */
    generate(
        {
            courseIndex,
            moduleIndex,
            challengeIndex,
        }: GenerateChallengeIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge",
                this.moduleIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                    },
                ),
                challengeIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
