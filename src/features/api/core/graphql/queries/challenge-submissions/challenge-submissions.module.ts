import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    ChallengeSubmissionQueryModule,
} from "./challenge-submission"
import {
    UserChallengeSubmissionAttemptsModule,
} from "./user-challenge-submission-attempts"
import {
    UserChallengeSubmissionFeedbacksModule,
} from "./user-challenge-submission-feedbacks"
import {
    ChallengeSubmissionsSingleQueryModule 
} from "./challenge-submissions/challenge-submissions.module"

@Module({
    imports: [
        ChallengeSubmissionQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionsSingleQueryModule.register({
            isGlobal: true,
        }),
        UserChallengeSubmissionAttemptsModule.register({
            isGlobal: true,
        }),
        UserChallengeSubmissionFeedbacksModule.register({
            isGlobal: true,
        }),
    ],
})
export class ChallengeSubmissionsModule extends ConfigurableModuleClass {}
