import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-solved-challenges-projection.module-definition"
import {
    UserSolvedChallengesProjectionService,
} from "./user-solved-challenges-projection.service"
import {
    UserSolvedChallengesProjectionListener,
} from "./user-solved-challenges-projection.listener"

@Module({
    providers: [
        UserSolvedChallengesProjectionService,
        UserSolvedChallengesProjectionListener,
    ],
    exports: [
        UserSolvedChallengesProjectionService,
    ],
})
/**
 * Leaf module for the per-user solved-challenges projection (recompute service +
 * CDC listener on `user_challenge_submission_attempts`). Exports the service so
 * the profile solved-challenges read (and any inline write path) can use it.
 */
export class UserSolvedChallengesProjectionModule extends ConfigurableModuleClass {
}
