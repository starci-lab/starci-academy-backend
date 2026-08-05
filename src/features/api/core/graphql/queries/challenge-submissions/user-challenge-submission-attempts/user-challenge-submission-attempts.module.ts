import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-challenge-submission-attempts.module-definition"
import {
    UserChallengeSubmissionAttemptsResolver,
} from "./user-challenge-submission-attempts.resolver"
import {
    UserChallengeSubmissionAttemptsService,
} from "./user-challenge-submission-attempts.service"
import {
    UserChallengeSubmissionAttemptsHandler,
} from "./user-challenge-submission-attempts.handler"

@Module({
    providers: [
        UserChallengeSubmissionAttemptsService,
        UserChallengeSubmissionAttemptsResolver,
        UserChallengeSubmissionAttemptsHandler,
    ],
})
/**
 * Wires resolver, service, and handler for `userChallengeSubmissionAttempts`.
 * Registered globally from {@link ChallengeSubmissionsModule}.
 */
export class UserChallengeSubmissionAttemptsSingleQueryModule extends ConfigurableModuleClass {}
