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
    GenerateChallengeOutputV2IdParams,
} from "./types"

/**
 * SCHEMA V2 per-language output bucket UUIDs chain from the parent challenge id string.
 */
@Injectable()
export class ChallengeOutputV2IdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
    ) {}

    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            langIndex,
        }: GenerateChallengeOutputV2IdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-output-v2",
                this.challengeIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                    },
                ),
                langIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
