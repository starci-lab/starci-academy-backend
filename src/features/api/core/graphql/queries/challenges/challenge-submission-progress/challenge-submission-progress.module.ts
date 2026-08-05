import {
    ConfigurableModuleClass,
} from "./challenge-submission-progress.module-definition"
import {
    Module,
} from "@nestjs/common"
import {
    ChallengeSubmissionProgressResolver,
} from "./challenge-submission-progress.resolver"
import {
    ChallengeSubmissionProgressService,
} from "./challenge-submission-progress.service"
import {
    ChallengeSubmissionProgressHandler,
} from "./challenge-submission-progress.handler"
import {
    ChallengeSubmissionProgressListener,
} from "./challenge-submission-progress.listener"

@Module({
    providers: [
        ChallengeSubmissionProgressResolver,
        ChallengeSubmissionProgressService,
        ChallengeSubmissionProgressHandler,
        ChallengeSubmissionProgressListener,
    ],
})
/**
 * Wires resolver, service, handler, and CDC listener for
 * `challengeSubmissionProgress` (cached enrollment progress). Registered
 * globally from {@link ChallengesModule}.
 */
export class ChallengeSubmissionProgressSingleQueryModule extends ConfigurableModuleClass {}
