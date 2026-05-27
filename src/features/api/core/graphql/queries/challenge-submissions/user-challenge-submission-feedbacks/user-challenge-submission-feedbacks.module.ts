import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-challenge-submission-feedbacks.module-definition"
import {
    UserChallengeSubmissionFeedbacksResolver,
} from "./user-challenge-submission-feedbacks.resolver"
import {
    UserChallengeSubmissionFeedbacksService,
} from "./user-challenge-submission-feedbacks.service"
import {
    UserChallengeSubmissionFeedbacksHandler,
} from "./user-challenge-submission-feedbacks.handler"

@Module({
    providers: [
        UserChallengeSubmissionFeedbacksService,
        UserChallengeSubmissionFeedbacksResolver,
        UserChallengeSubmissionFeedbacksHandler,
    ],
})
export class UserChallengeSubmissionFeedbacksSingleQueryModule extends ConfigurableModuleClass {}
