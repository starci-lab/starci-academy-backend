import {
    Module,
} from "@nestjs/common"
import {
    SubmitChallengeSubmissionResolver,
} from "./submit-challenge-submission.resolver"
import {
    SubmitChallengeSubmissionService,
} from "./submit-challenge-submission.service"
import {
    SubmitChallengeSubmissionHandler,
} from "./submit-challenge-submission.handler"

@Module({
    providers: [
        SubmitChallengeSubmissionService,
        SubmitChallengeSubmissionResolver,
        SubmitChallengeSubmissionHandler,
    ],
})
export class SubmitChallengeSubmissionMutationModule {}
