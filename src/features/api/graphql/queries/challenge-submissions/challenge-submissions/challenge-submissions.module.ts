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
import {
    ChallengeSubmissionsHandler,
} from "./challenge-submissions.handler"

@Module({
    providers: [
        ChallengeSubmissionsService,
        ChallengeSubmissionsResolver,
        ChallengeSubmissionsHandler,
    ],
})
export class ChallengeSubmissionsSingleQueryModule extends ConfigurableModuleClass {}
