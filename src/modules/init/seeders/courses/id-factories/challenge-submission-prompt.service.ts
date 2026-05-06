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
    ChallengeSubmissionIdFactoryService,
} from "./challenge-submission.service"
import {
    v5 as uuidv5,
} from "uuid"

/**
 * Input for {@link ChallengeSubmissionPromptIdFactoryService.generate}.
 */
export interface GenerateChallengeSubmissionPromptIdParams {
    /** Locates the parent submission (same as {@link GenerateChallengeSubmissionIdParams}). */
    courseIndex: number
    moduleIndex: number
    contentIndex: number
    challengeIndex: number
    submissionIndex: number
    /** Zero-based prompt in the submission definition list. */
    promptIndex: number
}

/**
 * Grading prompt rows; parent id is {@link ChallengeSubmissionIdFactoryService}.
 */
@Injectable()
export class ChallengeSubmissionPromptIdFactoryService {
    constructor(
        private readonly sha256Service: Sha256Service,
        private readonly challengeSubmissionIdFactoryService: ChallengeSubmissionIdFactoryService,
    ) { }

    generate(
        {
            courseIndex,
            moduleIndex,
            contentIndex,
            challengeIndex,
            submissionIndex,
            promptIndex,
        }: GenerateChallengeSubmissionPromptIdParams,
    ): string {
        return uuidv5(
            this.sha256Service.hash(
                "challenge-submission-prompt",
                this.challengeSubmissionIdFactoryService.generate(
                    {
                        courseIndex,
                        moduleIndex,
                        contentIndex,
                        challengeIndex,
                        submissionIndex,
                    },
                ),
                promptIndex.toString(),
            ),
            envConfig().uuidNamespace.course,
        )
    }
}
