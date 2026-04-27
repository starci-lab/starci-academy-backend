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
    SubmissionAttemptsModule,
} from "./submission-attempts"
import {
    SubmissionFeedbacksModule,
} from "./submission-feedbacks"
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
        SubmissionAttemptsModule.register({
            isGlobal: true,
        }),
        SubmissionFeedbacksModule.register({
            isGlobal: true,
        }),
    ],
})
export class ChallengeSubmissionsModule extends ConfigurableModuleClass {}
