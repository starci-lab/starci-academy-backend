import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding.module-definition"
import {
    CodingProblemsSingleQueryModule,
} from "./coding-problems"
import {
    CodingProblemSingleQueryModule,
} from "./coding-problem"
import {
    CodingProblemHintSingleQueryModule,
} from "./coding-problem-hint"
import {
    MyCodingSubmissionsSingleQueryModule,
} from "./my-coding-submissions"
import {
    CodingLeaderboardSingleQueryModule,
} from "./coding-leaderboard"
import {
    CodingProblemSuggestionsSingleQueryModule,
} from "./coding-problem-suggestions"
import {
    MyCodingProgressSingleQueryModule,
} from "./my-coding-progress"

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
