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
    GenerateChallengePrerequisiteIdParams,
} from "./types"

@Injectable()
export class ChallengePrerequisiteIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
    ) {}

    generate({
        courseIndex,
        moduleIndex,
        contentIndex,
        challengeIndex,
        prerequisiteIndex,
    }: GenerateChallengePrerequisiteIdParams): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-prerequisite",
                this.challengeIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                    },
                ),
                prerequisiteIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
