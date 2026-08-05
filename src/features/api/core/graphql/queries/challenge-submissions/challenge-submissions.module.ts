import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    ChallengeSubmissionSingleQueryModule,
} from "./challenge-submission"
import {
    UserChallengeSubmissionAttemptsSingleQueryModule,
} from "./user-challenge-submission-attempts"
import {
    UserChallengeSubmissionFeedbacksSingleQueryModule,
} from "./user-challenge-submission-feedbacks"
import {
    ChallengeSubmissionsSingleQueryModule 
} from "./challenge-submissions/challenge-submissions.module"

@Module({
    imports: [
        ChallengeSubmissionSingleQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionsSingleQueryModule.register({
            isGlobal: true,
        }),
        UserChallengeSubmissionAttemptsSingleQueryModule.register({
            isGlobal: true,
        }),
        UserChallengeSubmissionFeedbacksSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Challenge-submission query group: one slot, the full list per challenge,
 * the caller's attempts, and attempt feedbacks.
 */
export class ChallengeSubmissionsModule extends ConfigurableModuleClass {}
