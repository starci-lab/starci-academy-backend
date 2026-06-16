import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-challenge-submissions.module-definition"
import {
    MyChallengeSubmissionsResolver,
} from "./my-challenge-submissions.resolver"

@Module({
    providers: [
        MyChallengeSubmissionsResolver,
    ],
})
export class MyChallengeSubmissionsSingleQueryModule extends ConfigurableModuleClass {}
