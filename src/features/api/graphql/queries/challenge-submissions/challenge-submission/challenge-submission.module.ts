import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submission.module-definition"
import {
    ChallengeSubmissionResolver,
} from "./challenge-submission.resolver"
import {
    ChallengeSubmissionQueryService,
} from "./challenge-submission.service"

@Module({
    providers: [
        ChallengeSubmissionQueryService,
        ChallengeSubmissionResolver,
    ],
})
export class ChallengeSubmissionQueryModule extends ConfigurableModuleClass {}
