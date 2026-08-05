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
/** Feature-module boundary for the `myChallengeSubmissions` query -- wires its resolver. */
export class MyChallengeSubmissionsSingleQueryModule extends ConfigurableModuleClass {}
