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
    GenerateChallengeRequirementIdParams,
} from "./types"

@Injectable()
/**
 * SCHEMA V2 requirement item and per-language row UUIDs chain from the parent challenge id.
 */
export class ChallengeRequirementIdFactoryService {
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
            requirementIndex,
        }: GenerateChallengeRequirementIdParams,
    ): string {
        const ordinals = {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
        }
        if (requirementIndex !== undefined) {
            return uuidv5(
                this.sha256Service.hash(
                    "challenge-requirement-lang",
                    this.generate({
                        ...ordinals,
                        orderIndex: requirementIndex,
                    }),
                    orderIndex.toString(),
                ),
                envConfig().uuidNamespace.course,
            )
        }
        return uuidv5(
            this.sha256Service.hash(
                "challenge-requirement",
                this.challengeIdFactoryService.generate(ordinals),
                orderIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
