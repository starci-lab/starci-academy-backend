import {
    Module,
} from "@nestjs/common"
import {
    SubmitChallengeSubmissionsResolver,
} from "./submit-challenge-submissions.resolver"
import {
    SubmitChallengeSubmissionsService,
} from "./submit-challenge-submissions.service"
import {
    SubmitChallengeSubmissionsHandler,
} from "./submit-challenge-submissions.handler"

@Module({
    providers: [
        SubmitChallengeSubmissionsService,
        SubmitChallengeSubmissionsResolver,
        SubmitChallengeSubmissionsHandler,
    ],
})
export class SubmitChallengeSubmissionsMutationModule {}
