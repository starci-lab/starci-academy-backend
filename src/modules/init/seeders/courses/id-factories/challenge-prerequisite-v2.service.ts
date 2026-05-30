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
    GenerateChallengePrerequisiteV2IdParams,
} from "./types"

/**
 * SCHEMA V2 prerequisite item and per-language row UUIDs chain from the parent challenge id.
 */
@Injectable()
export class ChallengePrerequisiteV2IdFactoryService {
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
            orderIndex = 0,
            prerequisiteIndex,
        }: GenerateChallengePrerequisiteV2IdParams,
    ): string {
        const ordinals = {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
        }
        if (prerequisiteIndex !== undefined) {
            return uuidv5(
                this.sha256Service.hash(
                    "challenge-prerequisite-v2-lang",
                    this.generate({
                        ...ordinals,
                        orderIndex: prerequisiteIndex,
                    }),
                    orderIndex.toString(),
                ),
                envConfig().uuidNamespace.course,
            )
        }
        return uuidv5(
            this.sha256Service.hash(
                "challenge-prerequisite-v2",
                this.challengeIdFactoryService.generate(ordinals),
                orderIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
