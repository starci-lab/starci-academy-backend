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
    ContentIdFactoryService,
} from "./content.service"
import {
    v5 as uuidv5,
} from "uuid"
import type {
    GenerateChallengeIdParams,
} from "./types"

@Injectable()
/**
 * Challenge root entity; parent id is {@link ModuleIdFactoryService}.
 */
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
