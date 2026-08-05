import {
    Module,
} from "@nestjs/common"
import {
    ChallengeSingleQueryModule,
} from "./challenge/challenge.module"
import {
    ChallengesSingleQueryModule,
} from "./challenges/challenges.module"
import {
    ConfigurableModuleClass,
} from "./challenges.module-definition"
import {
    ChallengeSubmissionProgressSingleQueryModule,
} from "./challenge-submission-progress/challenge-submission-progress.module"
import {
    LeaderboardSingleQueryModule,
} from "./leaderboard/leaderboard.module"
import {
    ChallengeSuggestionsSingleQueryModule,
} from "./challenge-suggestions/challenge-suggestions.module"
import {
    MyXpHistorySingleQueryModule,
} from "./my-xp-history/my-xp-history.module"

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
