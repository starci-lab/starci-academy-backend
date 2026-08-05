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
    GenerateChallengeOutputIdParams,
} from "./types"

@Injectable()
/**
 * SCHEMA V2 output item and per-language row UUIDs chain from the parent challenge id.
 */
export class ChallengeOutputIdFactoryService {
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
            outputIndex,
        }: GenerateChallengeOutputIdParams,
    ): string {
        const ordinals = {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
        }
        if (outputIndex !== undefined) {
            return uuidv5(
                this.sha256Service.hash(
                    "challenge-output-lang",
                    this.generate({
                        ...ordinals,
                        orderIndex: outputIndex,
                    }),
                    orderIndex.toString(),
                ),
                envConfig().uuidNamespace.course,
            )
        }
        return uuidv5(
            this.sha256Service.hash(
                "challenge-output",
                this.challengeIdFactoryService.generate(ordinals),
                orderIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
