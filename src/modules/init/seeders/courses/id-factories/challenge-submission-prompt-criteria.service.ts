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
    ChallengeSubmissionPromptIdFactoryService,
} from "./challenge-submission-prompt.service"
import {
    v5 as uuidv5,
} from "uuid"

export interface GenerateChallengeSubmissionPromptCriteriaIdParams {
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    challengeIndex: number
    submissionIndex: number
    promptIndex: number
    criteriaIndex: number
}

@Injectable()
export class ChallengeSubmissionPromptCriteriaIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeSubmissionPromptIdFactoryService: ChallengeSubmissionPromptIdFactoryService,
    ) { }

    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            submissionIndex,
            promptIndex,
            criteriaIndex,
        }: GenerateChallengeSubmissionPromptCriteriaIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-submission-prompt-criteria",
                this.challengeSubmissionPromptIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        submissionIndex,
                        promptIndex,
                    },
                ),
                criteriaIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
