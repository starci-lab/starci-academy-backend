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
export class ChallengeSubmissionProgressModule {}
