import {
    Module,
} from "@nestjs/common"
import {
    ChallengeSingleQueryModule,
} from "./challenge"
import {
    ChallengesSingleQueryModule,
} from "./challenges"
import {
    ConfigurableModuleClass,
} from "./challenges.module-definition"
import {
    ChallengeSubmissionProgressSingleQueryModule,
} from "./challenge-submission-progress"
import {
    LeaderboardSingleQueryModule,
} from "./leaderboard"

@Module({
    imports: [
        ChallengesSingleQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSingleQueryModule.register({
            isGlobal: true,
        }),
        ChallengeSubmissionProgressSingleQueryModule.register({
            isGlobal: true,
        }),
        LeaderboardSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class ChallengesModule extends ConfigurableModuleClass {}
