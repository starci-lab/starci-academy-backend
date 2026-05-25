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
    ChallengeStepIdFactoryService,
} from "./challenge-step.service"
import {
    v5 as uuidv5,
} from "uuid"

export interface GenerateChallengeStepCodeImplementationIdParams {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    challengeIndex: number
    stepIndex: number
    implementationIndex: number
}

@Injectable()
export class ChallengeStepCodeImplementationIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeStepIdFactoryService: ChallengeStepIdFactoryService,
    ) {}

    generate(
        params: GenerateChallengeStepCodeImplementationIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-step-code-implementation",
                this.challengeStepIdFactoryService.generate({
                    courseIndex: params.courseIndex,
                    moduleIndex: params.moduleIndex,
                    contentIndex: params.contentIndex,
                    challengeIndex: params.challengeIndex,
                    stepIndex: params.stepIndex,
                }),
                params.implementationIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
