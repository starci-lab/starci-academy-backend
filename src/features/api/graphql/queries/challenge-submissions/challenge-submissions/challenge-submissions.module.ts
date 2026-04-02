import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./challenge-submissions.module-definition"
import {
    ChallengeSubmissionsResolver,
} from "./challenge-submissions.resolver"
import {
    ChallengeSubmissionsService,
} from "./challenge-submissions.service"

@Module({
    providers: [
        ChallengeSubmissionsService,
        ChallengeSubmissionsResolver,
    ],
})
export class ChallengeSubmissionsSingleQueryModule extends ConfigurableModuleClass {}
