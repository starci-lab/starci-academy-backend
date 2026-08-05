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
import {
    ChallengeSuggestionsSingleQueryModule,
} from "./challenge-suggestions"
import {
    MyXpHistorySingleQueryModule,
} from "./my-xp-history"

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
        ChallengeSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyXpHistorySingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Challenge query group: catalog list + single fetch, submission progress,
 * course leaderboard, typeahead suggestions, and per-user XP history.
 */
export class ChallengesModule extends ConfigurableModuleClass {}
