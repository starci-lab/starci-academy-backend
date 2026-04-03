import {
    Module,
} from "@nestjs/common"
import {
    SubmitChallengeSubmissionsResolver,
} from "./submit-challenge-submissions.resolver"
import {
    SubmitChallengeSubmissionsService,
} from "./submit-challenge-submissions.service"

@Module({
    providers: [
        SubmitChallengeSubmissionsService,
        SubmitChallengeSubmissionsResolver,
    ],
})
export class SubmitChallengeSubmissionsMutationModule {}
