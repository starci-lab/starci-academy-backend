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
/**
 * Wires resolver, service, and handler for the `challengeSubmissions` leaf.
 * Registered globally from {@link ChallengeSubmissionsModule}.
 */
export class ChallengeSubmissionsSingleQueryModule extends ConfigurableModuleClass {}
