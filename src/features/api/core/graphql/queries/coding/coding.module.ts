import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding.module-definition"
import {
    CodingProblemsSingleQueryModule,
} from "./coding-problems/coding-problems.module"
import {
    CodingProblemSingleQueryModule,
} from "./coding-problem/coding-problem.module"
import {
    CodingProblemHintSingleQueryModule,
} from "./coding-problem-hint/coding-problem-hint.module"
import {
    MyCodingSubmissionsSingleQueryModule,
} from "./my-coding-submissions/my-coding-submissions.module"
import {
    CodingLeaderboardSingleQueryModule,
} from "./coding-leaderboard/coding-leaderboard.module"
import {
    CodingProblemSuggestionsSingleQueryModule,
} from "./coding-problem-suggestions/coding-problem-suggestions.module"
import {
    MyCodingProgressSingleQueryModule,
} from "./my-coding-progress/my-coding-progress.module"

@Module({
    imports: [
        MyCodingProgressSingleQueryModule.register({
            isGlobal: true,
        }),
        CodingProblemsSingleQueryModule.register({
            isGlobal: true,
        }),
        CodingProblemSuggestionsSingleQueryModule.register({
            isGlobal: true,
        }),
        CodingProblemSingleQueryModule.register({
            isGlobal: true,
        }),
        CodingProblemHintSingleQueryModule.register({
            isGlobal: true,
        }),
        MyCodingSubmissionsSingleQueryModule.register({
            isGlobal: true,
        }),
        CodingLeaderboardSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Coding-practice query group: problem list/detail, per-user progress/status,
 * submission history, the solved-count leaderboard, and problem-title typeahead.
 */
export class CodingQueriesModule extends ConfigurableModuleClass {}
