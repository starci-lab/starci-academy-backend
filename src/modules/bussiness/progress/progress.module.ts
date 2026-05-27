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

/**
 * Module for progress business logic.
 */
@Module({
    providers: [
        PersonalProjectProgressService,
        ChallengeProgressService,
        LeaderboardService,
    ],
    exports: [
        PersonalProjectProgressService,
        ChallengeProgressService,
        LeaderboardService,
    ],
})
export class ProgressModule extends ConfigurableModuleClass {
}
