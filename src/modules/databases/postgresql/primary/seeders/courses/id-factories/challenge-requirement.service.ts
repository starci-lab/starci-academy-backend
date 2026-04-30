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

export interface GenerateChallengeRequirementIdParams {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    challengeIndex: number
    requirementIndex: number
}

@Injectable()
export class ChallengeRequirementIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
    ) {}

    generate({
        courseIndex,
        moduleIndex,
        contentIndex,
        challengeIndex,
        requirementIndex,
    }: GenerateChallengeRequirementIdParams): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-requirement",
                this.challengeIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                    },
                ),
                requirementIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}