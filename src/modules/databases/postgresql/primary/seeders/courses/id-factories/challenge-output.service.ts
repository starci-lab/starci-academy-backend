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

export interface GenerateChallengeOutputIdParams {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    challengeIndex: number
    outputIndex: number
}

@Injectable()
export class ChallengeOutputIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeIdFactoryService: ChallengeIdFactoryService,
    ) {}

    generate({
        courseIndex,
        moduleIndex,
        contentIndex,
        challengeIndex,
        outputIndex,
    }: GenerateChallengeOutputIdParams): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-output",
                this.challengeIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                    },
                ),
                outputIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}