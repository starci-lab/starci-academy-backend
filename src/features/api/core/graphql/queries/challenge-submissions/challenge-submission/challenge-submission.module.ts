import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submission.module-definition"
import {
    ChallengeSubmissionResolver,
} from "./challenge-submission.resolver"
import {
    ChallengeSubmissionQueryService,
} from "./challenge-submission.service"
import {
    ChallengeSubmissionHandler,
} from "./challenge-submission.handler"

@Module({
    providers: [
        ChallengeSubmissionQueryService,
        ChallengeSubmissionResolver,
        ChallengeSubmissionHandler,
    ],
})
/**
 * Wires resolver, service, and handler for the `challengeSubmission` leaf.
 * Registered globally from {@link ChallengeSubmissionsModule}.
 */
export class ChallengeSubmissionSingleQueryModule extends ConfigurableModuleClass {}
