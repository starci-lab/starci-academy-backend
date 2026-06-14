import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./progress.module-definition"
import {
    PersonalProjectProgressService,
} from "./personal-project.service"
import {
    ChallengeProgressService,
} from "./challenge.service"
import {
    LeaderboardService,
} from "./leaderboard.service"
import {
    ProgressProjectionService,
} from "./progress-projection.service"
import {
    ProgressProjectionListener,
} from "./progress-projection.listener"

/**
 * Module for progress business logic.
 */
@Module({
    providers: [
        PersonalProjectProgressService,
        ChallengeProgressService,
        LeaderboardService,
        ProgressProjectionService,
        ProgressProjectionListener,
    ],
    exports: [
        PersonalProjectProgressService,
        ChallengeProgressService,
        LeaderboardService,
        ProgressProjectionService,
    ],
})
export class ProgressModule extends ConfigurableModuleClass {
}
